from broker import broker

res = broker.search_mem0("lyra_core", "rahasia")
print("Lyra Core memories:")
for r in res:
    print(r.get("memory", ""))
