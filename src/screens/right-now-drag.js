// ---- Right now: pop-up checklist of what you can do today (overdue, due today, starred)
S.rnOpen=false; S.rnDone=new Set();
function rnItems(){ const today=ymd(new Date());
  return S.tasks.filter(t=>!t.goal&&t.owner!=="CP"&&(t.status!=="Complete"||S.rnDone.has(t.id))&&t.status!=="Waiting"&&((t.dueDate&&t.dueDate<=today)||t.priority)); }
function rnGroup(t){ const today=ymd(new Date()); if(t.dueDate&&t.dueDate<today) return 0; if(t.dueDate===today) return 1; return 2; }
function renderRN(){
  let fab=$("rnfab"), pan=$("rnpanel");
  if(!fab){ fab=document.createElement("button"); fab.id="rnfab"; fab.className="rnfab"; fab.setAttribute("aria-haspopup","dialog"); document.body.appendChild(fab);
    pan=document.createElement("section"); pan.id="rnpanel"; pan.className="rnpanel"; pan.setAttribute("role","dialog"); pan.setAttribute("aria-label","Right now"); pan.hidden=true; document.body.appendChild(pan);
    fab.onclick=()=>{ S.rnOpen=!S.rnOpen; if(!S.rnOpen) S.rnDone.clear(); renderRN(); };
    pan.addEventListener("click",e=>{ if(e.target.closest("[data-rnx]")){ S.rnOpen=false; S.rnDone.clear(); renderRN(); return; } const g=e.target.closest("[data-rngo]"); if(g){ e.preventDefault(); S.rnOpen=false; renderRN(); gotoTask(g.dataset.rngo); } });
    pan.addEventListener("change",async e=>{ const id=e.target.dataset.rn; if(!id) return; const t=S.tasks.find(x=>x.id===id); if(!t) return;
      try{ if(e.target.checked){ const p=applyPatch(t,{status:"Complete"},"Marked complete"); p.prevStatus=t.status||"In Progress"; S.rnDone.add(t.id); S.keepDone.add(t.id); await col().doc(t.id).update(p); toast("💗 Done"); }
        else { const p=applyPatch(t,{status:t.prevStatus||"In Progress"},"Reopened"); S.rnDone.delete(t.id); await col().doc(t.id).update(p); toast("Back on your list"); } }catch(err){ writeErr(err); e.target.checked=!e.target.checked; } });
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.rnOpen){ S.rnOpen=false; S.rnDone.clear(); renderRN(); } });
  }
  if(!S.loaded||!S.db){ fab.hidden=true; pan.hidden=true; return; }
  const items=rnItems(); const left=items.filter(t=>t.status!=="Complete").length;
  fab.hidden=false; fab.innerHTML=`✅ Right now <b>${left}</b>`; fab.setAttribute("aria-expanded",S.rnOpen);
  pan.hidden=!S.rnOpen; if(!S.rnOpen) return;
  const labels=["⏰ Overdue","📅 Due today","🌟 Starred"];
  let html=""; for(const g of [0,1,2]){ const its=items.filter(t=>rnGroup(t)===g).sort(cpSort); if(!its.length) continue;
    html+=`<div class="rngrp">${labels[g]}</div>`+its.map(t=>{ const d=t.status==="Complete";
      return `<label class="rnrow${d?" done":""}"><input type="checkbox" data-rn="${esc(t.id)}"${d?" checked":""}><span><span class="t">${esc(t.title)}</span>${t.nextStep?`<div class="n">${g===0?`<span class="late">Was due ${esc(fmtDue(t))} · </span>`:""}${esc(t.nextStep)}</div>`:""}<div class="n"><button class="linkbtn" style="padding:0;border:0;font-size:12px;text-decoration:underline" data-rngo="${esc(t.id)}" type="button">Open task</button></div></span></label>`; }).join(""); }
  pan.innerHTML=`<div class="rnhead"><h2>✅ Right now</h2><button class="x" data-rnx="1" aria-label="Close">✕</button></div><div class="rnsub">${left?`${left} to do · overdue, due today, and starred. Waiting items are hidden.`:"All clear for today."}</div><div class="rnlist">${html||`<div class="rnempty">Nothing due today. Star a task (🌟) to add it here.</div>`}</div>`;
}
// ---- go to task
function gotoTask(id){
  const t=S.tasks.find(x=>x.id===id); if(!t){ toast("That task was deleted"); return; }
  S.view=t.goal?"goals":"list"; S.filter="all"; S.range="all"; S.open.add(id); if(t.status==="Complete") S.showDone=true; S.closed.delete(String(t.cat));
  render();
  requestAnimationFrame(()=>{ const el=document.querySelector(`.task[data-id="${CSS.escape(id)}"]`); if(!el) return;
    el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"center"});
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); });
}
document.addEventListener("click",e=>{ const g=e.target.closest("[data-goto]"); if(g) gotoTask(g.dataset.goto); });
document.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.matches?.("[data-goto]")){ e.preventDefault(); gotoTask(e.target.dataset.goto); } });

// ---- drag to rearrange
let drag=null;
$("list").addEventListener("pointerdown",e=>{
  const h=e.target.closest(".handle"); if(!h) return;
  e.preventDefault();
  const row=h.closest(".task"); if(S.editing){ S.editing=null; }
  try{ h.setPointerCapture(e.pointerId); }catch{}
  drag={row,id:row.dataset.id,fromCat:+row.closest(".sec").dataset.cat};
  S.dragging=true; row.classList.add("dragging"); document.body.classList.add("is-dragging");
});
$("list").addEventListener("pointermove",e=>{
  if(!drag) return;
  const el=document.elementFromPoint(e.clientX,e.clientY);
  const over=el?.closest(".task"), sec=el?.closest(".sec");
  if(over && over!==drag.row){ const r=over.getBoundingClientRect(); over.parentNode.insertBefore(drag.row, e.clientY>r.top+r.height/2?over.nextSibling:over); }
  else if(!over && sec && !sec.classList.contains("closed") && sec.querySelector(".rows")!==drag.row.parentNode){ const rows=sec.querySelector(".rows"); rows.querySelector(".empty")?.remove(); rows.appendChild(drag.row); }
  if(e.clientY<70) scrollBy(0,-14); else if(e.clientY>innerHeight-70) scrollBy(0,14);
});
async function endDrag(){
  if(!drag) return;
  const {row,id,fromCat}=drag; drag=null;
  row.classList.remove("dragging"); document.body.classList.remove("is-dragging");
  const sec=row.closest(".sec"); const toCat=+sec.dataset.cat;
  const ids=[...sec.querySelectorAll(".task")].map(r=>r.dataset.id);
  const items=ids.map(i=>S.tasks.find(x=>x.id===i)).filter(Boolean);
  let slots=items.map(t=>+t.order||0).sort((a,b)=>a-b);
  if(new Set(slots).size<slots.length){ const base=slots[0]||0; slots=items.map((_,i)=>base+i*10); }
  const ops=[];
  items.forEach((t,i)=>{
    const patch={};
    if((+t.order||0)!==slots[i]) patch.order=slots[i];
    if(t.id===id && toCat!==fromCat){
      patch.cat=toCat;
      patch.history=[...(t.history||[]),{at:new Date().toISOString(),text:"Moved to "+CATS[toCat].name,changes:{cat:[CATS[fromCat].name,CATS[toCat].name]}}].slice(-60);
    }
    if(Object.keys(patch).length){ Object.assign(t,patch); ops.push(col().doc(t.id).update(patch)); }
  });
  S.dragging=false; S.pending=false; render();
  if(ops.length){ try{ await Promise.all(ops); toast(toCat!==fromCat?`${CATS[toCat].icon} Moved to ${CATS[toCat].name}`:"↕️ Order saved"); }catch(err){ writeErr(err); } }
}
$("list").addEventListener("pointerup",endDrag);
$("list").addEventListener("pointercancel",endDrag);
