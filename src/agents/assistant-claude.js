// ---- AI update
let ctl=null;
function promptFor(text){
  const now=new Date();
  const list=S.tasks.filter(t=>t.status!=="Complete"||1).map(t=>({id:t.id,cat:+t.cat,task:t.title,status:t.status,who:t.who||"",due:t.dueDate||"",time:t.dueTime||"",next:t.nextStep||"",doneWhen:t.doneWhen||"",latest:t.latest||"",priority:!!t.priority}));
  return `You update a person's work task list from a short update they typed.

Today is ${now.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} (${ymd(now)}), local time ${now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}.

Categories: ${Object.entries(CATS).map(([k,c])=>`${k}=${c.name}`).join("; ")}.
Allowed status values: "Not Started", "In Progress", "Waiting", "Complete".

Current tasks (JSON):
${JSON.stringify(list)}

Partners and contacts (JSON; their ids start with "p:"):
${JSON.stringify(S.partners.map(p=>({id:"p:"+p.id,name:p.name,org:p.org||"",stage:p.stage||"To email",status:p.ssStatus||"",next:p.nextStep||""})))}

The person's update:
"""${text}"""

Reply with ONLY a JSON object of this shape:
{"updates":[{"id":"t05","note":"what happened, short, plain words, past tense","priority":true,"status":"...","dueDate":"YYYY-MM-DD","dueTime":"HH:MM","who":"...","nextStep":"...","doneWhen":"..."},{"id":"p:abc","note":"what happened","stage":"Emailed","contacted":true,"nextStep":"..."}],
 "newTasks":[{"cat":1,"title":"Org — what","status":"Not Started","who":"","dueDate":"","dueTime":"","nextStep":"","doneWhen":""}],
 "unclear":""}

Rules:
- Match each part of the update to the existing task it is about, using the org, person, project or topic. One update can change several tasks.
- Every item in "updates" needs "id" and "note". Include any other field ONLY if the update changes it; leave it out otherwise.
- Status: someone replied or the work restarted -> "In Progress"; now waiting on another person -> "Waiting" (put them in "who"); finished, sent, signed or held so the task's doneWhen is met -> "Complete".
- Turn relative dates ("Friday", "next Tuesday", "in 2 weeks") into YYYY-MM-DD from today. Times as 24-hour HH:MM.
- When the old next step is no longer right, give a new "nextStep" that starts with a verb and is one concrete action. If the task is Complete, leave nextStep out.
- Only add to "newTasks" when the person describes new work that matches no existing task. "title" should look like "Org — what". Pick the best "cat".
- "priority": true only if the person says it is high priority, urgent, or important; false only if they say it no longer is. Otherwise leave it out. New tasks may also include "priority".
- When the update is about a partner or contact in the partners list, add an item with that partner's "p:" id. Partner items use only "note", "stage", "status", "contacted" and "nextStep". "status" is the pipeline status, one of: "1 - Research", "2 - Outreach", "3 - Engagement", "4 - Qualified Prospect", "5 - In Negotiations", "6 - Signed" — set it only when the update says the relationship moved (e.g. signed the MSA -> "6 - Signed"). Stages: "To email", "Emailed", "Call set", "Active partner", "Not a fit". "contacted": true when she reached out to them or heard back from them. An update can touch a task and a partner at once.
- Never invent facts, names or dates the person did not give. 
- If part of the update matches no task and is not new work, say so in "unclear" in one short sentence; otherwise "unclear" is "".`;
}

// ---- Claude in the Workstream: the assistant is Claude, with Sheree's standing rules, her team, and every tool on the page
const TEAM=`Sheree "Mzw" Taylor — Sr Associate, Partnerships & Community Impact, Dimension Energy (community solar developer; Chicago). Phone (773) 322-2694, staylor@dimension-energy.com.
CP = Charlotte Parker, her director (cparker@dimension-energy.com). CC = Christina Castillo, Manager of Partnerships & Community Impact (ccastillo@dimension-energy.com). JD = Jon Doro (Ampion/enrollment). Ella Kitterman (team). Alexia Perides = Ampion account manager (aperides@ampion.net); Ampion runs the enrollment landing pages.
Programs: Community Ambassadors (individuals with a personal UTM link + flyer + welcome email), Designees (ABP partner orgs that enroll people; need a badge, deck, MSA, budget, landing page), Illinois Shines, CDCS and TCS/Category 4 projects, Trenton CDCS project (ampion.net/trenton).`;
function selfRules(){ return (S.rules&&S.rules.self)||""; }
function AGENT_SELF(){ return `You are Claude, Sheree's assistant living inside her Workstream app — the same Claude she talks to in the Claude app, with the same standing rules. You act, you don't ask: when a request is clear, do every step; ask ONE question only when something is truly ambiguous or an action can't be undone. Keep the "say" line short.
STANDING RULES (hers): next concrete action first; numbered steps; one issue at a time; no preamble, no recap, no "hope this helps"; matter-of-fact on errors (cause + fix). Every email she sends has THREE versions (Your words polished / Short and joyful / Grounded and professional) except the Community Ambassador welcome email (one version). Decks carry the Dimension logo. Partner names, numbers, dates: only what's in her data — never invent.
${TEAM}
${selfRules()?"MORE ABOUT HOW SHE WORKS (she wrote this):\n"+selfRules():""}`; }
const ASK_ACTIONS=[
  ["open_partner","open a partner's card"],["new_partner","add a new partner / contact / org (name, email, phone if given)"],["log_update","record something that happened with a partner or task (sent, met, replied, signed, waiting, done) — updates stage, next step, tasks"],
  ["draft_email","write an email to a partner or to CP/CC (three versions) — put what it should say in text"],["draft_teams","write a Teams message or post — one version, in text"],
  ["make_flyer","make the Canva flyer (name, number, QR) for an ambassador/partner"],["make_deck","make the Canva deck for a partner (purpose: intro / signing / training / event)"],["make_badge","make a designee badge in Canva (name + org)"],
  ["onboard_ambassador","run the whole Community Ambassador onboarding: card, UTM link, flyer, welcome email (needs name; email/phone optional)"],["onboard_designee","run the whole Designee onboarding for an org"],["utm_link","make a tracked (UTM) link + QR"],
  ["add_task","add a task / reminder (name = title, date = due)"],["complete_task","mark a task done (name = task title)"],["add_test","add a landing-page test (name, url)"],["run_tests","run the saved landing-page tests"],
  ["recap","Friday Teams update for CP"],["focus","start a focus timer"],["due","show what's due / today's plan"],["badges","open the badges tool"],["testing","open the testing tool"],["answer","answer a question or write something else (text = what to write)"]];
function askPlanPrompt(text){ const hist=(S.chat||[]).slice(-6).map(m=>`${m.role==="user"?"Sheree":"Claude"}: ${m.text}`).join("\n");
  return `${AGENT_SELF()}
Turn Sheree's request into a PLAN of app actions, in order. One request can need several steps (e.g. "onboard Anthony as an ambassador and send CP a note" = onboard_ambassador then draft_email).
Actions:
${ASK_ACTIONS.map(([k,d])=>`- ${k}: ${d}`).join("\n")}

Partners (id, name, org, kit, stage):
${JSON.stringify((S.partners||[]).map(p=>({id:p.id,name:p.name,org:p.org||"",kit:p.kitType||"",stage:p.stage||""})).slice(0,200))}
Open tasks (id, title, due):
${JSON.stringify((S.tasks||[]).filter(t=>t.status!=="Complete"&&!t.goal).map(t=>({id:t.id,title:t.title,due:t.dueDate||""})).slice(0,120))}
${hist?"Recent conversation:\n"+hist+"\n":""}
Her request: """${text}"""

Reply with ONLY JSON: {"say":"<one short line back to her, in plain words>","steps":[{"action":"<key>","partnerId":"<id or empty>","taskId":"<id or empty>","name":"","email":"","phone":"","date":"YYYY-MM-DD or empty","purpose":"intro|signing|training|event or empty","text":"<what to write / the update, in her words>"}],"ask":"<a question ONLY if you truly cannot proceed, else empty>"}
Rules: match partners by name or org even with typos or first name only. "Something happened" (sent, met, replied, signed, waiting, done) = log_update. Questions and general writing = answer. If she asks for something no action covers, use answer and explain in say.`; }
S.chat=(()=>{ try{ return JSON.parse(sessionStorage.getItem("ws.chat")||"[]"); }catch(_){ return []; } })();
function chatPush(role,text){ S.chat=[...(S.chat||[]),{role,text:String(text||"").slice(0,600),at:Date.now()}].slice(-12); try{ sessionStorage.setItem("ws.chat",JSON.stringify(S.chat)); }catch(_){ } }
const openView=(view,app)=>{ S.view=view; if(app) S.toolApp=app; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); };
async function runAction(st,text,signal){ const p=(S.partners||[]).find(x=>x.id===st.partnerId)||(st.name?(S.partners||[]).find(x=>[x.name,x.org].some(v=>String(v||"").toLowerCase()===String(st.name).toLowerCase())):null);
  const card=()=>p?document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"]`):null; const who=p?(p.org||p.name):(st.name||"");
  switch(st.action){
    case "open_partner": if(!p) throw {message:"I couldn't find that partner — check the name"}; gotoPartner(p.id); return "Opened "+who;
    case "new_partner": { const now=new Date().toISOString(); const name=st.name||text.slice(0,60); if(p) { gotoPartner(p.id); return who+" is already a partner — opened the card"; }
      const ref=await pcol().add({name,org:name,email:st.email||"",phone:st.phone||"",tier:"➕ Added by me",source:"Added by Claude",stage:"New",order:Math.max(0,...(S.partners||[]).map(q=>+q.order||0))+1,lastContact:now,createdAt:now,latest:"Added by Claude: "+text.slice(0,120),latestAt:now,history:[{at:now,text:"Added by Claude: "+text.slice(0,160),changes:{}}]});
      setTimeout(()=>gotoPartner(ref.id),400); return "Added "+name+" as a partner"; }
    case "log_update": case "status_update": { const res=await S.sample.json(promptFor(p?`About ${p.name||""}${p.org&&p.org!==p.name?" ("+p.org+")":""} (partner id p:${p.id}): ${st.text||text}`:(st.text||text)),{signal,modelTier:"default",cache:false}); await applyAI(res||{},st.text||text); return "Logged it"+(p?" on "+who:""); }
    case "draft_email": { const toCP=/\b(cp|charlotte|christina|cc|team)\b/i.test((st.name||"")+" "+(st.text||"")+" "+text)&&!p;
      if(p){ S.aiCtx={kind:"followup",pid:p.id,to:p.email||"",name:p.name||p.org}; askClaude("✍️ Email to "+(p.name||p.org),partnerPrompt(p)+`\nWhat Sheree wants this email to do: ${st.text||text}`); }
      else { S.aiCtx={kind:"cp",to:"cparker@dimension-energy.com",name:"CP"}; askClaude("✍️ Email — "+(st.name||"CP"),CP_STYLE+`\nWrite the email Sheree asked for. What it should say: ${st.text||text}\nUse only the facts below.\nPartners: ${JSON.stringify((S.partners||[]).map(q=>({name:q.name,org:q.org,stage:q.stage,next:q.nextStep,last:q.lastContact})).slice(0,60))}\nOpen tasks: ${JSON.stringify((S.tasks||[]).filter(t=>t.status!=="Complete").map(t=>({title:t.title,due:t.dueDate,next:t.nextStep})).slice(0,80))}`); }
      return "Drafting the email (three versions) below"; }
    case "draft_teams": askClaude("💬 Teams message",CP_STYLE+`\nWrite a Microsoft Teams message (ONE version only, no "===" lines, no subject, no sign-off). What it should say: ${st.text||text}\nFacts you may use — partners: ${JSON.stringify((S.partners||[]).map(q=>({name:q.name,org:q.org,stage:q.stage,next:q.nextStep})).slice(0,60))}`); return "Drafting the Teams message below";
    case "make_flyer": if(!p) throw {message:"Which partner? I couldn't match the name"}; gotoPartner(p.id); { const u=await flyerCanva(p,card()&&card().querySelector('.qbtn[data-pact="kitact"][data-v="flyer"]')); renderList(); if(!u) throw {message:"Flyer didn't finish — see the note on "+who+"'s card"}; return "Flyer made for "+who+" (📄 on the card)"; }
    case "make_deck": if(!p) throw {message:"Which partner? I couldn't match the name"}; gotoPartner(p.id); { const d={...(p.deck||{}),purpose:st.purpose||(p.deck&&p.deck.purpose)||(kitType(p)==="designee"?"training":"intro")}; await deckCanva(p,d); const m=S.dkMsg; if(m&&m.err) throw {message:m.html.replace(/<[^>]+>/g,"")}; return "Deck made for "+who+" (📊 on the card)"; }
    case "make_badge": openView("badges"); S.bdgF="all"; if(p) S.bdgOrg=p.org||p.name; if(st.name) S.bdgName=st.name; render(); return "Badges — the person is filled in; tap 🎨 Make in Canva";
    case "onboard_ambassador": { const name=st.name||(p&&p.name); if(!name) throw {message:"I need the ambassador's name"}; S.amb={...S.amb,name,email:st.email||(p&&p.email)||"",phone:st.phone||(p&&p.phone)||"",base:S.amb.base||"https://ampion.net/trenton",project:S.amb.project||"trenton"}; try{ localStorage.setItem("ws.amb",JSON.stringify(S.amb)); }catch(_){ }
      openView("tools","amb"); await new Promise(r=>setTimeout(r,250)); const r=await ambRun({...S.amb}); if(r===null) throw {message:"Onboarding didn't start"}; return "Ambassador onboarding ran for "+name+" — card, link, flyer, welcome email in Outbox"; }
    case "onboard_designee": { const org=st.name||(p&&(p.org||p.name)); if(!org) throw {message:"I need the organization's name"}; S.des={...S.des,org,email:st.email||(p&&p.email)||"",phone:st.phone||(p&&p.phone)||""}; try{ localStorage.setItem("ws.des",JSON.stringify(S.des)); }catch(_){ }
      openView("tools","des"); await new Promise(r=>setTimeout(r,250)); const r=await desRun({...S.des}); if(r===null) throw {message:"Onboarding didn't start"}; return "Designee onboarding ran for "+org; }
    case "utm_link": if(p){ kitAct(p,kitType(p)==="ambassador"?"link":"landing",null); return "UTM link for "+who; } openView("tools","utm"); return "UTM builder open";
    case "add_task": { const now=new Date().toISOString(); const title=st.name||st.text||text.slice(0,80); await col().doc().set({cat:p?1:2,title:p?`${who} — ${title}`:title,status:"Not Started",who:"",dueDate:st.date||"",dueTime:"",nextStep:title,doneWhen:"",notes:"",priority:false,latest:"Added by Claude",latestAt:now,assignedAt:now,order:Math.max(0,...S.tasks.map(t=>+t.order||0))+10,history:[{at:now,text:"Added by Claude: "+text.slice(0,160),changes:{}}]}); return "Task added: "+title+(st.date?" · due "+st.date:""); }
    case "complete_task": { const t=(S.tasks||[]).find(x=>x.id===st.taskId)||(S.tasks||[]).find(x=>x.status!=="Complete"&&String(x.title).toLowerCase().includes(String(st.name||"").toLowerCase())&&st.name); if(!t) throw {message:"I couldn't find that task"}; const pt=applyPatch(t,{status:"Complete"},"Marked done by Claude: "+text.slice(0,120)); if(pt) await col().doc(t.id).update(pt); return "Done: "+t.title; }
    case "add_test": { if(!/^https?:\/\//i.test(st.text||"")&&!/^https?:\/\//i.test(st.name||"")) throw {message:"Paste the full link (https://…) to add a test"}; const url=/^https?:\/\//i.test(st.text||"")?st.text:st.name; const ref=await tcol().add({name:(p?who:(st.name&&!/^https?/i.test(st.name)?st.name:url.replace(/^https?:\/\/(www\.)?/,"").split("?")[0])),url,kind:p&&kitType(p)==="designee"?"designee":"link",partnerId:p?p.id:"",checks:["loads","signup","utm"],createdAt:new Date().toISOString()}); openView("testing"); return "Test added — tap ▶ Run"; }
    case "run_tests": openView("testing"); for(const x of (S.tests||[])) await runTest(x); return "Ran "+(S.tests||[]).length+" test"+((S.tests||[]).length===1?"":"s")+" — results in Testing";
    case "recap": askClaude("✨ Friday update for Teams",recapPrompt()); return "Writing the Friday update below";
    case "focus": { const top=doNowList()[0]; focusStart(top?top.t:null); return "Focus timer started"; }
    case "due": openView("home"); return "Here's what's up next";
    case "badges": openView("badges"); return "Badges open";
    case "testing": openView("testing"); return "Testing open";
    default: askClaude("💬 "+text.slice(0,60),`${AGENT_SELF()}\nSheree asked: """${st.text||text}"""\nAnswer her directly in her Workstream context, in her preferred style (next action first, short). Use only what you know from the data below; say when you don't know.\nPartners: ${JSON.stringify((S.partners||[]).map(q=>({name:q.name,org:q.org,stage:q.stage,next:q.nextStep,last:q.lastContact})).slice(0,80))}\nTasks: ${JSON.stringify((S.tasks||[]).filter(t=>t.status!=="Complete").map(t=>({title:t.title,status:t.status,due:t.dueDate,next:t.nextStep})).slice(0,120))}\nMeetings today: ${JSON.stringify((S.meet||[]).map(m=>({subject:m.subject,start:m.start})).slice(0,10))}`); return "";
  } }
function planHTML(say,items){ return `<div class="result"><h3>🤖 ${esc(say||"On it")}</h3><ol class="plan-run">${items.map(it=>`<li class="${it.st}"><span>${it.st==="done"?"✅":it.st==="err"?"❌":it.st==="run"?"⏳":"⬜"}</span> ${esc(it.label)}${it.note?` <span class="muted">— ${esc(it.note)}</span>`:""}</li>`).join("")}</ol></div>`; }
async function assistantRun(text,signal){ let plan=null; try{ plan=await S.sample.json(askPlanPrompt(text),{signal,modelTier:"default",cache:false}); }catch(e){ if(e&&e.code==="cancelled") throw e; return false; }
  chatPush("user",text); const steps=(plan&&Array.isArray(plan.steps)?plan.steps:[]).filter(x=>x&&x.action);
  if(plan&&plan.ask&&!steps.length){ $("result").innerHTML=`<div class="result"><h3>🤖 ${esc(plan.ask)}</h3></div>`; chatPush("assistant",plan.ask); return true; }
  if(!steps.length) return false;
  if(steps.length===1&&(steps[0].action==="status_update"||steps[0].action==="log_update")&&!steps[0].partnerId) return false;
  const items=steps.map(st=>({label:(ASK_ACTIONS.find(a=>a[0]===st.action)||[st.action,st.action])[1].split(" (")[0].split(" — ")[0]+(st.name?" · "+st.name:""),st:"todo",note:""}));
  const show=()=>{ const r=$("result"); if(r&&!r.querySelector("#aiOut")) r.innerHTML=planHTML(plan.say,items); };
  const writes=["draft_email","draft_teams","recap","answer"]; show(); let said=[];
  for(let i=0;i<steps.length;i++){ items[i].st="run"; show(); try{ const note=await runAction(steps[i],text,signal); items[i].st="done"; items[i].note=note||""; if(note) said.push(note); }catch(e){ if(e&&e.code==="cancelled") throw e; items[i].st="err"; items[i].note=(e&&e.message)||"didn't finish"; said.push("❌ "+items[i].note); }
    if(!writes.includes(steps[i].action)) show(); }
  chatPush("assistant",[plan.say,...said].filter(Boolean).join(" · "));
  try{ agLog("Assistant: "+text.slice(0,120)+" → "+said.join("; ").slice(0,200),{act:"assistant"}); }catch(_){ }
  return true; }
$("updForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const text=$("updText").value.trim(); if(!text||S.busy) return;
  if(!S.db){ toast("Not connected"); return; }
  if(!S.sample){ $("result").innerHTML=`<div class="result"><h3>The assistant isn't available here</h3>Open this page in the Claude app or claude.ai to use it. Everything still works by tapping.</div>`; return; }
  S.busy=true; $("goBtn").disabled=true; $("goBtn").textContent="🪄 On it…"; $("stopBtn").hidden=false;
  $("hint").textContent="Working out what you asked and doing it. Up to a minute.";
  ctl=new AbortController();
  try{
    const handled=await assistantRun(text,ctl.signal);
    if(!handled){ const res=await S.sample.json(promptFor(text),{signal:ctl.signal,modelTier:"default",cache:false}); await applyAI(res||{},text); }
    $("updText").value="";
  }catch(err){
    const msg={not_granted:"The assistant needs your OK to use Claude. Try again and choose Allow.",rate_limited:"Too many updates at once. Wait a minute and try again.",invalid_json:"That didn't come back right. Try again, or say it a little differently.",cancelled:"Stopped. Nothing was changed."}[err?.code]||"Couldn't update right now. Your text is still in the box; try again.";
    $("result").innerHTML=`<div class="result"><h3>${esc(msg)}</h3></div>`;
  }finally{
    S.busy=false; $("goBtn").disabled=false; $("goBtn").textContent="✨ Do it"; $("stopBtn").hidden=true;
    $("hint").textContent="It runs every step itself: cards, links, flyers, decks, emails (three versions), tasks, tests.";
  }
});
$("stopBtn").addEventListener("click",()=>ctl?.abort());
