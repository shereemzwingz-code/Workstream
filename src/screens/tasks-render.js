// ---- dates
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function dueOf(t){ if(!t.dueDate) return null; const [y,m,d]=t.dueDate.split("-").map(Number); const [h,mi]=(t.dueTime||"23:59").split(":").map(Number); return new Date(y,m-1,d,h,mi); }
function isLate(t){ if(t.status==="Complete") return false; const d=dueOf(t); if(!d) return false; if(!t.dueTime) return t.dueDate<ymd(new Date()); return d<new Date(); }
function endOf(range){
  const n=new Date(), e=new Date(n); e.setHours(23,59,59,999);
  if(range==="today") return e;
  if(range==="week"){ e.setDate(e.getDate()+((7-e.getDay())%7)); return e; }
  if(range==="month") return new Date(n.getFullYear(),n.getMonth()+1,0,23,59,59);
  const m={m2:2,m3:3,m6:6,year:12}[range]; if(m){ e.setMonth(e.getMonth()+m); return e; }
  return null;
}
function fmtDue(t){ const d=dueOf(t); if(!d) return ""; let s=d.toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"}); if(t.dueTime) s+=" "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}); return s; }
const fmtShort=iso=>{ if(!iso) return ""; const d=new Date(iso); return isNaN(d)?"":d.toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"}); };
const fmtStamp=iso=>{ const d=new Date(iso); return isNaN(d)?"":d.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}); };

// ---- filtering
S.tQ="";
const tText=t=>[t.title,t.who,t.nextStep,t.notes,t.latest,t.doneWhen,t.status,CATS[t.cat]?.name].join(" ").toLowerCase();
document.addEventListener("input",e=>{ if(e.target.id!=="tSearch") return; S.tQ=e.target.value; const c=$("tSearchClear"); if(c) c.hidden=!S.tQ; renderList(); renderDoNow(); renderMeet(); });
document.addEventListener("click",e=>{ if(e.target.id!=="tSearchClear") return; S.tQ=""; const i=$("tSearch"); if(i){ i.value=""; i.focus(); } e.target.hidden=true; renderList(); renderDoNow(); renderMeet(); });
document.addEventListener("keydown",e=>{ if(e.target.id==="tSearch"&&e.key==="Escape"){ $("tSearchClear")?.click(); } });
function visible(){
  let ts=S.tasks.slice();
  const tq=(S.view==="list"?(S.tQ||""):"").trim().toLowerCase();
  if(tq){ const ws=tq.split(/\s+/); return ts.filter(t=>ws.every(w=>tText(t).includes(w))); }
  if(!S.showDone) ts=ts.filter(t=>t.status!=="Complete"||S.keepDone.has(t.id));
  if(S.filter==="late") ts=ts.filter(isLate);
  if(S.filter==="week"){ const e=endOf("week"); ts=ts.filter(t=>t.status!=="Complete"&&dueOf(t)&&dueOf(t)<=e); }
  if(S.filter==="waiting") ts=ts.filter(t=>t.status==="Waiting");
  if(S.filter==="prio") ts=ts.filter(t=>t.priority&&t.status!=="Complete");
  if(S.range!=="all"){
    if(S.range==="nodate") ts=ts.filter(t=>!t.dueDate);
    else { const e=endOf(S.range); ts=ts.filter(t=>dueOf(t)&&dueOf(t)<=e); }
  }
  return ts;
}
function sortT(a,b){
  const da=dueOf(a),db=dueOf(b);
  if((a.status==="Complete")!==(b.status==="Complete")) return a.status==="Complete"?1:-1;
  if(S.sortMode==="mine") return (a.order??0)-(b.order??0);
  if(!!a.goal!==!!b.goal) return a.goal?1:-1;
  if(!!a.priority!==!!b.priority) return a.priority?-1:1;
  if(da&&db&&da-db) return da-db; if(da&&!db) return -1; if(!da&&db) return 1;
  return (a.order||0)-(b.order||0);
}

// ---- render
function renderBar(){
  if(S.view!=="partners"&&$("psw")) $("psw").innerHTML="";
  if(S.view==="partners"){ renderPBar(); return; }
  if(S.view==="home"||S.view==="agent"||S.view==="goals"||S.view==="ref"||S.view==="slides"||S.view==="abp"||S.view==="cp"||S.view==="budget"||S.view==="msa"||S.view==="tools"||S.view==="badges"||S.view==="outbox"||S.view==="teams"||S.view==="flyers"||S.view==="testing"){ $("bar").innerHTML=""; return; }
  const open=S.tasks.filter(t=>t.status!=="Complete");
  const late=open.filter(isLate).length, wait=open.filter(t=>t.status==="Waiting").length, prio=open.filter(t=>t.priority).length;
  const b=(id,label,n,cls="")=>`<button class="count ${cls}" data-filter="${id}" aria-pressed="${S.filter===id}">${label}${n!==null?` <b>${n}</b>`:""}</button>`;
  $("bar").innerHTML=`<span class="barlbl">Show</span>`+b("all","All",null)+b("late","⏰ Overdue",late,"late")+b("waiting","⏳ Waiting",wait)+b("prio","🌟 Priority",prio)+b("changes","📝 Activity",null);
  if($("psw")){ if(S.view==="list"&&S.filter!=="changes"){ if(!$("tSearch")) $("psw").innerHTML=`<div class="psearch" style="display:flex;gap:8px;align-items:center;margin:8px 0 6px"><input id="tSearch" type="search" placeholder="🔎 Search tasks: name, person, next step, notes" aria-label="Search tasks" value="${esc(S.tQ||"")}" autocomplete="off" style="flex:1;min-width:0;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:10px;padding:11px 12px;font:inherit;font-size:16px"><button class="count" id="tSearchClear" type="button"${S.tQ?"":" hidden"}>✕ Clear</button></div>${S.tQ?`<div class="muted" id="tCount" style="font-size:13px;margin:0 0 4px"></div>`:""}`; } else $("psw").innerHTML=""; }
}

function sectionRows(k,items){
  const live=items.filter(t=>t.status!=="Complete"||S.keepDone.has(t.id));
  const fin=items.filter(t=>t.status==="Complete"&&!S.keepDone.has(t.id));
  const open=S.finOpen.has(String(k));
  return live.map(rowHTML).join("")+(fin.length?`<button class="finbar" data-fin="${k}" aria-expanded="${open}"><span class="chev" aria-hidden="true">▸</span> 💗 Finished <span class="fincount">${fin.length}</span></button>`+(open?`<div class="finlist">${fin.map(rowHTML).join("")}</div>`:""):"");
}
function dueToday(t){ return t.status!=="Complete"&&t.dueDate===ymd(new Date()); }
function taskDue(t){ if(t.status==="Complete") return t.doneAt?`<span class="tchip ok">💗 Done ${esc(fmtShort(t.doneAt))}</span>`:`<span class="tchip ok">💗 Done</span>`;
  if(!t.dueDate) return `<span class="tchip soft">No date</span>`;
  const d=dueOf(t), n=new Date(); n.setHours(0,0,0,0); const dd=new Date(d); dd.setHours(0,0,0,0); const diff=Math.round((dd-n)/864e5);
  const tm=t.dueTime?" "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}):"";
  if(isLate(t)) return `<span class="tchip late">⏰ ${diff===-1?"Yesterday":Math.abs(diff)+" days late"}</span>`;
  if(diff===0) return `<span class="tchip today">📅 Today${tm}</span>`;
  if(diff===1) return `<span class="tchip soon">📅 Tomorrow${tm}</span>`;
  if(diff>1&&diff<7) return `<span class="tchip soon">📅 ${d.toLocaleDateString(undefined,{weekday:"long"})}${tm}</span>`;
  return `<span class="tchip soft">📅 ${d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}${tm}</span>`; }
function rowHTML(t){
  const late=isLate(t), done=t.status==="Complete", ed=S.editing===t.id, op=S.open.has(t.id)||ed, full=ed||S.full.has(t.id), today=dueToday(t);
  const lu=t.latest?`${esc(t.latest)}${t.latestAt?`\n<span class="lu-date">${esc(fmtStamp(t.latestAt))}</span>`:""}`:`<span class="muted">—</span>`;
  const preview=`<div class="tprev">
      <div class="tp-next"><span class="k">Next step</span><div class="v">${t.nextStep?esc(t.nextStep):`<span class="muted">No next step yet. Tap ✏️ Edit to add one.</span>`}</div></div>
      ${t.latest?`<div class="tp-lu2"><span class="k">Latest</span><div class="v">${esc(String(t.latest).length>180?String(t.latest).slice(0,180)+"…":t.latest)}</div></div>`:""}
      <div class="tquick" role="group" aria-label="Quick actions">
        ${done?"":`<button class="qbtn" data-act="snooze" data-days="1">📅 Tomorrow</button><button class="qbtn" data-act="snooze" data-days="7">🗓️ Next week</button>`}
        <button class="qbtn" data-act="status" data-v="${t.status==="Waiting"?"In Progress":"Waiting"}">${t.status==="Waiting"?"▶️ Not waiting":"⏳ Waiting"}</button>
        <button class="qbtn" data-act="focus">🎯 Focus</button><button class="qbtn" data-act="edit">✏️ Edit</button><button class="qbtn" data-act="full">⤢ More</button><button class="qbtn danger" data-act="delete">🗑️</button>
      </div>
    </div>`;
  const more=`<div class="more">
      <div><span class="k">Who</span><span class="v">${t.who?esc(t.who):"—"}</span></div>
      <div><span class="k">Due</span><span class="v">${t.dueDate?esc(fmtDue(t)):"No date"}${t.assignedAt?` · assigned ${esc(fmtShort(t.assignedAt))}`:""}</span></div>
      <div><span class="k">Done when</span><span class="v">${t.doneWhen?esc(t.doneWhen):"—"}</span></div>
      <div class="full"><span class="k">Next step</span><span class="v" style="font-weight:600">${t.nextStep?esc(t.nextStep):"—"}</span></div>
      <div class="full"><span class="k">Latest update</span><span class="v">${lu}</span></div>
      ${t.notes?`<div class="full"><span class="k">Notes</span><span class="v">${esc(t.notes)}</span></div>`:""}
      ${(t.history||[]).length?`<div class="full"><span class="k">Recent history</span><div class="hist">${(t.history||[]).slice(-4).reverse().map(h=>`<div><div class="when">${esc(fmtStamp(h.at))}</div><div>${esc(h.text||"")}</div></div>`).join("")}</div></div>`:""}
      <div class="row"><button class="editbtn" data-act="edit">✏️ Edit or see history</button><button class="editbtn" data-act="cpagenda">${t.cpAgenda?"🗣️ On CP agenda ✓":"🗣️ Add to CP agenda"}</button><button class="editbtn" data-act="cpmail">✉️ Update CP</button>${t.status==="Waiting"?`<button class="editbtn" data-act="nudge">🔔 Draft a nudge</button>`:""}<button class="editbtn closebtn" data-act="full">▴ Less</button></div>
    </div>`;
  const chips=`${taskDue(t)}${!done&&t.status==="Waiting"?`<span class="tchip wait">⏳ Waiting${t.who?" on "+esc(t.who):""}</span>`:!done&&t.status==="In Progress"?`<span class="tchip ip">● In progress</span>`:""}${t.who&&t.status!=="Waiting"?`<span class="tchip who">👤 ${esc(t.who)}</span>`:""}${needsNudge(t)?`<span class="tchip nudge">🔔 ${quietDays(t)} days quiet</span>`:""}${t.cpAgenda?`<span class="tchip soft">🗣️ CP</span>`:""}`;
  return `<div class="task tc${late?" late":""}${done?" done":""}${t.priority?" prio":""}${op?" open sel":""}${today?" today":""}" data-id="${esc(t.id)}">
    <button class="tcheck" data-act="done" role="checkbox" aria-checked="${done}" aria-label="${done?"Done — tap to uncheck":"Mark done"}: ${esc(t.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div class="sum" data-act="expand" role="button" tabindex="0" aria-expanded="${op}">
      <div class="sumtop">${S.sortMode==="mine"?`<span class="handle" aria-label="Drag to move" title="Drag to move">⠿</span>`:""}<span class="tname">${esc(t.title)}</span></div>
      <div class="tchips">${chips}</div>
    </div>
    <button class="star${t.priority?" on":""}" data-act="star" aria-pressed="${!!t.priority}" aria-label="High priority: ${esc(t.title)}">${t.priority?"🌟":"☆"}</button>
    ${op?`<div class="tbody">${ed?editHTML(t):full?more:preview}</div>`:""}
  </div>`;
}

function celebrate(el,kind){ try{ kCheer(kind||"done"); }catch(_){ }
  try{ if(!el||matchMedia("(prefers-reduced-motion: reduce)").matches) return; const r=el.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const em=["💗","✨","💖","⭐","🎉"]; for(let i=0;i<10;i++){ const b=document.createElement("span"); b.className="burst"; b.textContent=em[i%em.length]; const a=(Math.PI*2*i)/10+Math.random()*.5, d=40+Math.random()*40;
    b.style.left=cx+"px"; b.style.top=cy+"px"; b.style.setProperty("--dx",Math.cos(a)*d+"px"); b.style.setProperty("--dy",Math.sin(a)*d-20+"px"); document.body.appendChild(b); setTimeout(()=>b.remove(),900); } }catch(_){} }
function editHTML(t){
  const hist=(t.history||[]).slice().reverse();
  const f=(k,l,type="text")=>`<div><label>${l}</label><input type="${type}" data-f="${k}" value="${esc(t[k]||"")}"></div>`;
  return `<div class="edit">
    <div class="efields">
      <div><label>Category</label><select data-f="cat">${Object.entries(CATS).map(([k,c])=>`<option value="${k}"${+k===+t.cat?" selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
      <div><label>Status</label><select data-f="status">${STATUSES.map(s=>`<option${s===t.status?" selected":""}>${s}</option>`).join("")}</select></div>
      ${f("who","Who")}${f("dueDate","Due date","date")}${f("dueTime","Due time","time")}
    </div>
    ${f("title","Task name")}${f("nextStep","Next step")}${f("doneWhen","Done when")}
    <div><label>New update (saved to history)</label><input type="text" data-f="newUpdate" placeholder="What happened?"></div>
    <div><label>Notes</label><textarea data-f="notes">${esc(t.notes||"")}</textarea></div>
    <div class="erow"><button class="save" data-act="save">💾 Save changes</button><button class="del" data-act="delete">🗑️ Delete task</button></div>
    <div class="muted" style="font-size:13px">Assigned ${t.assignedAt?esc(fmtStamp(t.assignedAt)):"(date not recorded)"}${t.doneAt?` · Finished ${esc(fmtStamp(t.doneAt))}`:""}</div>
    ${hist.length?`<div><label>History</label><div class="hist">${hist.map(h=>`<div><div class="when">${esc(fmtStamp(h.at))}</div><div>${esc(h.text||"")}</div>${h.changes&&Object.keys(h.changes).length?`<div class="when">${Object.entries(h.changes).map(([k,[a,b]])=>`${esc(LABEL[k]||k)}: ${esc(a||"—")} → ${esc(b||"—")}`).join(" · ")}</div>`:""}</div>`).join("")}</div></div>`:`<div class="muted" style="font-size:13px">No history yet. Updates you add are saved here.</div>`}
  </div>`;
}
const LABEL={priority:"Priority",status:"Status",dueDate:"Due",dueTime:"Time",who:"Who",nextStep:"Next step",doneWhen:"Done when",title:"Task",cat:"Category",notes:"Notes"};

function renderList(){
  const L=$("list");
  if(!S.loaded){ L.innerHTML=`<div class="empty">Loading your tasks…</div>`; return; }
  if(S.view==="home"){ L.innerHTML=homeHTML(); return; }
  if(S.view==="agent"){ L.innerHTML=agentHTML(); return; }
  if(S.view==="ref"){ L.innerHTML=refHTML(); return; }
  if(S.view==="slides"){ L.innerHTML=slidesHTML(); return; }
  if(S.view==="abp"){ L.innerHTML=abpHTML(); return; }
  if(S.view==="outbox"){ L.innerHTML=mailboxHTML(); obInitReader(); return; }
  if(S.view==="partners"){ L.innerHTML=partnersHTML(); return; }
  if(S.view==="cp"){ L.innerHTML=cpHTML(); return; }
  if(S.view==="budget"){ if(!L.querySelector("#bqform")) L.innerHTML=bqHTML(); bqOut(); return; }
  if(S.view==="msa"){ if(!L.querySelector("#mqform")) L.innerHTML=mqHTML(); mqOut(); return; }
  if(S.view==="badges"){ L.innerHTML=badgesHTML(); return; }
  if(S.view==="tools"){ const want=S.toolApp||"home"; if(!L.querySelector("#toolsroot")||L.dataset.tapp!==want){ L.innerHTML=toolsHTML(); L.dataset.tapp=want; if(want==="utm") utmBuild(); if(want==="amb") ambOut(); if(want==="des") desOut(); } utmLogOut(); if(want==="amb") ambOut(); if(want==="des") desOut(); return; }
  if(S.filter==="changes"){ L.innerHTML=feedHTML(); return; }
  if(S.view==="goals"){ L.innerHTML=goalsHTML(); return; }
  if(S.view==="cal"){ L.innerHTML=calHTML(); return; }
  if(S.view==="flyers"){ L.innerHTML=flyersHTML(); return; }
  if(S.view==="testing"){ L.innerHTML=testingHTML(); return; }
  if(S.view==="teams"){ const x=homeSec("teams"); L.innerHTML=`<section class="hcard" style="margin-top:14px"><h3>💬 Teams <span class="n">${(S.teams||[]).length}</span>${x.r}</h3><div class="hsb">${x.b}</div></section>`; return; }
  const ts=visible().filter(t=>!t.goal);
  const d=dark();
  let html="";
  for(const k of Object.keys(CATS)){
    const c=CATS[k]; const items=ts.filter(t=>+t.cat===+k).sort(sortT);
    if(!items.length && (S.filter!=="all"||(S.tQ||"").trim())) continue;
    const closed=S.closed.has(k)&&!(S.tQ||"").trim();
    S.secStatus=S.secStatus||{}; const sf=S.secStatus[k]||"all";
    const doneAll=S.tasks.filter(t=>!t.goal&&+t.cat===+k&&t.status==="Complete").sort((x,y)=>new Date(y.doneAt||0)-new Date(x.doneAt||0));
    const shown=sf==="all"?items:sf==="Complete"?doneAll:items.filter(t=>t.status===sf);
    const SF=[["all","All"],["Not Started","Not started"],["In Progress","In progress"],["Waiting","Waiting"],["Complete","💗 Done"]];
    const chips=`<div class="secf" role="group" aria-label="Filter ${esc(c.name)} by status">${SF.map(([v,l])=>`<button data-secf="${k}" data-v="${v}" aria-pressed="${sf===v}">${l} <span style="opacity:.7">${v==="all"?items.length:v==="Complete"?doneAll.length:items.filter(t=>t.status===v).length}</span></button>`).join("")}</div>`;
    html+=`<section class="sec${closed?" closed":""}" data-cat="${k}" style="--tint:${d?c.tintD:c.tint};--ch:${c.head}">
      <button class="sechead" style="--ch:${c.head}" data-sec="${k}" aria-expanded="${!closed}"><span class="caret">▾</span><span class="cicon" aria-hidden="true">${c.icon}</span><span class="secname">${esc(c.name)}</span><span class="n">${items.filter(t=>t.status!=="Complete"||S.keepDone.has(t.id)).length}</span>${closed?(()=>{ const op=items.filter(t=>t.status!=="Complete"); const lt=op.filter(isLate).length, td=op.filter(dueToday).length; const nx=op.slice().filter(t=>t.dueDate).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate)))[0]||op[0];
          return `<span class="secpeek">${lt?`<span class="tchip late">⏰ ${lt} late</span>`:""}${td?`<span class="tchip today">📅 ${td} today</span>`:""}${nx?`<span class="peeknext">Next: ${esc(nx.title)}</span>`:`<span class="peeknext">All clear 💗</span>`}<span class="sectap">Show tasks ▾</span></span>`; })():`<span class="sectap">Hide ▴</span>`}</button>
      <div class="rows">
        ${chips}${shown.length?(sf==="all"?sectionRows(k,items):shown.map(rowHTML).join("")):`<div class="empty">Nothing here for this view.</div>`}
      </div>
    </section>`;
  }
  const tq=(S.tQ||"").trim();
  if(html&&!tq){ const allClosed=Object.keys(CATS).every(k=>S.closed.has(k)); html=`<div class="secall"><button class="qbtn" data-secall="${allClosed?"open":"close"}">${allClosed?"▾ Show all tasks":"▴ Hide all tasks"}</button></div>`+html; }
  L.innerHTML=html&&(!tq||ts.length)?html:(tq?`<div class="empty">No task matches “${esc(tq)}”. Try a name, org or word from the next step.</div>`:`<div class="empty">Nothing matches. Tap "open" to see everything.</div>`);
  if(tq){ if(!$("tCount")){ const d=document.createElement("div"); d.id="tCount"; d.className="muted"; d.style.cssText="font-size:13px;margin:0 0 4px"; $("psw").appendChild(d); } $("tCount").textContent=`${ts.length} task${ts.length===1?"":"s"} match “${tq}”`; } else $("tCount")?.remove();
}
function goalsHTML(){
  return `<div class="muted" style="font-size:14px;margin-block:4px 12px">Your big targets, by category. Tap a goal to update it.</div>`+Object.keys(CATS).map(k=>{ const c=CATS[k]; const gs=S.tasks.filter(t=>t.goal&&+t.cat===+k).sort(sortT);
    return `<section class="gcard" style="--ch:${c.head}"><h3><span aria-hidden="true">${c.icon}</span>${esc(c.name)}</h3><div class="gtext"><b>Goal:</b> ${esc(c.goal)}</div>${gs.length?gs.map(rowHTML).join(""):""}</section>`; }).join("");
}
function calHTML(){
  const now=new Date();
  if(!S.calMonth) S.calMonth=new Date(now.getFullYear(),now.getMonth(),1);
  if(!S.calSel) S.calSel=ymd(now);
  const y=S.calMonth.getFullYear(), mo=S.calMonth.getMonth();
  const start=new Date(y,mo,1); start.setDate(1-start.getDay());
  const last=new Date(y,mo+1,0); const end=new Date(last); end.setDate(last.getDate()+(6-last.getDay()));
  const byDay={}; let undated=0;
  visible().forEach(t=>{ if(!t.dueDate){ undated++; return; } (byDay[t.dueDate]=byDay[t.dueDate]||[]).push(t); });
  loadMonthMeetings(y,mo); const mByDay={}; (S.mMonth[y+"-"+mo]||[]).forEach(m=>{ const k=ymd(m.start); (mByDay[k]=mByDay[k]||[]).push(m); });
  Object.values(byDay).forEach(a=>a.sort((x,z)=>(!!z.priority-!!x.priority)||String(x.dueTime||"99").localeCompare(String(z.dueTime||"99"))));
  const d=dark(), today=ymd(now);
  let cells="";
  for(let c=new Date(start); c<=end; c.setDate(c.getDate()+1)){
    const k=ymd(c), items=byDay[k]||[];
    const cls=["day",c.getMonth()!==mo?"out":"",k===today?"today":"",k===S.calSel?"sel":""].join(" ");
    const ev=t=>{ const cc=CATS[t.cat]||CATS[1]; return `style="--c:${cc.head};--ct:${d?cc.tintD:cc.tint}"`; };
    cells+=`<button class="${cls}" data-day="${k}" aria-label="${esc(c.toDateString())}, ${items.length} task${items.length===1?"":"s"}">
      <span class="num">${c.getDate()}</span>
      ${(mByDay[k]||[]).slice(0,2).map(m=>`<span class="ev mev">🕒 ${esc(m.allDay?"":fmtT(m.start)+" ")}${esc(m.subject)}</span>`).join("")}
      ${items.slice(0,3).map(t=>`<span class="ev${isLate(t)?" late":""}${t.status==="Complete"?" done":""}" ${ev(t)}>${t.priority?"🌟 ":""}${esc(t.title)}</span>`).join("")}
      ${items.length>3?`<span class="more">+${items.length-3} more</span>`:""}
      ${items.length?`<span class="dots">${items.slice(0,6).map(t=>`<i ${ev(t)} class="${isLate(t)?"late":""}"></i>`).join("")}</span>`:""}
    </button>`;
  }
  const sel=byDay[S.calSel]||[];
  const [sy,sm,sd]=S.calSel.split("-").map(Number); const selDate=new Date(sy,sm-1,sd);
  const agenda=sel.length?`<ul>${sel.map(t=>{ const cc=CATS[t.cat]||CATS[1]; return `<li class="citem" data-goto="${esc(t.id)}" role="button" tabindex="0" style="--c:${cc.head};--ct:${d?cc.tintD:cc.tint}"><div class="w">${cc.icon} ${esc(cc.name)}${t.dueTime?" · "+esc(fmtDue(t).split(" ").slice(1).join(" ")):""}</div><b>${t.priority?"🌟 ":""}${esc(t.title)}</b> <span class="pill ${stClass(t.status)}">${stIcon(t.status)} ${esc(t.status)}</span>${isLate(t)?` <span class="pill" style="background:var(--late-bg);color:var(--late)">⏰ Overdue</span>`:""}${t.nextStep?`<div><span class="w">Next:</span> ${esc(t.nextStep)}</div>`:""}</li>`; }).join("")}</ul>`:`<p class="muted" style="margin:0">Nothing due this day.</p>`;
  return `<div class="cal">
    <div class="calhead"><button data-cal="prev" aria-label="Previous month">‹</button><h2>${esc(S.calMonth.toLocaleDateString(undefined,{month:"long",year:"numeric"}))}</h2><button data-cal="today">Today</button><button data-cal="next" aria-label="Next month">›</button></div>
    <div class="wk">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(w=>`<span>${w}</span>`).join("")}</div>
    <div class="grid">${cells}</div>
    <div class="agenda"><h3>${esc(selDate.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}))}</h3>${meetListHTML(mByDay[S.calSel]||[],true)}${agenda}</div>
    ${undated?`<div class="calnote">${undated} task${undated===1?"":"s"} with no due date aren't on the calendar. Switch to 📋 List to see them.</div>`:""}
  </div>`;
}
function feedHTML(){
  const ev=[];
  S.tasks.forEach(t=>(t.history||[]).forEach(h=>ev.push({h,t})));
  if(!ev.length) return `<div class="feed"><div class="empty">No changes yet. Every update you type, edit you save, star, or check-off shows up here, newest first.</div></div>`;
  ev.sort((a,b)=>String(b.h.at).localeCompare(String(a.h.at)));
  const days={}; ev.slice(0,150).forEach(e=>{ const k=new Date(e.h.at).toDateString(); (days[k]=days[k]||[]).push(e); });
  return `<div class="feed">`+Object.entries(days).map(([k,list])=>`<h3>${esc(new Date(k).toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"}))}</h3>`+list.map(({h,t})=>{
    const c=CATS[t.cat]||CATS[1]; const ch=h.changes||{};
    return `<div class="chg" data-goto="${esc(t.id)}" role="button" tabindex="0" style="--c:${c.head};--ct:${dark()?c.tintD:c.tint}"><div class="w">${esc(new Date(h.at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}))} · ${esc(c.name)}</div><div class="t">${esc(t.title)}</div><div>${esc(h.text||"")}</div>${Object.keys(ch).length?`<div class="w">${Object.entries(ch).map(([k,[a,b]])=>`${esc(LABEL[k]||k)}: ${esc(a||"—")} → ${esc(b||"—")}`).join(" · ")}</div>`:""}<div class="go2">Tap to go to this task →</div></div>`;}).join("")).join("")+`</div>`;
}
function lastTouch(t){ const h=(t.history||[]).map(x=>x.at).filter(Boolean).sort(); return h.length?h[h.length-1]:(t.latestAt||t.assignedAt||""); }
function quietDays(t){ const a=lastTouch(t); if(!a) return 0; return Math.floor((Date.now()-new Date(a))/864e5); }
function needsNudge(t){ return t.status==="Waiting" && quietDays(t)>=7; }
function doNowList(){
  const open=S.tasks.filter(t=>t.status!=="Complete"&&!t.goal);
  const soon=new Date(); soon.setDate(soon.getDate()+3); soon.setHours(23,59,59);
  const score=t=>{ let s=0, why="";
    if(isLate(t)){ s+=100; why="Overdue"; }
    if(t.priority){ s+=60; why=why||"High priority"; }
    if(needsNudge(t)){ s+=50; why=why||`No reply ${quietDays(t)} days`; }
    const d=dueOf(t); if(d&&d<=soon&&!isLate(t)){ s+=40; why=why||"Due soon"; }
    if(d) s+=Math.max(0,30-Math.floor((d-Date.now())/864e5));
    return {t,s,why}; };
  return open.map(score).filter(x=>x.why).sort((a,b)=>b.s-a.s).slice(0,3);
}
function renderDoNow(){
  const el=$("donow"); if(!el) return;
  if(S.view!=="list"||S.filter!=="all"||!S.loaded||(S.tQ||"").trim()){ el.innerHTML=""; return; }
  const items=doNowList(); if(!items.length){ el.innerHTML=""; return; }
  const d=dark();
  el.innerHTML=`<section class="donow" aria-label="Do now"><h2>Do now</h2><div class="dn">${items.map(({t,why})=>{ const c=CATS[t.cat]||CATS[1];
    const cls=why==="Overdue"?"":why==="High priority"?"star":why.startsWith("No reply")?"wait":"soon";
    return `<div class="dncard" data-goto="${esc(t.id)}" role="button" tabindex="0" style="--c:${c.head}">
      <span class="why ${cls}">${why==="Overdue"?"⏰ ":why==="High priority"?"🌟 ":why.startsWith("No reply")?"🔔 ":"📅 "}${esc(why)}${t.dueDate?` · ${esc(fmtDue(t))}`:""}</span>
      <span class="t">${esc(t.title)}</span>
      ${t.nextStep?`<span class="n">Next: ${esc(t.nextStep)}</span>`:""}
      <button class="donebtn" data-dn-done="${esc(t.id)}">🤍 Done</button>
    </div>`; }).join("")}</div></section>`;
}
const HZ=[["today","Today"],["week","This week"],["month","This month"],["year","This year"],["all","All"]];
function renderHz(){
  const el=$("hz"); if(!el) return;
  if(S.view==="home"||S.view==="agent"||S.view==="partners"||S.view==="goals"||S.view==="ref"||S.view==="slides"||S.view==="abp"||S.view==="cp"||S.view==="budget"||S.view==="msa"||S.view==="tools"||S.view==="badges"||S.view==="outbox"||S.view==="teams"||S.view==="flyers"||S.view==="testing"||!S.loaded){ el.innerHTML=""; return; }
  const open=S.tasks.filter(t=>t.status!=="Complete"&&!t.goal);
  const cnt=id=>{ if(id==="all") return open.length; if(id==="nodate") return open.filter(t=>!t.dueDate).length; const e=endOf(id); return open.filter(t=>dueOf(t)&&dueOf(t)<=e).length; };
  const late=open.filter(isLate).length;
  el.innerHTML=HZ.map(([id,l])=>`<button class="hzt${id==="today"&&late?" haslate":""}" data-range="${id}" aria-pressed="${S.range===id}"><b>${cnt(id)}</b><span>${l}</span></button>`).join("")+
    (S.range!=="all"&&S.range!=="nodate"&&late?`<span class="hznote">Includes ${late} overdue</span>`:"");
}
function render(){ if(S.dragging){ S.pending=true; return; } renderViews(); renderHz(); renderBar(); renderDoNow(); renderMeet(); renderList(); renderRN(); animEnter(); }
// Motion: animate the page in when you switch tabs (not on every data refresh)
function animEnter(){ const key=S.loaded?S.view+"|"+(S.toolApp||""):""; if(!key||key===S._animKey) return; const first=!S._animKey; S._animKey=key;
  try{ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(_){}
  const vw=$("views"); vw.classList.remove("anim"); void vw.offsetWidth; vw.classList.add("anim"); setTimeout(()=>vw.classList.remove("anim"),700);
  const els=[$("list"),$("hz"),$("donow")?.querySelector(".donow"),document.querySelector("#psw .pipe")].filter(Boolean);
  if(first){ const v=$("views"); v.classList.add("boot"); setTimeout(()=>v.classList.remove("boot"),1400); }
  els.forEach(el=>{ el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); });
  if(S.view==="home") countUp();
  clearTimeout(S._animT); S._animT=setTimeout(()=>els.forEach(el=>el.classList.remove("enter")),900); }
