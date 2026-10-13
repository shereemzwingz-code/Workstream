// ---- voice note
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null, recOn=false, baseText="";
function micHelp(msg){ const n=$("micNote"); n.textContent=msg; n.hidden=false; }
const KB_TIP="Tip: tap the box, then tap the 🎤 on your phone's keyboard (or press Fn twice / Win+H on a computer) to talk. Your words land in the box; then tap ✨ Update my tasks.";
function stopMic(){ recOn=false; $("micBtn").classList.remove("rec"); $("micBtn").textContent="🎤 Talk"; $("micBtn").setAttribute("aria-pressed","false"); try{rec&&rec.stop();}catch{} }
$("micBtn").addEventListener("click",()=>{
  if(recOn){ stopMic(); return; }
  if(!SR){ $("updText").focus(); micHelp(KB_TIP); return; }
  rec=new SR(); rec.lang="en-US"; rec.continuous=true; rec.interimResults=true;
  baseText=$("updText").value.trim(); if(baseText) baseText+=" ";
  rec.onresult=ev=>{ let fin="",tmp=""; for(const r of ev.results){ (r.isFinal?fin+=r[0].transcript:tmp+=r[0].transcript); } $("updText").value=baseText+fin+tmp; };
  rec.onerror=ev=>{ stopMic(); $("updText").focus(); micHelp(ev.error==="no-speech"?"Didn't hear anything. Tap 🎤 Voice note and try again.":"The page can't use the microphone here. "+KB_TIP); };
  rec.onend=()=>{ if(recOn){ try{rec.start();}catch{ stopMic(); } } };
  try{ rec.start(); recOn=true; $("micNote").hidden=true;
    $("micBtn").classList.add("rec"); $("micBtn").textContent="⏹️ Stop recording"; $("micBtn").setAttribute("aria-pressed","true");
  }catch{ micHelp(KB_TIP); }
});
$("updForm").addEventListener("submit",()=>{ if(recOn) stopMic(); },true);

async function applyAI(res,raw){
  const ups=Array.isArray(res.updates)?res.updates:[], news=Array.isArray(res.newTasks)?res.newTasks:[];
  const ops=[]; const undo=[]; const lines=[];
  const okStatus=s=>STATUSES.includes(s)?s:undefined;
  const okDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||"")?s:undefined;
  const okTime=s=>/^\d{2}:\d{2}$/.test(s||"")?s:undefined;
  const seen=new Set();
  for(const u of ups){
    if(String(u.id||"").startsWith("p:")){
      const pid=u.id.slice(2), pr=S.partners.find(x=>x.id===pid); if(!pr||seen.has(u.id)) continue; seen.add(u.id);
      const now=new Date().toISOString(), patch={}, changes={};
      if(STAGES.includes(u.stage)&&u.stage!==pr.stage){ patch.stage=u.stage; changes.stage=[pr.stage||"",u.stage]; }
      if(SS.includes(u.status)&&u.status!==pr.ssStatus){ patch.ssStatus=u.status; changes.ssStatus=[pr.ssStatus||"",u.status]; }
      if(u.nextStep&&u.nextStep!==pr.nextStep){ patch.nextStep=u.nextStep; changes.nextStep=[pr.nextStep||"",u.nextStep]; }
      if(u.contacted===true) patch.lastContact=now;
      const note=String(u.note||raw).trim(); patch.latest=note; patch.history=[...(pr.history||[]),{at:now,text:note,changes}].slice(-60);
      const {id:_pid,...pprev}=pr; undo.push({type:"prestore",id:pid,prev:pprev}); ops.push(()=>pcol().doc(pid).update(patch));
      lines.push(`<li class="citem" data-gotop="${esc(pid)}" role="button" tabindex="0" style="--c:${CATS[1].head};--ct:${dark()?CATS[1].tintD:CATS[1].tint}"><div class="w">🤝 Partner</div><b>${esc(pr.name)}${pr.org?" · "+esc(pr.org):""}</b>: ${esc(note)}${Object.keys(changes).length?` <span class="muted">(${Object.entries(changes).map(([k,[a,b]])=>`${k==="stage"?"Stage":"Next step"} → ${esc(b)}`).join(", ")})</span>`:""}</li>`);
      continue;
    }
    const t=S.tasks.find(x=>x.id===u.id); if(!t||seen.has(t.id)) continue; seen.add(t.id);
    const patch={status:okStatus(u.status),dueDate:okDate(u.dueDate),dueTime:okTime(u.dueTime),who:u.who||undefined,nextStep:u.nextStep||undefined,doneWhen:u.doneWhen||undefined};
    const p=applyPatch(t,patch,(u.note||raw).trim());
    if(!p) continue;
    if(typeof u.priority==="boolean" && u.priority!==!!t.priority){ p.priority=u.priority; p.history[p.history.length-1].changes.priority=[t.priority?"High":"—",u.priority?"High":"—"]; }
    const {id,...prev}=t;
    undo.push({type:"restore",id:t.id,prev});
    ops.push(()=>col().doc(t.id).update(p));
    const ch=p.history[p.history.length-1].changes;
    const cc=CATS[p.cat??t.cat]||CATS[1];
    lines.push(`<li class="citem" data-goto="${esc(t.id)}" role="button" tabindex="0" style="--c:${cc.head};--ct:${dark()?cc.tintD:cc.tint}"><div class="w">${cc.icon} ${esc(cc.name)}</div><b>${esc(t.title)}</b>: ${esc(p.latest||"")}${Object.keys(ch).length?` <span class="muted">(${Object.entries(ch).map(([k,[a,b]])=>`${esc(LABEL[k]||k)} → ${esc(b||"—")}`).join(", ")})</span>`:""}</li>`);
  }
  for(const n of news){
    if(!n||!n.title) continue;
    const ref=col().doc(); const now=new Date().toISOString();
    const doc={cat:+n.cat>=1&&+n.cat<=7?+n.cat:1,title:String(n.title),status:okStatus(n.status)||"Not Started",who:n.who||"",dueDate:okDate(n.dueDate)||"",dueTime:okTime(n.dueTime)||"",nextStep:n.nextStep||"",doneWhen:n.doneWhen||"",notes:"",priority:n.priority===true,latest:"Added from update",order:(Math.max(0,...S.tasks.map(x=>+x.order||0))+10+news.indexOf(n)),latestAt:now,assignedAt:now,history:[{at:now,text:"Added: "+raw.slice(0,200),changes:{}}]};
    ops.push(()=>ref.set(doc)); undo.push({type:"delete",id:ref.id});
    const nc=CATS[doc.cat];
    lines.push(`<li class="citem" data-goto="${esc(ref.id)}" role="button" tabindex="0" style="--c:${nc.head};--ct:${dark()?nc.tintD:nc.tint}"><div class="w">${nc.icon} ${esc(nc.name)}</div><b>New task:</b> ${esc(doc.title)}${doc.dueDate?` <span class="muted">(due ${esc(fmtDue(doc))})</span>`:""}</li>`);
  }
  if(!undo.length){
    $("result").innerHTML=`<div class="result"><h3>Nothing matched</h3>${esc(res.unclear||"I couldn't tell which task that's about. Try adding the org or person's name.")}</div>`;
    return;
  }
  await Promise.all(ops.map(f=>f()));
  S.lastBatch=undo;
  $("result").innerHTML=`<div class="result"><h3>✨ Updated ${undo.length} task${undo.length>1?"s":""}</h3><ul>${lines.join("")}</ul>${res.unclear?`<p class="muted" style="margin:8px 0 0">${esc(res.unclear)}</p>`:""}<div class="row"><button class="linkbtn" id="undoBtn">↩️ Undo</button><button class="linkbtn" id="closeRes">👍 OK</button></div></div>`;
}
$("donow").addEventListener("click",async e=>{
  const b=e.target.closest("[data-dn-done]"); if(!b) return;
  e.stopPropagation();
  const t=S.tasks.find(x=>x.id===b.dataset.dnDone); if(!t) return;
  const p=applyPatch(t,{status:"Complete"},"Marked complete"); p.prevStatus=t.status||"In Progress"; S.keepDone.add(t.id);
  try{ await col().doc(t.id).update(p); toast("💗 Done! Tap 💗 on the task to uncheck"); }catch(err){ writeErr(err); }
},true);
async function askClaude(title,prompt){
  if(!S.sample){ $("result").innerHTML=`<div class="result"><h3>This needs the Claude app or claude.ai</h3></div>`; return; }
  $("result").innerHTML=`<div class="result"><h3>${esc(title)}</h3><div class="copybox" id="aiOut">Thinking…</div></div>`;
  $("result").scrollIntoView({behavior:"smooth",block:"start"});
  try{
    const {text}=await S.sample(prompt,{modelTier:"default",cache:false,onText:({text})=>{ const o=$("aiOut"); if(o) o.textContent=text; }});
    const parts=text.split(/^\s*===\s*(.+?)\s*===\s*$/m); const opts=[];
    for(let i=1;i+1<parts.length;i+=2){ const b=parts[i+1].trim(); if(b) opts.push({l:parts[i].trim(),b}); }
    S.aiOpts=opts.length>=2?opts:null; const first=S.aiOpts?S.aiOpts[0].b:text;
    const pick=S.aiOpts?`<div class="seg" role="group" aria-label="Pick a version" style="margin-bottom:8px;flex-wrap:wrap">${S.aiOpts.map((o,i)=>`<button data-aiopt="${i}" aria-pressed="${i===0}">${esc(o.l)}</button>`).join("")}</div>`:"";
    $("result").innerHTML=`<div class="result"><h3>${esc(title)}</h3>${pick}<div class="copybox" id="aiOut"></div><div class="row"><button class="linkbtn" id="copyAi">📋 Copy</button><button class="linkbtn" id="queueAi">📥 Save to Outbox</button><span class="conf ${confOf(first)[0]}" style="align-self:center">${confOf(first)[1]}</span><button class="linkbtn" id="closeRes">👍 OK</button></div></div>`;
    $("aiOut").textContent=first;
  }catch(err){
    $("result").innerHTML=`<div class="result"><h3>${err?.code==="not_granted"?"Choose Allow to let the page use Claude, then try again.":err?.code==="rate_limited"?"Too many requests. Wait a minute and try again.":"Couldn't finish that. Try again."}</h3><div class="row"><button class="linkbtn" id="closeRes">👍 OK</button></div></div>`;
  }
}
function recapPrompt(){
  const since=Date.now()-7*864e5;
  const ev=[]; S.tasks.forEach(t=>(t.history||[]).forEach(h=>{ if(new Date(h.at)>=since) ev.push(`${fmtShort(h.at)} | ${CATS[t.cat]?.name||""} | ${t.title} | ${h.text}`); }));
  (S.partners||[]).forEach(p=>(p.history||[]).forEach(h=>{ if(new Date(h.at)>=since&&h.text!=="Edited") ev.push(`${fmtShort(h.at)} | Partner | ${p.name}${p.org?" ("+p.org+")":""} | ${h.text}`); }));
  const open=S.tasks.filter(t=>t.status!=="Complete"&&!t.goal);
  const stuck=open.filter(t=>isLate(t)||needsNudge(t)).map(t=>`${t.title} | ${t.status} | due ${t.dueDate||"none"} | next: ${t.nextStep||""}`);
  const next=open.filter(t=>dueOf(t)&&dueOf(t)<=new Date(Date.now()+7*864e5)).map(t=>`${t.title} | due ${t.dueDate} | next: ${t.nextStep||""}`);
  return `Write Sheree's FRIDAY WEEKLY UPDATE — the one she posts in Microsoft Teams every Friday for Charlotte (CP) and the team. It is a Teams post, not an email: no subject line, no greeting, no sign-off. Write ONE version only (ignore any three-versions rule; no "===" lines).
Write it in this voice:
${CP_STYLE}
Format exactly (keep the emoji headers, bullets short enough to read on a phone):
📅 Week of ${new Date(Date.now()-6*864e5).toLocaleDateString("en-US",{month:"short",day:"numeric"})}–${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}
✅ Wins — up to 5 bullets (partners, enrollments, events, materials shipped)
🔄 In progress — up to 5 bullets, each with the next step
🚧 Blocked / need from the team — up to 3 bullets, say exactly what would unblock it
📌 Next week — up to 5 bullets
Use only the facts below. Don't invent numbers, names or dates. If a section has nothing, write "None this week."

Activity in the last 7 days:
${ev.join("\n")||"(none logged)"}

Overdue or waiting with no reply 7+ days:
${stuck.join("\n")||"(none)"}

Due in the next 7 days:
${next.join("\n")||"(none)"}`;
}