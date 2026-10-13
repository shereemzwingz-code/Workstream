// ===================== Workstream v2: dock, Home, Assistant (agent foundation), ⌘K, partner kit =====================
// Everything here reads the same S.tasks / S.partners / S.badges the rest of the page uses.
const NAV={home:["🏠","Home"],list:["📋","Tasks"],partners:["🤝","Partners"],agent:["🤖","Assistant"],budget:["💰","Budget"],msa:["📝","MSA"],slides:["📊","Slides"],cal:["📅","Meetings"],cp:["🗣️","CP Check-in"],goals:["🎯","Goals"],abp:["📋","ABP"],badges:["🪪","Badges"],outbox:["📥","Outbox"],tools:["🧰","Tools"],ref:["📁","Find & Save"],teams:["💬","Teams"],flyers:["📄","Flyers"],testing:["🧪","Testing"]};
const NAV_MAIN=["home","list","partners","tools"], NAV_EXTRA=["flyers","budget","msa","slides","cal"];
const NAV_G={list:["#E8479B","#B33684"],cp:["#9B7BE0","#6A48C2"],budget:["#F4C25B","#E09A1F"],msa:["#6FCF97","#2E9E63"],cal:["#FF8A65","#E2553A"],goals:["#F06292","#C2185B"],partners:["#4DD0C8","#1F9A92"],abp:["#7FB2E5","#4A7FC0"],slides:["#B28DF0","#7B52D6"],tools:["#5A4A78","#2E2244"],ref:["#FFB74D","#EF8A17"],badges:["#FF8FC4","#D63384"],flyers:["#FF9F6B","#E2553A"],testing:["#5FC8C0","#2A938C"],outbox:["#E8479B","#9B2C7A"],home:["#E8479B","#7A1E6C"],agent:["#7A1E6C","#3B1366"]};
function navCounts(){ const open=S.tasks.filter(t=>t.status!=="Complete"&&!t.goal).length;
  return {list:open,cp:(typeof cpItems==="function"?cpItems().length:0),goals:S.tasks.filter(t=>t.goal).length,partners:S.partners?S.partners.length:0,slides:S.slides?S.slides.length:0,badges:(S.badges||[]).filter(b=>(b.status||"Needed")!=="Given").length,agent:S.loaded?agentSuggest().length:0,outbox:obPend().length}; }
function renderViews(){ const v=$("views"); v.className="dock"; const C=navCounts();
  const dt=(id,extra)=>{ const [ic,l]=NAV[id]; const n=C[id]; return `<button class="dt${extra?" extra":""}" data-view="${id}" aria-pressed="${S.view===id}"><span class="di" aria-hidden="true">${ic}</span>${l}${n?`<span class="n">${n}</span>`:""}</button>`; };
  v.innerHTML=NAV_MAIN.map(id=>dt(id,false)).join("")+NAV_EXTRA.map(id=>dt(id,true)).join("")+`<button class="dt more" data-more="1" aria-expanded="${!!S.sheet}" aria-haspopup="dialog"><span class="di" aria-hidden="true">⋯</span>More</button>`;
  if(S.view!==S._lastView){ S._lastView=S.view; requestAnimationFrame(()=>{ const b=v.querySelector('.dt[aria-pressed="true"]'); b&&b.scrollIntoView&&b.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"}); }); } }
function sheetHTML(){ const C=navCounts();
  const tile=id=>{ const [ic,l]=NAV[id], g=NAV_G[id]||["#9B7BE0","#6A48C2"], n=C[id]; return `<button class="vt" data-view="${id}" aria-pressed="${S.view===id}"><span class="vi" aria-hidden="true" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${ic}${n?`<span class="vn">${n}</span>`:""}</span><span class="vl">${l}</span></button>`; };
  return `<div class="sheet" id="sheet" role="dialog" aria-label="All sections"><div><div class="grab"></div><h2>Everything</h2><p class="sub">Tap a section. Press <b>/</b> or <b>⌘K</b> any time to jump straight to a partner, task or tool.</p><div class="views">${Object.keys(NAV).map(tile).join("")}</div></div></div>`; }
function openSheet(){ if($("sheet")) return; S.sheet=true; document.body.insertAdjacentHTML("beforeend",sheetHTML()); renderViews(); }
function closeSheet(){ const s=$("sheet"); if(s) s.remove(); S.sheet=false; renderViews(); }
document.addEventListener("click",e=>{ const m=e.target.closest("[data-more]"); if(m){ S.sheet?closeSheet():openSheet(); return; }
  const sh=e.target.closest("#sheet"); if(!sh) return; const v=e.target.closest("[data-view]"); if(v){ S.view=v.dataset.view; if(S.filter==="changes") S.filter="all"; closeSheet(); render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; } if(e.target===sh) closeSheet(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.sheet) closeSheet(); });

// ---- Home: greeting, numbers that matter, the assistant's top picks, meetings, kits
function hourWord(){ const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; }
function homeStats(){ const today=ymd(new Date()); const open=S.tasks.filter(t=>t.status!=="Complete"&&!t.goal);
  const stale=(S.partners||[]).filter(p=>p.stage==="Emailed"&&daysSince(p.lastContact)>=7).length;
  const kits=(S.partners||[]).filter(p=>p.needsKit); const kitsOpen=kits.filter(p=>kitLeft(p)>0).length;
  return [["late","⏰",open.filter(isLate).length,"Overdue","warn",()=>{ S.view="list"; S.filter="late"; }],
    ["today","📅",open.filter(t=>t.dueDate===today).length,"Due today","",()=>{ S.view="list"; S.range="today"; S.filter="all"; }],
    ["wait","⏳",open.filter(t=>t.status==="Waiting").length,"Waiting","",()=>{ S.view="list"; S.filter="waiting"; }],
    ["nudge","🔔",stale,"No reply 7d+",stale?"warn":"",()=>{ S.view="partners"; S.pStage="stale"; S.pSS="all"; S.pQ=""; }],
    ["kit","🧰",kitsOpen,"Kits to finish","",()=>{ S.view="partners"; S.pStage="kit"; S.pSS="all"; S.pQ=""; }],
    ["badge","🪪",(S.badges||[]).filter(b=>(b.status||"Needed")==="Needed").length,"Badges needed","",()=>{ S.view="badges"; S.bdgF="Needed"; }]]; }
const HOME_QUICK=[["➕","New partner",()=>{ S.view="partners"; S.pAdding=true; S.pEdit=null; render(); setTimeout(()=>document.querySelector('.addcard [data-pf="name"]')?.focus(),80); }],["🔎","Find anything",()=>cmdkOpen()],["💰","Budget",()=>{ S.view="budget"; render(); }],["📝","MSA",()=>{ S.view="msa"; render(); }],["📊","Decks",()=>{ S.view="slides"; render(); }],["🗣️","CP agenda",()=>{ S.view="cp"; render(); }],["✨","Weekly recap",()=>askClaude("✨ Weekly recap",recapPrompt())]];
const HOME_EXTRA=[
  {id:"partners",icon:"🤝",name:"Partners",bg:"linear-gradient(135deg,#4DD0C8,#1F9A92)",go:"partners",desc:"Every partner and contact"},
  {id:"tasks",icon:"📋",name:"Tasks",bg:"linear-gradient(135deg,#E8479B,#B33684)",go:"list",desc:"All your tasks"},
  {id:"badges",icon:"🪪",name:"Badges",bg:"linear-gradient(135deg,#FF8FC4,#D63384)",go:"badges",desc:"Canva → Badgy"},
  {id:"cp",icon:"🗣️",name:"CP Meeting",bg:"linear-gradient(135deg,#9B7BE0,#6A48C2)",go:"cp",desc:"Agenda for Charlotte"},
  {id:"cal",icon:"🗓️",name:"Calendar",bg:"linear-gradient(135deg,#FF8A65,#E2553A)",go:"cal",desc:"Meetings by month"},
  {id:"goals",icon:"🎯",name:"Goals",bg:"linear-gradient(135deg,#F06292,#C2185B)",go:"goals",desc:"Bigger goals"},
  {id:"abp",icon:"📋",name:"ABP",bg:"linear-gradient(135deg,#7FB2E5,#4A7FC0)",go:"abp",desc:"ABP registration steps"},
  {id:"ref",icon:"📁",name:"Find & Save",bg:"linear-gradient(135deg,#FFB74D,#EF8A17)",go:"ref",desc:"Files and links"},
  {id:"newp",icon:"➕",name:"New Partner",bg:"linear-gradient(135deg,#4DD0C8,#1F9A92)",desc:"Add a contact or org"}];
function homeTools(){ let T=[]; try{ T=TOOL_APPS; }catch(_){ T=[]; } const first=["outbox","agent","partners","amb","des","flyers","utm","badges","slides","cp","testing"]; const all=[...HOME_EXTRA,...T]; return first.map(id=>all.find(x=>x.id===id)).filter(Boolean); }
function todayTasks(){ const today=ymd(new Date()); const dn=doNowList(); const ids=new Set(dn.map(x=>x.t.id));
  const due=(S.tasks||[]).filter(t=>t.status!=="Complete"&&t.dueDate===today&&!ids.has(t.id)).map(t=>({t,why:"Due today"}));
  return [...dn,...due].slice(0,8); }
// ---- Home sections: tap a header to drop it down / pull it up; drag the ⠿ handle (or use ▲▼ in Arrange) to reorder. Both remembered on this device.
const HOME_SECS=["tools"];
S.homeOrder=(()=>{ try{ const o=JSON.parse(localStorage.getItem("ws.home.order")||"[]"); return HOME_SECS.filter(k=>o.includes(k)).sort((a,b)=>o.indexOf(a)-o.indexOf(b)).concat(HOME_SECS.filter(k=>!o.includes(k))); }catch(_){ return HOME_SECS.slice(); } })();
S.homeOpen=(()=>{ try{ return new Set(JSON.parse(localStorage.getItem("ws.home.open")||'["tools"]')); }catch(_){ return new Set(["tools"]); } })();
if(S.homeOrder.length===1) S.homeOpen.add(S.homeOrder[0]);
S.homeArrange=false;
function homeSave(){ try{ localStorage.setItem("ws.home.order",JSON.stringify(S.homeOrder)); localStorage.setItem("ws.home.open",JSON.stringify([...S.homeOpen])); }catch(_){ } }
function homeSec(id){
  const ms=(S.meet||[]).filter(m=>!m.allDay||m.subject), live=ms.filter(m=>!(m.end&&m.end<Date.now())).slice(0,6), tm=(S.teams||[]).slice(0,6), tt=todayTasks(), sug=agentSuggest(), pend=obPend();
  switch(id){
    case "meet": return {ic:"📅",t:"Meetings",n:live.length,r:`${S.mcp?`<button class="r" data-meet="refresh">↻</button>`:""}<button class="r" data-goview="cal">Calendar →</button>`,
      b:!S.mcp?`<div class="emptyx">Open the page in claude.ai with Microsoft 365 connected to see today's meetings.</div>`:S.meetErr?`<div class="slstatus err">${esc(S.meetErr)}</div>`:S.meet===null?`<div class="emptyx">Loading your calendar…</div>`:(live.length?meetListHTML(live):`<div class="emptyx">No more meetings today.</div>`)};
    case "teams": return {ic:"💬",t:"Teams",n:(S.teams||[]).length,r:S.mcp?`<button class="r" data-meet="refresh">↻</button>`:"",
      b:!S.mcp?`<div class="emptyx">Connect Microsoft 365 in claude.ai to see Teams messages here.</div>`:S.teamsErr?`<div class="slstatus err">${esc(S.teamsErr)}</div>`:S.teams===null?`<div class="emptyx">Loading Teams…</div>`:tm.length?tm.map(m=>`<div class="mrow"><span class="tm">${esc(fmtT(new Date(m.createdDateTime)))}</span><div><b>${esc((m.from&&m.from.displayName)||"")}</b><div class="who">${esc(String(m.summary||"").replace(/<[^>]+>/g,"").slice(0,140))}</div></div><div class="mb">${m.webUrl?`<a class="pbtn" href="${esc(m.webUrl)}" target="_blank" rel="noopener">Open</a>`:""}</div></div>`).join(""):`<div class="emptyx">No new Teams messages.</div>`};
    case "outbox": return {ic:pend.length?"📬":"📭",t:"Outbox",n:pend.length,glow:pend.length>0,r:`<button class="r" data-goview="outbox">Open Outbox →</button>`,
      b:pend.length?`<div class="ob">${pend.slice(0,5).map(obRowHTML).join("")}</div>${pend.length>5?`<button class="obmore" type="button" data-goview="outbox">See all ${pend.length} →</button>`:""}`:`<div class="emptyx">No drafts waiting. When the assistant writes an email, it lands here for your OK.</div>`};
    case "assist": return {ic:"🤖",t:"Assistant",n:sug.length,glow:true,r:`<button class="r" data-goview="agent">Open →</button>`,
      b:sug.length?sug.slice(0,5).map(sugHTML).join("")+(sug.length>5?`<button class="obmore" type="button" data-goview="agent">See all ${sug.length} →</button>`:""):`<div class="emptyx">All caught up. Nothing overdue, nobody waiting on you, no kits half-done. 🎉</div>`};
    case "tools": return {ic:"🧰",t:"Tools",n:0,r:`<button class="r" data-goview="tools">All tools →</button>`,
      b:`<div class="appgrid">${homeTools().map(x=>`<button class="appicon" type="button" data-htool="${esc(x.id)}" title="${esc(x.desc||"")}"><span class="appbadge" style="background:${x.bg}"><span aria-hidden="true">${x.icon}</span>${x.url?`<i class="appext" aria-hidden="true">↗</i>`:""}${(typeof appN==="function")?appN(x.id):""}</span><span class="applabel">${esc(x.name)}</span></button>`).join("")}<button class="appicon" type="button" data-goview="tools" title="Every tool and page"><span class="appbadge" style="background:linear-gradient(135deg,#5A4A78,#2E2244)"><span aria-hidden="true">🧰</span></span><span class="applabel">All tools</span></button></div>`};
    case "tasks": return {ic:"🔥",t:"Today's tasks",n:tt.length,r:`<button class="r" data-goview="list">All tasks →</button>`,
      b:tt.length?`<div class="dn" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">${tt.map(({t,why})=>{ const c=CATS[t.cat]||CATS[1]; const cls=why==="Overdue"?"":why==="High priority"?"star":why.startsWith("No reply")?"wait":"soon";
        return `<div class="dncard" data-goto="${esc(t.id)}" role="button" tabindex="0" style="--c:${c.head}"><span class="why ${cls}">${why==="Overdue"?"⏰ ":why==="High priority"?"🌟 ":why.startsWith("No reply")?"🔔 ":"📅 "}${esc(why)}${t.dueDate?` · ${esc(fmtDue(t))}`:""}</span><span class="t">${esc(t.title)}</span>${t.nextStep?`<span class="n">Next: ${esc(t.nextStep)}</span>`:""}<button class="donebtn" data-dn-done="${esc(t.id)}">🤍 Done</button></div>`; }).join("")}</div>`:`<div class="emptyx">Nothing due today and nothing overdue. Star a task to pin it here.</div>`};
  } return null; }
function homeHTML(){
  const first=(S.uid?"Sheree":"there"), sug=agentSuggest();
  return `<div class="home${S.homeArrange?" arranging":""}">
   <div class="hero"><div><h2>${hourWord()}, ${first} 🦋</h2><div class="sub">${esc(new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}))} · ${obPend().length?`<b>${obPend().length}</b> in your outbox · `:""}${sug.length?`<b>${sug.length}</b> assistant picks`:"nothing waiting on you"}</div></div>${S.homeOrder.length>1?`<button class="hbtn harr" type="button" data-harr aria-pressed="${S.homeArrange}">${S.homeArrange?"✓ Done":"✥ Arrange"}</button>`:""}</div>
   <div class="hsecs" id="hsecs">${S.homeOrder.map((id,i)=>{ const x=homeSec(id); if(!x) return ""; const open=S.homeOpen.has(id);
     return `<section class="hcard hsec${x.glow?" glow":""}${open?" open":""}" data-hsec="${id}"><h3 class="hsh"><button class="htog" type="button" data-htog="${id}" aria-expanded="${open}"><span class="car" aria-hidden="true">${open?"▾":"▸"}</span><span class="hic" aria-hidden="true">${x.ic}</span>${esc(x.t)}${x.n?` <span class="n">${x.n}</span>`:""}</button><span class="hrt">${open?x.r:""}</span>${S.homeArrange?`<span class="harrows"><button class="r" type="button" data-hmove="up" ${i===0?"disabled":""} aria-label="Move up">▲</button><button class="r" type="button" data-hmove="down" ${i===S.homeOrder.length-1?"disabled":""} aria-label="Move down">▼</button></span>`:""}<span class="hdrag" data-hdrag title="Drag to reorder" aria-hidden="true">⠿</span></h3>${open?`<div class="hsb">${x.b}</div>`:""}</section>`; }).join("")}</div></div>`; }
function homeMove(id,dir){ const i=S.homeOrder.indexOf(id), j=i+(dir==="up"?-1:1); if(i<0||j<0||j>=S.homeOrder.length) return; S.homeOrder.splice(i,1); S.homeOrder.splice(j,0,id); homeSave(); renderList(); }
(function(){ let drag=null;
  document.addEventListener("pointerdown",e=>{ const h=e.target.closest("[data-hdrag]"); if(!h||S.view!=="home") return; const sec=h.closest(".hsec"); if(!sec) return; e.preventDefault(); drag={sec,id:sec.dataset.hsec}; sec.classList.add("dragging"); try{ h.setPointerCapture(e.pointerId); }catch(_){ } });
  document.addEventListener("pointermove",e=>{ if(!drag) return; e.preventDefault(); const el=document.elementFromPoint(e.clientX,e.clientY); const over=el&&el.closest&&el.closest(".hsec"); if(!over||over===drag.sec) return; const r=over.getBoundingClientRect(); const before=e.clientY<r.top+r.height/2; over.parentNode.insertBefore(drag.sec,before?over:over.nextSibling); });
  const end=()=>{ if(!drag) return; drag.sec.classList.remove("dragging"); S.homeOrder=[...document.querySelectorAll("#hsecs .hsec")].map(x=>x.dataset.hsec); homeSave(); drag=null; renderList(); };
  document.addEventListener("pointerup",end); document.addEventListener("pointercancel",end); })();
document.addEventListener("click",async e=>{
  if(e.target.closest("#brandHome")){ S.view="home"; render(); window.scrollTo&&window.scrollTo({top:0}); return; }
  const hv=e.target.closest("[data-hview]"); if(hv){ S.view=hv.dataset.hview; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  const hq=e.target.closest("[data-hq]"); if(hq){ HOME_QUICK[+hq.dataset.hq][2](); return; }
  const tg=e.target.closest("[data-htog]"); if(tg){ const id=tg.dataset.htog; S.homeOpen.has(id)?S.homeOpen.delete(id):S.homeOpen.add(id); homeSave(); renderList(); return; }
  const ha=e.target.closest("[data-harr]"); if(ha){ S.homeArrange=!S.homeArrange; renderList(); return; }
  const hm=e.target.closest("[data-hmove]"); if(hm){ homeMove(hm.closest(".hsec").dataset.hsec,hm.dataset.hmove); return; }
  const ht=e.target.closest("[data-htool]"); if(ht){ const id=ht.dataset.htool, app=homeTools().find(x=>x.id===id); if(id==="newp"){ S.view="partners"; S.pAdding=true; S.pEdit=null; render(); setTimeout(()=>document.querySelector('.addcard [data-pf="name"]')?.focus(),120); return; } if(app&&app.url){ let w=null; try{ w=window.open(app.url,"_blank"); if(w) w.opener=null; }catch(_){} if(!w){ copyText(app.url); toast("Link copied — paste it in your browser"); } return; } if(app&&app.go){ S.view=app.go; } else { S.view="tools"; S.toolApp=id; S.utmQR=false; } render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  const hs=e.target.closest("[data-hstat]"); if(hs){ const row=homeStats().find(x=>x[0]===hs.dataset.hstat); if(row){ row[5](); render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); } return; }
  const gv=e.target.closest("[data-goview]"); if(gv){ S.view=gv.dataset.goview; if(gv.dataset.pstage){ S.pStage=gv.dataset.pstage; S.pSS="all"; S.pQ=""; } if(S.filter==="changes") S.filter="all"; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  const gp=e.target.closest("[data-gopart]"); if(gp){ gotoPartner(gp.dataset.gopart); return; }
  const dn=e.target.closest("[data-dn-done]"); if(dn&&(S.view==="home")){ e.stopPropagation(); const t=S.tasks.find(x=>x.id===dn.dataset.dnDone); if(!t) return; const p=applyPatch(t,{status:"Complete"},"Marked complete"); p.prevStatus=t.status||"In Progress"; S.keepDone.add(t.id); celebrate(dn); try{ await col().doc(t.id).update(p); toast("💗 Done"); }catch(err){ writeErr(err); } return; }
},true);
