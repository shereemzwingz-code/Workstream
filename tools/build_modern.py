"""Build 113 + the modern finish (design/modern.css), nothing else. Usage: python3 tools/build_modern.py [out]"""
import os, sys
root = os.path.dirname(os.path.abspath(__file__)) + '/..'
s = open(f'{root}/tools/build113.original.html', encoding='utf8').read()
css = open(f'{root}/design/modern.css', encoding='utf8').read()
lines = s.split('\n'); assert lines[1498] == '</style>', 'main style block moved'
lines[1498] = css + '\n</style>'
out = sys.argv[1] if len(sys.argv) > 1 else f'{root}/dist/modern.html'
os.makedirs(os.path.dirname(out), exist_ok=True); open(out, 'w', encoding='utf8').write('\n'.join(lines)); print(out)
