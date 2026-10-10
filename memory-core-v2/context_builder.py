
import sys
import json
import urllib.request

def build_context():
    if len(sys.argv) < 3: return
    env = sys.argv[1]
    query = sys.argv[2]
    
    req = urllib.request.Request(
        "http://127.0.0.1:20129", 
        data=json.dumps({"action": "retrieve", "environment": env, "query": query}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            res = json.loads(response.read().decode('utf-8'))
            
        mem0 = res.get("mem0", [])
        obsidian = res.get("obsidian", [])
        
        # Phase 6 Calibration: New Threshold
        # We will use 0.40 since 0.60 causes false negatives on Indonesian text
        MIN_SCORE = 0.40
        accepted_mem0 = []
        for hit in mem0:
            if hit["score"] >= MIN_SCORE:
                accepted_mem0.append(hit["candidate"])
                
        accepted_obsidian = [hit["content"] for hit in obsidian]
        
        # Output as JSON for plugin consumption
        output = {
            "mem0": accepted_mem0,
            "obsidian": accepted_obsidian
        }
        print(json.dumps(output))
    except Exception as e:
        # Graceful degradation — output empty JSON
        print(json.dumps({"mem0": [], "obsidian": []}))

if __name__ == "__main__":
    if sys.argv[1] == "retrieve":
        sys.argv.pop(1)
    build_context()
