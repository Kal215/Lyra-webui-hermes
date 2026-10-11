import os
import traceback
os.environ["OPENAI_API_KEY"] = "dummy"

from mem0 import Memory
config1 = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "path": "/opt/hermes-stack/memory-core-v2/qdrant1",
            "collection_name": "lyra_core_memory_v2",
            "embedding_model_dims": 384
        }
    },
    "embedder": {
        "provider": "huggingface",
        "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
    }
}
config2 = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "path": "/opt/hermes-stack/memory-core-v2/qdrant2",
            "collection_name": "worker_agent_memory_v2",
            "embedding_model_dims": 384
        }
    },
    "embedder": {
        "provider": "huggingface",
        "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
    }
}
try:
    m1 = Memory.from_config(config1)
    m2 = Memory.from_config(config2)
    print("SUCCESS: Instantiated two distinct physical instances in different paths")
except Exception as e:
    traceback.print_exc()
