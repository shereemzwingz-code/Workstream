"""Phase 1 test: the build must equal build 113 byte-for-byte."""
import subprocess, sys, os
root = os.path.dirname(os.path.abspath(__file__)) + '/..'
subprocess.run([sys.executable, '-I', f'{root}/tools/build.py'], check=True)
a = open(f'{root}/dist/index.html','rb').read(); b = open(f'{root}/tools/build113.original.html','rb').read()
print('IDENTICAL to build 113' if a == b else f'DIFFERENT ({len(a)} vs {len(b)} bytes)'); sys.exit(a != b)
