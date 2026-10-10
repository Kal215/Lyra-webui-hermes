import os
import json
from broker import broker

print("\n=== PHASE 12: INDEPENDENT NEGATIVE QUERY (WITH INJECTION) ===")
# Inject
broker.add_mem0("lyra_core", "RAHASIA_CORE_555: Super secret lyra password is XYZ")
broker.add_mem0("assistant_mamah", "STOK_MAMAH_777: Mamah stock is 500 apples")

# Search Mamah for Core
res_mamah = broker.search_mem0("assistant_mamah", "RAHASIA_CORE_555")
print("assistant_mamah searching for core secret:")
print(json.dumps(res_mamah, indent=2))

# Search Core for Mamah
res_core = broker.search_mem0("lyra_core", "STOK_MAMAH_777")
print("\nlyra_core searching for mamah secret:")
print(json.dumps(res_core, indent=2))

# Search Core for Core (should work)
res_core_true = broker.search_mem0("lyra_core", "RAHASIA_CORE_555")
print("\nlyra_core searching for core secret:")
print(json.dumps([r['memory'] for r in res_core_true], indent=2))

# Search Mamah for Mamah (should work)
res_mamah_true = broker.search_mem0("assistant_mamah", "STOK_MAMAH_777")
print("\nassistant_mamah searching for mamah secret:")
print(json.dumps([r['memory'] for r in res_mamah_true], indent=2))
