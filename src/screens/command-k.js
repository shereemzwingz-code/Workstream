// ---- ⌘K: jump to any partner, task, section or tool
S.cmdk=null;
function cmdItems(q){ const w=q.toLowerCase().trim().split(/\s+/).filter(Boolean); const hit=s=>!w.length||w.every(x=>String(s).toLowerCase().includes(x)); const out=[];
  Object.entries(NAV).forEach(([id,[ic,l]])=>{ if(hit(l+" "+id)) out.push({ic,t:l,s:"Section",k:"Go",do:()=>{ S.view=id; if(S.filter==="changes") S.filter="all"; render(); }}); });
  if(typeof TOOL_APPS!=="undefined") TOOL_APPS.forEach(a=>{ if(hit(a.name+" "+a.desc)) out.push({ic:a.icon,t:a.name,s:a.desc,k:a.url?"Open ↗":"Tool",do:()=>{ if(a.url){ window.open(a.url,"_blank","noopener"); } else if(a.go){ S.view=a.go; render(); } else { S.view="tools"; S.toolApp=a.id; render(); } }}); });
  (S.partners||[]).forEach(p=>{ const t=p.org||p.name, s=[p.name!==t?p.name:"",p.ssStatus||p.stage,p.nextStep].filter(Boolean).join(" · "); if(hit(t+" "+s+" "+(p.email||"")+" "+(p.notes||""))) out.push({ic:"🤝",t,s,k:"Partner",do:()=>gotoPartner(p.id)}); });
  S.tasks.filter(t=>!t.goal).forEach(t=>{ if(hit(t.title+" "+(t.who||"")+" "+(t.nextStep||""))) out.push({ic:t.status==="Complete"?"💗":"📋",t:t.title,s:[t.status,t.who,t.dueDate?"due "+fmtDue(t):""].filter(Boolean).join(" · "),k:"Task",do:()=>gotoTask(t.id)}); });
  const rank=x=>({Go:0,Partner:1,Task:2,Tool:3,"Open ↗":3}[x.k]??4);
  return (w.length?out.sort((a,b)=>rank(a)-rank(b)):out.filter(x=>x.k==="Go"||x.k==="Partner").slice(0,14)).slice(0,24); }
function cmdkOpen(){ if(S.cmdk) return; S.cmdk={q:"",i:0}; document.body.insertAdjacentHTML("beforeend",`<div class="cmdk" id="cmdk" role="dialog" aria-label="Search"><div><div class="in"><span aria-hidden="true">🔎</span><input id="cmdkIn" placeholder="Search partners, tasks, sections and tools…" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><ul id="cmdkList" role="listbox"></ul><div class="hint"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>/</kbd> or <kbd>⌘K</kbd> from anywhere</span></div></div></div>`); cmdkRender(); setTimeout(()=>$("cmdkIn")?.focus(),30); }
function cmdkClose(){ const el=$("cmdk"); if(el) el.remove(); S.cmdk=null; }
function cmdkRender(){ const ul=$("cmdkList"); if(!ul||!S.cmdk) return; const items=cmdItems(S.cmdk.q); S.cmdk.items=items; if(S.cmdk.i>=items.length) S.cmdk.i=0;
  ul.innerHTML=items.length?items.map((x,i)=>`<li role="option" aria-selected="${i===S.cmdk.i}" data-ci="${i}"><span class="ic" aria-hidden="true">${x.ic}</span><div><div class="t">${esc(x.t)}</div>${x.s?`<div class="s">${esc(x.s)}</div>`:""}</div><span class="k">${esc(x.k)}</span></li>`).join(""):`<li><span class="ic">🤷</span><div><div class="t">No match</div><div class="s">Try part of a name</div></div></li>`;
  const sel=ul.querySelector('[aria-selected="true"]'); sel&&sel.scrollIntoView&&sel.scrollIntoView({block:"nearest"}); }
function cmdkGo(i){ const x=S.cmdk&&S.cmdk.items&&S.cmdk.items[i]; if(!x) return; cmdkClose(); x.do(); if(!/Open/.test(x.k)) window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); }
document.addEventListener("keydown",e=>{
  const inField=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); S.cmdk?cmdkClose():cmdkOpen(); return; }
  if(e.key==="/"&&!inField&&!S.cmdk){ e.preventDefault(); cmdkOpen(); return; }
  if(!S.cmdk) return;
  if(e.key==="Escape"){ e.preventDefault(); cmdkClose(); return; }
  if(e.key==="ArrowDown"){ e.preventDefault(); S.cmdk.i=Math.min((S.cmdk.items||[]).length-1,S.cmdk.i+1); cmdkRender(); return; }
  if(e.key==="ArrowUp"){ e.preventDefault(); S.cmdk.i=Math.max(0,S.cmdk.i-1); cmdkRender(); return; }
  if(e.key==="Enter"){ e.preventDefault(); cmdkGo(S.cmdk.i); } });
document.addEventListener("input",e=>{ if(e.target.id!=="cmdkIn"||!S.cmdk) return; S.cmdk.q=e.target.value; S.cmdk.i=0; cmdkRender(); });
document.addEventListener("click",e=>{ if(e.target.id==="cmdkBtn"){ cmdkOpen(); return; } const li=e.target.closest("#cmdk li[data-ci]"); if(li){ cmdkGo(+li.dataset.ci); return; } if(e.target.id==="cmdk") cmdkClose(); });
// count-up numbers on Home
function countUp(){ document.querySelectorAll(".hnum[data-n]").forEach(el=>{ const n=+el.dataset.n||0; if(!n||el.dataset.done) { el.dataset.done="1"; return; } el.dataset.done="1"; const t0=performance.now(), d=600+Math.min(600,n*20);
  const step=now=>{ const k=Math.min(1,(now-t0)/d), v=Math.round(n*(1-Math.pow(1-k,3))); el.textContent=v; if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); }
