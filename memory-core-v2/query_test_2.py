import os
import json
from broker import broker

print("\n=== PHASE 12: INDEPENDENT NEGATIVE QUERY (WITH INJECTION) ===")
# Inject
broker.add_mem0("lyra_core", "RAHASIA_CORE_555: Super secret lyra password is XYZ")
broker.add_mem0("worker_agent", "STOK_WORKER_777: Worker stock is 500 apples")

# Search Worker for Core
res_worker = broker.search_mem0("worker_agent", "RAHASIA_CORE_555")
print("worker_agent searching for core secret:")
print(json.dumps(res_worker, indent=2))

# Search Core for Worker
res_core = broker.search_mem0("lyra_core", "STOK_WORKER_777")
print("\nlyra_core searching for worker secret:")
print(json.dumps(res_core, indent=2))

# Search Core for Core (should work)
res_core_true = broker.search_mem0("lyra_core", "RAHASIA_CORE_555")
print("\nlyra_core searching for core secret:")
print(json.dumps([r['memory'] for r in res_core_true], indent=2))

# Search Worker for Worker (should work)
res_worker_true = broker.search_mem0("worker_agent", "STOK_WORKER_777")
print("\nworker_agent searching for worker secret:")
print(json.dumps([r['memory'] for r in res_worker_true], indent=2))
