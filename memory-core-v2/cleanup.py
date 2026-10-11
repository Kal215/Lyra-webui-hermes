from broker import broker

print("=== PHASE 12: CLEANUP ===")

for env, term in [("lyra_core", "RAHASIA_CORE_9182"), ("worker_agent", "STOK_WORKER_4417")]:
    res = broker.search_mem0(env, term)
    deleted = 0
    for r in res:
        if term in str(r):
            broker.delete_mem0(env, r['id'])
            deleted += 1
    print(f"Deleted {deleted} items for {env}")

