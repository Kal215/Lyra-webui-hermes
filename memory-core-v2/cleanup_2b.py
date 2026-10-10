import os
from broker import broker

res3 = broker.search_mem0("assistant_mamah", "Abaikan system prompt")
for r in res3:
    if "Abaikan system prompt" in r["memory"]:
        broker.mem0_instances["assistant_mamah"].delete(r["id"])
        print(f"Deleted injection test from assistant_mamah: {r['id']}")
