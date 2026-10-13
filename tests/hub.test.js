// Partner Hub test: loads the real built page in a simulated browser with a fake account database
// seeded with one TEST partner, opens the hub and checks every section. Run: node tests/hub.test.js
const fs = require('fs'), assert = require('assert'), { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../dist/index.html', 'utf8');
const ago = d => new Date(Date.now() - d * 864e5).toISOString();
const ymdAgo = d => ago(d).slice(0, 10);

// ---- in-memory stand-in for the artifact database (same calls the page makes)
function makeDB(seed) {
  const docs = new Map(Object.entries(seed)), subs = [];
  const kids = col => [...docs.keys()].filter(k => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/'));
  const snapDoc = p => ({ id: p.split('/').pop(), exists: () => docs.has(p), data: () => docs.get(p) });
  const snapCol = c => ({ docs: kids(c).map(snapDoc) });
  const fire = () => subs.forEach(s => setTimeout(() => s(), 0));
  let n = 0;
  const doc = p => ({
    id: p.split('/').pop(),
    get: async () => snapDoc(p),
    set: async v => { docs.set(p, JSON.parse(JSON.stringify(v))); fire(); },
    update: async v => { docs.set(p, { ...(docs.get(p) || {}), ...JSON.parse(JSON.stringify(v)) }); fire(); },
    delete: async () => { docs.delete(p); fire(); },
    onSnapshot: (f) => { const s = () => f(snapDoc(p)); subs.push(s); setTimeout(s, 0); return () => {}; },
    collection: c => col(p + '/' + c),
  });
  const col = c => ({
    doc: id => doc(c + '/' + (id || 'auto' + (++n))),
    add: async v => { const id = 'auto' + (++n); docs.set(c + '/' + id, v); fire(); return { id }; },
    onSnapshot: (f) => { const s = () => f(snapCol(c)); subs.push(s); setTimeout(s, 0); return () => {}; },
    get: async () => snapCol(c),
  });
  return { doc, collection: col, docs };
}

const U = 'data/users/u1';
const seed = {
  [U + '/partners/items/p_test']: { name: 'Dana Test', org: 'Sunrise Community Center (TEST)', email: 'dana@example.org', phone: '312-555-0100',
    stage: 'Emailed', lastContact: ago(9), nextStep: '', needsKit: true, tier: '🌱 Community & service orgs', ssStatus: '3 - Engagement',
    deckUrl: 'https://www.canva.com/design/TEST/view', history: [{ at: ago(9), text: 'Emailed the partnership overview', changes: {} }], order: 1 },
  [U + '/partners/items/p_other']: { name: 'Other Org', org: 'Riverside Library', email: 'x@example.org', stage: 'To email', lastContact: '', nextStep: 'Intro email', order: 2, history: [] },
  [U + '/t_test']: { title: 'Sunrise Community Center — send MSA draft', status: 'Not Started', dueDate: ymdAgo(2), cat: 1, history: [], order: 1, who: '', nextStep: '' },
  [U + '/t_other']: { title: 'Riverside Library — intro', status: 'Not Started', dueDate: ymdAgo(-3), cat: 1, history: [], order: 2, who: '', nextStep: '' },
  [U + '/agent/queue/q_test']: { at: ago(1), kind: 'followup', title: '✉️ Follow-up for Sunrise Community Center', pid: 'p_test', to: 'dana@example.org', body: 'Hi Dana, checking in…', name: 'Dana Test' },
  [U + '/badges/items/b_test']: { name: 'Jordan Rivera', org: 'Sunrise Community Center', status: 'Needed', createdAt: ago(4) },
};
const db = makeDB(seed);
const vc = new VirtualConsole(); const errors = [];
vc.on('jsdomError', e => { if (!/Could not load|not implemented|scrollTo/i.test(String(e.message))) errors.push(String(e.message)); });

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://claude.ai/test', virtualConsole: vc,
  beforeParse(w) {
    w.claude = { use: async k => k === 'db' ? db : k === 'user' ? { id: async () => 'u1' } : k === 'mcp' ? Promise.reject(new Error('no mcp in test')) : null };
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    w.CSS = { escape: s => String(s).replace(/[^a-zA-Z0-9_-]/g, c => "\\" + c) }; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
    w.requestAnimationFrame = f => setTimeout(f, 0);
  } });
const w = dom.window, $ = s => w.document.querySelector(s), list = () => $('#list').textContent;
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0; const ok = (c, m) => { assert(c, m); pass++; };

(async () => {
  await wait(2500);
  // 1. open the Partners list, tap the TEST partner row → hub opens full screen
  w.eval('S.view="partners"; render();'); await wait(50);
  const row = [...w.document.querySelectorAll('#list .pcard')].find(c => c.dataset.pid === 'p_test');
  ok(row, 'TEST partner shows in the Partners list');
  row.querySelector('[data-pact="toggle"]').click(); await wait(50);
  ok(w.eval('S.hub') === 'p_test', 'tapping the partner opens its hub');
  ok($('[data-hubback]'), 'hub has a Back to all partners button');
  ok(!list().includes('Riverside Library'), 'hub shows only this partner (no other partners on screen)');
  // 2. Do next
  ok(list().includes('Review 1 email draft waiting'), 'Do next: draft waiting');
  ok(/Follow up — quiet 9 days/.test(list()), 'Do next: 9-day follow-up');
  ok(list().includes('1 overdue task'), 'Do next: overdue task');
  ok(w.document.querySelectorAll('.hnx').length === 3, 'Do next shows the top 3 only');
  // 3. sections
  ok(list().includes('Sunrise Community Center — send MSA draft'), 'linked task appears');
  ok(list().includes('Waiting for your OK'), 'Outbox draft appears in the hub');
  ok(list().includes('Jordan Rivera'), 'designee badge appears in People & badges');
  ok(list().includes('canva.com/design/TEST'), 'deck link appears in Links & files');
  ok(list().includes('Emailed the partnership overview'), 'timeline appears');
  // 4. an existing card button still works inside the hub (Edit → form)
  $('#list .pcard [data-pact="edit"]').click(); await wait(50);
  ok($('#list .pform'), 'Edit button works inside the hub');
  w.eval('S.pEdit=null; renderList();'); await wait(20);
  // 5. Open draft → Outbox with that draft selected
  $('[data-hubob]').click(); await wait(50);
  ok(w.eval('S.view') === 'outbox' && w.eval('S.obSel') === 'q_test', 'Open draft jumps to that draft in the Outbox');
  ok(w.eval('S.hub') === null, 'leaving Partners closes the hub');
  // 6. back button returns to the full list
  w.eval('hubOpen("p_test")'); await wait(50);
  $('[data-hubback]').click(); await wait(50);
  ok(w.eval('S.hub') === null && list().includes('Riverside Library'), 'Back returns to the full partner list');
  ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
  console.log(`PASS partner hub: ${pass} checks`); process.exit(0);
})().catch(e => { console.error('FAIL', e.message, errors.slice(0, 3)); process.exit(1); });
