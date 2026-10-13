// ---- Meetings + Teams (Microsoft 365 connector)
const M365="Microsoft 365";
S.meet=null; S.meetErr=""; S.teams=null; S.teamsErr=""; S.mMonth={}; S.mLoading={}; S.meetAll=false; S.teamsAll=false;
const WINTZ={"Eastern Standard Time":"America/New_York","Central Standard Time":"America/Chicago","Mountain Standard Time":"America/Denver","Pacific Standard Time":"America/Los_Angeles","UTC":"UTC","Coordinated Universal Time":"UTC"};
function tzOff(iana,ms){ try{ const f=new Intl.DateTimeFormat("en-US",{timeZone:iana,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}); const o={}; f.formatToParts(new Date(ms)).forEach(x=>o[x.type]=x.value); return Date.UTC(+o.year,+o.month-1,+o.day,+o.hour%24,+o.minute,+o.second)-ms; }catch{ return 0; } }
function wallToDate(w){ if(!w||!w.dateTime) return null; const m=w.dateTime.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); if(!m) return new Date(w.dateTime); const guess=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]); const iana=WINTZ[w.timeZone]||w.timeZone||"UTC"; return new Date(guess-tzOff(iana,guess)); }
const fmtT=d=>d?d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}):"";
function parseObjs(t){ const out=[]; let depth=0,start=-1,inStr=false,escp=false; for(let i=0;i<t.length;i++){ const c=t[i]; if(inStr){ if(escp) escp=false; else if(c==="\\") escp=true; else if(c==='"') inStr=false; continue; } if(c==='"'){ inStr=true; continue; } if(c==="{"){ if(depth===0) start=i; depth++; } else if(c==="}"){ depth--; if(depth===0&&start>=0){ try{ out.push(JSON.parse(t.slice(start,i+1))); }catch{} start=-1; } } } return out; }
function resultObjs(r){ let objs=[]; (r&&r.content||[]).forEach(b=>{ if(b.type==="text"&&b.text) objs=objs.concat(parseObjs(b.text)); }); if(!objs.length&&r&&r.payload){ const p=r.payload; if(Array.isArray(p)) objs=p; else if(typeof p==="object") objs=[p]; else if(typeof p==="string") objs=parseObjs(p); } return objs; }
function m365Msg(e){ const c=e&&e.code; return ({needs_reauth:"Reconnect Microsoft 365 in claude.ai → Settings → Connectors.",server_not_connected:"Add the Microsoft 365 connector in claude.ai → Settings → Connectors.",not_in_manifest:"Microsoft 365 isn't allowed for this page — allow it from the page's Permissions menu.",blocked_by_policy:"Your organization blocks this for the page.",selection_required:"Choose which Microsoft 365 connector to use in the prompt, then tap ↻.",not_granted:"Open this page in claude.ai or the Claude app to see meetings."}[c])||"Couldn't load right now. Tap ↻ to try again."; }
function toMeeting(o){ const st=wallToDate(o.start), en=wallToDate(o.end); const txt=(o.location||"")+" "+(o.summary||""); const join=(txt.match(/https:\/\/(?:teams\.microsoft\.com\/(?:meet|l\/meetup-join)\/[^\s"<>)]+|meet\.google\.com\/[a-z0-9-]+|[a-z0-9.-]*zoom\.us\/j\/[^\s"<>)]+)/i)||[])[0]||"";
  return {id:o.id,subject:o.subject||"(no title)",start:st,end:en,allDay:!!o.isAllDay,cancelled:!!o.isCancelled,join,web:o.webLink||"",who:(o.attendees||[]).filter(a=>!/staylor@/i.test(a)).slice(0,3).join(", "),org:o.organizer||""}; }
async function loadMeet(){
  if(!S.mcp) return;
  const t=new Date(); t.setHours(0,0,0,0); const t2=new Date(t); t2.setDate(t2.getDate()+1);
  try{ const r=await S.mcp.callTool(M365,"outlook_calendar_search",{query:"*",afterDateTime:ymd(t),beforeDateTime:ymd(t2),order:"oldest",limit:25},{cache:{staleTime:60000}});
    S.meet=resultObjs(r).filter(o=>o.subject!==undefined&&o.start).map(toMeeting).filter(m=>!m.cancelled).sort((a,b)=>a.start-b.start); S.meetErr=""; }
  catch(e){ S.meetErr=m365Msg(e); }
  try{ const r=await S.mcp.callTool(M365,"chat_message_search",{query:"*",afterDateTime:t.toISOString(),limit:25},{cache:{staleTime:60000}});
    const msgs=resultObjs(r).filter(o=>o.createdDateTime&&o.from&&new Date(o.createdDateTime)>=t).filter(o=>!/staylor@|^updates@/i.test(o.from.email||"")&&o.from.displayName!=="Sheree Taylor");
    const by={}; msgs.forEach(m=>{ const k=m.chatId||m.channelUri||m.id; if(!by[k]) by[k]={...m,n:0}; by[k].n++; if(m.createdDateTime>by[k].createdDateTime) Object.assign(by[k],m,{n:by[k].n}); });
    S.teams=Object.values(by).sort((a,b)=>String(b.createdDateTime).localeCompare(String(a.createdDateTime))); S.teamsErr=""; }
  catch(e){ S.teamsErr=m365Msg(e); }
  renderMeet(); if(S.view==="home") renderList();
}
function meetListHTML(ms,compact){
  if(!ms.length) return compact?"":`<div class="muted" style="font-size:14px">No meetings.</div>`;
  const now=Date.now();
  return ms.map(m=>{ const past=m.end&&m.end<now, live=m.start<=now&&m.end>now;
    return `<div class="mrow${past?" past":""}${live?" now":""}"><span class="tm">${m.allDay?"All day":esc(fmtT(m.start))}</span><div><b>${esc(m.subject)}</b>${m.who?`<div class="who">👥 ${esc(m.who)}</div>`:""}</div><div class="mb">${m.join&&!past?`<a class="pbtn main" href="${esc(m.join)}" target="_blank" rel="noopener">${live?"Join now":"Join"}</a>`:""}${m.web?`<a class="pbtn" href="${esc(m.web)}" target="_blank" rel="noopener">Outlook</a>`:""}</div></div>`; }).join("");
}
S.mClosed=new Set((()=>{ try{ return JSON.parse(localStorage.getItem("ws.mClosed")||"[]"); }catch(_){ return []; } })());
document.addEventListener("click",e=>{ const b=e.target.closest("[data-mtog]"); if(!b) return; const k=b.dataset.mtog; S.mClosed.has(k)?S.mClosed.delete(k):S.mClosed.add(k);
  try{ localStorage.setItem("ws.mClosed",JSON.stringify([...S.mClosed])); }catch(_){} renderMeet(); });
function renderMeet(){
  const el=$("meet"); if(!el) return;
  if(S.view!=="list"||S.filter!=="all"||!S.loaded||(S.tQ||"").trim()){ el.innerHTML=""; return; }
  if(!S.mcp){ el.innerHTML=""; return; }
  const ms=(S.meet||[]).filter(m=>!m.allDay||m.subject); const shown=S.meetAll?ms:ms.filter(m=>!(m.end&&m.end<Date.now())).slice(0,5);
  const tm=S.teams||[]; const tshown=S.teamsAll?tm:tm.slice(0,5);
  const mc=S.mClosed.has("meet"), tc=S.mClosed.has("teams");
  const nextM=ms.find(m=>!(m.end&&m.end<Date.now()));
  el.innerHTML=`<section class="meet${mc?" mclosed":""}" aria-label="Today's meetings"><h2><button class="mtog" data-mtog="meet" aria-expanded="${!mc}"><span class="mcar" aria-hidden="true">▾</span>📅 Today's meetings ${S.meet?`<span class="vn" style="border:1px solid var(--line);border-radius:999px;padding:0 8px">${ms.length}</span>`:""}${mc&&nextM?`<span class="mpeek">Next: ${esc(fmtT(new Date(nextM.start)))} ${esc(nextM.subject||"")}</span>`:""}</button><span class="r"><button class="linkbtn" data-meet="refresh" aria-label="Refresh meetings and messages">↻</button></span></h2>
    ${mc?"":(S.meetErr?`<div class="slstatus err">${esc(S.meetErr)}</div>`:S.meet===null?`<div class="muted" style="font-size:14px">Loading your calendar…</div>`:meetListHTML(shown)||`<div class="muted" style="font-size:14px">No more meetings today.</div>`)}
    ${mc?"":(ms.length>shown.length||S.meetAll?`<button class="linkbtn" data-meet="all" style="margin-top:6px">${S.meetAll?"Show fewer":"Show all "+ms.length}</button>`:"")}</section>
  <section class="meet${tc?" mclosed":""}" aria-label="New Teams messages" style="border-left-color:var(--accent)"><h2><button class="mtog" data-mtog="teams" aria-expanded="${!tc}"><span class="mcar" aria-hidden="true">▾</span>💬 New Teams messages ${S.teams?`<span class="vn" style="border:1px solid var(--line);border-radius:999px;padding:0 8px">${tm.length}</span>`:""} <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">today</span></button></h2>
    ${tc?"":(S.teamsErr?`<div class="slstatus err">${esc(S.teamsErr)}</div>`:S.teams===null?`<div class="muted" style="font-size:14px">Loading Teams…</div>`:tm.length?tshown.map(m=>`<div class="mrow"><span class="tm">${esc(fmtT(new Date(m.createdDateTime)))}</span><div><b>${esc(m.from.displayName||"")}</b>${m.n>1?` <span class="muted">+${m.n-1} more</span>`:""}<div class="who">${esc(String(m.summary||"").replace(/<[^>]+>/g,"").slice(0,160))}</div></div><div class="mb">${m.webUrl?`<a class="pbtn" href="${esc(m.webUrl)}" target="_blank" rel="noopener">Open in Teams</a>`:""}</div></div>`).join(""):`<div class="muted" style="font-size:14px">No messages from others today.</div>`)}
    ${tc?"":(tm.length>5?`<button class="linkbtn" data-meet="tall" style="margin-top:6px">${S.teamsAll?"Show fewer":"Show all "+tm.length}</button>`:"")}</section>`;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-meet]"); if(!b) return; const a=b.dataset.meet;
  if(a==="refresh"){ S.meet=null; S.teams=null; renderMeet(); S.mcp&&S.mcp.invalidate(M365).catch(()=>{}).finally(loadMeet); return; }
  if(a==="all"){ S.meetAll=!S.meetAll; renderMeet(); } if(a==="tall"){ S.teamsAll=!S.teamsAll; renderMeet(); } });
function loadMonthMeetings(y,mo){
  const k=y+"-"+mo; if(!S.mcp||S.mMonth[k]||S.mLoading[k]) return; S.mLoading[k]=true;
  (async()=>{ const a=ymd(new Date(y,mo,1)), b=ymd(new Date(y,mo+1,1)); let all=[];
    try{ for(let off=0;off<100;off+=25){ const r=await S.mcp.callTool(M365,"outlook_calendar_search",{query:"*",afterDateTime:a,beforeDateTime:b,order:"oldest",limit:25,offset:off},{cache:{staleTime:120000}}); const objs=resultObjs(r); all=all.concat(objs.filter(o=>o.subject!==undefined&&o.start)); if(!objs.some(o=>o.moreResults)) break; } }catch{}
    S.mMonth[k]=all.map(toMeeting).filter(m=>!m.cancelled); S.mLoading[k]=false; if(S.view==="cal") renderList(); })();
}
