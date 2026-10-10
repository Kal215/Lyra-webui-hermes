with open("/opt/hermes-stack/memory-core-v2/broker.py", "r") as f:
    lines = f.read()

lines = lines.replace("return client.add(content, user_id=user_id)", "return client.add(content, user_id=user_id, infer=False)")

with open("/opt/hermes-stack/memory-core-v2/broker.py", "w") as f:
    f.write(lines)
