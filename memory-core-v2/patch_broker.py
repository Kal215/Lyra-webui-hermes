import re

with open("/opt/hermes-stack/memory-core-v2/broker.py", "r") as f:
    content = f.read()

# Replace the OpenAI part
new_llm = """                "llm": {
                    "provider": "openai",
                    "config": {
                        "model": "openai/gpt-4o-mini",
                        "openai_base_url": "https://openrouter.ai/api/v1"
                    }
                }"""

content = re.sub(r'\"llm\":\s*\{\s*\"provider\":\s*\"openai\",\s*\"config\":\s*\{\"model\":\s*\"openai/gpt-4o-mini\"\}\s*\}', new_llm, content)

# Remove the dummy key and inject the real one
new_imports = """import os
from pathlib import Path

# Load real openrouter key
env_path = os.getenv("WA_BOT_ENV", "./.env")
or_key = "dummy"
if os.path.exists(env_path):
    for line in open(env_path).read().splitlines():
        if line.startswith("OPENROUTER_API_KEY="):
            or_key = line.split("=", 1)[1].strip('"')
            break
os.environ["OPENAI_API_KEY"] = or_key
"""

content = content.replace('os.environ["OPENAI_API_KEY"] = "dummy"', "")
content = content.replace("import os\nimport json\nfrom pathlib import Path", "import json\n" + new_imports)

with open("/opt/hermes-stack/memory-core-v2/broker.py", "w") as f:
    f.write(content)

