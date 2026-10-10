import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

# Setup dummy api key to satisfy Mem0's OpenAI client requirement without crashing
os.environ["OPENAI_API_KEY"] = "sk-dummy"

from qdrant_client import QdrantClient
from mem0 import Memory

logger = logging.getLogger(__name__)

# Double Isolation Config
# ONE Shared Client
QDRANT_PATH = "/opt/hermes-stack/memory-core-v2/qdrant_db"
os.makedirs(QDRANT_PATH, exist_ok=True)
_shared_client = QdrantClient(path=QDRANT_PATH)

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

class MemoryBrokerV2:
    def __init__(self):
        self.mem0_instances = {}
        for env, conf in ENV_CONFIGS.items():
            config = {
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "client": _shared_client,
                        "collection_name": conf["collection"],
                        "embedding_model_dims": 384
                    }
                },
                "embedder": {
                    "provider": "huggingface",
                    "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
                }
            }
            self.mem0_instances[env] = Memory.from_config(config)
    
    def _validate_env(self, environment: str):
        if not isinstance(environment, str):
            raise PermissionError("Environment must be a string")
        if environment not in ENV_CONFIGS:
            raise PermissionError(f"Access Denied: Unknown environment '{environment}'")
        return ENV_CONFIGS[environment]

    def _resolve_obsidian_path(self, environment: str, subpath: str) -> Path:
        conf = self._validate_env(environment)
        root = Path(conf["obsidian_root"]).resolve()
        target = (root / subpath).resolve()
        if not target.is_relative_to(root):
            raise PermissionError(f"Path traversal denied: {target} escapes root {root}")
        if target.suffix != ".md":
            raise PermissionError("Only .md files are allowed")
        return target

    def search_obsidian(self, environment: str, query: str) -> List[Dict]:
        conf = self._validate_env(environment)
        root = Path(conf["obsidian_root"])
        results = []
        if not root.exists():
            return results
            
        for filepath in root.rglob("*.md"):
            try:
                content = filepath.read_text(errors="ignore")
                
                query_words = set(query.lower().split())
                content_words = set(content.lower().split())
                if len(query_words.intersection(content_words)) >= 2:

                    results.append({
                        "source": "obsidian",
                        "path": str(filepath.relative_to(root)),
                        "content": content[:1000] # Oversized memory protection
                    })
            except Exception:
                pass
        return results

    def add_mem0(self, environment: str, content: str, infer=False):
        conf = self._validate_env(environment)
        mem = self.mem0_instances[environment]
        metadata = {
            "environment": environment,
            "source": "broker_v2",
            "type": "test_canary"
        }
        res = mem.add(content, user_id=conf["user_id"], metadata=metadata, infer=infer)
        return res.get('results', []) if isinstance(res, dict) else res

    def search_mem0(self, environment: str, query: str) -> List[Dict]:
        conf = self._validate_env(environment)
        mem = self.mem0_instances[environment]
        # Logical isolation: strictly filter by user_id
        res = mem.search(query, filters={"user_id": conf["user_id"]}, limit=5)
        # Protect against oversized memories
        for r in res.get("results", []):
            if isinstance(r.get("memory"), str) and len(r["memory"]) > 1000:
                r["memory"] = r["memory"][:1000] + "...[TRUNCATED]"
        return res.get('results', []) if isinstance(res, dict) else res

    def delete_mem0(self, environment: str, memory_id: str):
        conf = self._validate_env(environment)
        mem = self.mem0_instances[environment]
        mem.delete(memory_id)

    def retrieve_context(self, environment: str, query: str) -> str:
        # Merges and formats context safely
        obs_res = self.search_obsidian(environment, query)
        mem_res = self.search_mem0(environment, query)
        
        context_parts = []
        if obs_res:
            context_parts.append("<retrieved_obsidian_knowledge>")
            for r in obs_res:
                context_parts.append(f"File: {r['path']}\n{r['content']}")
            context_parts.append("</retrieved_obsidian_knowledge>")
            
        if mem_res:
            context_parts.append("<retrieved_memory>")
            for r in mem_res:
                context_parts.append(r.get("memory", ""))
            context_parts.append("</retrieved_memory>")
            
        return "\n".join(context_parts)


    def add_memory_fast(self, environment: str, text: str):
        from sentence_transformers import SentenceTransformer
        import uuid
        from qdrant_client.models import PointStruct
        
        conf = self._validate_env(environment)
        collection_name = conf["collection"]
        
        model = SentenceTransformer("all-MiniLM-L6-v2")
        vector = model.encode(text).tolist()
        point_id = str(uuid.uuid4())
        
        payload = {
            "data": text,
            "user_id": environment + "_system"
        }
        
        _shared_client.upsert(
            collection_name=collection_name,
            points=[PointStruct(id=point_id, vector=vector, payload=payload)]
        )

broker = MemoryBrokerV2()
