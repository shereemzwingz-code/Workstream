// ---- Assistant: the rules engine the future agent will run. Every suggestion = {id, kind, title, why, actions}
const AG_SKIP="ws.agentSkip";
function agSkips(){ try{ const o=JSON.parse(localStorage.getItem(AG_SKIP)||"{}"); const cut=Date.now()-7*864e5; Object.keys(o).forEach(k=>{ if(new Date(o[k])<cut) delete o[k]; }); return o; }catch(_){ return {}; } }
function agSkip(id){ const o=agSkips(); o[id]=new Date().toISOString(); try{ localStorage.setItem(AG_SKIP,JSON.stringify(o)); }catch(_){} }
function orgKey(s){ return String(s||"").toLowerCase().replace(/\(.*?\)/g,"").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!/^(the|and|of|for|inc|llc|county|city|community|center|house|church|school|high|middle)$/.test(w)); }
function agentSuggest(opts){ const skips=(opts&&opts.all)?{}:agSkips(); const out=[]; const push=s=>{ if(!skips[s.id]) out.push(s); };
  if(!S.loaded) return out; const today=ymd(new Date()); const open=S.tasks.filter(t=>!t.goal&&t.status!=="Complete");
  open.filter(isLate).forEach(t=>{ const d=Math.max(1,Math.round((Date.now()-dueOf(t))/864e5)); push({id:"late:"+t.id,kind:"tasks",icon:"⏰",pri:100+Math.min(30,d),title:t.title,why:`${d} day${d===1?"":"s"} overdue${t.nextStep?" · next: "+t.nextStep:""}`,ref:t.id,actions:[{a:"snooze1",l:"📅 Tomorrow",p:1},{a:"done",l:"💗 Done"},{a:"gotask",l:"Open"}]}); });
  open.filter(t=>t.dueDate===today&&!isLate(t)).forEach(t=>push({id:"today:"+t.id,kind:"tasks",icon:"📅",pri:80+(t.priority?10:0),title:t.title,why:`Due today${t.dueTime?" at "+fmtDue(t).split(" ").slice(1).join(" "):""}${t.nextStep?" · "+t.nextStep:""}`,ref:t.id,actions:[{a:"done",l:"💗 Done",p:1},{a:"gotask",l:"Open"},{a:"snooze1",l:"📅 Tomorrow"}]}));
  open.filter(needsNudge).forEach(t=>push({id:"nudge:"+t.id,kind:"tasks",icon:"🔔",pri:70,title:`Nudge ${t.who||"them"} about “${t.title}”`,why:`Waiting ${quietDays(t)} days with no reply`,ref:t.id,actions:[{a:"nudge",l:"✍️ Draft nudge",p:1},{a:"gotask",l:"Open"}]}));
  (S.partners||[]).forEach(p=>{ const org=p.org||p.name, ds=daysSince(p.lastContact);
    if(p.stage==="Emailed"&&ds>=7) push({id:"stale:"+p.id,kind:"partners",icon:"📨",pri:65+Math.min(10,Math.floor(ds/7)),title:`Follow up with ${org}`,why:`Emailed ${ds} days ago, no reply yet${p.name&&p.name!==org?" · "+p.name:""}`,ref:p.id,actions:[{a:"followup",l:"✍️ Draft follow-up",p:1},{a:"gopartner",l:"Open"},{a:"notfit",l:"🚫 Not a fit"}]});
    if(p.needsKit&&kitLeft(p)>0){ const nx=kitNext(p), K=KITS[kitType(p)]; push({id:"kit:"+p.id+":"+nx,kind:"kit",icon:K.ic,pri:60,title:`${org}: ${kitLabel(nx,p).replace(/^\S+\s/,"")}`,why:`${K.name} ${kitDone(p)}/${kitTotal(p)} · ${K.sub}`,ref:p.id,actions:[{a:"kitgo:"+nx,l:"Open "+kitLabel(nx,p),p:1},{a:"gopartner",l:"Partner card"}]}); }
    if((p.stage==="Call set"||p.stage==="Active partner")&&!String(p.nextStep||"").trim()) push({id:"nonext:"+p.id,kind:"partners",icon:"🧭",pri:50,title:`${org} has no next step`,why:`${p.stage} with nothing planned`,ref:p.id,actions:[{a:"gopartner",l:"Add a next step",p:1}]});
    if(p.stage==="Call set"&&(p.ssStatus||"").startsWith("5")&&!kitHas(p,"msa")&&!p.needsKit) push({id:"kitq:"+p.id,kind:"kit",icon:"✨",pri:55,title:`${org} is in negotiations: start the kit?`,why:"No budget or MSA yet. One tap flags it for Budget → MSA → Slide.",ref:p.id,actions:[{a:"kiton",l:"🧰 Needs kit",p:1},{a:"gopartner",l:"Open"}]}); });
  (S.meet||[]).filter(m=>!(m.end&&m.end<Date.now())).forEach(m=>{ const ks=orgKey(m.subject); if(!ks.length) return; const p=(S.partners||[]).find(x=>{ const ok=orgKey(x.org||x.name); return ok.length&&ks.some(k=>ok.includes(k)); }); if(!p) return;
    push({id:"meet:"+m.id,kind:"partners",icon:"🗓️",pri:90,title:`Prep: ${m.subject}`,why:`${m.allDay?"Today":fmtT(m.start)} · ${p.org||p.name}${p.nextStep?" · next: "+p.nextStep:""}`,ref:p.id,actions:[{a:"gopartner",l:"Open partner",p:1},{a:"logmeet",l:"🤝 Log meeting"}]}); });
  const nb=(S.badges||[]).filter(b=>(b.status||"Needed")==="Needed").length; if(nb) push({id:"badges",kind:"admin",icon:"🪪",pri:40,title:`${nb} badge${nb===1?"":"s"} to make`,why:"Designees are waiting on ABP name badges",actions:[{a:"view:badges",l:"Open badges",p:1}]});
  if(typeof cpItems==="function"){ const its=cpItems(), noAsk=its.filter(t=>!t.cpAsk||!t.cpType).length; if(noAsk) push({id:"cpprep:"+ymd(new Date()),kind:"admin",icon:"🗣️",pri:45,title:`${noAsk} CP agenda item${noAsk===1?" needs":"s need"} an ask`,why:"Write one line on what you need from Charlotte before the check-in",actions:[{a:"view:cp",l:"Open CP check-in",p:1}]}); }
  open.filter(t=>t.status==="In Progress"&&!t.dueDate&&!t.priority).slice(0,3).forEach(t=>push({id:"nodate:"+t.id,kind:"tasks",icon:"🗓️",pri:20,title:`Give “${t.title}” a date`,why:"In progress with no due date, so it never shows up as due",ref:t.id,actions:[{a:"snooze7",l:"🗓️ Next week",p:1},{a:"snooze1",l:"Tomorrow"},{a:"gotask",l:"Open"}]}));
  return out.sort((a,b)=>b.pri-a.pri); }
function sugHTML(s){ return `<div class="sug k-${s.kind}" data-sug="${esc(s.id)}"><div class="ic" aria-hidden="true">${s.icon}</div><div><div class="t">${esc(s.title)}</div><div class="w">${esc(s.why)}</div></div><div class="acts">${s.actions.map(a=>`<button class="qbtn${a.p?" p":""}" data-ag="${esc(a.a)}" data-sid="${esc(s.id)}"${s.ref?` data-pid="${esc(s.ref)}"`:""}>${a.l}</button>`).join("")}<button class="qbtn" data-ag="skip" data-sid="${esc(s.id)}" title="Hide for a week">Skip</button></div></div>`; }
const agcol=()=>S.db.doc("data/users/"+S.uid+"/agent").collection("log");
S.aglog=[]; S.agPlan=null; S.agBusy=false;
async function agLog(text,meta){ if(!S.db||!S.uid) return; try{ await agcol().add({at:new Date().toISOString(),text,by:"you",...(meta||{})}); }catch(_){} }
async function agentDo(act,sid,ref,btn){
  const sug=(agentSuggest({all:true}).find(s=>s.id===sid))||{title:sid};
  const t=S.tasks.find(x=>x.id===ref), p=(S.partners||[]).find(x=>x.id===ref);
  const gone=()=>{ const el=btn&&btn.closest("[data-sug]"); if(el){ el.classList.add("gone"); setTimeout(()=>{ renderList(); renderViews(); },380); } else { renderList(); renderViews(); } };
  try{
    if(act==="skip"){ agSkip(sid); gone(); toast("Hidden for a week"); return; }
    if(act==="done"&&t){ celebrate(btn); const q=applyPatch(t,{status:"Complete"},"Marked complete (assistant)"); q.prevStatus=t.status||"In Progress"; S.keepDone.add(t.id); await col().doc(t.id).update(q); agLog("Done: "+t.title,{sug:sid}); toast("💗 Done"); return; }
    if((act==="snooze1"||act==="snooze7")&&t){ const n=act==="snooze7"?7:1; const d=new Date(); d.setDate(d.getDate()+n); const q=applyPatch(t,{dueDate:ymd(d)},n===1?"Moved to tomorrow (assistant)":"Moved to next week (assistant)"); if(q){ await col().doc(t.id).update(q); agLog((n===1?"Moved to tomorrow: ":"Moved to next week: ")+t.title,{sug:sid}); } toast(n===1?"📅 Tomorrow":"🗓️ Next week"); return; }
    if(act==="gotask"&&t){ gotoTask(t.id); return; }
    if(act==="nudge"&&t){ S.aiCtx={kind:"nudge",tid:t.id,name:t.who||t.title}; askClaude("🔔 Nudge for "+(t.who||t.title),nudgePrompt(t)); agLog("Drafted a nudge: "+t.title,{sug:sid}); return; }
    if(act==="followup"&&p){ S.aiCtx={kind:"followup",pid:p.id,to:p.email||"",name:p.name||p.org}; askClaude("✍️ Follow-up to "+(p.name||p.org),partnerPrompt(p)); agLog("Drafted a follow-up: "+(p.org||p.name),{sug:sid}); return; }
    if(act==="gopartner"&&p){ gotoPartner(p.id); return; }
    if(act==="notfit"&&p){ await pWrite(p.id,{stage:"Not a fit",history:pHist(p,"Marked not a fit (assistant)",{stage:[p.stage,"Not a fit"]})},"🚫 Not a fit"); agLog("Not a fit: "+(p.org||p.name),{sug:sid}); return; }
    if(act==="kiton"&&p){ await pWrite(p.id,{needsKit:true,history:pHist(p,"Flagged for a partner kit")},"🧰 Kit started"); agLog("Started kit: "+(p.org||p.name),{sug:sid}); return; }
    if(act.startsWith("kitgo:")&&p){ const k=act.slice(6); gotoPartner(p.id); setTimeout(()=>kitAct(p,k,null),200); return; }
    if(act.startsWith("panel:")&&p){ const kind=act.slice(6); S.pPanel={id:p.id,kind}; gotoPartner(p.id); requestAnimationFrame(()=>setTimeout(()=>{ const el=document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"] .ppanel[data-panel="${kind}"]`); el&&el.scrollIntoView({behavior:"smooth",block:"start"}); },150)); return; }
    if(act==="logmeet"&&p){ S.pLogType="meet"; gotoPartner(p.id); setTimeout(()=>{ const i=document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"] [data-pupd]`); if(i){ i.focus(); i.placeholder="What happened in the meeting?"; } },250); return; }
    if(act.startsWith("view:")){ S.view=act.slice(5); if(S.view==="badges") S.bdgF="Needed"; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
    toast("Open it to do that one by hand");
  }catch(err){ writeErr(err); } }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-ag]"); if(!b) return; e.stopPropagation(); agentDo(b.dataset.ag,b.dataset.sid||"",b.dataset.pid||"",b); },true);
async function agentPlan(){
  if(!S.sample){ S.agPlan={err:"The game plan needs this page opened in claude.ai or the Claude app."}; renderList(); return; }
  const sugs=agentSuggest().slice(0,30); if(!sugs.length){ S.agPlan={items:[],note:"Nothing is waiting on you. Use the time to move a partner forward or prep the next CP check-in."}; renderList(); return; }
  S.agBusy=true; renderList();
  const ms=(S.meet||[]).filter(m=>!(m.end&&m.end<Date.now())).map(m=>`${m.allDay?"all day":fmtT(m.start)} ${m.subject}`);
  const now=new Date();
  const prompt=`You are the assistant inside Sheree's Workstream (Senior Associate, Dimension Energy, community solar partnerships in Illinois). It is ${now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} ${now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}.
Pick the 3 to 5 things she should do first today and say why in plain words. Prefer: anything tied to today's meetings, then overdue, then partners going cold, then kits. Keep each "because" under 15 words. Do not invent anything not in the list.
Today's meetings: ${ms.join("; ")||"(none)"}
Candidates (JSON): ${JSON.stringify(sugs.map(s=>({id:s.id,kind:s.kind,title:s.title,why:s.why})))}
Reply with ONLY JSON: {"focus":[{"id":"<candidate id>","because":"..."}],"note":"one friendly sentence for the day, under 25 words"}`;
  try{ const r=await S.sample.json(prompt,{modelTier:"default",cache:false}); const ids=new Set(sugs.map(s=>s.id));
    const items=(Array.isArray(r&&r.focus)?r.focus:[]).filter(f=>f&&ids.has(f.id)).slice(0,5).map(f=>({id:f.id,because:String(f.because||"")}));
    S.agPlan={at:new Date().toISOString(),items:items.length?items:sugs.slice(0,4).map(s=>({id:s.id,because:s.why})),note:String((r&&r.note)||"")}; agLog("Made a game plan ("+S.agPlan.items.length+" items)");
  }catch(e){ S.agPlan={err:e&&e.code==="not_granted"?"Choose Allow so the page can use Claude, then try again.":e&&e.code==="rate_limited"?"Too many requests. Wait a minute and try again.":"Couldn't make the plan. Try again."}; }
  S.agBusy=false; renderList(); }
const AUTOS=[["📬","Email + Teams sync","Reads Inbox, Sent, Calendar and Teams, updates tasks and partners, and messages you what changed. Weekdays at 7:45, 11:45 and 3:45 CT.","live","Running"],
 ["🧠","Suggestions","Finds overdue work, partners going cold, half-done kits and badges, every time the page opens.","live","On"],
 ["🗺️","Game plan","Claude ranks today's suggestions against your meetings when you tap Make my game plan.","live","On tap"],
 ["✍️","Draft follow-ups and nudges","Writes the message in your voice; you send it.","live","On tap"],
 ["🪪","Designee onboarding","Card, co-branded link, training deck in Canva, materials email (Outbox) and your tasks. Tools › Designee Onboarding.","live","On tap"],
 ["🦋","Ambassador onboarding","When someone signs up, make their card, tracked link, welcome email (Outbox) and your tasks. Run it now from Tools › Ambassador Onboarding; the agent will run it on new form sign-ups.","live","On tap"],
 ["🧰","Build kits automatically","Make the Budget, MSA and slide the moment you flag a partner, then send to CP for review.","soon","Next"],
 ["📤","Send with approval","Queue emails and Teams messages here; one tap sends.","soon","Next"],
 ["🪪","Badge reminders","Nudge you when a designee has waited 3+ days for a badge.","soon","Next"]];
function agentHTML(){ return appBarHTML("agent")+agentInnerHTML(); }
function agentInnerHTML(){ const all=agentSuggest(), byK={tasks:[],partners:[],kit:[],admin:[]}; all.forEach(s=>(byK[s.kind]||byK.admin).push(s));
  const plan=S.agPlan, sugById=Object.fromEntries(agentSuggest({all:true}).map(s=>[s.id,s]));
  S.agMore=S.agMore||new Set();
  const sec=(k,ic,l)=>{ const L=byK[k]; if(!L.length) return ""; const all=S.agMore.has(k), shown=all?L:L.slice(0,5); return `<section class="agsec"><h3>${ic} ${l} <span class="n">${L.length}</span></h3>${shown.map(sugHTML).join("")}${L.length>5?`<button class="pbtn" data-agmore="${k}" style="justify-self:start">${all?"Show fewer":"Show "+(L.length-5)+" more"}</button>`:""}</section>`; };
  const skipped=Object.keys(agSkips()).length;
  return `<div class="agent">
   <div class="ahero"><span class="bot" aria-hidden="true">🤖</span><h2>Your assistant</h2><p>Runs on Claude with your standing rules, living here with your partners, tasks, meetings and tools. Tell it what you want in the 🤖 Ask the assistant box and it runs every step itself. Everything it does is logged; nothing goes out to a partner without your OK in the Outbox.</p>
    <div class="row"><button class="pbtn main" data-agplan="1"${S.agBusy?" disabled":""}>${S.agBusy?"🪄 Thinking…":"✨ Make my game plan"}</button><button class="pbtn" data-agrefresh="1">↻ Rescan</button>${skipped?`<button class="pbtn" data-agunskip="1">Show ${skipped} hidden</button>`:""}</div></div>
   ${S.agBusy?`<section class="hcard"><div class="thinking"><i></i><i></i><i></i><span style="margin-left:8px;font-size:14px">Reading ${all.length} suggestions and today's meetings…</span></div></section>`:plan?`<section class="hcard glow"><h3>🗺️ Today's game plan${plan.at?` <span class="n">${esc(fmtT(new Date(plan.at)))}</span>`:""}</h3>
      ${plan.err?`<div class="slstatus err">${esc(plan.err)}</div>`:`${plan.note?`<div class="plannote">${esc(plan.note)}</div>`:""}<div class="plan">${plan.items.map((it,i)=>{ const s=sugById[it.id]; const done=!agentSuggest().some(x=>x.id===it.id); return `<div class="pi${done?" done":""}"><span class="num">${done?"✓":i+1}</span><div><div class="t">${esc(s?s.title:it.id)}</div><div class="b">${esc(it.because||(s?s.why:""))}</div>${s&&!done?`<div class="acts">${s.actions.map(a=>`<button class="qbtn${a.p?" p":""}" data-ag="${esc(a.a)}" data-sid="${esc(s.id)}"${s.ref?` data-pid="${esc(s.ref)}"`:""}>${a.l}</button>`).join("")}</div>`:""}</div></div>`; }).join("")||`<div class="emptyx">Nothing to plan: you're clear.</div>`}</div>`}</section>`:""}
   ${all.length?`${sec("partners","🤝","Partners")}${sec("kit","🧰","Partner kits")}${sec("tasks","📋","Tasks")}${sec("admin","🗂️","Admin")}`:`<section class="hcard"><div class="emptyx">Nothing needs a push right now. 🎉 Suggestions appear here as soon as something is overdue, a partner goes quiet for a week, or a kit is half done.</div></section>`}
   <section class="hcard"><h3>🧠 How I work for you</h3><div class="pnote">Standing rules the assistant already follows: next action first · numbered steps · one issue at a time · three email versions (Ambassador welcome = one) · Dimension logo on decks · do it, don't ask. Add anything else it should always know:</div>
     <textarea id="selfRules" rows="3" placeholder="e.g. Always CC Christina on designee emails. Call the Trenton project ‘Trenton CDCS’. My office days are Tue/Thu.">${esc(selfRules())}</textarea><div class="row" style="margin-top:6px"><button class="pbtn main" data-selfsave="1">💾 Save</button></div></section>
   ${(S.chat||[]).length?`<section class="hcard"><h3>💬 This session <button class="r" data-chatclear="1">Clear</button></h3><div class="chatlog">${(S.chat||[]).slice(-8).map(m=>`<div class="${m.role}"><b>${m.role==="user"?"You":"Assistant"}</b> ${esc(m.text)}</div>`).join("")}</div></section>`:""}
   ${rulesHTML()}<section class="hcard"><h3>⚙️ What it runs</h3>${AUTOS.map(([ic,t,w,st,l])=>`<div class="auto"><span class="ic" aria-hidden="true">${ic}</span><div><div class="t">${esc(t)}</div><div class="w">${esc(w)}</div></div><span class="st ${st}">${esc(l)}</span></div>`).join("")}</section>
   <section class="hcard"><h3>🧾 Activity <span class="n">${S.aglog.length}</span></h3>${S.aglog.length?`<div class="aglog">${S.aglog.slice(0,12).map(x=>`<div><span class="when">${esc(fmtStamp(x.at))}</span><span>${esc(x.text||"")}${x.by&&x.by!=="you"?` <span class="tchip soft">${esc(x.by)}</span>`:""}</span></div>`).join("")}</div>`:`<div class="emptyx">Every action the assistant takes shows up here, including the scheduled syncs once they write to this log.</div>`}</section>
   <section class="hcard"><h3>🔌 For the agent you'll build next</h3><div class="pnote">The page exposes its brain as <code>window.Workstream</code>. A scheduled agent or a Claude session can call the same functions you tap, so there is one set of rules, not two.</div><pre class="apicode">Workstream.suggest()          // → [{id, kind, title, why, actions}]
Workstream.do(action, id)     // same one-tap actions as the buttons
Workstream.plan()             // Claude ranks today's list
Workstream.data.partners()    // live partners, tasks, badges, meetings
Workstream.log("text")        // writes to the Activity feed</pre></section>
  </div>`; }
document.addEventListener("click",e=>{ const mo=e.target.closest("[data-agmore]"); if(mo){ S.agMore=S.agMore||new Set(); const k=mo.dataset.agmore; S.agMore.has(k)?S.agMore.delete(k):S.agMore.add(k); renderList(); return; }
  if(e.target.closest("[data-selfsave]")){ S.rules.self=($("selfRules")?.value||"").trim(); rulesSave(); toast("💾 Saved — the assistant reads this on every ask"); return; }
  if(e.target.closest("[data-chatclear]")){ S.chat=[]; try{ sessionStorage.removeItem("ws.chat"); }catch(_){ } renderList(); return; }
  if(e.target.closest("[data-agplan]")){ agentPlan(); return; } if(e.target.closest("[data-agrefresh]")){ renderList(); renderViews(); toast("↻ Rescanned"); return; }
  if(e.target.closest("[data-agunskip]")){ try{ localStorage.removeItem(AG_SKIP); }catch(_){} renderList(); renderViews(); } });
function bootAgentLog(){ if(!S.db||!S.uid||S.agBooted) return; S.agBooted=true; try{ agcol().onSnapshot(snap=>{ S.aglog=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.at).sort((a,b)=>String(b.at).localeCompare(String(a.at))); if(S.view==="agent") renderList(); },()=>{}); }catch(_){} }
setInterval(bootAgentLog,700);
window.Workstream={version:2,suggest:agentSuggest,do:(a,id,ref)=>agentDo(a,id,ref||String(id).split(":")[1]||""),plan:agentPlan,log:agLog,data:{tasks:()=>S.tasks,partners:()=>S.partners||[],badges:()=>S.badges||[],meetings:()=>S.meet||[]},go:v=>{ S.view=v; render(); }};
