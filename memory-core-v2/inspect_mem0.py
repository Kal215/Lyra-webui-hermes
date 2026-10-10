from mem0 import Memory
import inspect

print("--- ADD API ---")
print(inspect.signature(Memory.add))
print("--- SEARCH API ---")
print(inspect.signature(Memory.search))
print("--- DELETE API ---")
print(inspect.signature(Memory.delete))
