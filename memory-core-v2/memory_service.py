
import os
import json
import uuid
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

os.environ["HF_HUB_OFFLINE"] = "1"
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, PointStruct, VectorParams, Distance, PointIdsList

print("Loading SentenceTransformer...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Loading QdrantClient...")
qc = QdrantClient(path="/opt/hermes-stack/memory-core-v2/qdrant_db")
for c in ["lyra_core_memory_v2", "assistant_mamah_memory_v2"]:
    try:
        qc.get_collection(c)
    except Exception:
        qc.create_collection(collection_name=c, vectors_config=VectorParams(size=384, distance=Distance.COSINE))
print("Ready.")

ENV_CONFIGS = {
    "lyra_core": {
        "collection": "lyra_core_memory_v2",
        "user_id": "lyra_core_system",
        "obsidian_root": os.getenv("OBSIDIAN_ROOT_CORE", "./obsidian_core")
    },
    "assistant_mamah": {
        "collection": "assistant_mamah_memory_v2",
        "user_id": "assistant_mamah_system",
        "obsidian_root": os.getenv("OBSIDIAN_ROOT_MAMAH", "./obsidian_mamah")
    }
}

# Add a simple lock for concurrent access
db_lock = threading.Lock()

def do_retrieve(env, query):
    if env not in ENV_CONFIGS: return {"error": "Invalid env"}
    conf = ENV_CONFIGS[env]
    vector = model.encode(query).tolist()
    
    with db_lock:
        res = qc.query_points(
            collection_name=conf["collection"],
            query=vector,
            limit=15,  # fetch more because we will filter locally
            query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=conf["user_id"]))])
        )
    
    mem0_results = []
    for hit in res.points:
        if hit.payload.get("active", True) is False:
            continue
        mem0_results.append({
            "candidate": hit.payload.get("data", ""), 
            "score": hit.score, 
            "id": hit.id,
            "subject": hit.payload.get("subject", "unknown"),
            "predicate": hit.payload.get("predicate", "unknown"),
            "value": hit.payload.get("value", "unknown"),
            "metadata": hit.payload.get("metadata", {})
        })
        if len(mem0_results) >= 5:
            break
        
    # Obsidian search
    obsidian_results = []
    root = Path(conf["obsidian_root"])
    if root.exists():
        query_words = set(query.lower().split())
        for filepath in root.rglob("*.md"):
            try:
                content = filepath.read_text(errors="ignore")
                content_words = set(content.lower().split())
                if len(query_words.intersection(content_words)) >= 2:
                    obsidian_results.append({
                        "source": "obsidian",
                        "path": str(filepath.relative_to(root)),
                        "content": content[:1000]
                    })
            except Exception:
                pass
                
    return {"mem0": mem0_results, "obsidian": obsidian_results}

def normalize_text(text):
    import re
    text = text.lower()
    text = re.sub(r'\W+', ' ', text)
    return text.strip()

def do_add(env, fact, subject="unknown", predicate="unknown", value="unknown", metadata=None):
    if metadata is None: metadata = {}
    if env not in ENV_CONFIGS: return {"error": "Invalid env"}
    conf = ENV_CONFIGS[env]
    collection_name = conf["collection"]
    user_id = conf["user_id"]
    
    subject = subject.strip().lower()
    predicate = predicate.strip().lower()
    
    new_norm = normalize_text(fact)
    vector = model.encode(fact).tolist()
    
    with db_lock:
        existing = qc.query_points(
            collection_name=collection_name,
            query=vector,
            limit=20,
            query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))])
        )
        
        # 1. Exact Duplicate (Text-based)
        for hit in existing.points:
            old_norm = normalize_text(hit.payload.get("data", ""))
            if old_norm == new_norm and hit.payload.get("active", True) is not False:
                return {"status": "skipped", "reason": "exact_duplicate", "id": hit.id}
        
        # 2. Entity-Aware Supersede Check
        if subject != "unknown" and predicate != "unknown":
            # Find identical subject + predicate among ACTIVE memories
            for hit in existing.points:
                if hit.payload.get("active", True) is False:
                    continue
                old_subj = hit.payload.get("subject", "unknown")
                old_pred = hit.payload.get("predicate", "unknown")
                if old_subj == subject and old_pred == predicate:
                    # Semantic True Update!
                    # Mark old as inactive
                    old_payload = hit.payload.copy()
                    old_payload["active"] = False
                    
                    new_id = str(uuid.uuid4())
                    old_payload["superseded_by"] = new_id
                    old_payload["superseded_at"] = time.time()
                    
                    # Update old point
                    qc.set_payload(
                        collection_name=collection_name,
                        payload=old_payload,
                        points=[hit.id]
                    )
                    
                    # Insert new point
                    new_payload = {
                        "data": fact, "user_id": user_id, 
                        "subject": subject, "predicate": predicate, "value": value,
                        "metadata": metadata,
                        "active": True
                    }
                    qc.upsert(
                        collection_name=collection_name,
                        points=[PointStruct(id=new_id, vector=vector, payload=new_payload)]
                    )
                    return {"status": "updated", "reason": "entity_supersede", "id": new_id, "superseded_old": hit.id}
        
        # 3. Fallback semantic check is removed!
        # According to Phase 4B rules: if we are uncertain or entities differ, we NEVER supersede.
        # We just insert as new.
        
        # 4. Insert New Fact
        new_id = str(uuid.uuid4())
        payload = {
            "data": fact, "user_id": user_id, 
            "subject": subject, "predicate": predicate, "value": value,
            "metadata": metadata,
            "active": True
        }
        qc.upsert(
            collection_name=collection_name,
            points=[PointStruct(id=new_id, vector=vector, payload=payload)]
        )
        return {"status": "inserted", "id": new_id}

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok", 
                "service": "memory-core-v2", 
                "qdrant_status": "ready"
            }).encode('utf-8'))
            return
        if self.path == '/status':
            status = {"memory_core": "active", "mem0": "unknown", "environments": {}}
            # Check Qdrant
            try:
                for env_key, conf in ENV_CONFIGS.items():
                    col_info = qc.get_collection(conf["collection"])
                    obs_root = Path(conf["obsidian_root"])
                    obs_files = list(obs_root.rglob("*.md")) if obs_root.exists() else []
                    status["environments"][env_key] = {
                        "collection": conf["collection"],
                        "obsidian_root": conf["obsidian_root"],
                        "obsidian_path_exists": obs_root.exists(),
                        "obsidian_note_count": len(obs_files),
                        "obsidian": "active" if obs_files else ("path_exists_no_notes" if obs_root.exists() else "path_missing"),
                        "mem0_points": col_info.points_count
                    }
                status["mem0"] = "active"
            except Exception as e:
                status["mem0"] = f"error: {str(e)}"
            status["neon_memory_backend"] = False
            status["architecture_file"] = "/opt/hermes-stack/memory-core-v2/ARCHITECTURE_STATE.md"
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(status, indent=2).encode('utf-8'))
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body)
        
        action = data.get("action")
        env = data.get("environment")
        
        result = {}
        if action == "retrieve":
            result = do_retrieve(env, data.get("query"))
        elif action == "add":
            result = do_add(env, data.get("fact"), data.get("subject", "unknown"), data.get("predicate", "unknown"), data.get("value", "unknown"), data.get("metadata", {}))
        elif action == "delete":
            fact_id = data.get("id")
            if not fact_id:
                self.send_response(400)
                self.end_headers()
                return
            with db_lock:
                qc.delete(
                    collection_name=ENV_CONFIGS.get(env, ENV_CONFIGS["lyra_core"])["collection"],
                    points_selector=PointIdsList(points=[fact_id])
                )
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "deleted"}).encode('utf-8'))
            return
            
        else:
            result = {"error": "Invalid action"}
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode('utf-8'))

if __name__ == "__main__":
    server = HTTPServer(('127.0.0.1', 20129), RequestHandler)
    print("Memory Core V2 Service running on http://127.0.0.1:20129")
    server.serve_forever()
