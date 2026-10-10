import os
import json
from broker import broker

print("\n=== PHASE 12: INDEPENDENT NEGATIVE QUERY ===")
res_mamah = broker.search_mem0("assistant_mamah", "RAHASIA_CORE")
print("assistant_mamah searching for core secret:")
print(json.dumps(res_mamah, indent=2))

res_core = broker.search_mem0("lyra_core", "STOK_MAMAH")
print("\nlyra_core searching for mamah secret:")
print(json.dumps(res_core, indent=2))

try:
    broker.search_mem0("unknown_env", "RAHASIA_CORE")
except Exception as e:
    print("\nUnknown env handled safely:", type(e).__name__, str(e))
