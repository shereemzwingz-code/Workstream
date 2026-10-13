// ======================= v3: theme, view transitions, score ring, partner pulse, focus mode, rules, shortcuts =======================
S.theme=(()=>{ try{ return localStorage.getItem("ws.theme")||"auto"; }catch(_){ return "auto"; } })();
function applyTheme(){ const r=document.documentElement; if(S.theme==="auto") delete r.dataset.theme; else r.dataset.theme=S.theme; const b=$("themeBtn"); if(b){ b.textContent=S.theme==="dark"?"🌙":S.theme==="light"?"☀️":"🌗"; b.title="Theme: "+S.theme; } }
applyTheme();
document.addEventListener("click",e=>{ if(!e.target.closest("#themeBtn")) return; S.theme=S.theme==="auto"?"dark":S.theme==="dark"?"light":"auto"; try{ localStorage.setItem("ws.theme",S.theme); }catch(_){} applyTheme(); render(); toast(S.theme==="auto"?"🌗 Theme follows your device":S.theme==="dark"?"🌙 Dark mode":"☀️ Light mode"); });

// smooth crossfade between views (View Transitions API; no-op where unsupported or reduced motion)
(function(){ const base=render; render=function(){ const sw=S._vtView!==undefined&&S._vtView!==S.view; S._vtView=S.view; let rm=false; try{ rm=matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(_){}
  const after=()=>{ if(S.view==="home") ringAnim(); if(S.loaded&&!S.rulesRan) setTimeout(rulesRun,1200); };
  if(sw&&document.startViewTransition&&!S.dragging&&!rm){ document.startViewTransition(()=>{ base(); after(); }); } else { base(); after(); } }; })();
function ringAnim(){ document.querySelectorAll(".ring .fg[data-off]").forEach(c=>{ requestAnimationFrame(()=>requestAnimationFrame(()=>{ c.style.strokeDashoffset=c.dataset.off; })); }); setTimeout(()=>document.querySelectorAll(".pulse.enter").forEach(p=>p.classList.remove("enter")),700); }

// ---- Today's score + streak
function scoreData(){ const today=ymd(new Date()); const day=iso=>{ if(!iso) return ""; const d=new Date(iso); return isNaN(d)?"":ymd(d); };
  const doneToday=S.tasks.filter(t=>t.status==="Complete"&&day(t.doneAt)===today).length;
  const touched=(S.partners||[]).filter(p=>(p.history||[]).some(h=>day(h.at)===today&&h.text!=="Edited")).length;
  const days=new Set(S.tasks.filter(t=>t.doneAt).map(t=>day(t.doneAt))); (S.partners||[]).forEach(p=>(p.history||[]).forEach(h=>{ const d=day(h.at); if(d&&h.text!=="Edited") days.add(d); }));
  let streak=0; const d=new Date(); if(!days.has(ymd(d))) d.setDate(d.getDate()-1); while(days.has(ymd(d))&&streak<400){ streak++; d.setDate(d.getDate()-1); }
  const pts=doneToday+touched, goal=5; return {doneToday,touched,streak,pts,goal,pct:Math.min(1,pts/goal)}; }
function scoreHTML(){ const s=scoreData(), off=Math.round(264*(1-s.pct));
  return `<div class="hrow2"><div class="score"><div class="ring" aria-label="${s.pts} of ${s.goal} today"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8479B"/><stop offset="1" stop-color="#7A1E6C"/></linearGradient></defs><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42" data-off="${off}"/></svg><div class="v">${s.pts}<small>of ${s.goal}</small></div></div>
   <div class="sx"><b>${s.pts>=s.goal?"Goal hit 🎉":s.pts?"Keep it rolling":"Fresh board"}</b><span class="l">${s.doneToday} task${s.doneToday===1?"":"s"} done · ${s.touched} partner${s.touched===1?"":"s"} touched today</span><span class="streak${s.streak>=3?" hot":""}">🔥 ${s.streak}-day streak</span></div></div>${pulseHTML()}</div>`; }

// ---- Partner pulse: who needs a touch, ranked
function pulseList(){ const ps=(S.partners||[]).filter(p=>SSN(p)>=2||p.needsKit||priOf(p)==="1"||(p.stage==="Emailed"&&daysSince(p.lastContact)>=7));
  const score=p=>{ let s=0; if(p.stage==="Emailed"&&daysSince(p.lastContact)>=7) s+=50; if(p.needsKit&&kitLeft(p)>0) s+=40; s+=SSN(p)*5; if(priOf(p)==="1") s+=20; if(priOf(p)==="2") s+=8; if(!p.nextStep) s+=6; return s; };
  return ps.sort((a,b)=>score(b)-score(a)).slice(0,14); }
function pulseHTML(){ const ps=pulseList();
  return `<div class="pulse enter"><h3>🫧 Partner pulse <span class="n">${ps.length}</span><span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0">who needs you most, left to right</span></h3><div class="row">${ps.length?ps.map(p=>{ const st=p.stage==="Emailed"&&daysSince(p.lastContact)>=7, kit=p.needsKit&&kitLeft(p)>0, n=SSN(p);
    return `<button class="pav" data-gopart="${esc(p.id)}" title="${esc(p.org||p.name)}${st?" — no reply "+daysSince(p.lastContact)+" days":kit?" — kit "+kitDone(p)+"/"+kitTotal(p):""}"><span class="c" style="--sc:${ssVar(p)}">${esc(initials(p.org||p.name))}${st?`<i>!</i>`:kit?`<i class="kit">🧰</i>`:""}</span><span class="l">${esc(String(p.org||p.name).replace(/\(.*?\)/g,"").trim())}</span><span class="s">${n?esc(SSHORT[n-1]):"new"}</span></button>`; }).join(""):`<div class="emptyx">Partners show up here ranked by who needs a touch.</div>`}</div></div>`; }

// ---- Focus mode: 25 minutes on one task, floating timer
S.focus=null;
function focusStart(t){ const mins=25; S.focus={id:t?t.id:"",title:t?t.title:"Deep work",end:Date.now()+mins*60000,left:mins*60000,total:mins*60000,paused:false};
  document.body.classList.add("focusing"); focusRender(); clearInterval(S.focusT); S.focusT=setInterval(focusTick,1000); agLog("Started a 25-minute focus on: "+S.focus.title,{act:"focus",ref:S.focus.id}); toast("🎯 25 minutes — go"); }
function focusTick(){ const f=S.focus; if(!f||f.paused) return; f.left=Math.max(0,f.end-Date.now()); focusRender(); if(f.left<=0){ clearInterval(S.focusT); const el=$("focus"); if(el){ el.classList.add("done"); celebrate(el); } toast("⏱️ Time! Mark it done, or go again"); } }
function focusRender(){ const f=S.focus; let el=$("focus"); if(!f){ if(el) el.remove(); document.body.classList.remove("focusing"); return; }
  if(!el){ el=document.createElement("div"); el.id="focus"; el.className="focus"; el.setAttribute("role","status"); el.setAttribute("aria-live","off"); document.body.appendChild(el); }
  const m=Math.floor(f.left/60000), s=Math.floor(f.left%60000/1000); el.classList.toggle("paused",f.paused);
  el.innerHTML=`<span class="tm">${m}:${String(s).padStart(2,"0")}</span><span class="ft"><small>${f.left<=0?"Time's up":f.paused?"Paused":"Focusing on"}</small>${esc(f.title)}</span><button data-fc="pause" aria-label="${f.paused?"Resume":"Pause"}">${f.paused?"▶️":"⏸️"}</button>${f.id?`<button class="ok" data-fc="done" aria-label="Mark done">✓</button>`:""}<button data-fc="x" aria-label="Stop focus">✕</button><span class="bar" aria-hidden="true"><i style="--p:${Math.round(100*(1-f.left/f.total))}%"></i></span>`; }
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-fc]"); if(!b) return; const f=S.focus; if(!f) return; const a=b.dataset.fc;
  if(a==="pause"){ if(f.paused){ f.end=Date.now()+f.left; f.paused=false; } else { f.left=Math.max(0,f.end-Date.now()); f.paused=true; } focusRender(); return; }
  if(a==="x"){ clearInterval(S.focusT); S.focus=null; focusRender(); return; }
  if(a==="done"){ const t=S.tasks.find(x=>x.id===f.id); clearInterval(S.focusT); S.focus=null; focusRender();
    if(t&&t.status!=="Complete"){ const p=applyPatch(t,{status:"Complete"},"Finished in focus mode"); p.prevStatus=t.status||"In Progress"; S.keepDone.add(t.id); try{ await col().doc(t.id).update(p); toast("💗 Done — nice focus"); agLog("Finished in focus mode: "+t.title,{act:"focusdone",ref:t.id}); }catch(err){ writeErr(err); } } } });
document.addEventListener("click",e=>{ const b=e.target.closest('[data-act="focus"]'); if(!b) return; e.stopPropagation(); const row=b.closest(".task"); const t=S.tasks.find(x=>x.id===(row&&row.dataset.id)); if(t) focusStart(t); },true);
HOME_QUICK.splice(1,0,["🎯","Focus 25",()=>{ const top=doNowList()[0]; focusStart(top?top.t:null); }]);
HOME_QUICK.push(["🪪","New designee",()=>{ S.view="tools"; S.toolApp="des"; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); }]);
HOME_QUICK.push(["🦋","New ambassador",()=>{ S.view="tools"; S.toolApp="amb"; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); }]);

// ---- Rules: what the page (now) and the agent (next) may do on their own
const RULES=[["morning","☀️","Morning brief","First open of the day: a one-line summary of overdue, due today and who's waiting.","page",true],
 ["autosnooze","📅","Roll overdue to today","Each morning, move overdue tasks to today so the list stays honest. The old date stays in history.","page",false],
 ["quiet","🌙","Quiet evenings","No Kitty pop-ups after 6pm.","page",false],
 ["friday","✨","Friday update reminder","Every Friday after 1pm, remind you to post your weekly update in Teams — one tap drafts it from this week's activity.","page",true],
 ["nudge7","🔔","Nudge drafts at 7 days","Draft a follow-up for any partner quiet 7+ days and put it in your Outbox for approval.","agent",true],
 ["kitauto","🧰","Build kits on flag","When you flag a partner Needs kit, build the Budget, MSA and slide, then send to CP for review.","agent",true],
 ["badge3","🪪","Badge reminders","Remind you when a designee badge has waited 3+ days.","agent",true],
 ["recap","✨","Friday recap","Write the weekly recap for CP every Friday at 3pm and leave it in Activity.","agent",true]];
S.rules=(()=>{ try{ return JSON.parse(localStorage.getItem("ws.rules")||"{}"); }catch(_){ return {}; } })();
const rule=k=>{ const d=RULES.find(r=>r[0]===k); return S.rules[k]??(d?d[5]:false); };
function rulesHTML(){ return `<section class="hcard"><h3>🎛️ Rules <span class="n">${RULES.filter(r=>rule(r[0])).length} on</span></h3><div class="pnote" style="margin-bottom:6px">Flip what the page does now and what your agent may do once it's built. Saved to your account; the agent reads the same switches.</div><div class="rules">${RULES.map(([k,ic,t,w,who])=>`<div class="rule"><span class="ic" aria-hidden="true">${ic}</span><div><div class="t">${esc(t)}<span class="who ${who}">${who}</span></div><div class="w">${esc(w)}</div></div><button class="sw" role="switch" aria-checked="${rule(k)}" data-rule="${k}" aria-label="${esc(t)}"></button></div>`).join("")}</div></section>`; }
function rulesSave(){ try{ localStorage.setItem("ws.rules",JSON.stringify(S.rules)); }catch(_){} if(S.db&&S.uid) S.db.doc("data/users/"+S.uid+"/agentrules").set({rules:S.rules,at:new Date().toISOString()}).catch(()=>{}); }
function rulesLoad(){ if(!S.db||!S.uid||S.rulesBooted) return; S.rulesBooted=true; try{ S.db.doc("data/users/"+S.uid+"/agentrules").onSnapshot(d=>{ const ex=d&&(typeof d.exists==="function"?d.exists():d.exists); const r=ex&&d.data()&&d.data().rules; if(r){ S.rules={...S.rules,...r}; if(S.view==="agent"&&document.activeElement?.id!=="selfRules") renderList(); } },()=>{}); }catch(_){} }
setInterval(rulesLoad,800);
document.addEventListener("click",e=>{ const b=e.target.closest("[data-rule]"); if(!b) return; const k=b.dataset.rule; S.rules[k]=!rule(k); b.setAttribute("aria-checked",rule(k)); const h=b.closest(".hcard")?.querySelector("h3 .n"); if(h) h.textContent=RULES.filter(r=>rule(r[0])).length+" on"; rulesSave(); agLog(`Rule ${rule(k)?"on":"off"}: ${RULES.find(r=>r[0]===k)[2]}`,{act:"rule",ref:k}); toast(rule(k)?"✅ On":"Off"); });
async function rulesRun(){ if(!S.loaded||!S.db||S.rulesRan) return; const today=ymd(new Date()); let last=null; try{ last=localStorage.getItem("ws.rulesRan"); }catch(_){} S.rulesRan=true; if(last===today) return; try{ localStorage.setItem("ws.rulesRan",today); }catch(_){}
  if(rule("autosnooze")){ const late=S.tasks.filter(t=>!t.goal&&t.status!=="Complete"&&t.dueDate&&t.dueDate<today); for(const t of late){ const p=applyPatch(t,{dueDate:today},"Rolled to today by your rule"); if(p){ try{ await col().doc(t.id).update(p); }catch(_){} } } if(late.length) agLog(`Rolled ${late.length} overdue task${late.length===1?"":"s"} to today`,{act:"autosnooze"}); }
  if(rule("friday")&&new Date().getDay()===5&&new Date().getHours()>=13){ let k=""; try{ k=localStorage.getItem("ws.friday")||""; }catch(_){} if(k!==today){ try{ localStorage.setItem("ws.friday",today); }catch(_){} setTimeout(()=>{ toast("✨ It's Friday — tap Weekly recap to draft your Teams update"); },1200); } }
  if(rule("morning")){ const bits=homeStats().filter(x=>x[2]>0).slice(0,4).map(x=>`${x[2]} ${x[3].toLowerCase()}`); setTimeout(()=>toast(bits.length?"☀️ Today: "+bits.join(" · "):"☀️ Clear board today"),400); } }
(function(){ const base=kShow; kShow=function(force){ if(!force&&rule("quiet")&&new Date().getHours()>=18){ kSchedule(); return; } base(force); }; })();

// ---- Keyboard: 1–4 views, F focus, N new partner, T theme, ? help
function kbdOpen(){ if($("kbd")) return; document.body.insertAdjacentHTML("beforeend",`<div class="kbd" id="kbd" role="dialog" aria-label="Keyboard shortcuts"><div><h3>⌨️ Shortcuts</h3><dl>${[["⌘ K","Jump to anything"],["/","Jump to anything"],["1 – 4","Home · Tasks · Partners · Assistant"],["F","Focus 25 min on the top task"],["N","New partner"],["T","Switch theme"],["?","This list"],["Esc","Close"]].map(([k,l])=>`<dt>${k.split(" ").map(x=>`<kbd>${x}</kbd>`).join("")}</dt><dd>${l}</dd>`).join("")}</dl></div></div>`); }
document.addEventListener("click",e=>{ if(e.target.id==="kbd") e.target.remove(); });
document.addEventListener("keydown",e=>{ const tag=(e.target.tagName||"").toLowerCase(); if(tag==="input"||tag==="textarea"||tag==="select"||e.target.isContentEditable||e.metaKey||e.ctrlKey||e.altKey) return; if(S.cmdk) return;
  if(e.key==="?"){ e.preventDefault(); kbdOpen(); return; }
  if(e.key==="Escape"){ const k=$("kbd"); if(k){ k.remove(); return; } }
  const n=+e.key; if(n>=1&&n<=4&&NAV_MAIN[n-1]){ S.view=NAV_MAIN[n-1]; if(S.filter==="changes") S.filter="all"; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  if(e.key==="f"||e.key==="F"){ if(S.focus) return; const top=doNowList()[0]; focusStart(top?top.t:null); return; }
  if(e.key==="n"||e.key==="N"){ HOME_QUICK[0][2](); return; }
  if(e.key==="t"||e.key==="T"){ const b=$("themeBtn"); if(b) b.click(); } });
window.Workstream.version=3; window.Workstream.rules=()=>Object.fromEntries(RULES.map(r=>[r[0],rule(r[0])])); window.Workstream.focus=focusStart; window.Workstream.score=scoreData; window.Workstream.pulse=pulseList;
