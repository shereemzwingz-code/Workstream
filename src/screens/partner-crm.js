// ---- Partner CRM: pipeline status (Smartsheet "Partner Status"), priority, quick log, linked tasks
const SS=["1 - Research","2 - Outreach","3 - Engagement","4 - Qualified Prospect","5 - In Negotiations","6 - Signed"];
const SSHORT=["Research","Outreach","Engagement","Qualified","Negotiating","Signed"];
const ssVar=p=>{ const n=SSN(p); return n?`var(--ss${n})`:"var(--line)"; };
const priVar=v=>v?`var(--p${v})`:"var(--p3)";
const LOGT=[["note","📝","Note",false],["call","📞","Call",true],["email","✉️","Email",true],["meet","🤝","Meeting",true]];
S.pSS="all"; S.pSSMenu=null; S.pLogType="note"; S.pJust=null; S.pTlAll=null;
function initials(s){ return String(s||"?").replace(/\(.*?\)/g,"").split(/[\s—-]+/).filter(w=>/^[A-Za-z0-9]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join("")||"?"; }
const TSTOP=new Set(["the","of","and","city","county","community","housing","illinois","chicago","east","center","family","first","national","metropolitan","house","school","high","middle","bank","group","project","services","solar","league"]);
function pTasks(p){
  const org=String(p.org||"").replace(/\(.*?\)/g,"").replace(/\s+—.*$/,"").trim().toLowerCase();
  const paren=(String(p.org||"").match(/\(([^)]+)\)/)||[])[1];
  const words=org.split(/\s+/).filter(Boolean); const keys=new Set();
  if(words.length>=2) keys.add(words.slice(0,2).join(" "));
  if(org.length>=4) keys.add(org);
  words.forEach(w=>{ const c=w.replace(/[^a-z0-9]/g,""); if(c.length>=5&&!TSTOP.has(c)) keys.add(c); });
  if(p.name&&p.name!==p.org&&String(p.name).length>5) keys.add(String(p.name).toLowerCase());
  if(paren&&paren.length>=4&&!/[,]/.test(paren)) keys.add(paren.toLowerCase());
  const K=[...keys]; if(!K.length) return [];
  return S.tasks.filter(t=>!t.goal&&K.some(k=>(String(t.title||"")+" "+String(t.who||"")).toLowerCase().includes(k)))
    .sort((a,b)=>(a.status==="Complete")-(b.status==="Complete")||String(a.dueDate||"9999").localeCompare(String(b.dueDate||"9999"))).slice(0,6);
}
function pipeHTML(){
  const all=S.partners||[]; const c=v=>all.filter(p=>(p.ssStatus||"")===v).length;
  return `<nav class="pipe" aria-label="Pipeline">${SS.map((v,i)=>`<button data-pss="${esc(v)}" aria-pressed="${S.pSS===v}" style="--sc:var(--ss${i+1})"><b>${c(v)}</b><span>${i+1} · ${SSHORT[i]}</span></button>`).join("")}<button data-pss="all" aria-pressed="${S.pSS==="all"}" style="--sc:var(--head)"><b>${all.length}</b><span>All</span></button></nav>`;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-pss]"); if(!b) return; S.pSS=S.pSS===b.dataset.pss?"all":b.dataset.pss; renderPBar(); renderList(); });
function ssMenuHTML(p){ return `<div class="ssmenu" role="group" aria-label="Move to status">${SS.map((v,i)=>`<button data-pact="ssset" data-v="${esc(v)}" aria-current="${p.ssStatus===v}" style="--sc:var(--ss${i+1})"><i></i>${esc(v)}</button>`).join("")}</div>`; }
function pCardHTML(p){
  const open=S.pOpen===p.id, ed=S.pEdit===p.id, n=SSN(p), pr=priOf(p);
  const ds=daysSince(p.lastContact), stale=p.stage==="Emailed"&&ds>=7;
  const when=p.lastContact?(stale?`⏰ ${ds} days, no reply`:`Last touch ${fmtShort(p.lastContact)}`):"No contact yet";
  const org=p.org||p.name, who=p.org&&p.name&&p.name!==p.org?p.name:"";
  const row=`<div class="prow" data-pact="toggle" role="button" tabindex="0" aria-expanded="${open}">
      <span><span class="pname">${esc(org)}</span><br><span class="porg">${esc(who)}${p.role?(who?" · ":"")+esc(p.role):""}</span>${p.needsKit?`<br><button class="kitfold${kitLeft(p)===0?" done":""}" data-pact="kitopen" title="Open the kit folder"><span aria-hidden="true">📁</span> Kit ${kitDone(p)}/${kitTotal(p)}${kitLeft(p)===0?" · all set":" · "+kitLeft(p)+" to do"}</button>`:""}</span>
      <button class="sschip" data-pact="ssmenu" aria-expanded="${S.pSSMenu===p.id}" title="Move status"><i></i>${n?esc(SSHORT[n-1]):"Set status"} ▾</button>
      <button class="prib${pr?"":" none"}" data-pact="pricycle" style="--pc2:${priVar(pr)}" title="Relationship priority — tap to change">${pr?"P"+pr:"P–"}</button>
      <span class="pnext">${p.nextStep?esc(p.nextStep):`<span class="muted" style="font-weight:400">No next step</span>`}</span>
      <span class="pwhen${stale?" stale":""}">${esc(when)}</span>
    </div>`;
  const menu=S.pSSMenu===p.id&&!open?ssMenuHTML(p):"";
  return `<div class="pcard${p.tier===TIERS[0]?" prio":""}" data-pid="${esc(p.id)}" style="--sc:${ssVar(p)};--pc2:${priVar(pr)}">${row}${menu}${open?`<div class="pdetail">${ed?pFormHTML(p,false):crmHTML(p)}</div>`:""}</div>`;
}
function crmHTML(p){
  const n=SSN(p), pr=priOf(p), org=p.org||p.name, who=p.org&&p.name&&p.name!==p.org?p.name:"";
  const hist=(p.history||[]).slice().reverse(), tlAll=S.pTlAll===p.id, tl=tlAll?hist:hist.slice(0,6);
  const tasks=pTasks(p);
  const icon=t=>{ const s=String(t||""); if(/^📞|call/i.test(s)) return "📞"; if(/^✉️|email/i.test(s)) return "✉️"; if(/^🤝|meet/i.test(s)) return "🤝"; if(/status|stage/i.test(s)) return "➜"; if(/priority/i.test(s)) return "★"; if(/budget/i.test(s)) return "💰"; if(/msa/i.test(s)) return "📝"; return "•"; };
  const kv=(k,v,copy)=>v?`<dt>${k}</dt><dd>${v}${copy?`<button class="mini" data-pcopy="${esc(copy)}">Copy</button>`:""}</dd>`:"";
  return `<div class="crm">
    <div class="crmtop"><div class="av" aria-hidden="true">${esc(initials(org))}</div>
      <div class="crmid"><h3>${esc(org)}</h3><div class="sub">${esc(who)}${p.role?(who?" · ":"")+esc(p.role):""}${p.source?` · ${esc(p.source)}`:""}</div></div>
      <div class="qa">${p.email?`<a class="pbtn main" href="mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent(p.subject||"")}&body=${encodeURIComponent(p.body||"")}" target="_blank" rel="noopener" data-pact="mailopen">✉️ ${p.body?"Open email draft":"Email"}</a>`:""}${p.stage==="To email"?`<button class="pbtn" data-pact="sent">📨 Mark emailed</button>`:""}${p.phone?`<a class="pbtn" href="tel:${esc(String(p.phone).replace(/[^0-9+]/g,""))}" target="_blank" rel="noopener">📞 Call</a>`:""}<button class="pbtn" data-pact="draft">✍️ Draft follow-up</button><button class="pbtn" data-pact="deck">📊 Pitch deck</button><button class="pbtn" data-pact="savings">📈 Savings</button></div></div>
    <div><span class="crmk">Partner status — tap a step to move</span><div class="steps" role="group" aria-label="Partner status">${SS.map((v,i)=>`<button class="step${i+1<n?" done":""}${i+1===n?" cur":""}${i+1===n&&S.pJust===p.id?" just":""}" data-pact="ssset" data-v="${esc(v)}" aria-current="${i+1===n}" style="--sc:var(--ss${i+1})"><span class="dot">${i+1<n?"✓":i+1}</span><span class="lb">${SSHORT[i]}</span></button>`).join("")}</div></div>
    ${kitBarHTML(p)}
    <div class="crmrow">
      <div><label>Priority</label><div class="seg3" role="group" aria-label="Relationship priority">${["1","2","3"].map(v=>`<button data-pact="priset" data-v="${v}" aria-pressed="${pr===v}" style="--pc2:var(--p${v})">P${v}</button>`).join("")}</div></div>
      <div><label for="stg-${esc(p.id)}">Outreach</label><select id="stg-${esc(p.id)}" data-pact="stage">${STAGES.map(t=>`<option${t===p.stage?" selected":""}>${t}</option>`).join("")}</select></div>
      <div style="flex:1;min-width:240px"><label for="nx-${esc(p.id)}">Next step</label><div class="nextbox"><input id="nx-${esc(p.id)}" data-pnext value="${esc(p.nextStep||"")}" placeholder="One concrete action"><button class="pbtn" data-pact="nextsave">Save</button><button class="pbtn" data-pact="mktask" title="Add this next step to your Tasks">➕ Task</button></div></div>
    </div>
    <div class="crmbox"><h4>✉️ Email draft${p.email?` <span class="muted" style="font-weight:600;text-transform:none;letter-spacing:0">to ${esc(p.email)}</span>`:""}</h4>
      <input data-psubj value="${esc(p.subject||"")}" placeholder="Subject" aria-label="Email subject" style="border:1.5px solid var(--line);background:var(--bg);border-radius:10px;padding:8px 10px;font-size:14px">
      <textarea data-pbody placeholder="No draft yet. Tap ✍️ Draft follow-up, or type one here." aria-label="Email draft" style="min-height:${p.body?"220px":"80px"};border:1.5px solid var(--line);background:var(--bg);border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;line-height:1.55;resize:vertical">${esc(p.body||"")}</textarea>
      <div class="pbtns"><button class="pbtn" data-pact="draftsave">💾 Save draft</button><button class="pbtn" data-pact="copy">📋 Copy email</button><button class="pbtn" data-pact="draft">✍️ Draft follow-up</button></div></div>
    <div class="logbox"><div class="ltypes" role="group" aria-label="Activity type">${LOGT.map(([k,ic,l])=>`<button data-pact="logtype" data-v="${k}" aria-pressed="${S.pLogType===k}">${ic} ${l}</button>`).join("")}</div>
      <div class="nextbox"><input type="text" data-pupd placeholder="💬 What happened? — Enter to save" aria-label="What happened with this partner"><button class="pbtn main" data-pact="log">Log it</button><button class="pbtn" data-pact="smartlog" title="Reads what happened and updates stage, next step and any tasks too">✨ Update</button></div></div>
    <div class="crmcols">
      <div class="crmbox"><h4>Contact &amp; details <button class="mini" data-pact="edit" style="margin-left:auto">✏️ Edit</button></h4><dl class="kv" style="margin:0">
        ${kv("Email",p.email?`<span>${esc(p.email)}</span>`:"",p.email)}${kv("Phone",p.phone?esc(p.phone):"",p.phone)}
        ${kv("LMI reach",esc(p.reach||""))}${kv("Group",esc(p.tier||""))}${kv("Tracker",esc(p.ssTracker||""))}${kv("DRE lead",esc([p.owner,p.owner2].filter(Boolean).join(" · ")))}
        ${kv("Summary",esc(p.summary||""))}</dl>
        ${p.notes?`<details><summary class="crmk" style="cursor:var(--cur-pointer);margin:0">Notes</summary><div style="white-space:pre-line;font-size:13.5px;margin-top:6px">${esc(p.notes)}</div></details>`:""}
        
      </div>
      <div class="crmbox"><h4>Linked tasks <span class="muted" style="font-weight:600">${tasks.length}</span></h4>
        ${tasks.length?tasks.map(t=>`<div class="ltask" data-goto="${esc(t.id)}" role="button" tabindex="0"><span class="pill ${stClass(t.status)}">${stIcon(t.status)}</span><span><b>${esc(t.title)}</b>${t.dueDate?` <span class="muted">· due ${esc(fmtDue(t))}</span>`:""}</span></div>`).join(""):`<div class="muted" style="font-size:13.5px">No tasks yet. Type a next step above and tap ➕ Task.</div>`}
        <h4 style="margin-top:6px">Activity</h4>
        ${tl.length?`<div class="tl">${tl.map(h=>`<div class="tli"><span class="ic" aria-hidden="true">${icon(h.text)}</span><div><div class="when">${esc(fmtStamp(h.at))}</div><div class="tx">${esc(h.text||"")}</div></div></div>`).join("")}</div>${hist.length>6?`<button class="mini" data-pact="tlall">${tlAll?"Show less":"Show all "+hist.length}</button>`:""}`:`<div class="muted" style="font-size:13.5px">Nothing logged yet.</div>`}
      </div>
    </div>
    ${S.pPanel&&S.pPanel.id===p.id?(S.pPanel.kind==="budget"?budgetHTML(p):S.pPanel.kind==="abp"?pAbpHTML(p):S.pPanel.kind==="deck"?deckHTML(p):S.pPanel.kind==="savings"?savHTML(p):msaHTML(p)):""}
    <div class="crmfoot"><button class="pbtn" data-pact="budget">💰 Budget</button><button class="pbtn" data-pact="msa">📝 MSA</button><button class="pbtn" data-pact="deck">📊 Pitch deck</button><button class="pbtn" data-pact="savings">📈 Savings</button>${p.designee==="Yes"?`<button class="pbtn" data-pact="abp">📋 ABP</button>`:""}<button class="pbtn" data-pact="edit">✏️ Edit all fields</button><button class="pbtn danger" data-pact="del">🗑️ Delete</button><button class="pbtn" data-pact="toggle" style="margin-left:auto">▴ Close</button></div>
  </div>`;
}
async function crmAct(act,a,p,card){
  if(act==="kit"){ const on=!p.needsKit; await pWrite(p.id,{needsKit:on,history:pHist(p,on?"Flagged for a partner kit (Budget → MSA → Slide)":"Kit flag removed")},on?"🧰 Kit started: Budget first":"Kit flag removed"); return true; }
  if(act==="kittype"){ const v=a.dataset.v; if(v===kitType(p)) return true; await pWrite(p.id,{kitType:v,history:pHist(p,"Kit type: "+KITS[v].name)},KITS[v].ic+" "+KITS[v].name); return true; }
  if(act==="kittick"){ await kitTick(p,a.dataset.v); return true; }
  if(act==="kitact"){ await kitAct(p,a.dataset.v,card); return true; }
  if(act==="ssmenu"){ S.pSSMenu=S.pSSMenu===p.id?null:p.id; renderList(); return true; }
  if(act==="ssset"){ const v=a.dataset.v, old=p.ssStatus||""; if(v===old){ S.pSSMenu=null; renderList(); return true; }
    S.pSSMenu=null; S.pJust=p.id; setTimeout(()=>{ if(S.pJust===p.id) S.pJust=null; },900);
    await pWrite(p.id,{ssStatus:v,history:pHist(p,`Partner status: ${old||"none"} → ${v}`,{ssStatus:[old,v]})},v===SS[5]?"🎉 Signed! Nice work":`➜ Moved to ${v}`); return true; }
  if(act==="pricycle"||act==="priset"){ const cur=priOf(p), v=act==="priset"?a.dataset.v:(cur==="1"?"2":cur==="2"?"3":"1"); if(v===cur) return true;
    await pWrite(p.id,{priority:+v,history:pHist(p,`Priority: ${cur?"P"+cur:"none"} → P${v}`,{priority:[cur,v]})},`★ Priority ${v}`); return true; }
  if(act==="nextsave"){ const v=(card.querySelector("[data-pnext]")?.value||"").trim(); if(v===(p.nextStep||"")) { toast("No change"); return true; }
    await pWrite(p.id,{nextStep:v,history:pHist(p,"Next step: "+(v||"(cleared)"),{nextStep:[p.nextStep||"",v]})},"💾 Next step saved"); return true; }
  if(act==="mktask"){ const v=(card.querySelector("[data-pnext]")?.value||p.nextStep||"").trim(); if(!v){ toast("Type a next step first"); return true; }
    const now=new Date().toISOString(), org=p.org||p.name;
    try{ await col().doc().set({cat:1,title:`${org} — ${v}`,status:"Not Started",who:p.name&&p.name!==p.org?p.name:"",dueDate:"",dueTime:"",nextStep:v,doneWhen:"",notes:"",priority:false,latest:"Added from partner card",latestAt:now,assignedAt:now,order:Math.max(0,...S.tasks.map(x=>+x.order||0))+10,history:[{at:now,text:"Added from the "+org+" partner card",changes:{}}]});
      if(v!==(p.nextStep||"")) await pcol().doc(p.id).update({nextStep:v,history:pHist(p,"Next step: "+v+" (added to Tasks)")});
      toast("➕ Added to your Tasks"); }catch(err){ writeErr(err); } return true; }
  if(act==="smartlog"){ const inp=card.querySelector("[data-pupd]"); const txt=(inp?.value||"").trim(); if(!txt){ inp?.focus(); return true; } if(!S.sample){ toast("Open in claude.ai for smart updates — logged as a note"); a.previousElementSibling?.click(); return true; }
    a.disabled=true; a.textContent="🪄…"; try{ const res=await S.sample.json(promptFor(`About ${p.name||""}${p.org&&p.org!==p.name?" ("+p.org+")":""} (partner id p:${p.id}): ${txt}`),{modelTier:"default",cache:false}); await applyAI(res||{},txt); inp.value=""; }catch(err){ toast("Couldn't update — logged as a note instead"); try{ await pWrite(p.id,{latest:txt,latestAt:new Date().toISOString(),history:pHist(p,txt)}); inp.value=""; }catch(_){ } } finally{ a.disabled=false; a.textContent="✨ Update"; } return true; }
  if(act==="kitopen"){ S.pOpen=p.id; S.pEdit=null; renderList(); requestAnimationFrame(()=>{ const el=document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"] .kitbar`); el&&el.scrollIntoView({behavior:"smooth",block:"start"}); }); return true; }
  if(act==="logtype"){ S.pLogType=a.dataset.v; card.querySelectorAll('[data-pact="logtype"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===S.pLogType)); card.querySelector("[data-pupd]")?.focus(); return true; }
  if(act==="log"){ const inp=card.querySelector("[data-pupd]"); const txt=(inp?.value||"").trim(); if(!txt){ inp?.focus(); return true; }
    const t=LOGT.find(x=>x[0]===S.pLogType)||LOGT[0]; const now=new Date().toISOString(); const text=(t[0]==="note"?"":`${t[1]} ${t[2]}: `)+txt;
    const patch={latest:txt,latestAt:now,history:pHist(p,text)}; if(t[3]) patch.lastContact=now; inp.value="";
    await pWrite(p.id,patch,t[3]?`${t[1]} ${t[2]} logged`:"📝 Note saved"); return true; }
  if(act==="draftsave"){ const subj=(card.querySelector("[data-psubj]")?.value||"").trim(), body=card.querySelector("[data-pbody]")?.value||"";
    if(subj===(p.subject||"")&&body===(p.body||"")){ toast("No changes"); return true; }
    await pWrite(p.id,{subject:subj,body,history:pHist(p,"Email draft updated")},"💾 Draft saved"); return true; }
  if(act==="copy"){ const subj=(card.querySelector("[data-psubj]")?.value??p.subject??""), body=(card.querySelector("[data-pbody]")?.value??p.body??"");
    const ok=await copyText((subj?`Subject: ${subj}\n\n`:"")+body); toast(ok?"📋 Email copied":"Press and hold the email text to copy it"); return true; }
  if(act==="tlall"){ S.pTlAll=S.pTlAll===p.id?null:p.id; renderList(); return true; }
  if(act==="slides"){ S.slName=p.org||p.name; S.view="slides"; render(); window.scrollTo&&window.scrollTo(0,0); toast("📊 Partner name filled in — pick a template"); return true; }
  return false;
}
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-pcopy]"); if(!b) return; e.stopPropagation(); const ok=await copyText(b.dataset.pcopy); toast(ok?"📋 Copied":"Press and hold to copy"); },true);
document.addEventListener("keydown",e=>{ if(S.view!=="partners") return;
  if((e.key==="Enter"||e.key===" ")&&e.target.matches?.('.prow[data-pact="toggle"]')){ e.preventDefault(); e.target.click(); }
  if(e.key==="Enter"&&e.target.matches?.("[data-pnext]")){ e.preventDefault(); e.target.closest(".pcard").querySelector('[data-pact="nextsave"]').click(); }
  if(e.key==="Escape"&&S.pSSMenu){ S.pSSMenu=null; renderList(); } });

function partnersHTML(){
  if(!S.pLoaded) return `<div class="empty">Loading partners…</div>`;
  const amb=S.pKind==="amb";
  const q=(S.pQ||"").trim().toLowerCase();
  let ps=q?S.partners.slice():pKindList();
  if(q){ ps=ps.filter(p=>pMatch(p,q)); }
  else if(S.pStage==="stale") ps=ps.filter(p=>p.stage==="Emailed"&&daysSince(p.lastContact)>=7);
  else if(S.pStage==="kit") ps=ps.filter(p=>p.needsKit&&kitLeft(p)>0);
  else if(S.pStage!=="all") ps=ps.filter(p=>p.stage===S.pStage);
  if(!q&&!amb&&S.pSS!=="all") ps=ps.filter(p=>(p.ssStatus||"")===S.pSS);
  ps.sort((a,b)=>String(a.org||a.name||"").localeCompare(String(b.org||b.name||""),undefined,{sensitivity:"base"}));
  const add=S.pAdding?`<div class="addcard"><h3 style="margin:0 0 8px">${amb?"➕ New ambassador":"➕ New partner"}</h3>${pFormHTML(amb?{tier:TIERS[6],stage:"Active partner",role:"Community Ambassador",needsKit:true,kitType:"ambassador"}:{tier:TIERS[6],stage:"To email"},true)}${amb?`<div class="pnote" style="margin-top:8px">Faster: Tools › 🦋 Ambassador Onboarding makes their card, link, flyer, welcome email and tasks in one go.</div>`:""}</div>`:"";
  if(!ps.length) return add+(q?`<div class="empty">No one matches “${esc(S.pQ)}”. Try part of the name.</div>`:amb?`<div class="empty">No ambassadors yet. Tap ➕ Add ambassador, or run Tools › 🦋 Ambassador Onboarding.</div>`:`<div class="empty">No partners here yet. Tap ➕ Add partner to add one.</div>`);
  const qnote=q?`<div class="muted" style="margin:4px 0 10px;font-size:14px">${ps.length} match${ps.length===1?"":"es"} for “${esc(S.pQ)}” across all stages · press Enter to open the first one</div>`:"";
  const AG=["🧰 Getting set up","💗 All set"];
  const gk=p=>(amb&&!q)?(p.needsKit&&kitLeft(p)>0?AG[0]:AG[1]):(p.ssStatus||"");
  const groups=(amb&&!q)?AG.filter(g=>ps.some(p=>gk(p)===g)):[...new Set(ps.slice().sort(ssSort).map(gk))];
  return add+qnote+(groups.length>1?`<div class="pgall"><button class="linkbtn" data-pgall="close">▸ Collapse all</button><button class="linkbtn" data-pgall="open">▾ Expand all</button></div>`:"")+groups.map(v=>{ const t=v||"No partner status yet", key=v||"_none"; const items=ps.filter(p=>gk(p)===v).sort((amb&&!q)?((a,b)=>String(a.name||a.org||"").localeCompare(String(b.name||b.org||""),undefined,{sensitivity:"base"})):ssSort); const closed=!q&&S.pgClosed.has(key)&&!items.some(p=>p.id===S.pOpen);
    return items.length?`<section class="pgroup${closed?" pclosed":""}"><h2><button class="pgtog" data-pgtog="${esc(key)}" aria-expanded="${!closed}"><span class="pgcar" aria-hidden="true">▾</span>${esc(t)} <span class="muted" style="font-size:14px;font-weight:400">${items.length}</span></button></h2>${closed?"":items.map(pCardHTML).join("")}</section>`:""; }).join("");
}
S.pgClosed=new Set((()=>{ try{ return JSON.parse(localStorage.getItem("ws.pgClosed")||"[]"); }catch(_){ return []; } })());
function pgSave(){ try{ localStorage.setItem("ws.pgClosed",JSON.stringify([...S.pgClosed])); }catch(_){} }
document.addEventListener("click",e=>{ if(S.view!=="partners") return;
  const b=e.target.closest("[data-pgtog]"); if(b){ const k=b.dataset.pgtog; S.pgClosed.has(k)?S.pgClosed.delete(k):S.pgClosed.add(k); pgSave(); renderList(); return; }
  const a=e.target.closest("[data-pgall]"); if(a){ if(a.dataset.pgall==="open") S.pgClosed.clear(); else { ["_none",...SS,"🧰 Getting set up","💗 All set"].forEach(k=>S.pgClosed.add(k)); S.pOpen=null; } pgSave(); renderList(); } });
async function copyText(txt){
  try{ await navigator.clipboard.writeText(txt); return true; }
  catch{ const ta=document.createElement("textarea"); ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); let ok=false; try{ ok=document.execCommand("copy"); }catch{} ta.remove(); return ok; }
}
function readPForm(root){ const o={}; root.querySelectorAll("[data-pf]").forEach(el=>o[el.dataset.pf]=el.value.trim()); if("kitType" in o){ o.needsKit=!!o.kitType; if(!o.kitType) delete o.kitType; } return o; }
async function pWrite(id,patch,msg){ try{ await pcol().doc(id).update(patch); if(msg) toast(msg); }catch(err){ writeErr(err); } }
function pHist(p,text,changes={}){ return [...(p.history||[]),{at:new Date().toISOString(),text,changes}].slice(-60); }
$("list").addEventListener("click",async e=>{
  const a=e.target.closest("[data-pact]"); if(!a||S.view!=="partners") return;
  const act=a.dataset.pact; S.svPg=a.dataset.v||null;
  if(act==="stage") return;
  if(act==="create"){
    const f=readPForm(a.closest(".pform")); if(!f.name){ toast("Add a name first"); return; }
    const now=new Date().toISOString();
    try{ await pcol().add({...f,order:Math.max(0,...S.partners.map(x=>+x.order||0))+1,lastContact:"",createdAt:now,history:[{at:now,text:"Added",changes:{}}]}); S.pAdding=false; toast("🤝 Partner added"); }catch(err){ writeErr(err); }
    return;
  }
  if(act==="cancel"){ S.pAdding=false; S.pEdit=null; renderList(); return; }
  const card=a.closest(".pcard"); if(!card) return;
  const p=S.partners.find(x=>x.id===card.dataset.pid); if(!p) return;
  if(act==="budget"||act==="msa"||act==="abp"||act==="deck"||act==="savings"){ S.pPanel=(S.pPanel&&S.pPanel.id===p.id&&S.pPanel.kind===act)?null:{id:p.id,kind:act}; renderList();
    if(S.pPanel){ requestAnimationFrame(()=>{ const c=[...document.querySelectorAll("#list .pcard")].find(x=>x.dataset.pid===p.id), el=c&&c.querySelector(`.ppanel[data-panel="${act}"]`);
      if(el){ el.scrollIntoView({behavior:"smooth",block:"start"}); el.classList.add("pflash"); setTimeout(()=>el.classList.remove("pflash"),1200); } }); }
    return; }
  if(await deckAct(act,p,card)) return;
  if(await crmAct(act,a,p,card)) return;
  if(await panelAct(act,p,card)) return;
  if(act==="toggle"){ S.pOpen=S.pOpen===p.id?null:p.id; S.pEdit=null; S.pPanel=null; S.pSSMenu=null; renderList(); return; }
  if(act==="edit"){ S.pEdit=p.id; renderList(); return; }
  if(act==="save"){ const f=readPForm(a.closest(".pform")); if(!f.name) f.name=p.name; await pWrite(p.id,{...f,history:pHist(p,"Edited")},"💾 Saved"); S.pEdit=null; return; }
  if(act==="copy"){ const ok=await copyText((p.subject?`Subject: ${p.subject}\n\n`:"")+(p.body||"")); toast(ok?"📋 Email copied":"Couldn't copy. Press and hold the email text to copy it."); return; }
  if(act==="draft"){ S.aiCtx={kind:"followup",pid:p.id,to:p.email||"",name:p.name||p.org}; askClaude("✍️ Follow-up to "+(p.name||p.org),partnerPrompt(p)); return; }
  if(act==="mailopen"){ if(p.stage==="To email") setTimeout(()=>toast("Sent it? Tap 📨 Mark emailed"),800); return; }
  if(act==="sent"){ const now=new Date().toISOString(); await pWrite(p.id,{stage:"Emailed",lastContact:now,history:pHist(p,"Emailed",{stage:[p.stage,"Emailed"]})},"📨 Marked emailed"); return; }
  if(act==="log"){ const inp=card.querySelector("[data-pupd]"); const txt=inp.value.trim(); if(!txt) return; inp.value=""; const now=new Date().toISOString(); await pWrite(p.id,{latest:txt,lastContact:now,history:pHist(p,txt)},"Update saved"); return; }
  if(act==="del"){
    if(!a.classList.contains("armed")){ a.classList.add("armed"); a.textContent="Delete?"; toast("Tap Delete? again to remove this partner"); setTimeout(()=>{ if(a.isConnected){ a.classList.remove("armed"); a.textContent="🗑️ Delete"; } },4000); return; }
    try{ await pcol().doc(p.id).delete(); S.pOpen=null; toast("🗑️ Deleted"); }catch(err){ writeErr(err); }
  }
});
$("list").addEventListener("change",async e=>{
  if(S.view!=="partners"||e.target.dataset.pact!=="stage") return;
  const card=e.target.closest(".pcard"); const p=S.partners.find(x=>x.id===card?.dataset.pid); if(!p) return;
  const v=e.target.value; if(v===p.stage) return;
  const patch={stage:v,history:pHist(p,"Stage: "+v,{stage:[p.stage,v]})};
  if(v==="Emailed"||v==="Call set") patch.lastContact=new Date().toISOString();
  await pWrite(p.id,patch,`${STAGE_ICON[v]} ${v}`);
});
$("list").addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches?.("[data-pupd]")){ e.preventDefault(); e.target.closest(".pcard").querySelector('[data-pact="log"]').click(); } });
function gotoPartner(id){
  S.view="partners"; S.pStage="all"; S.pOpen=id; S.pEdit=null; render();
  requestAnimationFrame(()=>{ const el=document.querySelector(`.pcard[data-pid="${CSS.escape(id)}"]`); if(!el) return; el.scrollIntoView({behavior:"smooth",block:"center"}); });
}
document.addEventListener("click",e=>{ const g=e.target.closest("[data-gotop]"); if(g) gotoPartner(g.dataset.gotop); });

$("list").addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.matches?.('.sum[data-act="expand"]')){ e.preventDefault(); e.target.click(); } });
