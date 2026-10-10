import json
import sys
for line in sys.stdin:
    if line.strip():
        data = json.loads(line)
        title = data.get("display_name")
        if not title:
            msgs = data.get("messages", [])
            for m in msgs:
                if m.get("role") == "user":
                    title = m.get("content", "")[:50]
                    break
        print(f"ID: {data['id']}, Title: {title}")
        break
