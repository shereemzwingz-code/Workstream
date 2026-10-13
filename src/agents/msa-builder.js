// ---- MSA builder (tab): fill CC's MSA + SOW draft ("Draft_VFW_7.2026.docx", shared by CC in the 9/30 MSA Overview)
const MQ_DEF={eff:"",cap:"",kind:"",addr:"",mission:"",served:"",signer:"",title:"",phone:"",attn:"",project:"",kw:"",utility:"",program:"",subs:"",avail:"",
  G:3000,UA:10,F1:100,T1:70,F2:150,TB1:50,B1:1000,TB2:100,B2:2000,wage:25,hours:0,weeks:0,pid:""};
const MQ_GROUPS=[
 ["1 · Partner (the “CAP”)","Page 1 of the MSA + the signature page",[["cap","Partner legal name","VFW Post 9545",1],["kind","Who they are","a New Lenox, Illinois-based veterans organization",1],["addr","Street address, city, state ZIP","323 Old Hickory Road, New Lenox, IL 60451",1],["mission","Mission — finishes “the CAP serves to …”","create camaraderie amongst veterans and serve their community…",1],["served","# individuals + households served","1,000"]]],
 ["2 · Signer + notices","Section 9.3 notices and both signature pages",[["signer","Signer name","Clarke Christiansen"],["title","Signer title","Commander"],["phone","Phone for notices","815-485-8369"],["attn","Notices attention","usually the signer"],["eff","Effective date","October 13, 2026"]]],
 ["3 · Project table (SOW §3)","One row per project",[["project","Project SPV name","New Lenox CSG 1 LLC"],["kw","kWdc","2,650"],["utility","Utility","ComEd or Ameren"],["program","Program","CDCS"],["subs","Estimated subscribers","105"],["avail","Projected availability","5/2027"]]],
];
const MQ_PAY=[["G","Upfront payment ($)"],["UA","…paid after # enrollments"],["F1","Per-subscriber fee ($)"],["T1","…for the first # LMI subscribers"],["F2","Step-up fee after that ($)"],["TB1","Milestone 1 at # subscribers"],["B1","Milestone 1 payment ($)"],["TB2","Milestone 2 at # subscribers"],["B2","Milestone 2 payment ($)"],["wage","Staffer wage ($/hr)"],["hours","Staffer hours / week"],["weeks","Staffer weeks"]];
S.mq=(()=>{ try{ return {...MQ_DEF,...JSON.parse(localStorage.getItem("ws.mq")||"{}")}; }catch(_){ return {...MQ_DEF}; } })(); S.mqMsg=""; S.mqErr=false; S.mqBusy=false; S.mqPv=false;
function mqSave(){ try{ localStorage.setItem("ws.mq",JSON.stringify(S.mq)); }catch(_){}
  clearTimeout(S.mqT); S.mqT=setTimeout(()=>{ if(!S.db||!S.uid) return; S.db.doc("data/users/"+S.uid+"/msadraft").set({mq:S.mq,at:new Date().toISOString()}).catch(()=>{});
    const p=mqPartner(); if(p){ const msa={}; MQ_TXT.forEach(k=>msa[k]=String(S.mq[k]||"").trim()); MQ_PAY.forEach(([k])=>msa["$"+k]=+S.mq[k]||0); msa.savedAt=new Date().toISOString(); pcol().doc(p.id).update({msa}).catch(()=>{}); } },900); }
// MSA form is also kept in your account, so it comes back on any device or if the browser clears it
function mqLoadSaved(){ try{ let un=null; un=S.db.doc("data/users/"+S.uid+"/msadraft").onSnapshot(d=>{ try{ if(un) un(); }catch(_){}
  const ex=d&&(typeof d.exists==="function"?d.exists():d.exists); const m=ex&&d.data()&&d.data().mq;
  if(m&&!String(S.mq.cap||"").trim()){ S.mq={...MQ_DEF,...m}; try{ localStorage.setItem("ws.mq",JSON.stringify(S.mq)); }catch(_){} if(S.view==="msa"){ $("list").innerHTML=mqHTML(); mqOut(); } } },()=>{}); }catch(_){} }
const MQ_TXT=MQ_GROUPS.flatMap(g=>g[2].map(f=>f[0]));
function mqMissing(){ return MQ_TXT.filter(k=>!String(S.mq[k]||"").trim()); }
function mqHTML(){ const q=S.mq; const ps=(S.partners||[]).slice().sort((a,b)=>String(a.org||a.name).localeCompare(String(b.org||b.name)));
  const fld=([k,l,ph,wide])=>`<div${wide?' style="grid-column:1/-1"':""}><label for="mq-${k}">${esc(l)}</label><input id="mq-${k}" data-mq="${k}" value="${esc(q[k]||"")}" placeholder="${esc(ph||"")}"></div>`;
  return `<div class="bq" id="mqform"><section class="bqcard"><h2>📝 MSA builder</h2>
   <div class="bqgrid"><div class="bqbig" style="grid-column:1/-1"><label for="mq-from">Start from a partner (optional)</label><select id="mq-from" data-mqfrom="1"><option value="">— Type it in yourself —</option>${ps.map(p=>`<option value="${esc(p.id)}"${p.id===q.pid?" selected":""}>${esc(p.org||p.name)}${p.org&&p.name&&p.org!==p.name?" · "+esc(p.name):""}</option>`).join("")}</select></div></div>
   ${MQ_GROUPS.map(([h,sub,fs],gi)=>`<h3 style="font-size:14px;margin:18px 0 2px">${esc(h)}</h3><p class="cpmeta" style="margin:0 0 8px;font-size:12.5px;color:var(--muted)">${esc(sub)}</p>${gi===0?mqFindHTML():""}<div class="bqgrid">${fs.map(fld).join("")}</div>`).join("")}
   <h3 style="font-size:14px;margin:18px 0 2px">4 · Payments (SOW §6)</h3><p class="cpmeta" style="margin:0 0 8px;font-size:12.5px;color:var(--muted)">Starts with CC's draft numbers. Tap “Use my 💰 Budget” to copy the numbers from the Budget tab, including the staffer.</p>
   <div class="bqgrid">${MQ_PAY.map(([k,l])=>`<div><label for="mq-${k}">${esc(l)}</label><input id="mq-${k}" type="number" min="0" step="any" data-mq="${k}" value="${esc(q[k])}"></div>`).join("")}</div>
   <div class="pbtns" style="margin-top:12px"><button class="pbtn" data-mqact="budget" type="button">💰 Use my Budget numbers</button><button class="pbtn" data-mqact="clear" type="button">Start a new MSA</button></div></section>
   <section class="bqcard" id="mqout" aria-live="polite"></section></div>`; }
function mqB(){ const q=S.mq, n=k=>+q[k]||0; return {G:n("G"),UA:n("UA")||10,F1:n("F1"),T1:n("T1"),F2:n("F2"),TB1:n("TB1"),B1:n("B1"),TB2:n("TB2"),B2:n("B2"),wage:n("wage"),hours:n("hours"),weeks:n("weeks")}; }
function mqDocName(){ return `MSA-SOW ${safeName(S.mq.cap||"Partner")} ${ymd(new Date())}`; }
function mqOut(){ const el=$("mqout"); if(!el) return; const q=S.mq, b=mqB(), miss=mqMissing(), lbl=Object.fromEntries(MQ_GROUPS.flatMap(g=>g[2].map(f=>[f[0],f[1]])));
  if(!String(q.cap||"").trim()){ el.innerHTML=`<div class="bqempty">Type the partner's legal name (or pick a partner above) to start.</div>`; return; }
  const N=Math.max(0,Math.round(+String(q.subs||"").replace(/[^\d.]/g,"")||0));
  const up=N>=b.UA?b.G:0, t1=b.F1*Math.min(N,b.T1), t2=b.F2*Math.max(N-b.T1,0), m1=N>=b.TB1?b.B1:0, m2=N>=b.TB2?b.B2:0, st=b.wage*b.hours*b.weeks, pay=up+t1+t2+m1+m2, tot=pay+st;
  const totHTML=N?`<div class="btotal">Total MSA payout at <b>${N.toLocaleString()}</b> subscribers: <b>${money(tot)}</b> · ${money(tot/N)} per subscriber
   <table><tr><td>Upfront${N<b.UA?` (not earned until ${b.UA} enrollments)`:""}</td><td>${money(up)}</td></tr>
   <tr><td>${Math.min(N,b.T1).toLocaleString()} × ${money(b.F1)}</td><td>${money(t1)}</td></tr>
   <tr><td>${Math.max(N-b.T1,0).toLocaleString()} × ${money(b.F2)}</td><td>${money(t2)}</td></tr>
   <tr><td>Milestone 1 (${b.TB1} subscribers)${N<b.TB1?" — not reached":""}</td><td>${money(m1)}</td></tr>
   <tr><td>Milestone 2 (${b.TB2} subscribers)${N<b.TB2?" — not reached":""}</td><td>${money(m2)}</td></tr>
   <tr><td>Partner payments subtotal</td><td>${money(pay)}</td></tr>
   <tr><td>Staffer: ${money(b.wage)}/hr × ${b.hours} hrs × ${b.weeks} wks${st?"":" — add in section 4"}</td><td>${money(st)}</td></tr>
   <tr><td><b>Total</b></td><td><b>${money(tot)}</b></td></tr></table>${st?`<div class="pnote" style="margin-top:6px">The staffer cost is in the total, but CC's MSA draft has no staffing clause, so it isn't written into the Word draft. Ask CC how she wants it worded (or if Dimension pays it outside the MSA).</div>`:""}</div>`:`<div class="bqok n">Type <b>Estimated subscribers</b> in section 3 to see the total payout.</div>`;
  el.innerHTML=`<div class="bqres"><h2 style="margin:0">${esc(q.cap)}</h2>
   <div class="bqstats"><div class="bqstat"><div class="l">Total payout</div><div class="v">${N?money(tot):"—"}</div><div class="cpmeta">${N?"at "+N.toLocaleString()+" subscribers":"add estimated subscribers"}</div></div><div class="bqstat"><div class="l">Upfront</div><div class="v">${money(b.G)}</div><div class="cpmeta">after ${b.UA} enrollments</div></div>
    <div class="bqstat"><div class="l">Per subscriber</div><div class="v">${money(b.F1)}</div><div class="cpmeta">first ${b.T1}, then ${money(b.F2)}</div></div>
    <div class="bqstat"><div class="l">Milestones</div><div class="v">${money(b.B1+b.B2)}</div><div class="cpmeta">${money(b.B1)} at ${b.TB1} · ${money(b.B2)} at ${b.TB2}</div></div>
    <div class="bqstat"><div class="l">Blanks left</div><div class="v">${miss.length}</div><div class="cpmeta">of ${MQ_TXT.length}</div></div></div>
   ${totHTML}
   ${miss.length?`<div class="bqok n">Still blank (shows as [__________] in the draft): ${miss.map(k=>esc(lbl[k])).join(" · ")}</div>`:`<div class="bqok y">✅ Every blank is filled</div>`}
   <div class="bqok n">⚠ CC's draft says Virginia law with Illinois courts (§9.7) and the signer for Dimension is Bryan Bentrott. Have CP/legal confirm before you send it.</div>
   <div class="pbtns"><button class="pbtn main" data-mqact="doc" type="button">📄 Download Word draft</button><button class="pbtn" data-mqact="drive" type="button"${S.mqBusy?" disabled":""}>${S.mqBusy?"Saving…":"💾 Save to OneDrive"}</button><button class="pbtn" data-mqact="tobudget" type="button">💰 Make budget from this MSA</button><button class="pbtn" data-mqact="partner" type="button">🤝 Save to partner card</button><button class="pbtn" data-mqact="pv" type="button" aria-expanded="${S.mqPv}">${S.mqPv?"Hide preview":"👁️ Preview"}</button></div>
   ${S.mqMsg?`<div class="${S.mqErr?"slstatus err":"bqok y"}">${S.mqMsg}</div>`:""}
   ${S.mqPv?`<div class="pvsheet" style="padding:16px 20px;max-height:520px;font:13px/1.45 'Times New Roman',serif">${msaDoc(q,b).replace(/^[\s\S]*?<body>/,"").replace(/<\/body>[\s\S]*$/,"")}</div>`:""}</div>`; }
function mqFromPartner(p){ const m=msaOf(p), bud=p.budget||{}, saved=p.msa||{};
  const pay={}; ["G","F1","F2","T1","B1","TB1","B2","TB2","wage","hours","weeks"].forEach(k=>{ if(saved["$"+k]!=null) pay[k]=saved["$"+k]; else if(bud[k]!=null) pay[k]=bud[k]; });
  if(saved.$UA!=null) pay.UA=saved.$UA;
  S.mq={...MQ_DEF,...m,...pay,pid:p.id}; }
// MSA: fill CC's original Draft_VFW_7.2026.docx (tokenized, review comments removed → msa-template.json) in place, like the budget calculator
const ordinal=n=>{ const v=n%100; return n+(["th","st","nd","rd"][(v-20)%10]||["th","st","nd","rd"][v]||"th"); };
async function msaDocx(m,b){ if(!window.JSZip) throw new Error("The file tools didn't load — reload the page");
  const res=await fetch("msa-template.json"); if(!res.ok) throw new Error("Couldn't load the MSA template");
  const tb=atob((await res.json()).b64), tu=new Uint8Array(tb.length); for(let i=0;i<tb.length;i++) tu[i]=tb.charCodeAt(i);
  const zip=await JSZip.loadAsync(tu); let xml=await zip.file("word/document.xml").async("string");
  const xe=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const nb=k=>+(b[k]||0), T1=nb("T1")||70;
  const vals={...m,G:money(nb("G")),UA:String(nb("UA")||10),F1:money(nb("F1")),T1:String(T1),T1next:ordinal(T1+1),F2:money(nb("F2")),TB1:nb("TB1").toLocaleString(),B1:money(nb("B1")),TB2:nb("TB2").toLocaleString(),B2:money(nb("B2"))};
  xml=xml.replace(/\{\{(\w+)\}\}/g,(_,k)=>{ const v=vals[k]; return xe(v!=null&&String(v).trim()!==""?String(v).trim():(["project","kw","utility","program","subs","avail"].includes(k)?"[____]":"[__________]")); });
  zip.file("word/document.xml",xml);
  return await zip.generateAsync({type:"uint8array",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",compression:"DEFLATE"}); }
async function msaSave(m,b,name){ if(!S.dl){ toast("Download isn't available here"); return; }
  try{ const u8=await msaDocx(m,b); await S.dl.save({filename:name+".docx",data:u8}); toast("📄 Word file ready"); }
  catch(e){ if(e?.code!=="declined") toast(e&&e.message?e.message:"Download isn't available here"); } }
async function mqDownload(){ await msaSave(S.mq,mqB(),mqDocName()); }
function mqPartner(){ const key=safeName(S.mq.cap).toLowerCase(); return (S.partners||[]).find(x=>x.id===S.mq.pid)||(S.partners||[]).find(x=>[x.name,x.org].some(v=>v&&safeName(v).toLowerCase()===key)); }
async function mqToPartner(note){ if(!S.db) return; const now=new Date().toISOString(), q=S.mq, p=mqPartner();
  const msa={}; MQ_TXT.forEach(k=>msa[k]=String(q[k]||"").trim()); MQ_PAY.forEach(([k])=>msa["$"+k]=+q[k]||0); msa.savedAt=now;
  const text=note||`MSA details saved (${mqMissing().length} blanks left)`;
  if(p){ await pcol().doc(p.id).update({msa,history:[...(p.history||[]),{at:now,text,changes:{}}].slice(-60)}); S.mq.pid=p.id; mqSave(); }
  else { const r=await pcol().add({name:q.signer||q.cap,org:q.cap,role:q.title||"",phone:q.phone||"",stage:"Call set",tier:"➕ Added by me",source:"MSA builder",msa,order:Math.max(0,...(S.partners||[]).map(x=>+x.order||0))+1,lastContact:"",createdAt:now,latest:"MSA drafted",latestAt:now,history:[{at:now,text:"Added from MSA builder",changes:{}}]}); S.mq.pid=r&&r.id||""; mqSave(); } }
async function mqToDrive(){
  if(!S.mcp){ S.mqErr=true; S.mqMsg="Connect Microsoft 365 in claude.ai → Settings → Connectors, then reload."; mqOut(); return; }
  const name=safeName(S.mq.cap); S.mqBusy=true; S.mqMsg=""; mqOut();
  try{ const folderId=await bqEnsureFolder(name); const bytes=await msaDocx(S.mq,mqB());
    const r=await S.mcp.callTool(M365,"sharepoint_upload_file",{driveId:PB_DRIVE,parentItemId:folderId,filename:mqDocName()+".docx",contentBase64:toB64(bytes),conflictBehavior:"rename"},{cache:false});
    const url=pickStr(r,/"webUrl"\s*:\s*"([^"]+)"/);
    S.mqErr=false; S.mqMsg=`✅ Saved to OneDrive › Partner Budgets › ${esc(name)} (next to the budget)${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">Open in Word</a>`:""}`;
    try{ await mqToPartner("MSA draft saved to OneDrive"+(url?": "+url:"")); }catch(_){}
  }catch(e){ S.mqErr=true; S.mqMsg=e&&e.code==="needs_reauth"?"Microsoft 365 needs reconnecting: claude.ai → Settings → Connectors.":e&&e.code==="not_granted"?"Allow Microsoft 365 for this page to save files (Permissions menu).":"Couldn't save to OneDrive: "+esc(e&&e.message||"try again"); }
  S.mqBusy=false; mqOut(); }
$("list").addEventListener("input",e=>{ if(S.view!=="msa") return; const k=e.target.dataset.mq; if(!k) return; S.mq[k]=e.target.value; S.mqMsg=""; mqSave(); mqOut(); });
$("list").addEventListener("change",e=>{ if(S.view!=="msa"||!e.target.dataset.mqfrom) return; const p=(S.partners||[]).find(x=>x.id===e.target.value);
  if(p) mqFromPartner(p); else S.mq={...S.mq,pid:""}; mqSave(); S.mqMsg=""; $("list").innerHTML=mqHTML(); mqOut(); });
$("list").addEventListener("click",async e=>{ if(S.view!=="msa") return; const b=e.target.closest("[data-mqact]"); if(!b) return; const a=b.dataset.mqact;
  if(a==="budget"){ const q=S.bq||{}; ["G","F1","F2","T1","B1","TB1","B2","TB2","wage","hours","weeks"].forEach(k=>{ if(q[k]!=null&&q[k]!=="") S.mq[k]=q[k]; }); mqSave(); $("list").innerHTML=mqHTML(); mqOut(); toast("💰 Budget numbers copied in"); return; }
  if(a==="tobudget"){ const q=S.mq, n=k=>+String(q[k]??"").replace(/[^\d.]/g,"")||0, subs=n("subs");
    const nb={...S.bq,name:String(q.cap||"").trim()||S.bq.name};
    if(String(q.project||"").trim()) nb.project=String(q.project).trim();
    if(subs) nb.N=subs;
    ["G","F1","F2","T1","B1","TB1","B2","TB2","wage","hours","weeks"].forEach(k=>{ if(q[k]!=null&&q[k]!=="") nb[k]=n(k); });
    S.bq=nb; bqSave(); S.bqMsg=""; S.view="budget"; render(); window.scrollTo&&window.scrollTo(0,0);
    toast(subs?"💰 Budget filled from the MSA":"💰 Budget filled — add Projected customers (MSA has no subscriber estimate yet)"); return; }
  if(a==="clear"){ S.mq={...MQ_DEF}; S.mqMsg=""; mqSave(); $("list").innerHTML=mqHTML(); mqOut(); return; }
  if(a==="pv"){ S.mqPv=!S.mqPv; mqOut(); return; }
  if(a==="doc"){ await mqDownload(); return; }
  if(a==="partner"){ try{ await mqToPartner(); S.mqErr=false; S.mqMsg="🤝 Saved to the partner card (Partners tab → 📝 MSA)"; }catch(err){ S.mqErr=true; S.mqMsg="Couldn't save to the partner card. Try again."; } mqOut(); return; }
  if(a==="drive"){ if(!S.mqBusy) await mqToDrive(); return; } });


// ---- MSA tab: 🔎 Find partner info (street address, mission, who they are) from the web (Parallel Search), Outlook, OneDrive/SharePoint and the partner card
const WEB="Parallel Search"; const WEB_SID=(()=>{ try{ let s=localStorage.getItem("ws.webSid"); if(!s){ s=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()).replace(/-/g,""); localStorage.setItem("ws.webSid",s); } return s; }catch(_){ return "ws"+Date.now(); } })();
S.mqFindBusy=false; S.mqFindMsg=""; S.mqFindErr=false; S.mqFindUndo=null;
const MQ_FIND_KEYS=[["kind","Who they are"],["addr","Street address"],["mission","Mission"],["served","# served"]];
function mqFindHTML(){ return `<div class="pbtns" style="margin:4px 0 10px"><button class="pbtn main" type="button" data-mqact="find"${S.mqFindBusy?" disabled":""}>${S.mqFindBusy?"🔎 Searching the web…":"🔎 Find address, mission & who they are"}</button>${S.mqFindUndo?`<button class="pbtn" type="button" data-mqact="findundo">↩ Undo</button>`:""}</div>${S.mqFindMsg?`<div id="mqFindMsg" class="${S.mqFindErr?"slstatus err":"slstatus"}" style="margin-bottom:10px">${S.mqFindMsg}</div>`:""}`; }
const mqStrip=s=>String(s||"").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
// Research an organization for the MSA: web (Parallel Search) + Outlook + OneDrive + the partner card. Shared by the MSA tab and the partner card.
async function msaResearch(name,p){ const src=[]; S.mqFindWarn="";
  const add=(where,text)=>{ const s=mqStrip(text).slice(0,3500); if(s.length>30) src.push({where,text:s}); };
  if(p) add("Partner card",[p.org,p.name,p.role,p.summary,p.notes,p.latest,p.source,p.body,(p.history||[]).slice(-8).map(h=>h.text).join(" · ")].filter(Boolean).join("\n"));
  if(S.mcp){
    try{
      const wr=await S.mcp.callTool(WEB,"web_search",{objective:`${name}${S.mq.addr?"":""}: official street address, mission statement, and what kind of organization it is (nonprofit, church, school, city, etc.) and where it is based`,search_queries:[name+" address",name+" mission",name+" about us"],session_id:WEB_SID},{cache:false});
      let pl=wr&&(wr.payload??wr); if(typeof pl==="string"){ try{ pl=JSON.parse(pl); }catch(_){ pl=null; } }
      let res=pl&&Array.isArray(pl.results)?pl.results:null;
      if(!res){ const o=parseObjs(resText(wr)).find(x=>x&&Array.isArray(x.results)); res=o?o.results:[]; }
      res.slice(0,8).forEach(x=>add("Website "+(x.url||x.title||""),[x.title,(x.excerpts||[]).join(" ")].join(" — ")));
    }catch(e){ S.mqFindWarn=(e&&e.code==="server_not_connected")?"Web search isn't connected: add Parallel Search in claude.ai → Settings → Connectors.":(e&&/not_in_manifest|not_granted|blocked_by_policy/.test(e.code||""))?"Allow Parallel Search for this page (Permissions menu) to search the web.":"Web search didn't answer this time; used your email and OneDrive."; }
    const call=async(tool,args)=>{ try{ return await S.mcp.callTool(M365,tool,args,{cache:false}); }catch(e){ if(e&&/needs_reauth|server_not_connected|not_in_manifest|not_granted|blocked_by_policy/.test(e.code||"")) S.mqFindWarn=m365Msg(e); return null; } };
    const short=name.replace(/\b(inc|llc|nfp|corp|corporation|the)\b\.?/ig,"").replace(/\s+/g," ").trim();
    const mails=[]; const seen=new Set();
    const keep=r=>resultObjs(r).filter(o=>o&&o.uri&&!seen.has(o.uri)&&(seen.add(o.uri),true));
    const r1=await call("outlook_email_search",{query:'"'+short+'"',limit:10}); if(r1) mails.push(...keep(r1));
    if(p&&p.email){ const r2=await call("outlook_email_search",{sender:p.email,limit:5}); if(r2) mails.push(...keep(r2)); }
    // emails FROM the partner first: their signatures carry the street address
    const dom=p&&p.email?String(p.email).split("@")[1]:"";
    mails.sort((a,b)=>((dom&&String(b.sender||"").includes(dom))?1:0)-((dom&&String(a.sender||"").includes(dom))?1:0));
    mails.slice(0,8).forEach(m=>add("Email “"+(m.subject||"")+"” from "+(m.sender||""),m.summary||""));
    for(const m of mails.slice(0,3)){ const r=await call("read_resource",{uri:m.uri}); if(r){ const o=resultObjs(r)[0]; add("Email “"+(m.subject||"")+"” (full text)",o&&o.body?o.body.content:resText(r)); } }
    const r3=await call("sharepoint_search",{query:short,limit:8}); if(r3) resultObjs(r3).filter(o=>o.name).slice(0,6).forEach(o=>add("OneDrive file “"+o.name+"”",o.content||o.summary||""));
  }
  if(!src.length) return {r:null,src,warn:S.mqFindWarn};
  const prompt=`You fill blanks in a partner contract (an MSA) for the organization "${name}". Use ONLY facts stated in the sources below. Never guess, never use outside knowledge, never invent an address, number or mission. Prefer the organization's own website, then directories (Charity Navigator, 211, IRS), then email signatures. For "from", give the website URL or the email/file name. If a fact is not clearly stated about ${name} itself (not Dimension Energy, not another organization), return "".
Return JSON: {"kind":"short phrase that completes '${name}, ___ with offices at…', e.g. an East St. Louis, Illinois-based nonprofit organization","addr":"street, city, state ZIP of ${name}","mission":"what the organization does, phrased to follow 'the CAP serves to', lowercase start, no period","served":"number of individuals/households it serves, as written","from":{"kind":"which source","addr":"which source","mission":"which source","served":"which source"}}
Sources:
${src.map((s,i)=>`[${i+1}] ${s.where}: ${s.text}`).join("\n\n")}`;
  const r=await S.sample.json(prompt,{modelTier:"default",cache:false}); return {r,src,warn:S.mqFindWarn}; }
async function mqFind(){
  const name=String(S.mq.cap||"").trim();
  if(!name){ S.mqFindErr=true; S.mqFindMsg="Type the partner's legal name first (or pick a partner above)."; mqRefresh(); return; }
  if(!S.sample){ S.mqFindErr=true; S.mqFindMsg="This needs the page opened in claude.ai or the Claude app."; mqRefresh(); return; }
  S.mqFindBusy=true; S.mqFindErr=false; S.mqFindMsg="Searching the web, your email and OneDrive for "+esc(name)+"…"; mqRefresh();
  const p=mqPartner();
  try{
    const {r,src}=await msaResearch(name,p);
    if(!src.length){ S.mqFindBusy=false; S.mqFindErr=true; S.mqFindMsg="Nothing found about "+esc(name)+" on the web, in your email, OneDrive or partner card."+(S.mqFindWarn?" "+esc(S.mqFindWarn):""); mqRefresh(); return; }
    const prev={}, filled=[], skipped=[];
    MQ_FIND_KEYS.forEach(([k,l])=>{ const v=String((r&&r[k])||"").trim(); if(!v) return;
      if(String(S.mq[k]||"").trim()){ skipped.push(l); return; }
      prev[k]=S.mq[k]||""; S.mq[k]=v; filled.push(`<b>${esc(l)}</b>: ${esc(v)}${r.from&&r.from[k]?` <span style="opacity:.7">(${esc(r.from[k])})</span>`:""}`); });
    const missing=MQ_FIND_KEYS.filter(([k])=>!String(S.mq[k]||"").trim()).map(([,l])=>l);
    S.mqFindUndo=filled.length?prev:null; mqSave();
    S.mqFindMsg=(filled.length?"✅ Filled in — check before sending:<br>"+filled.join("<br>"):"Couldn't find these stated on the web, in your email, OneDrive or the partner card.")
      +(skipped.length?`<br>Left your existing ${esc(skipped.join(", "))} as is.`:"")+(missing.length?`<br>Still blank: ${esc(missing.join(", "))} — ask the partner or check their website.`:"")+(S.mqFindWarn?"<br>"+esc(S.mqFindWarn):"");
    S.mqFindErr=false;
  }catch(e){ S.mqFindErr=true; S.mqFindMsg=e&&e.code==="not_granted"?"Allow Claude for this page, then try again.":e&&e.code==="rate_limited"?"Too many requests. Wait a minute and try again.":"Couldn't finish the search. Try again."; }
  S.mqFindBusy=false; S.mqFindWarn=""; mqRefresh(); }
function mqRefresh(){ if(S.view!=="msa") return; const L=$("list"), y=window.scrollY; L.innerHTML=mqHTML(); mqOut(); window.scrollTo(0,y); }
$("list").addEventListener("click",async e=>{ if(S.view!=="msa") return; const b=e.target.closest("[data-mqact]"); if(!b) return;
  if(b.dataset.mqact==="find"){ if(!S.mqFindBusy) await mqFind(); return; }
  if(b.dataset.mqact==="findundo"&&S.mqFindUndo){ Object.assign(S.mq,S.mqFindUndo); S.mqFindUndo=null; S.mqFindMsg="↩ Put back what was there before."; mqSave(); mqRefresh(); } });