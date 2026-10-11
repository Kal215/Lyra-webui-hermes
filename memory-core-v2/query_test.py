import os
import json
from broker import broker

print("\n=== PHASE 12: INDEPENDENT NEGATIVE QUERY ===")
res_worker = broker.search_mem0("worker_agent", "RAHASIA_CORE")
print("worker_agent searching for core secret:")
print(json.dumps(res_worker, indent=2))

res_core = broker.search_mem0("lyra_core", "STOK_WORKER")
print("\nlyra_core searching for worker secret:")
print(json.dumps(res_core, indent=2))

try:
    broker.search_mem0("unknown_env", "RAHASIA_CORE")
except Exception as e:
    print("\nUnknown env handled safely:", type(e).__name__, str(e))
