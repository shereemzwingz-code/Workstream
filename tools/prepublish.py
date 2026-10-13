"""Run before every publish. Usage: python3 tools/prepublish.py <live-version-just-read>
1. Refuses if the live artifact changed since our last publish (another chat published a newer build).
2. Runs every test. 3. Builds dist/index.html and checks the script parses."""
import subprocess, sys, os, glob
root = os.path.dirname(os.path.abspath(__file__)) + '/..'
live = sys.argv[1] if len(sys.argv) > 1 else ''
ours = open(f'{root}/PUBLISHED_VERSION').read().strip()
if live != ours:
    sys.exit(f'STOP: live build is {live or "unknown"}, but this repo last published {ours}. Pull the live page into src/ first.')
for t in sorted(glob.glob(f'{root}/tests/*.test.js')):
    subprocess.run(['node', t], check=True)
subprocess.run([sys.executable, '-I', f'{root}/tools/build.py'], check=True)
subprocess.run(['node', '-e', "const s=require('fs').readFileSync(process.argv[1],'utf8');const a=s.indexOf('<script>\\nconst CATS')+8;new Function(s.slice(a,s.indexOf('</script>',a)));console.log('page script parses')", f'{root}/dist/index.html'], check=True)
print('OK to publish. After publishing, write the new version into PUBLISHED_VERSION and commit.')
