// ---- Skeleton loaders + waveform
(function(){ const base=renderList; renderList=function(){ if(!S.loaded&&S.db&&$("list")){ $("list").innerHTML=`<div class="skel" aria-busy="true" aria-label="Loading"><i></i><i></i><i></i></div>`; return; } base(); }; })();
(function(){ const m=$("micBtn"); if(m&&!m.nextElementSibling?.classList?.contains("wave")) m.insertAdjacentHTML("afterend",`<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>`); })();

// ---- 🦋 Ambassador Onboarding: one form, the agent runs the flow (card → link + QR → welcome email to Outbox → tasks → log)
S.amb=(()=>{ try{ const a=JSON.parse(localStorage.getItem("ws.amb")||"{}"); if(!a.base){ try{ a.base=localStorage.getItem("ws.ambBase")||""; }catch(_){ } } return a; }catch(_){ return {}; } })(); S.ambRun=null;
const AMB_F=[["name","Ambassador name","Anthony White"],["email","Email","name@gmail.com"],["phone","Phone",""],["city","City / area","Marion County"],["ptype","Project type","cdcs"],["base","Community Ambassador landing page","https://ampion.net/trenton"],["project","Project (for the campaign name)","trenton"],["utility","Utility","Ameren"]];
// Pull an ambassador straight off a partner card — e.g. Rita Lewis, already in Partners, is becoming a Community Ambassador.
function ambPickHTML(){ const ps=(S.partners||[]).slice().sort((a,b)=>String(a.name||a.org||"").localeCompare(String(b.name||b.org||"")));
  const opt=p=>`<option value="${esc(p.id)}"${S.amb.pid===p.id?" selected":""}>${esc((p.name||p.org||"(no name)")+(p.org&&p.org!==p.name?" · "+p.org:""))}</option>`;
  const fresh=ps.filter(p=>!isAmb(p)), ambs=ps.filter(isAmb);
  return `<div style="grid-column:1/-1"><label for="amb-pid">Pull from my partners</label><select id="amb-pid" data-amb="pid"><option value="">\u2014 Someone new (type them in below) \u2014</option>${fresh.length?`<optgroup label="\u{1F91D} Partners &amp; contacts">${fresh.map(opt).join("")}</optgroup>`:""}${ambs.length?`<optgroup label="\u{1F98B} Already ambassadors">${ambs.map(opt).join("")}</optgroup>`:""}</select><div class="pnote" id="amb-pidnote" style="margin-top:6px${S.amb.pid?"":";display:none"}">Filled in from their card. Onboarding will <b>update that same card</b> \u2014 no duplicate, and their organization stays as it is.</div></div>`; }
function ambFromPartner(id){ S.amb.pid=id||""; const p=id&&(S.partners||[]).find(q=>q.id===id);
  if(p){ const note=String(p.notes||""), grab=re=>{ const m=note.match(re); return m?m[1].trim():""; };
    S.amb.name=p.name||p.org||"";
    S.amb.email=p.email||"";
    S.amb.phone=p.phone||"";
    S.amb.city=grab(/Area:\s*([^\n\u00b7]+)/i)||p.city||S.amb.city||"";
    S.amb.utility=grab(/Utility:\s*([^\n\u00b7]+)/i)||(/comed/i.test(note)?"ComEd":/ameren/i.test(note)?"Ameren":(S.amb.utility||""));
    S.amb.project=grab(/Project:\s*([^\n\u00b7]+)/i)||S.amb.project||"";
    S.amb.ptype=p.ptype||(/cdcs/i.test(note)?"cdcs":(/cat(egory)?\s*4/i.test(note)?"cat4":(S.amb.ptype||""))); }
  ambSave(); }
function ambHTML(){ const q=S.amb;
  return `<section class="bqcard" id="ambform"><h2>🦋 Ambassador Onboarding</h2><p class="sub">Already in your partners? <b>Pick them from the list</b> and the rest fills itself. Otherwise type who signed up. Then tap <b>Run onboarding</b>. The agent does the digital half in one go, in order: partner card with the 🦋 kit → tracked personal link (saved to your UTM log) → welcome email in your voice to the <b>Outbox</b> → tasks for the call, the flyer and the mailing → everything logged. You stay on the human steps: the call, the flyer, the box.</p>
   <div class="bqgrid">${ambPickHTML()}${AMB_F.map(([k,l,ph])=>k==="ptype"?`<div><label for="amb-ptype">${esc(l)}</label><select id="amb-ptype" data-amb="ptype"><option value="">\u2014 pick one \u2014</option>${AMB_PTYPE.map(([v,t])=>`<option value="${v}"${q.ptype===v?" selected":""}>${esc(t)}</option>`).join("")}</select></div>`:`<div${k==="name"?' class="bqbig" style="grid-column:1/-1"':""}><label for="amb-${k}">${esc(l)}</label><input id="amb-${k}" data-amb="${k}" value="${esc(q[k]||"")}" placeholder="${esc(ph)}"></div>`).join("")}</div>${ambBuildHTML()}${ambKitHTML(q)}${kitDocsHTML()}
   <div class="pbtns" style="margin-top:12px"><button class="pbtn main" data-ambact="run" type="button"${S.ambRun&&S.ambRun.busy?" disabled":""}>${S.ambRun&&S.ambRun.busy?"🪄 Building…":(ambOnlyCount()===AMB_BUILD.length?"🔨 Build the kit":"🔨 Build "+ambOnlyCount()+" of "+AMB_BUILD.length)}</button><a class="pbtn" href="${AMB_FORM}" target="_blank" rel="noopener">Sign-up form ↗</a><button class="pbtn" data-ambact="clear" type="button">Clear</button></div>
   <div class="pnote" style="margin-top:8px">The flow, as you run it: sign-up form → onboarding call (30 min Teams) → personal link + QR → flyer with their name → welcome email (link, how solar works, IL Shines, sample bill) → mail printed resources + tracking → 2-week check-in.</div></section>
  <section class="bqcard" id="ambout" aria-live="polite"></section>`; }
function ambOut(){ try{ ambQRDraw(); }catch(_){ } const el=$("ambout"); if(!el) return; const r=S.ambRun; const ambs=(S.partners||[]).filter(p=>p.needsKit&&p.kitType==="ambassador");
  const steps=r?`<div class="plan">${r.steps.map((x,i)=>`<div class="pi${x.ok?" done":""}"><span class="num">${x.ok?"✓":x.err?"!":i+1}</span><div><div class="t">${esc(x.t)}</div>${x.d?`<div class="b">${x.d}</div>`:""}</div></div>`).join("")}</div>${r.busy?`<div class="thinking"><i></i><i></i><i></i></div>`:r.err?`<div class="slstatus err">${esc(r.err)}</div>`:`<div class="bqok y">✅ Done. Your part now: hold the call, make the flyer with their name, mail the box. Approve the welcome email in the Outbox.</div>`}`:"";
  el.innerHTML=`${steps}<h3 style="font-size:14px;margin:${r?"14px":"0"} 0 8px">🦋 Ambassadors <span class="muted" style="font-weight:500">${ambs.length}</span></h3>${ambs.length?ambs.map(p=>`<div class="sug k-kit" style="grid-template-columns:minmax(0,1fr)"><div><div class="t" style="display:flex;justify-content:space-between;gap:8px"><span>${esc(p.name||p.org)}</span><span class="muted" style="font-size:12px;font-weight:600">${kitDone(p)}/${kitTotal(p)}</span></div>${kitChips(p)}<div class="acts" style="grid-column:1;margin-top:8px">${kitNext(p)?`<button class="qbtn p" data-ag="kitgo:${kitNext(p)}" data-pid="${esc(p.id)}">Next: ${kitLabel(kitNext(p),p)}</button>`:`<span class="tchip ok">💗 Set up</span>`}<button class="qbtn" data-gopart="${esc(p.id)}">Open</button></div></div></div>`).join(""):`<div class="bqempty">No ambassadors yet. Run the first one above.</div>`}`; }
// Her onboarding calls are usually on the calendar before the flow runs. Look for it instead of making a second one.
async function ambCallBooked(name){ if(!S.mcp||!name) return null;
  try{ const a=new Date(); a.setDate(a.getDate()-10); const b=new Date(); b.setDate(b.getDate()+60);
    const r=await S.mcp.callTool(M365,"outlook_calendar_search",{query:String(name),afterDateTime:ymd(a),beforeDateTime:ymd(b),order:"oldest",limit:10},{cache:{staleTime:60000}});
    const words=String(name).toLowerCase().split(/\s+/).filter(w=>w.length>2);
    const hits=resultObjs(r).filter(o=>o.subject&&o.start).map(toMeeting)
      .filter(m=>!m.cancelled&&m.start&&words.every(w=>m.subject.toLowerCase().includes(w)))
      .sort((x,y)=>x.start-y.start);
    const now=new Date(); return hits.find(m=>m.start>=now)||hits[hits.length-1]||null;
  }catch(_){ return null; } }
$("list").addEventListener("change",e=>{ if(S.view!=="tools"||!e.target.matches("[data-kattach]")) return;
  kitAttachSet(e.target.checked); const el=$("kitdocs"); if(el){ const open=el.open; el.outerHTML=kitDocsHTML(); const n=$("kitdocs"); if(n) n.open=open; } });
$("list").addEventListener("input",e=>{ if(S.view!=="tools") return; const k=e.target.dataset&&e.target.dataset.kd; if(!k) return;
  const m={...kitDocs()}; const v=String(e.target.value||"").trim(); if(v) m[k]=v; else delete m[k]; kitDocsSave(m);
  const sum=document.querySelector("#kitdocs summary"); if(sum){ const rows=AMB_KIT_BASE.concat(AMB_KIT_CAT4).concat([AMB_KIT_ZIP]).filter(([x])=>x!=="link"&&x!=="flyer");
    sum.textContent="📎 Kit documents — "+rows.filter(([x])=>m[x]).length+" of "+rows.length+" linked"; } });
function ambLpNote(){ const n=$("amb-lpnote"); if(!n) return; const eb=enrollBase(S.amb.base);
  n.innerHTML=S.amb.base?(eb.why?"⚠️ "+esc(eb.why):'Builds → <code style="font-size:11.5px;word-break:break-all">'+esc(eb.url)+"</code>"):"The link and QR are built from this page."; }
function ambRunBtn(){ const b=document.querySelector('#ambform [data-ambact="run"]'); if(!b||(S.ambRun&&S.ambRun.busy)) return;
  const n=ambOnlyCount(); b.textContent=n===AMB_BUILD.length?"\u{1F528} Build the kit":(n?"\u{1F528} Build "+n+" of "+AMB_BUILD.length:"Pick something to build"); b.disabled=!n; }
$("list").addEventListener("change",e=>{ if(S.view!=="tools") return; const k=e.target.dataset&&e.target.dataset.ambk; if(!k) return;
  S.amb.only={...ambOnly(),[k]:e.target.checked}; ambSave(); ambRunBtn(); });
function ambSave(){ try{ localStorage.setItem("ws.amb",JSON.stringify(S.amb)); if(S.amb.base&&!enrollBase(S.amb.base).why) localStorage.setItem("ws.ambBase",S.amb.base); }catch(_){} }
$("list").addEventListener("input",e=>{ if(S.view!=="tools") return; const k=e.target.dataset.amb; if(!k) return;
  if(k==="pid"){ ambFromPartner(e.target.value);
    AMB_F.forEach(([f])=>{ const el=$("amb-"+f); if(el&&el.value!==(S.amb[f]||"")) el.value=S.amb[f]||""; });
    const n=$("amb-pidnote"); if(n) n.style.display=S.amb.pid?"":"none";
    ambKitRedraw(); return; }
  S.amb[k]=e.target.value; ambSave();
  if(k==="base"){ ["amb-base","amb-base2"].forEach(id=>{ const el=$(id); if(el&&el!==e.target) el.value=e.target.value; }); ambLpNote(); } if(["ptype","name","base","project"].includes(k)) ambKitRedraw(); });
function ambKitRedraw(){ const el=$("ambgets"); if(el){ el.outerHTML=ambKitHTML(S.amb); ambQRDraw(); } }
function ambQRDraw(){ const box=document.getElementById("ambqr"); if(!box||!window.QRCode) return; const t=box.dataset.qr; if(!t) return;
  box.innerHTML=""; try{ new QRCode(box,{text:t,width:132,height:132,correctLevel:QRCode.CorrectLevel.M}); }catch(_){ } }
$("list").addEventListener("click",async e=>{ if(S.view!=="tools") return; const b=e.target.closest("[data-ambact]"); if(!b) return;
  if(b.dataset.ambact==="clear"){ S.amb={}; ambSave(); S.ambRun=null; $("list").innerHTML=toolsHTML(); ambOut(); return; }
  if(b.dataset.ambact==="utm"){ const nm=String(S.amb.name||"").trim(), eb=enrollBase(S.amb.base);
    S.utmPrefill={src:"ambassador",med:"referral",camp:"community_ambassador_"+(utmClean(S.amb.project||"")||"{p}"),cont:nm?refCode(nm,S.amb.pid):"",base:eb.url||S.amb.base||"",mat:(nm||"Ambassador")+" ambassador flyer",where:S.amb.city||""};
    S.view="tools"; S.toolApp="utm"; S.utmQR=false; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); setTimeout(utmApplyPrefill,120); return; }
  if(b.dataset.ambact==="run"){ await ambRun({...S.amb,only:ambOnly()}); } });
// Once the kit is built, put the whole thing in one Outlook draft: the welcome letter, their link and
// referral code, their flyer, and every document in their kit.
function kitDraftHTML(p,body,list){ const docs=kitDocs(), esc2=x=>esc(String(x||""));
  const para=String(body||"").split(/\n{2,}/).map(t=>`<p style="margin:0 0 12px">${esc2(t).replace(/\n/g,"<br>")}</p>`).join("");
  const rows=list.map(([k,ic,l,dd])=>{ const u=k==="link"?(p.utmLink||""):k==="flyer"?(p.flyerUrl||""):(docs[k]||"");
    const attach=kitAttachMode()&&k!=="link"&&k!=="flyer";
    const right=attach?"<b>attached</b>":(u?`<a href="${esc2(u)}">${k==="link"?"Your link":k==="flyer"?"Your flyer":"Open"}</a>`:`<span style="color:#b45309">— add this link in the Workstream</span>`);
    return `<tr><td style="padding:6px 10px 6px 0;vertical-align:top">${ic}</td><td style="padding:6px 10px 6px 0"><b>${esc2(l)}</b><br><span style="color:#555;font-size:13px">${esc2(dd)}</span></td><td style="padding:6px 0;white-space:nowrap">${right}</td></tr>`; }).join("");
  return `<div style="font-family:Aptos,Calibri,Arial,sans-serif;font-size:15px;color:#1a1a1a">${para}
  <table style="border-collapse:collapse;margin:16px 0;width:100%">${rows}</table>
  ${p.refCode?`<p style="margin:0 0 6px"><b>Your referral code:</b> ${esc2(p.refCode)}</p>`:""}
  ${p.utmLink?`<p style="margin:0 0 12px;word-break:break-all"><b>Your personal sign-up link:</b><br><a href="${esc2(p.utmLink)}">${esc2(p.utmLink)}</a></p>`:""}
  <p style="margin:0">Printed copies are coming by mail — I\u2019ll send tracking once it ships.</p>${kitAttachMode()?"":`<p style="margin:10px 0 0;color:#777;font-size:12.5px">If a link asks you for access, just reply and I\u2019ll send the file straight over.</p>`}</div>`; }
async function kitDraft(p,body,list){
  if(!S.mcp) return {ok:false,why:"Microsoft 365 isn\u2019t connected on this page, so the draft couldn\u2019t be made."};
  try{ const args={subject:"Welcome to the Community Ambassador program, "+String(p.name||"").split(/\s+/)[0],body:kitDraftHTML(p,body,list),bodyType:"html"};
    if(p.email) args.to=[p.email];
    const r=mcpPayload(await S.mcp.callTool(M365,"outlook_create_draft",args,{cache:false}));
    const link=r.webLink||r.weblink||(r.message&&r.message.webLink)||(JSON.stringify(r).match(/https:\/\/outlook\.[^"\s]+/)||[])[0]||"";
    return {ok:true,link};
  }catch(e){ return {ok:false,why:(e&&e.message)||"Outlook wouldn\u2019t take the draft."}; } }
// One folder per ambassador, under the Community Ambassador Program folder, holding a sheet
// that lists everything they were given. So "what did Rita get" is one link, not five tabs.
async function ambParentFolder(){
  const saved=(S.rules||{}).ambFolderId; if(saved) return saved;
  const r=await S.mcp.callTool(M365,"sharepoint_folder_search",{name:"Community Ambassador",limit:25},{cache:false});
  const hits=[...resText(r).matchAll(/\{[^{}]*?"id"\s*:\s*"([^"]+)"[^{}]*?"name"\s*:\s*"([^"]+)"/g)].map(m=>({id:m[1],name:m[2]}));
  const h=hits.find(x=>/Community Ambassador Program/i.test(x.name))||hits.find(x=>/Community Ambassador/i.test(x.name));
  if(!h) throw {message:"Couldn't find a Community Ambassador folder in OneDrive."};
  S.rules=S.rules||{}; S.rules.ambFolderId=h.id; rulesSave(); return h.id; }
function kitSheetHTML(p,list){ const docs=kitDocs(), e2=x=>esc(String(x||""));
  const row=([k,ic,l,dd])=>{ const u=k==="link"?(p.utmLink||""):k==="flyer"?(p.flyerUrl||""):(docs[k]||"");
    return `<tr><td>${ic}</td><td><b>${e2(l)}</b><br><span style="color:#555;font-size:13px">${e2(dd)}</span></td><td>${u?`<a href="${e2(u)}">Open</a>`:"—"}</td></tr>`; };
  return `<!doctype html><meta charset="utf-8"><title>${e2(p.name)} — Ambassador kit</title>
<body style="font-family:Aptos,Calibri,Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#1a1a1a">
<h1 style="margin:0 0 4px">${e2(p.name)} — Community Ambassador kit</h1>
<p style="color:#555;margin:0 0 20px">${e2(ptLabel(ambProject(p)))}${p.refCode?" · referral code <b>"+e2(p.refCode)+"</b>":""} · built ${e2(new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}))}</p>
${p.utmLink?`<p style="word-break:break-all"><b>Personal sign-up link</b><br><a href="${e2(p.utmLink)}">${e2(p.utmLink)}</a></p>`:""}
<table style="border-collapse:collapse;width:100%">${list.map(row).join("")}</table>
<p style="color:#777;font-size:13px;margin-top:24px">Built by Sheree Taylor · Dimension Energy</p></body>`; }
async function ambFolder(p,list){
  if(!S.mcp) return {ok:false,why:"Microsoft 365 isn’t connected on this page."};
  try{ const parent=await ambParentFolder(), name=safeName(p.name||"Ambassador");
    let fid="";
    try{ const c=await S.mcp.callTool(M365,"sharepoint_create_folder",{driveId:PB_DRIVE,parentItemId:parent,name,conflictBehavior:"fail"},{cache:false}); fid=pickStr(c,/"id"\s*:\s*"([^"]+)"/); }
    catch(e){ if(e&&!/conflict|exist/i.test(String((e&&e.message)||(e&&e.code)||""))) throw e; }
    if(!fid){ const r=await S.mcp.callTool(M365,"sharepoint_folder_search",{name,limit:25},{cache:false});
      fid=(resText(r).match(new RegExp('\\\\{[^{}]*?"id"\\\\s*:\\\\s*"([^"]+)"[^{}]*?"name"\\\\s*:\\\\s*"'+name.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&")+'"'))||[])[1]||""; }
    if(!fid) return {ok:false,why:"Couldn’t make the folder."};
    const html=kitSheetHTML(p,list), bytes=new TextEncoder().encode(html);
    const up=await S.mcp.callTool(M365,"sharepoint_upload_file",{driveId:PB_DRIVE,parentItemId:fid,filename:safeName(p.name)+" — kit.html",contentBase64:toB64(bytes),conflictBehavior:"replace"},{cache:false});
    return {ok:true,id:fid,url:pickStr(up,/"webUrl"\s*:\s*"([^"]+)"/)};
  }catch(e){ return {ok:false,why:(e&&e.message)||"OneDrive wouldn’t take it."}; } }
async function ambRun(d){ d=d||{}; const name=String(d.name||"").trim(); if(!name){ toast("Type the ambassador's name first"); return null; } if(!S.db){ toast("Not connected"); return null; }
  const r={busy:true,steps:[],err:""}; S.ambRun=r; const step=(t)=>{ const x={t,ok:false,d:""}; r.steps.push(x); ambOut(); return x; }; const ok=(x,dd)=>{ x.ok=true; x.d=dd||""; ambOut(); };
  const now=new Date().toISOString(); let p=null;
  try{
    // 1. partner card
    let x=step("Partner card with the 🦋 Community Ambassador kit");
    const key=name.toLowerCase(); p=(d.pid&&(S.partners||[]).find(q=>q.id===d.pid))||(S.partners||[]).find(q=>String(q.name||"").toLowerCase()===key||String(q.org||"").toLowerCase()===key);
    const base={name,org:(p&&p.org&&p.org!==p.name)?p.org:"",role:(p&&/ambassador/i.test(p.role||""))?p.role:"Community Ambassador",email:d.email||(p&&p.email)||"",phone:d.phone||(p&&p.phone)||"",tier:(p&&p.tier)||"➕ Added by me",source:(p&&p.source)||"Ambassador sign-up form",stage:"Active partner",needsKit:true,kitType:"ambassador",kit:{form:true},ptype:d.ptype||(p&&p.ptype)||"",notes:[d.city?"Area: "+d.city:"",d.utility?"Utility: "+d.utility:"",d.project?"Project: "+d.project:"",d.ptype?"Project type: "+ptLabel(d.ptype):""].filter(Boolean).join(" · ")};
    if(p){ const had=String(p.notes||"").split("\n").map(l=>l.trim()); await pcol().doc(p.id).update({...base,notes:[p.notes,had.includes(String(base.notes||"").trim())?"":base.notes].filter(Boolean).join("\n"),kit:{...(p.kit||{}),form:true},history:pHist(p,"Ambassador onboarding run (agent)")}); ok(x,"Updated "+esc(name)+(p.org&&p.org!==name?" · "+esc(p.org):"")+" — their existing card, now with the \u{1F98B} kit"); }
    else { const ref=await pcol().add({...base,order:Math.max(0,...(S.partners||[]).map(q=>+q.order||0))+1,lastContact:now,createdAt:now,latest:"Signed up as a Community Ambassador",latestAt:now,history:[{at:now,text:"Added by the Ambassador Onboarding agent",changes:{}}]}); p={id:ref&&ref.id,...base,history:[]}; ok(x,"Created "+esc(name)); }
    // 2. tracked link
    const only=d.only||{link:true,flyer:true,folder:true,email:true,draft:true,tasks:true};
    const slug=utmClean(d.project||""), ini=refCode(name,p&&p.id), eb=enrollBase(d.base), b=eb.url;
    if(only.link){ x=step("Personal tracked link (UTM) + QR");
    if(b&&slug){ const camp="community_ambassador_"+slug, link=`${b}${b.includes("?")?"&":"?"}utm_source=ambassador&utm_medium=referral&utm_campaign=${encodeURIComponent(camp)}&utm_content=${encodeURIComponent(ini)}`;
      if(!(S.utm||[]).some(u=>u.link===link)) await ucol().add({base:b,src:"ambassador",med:"referral",camp,cont:ini,link,material:name+" ambassador flyer",where:d.city||"",date:new Date().toLocaleDateString("en-US"),by:"Sheree Taylor",approved:"",createdAt:now});
      if(p.id) await pcol().doc(p.id).update({utmLink:link,refCode:ini,kit:{...(p.kit||{}),form:true,link:true}}); p.utmLink=link; p.refCode=ini; p.kit={...(p.kit||{}),link:true};
      ok(x,`Referral code <b>${esc(ini)}</b><br><code style="font-size:12px;word-break:break-all">${esc(link)}</code><br>Saved to your UTM log.`);
      }
    else { x.ok=true; x.d=eb.why||"Skipped — add the project name to make the link."; ambOut(); } }
    if(only.flyer){ x=step("Flyer in Canva: their name, number, link + QR");
      if(!p.utmLink){ x.ok=true; x.d="Skipped — the flyer needs their tracked link. Tick 🔗 Tracked link and build again."; ambOut(); }
      else { const fu=await flyerCanva(p,null); if(fu){ p.kit={...(p.kit||{}),flyer:true}; ok(x,`<a href="${esc(fu)}" target="_blank" rel="noopener">Open the flyer in Canva ↗</a> — name, number and QR are theirs.`); } else { x.ok=true; x.d="Skipped — open the page in claude.ai with Canva + Google Drive allowed, then tap 📄 on their card."; ambOut(); } } }
    const kl=ambKit({...p,ptype:d.ptype||p.ptype});
    if(only.folder){ x=step("Kit folder in OneDrive");
      const fr=await ambFolder({...p,ptype:d.ptype||p.ptype},kl);
      if(fr.ok){ try{ if(p.id) await pcol().doc(p.id).update({kitFolder:{id:fr.id,url:fr.url||""}}); }catch(_){ } p.kitFolder={id:fr.id,url:fr.url||""};
        ok(x,(fr.url?`<a href="${esc(fr.url)}" target="_blank" rel="noopener">Open ${esc(name)}’s kit folder ↗</a>`:"Folder ready in OneDrive")+" — holds a kit sheet listing everything they were given."); }
      else { x.ok=true; x.d="Skipped — "+esc(fr.why); ambOut(); } }
    // 3. welcome email → Outbox
    let wtext="";
    if(only.email){ x=step("Welcome email in your voice → Outbox");
    if(S.sample){ const prompt=welcomePrompt({...p,notes:(p.notes||"")+(d.utility?" "+d.utility:"")}); const {text}=await S.sample(prompt,{modelTier:"default",cache:false});
      await qcol().add({at:new Date().toISOString(),kind:"followup",title:"✉️ Welcome email for "+name,to:d.email||"",name,pid:p.id||"",tid:"",body:text,conf:confOf(text)[0],by:"agent"});
      wtext=text; ok(x,"Waiting for your OK in 📥 Outbox (Assistant tab).");
      if(only.draft){ x=step("Outlook draft with everything in the kit");
      const dr=await kitDraft({...p,ptype:d.ptype||p.ptype},wtext,kl);
      const missing=kl.filter(([k])=>k!=="link"&&k!=="flyer"&&!kitDocs()[k]).map(y=>y[2]);
      const atl=kitAttachMode()?kl.filter(([k2])=>k2!=="link"&&k2!=="flyer"):[];
      if(dr.ok) ok(x,(dr.link?`<a href="${esc(dr.link)}" target="_blank" rel="noopener">Open the draft in Outlook ↗</a>`:"Saved to your Outlook drafts")+(atl.length?`<br><b>📎 Attach before sending (${atl.length}):</b> ${esc(atl.map(y=>y[2]).join(", "))}`:"")+` — ${kl.length} item${kl.length===1?"":"s"}, their link and referral code.`+(missing.length?`<br><b>No link yet for:</b> ${esc(missing.join(", "))} — add them under 📎 Kit documents.`:""));
      else { x.ok=true; x.d="Draft skipped — "+esc(dr.why); ambOut(); } } }
    else { x.ok=true; x.d="Skipped — open the page in claude.ai to draft it."; ambOut(); } }
    // 4. tasks for the human steps
    if(only.tasks){ x=step("Tasks: onboarding call · print the flyer · mail the box · 2-week check-in");
    const dd=n=>{ const t=new Date(); t.setDate(t.getDate()+n); return ymd(t); }; const mk=(title,due,next)=>({cat:2,title:`${name} — ${title}`,status:"Not Started",who:"",dueDate:due,dueTime:"",nextStep:next,doneWhen:"",notes:"",priority:false,latest:"Added by the Ambassador Onboarding agent",latestAt:now,assignedAt:now,order:Math.max(0,...S.tasks.map(t=>+t.order||0))+10,history:[{at:now,text:"Added by the Ambassador Onboarding agent",changes:{}}]});
    const booked=await ambCallBooked(name);
    const have=t=>S.tasks.some(q=>q.title===t.title); const list=[...(booked?[]:[mk("onboarding call",dd(3),"Book 30 min on Teams: overview + link set-up")]),mk("print + mail their flyer",dd(4),"Flyer is in Canva on their card (📄) — print it for the box"),mk("mail printed resources",dd(7),"Ship the box, send tracking info"),mk("2-week check-in",dd(14),"How are referrals going? Questions on savings?")].filter(t=>!have(t));
    for(const t of list) await col().doc().set(t);
    if(booked&&p.id){ try{ await pcol().doc(p.id).update({kit:{...(p.kit||{}),call:true}}); p.kit={...(p.kit||{}),call:true}; }catch(_){ } }
    ok(x,(booked?`📅 Call already booked — <b>${esc(booked.subject)}</b>, ${esc(booked.start.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}))} ${esc(fmtT(booked.start))}. No call task made.<br>`:"")+(list.length?list.length+" tasks added under 🦋 Community ambassador program":"No new tasks needed"));
    }
    await agLog("Ambassador kit built for "+name+" ("+AMB_BUILD.filter(([k])=>only[k]).map(y=>y[2]).join(", ")+")",{act:"ambassador",ref:p.id});
    r.busy=false; ambOut(); toast(only.email?"🦋 Kit built — approve the welcome email in the Outbox":"🦋 Kit built"); return p;
  }catch(err){ r.busy=false; r.err=(err&&err.code==="not_granted")?"Allow Claude for this page, then run again.":"Stopped: "+((err&&err.message)||"couldn't finish")+". What's done stays done; run again to finish the rest."; ambOut(); return p; } }
