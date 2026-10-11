from qdrant_client import QdrantClient
from mem0 import Memory
import os
os.environ["OPENAI_API_KEY"] = "dummy"

shared_client = QdrantClient(path="/opt/hermes-stack/memory-core-v2/qdrant_shared")

config1 = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "client": shared_client,
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
            "client": shared_client,
            "collection_name": "worker_agent_memory_v2",
            "embedding_model_dims": 384
        }
    },
    "embedder": {
        "provider": "huggingface",
        "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
    }
}

m1 = Memory.from_config(config1)
m2 = Memory.from_config(config2)
print("SUCCESS: Instantiated two instances using one shared QdrantClient but different collections!")
