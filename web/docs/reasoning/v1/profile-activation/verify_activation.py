import sys
import re

def verify(file_path, profile):
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[{profile}] FAIL CLOSED: SOUL file not found.")
        sys.exit(1)

    r1_count = len(re.findall(r'LYRA REASONING PROTOCOL \(lyra-r1-v1\)', content))
    r2_count = len(re.findall(r'LYRA REASONING PROTOCOL \(lyra-r2-specialized\)', content))
    
    total = r1_count + r2_count

    if total == 0:
        print(f"[{profile}] MISSING BLOCK: Ready for installation.")
        sys.exit(0)
    elif total == 1:
        print(f"[{profile}] NO-OP: Block already installed.")
        sys.exit(0)
    else:
        print(f"[{profile}] FAIL CLOSED: Duplicate or incompatible blocks detected.")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python3 verify_activation.py <path_to_soul> <profile_name>")
        sys.exit(1)
    verify(sys.argv[1], sys.argv[2])
