import os
import re

files = ['socket-daemon.js', 'src/lib/live/observer/socket-server.ts']

cross_platform_path = """const IS_WIN = os.platform() === 'win32';
const SOCKET_PATH = IS_WIN ? `\\\\.\\pipe\\lyra-observer-${os.userInfo().uid}.sock` : `/run/user/${os.userInfo().uid}/lyra-observer.sock`;"""

for filepath in files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace the old SOCKET_PATH definition
    old_def = r"const SOCKET_PATH = `/run/user/\$\{os\.userInfo\(\)\.uid\}/lyra-observer\.sock`;"
    content = re.sub(old_def, cross_platform_path, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

