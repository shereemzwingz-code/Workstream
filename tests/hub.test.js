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
    w.TextEncoder = TextEncoder; w.CSS = { escape: s => String(s).replace(/[^a-zA-Z0-9_-]/g, c => "\\" + c) }; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
    w.requestAnimationFrame = f => setTimeout(f, 0);
  } });
const w = dom.window, $ = s => w.document.querySelector(s), list = () => $('#list').textContent;
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = async k => { $('[data-hubtab="'+k+'"]').click(); await wait(30); };
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
  ok(w.document.querySelectorAll('.hnx').length === 1, 'Do next shows ONE thing at a time');
  ok(!/Follow up — quiet/.test(list()), 'the other suggestions wait their turn');
  ok(w.document.querySelectorAll('[data-hubtab]').length === 6 && $('[data-hubtab="today"]').getAttribute('aria-selected') === 'true', 'six tabs, starting on Today');
  ok($('[data-hubtab="email"] b') && $('[data-hubtab="email"] b').textContent === '1', 'Email tab shows 1 waiting');
  // 3. sections
  ok(list().includes('Sunrise Community Center — send MSA draft'), 'linked task appears');
  ok(!list().includes('Jordan Rivera') && !list().includes('Emailed the partnership overview'), 'other tabs stay hidden until tapped');
  await tab('email'); ok(list().includes('Waiting for your OK') && $('#list [data-pbody]'), 'Email tab: Outbox draft + email box');
  await tab('people'); ok(list().includes('Jordan Rivera'), 'People tab: designee badge');
  await tab('links'); ok(list().includes('canva.com/'), 'Links tab: deck link');
  await tab('history'); ok(list().includes('Emailed the partnership overview') && $('#list [data-pupd]'), 'History tab: timeline + quick log');
  await tab('kit'); ok($('#list .kitbar') && $('#list [data-pact="budget"]'), 'Kit tab: kit folder + Budget/MSA/Deck');
  await tab('today');
  // 4. an existing card button still works inside the hub (Edit → form)
  $('#list .pcard [data-pact="edit"]').click(); await wait(50);
  ok($('#list .pform'), 'Edit button works inside the hub');
  w.eval('S.pEdit=null; renderList();'); await wait(20);
  // 5. Open draft → Outbox with that draft selected
  $('.hubnext [data-hubob]').click(); await wait(50);
  ok(w.eval('S.view') === 'outbox' && w.eval('S.obSel') === 'q_test', 'Open draft jumps to that draft in the Outbox');
  ok(w.eval('S.hub') === null, 'leaving Partners closes the hub');
  // 6. back button returns to the full list
  w.eval('hubOpen("p_test")'); await wait(50);
  $('[data-hubback]').click(); await wait(50);
  ok(w.eval('S.hub') === null && list().includes('Riverside Library'), 'Back returns to the full partner list');
  // 7. one tap: tracked link (+ QR + flyer when Canva is allowed), all logged
  w.eval('hubOpen("p_test")'); await wait(50);
  await tab('links');
  ok(list().includes('Make link + QR + flyer'), 'hub offers the one-tap link + QR + flyer');
  $('[data-lfbase]').value = 'ampion.net';  $('[data-lfproj]').value = 'Sunrise';
  $('[data-lfgo]').click(); await wait(100);
  ok(/no project page/.test(list()), 'a homepage-only enrollment URL is refused with a plain reason');
  $('[data-lfbase]').value = 'https://ampion.net/sunrise'; $('[data-lfgo]').click(); await wait(300);
  const P = db.docs.get(U + '/partners/items/p_test');
  ok(/utm_source=sunrise_community_center&utm_medium=community_partner&utm_campaign=partner_outreach_sunrise/.test(P.utmLink || ''), 'tracked link saved on the partner: ' + P.utmLink);
  ok([...db.docs.entries()].some(([k, v]) => k.startsWith(U + '/utm/items/') && v.link === P.utmLink && v.pid === 'p_test'), 'tracked link saved to the UTM log, tied to the partner');
  ok(P.history.some(h => h.text.startsWith('🔗 Tracked link made')), 'tracked link written to the partner timeline');
  ok(/needs Canva and Google Drive allowed/.test(list()), 'without Canva it says exactly what to allow (status survives the re-render)');
  ok(list().includes('UTM link') && list().includes('partner_outreach_sunrise'), 'the new link shows in Links & files');
  // a finished flyer (from any tool) lands in the Link Log and the timeline, once
  await w.eval('lfLogFlyer(S.partners.find(x=>x.id==="p_test"),"https://www.canva.com/design/FLYER1/edit")'); await wait(100);
  await w.eval('lfLogFlyer(S.partners.find(x=>x.id==="p_test"),"https://www.canva.com/design/FLYER1/edit")'); await wait(100);
  const flyerRows = [...db.docs.entries()].filter(([k, v]) => k.startsWith(U + '/links/items/') && v.url.includes('FLYER1'));
  ok(flyerRows.length === 1 && flyerRows[0][1].pid === 'p_test', 'flyer saved to the Link Log exactly once, tied to the partner');
  ok(db.docs.get(U + '/partners/items/p_test').history.filter(h => h.text.includes('FLYER1')).length === 1, 'flyer written to the timeline exactly once');
  ok(list().includes('Flyer — Sunrise Community Center (TEST)'), 'flyer shows in the hub Links & files');
  // 8. Back button returns to the exact previous screen
  w.eval('S.navStack=[]; S.navLast=null; S.view="home"; render();'); await wait(30);
  ok($('#navBack').hidden, 'no Back button on the first screen');
  w.eval('S.view="partners"; render();'); await wait(30);
  [...w.document.querySelectorAll('#list .pcard')].find(c => c.dataset.pid === 'p_test').querySelector('[data-pact="toggle"]').click(); await wait(30);
  $('.hubnext [data-hubob]').click(); await wait(30);
  ok(w.eval('S.view') === 'outbox' && !$('#navBack').hidden && $('#navBackTo').textContent === 'Back to Sunrise Community Center (TEST)', 'Back names where it goes: ' + $('#navBackTo').textContent);
  $('#navBack').click(); await wait(30);
  ok(w.eval('S.view') === 'partners' && w.eval('S.hub') === 'p_test', 'Back from the draft returns to the partner hub');
  $('[data-hubback]').click(); await wait(30);
  ok(w.eval('S.hub') === null && list().includes('Riverside Library'), 'hub → All partners');
  $('#navBack').click(); await wait(30);
  ok(w.eval('S.hub') === 'p_test', 'Back from the list returns to the hub you came from');
  $('#navBack').click(); await wait(30); $('#navBack').click(); await wait(30);
  ok(w.eval('S.view') === 'home', 'Back walks all the way to Home');
  // 9. contact card
  w.eval('hubOpen("p_test")'); await wait(50);
  const cc = $('.ccard'); ok(cc, 'hub opens with a contact card');
  ok(cc.textContent.includes('Dana Test') && $('.ccav').textContent === 'DT', 'card shows name and initials avatar');
  ok(cc.querySelector('details.ccmore') && !cc.querySelector('details.ccmore').open, 'details are folded away');
  ok(cc.querySelector('a[href="tel:3125550100"]') && cc.querySelector('a[href="sms:3125550100"]') && cc.querySelector('a[href="mailto:dana@example.org"]'), 'Call / Text / Email are one tap');
  let saved = null; w.eval('S.dl={save:async o=>{ window.__saved=o; }}');
  $('[data-ccsave]').click(); await wait(30); saved = w.__saved;
  const vcf = saved && Buffer.from(saved.data).toString();
  ok(saved && saved.filename === 'Dana_Test.vcf' && /FN:Dana Test/.test(vcf) && /TEL;TYPE=WORK,VOICE:312-555-0100/.test(vcf) && /ORG:Sunrise Community Center \(TEST\)/.test(vcf), 'Save makes a phone contact file (.vcf)');
  w.eval('hubOpen("p_other")'); await wait(30);
  ok($('.ccard a.off') && $('.ccard').textContent.includes('+ Add phone'), 'missing phone shows "+ Add phone" and greys out Call/Text');
  // 10. one-tap badge — add a designee, then the whole chain runs (Canva/email stubbed in this test)
  w.eval('hubOpen("p_test")'); await wait(30);
  await tab('people');
  ok([...w.document.querySelectorAll('[data-btgo]')].some(b => b.textContent.includes('Make badge')), 'each needed badge has a one-tap "Make badge" button');
  w.eval(`S.mcp={}; window.__calls=[];
    badgeCanva=async bd=>{ __calls.push("canva"); await bgcol().doc(bd.id).update({canvaId:"C1",canvaUrl:"https://canva.com/C1",agentId:11}); return "u"; };
    mailImages=async (t,k)=>{ __calls.push("mail:"+k); return k==="photo"?[{uri:"m1",name:"Casey Lane headshot.jpg",mime:"image/jpeg"},{uri:"m2",name:"group.jpg",mime:"image/jpeg"}]:[{uri:"m3",name:"logo.png",mime:"image/png"}]; };
    badgeAddImage=async (bd,k,f)=>{ __calls.push("add:"+k+":"+f.uri); await bgcol().doc(bd.id).update({[k+"Asset"]:"A_"+k}); };
    badgePng=async bd=>{ __calls.push("png"); await bgcol().doc(bd.id).update({status:"Made"}); };`);
  $('[data-btname]').value = 'Casey Lane'; $('[data-btadd]').click(); await wait(400);
  const casey = [...db.docs.entries()].find(([k, v]) => k.startsWith(U + '/badges/items/') && v.name === 'Casey Lane');
  ok(casey && casey[1].pid === 'p_test', 'designee added as a badge tied to this partner');
  ok(casey[1].canvaId === 'C1' && casey[1].photoAsset === 'A_photo' && casey[1].logoAsset === 'A_logo' && casey[1].status === 'Made', 'one tap ran Canva → photo → logo → PNG: ' + w.__calls.join(','));
  ok(w.__calls.includes('add:photo:m1'), 'picked the headshot whose file name matches the person');
  ok(db.docs.get(U + '/partners/items/p_test').history.some(h => h.text.includes('Casey Lane')), 'designee written to the partner timeline');
  await wait(100);
  ok(list().includes('Ready to print on the Badgy'), 'says it is ready to print');
  // ambiguous photo → stops and asks, never guesses
  w.eval(`mailImages=async (t,k)=>[{uri:"x1",name:"IMG_001.jpg"},{uri:"x2",name:"IMG_002.jpg"}]; __calls=[];`);
  await tab('people'); $('[data-btgo]').click(); await wait(300);
  ok(/Found 2 possible photos/.test(list()) && $('[data-btpick]') && !w.__calls.some(c => c.startsWith('add:')), 'two unclear photos → stops and shows Pick, places nothing');
  // 11. ▶ Do it all for me
  await db.doc(U + '/agent/queue/q_test').delete(); await wait(50);
  w.eval('hubOpen("p_test")'); await wait(30);
  ok($('[data-autogo]') && $('[data-autogo]').textContent.includes('Do it all for me'), 'every partner has one "Do it all for me" button at the top');
  w.eval('S.mcp=null; S.sample=null;'); $('[data-autogo]').click(); await wait(300);
  const st = () => [...w.document.querySelectorAll('.autolist li')].map(li => li.className.replace('a-', '') + ':' + li.querySelector('b').textContent);
  ok(JSON.stringify(st()) === JSON.stringify(['need:✉️ Follow-up email', 'done:🔗 Tracked link', 'need:📄 QR + flyer', 'need:🪪 Designee badges']), 'without connectors it does what it can and says what is needed: ' + st().join(' | '));
  ok(list().includes('Allow Canva + Google Drive'), 'tells you exactly what to allow');
  w.eval(`S.mcp={}; S.sample=async()=>({text:"Hi Dana, following up on the sign-up day…"});
    flyerCanva=async p=>{ await pcol().doc(p.id).update({flyerUrl:"https://canva.com/F9",flyerLink:p.utmLink}); return "https://canva.com/F9"; };
    badgeOneTap=async bd=>{ await bgcol().doc(bd.id).update({status:"Made"}); await new Promise(r=>setTimeout(r,60)); };`);
  $('[data-autogo]').click(); await wait(800);
  ok(st().every(x => x.startsWith('done:')), 'with connectors every step finishes: ' + st().join(' | '));
  ok([...db.docs.entries()].some(([k, v]) => k.startsWith(U + '/agent/queue/') && v.pid === 'p_test' && /following up/.test(v.body)), 'follow-up drafted into the Outbox (not sent)');
  ok(!w.eval('S.badges.filter(b=>b.pid==="p_test"||/sunrise/i.test(b.org)).some(b=>b.status==="Needed")'), 'every waiting badge was built');
  ok([...db.docs.entries()].some(([k, v]) => k.startsWith(U + '/agent/log/') && /Do it all — Sunrise/.test(v.text)), 'the run is written to Activity');
  ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
  console.log(`PASS partner hub: ${pass} checks`); process.exit(0);
})().catch(e => { console.error('FAIL', e.message, errors.slice(0, 3)); process.exit(1); });
