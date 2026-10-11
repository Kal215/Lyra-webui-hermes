from broker import broker
import sys

print("=== PHASE 5: PERSISTENCE (Fresh Process) ===")

res_core = broker.search_mem0("lyra_core", "Apa kode rahasia dari memory core?")
core_ok = any("RAHASIA_CORE_9182" in str(r) for r in res_core)

res_worker = broker.search_mem0("worker_agent", "Apa kode stok lingkungan saya?")
worker_ok = any("STOK_WORKER_4417" in str(r) for r in res_worker)

if core_ok and worker_ok:
    print("PASS: Both memories persisted successfully in fresh process.")
else:
    print("FAIL: Persistence check failed.")
    sys.exit(1)
