import os
from broker import broker

res3 = broker.search_mem0("worker_agent", "Abaikan system prompt")
for r in res3:
    if "Abaikan system prompt" in r["memory"]:
        broker.mem0_instances["worker_agent"].delete(r["id"])
        print(f"Deleted injection test from worker_agent: {r['id']}")
