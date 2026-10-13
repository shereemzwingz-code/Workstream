// ---- "▶ Do it all" (Oct 13 2026): one button on every partner that runs every automation that applies,
// in order, and shows a checklist. Anything that needs you stops at that step and says exactly why.
// Nothing is sent: emails land in your Outbox for approval; printing and Giftbit stay manual.
S.auto={}; // pid -> [{k,label,st:'wait'|'run'|'done'|'skip'|'need',msg}]
const AUTO_STEPS=[["followup","✉️ Follow-up email"],["link","🔗 Tracked link"],["flyer","📄 QR + flyer"],["badges","🪪 Designee badges"]];
function autoSet(pid,k,st,msg){ const list=S.auto[pid]; const it=list&&list.find(x=>x.k===k); if(it){ it.st=st; it.msg=msg||""; } autoPaint(pid); }
function autoPaint(pid){ const box=document.querySelector(`[data-autobox="${CSS.escape(pid)}"]`); if(box) box.outerHTML=autoHTML((S.partners||[]).find(p=>p.id===pid)||{id:pid}); }
const AUTO_IC={wait:"○",run:"⏳",done:"✓",skip:"–",need:"!"};
function autoHTML(p){ const list=S.auto[p.id], busy=S.autoBusy===p.id;
  return `<div class="autobox" data-autobox="${esc(p.id)}">
    <button class="pbtn main autogo" data-autogo${busy?" disabled":""}>${busy?"⏳ Working…":"▶ Do it all for me"}</button>
    ${list?`<ul class="autolist">${list.map(x=>`<li class="a-${x.st}"><span class="ai" aria-hidden="true">${AUTO_IC[x.st]}</span><span><b>${esc(x.label)}</b>${x.msg?`<small>${esc(x.msg)}</small>`:""}</span></li>`).join("")}</ul>`
      :`<div class="hempty">Drafts the follow-up, makes their link, QR + flyer, and builds any designee badges — whatever applies. Emails wait in your Outbox for your OK.</div>`}
  </div>`; }
(function(){ try{ document.head.insertAdjacentHTML("beforeend",`<style>
.autobox{margin:12px 14px 0;display:grid;gap:8px}
.autogo{min-height:48px;font-size:15px;justify-content:center}
.autolist{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.autolist li{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line);font-size:14px}
.autolist li small{display:block;color:var(--muted);font-size:12.5px}
.autolist .ai{width:22px;height:22px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;background:var(--surface);border:1px solid var(--line)}
.autolist .a-done .ai{background:var(--s-c);color:var(--s-c-t);border-color:transparent}
.autolist .a-need{border-color:var(--accent)} .autolist .a-need .ai{background:var(--accent);color:var(--accent-ink);border-color:transparent}
.autolist .a-skip{opacity:.65}
</style>`); }catch(err){ console.warn("[auto] style",err); } })();

async function autoRun(pid){
  if(S.autoBusy) return; let p=(S.partners||[]).find(x=>x.id===pid); if(!p) return;
  S.autoBusy=pid; S.auto[pid]=AUTO_STEPS.map(([k,label])=>({k,label,st:"wait",msg:""})); autoPaint(pid);
  const fresh=()=>(S.partners||[]).find(x=>x.id===pid)||p;
  try{
    // 1. Follow-up email → Outbox (only when it's due)
    autoSet(pid,"followup","run","Checking…");
    { const ds=daysSince(p.lastContact), pending=hubOutbox(p).some(x=>x.status!=="approved");
      if(pending) autoSet(pid,"followup","skip","A draft is already waiting in your Outbox.");
      else if(!p.email) autoSet(pid,"followup","need","Add their email (tap ✏️ Edit on the card).");
      else if(!(p.stage==="Emailed"&&ds!=null&&ds>=7)) autoSet(pid,"followup","skip",p.lastContact?`Not due — last touch ${ds} day${ds===1?"":"s"} ago.`:"Not emailed yet — send your first email from the Email tab.");
      else if(!S.sample) autoSet(pid,"followup","need","Open Workstream in claude.ai so Claude can draft it.");
      else { autoSet(pid,"followup","run","Drafting in your voice…");
        const {text}=await S.sample(partnerPrompt(p),{modelTier:"default",cache:false});
        await qcol().add({at:new Date().toISOString(),kind:"followup",title:"✉️ Follow-up for "+(p.org||p.name),to:p.email,name:p.name||p.org,pid:p.id,tid:"",body:text,conf:confOf(text)[0],by:"agent"});
        autoSet(pid,"followup","done","In your Outbox — 3 versions, waiting for your OK."); } }
    // 2. Tracked link
    p=fresh(); autoSet(pid,"link","run","Checking…");
    if(p.utmLink) autoSet(pid,"link","done","Already made.");
    else if(!p.enrollBase||!p.project) autoSet(pid,"link","need","Add their Ampion page + project once in the Links tab.");
    else { const r=await lfMakeLink(p,p.enrollBase,p.project); autoSet(pid,"link",r.why?"need":"done",r.why||"Saved to your UTM log and their timeline."); }
    // 3. QR + flyer
    p=fresh(); autoSet(pid,"flyer","run","Checking…");
    if(!p.utmLink) autoSet(pid,"flyer","skip","Needs the tracked link first.");
    else if(p.flyerUrl&&String(p.flyerLink||"")===String(p.utmLink)) autoSet(pid,"flyer","done","Already made.");
    else if(!S.mcp) autoSet(pid,"flyer","need","Allow Canva + Google Drive for this page (Permissions menu).");
    else { autoSet(pid,"flyer","run","Making it in Canva… about 30 seconds"); const url=await flyerCanva(p,null); autoSet(pid,"flyer",url?"done":"need",url?"Saved to your Link Log and their timeline.":"Canva stopped — the message on screen says why."); }
    // 4. Designee badges
    p=fresh(); const need=hubBadges(p).filter(b=>b.status==="Needed"); autoSet(pid,"badges","run","Checking…");
    if(!need.length) autoSet(pid,"badges","skip","No designees waiting on a badge.");
    else if(!S.mcp) autoSet(pid,"badges","need",`${need.length} waiting — allow Canva, Google Drive + Microsoft 365 for this page.`);
    else { let ok=0, stuck=[];
      for(const bd of need){ autoSet(pid,"badges","run",`Making ${bd.name}'s badge…`); await badgeOneTap(bd); const b2=(S.badges||[]).find(x=>x.id===bd.id)||bd; if(b2.status==="Made") ok++; else stuck.push(bd.name); }
      autoSet(pid,"badges",stuck.length?"need":"done",(ok?`${ok} ready to print. `:"")+(stuck.length?`Needs you: ${stuck.join(", ")} — see the People tab.`:"")); }
    const L=S.auto[pid]; agLog(`Do it all — ${p.org||p.name}: `+L.map(x=>`${x.label.replace(/^\S+\s/,"")} ${x.st}`).join(" · "),{act:"auto",ref:pid});
  }catch(err){ const cur=(S.auto[pid]||[]).find(x=>x.st==="run"); if(cur) autoSet(pid,cur.k,"need","Stopped: "+((err&&err.message)||"try again"));
    agLog("Do it all stopped for "+(p.org||p.name)+": "+((err&&err.message)||""),{act:"error",ref:pid}); }
  finally{ S.autoBusy=null; autoPaint(pid); }
}
document.addEventListener("click",e=>{ if(!e.target.closest("[data-autogo]")||S.view!=="partners"||!S.hub) return; autoRun(S.hub); });
