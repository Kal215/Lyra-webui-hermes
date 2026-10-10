import os
os.environ["OPENAI_API_KEY"] = "sk-dummy"
from broker import broker
res = broker.mem0_instances["lyra_core"].search("test", filters={"user_id": "lyra_core_system"})
print(type(res), res)
