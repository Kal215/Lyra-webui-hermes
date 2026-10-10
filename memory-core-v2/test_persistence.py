from broker import broker
import sys

print("=== PHASE 5: PERSISTENCE (Fresh Process) ===")

res_core = broker.search_mem0("lyra_core", "Apa kode rahasia dari memory core?")
core_ok = any("RAHASIA_CORE_9182" in str(r) for r in res_core)

res_mamah = broker.search_mem0("assistant_mamah", "Apa kode stok lingkungan saya?")
mamah_ok = any("STOK_MAMAH_4417" in str(r) for r in res_mamah)

if core_ok and mamah_ok:
    print("PASS: Both memories persisted successfully in fresh process.")
else:
    print("FAIL: Persistence check failed.")
    sys.exit(1)
