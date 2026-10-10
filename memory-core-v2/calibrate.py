from broker import broker
import json

# Add some test memories
test_id_1 = broker.add_mem0("lyra_core", "Kode akses satelit adalah ORION-6427.")[0]["id"]
test_id_2 = broker.add_mem0("lyra_core", "Nama internal mesin percobaan kita adalah KESTREL-29.")[0]["id"]

queries = [
    # Positive
    "Apa kode akses satelit?",
    "Kode satelit",
    "Satelit ORION",
    "Berapa mesin percobaan?",
    "Nama internal mesin",
    
    # Negative
    "Cara membuat kue tart",
    "Berapa harga telur ayam?",
    "Suhu cuaca hari ini",
    "Jadwal pertandingan sepak bola"
]

print("=== CALIBRATION RESULTS ===")
for q in queries:
    res = broker.search_mem0("lyra_core", q)
    scores = [r.get('score', 0) for r in res] if res else []
    print(f"Query: '{q}' -> Scores: {scores}")

# Cleanup
broker.delete_mem0("lyra_core", test_id_1)
broker.delete_mem0("lyra_core", test_id_2)
