// ---- writes
let tt; function toast(m,undo){ const e=$("toast"); e.textContent=m;
  if(undo){ const btn=document.createElement("button"); btn.type="button"; btn.className="tundo"; btn.textContent="\u21a9 Undo";
    btn.onclick=()=>{ e.classList.remove("show"); clearTimeout(tt); try{ undo(); }catch(_){ } }; e.appendChild(btn); }
  e.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>e.classList.remove("show"),undo?7000:1800); }
const col=()=>S.db.collection("data/users/"+S.uid);
function writeErr(e){ toast(e&&e.code==="quota_exceeded"?"Storage is full. Delete finished tasks to make room.":"Couldn't save. Check your connection and try again."); }

function applyPatch(t,patch,text){
  const changes={}; const out={};
  for(const [k,v] of Object.entries(patch)){
    if(v===undefined||v===null) continue;
    const nv=k==="cat"?+v:String(v);
    const ov=k==="cat"?+t[k]:String(t[k]??"");
    if(nv!==ov){ changes[k]=[k==="cat"?CATS[ov]?.name:ov, k==="cat"?CATS[nv]?.name:nv]; out[k]=nv; }
  }
  const now=new Date().toISOString();
  if(out.status==="Complete") out.doneAt=now;
  if(out.status && out.status!=="Complete" && t.status==="Complete") out.doneAt=null;
  if(!text && !Object.keys(changes).length) return null;
  const hist=[...(t.history||[]),{at:now,text:text||"Edited",changes}];
  out.history=hist.slice(-60);
  if(text){ out.latest=text; out.latestAt=now; }
  return out;
}

// ---- events
$("views").addEventListener("click",e=>{ const v=e.target.closest("[data-view]"); if(!v) return; S.view=v.dataset.view; if(S.filter==="changes") S.filter="all"; render(); });
$("hz").addEventListener("click",e=>{ const b=e.target.closest("[data-range]"); if(!b) return; S.range=b.dataset.range; render(); });
$("bar").addEventListener("click",e=>{
  const v=e.target.closest("[data-view]"); if(v){ S.view=v.dataset.view; if(S.filter==="changes") S.filter="all"; render(); return; }
  const ps=e.target.closest("[data-pstage]"); if(ps){ S.pStage=ps.dataset.pstage; renderList(); renderBar(); return; }
  if(e.target.closest("#addPartner")){ S.pAdding=true; S.pEdit=null; renderList(); setTimeout(()=>document.querySelector('.addcard [data-pf="name"]')?.focus(),50); return; }
  const b=e.target.closest("[data-filter]"); if(b){ S.filter=b.dataset.filter; render(); return; }
  if(e.target.closest("#doneToggle")){ S.showDone=!S.showDone; render(); }
});
$("bar").addEventListener("change",e=>{ if(e.target.id==="range"){ S.range=e.target.value; render(); } if(e.target.id==="sortMode"){ S.sortMode=e.target.value; render(); } });
$("list").addEventListener("click",async e=>{
  const cb=e.target.closest("[data-cal]");
  if(cb){ const a=cb.dataset.cal, m=S.calMonth;
    if(a==="prev") S.calMonth=new Date(m.getFullYear(),m.getMonth()-1,1);
    if(a==="next") S.calMonth=new Date(m.getFullYear(),m.getMonth()+1,1);
    if(a==="today"){ const n=new Date(); S.calMonth=new Date(n.getFullYear(),n.getMonth(),1); S.calSel=ymd(n); }
    renderList(); return; }
  const dy=e.target.closest("[data-day]");
  if(dy){ S.calSel=dy.dataset.day; const [y,m]=S.calSel.split("-").map(Number); if(m-1!==S.calMonth.getMonth()) S.calMonth=new Date(y,m-1,1); renderList(); return; }
  const fb=e.target.closest("[data-fin]"); if(fb){ const k=fb.dataset.fin; S.finOpen.has(k)?S.finOpen.delete(k):S.finOpen.add(k); renderList(); return; }
  const sfb=e.target.closest("[data-secf]"); if(sfb){ S.secStatus=S.secStatus||{}; S.secStatus[sfb.dataset.secf]=sfb.dataset.v; renderList(); return; }
  const sa=e.target.closest("[data-secall]"); if(sa){ if(sa.dataset.secall==="open") S.closed.clear(); else Object.keys(CATS).forEach(k=>S.closed.add(k)); renderList(); return; }
  const sh=e.target.closest("[data-sec]"); if(sh){ const k=sh.dataset.sec; S.closed.has(k)?S.closed.delete(k):S.closed.add(k); renderList(); return; }
  const row=e.target.closest(".task"); if(!row) return;
  const t=S.tasks.find(x=>x.id===row.dataset.id); if(!t) return;
  const act=e.target.closest("[data-act]")?.dataset.act;
  if(act==="cpagenda"){ const on=!t.cpAgenda; try{ await cpUpdate(t,{cpAgenda:on},on?"Added to CP agenda":"Removed from CP agenda"); toast(on?"🗣️ On the CP agenda":"Removed from CP agenda"); }catch(err){ writeErr(err); } return; }
  if(act==="star"){
    const on=!t.priority, now=new Date().toISOString();
    const hist=[...(t.history||[]),{at:now,text:on?"Marked high priority":"Removed high priority",changes:{priority:[t.priority?"High":"—",on?"High":"—"]}}].slice(-60);
    try{ await col().doc(t.id).update({priority:on,history:hist}); toast(on?"🌟 High priority":"☆ Priority removed"); }catch(err){ writeErr(err); }
    return;
  }
  if(act==="expand"){ if(S.open.has(t.id)){ S.open.delete(t.id); S.full.delete(t.id); if(S.editing===t.id) S.editing=null; } else { S.open.clear(); S.full.clear(); S.editing=null; S.open.add(t.id); } renderList(); return; }
  if(act==="full"){ S.full.has(t.id)?S.full.delete(t.id):S.full.add(t.id); S.open.add(t.id); renderList(); return; }
  if(act==="edit"){ S.editing=S.editing===t.id?null:t.id; S.open.add(t.id); renderList(); return; }
  if(act==="snooze"){ const n=+e.target.closest("[data-act]").dataset.days||1; const d=new Date(); d.setDate(d.getDate()+n); const v=ymd(d);
    const p=applyPatch(t,{dueDate:v},n===1?"Moved to tomorrow":"Moved to next week"); if(!p) return; try{ await col().doc(t.id).update(p); toast(n===1?"📅 Moved to tomorrow":"🗓️ Moved to next week"); }catch(err){ writeErr(err); } return; }
  if(act==="status"){ const v=e.target.closest("[data-act]").dataset.v; const p=applyPatch(t,{status:v},v==="Waiting"?"Marked waiting":"Back in progress"); if(!p) return; try{ await col().doc(t.id).update(p); toast(v==="Waiting"?"⏳ Marked waiting":"▶️ Back in progress"); }catch(err){ writeErr(err); } return; }
  if(act==="done"){
    if(t.status!=="Complete") celebrate(e.target.closest("[data-act]"));
    const ns=t.status==="Complete"?(t.prevStatus&&t.prevStatus!=="Complete"?t.prevStatus:"In Progress"):"Complete";
    if(ns==="Complete") S.keepDone.add(t.id); else S.keepDone.delete(t.id);
    const p=applyPatch(t,{status:ns},ns==="Complete"?"Marked complete":"Reopened");
    if(ns==="Complete") p.prevStatus=t.status||"In Progress";
    try{ await col().doc(t.id).update(p); toast(ns==="Complete"?"💗 Done! Tap 💗 again to uncheck":"🤍 Unchecked — back on your list"); }catch(err){ writeErr(err); }
    return;
  }
  if(act==="save"){
    const g=k=>row.querySelector(`[data-f="${k}"]`)?.value??"";
    const upd=g("newUpdate").trim();
    const patch={cat:g("cat"),status:g("status"),who:g("who").trim(),dueDate:g("dueDate"),dueTime:g("dueTime"),title:g("title").trim()||t.title,nextStep:g("nextStep").trim(),doneWhen:g("doneWhen").trim(),notes:g("notes")};
    const p=applyPatch(t,patch,upd||null);
    if(!p){ toast("No changes"); return; }
    try{ await col().doc(t.id).update(p); S.editing=null; toast("💾 Saved"); }catch(err){ writeErr(err); }
    return;
  }
  if(act==="delete"){
    const btn=e.target.closest("[data-act]");
    if(!btn.classList.contains("armed")){
      document.querySelectorAll("[data-act=delete].armed").forEach(b=>{b.classList.remove("armed");b.textContent=b.dataset.orig;});
      btn.dataset.orig=btn.textContent; btn.classList.add("armed"); btn.textContent="Delete?";
      toast("Tap Delete? again to remove this task");
      setTimeout(()=>{ if(btn.isConnected&&btn.classList.contains("armed")){ btn.classList.remove("armed"); btn.textContent=btn.dataset.orig; } },4000);
      return;
    }
    try{ await col().doc(t.id).delete(); S.editing=null; toast("🗑️ Deleted"); }catch(err){ writeErr(err); }
  }
});
