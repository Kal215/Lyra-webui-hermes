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
broker.add_mem0("assistant_mamah", "ID: MAMAH_ISOLATION_CANARY_20261001, Value: STOK_MAMAH_4417")

print("\nA. Search sebagai lyra_core:")
res = broker.search_mem0("lyra_core", "Apa kode rahasia dari memory core?")
assert_contains(res, "RAHASIA_CORE_9182")

print("\nB. Search sebagai lyra_core (cross env):")
res = broker.search_mem0("lyra_core", "Apa kode stok dari lingkungan Mamah?")
assert_not_contains(res, "STOK_MAMAH_4417")

print("\nC. Search sebagai assistant_mamah:")
res = broker.search_mem0("assistant_mamah", "Apa kode stok lingkungan saya?")
assert_contains(res, "STOK_MAMAH_4417")

print("\nD. Search sebagai assistant_mamah (cross env):")
res = broker.search_mem0("assistant_mamah", "Apa kode rahasia Lyra Core?")
assert_not_contains(res, "RAHASIA_CORE_9182")

print("\n=== PHASE 7: OBSIDIAN ISOLATION ===")
print("A. lyra_core search bintang")
res = broker.search_obsidian("lyra_core", "kode verifikasi bintang")
assert_contains(res, "BINTANG_CORE_5628")

print("\nB. lyra_core search bunga Mamah")
res = broker.search_obsidian("lyra_core", "kode verifikasi bunga Mamah")
assert_not_contains(res, "BUNGA_MAMAH_7341")

print("\nC. assistant_mamah search bunga")
res = broker.search_obsidian("assistant_mamah", "kode verifikasi bunga")
assert_contains(res, "BUNGA_MAMAH_7341")

print("\nD. assistant_mamah search bintang")
res = broker.search_obsidian("assistant_mamah", "kode verifikasi bintang Core")
assert_not_contains(res, "BINTANG_CORE_5628")

print("\n=== PHASE 10: NEGATIVE SECURITY TEST ===")
try:
    broker.search_mem0("unknown_env", "test")
    print("FAIL: unknown_env allowed")
except PermissionError:
    print("PASS: unknown_env denied")

try:
    broker.safe_read_obsidian("assistant_mamah", "../../Core/OBSIDIAN_CORE_CANARY_20261001.md")
    print("FAIL: path traversal allowed")
except PermissionError:
    print("PASS: path traversal denied")

try:
    broker.safe_read_obsidian("assistant_mamah", "/opt/lyra/obsidian-vault/Core/OBSIDIAN_CORE_CANARY_20261001.md")
    print("FAIL: absolute cross path allowed")
except PermissionError:
    print("PASS: absolute cross path denied")

