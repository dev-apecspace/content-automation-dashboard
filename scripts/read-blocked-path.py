#!/usr/bin/env python3
"""Read the pathname argument of the blocked statx syscall of a process."""
import re, sys

pid = sys.argv[1]
with open(f"/proc/{pid}/syscall") as f:
    parts = f.read().split()
nr = int(parts[0], 16) if parts[0].startswith("0x") else int(parts[0])
args = [int(x, 16) for x in parts[1:6]]
print(f"syscall nr={nr} args={[hex(a) for a in args]}")
# statx = 332 on x86_64: arg1 = pathname pointer
path_ptr = args[1]
try:
    with open(f"/proc/{pid}/mem", "rb", 0) as mem:
        mem.seek(path_ptr)
        raw = mem.read(512)
        s = raw.split(b"\x00")[0].decode("utf-8", "replace")
        print("PATH:", s)
except Exception as e:
    print("read failed:", e)
