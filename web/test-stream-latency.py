import sys
import http.client
import json

conn = http.client.HTTPConnection("localhost", 3000)
headers = {'Content-type': 'application/json'}
payload = json.dumps({"message": "Tuliskan puisi panjang 3 bait tentang senja"})
conn.request("POST", "/api/chat-stream", payload, headers)

response = conn.getresponse()
print("Status:", response.status)

import time
start = time.time()
while True:
    chunk = response.read(1)
    if not chunk:
        break
    sys.stdout.buffer.write(chunk)
    sys.stdout.flush()
    # just print first 5 seconds to see if it buffers
    if time.time() - start > 5:
        print("\n\n[Stopped reading after 5 seconds]")
        break
