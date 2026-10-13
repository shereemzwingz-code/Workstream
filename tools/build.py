"""Rebuild the single Workstream page from src/ in manifest order. Usage: python3 tools/build.py [out]"""
import json, os, sys, hashlib
root = os.path.dirname(os.path.abspath(__file__)) + '/..'
order = json.load(open(f'{root}/src/manifest.json'))
page = '\n'.join(open(f'{root}/src/{p}', encoding='utf8').read() for p in order)
out = sys.argv[1] if len(sys.argv) > 1 else f'{root}/dist/index.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf8').write(page)
print(out, len(page.encode()), 'bytes sha256', hashlib.sha256(page.encode()).hexdigest()[:16])
