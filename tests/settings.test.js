// Phase 2 test: two devices share ws.* settings through the account database.
// Run: node tests/settings.test.js
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const code = fs.readFileSync(__dirname + '/../src/data/synced-settings.js', 'utf8');

// One shared fake account database (document store with live listeners).
function makeDB() {
  const docs = {}, subs = {};
  const fire = p => (subs[p] || []).forEach(f => f(snap(p)));
  const snap = p => ({ exists: () => p in docs, data: () => docs[p] });
  return { docs, doc: p => ({
    set: async v => { docs[p] = JSON.parse(JSON.stringify(v)); setTimeout(() => fire(p), 0); },
    onSnapshot: f => { (subs[p] = subs[p] || []).push(f); setTimeout(() => f(snap(p)), 0); return () => {}; },
  }) };
}
// One browser: its own Storage objects and its own copy of the page script.
function makeDevice(db, seed) {
  class Storage { constructor() { this.m = {}; } getItem(k) { return k in this.m ? this.m[k] : null; }
    setItem(k, v) { this.m[k] = String(v); } removeItem(k) { delete this.m[k]; } }
  const localStorage = new Storage(), sessionStorage = new Storage();
  Object.entries(seed || {}).forEach(([k, v]) => localStorage.setItem(k, v));
  const ctx = { Storage, localStorage, sessionStorage, console, setTimeout, clearTimeout,
    S: {}, toasts: [], renders: 0, BQ_DEF: {}, MQ_DEF: {}, HOME_SECS: ['today', 'kits', 'tools'] };
  ctx.toast = m => ctx.toasts.push(m); ctx.render = () => ctx.renders++;
  vm.createContext(ctx); vm.runInContext(code, ctx);
  ctx.S.db = db; ctx.S.uid = 'u1';
  return ctx;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const db = makeDB();
  // Laptop opens first with real data in its browser → one-time migration uploads it.
  const laptop = makeDevice(db, { 'ws.amb': '{"name":"Rita Lewis"}', 'ws.rules': '{"friday":true}', 'ws.theme': 'dark', 'ws.pLayout': 'cards' });
  vm.runInContext('wsSyncStart()', laptop); await wait(50);
  const kv = db.docs['data/users/u1/settings'].kv;
  assert.strictEqual(kv['ws.amb'], '{"name":"Rita Lewis"}', 'ambassador migrated');
  assert.strictEqual(kv['ws.theme'], undefined, 'theme stays device-only');

  // Phone opens with an older ambassador draft → adopts the account copy, backs up its own.
  const phone = makeDevice(db, { 'ws.amb': '{"name":"Old draft"}', 'ws.theme': 'light' });
  vm.runInContext('wsSyncStart()', phone); await wait(50);
  assert.strictEqual(phone.S.amb.name, 'Rita Lewis', 'phone shows laptop ambassador');
  assert.strictEqual(phone.S.rules.friday, true, 'phone has laptop rules');
  assert.strictEqual(phone.S.pLayout, 'cards', 'phone has laptop layout');
  assert.strictEqual(phone.localStorage.getItem('ws.theme'), 'light', 'phone keeps its own theme');
  const bk = Object.keys(db.docs).find(p => p.includes('settings_backup'));
  assert(bk && db.docs[bk].kv['ws.amb'].includes('Old draft'), 'phone draft backed up, not lost');

  // Change on phone → shows up on laptop live.
  phone.localStorage.setItem('ws.des', '{"org":"Imani Village"}'); await wait(800);
  assert.strictEqual(laptop.S.des.org, 'Imani Village', 'designee from phone appears on laptop');

  // Assistant chat (session storage) follows too.
  phone.sessionStorage.setItem('ws.chat', '[{"role":"me","text":"hi"}]'); await wait(800);
  assert.strictEqual(laptop.S.chat[0].text, 'hi', 'chat history syncs');

  // Save failure → plain-words message, not silent.
  const broken = makeDevice({ doc: () => ({ set: () => Promise.reject(new Error('offline')), onSnapshot: f => setTimeout(() => f({ exists: () => false }), 0) }) }, { 'ws.me': '{}' });
  vm.runInContext('wsSyncStart()', broken); await wait(50);
  assert(broken.toasts.some(t => t.includes("didn't save")), 'save failure is shown');

  console.log('PASS settings sync: 9 checks');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
