// ---- Back button (Oct 13 2026): returns to the exact screen you were on before — the partner hub,
// the tool, the draft, even the scroll spot in a long list. Works across every screen.
S.navStack=[]; S.navLast=null; S.navBacking=false;
function navKey(){ return JSON.stringify([S.view,S.view==="partners"?S.hub||"":"",S.view==="tools"?S.toolApp||"home":"",S.view==="outbox"?S.obSel||"":""]); }
function navSnap(){ return {key:navKey(),view:S.view,hub:S.view==="partners"?S.hub:null,toolApp:S.toolApp,obSel:S.obSel,y:0}; }
const NAV_NAMES={home:"Home",list:"Tasks",partners:"Partners",outbox:"Outbox",tools:"Tools",agent:"Assistant",cal:"Meetings",cp:"CP check-in",goals:"Goals",badges:"Badges",flyers:"Flyers",testing:"Testing",budget:"Budget",msa:"MSA",abp:"ABP",slides:"Slides",ref:"Reference",teams:"Teams"};
function navName(e){ if(!e) return ""; if(e.view==="partners"&&e.hub){ const p=(S.partners||[]).find(x=>x.id===e.hub); return p?(p.org||p.name):"Partner"; }
  if(e.view==="outbox"&&e.obSel) return "the draft"; if(e.view==="tools"&&e.toolApp&&e.toolApp!=="home") return "Tools"; return NAV_NAMES[e.view]||"previous screen"; }
(function(){ try{ document.head.insertAdjacentHTML("beforeend",`<style>
.navback{position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));z-index:65;display:flex;align-items:center;gap:6px;min-height:44px;max-width:min(70vw,320px);padding:0 16px 0 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:14px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer}
.navback span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.navback[hidden]{display:none}
</style>`); document.body.insertAdjacentHTML("beforeend",`<button type="button" class="navback" id="navBack" hidden aria-label="Go back"><b aria-hidden="true">←</b><span id="navBackTo">Back</span></button>`); }catch(err){ console.warn("[back] ui",err); } })();
function navPaint(){ const b=$("navBack"); if(!b) return; const top=S.navStack[S.navStack.length-1]; b.hidden=!top; if(top){ const n=navName(top); $("navBackTo").textContent="Back to "+n; b.setAttribute("aria-label","Back to "+n); } }
// Remember where you were scrolled on each screen.
window.addEventListener("scroll",()=>{ if(S.navLast) S.navLast.y=window.scrollY||0; },{passive:true});
function navCheck(){ const cur=navKey();
  if(!S.navLast){ S.navLast=navSnap(); }
  else if(S.navLast.key!==cur){ if(!S.navBacking){ S.navStack.push(S.navLast); if(S.navStack.length>30) S.navStack.shift(); } S.navLast=navSnap(); }
  S.navBacking=false; navPaint(); }
// Every screen change goes through render() or renderList(); check after either.
{ const _render=render; render=function(){ const r=_render.apply(this,arguments); navCheck(); return r; }; }
{ const _rl=renderList; renderList=function(){ const r=_rl.apply(this,arguments); navCheck(); return r; }; }
function navBack(){ const e=S.navStack.pop(); if(!e) return; S.navBacking=true;
  S.view=e.view; S.hub=e.hub||null; S.pOpen=e.hub||S.pOpen; S.pEdit=null; S.pPanel=null; S.toolApp=e.toolApp; S.obSel=e.obSel; if(S.view!=="partners") S.pOpen=null;
  render(); const y=e.y||0; requestAnimationFrame(()=>{ try{ window.scrollTo(0,y); }catch(_){ } }); }
document.addEventListener("click",e=>{ if(e.target.closest("#navBack")) navBack(); });
