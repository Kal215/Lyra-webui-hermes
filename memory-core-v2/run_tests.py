import sys
from broker import broker

def assert_contains(res, term):
    found = any(term in str(r) for r in res)
    if not found:
        print(f"FAIL: Expected to find {term}")
    else:
        print(f"PASS: Found {term}")
    return found

def assert_not_contains(res, term):
    found = any(term in str(r) for r in res)
    if found:
        print(f"FAIL: Must NOT contain {term}")
    else:
        print(f"PASS: Properly hidden {term}")
    return not found

print("=== PHASE 4: MEM0 ISOLATION ===")
broker.add_mem0("lyra_core", "ID: LYRA_CORE_ISOLATION_CANARY_20261001, Value: RAHASIA_CORE_9182")
broker.add_mem0("worker_agent", "ID: WORKER_ISOLATION_CANARY_20261001, Value: STOK_WORKER_4417")

print("\nA. Search sebagai lyra_core:")
res = broker.search_mem0("lyra_core", "Apa kode rahasia dari memory core?")
assert_contains(res, "RAHASIA_CORE_9182")

print("\nB. Search sebagai lyra_core (cross env):")
res = broker.search_mem0("lyra_core", "Apa kode stok dari lingkungan Worker?")
assert_not_contains(res, "STOK_WORKER_4417")

print("\nC. Search sebagai worker_agent:")
res = broker.search_mem0("worker_agent", "Apa kode stok lingkungan saya?")
assert_contains(res, "STOK_WORKER_4417")

print("\nD. Search sebagai worker_agent (cross env):")
res = broker.search_mem0("worker_agent", "Apa kode rahasia Lyra Core?")
assert_not_contains(res, "RAHASIA_CORE_9182")

print("\n=== PHASE 7: OBSIDIAN ISOLATION ===")
print("A. lyra_core search bintang")
res = broker.search_obsidian("lyra_core", "kode verifikasi bintang")
assert_contains(res, "BINTANG_CORE_5628")

print("\nB. lyra_core search bunga Worker")
res = broker.search_obsidian("lyra_core", "kode verifikasi bunga Worker")
assert_not_contains(res, "BUNGA_WORKER_7341")

print("\nC. worker_agent search bunga")
res = broker.search_obsidian("worker_agent", "kode verifikasi bunga")
assert_contains(res, "BUNGA_WORKER_7341")

print("\nD. worker_agent search bintang")
res = broker.search_obsidian("worker_agent", "kode verifikasi bintang Core")
assert_not_contains(res, "BINTANG_CORE_5628")

print("\n=== PHASE 10: NEGATIVE SECURITY TEST ===")
try:
    broker.search_mem0("unknown_env", "test")
    print("FAIL: unknown_env allowed")
except PermissionError:
    print("PASS: unknown_env denied")

try:
    broker.safe_read_obsidian("worker_agent", "../../Core/OBSIDIAN_CORE_CANARY_20261001.md")
    print("FAIL: path traversal allowed")
except PermissionError:
    print("PASS: path traversal denied")

try:
    broker.safe_read_obsidian("worker_agent", "/opt/lyra/obsidian-vault/Core/OBSIDIAN_CORE_CANARY_20261001.md")
    print("FAIL: absolute cross path allowed")
except PermissionError:
    print("PASS: absolute cross path denied")

