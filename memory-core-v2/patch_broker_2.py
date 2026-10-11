with open("/opt/hermes-stack/memory-core-v2/broker.py", "r") as f:
    lines = f.readlines()

new_content = []
in_get_client = False
for line in lines:
    if "def _get_mem0_client" in line:
        in_get_client = True
        new_content.append("""    def _get_mem0_client(self) -> Memory:
        if "shared" not in self.clients:
            self.clients["shared"] = Memory.from_config({
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "path": "/opt/lyra/.mem0/qdrant",
                        "collection_name": "lyra_memory_v2_shared",
                        "embedding_model_dims": 384
                    }
                },
                "embedder": {
                    "provider": "huggingface",
                    "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
                },
                "llm": {
                    "provider": "openai",
                    "config": {
                        "model": "openai/gpt-4o-mini",
                        "openai_base_url": "https://openrouter.ai/api/v1"
                    }
                }
            })
        return self.clients["shared"]
""")
    elif in_get_client:
        if line.strip() == "return self.clients[env]":
            in_get_client = False
    elif "client = self._get_mem0_client(env)" in line:
        new_content.append(line.replace("client = self._get_mem0_client(env)", "client = self._get_mem0_client()"))
    else:
        new_content.append(line)

with open("/opt/hermes-stack/memory-core-v2/broker.py", "w") as f:
    f.writelines(new_content)
