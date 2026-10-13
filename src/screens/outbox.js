// ---- Outbox v3: its own mailbox screen. List (grouped by who it's for) → open one → read, edit, ✅ approve to your Outlook Drafts. Nothing is ever sent for you.
function isAmb(p){ return !!p&&(p.kitType==="ambassador"||/ambassador/i.test(p.role||"")); }
const OB_GROUPS=[["amb","🦋 Ambassadors"],["partner","🤝 Partners"],["team","🗣️ CP & team"],["other","📝 Other drafts"]];
function obGroup(x){ const p=x.pid&&(S.partners||[]).find(q=>q.id===x.pid); if(p) return isAmb(p)?"amb":"partner"; if(/ambassador/i.test(x.title||"")) return "amb"; if(x.kind==="cp"||x.tid) return "team"; return "other"; }
function obVersions(body){ const parts=String(body||"").split(/^\s*===\s*(.+?)\s*===\s*$/m); const v=[]; for(let i=1;i+1<parts.length;i+=2){ const b=parts[i+1].trim(); if(b) v.push({l:parts[i].trim(),b}); } return v.length>=2?v:null; }
function obSplit(txt){ let body=String(txt||""), subj=""; const m=body.match(/^[ \t]*\**Subject:\**[ \t]*(.+)$/mi); if(m){ subj=m[1].replace(/\*\*/g,"").trim(); body=body.replace(m[0],""); } return {subj,body:body.replace(/^\s+/,"").trim()}; }
function obParts(x){ if(x.subject!=null||x.text!=null) return {subj:x.subject||"",body:x.text||""}; const vs=obVersions(x.body); return obSplit(vs?vs[0].b:x.body); }
function obHtml(t){ return String(t||"").trim().split(/\n{2,}/).map(par=>"<p>"+esc(par).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>")+"</p>").join(""); }
function obPend(){ return (S.outbox||[]).filter(x=>x.status!=="approved"); }
function obAppr(){ return (S.outbox||[]).filter(x=>x.status==="approved"); }
S.obFolder="review"; S.obSel=null;
function obRowHTML(x){ const {subj,body}=obParts(x); const [cc]=confOf(body); const ic=x.kind==="nudge"?"🔔":x.kind==="cp"?"🗣️":"✉️"; const p=x.pid&&(S.partners||[]).find(q=>q.id===x.pid);
  const who=x.name||(p&&(p.name||p.org))||x.to||"No recipient yet";
  return `<div class="obrw"><button class="obr${S.obSel===x.id?" sel":""}" type="button" data-obopen="${esc(x.id)}" aria-current="${S.obSel===x.id}"><span class="ic" aria-hidden="true">${ic}</span><span class="m"><span class="t">${esc(who)}<span class="when">${esc(fmtShort?fmtShort(x.approvedAt||x.at):"")}</span></span><span class="s">${esc(subj||x.title||"Draft")}</span><span class="p">${esc(body.replace(/\s+/g," ").slice(0,150))}</span></span><span class="r">${x.status==="approved"?`<span class="conf ok">In Outlook</span>`:cc==="check"?`<span class="conf check">Has blanks</span>`:""}</span></button><button class="obxdel" type="button" data-obdel="${esc(x.id)}" aria-label="Dismiss this draft" title="Dismiss">✕</button></div>`; }
function obGroupsHTML(list){ return OB_GROUPS.map(([k,l])=>{ const it=list.filter(x=>obGroup(x)===k); return it.length?`<div class="obg"><h4>${l} <span class="n">${it.length}</span></h4>${it.map(obRowHTML).join("")}</div>`:""; }).join(""); }
// small card on Home + Assistant: a doorway into the mailbox
function outboxHTML(limit){ const pend=obPend(), top=pend.slice(0,limit||3);
  return `<section class="hcard${pend.length?" glow":""}"><h3>📥 Outbox <span class="n">${pend.length}</span><span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0;margin-left:4px">to review</span><button class="r" data-goview="outbox">Open Outbox →</button></h3>
   ${pend.length?`<div class="ob">${top.map(obRowHTML).join("")}</div>${pend.length>top.length?`<button class="obmore" type="button" data-goview="outbox">See all ${pend.length} in the Outbox →</button>`:""}`:`<div class="emptyx">Nothing to review. New drafts from the assistant land in your Outbox.</div>`}</section>`; }
function obSideHTML(){ const P=obPend().length, A=obAppr().length, list=S.obFolder==="sent"?obAppr():obPend();
  return `<div class="mbxhead"><p>Read, edit and approve. Approved emails go to your Outlook <b>Drafts</b> — you hit send from there.</p></div>
   <div class="mbxtabs" role="tablist" aria-label="Folders"><button role="tab" type="button" data-obfold="review" aria-selected="${S.obFolder!=="sent"}">📝 To review <b>${P}</b></button><button role="tab" type="button" data-obfold="sent" aria-selected="${S.obFolder==="sent"}">✅ In Outlook <b>${A}</b></button></div>
   <div class="oblist">${list.length?obGroupsHTML(list):`<div class="emptyx">${S.obFolder==="sent"?"Nothing here yet. Approve an email and it waits here until you send it from Outlook.":"🎉 All caught up. New drafts from the assistant land here."}</div>`}</div>`; }
const OB_LABELS=["Your words, polished","Short and joyful","Grounded and professional"];
const OB_HOW=["closest to how Sheree talks; keeps her own phrases","brief and upbeat, 2-4 lines","a little more formal; \"Respectfully,\" fits here"];
function obVersOf(x){ if(Array.isArray(x.vers)&&x.vers.length) return x.vers.map(v=>({l:v.l,subj:v.subj||"",body:v.body||""}));
  const vs=obVersions(x.body); if(vs) return vs.slice(0,3).map((v,i)=>{ const c=obSplit(v.b); return {l:OB_LABELS[i]||v.l,subj:c.subj,body:c.body}; });
  const c=(x.subject!=null||x.text!=null)?{subj:x.subject||"",body:x.text||""}:obSplit(x.body); return [{l:OB_LABELS[0],subj:c.subj,body:c.body}]; }
function obTabsHTML(V,vi,filling){ return OB_LABELS.map((l,i)=>i<V.length?`<button type="button" data-obv="${i}" aria-pressed="${i===vi}">${esc(l)}</button>`:`<button type="button" disabled aria-disabled="true">${filling?"✨ Writing…":esc(l)}</button>`).join(""); }
function obReaderHTML(x){ const V=obVersOf(x), vi=Math.min(+x.vi||0,V.length-1), cur=V[vi];
  const p=x.pid&&(S.partners||[]).find(q=>q.id===x.pid), to=x.to||(p&&p.email)||"";
  return `<div class="obhead"><button class="pbtn obback" type="button" data-obc="back">‹ Outbox</button><div class="obht"><b>${esc(x.title||"Draft")}</b><span>${p?esc(p.org||p.name)+" · ":""}${esc(fmtStamp(x.at))}${x.status==="approved"?" · ✅ in your Outlook drafts":""}</span></div></div>
   <div class="obform"><div class="obvsw"><span>3 versions in your voice — pick one</span><div class="seg obvs" id="obtabs" role="group" aria-label="Pick a version">${obTabsHTML(V,vi,V.length<3&&!!S.sample)}</div></div>
   <label>To<input id="obTo" type="email" inputmode="email" value="${esc(to)}" placeholder="name@example.org" autocomplete="off"></label>
   <label>Subject<input id="obSubj" value="${esc(cur.subj)}" placeholder="Subject line"></label>
   <label>Email<textarea id="obBody" spellcheck="true">${esc(cur.body)}</textarea></label>
   <div class="obremix" role="group" aria-label="Remix this version"><button class="pbtn main2" type="button" data-obr="">🔀 Remix</button><button class="pbtn" type="button" data-obr="Make it shorter and tighter.">✂️ Shorter</button><button class="pbtn" type="button" data-obr="Make it warmer and more personal, still in Sheree's own words.">💗 Warmer</button><button class="pbtn" type="button" data-obr="Make it more polished and professional.">💼 More professional</button><button class="pbtn" type="button" data-obr="Give it a completely different opening line and change the order of the ideas.">🔁 New opening</button><button class="pbtn" type="button" data-obc="undo" id="obUndo" hidden>↩ Undo</button>
     <div class="obask"><input id="obAsk" placeholder="Or tell it what to change — “mention we met at Housing Matters”, “less salesy”" aria-label="Tell the remix what to change"><button class="pbtn" type="button" data-obr="ask">Go</button></div></div>
   <div id="obMsg" class="obmsg${x.status==="approved"?" ok":""}" role="status" aria-live="polite">${x.status==="approved"?`✅ This is in your Outlook drafts.${x.olLink?` <a href="${esc(x.olLink)}" target="_blank" rel="noopener">Open in Outlook ↗</a>`:""}`:""}</div></div>
   <div class="obacts"><button class="pbtn main" type="button" data-obc="approve">${x.status==="approved"?"✅ Update Outlook draft":"✅ Approve → Outlook drafts"}</button><button class="pbtn" type="button" data-obc="save">💾 Save edits</button><button class="pbtn" type="button" data-obc="copy">📋 Copy</button><button class="pbtn" type="button" data-obc="mail">✉️ Email app</button>${x.status==="approved"?`<button class="pbtn" type="button" data-obc="sent">📨 I sent it</button>`:""}<button class="pbtn danger" type="button" data-obc="x">🗑 Dismiss</button></div>`; }
function appBarHTML(id){ const a=TOOL_APPS.find(x=>x.id===id); return `<div class="appbar apptop"><button class="pbtn" type="button" data-backtools="1">‹ Tools</button><span class="appbadge sm" style="background:${a.bg}">${a.icon}</span><b>${esc(a.name)}</b>${appCount(id)?`<span class="appcount">${appCount(id)} ${id==="outbox"?"to review":"lined up"}</span>`:""}</div>`; }
function mailboxHTML(){ const x=S.obSel&&(S.outbox||[]).find(y=>y.id===S.obSel); if(S.obSel&&!x) S.obSel=null;
  return appBarHTML("outbox")+`<div class="mbx${x?" reading":""}" id="mbx"><div class="mbxside" id="obside">${obSideHTML()}</div><div class="mbxread" id="obread" aria-label="Email">${x?obReaderHTML(x):`<div class="mbxempty"><span aria-hidden="true">✉️</span>Pick an email to read it.</div>`}</div></div>`; }
function obInitReader(){ const rd=$("obread"), x=S.obSel&&(S.outbox||[]).find(y=>y.id===S.obSel); if(!rd||!x||!$("obBody")) return;
  rd._x=x; rd._vers=obVersOf(x); rd._vi=Math.min(+x.vi||0,rd._vers.length-1); rd._undo=null; rd._start=obSnap(rd); obGrow();
  if(rd._vers.length<3&&S.sample) obFill(rd); }
function obSnap(rd){ return JSON.stringify([($("obTo")?.value||"").trim(),rd._vers,rd._vi]); }
function obStash(){ const rd=$("obread"); if(!rd||!rd._vers||!$("obBody")) return; rd._vers[rd._vi]={...rd._vers[rd._vi],subj:$("obSubj").value.trim(),body:$("obBody").value}; }
function obShow(i){ const rd=$("obread"); if(!rd||!rd._vers[i]) return; obStash(); rd._vi=i; const v=rd._vers[i]; $("obSubj").value=v.subj; $("obBody").value=v.body; rd.querySelectorAll("[data-obv]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.obv===i))); rd._undo=null; const u=$("obUndo"); if(u) u.hidden=true; obGrow(); }
function obCtx(x){ const p=x.pid&&(S.partners||[]).find(q=>q.id===x.pid); return [p?`Recipient: ${p.name||""}${p.org&&p.org!==p.name?" ("+p.org+")":""}${p.role?", "+p.role:""}`:"", x.title?"What this email is: "+x.title:""].filter(Boolean).join("\n"); }
async function obFill(rd){ const id=rd._x.id, base=rd._vers[0];
  try{ const {text}=await S.sample(`${MZW_VOICE}
${obCtx(rd._x)}
Here is the email Sheree already has. Use it as version 1 and write the other two versions from it. Keep every fact, name, date, link and the one ask. Never invent anything. Keep any [blanks] as they are.

Subject: ${base.subj}

${base.body}`,{modelTier:"default",cache:false});
    const vs=obVersions(text); const cur=$("obread"); if(!cur||!cur._x||cur._x.id!==id) return;
    if(!vs||vs.length<3){ $("obtabs").innerHTML=obTabsHTML(cur._vers,cur._vi,false); return; }
    cur._vers=[base,...vs.slice(1,3).map((v,i)=>{ const c=obSplit(v.b); return {l:OB_LABELS[i+1],subj:c.subj||base.subj,body:c.body}; })];
    $("obtabs").innerHTML=obTabsHTML(cur._vers,cur._vi,false);
    try{ await qcol().doc(id).update({vers:cur._vers,vi:cur._vi}); }catch(_){ } }
  catch(e){ const cur=$("obread"); if(cur&&cur._x&&cur._x.id===id) $("obtabs").innerHTML=obTabsHTML(cur._vers,cur._vi,false); } }
async function obRemix(how,btn){ const rd=$("obread"); if(!rd||!rd._x) return; if(!S.sample){ obMsg("Remix needs the page open in claude.ai or the Claude app.",true); return; }
  obStash(); const id=rd._x.id, i=rd._vi, cur=rd._vers[i]; if(!cur.body.trim()){ obMsg("Nothing to remix yet.",true); return; }
  const want=how||"Rewrite it so the flow and wording feel fresh: a different opening line, a different order of ideas, different word choices.";
  const all=[...rd.querySelectorAll("[data-obr]")]; all.forEach(b=>b.disabled=true); const lbl=btn.textContent; btn.textContent="🪄 Remixing…"; obMsg("");
  try{ const {text}=await S.sample(`${MZW_VOICE}
${obCtx(rd._x)}
IMPORTANT FOR THIS REQUEST: write ONE email only. Ignore the three-versions rule and do not use any "===" lines.
This is the "${OB_LABELS[i]||cur.l}" version (${OB_HOW[i]||"in her voice"}). Keep that style.
What Sheree wants changed: ${want}
Keep every fact, name, date, link and the one ask. Never invent anything new. Keep any [blanks] as they are. Start with a "Subject:" line, then the email.

Current email:
Subject: ${cur.subj}

${cur.body}`,{modelTier:"default",cache:false});
    const now=$("obread"); if(!now||!now._x||now._x.id!==id) return;
    const c=obSplit((obVersions(text)||[{b:text}])[0].b); if(!c.body) throw {message:"came back empty"};
    now._undo={i,v:{...cur}}; now._vers[i]={...cur,subj:c.subj||cur.subj,body:c.body};
    if(now._vi===i){ $("obSubj").value=now._vers[i].subj; $("obBody").value=now._vers[i].body; obGrow(); }
    const u=$("obUndo"); if(u) u.hidden=false; $("obAsk")&&($("obAsk").value=""); toast("🔀 Remixed"); obSaveEdits(true); }
  catch(e){ obMsg(e&&e.code==="not_granted"?"Choose Allow to let the page use Claude, then try Remix again.":e&&e.code==="rate_limited"?"Too many at once — wait a minute, then Remix again.":"Couldn't remix: "+esc((e&&e.message)||"try again"),true); }
  finally{ all.forEach(b=>b.disabled=false); btn.textContent=lbl; } }
function obRenderSide(){ const s=$("obside"); if(s) s.innerHTML=obSideHTML(); const c=document.querySelector(".apptop .appcount"), n=obPend().length; if(c){ if(n) c.textContent=n+" to review"; else c.remove(); } renderViews(); }
function obFields(){ return {to:($("obTo")?.value||"").trim(),subj:($("obSubj")?.value||"").trim(),body:$("obBody")?.value||""}; }
function obMsg(html,err){ const m=$("obMsg"); if(m){ m.innerHTML=html; m.className="obmsg"+(err?" err":html?" ok":""); } }
function obGrow(){ const t=$("obBody"); if(t){ t.style.height="auto"; t.style.height=Math.max(260,t.scrollHeight+4)+"px"; } }
async function obSaveEdits(quiet){ const rd=$("obread"); if(!rd||!rd._x||!rd._vers||!$("obBody")) return; obStash(); const snap=obSnap(rd); if(snap===rd._start&&quiet) return;
  const f=obFields(); try{ await qcol().doc(rd._x.id).update({to:f.to,vers:rd._vers,vi:rd._vi,subject:f.subj,text:f.body,conf:confOf(f.body)[0],editedAt:new Date().toISOString()}); rd._start=snap; if(!quiet) toast("💾 Edits saved"); }catch(err){ if(!quiet) writeErr(err); } }
async function obOpen(id){ const x=(S.outbox||[]).find(y=>y.id===id); if(!x) return; await obSaveEdits(true);
  S.obSel=id; S.obFolder=x.status==="approved"?"sent":"review";
  if(S.view!=="outbox"){ S.view="outbox"; render(); } else { $("mbx").classList.add("reading"); $("obread").innerHTML=obReaderHTML(x); obInitReader(); obRenderSide(); }
  if(window.matchMedia&&window.matchMedia("(max-width:899px)").matches) window.scrollTo&&window.scrollTo({top:0}); }
async function obBack(){ await obSaveEdits(true); S.obSel=null; if(S.view==="outbox"){ renderList(); window.scrollTo&&window.scrollTo({top:0}); } }
async function obSent(x,btn){ celebrate(btn); try{ const now=new Date().toISOString();
  if(x.pid){ const p=(S.partners||[]).find(q=>q.id===x.pid); if(p){ const patch={lastContact:now,latest:"Sent: "+x.title,latestAt:now,history:pHist(p,"✉️ Email: sent "+String(x.title||"").replace(/^[^\w]+/,""))}; if(p.stage==="To email") patch.stage="Emailed"; await pcol().doc(p.id).update(patch); } }
  if(x.tid){ const t=S.tasks.find(q=>q.id===x.tid); if(t){ const q=applyPatch(t,{},"Sent: "+x.title); if(q) await col().doc(t.id).update(q); } }
  await qcol().doc(x.id).delete(); agLog("Sent: "+x.title,{act:"sent",ref:x.pid||x.tid}); toast("✅ Logged as sent"); S.obSel=null; renderList(); }catch(err){ writeErr(err); } }
async function obApprove(btn){ const rd=$("obread"); if(!rd||!rd._x) return; const x=rd._x, f=obFields();
  if(!f.body.trim()){ obMsg("The email is empty.",true); return; }
  const tos=f.to.split(/[,;\s]+/).filter(Boolean), bad=tos.filter(a=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a));
  if(bad.length){ obMsg("Check the email address: "+esc(bad.join(", ")),true); $("obTo")?.focus(); return; }
  if(!S.mcp){ obMsg(`Microsoft 365 isn't connected on this page, so it can't reach Outlook. Use <b>✉️ Email app</b>, or open the page in claude.ai with Microsoft 365 connected.`,true); return; }
  const lbl=btn.textContent; btn.disabled=true; btn.textContent="⏳ Saving to Outlook…";
  try{ const args={subject:f.subj||x.title||"",body:obHtml(f.body),bodyType:"html"}; if(tos.length) args.to=tos;
    const r=mcpPayload(await S.mcp.callTool(M365,"outlook_create_draft",args,{cache:false}));
    const link=r.webLink||r.weblink||(r.message&&r.message.webLink)||(JSON.stringify(r).match(/https:\/\/outlook\.[^"\s]+/)||[])[0]||"";
    const now=new Date().toISOString();
    obStash(); rd._start=obSnap(rd); rd._x={...x,status:"approved",olLink:link,approvedAt:now,to:f.to,subject:f.subj,text:f.body,vers:rd._vers,vi:rd._vi};
    await qcol().doc(x.id).update({status:"approved",approvedAt:now,olLink:link,olId:r.id||r.messageId||"",to:f.to,subject:f.subj,text:f.body,vers:rd._vers,vi:rd._vi,conf:confOf(f.body)[0]});
    if(x.pid){ const p=(S.partners||[]).find(q=>q.id===x.pid); if(p){ try{ await pcol().doc(p.id).update({subject:f.subj,body:f.body,history:pHist(p,"✉️ Draft approved → Outlook drafts")}); }catch(_){ } } }
    agLog("Approved to Outlook drafts: "+(x.title||f.subj),{act:"queue",ref:x.pid||x.tid}); toast("✅ In your Outlook drafts");
    S.obFolder="sent"; obRenderSide();
    obMsg(`${/\[[^\]]{1,40}\]/.test(f.subj+" "+f.body)?"Heads up: it still has a [blank] — finish it in Outlook. ":""}✅ Saved to your Outlook <b>Drafts</b> folder. Open it there, check it, and hit send.${link?` <a href="${esc(link)}" target="_blank" rel="noopener">Open in Outlook ↗</a>`:""}`);
    btn.textContent="✅ Update Outlook draft";
    if(!rd.querySelector('[data-obc="sent"]')) rd.querySelector('[data-obc="x"]').insertAdjacentHTML("beforebegin",`<button class="pbtn" type="button" data-obc="sent">📨 I sent it</button>`);
  }catch(e){ const c=e&&e.code;
    obMsg(c==="needs_reauth"?"Microsoft 365 needs reconnecting: claude.ai → Settings → Connectors.":c==="server_not_connected"?"Connect Microsoft 365 in claude.ai → Settings → Connectors, then try again.":c==="not_in_manifest"||c==="not_granted"||c==="blocked_by_policy"?"Allow Microsoft 365 for this page (Permissions menu), then tap Approve again.":c==="rate_limited"?"Outlook is busy. Wait a minute, then tap Approve again.":"Couldn't reach Outlook: "+esc((e&&e.message)||"try again")+". Your edits are saved.",true);
    try{ await obSaveEdits(true); }catch(_){ } btn.textContent=lbl; }
  finally{ btn.disabled=false; } }
document.addEventListener("click",async e=>{
  const o=e.target.closest("[data-obopen]"); if(o){ obOpen(o.dataset.obopen); return; }
  const fo=e.target.closest("[data-obfold]"); if(fo){ S.obFolder=fo.dataset.obfold; obRenderSide(); return; }
  const rd=$("obread"); if(!rd||!rd.contains(e.target)) return;
  const v=e.target.closest("[data-obv]"); if(v){ obShow(+v.dataset.obv); return; }
  const rm=e.target.closest("[data-obr]"); if(rm){ let how=rm.dataset.obr; if(how==="ask"){ how=($("obAsk")?.value||"").trim(); if(!how){ $("obAsk")?.focus(); return; } } obRemix(how,rm); return; }
  const b=e.target.closest("[data-obc]"); if(!b) return; const a=b.dataset.obc, f=obFields();
  if(a==="back"){ obBack(); return; }
  if(a==="undo"){ if(rd._undo){ const {i,v:old}=rd._undo; rd._vers[i]=old; rd._undo=null; if(rd._vi===i){ $("obSubj").value=old.subj; $("obBody").value=old.body; obGrow(); } b.hidden=true; obSaveEdits(true); toast("↩ Back to the earlier wording"); } return; }
  if(a==="save"){ obSaveEdits(false); return; }
  if(a==="approve"){ obApprove(b); return; }
  if(a==="copy"){ const ok=await copyText((f.subj?"Subject: "+f.subj+"\n\n":"")+f.body); toast(ok?"📋 Copied":"Press and hold to copy"); return; }
  if(a==="mail"){ const u=`mailto:${encodeURIComponent(f.to)}?subject=${encodeURIComponent(f.subj)}&body=${encodeURIComponent(f.body)}`; let w=null; try{ w=window.open(u,"_blank"); }catch(_){} if(!w) location.href=u; return; }
  if(a==="sent"){ obSent(rd._x,b); return; }
  if(a==="x"){ // one tap, with Undo in the toast — no "tap again to confirm"
    const gone={...rd._x}, id=gone.id; delete gone.id;
    try{ await qcol().doc(id).delete(); S.obSel=null; renderList();
      agLog("Dismissed draft: "+(gone.title||""),{act:"queue"});
      toast("🗑 Dismissed", async()=>{ try{ await qcol().doc(id).set(gone); toast("↩ Put back"); renderList(); }catch(err){ writeErr(err); } });
    }catch(err){ writeErr(err); } } });
document.addEventListener("input",e=>{ if(e.target.id==="obBody") obGrow(); });
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-backtools]"); if(!b) return; if(S.view==="outbox") await obSaveEdits(true); S.view="tools"; S.toolApp=null; S.obSel=null; render(); window.scrollTo&&window.scrollTo({top:0}); });
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-obdel]"); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  const id=b.dataset.obdel, x=(S.outbox||[]).find(y=>y.id===id); if(!x) return;
  const gone={...x}; delete gone.id;
  try{ await qcol().doc(id).delete(); if(S.obSel===id) S.obSel=null; renderList();
    agLog("Dismissed draft: "+(gone.title||""),{act:"queue"});
    toast("\u{1F5D1} Dismissed", async()=>{ try{ await qcol().doc(id).set(gone); toast("\u21a9 Put back"); renderList(); }catch(err){ writeErr(err); } });
  }catch(err){ writeErr(err); } });
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.id==="obAsk"){ e.preventDefault(); document.querySelector('[data-obr="ask"]')?.click(); } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.view==="outbox"&&S.obSel&&!e.target.closest?.("#cmdk")) obBack(); });

