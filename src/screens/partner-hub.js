// ---- Partner Hub (Oct 13 2026): tap a partner → one full screen with everything for that partner.
// Reuses the existing partner card (crmHTML: status, kit, email draft, log, contact, tasks, timeline,
// budget/MSA/deck/savings/ABP panels) and adds what lived in other tools: Outbox drafts, people & badges,
// links, and a "Do next" strip. Everything sits inside .pcard[data-pid] so every existing button keeps working.
S.hub=null;
(function(){ try{ document.head.insertAdjacentHTML("beforeend",`<style>
.hub{display:grid;gap:14px;margin-top:10px}
.hubtop{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hubtop .crumb{font-size:13px;color:var(--muted)}
.hub>.pcard{border-left-width:4px}
.hubnext{display:grid;gap:8px;padding:12px 14px 0}
.hubnext h4,.hubbox h4{margin:0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;gap:8px;align-items:center}
.hnx{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.hnx .why{flex:1;min-width:200px;font-size:14px}
.hnx .why b{display:block}
.hnx .why span{font-size:12.5px;color:var(--muted)}
.hnx.hot{border-color:var(--accent)}
.hubgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;padding:0 14px 14px}
.hubbox{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:8px;align-content:start}
.hrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;padding:6px 0;border-bottom:1px solid var(--line)}
.hrow:last-child{border-bottom:0}
.hrow .t{flex:1;min-width:150px}
.hrow .t small{display:block;color:var(--muted);font-size:12px}
.hsteps{display:flex;gap:4px;flex-wrap:wrap}
.hsteps i{font-style:normal;font-size:11.5px;font-weight:700;border-radius:999px;padding:1px 8px;background:var(--surface);border:1px solid var(--line);color:var(--muted)}
.hsteps i.on{background:var(--s-c);color:var(--s-c-t);border-color:transparent}
.hempty{font-size:13.5px;color:var(--muted)}
.hlink{overflow-wrap:anywhere;font-size:13px}
.htabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:12px 14px 0;border-bottom:1px solid var(--line)}
.htabs::-webkit-scrollbar{display:none}
.htabs button{flex:none;border:0;background:none;padding:10px 12px;min-height:44px;font:inherit;font-size:14px;font-weight:700;color:var(--muted);border-bottom:3px solid transparent;cursor:pointer}
.htabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--accent)}
.htabs button b{background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:0 7px;font-size:12px;margin-left:4px}
.hbody{padding:14px;display:grid;gap:12px}
.hubtopbar{padding:10px 14px 0}
.ccmore summary{cursor:pointer;font-size:13px;font-weight:700;color:var(--muted)}
.ccard{margin:14px 14px 0;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;display:grid;gap:12px;box-shadow:var(--shadow)}
.cchead{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.ccav{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:22px;color:#fff;background:linear-gradient(135deg,var(--accent),var(--head2,#5A1E8C));flex:none}
.ccid{flex:1;min-width:180px;display:grid;gap:2px}
.ccid b{font-size:20px;line-height:1.2}
.ccid span{font-size:14px;color:var(--muted)}
.ccacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.ccacts a,.ccacts button{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:60px;justify-content:center;border:1px solid var(--line);background:var(--bg);border-radius:14px;color:var(--ink);text-decoration:none;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.ccacts a span,.ccacts button span{font-size:20px;line-height:1}
.ccacts .off{opacity:.4;pointer-events:none}
.cclines{display:grid;gap:0;border-top:1px solid var(--line)}
.ccl{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
.ccl:last-child{border-bottom:0}
.ccl .k{width:92px;flex:none;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.ccl .v{flex:1;min-width:0;overflow-wrap:anywhere}
.ccl .add{color:var(--accent);font-weight:700;background:none;border:0;padding:0;font:inherit;cursor:pointer}
</style>`); }catch(err){ console.warn("[hub] style",err); } })();

// Does free text (a title, org, name) belong to this partner?
function hubKeys(p){
  const clean=s=>String(s||"").replace(/\(.*?\)/g,"").replace(/\s+—.*$/,"").trim().toLowerCase();
  const keys=new Set(); const org=clean(p.org), name=clean(p.name);
  if(org.length>=4) keys.add(org);
  const w=org.split(/\s+/).filter(Boolean); if(w.length>=2) keys.add(w.slice(0,2).join(" "));
  if(name.length>=4&&name!==org) keys.add(name);
  const paren=(String(p.org||"").match(/\(([^)]+)\)/)||[])[1]; if(paren&&paren.length>=3) keys.add(paren.toLowerCase());
  return [...keys];
}
function hubMatch(p,...texts){ const hay=texts.map(x=>String(x||"").toLowerCase()).join(" | "); if(!hay.trim()) return false; return hubKeys(p).some(k=>hay.includes(k)); }

function hubOutbox(p){ return (S.outbox||[]).filter(x=>x.pid===p.id||(!x.pid&&hubMatch(p,x.title,x.name,x.to&&x.to===p.email?p.org:""))); }
function hubBadges(p){ return (S.badges||[]).filter(b=>b.pid===p.id||hubMatch(p,b.org)); }
function hubLinks(p){
  const out=[]; const add=(label,url)=>{ if(url&&/^https?:/i.test(url)&&!out.some(o=>o.url===url)) out.push({label,url}); };
  add("Pitch deck",p.deckUrl); add("Deck",typeof p.deck==="string"?p.deck:""); add("UTM link",p.utmLink); add("Flyer",p.flyerUrl||p.flyerLink);
  add("Budget",typeof p.budget==="string"?p.budget:(p.budget&&p.budget.url)); add("MSA",typeof p.msa==="string"?p.msa:(p.msa&&p.msa.url));
  (S.utm||[]).filter(u=>u.pid===p.id||u.link===p.utmLink||hubMatch(p,u.material,u.where)).forEach(u=>add("UTM · "+(u.material||u.camp||"link"),u.link));
  (S.links||[]).filter(l=>l.pid===p.id||hubMatch(p,l.label,l.partner)).forEach(l=>add(l.label||"Link",l.url));
  return out;
}

// "Do next": plain rules over data she already keeps — each one says why, and one tap does it.
function hubNext(p){
  const n=[]; const ds=daysSince(p.lastContact); const tasks=pTasks(p).filter(t=>t.status!=="Complete");
  const late=tasks.filter(t=>typeof isLate==="function"&&isLate(t));
  const drafts=hubOutbox(p).filter(x=>x.status!=="approved");
  if(drafts.length) n.push({hot:1,t:`Review ${drafts.length} email draft${drafts.length>1?"s":""} waiting`,w:"Approve sends it to your Outlook Drafts",b:`<button class="pbtn main" data-hubob="${esc(drafts[0].id)}">Open draft</button>`});
  if(p.stage==="Emailed"&&ds!=null&&ds>=7) n.push({hot:1,t:`Follow up — quiet ${ds} days`,w:"No reply since your last email",b:`<button class="pbtn main" data-pact="draft">✍️ Draft follow-up</button>`});
  if(!p.email) n.push({t:"Add their email",w:"Drafts can't go out without it",b:`<button class="pbtn" data-pact="edit">✏️ Add email</button>`});
  if(late.length) n.push({hot:1,t:`${late.length} overdue task${late.length>1?"s":""}`,w:late.map(t=>t.title).slice(0,2).join(" · "),b:`<button class="pbtn" data-goto="${esc(late[0].id)}">Open task</button>`});
  if(p.needsKit&&typeof kitLeft==="function"&&kitLeft(p)>0) n.push({t:`Finish the kit — ${kitLeft(p)} left`,w:"Slide, MSA and budget for this partner",b:`<button class="pbtn" data-hubtab="kit">📁 Open kit</button>`});
  const needBadge=hubBadges(p).filter(b=>b.status!=="Made");
  if(needBadge.length) n.push({t:`${needBadge.length} badge${needBadge.length>1?"s":""} still needed`,w:needBadge.map(b=>b.name).join(", "),b:`<button class="pbtn main" data-btgo="${esc(needBadge[0].id)}">🪪 Make badge</button>`});
  if(!String(p.nextStep||"").trim()) n.push({t:"Set a next step",w:"Every partner should have one concrete action",b:`<button class="pbtn" data-hubfocus="next">Set it</button>`});
  return n.slice(0,3);
}

function vcardOf(p){ const e=v=>String(v||"").replace(/[\;,]/g,m=>"\\"+m).replace(/\n/g,"\\n"); const nm=String(p.name||p.org||"").trim(); const parts=nm.split(/\s+/);
  return ["BEGIN:VCARD","VERSION:3.0",`N:${e(parts.slice(1).join(" "))};${e(parts[0]||"")};;;`,`FN:${e(nm)}`,p.org?`ORG:${e(p.org)}`:"",p.role?`TITLE:${e(p.role)}`:"",p.phone?`TEL;TYPE=WORK,VOICE:${e(p.phone)}`:"",p.email?`EMAIL;TYPE=WORK:${e(p.email)}`:"",`NOTE:${e(["Partner via Dimension Energy",p.source?"Source: "+p.source:"",p.summary||""].filter(Boolean).join(" — "))}`,"END:VCARD"].filter(Boolean).join("\r\n"); }
async function hubSaveContact(p){ const vcf=vcardOf(p), file=String(p.name||p.org||"contact").replace(/[^\w]+/g,"_")+".vcf";
  try{ if(S.dl){ await S.dl.save({filename:file,data:new TextEncoder().encode(vcf)}); toast("📇 Contact saved — open the file to add it to your phone"); return; } }catch(err){ if(err&&err.code==="cancelled") return; console.warn("[contact] save",err); }
  const a=document.createElement("a"); a.href="data:text/vcard;charset=utf-8,"+encodeURIComponent(vcf); a.download=file; document.body.appendChild(a); a.click(); a.remove(); toast("📇 Contact file downloaded"); }
function hubContactHTML(p){ const nm=p.name&&p.name!==p.org?p.name:"", org=p.org||p.name||"", tel=String(p.phone||"").replace(/[^\d+]/g,"");
  const act=(href,ic,l,on)=>on?`<a href="${esc(href)}" target="_blank" rel="noopener"><span aria-hidden="true">${ic}</span>${l}</a>`:`<a class="off" aria-disabled="true"><span aria-hidden="true">${ic}</span>${l}</a>`;
  const line=(k,v,copy,missing)=>`<div class="ccl"><span class="k">${k}</span><span class="v">${v?esc(v):`<button class="add" data-pact="edit">+ Add ${missing||k.toLowerCase()}</button>`}</span>${v&&copy?`<button class="mini" data-pcopy="${esc(v)}">Copy</button>`:""}</div>`;
  return `<section class="ccard" aria-label="Contact card">
    <div class="cchead"><div class="ccav" aria-hidden="true">${esc(initials(nm||org))}</div>
      <div class="ccid"><b>${esc(nm||org)}</b>${p.role?`<span>${esc(p.role)}</span>`:""}${nm?`<span>${esc(org)}</span>`:""}</div>
      <button class="mini" data-pact="edit">✏️ Edit</button></div>
    <div class="ccacts">${act("tel:"+tel,"📞","Call",!!tel)}${act("sms:"+tel,"💬","Text",!!tel)}${act("mailto:"+(p.email||""),"✉️","Email",!!p.email)}<button type="button" data-ccsave><span aria-hidden="true">📇</span>Save</button></div>
    <details class="ccmore"><summary>Contact details</summary><div class="cclines">${line("Phone",p.phone,true)}${line("Email",p.email,true)}${p.source?line("Met at",p.source):""}${(p.owner||p.owner2)?line("DRE lead",[p.owner,p.owner2].filter(Boolean).join(" · ")):""}${p.reach?line("LMI reach",p.reach):""}</div>
    ${p.summary?`<div style="font-size:14px;margin-top:8px">${esc(p.summary)}</div>`:""}
    ${p.notes?`<div style="white-space:pre-line;font-size:13.5px;margin-top:8px;color:var(--muted)">${esc(p.notes)}</div>`:""}</details>
  </section>`; }
// Pull the pieces of the existing partner card so every button keeps its proven behavior.
function crmParts(p){ const t=document.createElement("template"); t.innerHTML=crmHTML(p); const c=t.content.querySelector(".crm")||t.content;
  const q=s=>{ const el=c.querySelector(s); return el?el.outerHTML:""; };
  const stepsEl=c.querySelector(".steps"); const tlEl=c.querySelector(".tl"); const tlAll=c.querySelector('[data-pact="tlall"]');
  const emailEl=[...c.querySelectorAll(".crmbox")].find(x=>x.querySelector("[data-pbody]"));
  return { steps:stepsEl?stepsEl.parentElement.outerHTML:"", row:q(".crmrow"), kit:q(".kitbar"), email:emailEl?emailEl.outerHTML:"", log:q(".logbox"),
    tl:(tlEl?tlEl.outerHTML:`<div class="hempty">Nothing logged yet.</div>`)+(tlAll?tlAll.outerHTML:""), panel:q(".ppanel"),
    kitBtns:[...c.querySelectorAll('.crmfoot [data-pact]')].filter(b=>/^(budget|msa|deck|savings|abp)$/.test(b.dataset.pact)).map(b=>b.outerHTML).join("") }; }
S.hubTab="today";
const HUB_TABS=[["today","Today"],["email","Email"],["kit","Kit"],["people","People"],["links","Links"],["history","History"]];
function hubHTML(p){
  const org=p.org||p.name; const ed=S.pEdit===p.id;
  if(S.pPanel&&S.pPanel.id===p.id) S.hubTab="kit";
  const tab=HUB_TABS.some(t=>t[0]===S.hubTab)?S.hubTab:"today";
  const nx=hubNext(p)[0], ob=hubOutbox(p), bd=hubBadges(p), ln=hubLinks(p);
  const open=pTasks(p).filter(t=>t.status!=="Complete");
  const cnt={email:ob.filter(x=>x.status!=="approved").length,people:bd.filter(b=>b.status==="Needed").length,today:0,kit:0,links:0,history:0};
  const parts=ed?null:crmParts(p);
  let body="";
  if(ed) body=pFormHTML(p,false);
  else if(tab==="today") body=`${parts.steps}${parts.row}
    <div class="hubbox"><h4>Tasks <span>${open.length}</span></h4>${open.length?open.map(t=>`<div class="hrow" data-goto="${esc(t.id)}" role="button" tabindex="0" style="cursor:pointer"><span class="t">${esc(t.title)}<small>${esc(t.status)}${t.dueDate?" · due "+esc(fmtDue(t)):""}</small></span><span aria-hidden="true">›</span></div>`).join(""):`<div class="hempty">No open tasks. Type a next step above and tap ➕ Task.</div>`}</div>`;
  else if(tab==="email") body=`${ob.length?`<div class="hubbox"><h4>Waiting in Outbox</h4>${ob.map(x=>`<div class="hrow"><span class="t">${esc(x.title||x.subject||"Draft")}<small>${x.status==="approved"?"✅ In your Outlook Drafts":"Waiting for your OK"} · ${esc(fmtShort(x.at))}</small></span><button class="mini" data-hubob="${esc(x.id)}">Open</button></div>`).join("")}</div>`:""}${parts.email}`;
  else if(tab==="kit") body=`${parts.kit}<div class="pbtns">${parts.kitBtns}</div>${parts.panel}`;
  else if(tab==="people") body=`<div class="hubbox">${bd.length?bd.map(btRowHTML).join(""):`<div class="hempty">No designees yet.</div>`}
      <div class="nextbox"><input data-btname placeholder="Designee's full name" aria-label="Designee's full name"><button class="pbtn" data-btadd>🪪 Add + make badge</button></div></div>
    <div class="pbtns"><button class="pbtn" data-hubgo="amb">🦋 Add an ambassador</button></div>`;
  else if(tab==="links") body=`<div class="hubbox">${ln.length?ln.map(l=>`<div class="hrow"><span class="t">${esc(l.label)}<small class="hlink">${esc(l.url)}</small></span><a class="mini" href="${esc(l.url)}" target="_blank" rel="noopener">Open</a><button class="mini" data-pcopy="${esc(l.url)}">Copy</button></div>`).join(""):`<div class="hempty">No links yet.</div>`}${lfHTML(p)}</div>`;
  else if(tab==="history") body=`${parts.log}${parts.tl}`;
  return `<div class="hub">
  <div class="pcard${p.tier===TIERS[0]?" prio":""}" data-pid="${esc(p.id)}" style="--sc:${ssVar(p)};--pc2:${priVar(priOf(p))}">
    ${hubContactHTML(p)}
    ${autoHTML(p)}
    ${nx?`<div class="hubnext"><div class="hnx hot"><div class="why"><b>${esc(nx.t)}</b><span>${esc(nx.w)}</span></div>${nx.b}</div></div>`:""}
    <div class="hubtopbar"><button class="mini" data-hubback>← All partners</button></div>
    <div class="htabs" role="tablist" aria-label="${esc(org)}">${HUB_TABS.map(([k,l])=>`<button role="tab" data-hubtab="${k}" aria-selected="${tab===k}">${l}${cnt[k]?` <b>${cnt[k]}</b>`:""}</button>`).join("")}</div>
    <div class="hbody" role="tabpanel">${body}</div>
  </div></div>`;
}

function hubOpen(id){ if(S.hub!==id) S.hubTab="today"; S.view="partners"; S.hub=id; S.pOpen=id; S.pEdit=null; S.pPanel=null; S.pSSMenu=null; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); }
function hubClose(){ const id=S.hub; S.hub=null; S.pOpen=null; S.pEdit=null; S.pPanel=null; render();
  requestAnimationFrame(()=>{ const el=id&&document.querySelector(`.pcard[data-pid="${CSS.escape(id)}"]`); el&&el.scrollIntoView({block:"center"}); }); }
document.addEventListener("click",e=>{
  if(S.view!=="partners"||!S.hub) return;
  if(e.target.closest("[data-hubback]")){ hubClose(); return; }
  const ob=e.target.closest("[data-hubob]"); if(ob){ S.obSel=ob.dataset.hubob; S.view="outbox"; render(); window.scrollTo&&window.scrollTo({top:0}); return; }
  const go=e.target.closest("[data-hubgo]"); if(go){ const k=go.dataset.hubgo; const p=S.partners.find(x=>x.id===S.hub);
    if(k==="badges"){ S.view="badges"; render(); return; }
    if(k==="des"&&p&&!(S.des&&S.des.org)){ S.des={...S.des,org:p.org||p.name,email:p.email||"",phone:p.phone||""}; try{ localStorage.setItem("ws.des",JSON.stringify(S.des)); }catch(err){ console.warn("[hub] des",err); } }
    if(k==="amb"&&p&&!(S.amb&&S.amb.name)){ S.amb={...S.amb,org:p.org||"",partner:p.org||p.name}; try{ localStorage.setItem("ws.amb",JSON.stringify(S.amb)); }catch(err){ console.warn("[hub] amb",err); } }
    S.view="tools"; S.toolApp=k; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  const tb=e.target.closest("[data-hubtab]"); if(tb){ S.hubTab=tb.dataset.hubtab; if(S.pPanel&&S.hubTab!=="kit") S.pPanel=null; renderList(); return; }
  if(e.target.closest("[data-ccsave]")){ const p=S.partners.find(x=>x.id===S.hub); if(p) hubSaveContact(p); return; }
  if(e.target.closest("[data-hubfocus]")){ const i=document.querySelector(`#list [data-pnext]`); i&&(i.focus(),i.scrollIntoView({block:"center"})); }
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.view==="partners"&&S.hub&&!["INPUT","TEXTAREA","SELECT"].includes((e.target.tagName||"").toUpperCase())) hubClose(); });

// Leaving Partners closes the hub, so the Partners tab always opens on the list.
{ const _render=render; render=function(){ if(S.view!=="partners") S.hub=null; return _render.apply(this,arguments); }; }
