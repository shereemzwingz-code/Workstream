"""One-time split of build 113 into source modules. Concatenating parts in manifest order rebuilds the page byte-for-byte."""
import json, os, sys
src = open(sys.argv[1], encoding='utf8').read()
L = src.split('\n')
# (first line, 1-based) -> path. Each part runs until the next entry.
cuts = [
 (1,'shell/head.html'),(11,'styles/base.css'),(500,'styles/tasks-partners.css'),(1000,'styles/tools-panels.css'),
 (1499,'shell/body.html'),(1635,'shell/script-open.html'),
 (1636,'data/state-and-boot-helpers.js'),(1653,'screens/home.js'),(1749,'agents/partner-kit.js'),(1797,'agents/ambassador-utm.js'),
 (1893,'agents/assistant-rules.js'),(1996,'screens/theme-score-focus.js'),(2080,'screens/flow-board.js'),(2124,'screens/outbox.js'),
 (2281,'screens/ambassador-onboarding.js'),(2459,'screens/designee-onboarding.js'),(2519,'agents/badges-canva.js'),
 (2663,'screens/testing.js'),(2795,'agents/badge-preview-email.js'),(2872,'screens/command-k.js'),(2902,'screens/tasks-render.js'),
 (3181,'data/writes-and-events.js'),(3278,'agents/assistant-claude.js'),(3419,'agents/voice-note.js'),(3537,'agents/mzw-voice.js'),
 (3634,'screens/partners.js'),(3711,'agents/pitch-deck-gamma.js'),(3812,'agents/pitch-deck-canva.js'),(3947,'screens/partner-crm.js'),
 (4154,'screens/cp-checkin.js'),(4343,'agents/budget-builder.js'),(4458,'agents/msa-builder.js'),(4628,'screens/right-now-drag.js'),
 (4709,'data/export-and-boot.js'),(4804,'screens/slides-links.js'),(4966,'screens/utm-builder.js'),(5099,'screens/meetings-teams.js'),
 (5158,'screens/budget-savings.js'),(5250,'screens/msa-tab.js'),(5293,'screens/abp.js'),(5352,'screens/find-and-save.js'),(5490,'screens/kitty-sparkle.js'),
]
out = os.path.dirname(os.path.abspath(__file__)) + '/../src'
manifest = []
for i,(start,path) in enumerate(cuts):
    end = cuts[i+1][0]-1 if i+1 < len(cuts) else len(L)
    chunk = '\n'.join(L[start-1:end])
    p = os.path.join(out, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p,'w',encoding='utf8').write(chunk)
    manifest.append(path)
    print(f'{end-start+1:5} lines  {path}')
json.dump(manifest, open(os.path.join(out,'manifest.json'),'w'), indent=1)
