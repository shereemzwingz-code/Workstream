// ---- export
const csv=v=>{ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
const XL_SECTIONS={1:["1. ENROLLMENT PARTNER CHANNELS","Goal: 5+ channels live, each averaging 10 enrollments/week."],
 2:["2. COMMUNITY AMBASSADOR PROGRAM","Goal: 2+ Ambassadors each signing up 20+ people. Expand to VA/NJ on proof of concept."],
 3:["3. IN-PERSON ENROLLMENT EVENTS","Goal: 1-2 events/month in target geographies. 400+ households enrolled by year end."],
 4:["4. MARKETING AND SALES TOOLKITS","Goal: Create playbooks, toolkits, and collateral that make IL campaigns work."],
 5:["5. CAMPAIGN PROCESS IMPROVEMENT/ CUSTOMER EXPERIENCE/ CUSTOMER ACQUISITION","Goal: Automations to cut manual work, improve follow-up, and make campaigns scalable."],
 6:["6. ILLINOIS SHINES SUBSCRIBER COMPLIANCE SUPPORT","Goal: Assist Elena & Jon with Part 2 verifications and designee registrations."],
 7:["7. REPORTING AND CADENCE","Goal: Build out DE as customer facing"]};
function notesFor(t){
  // Smartsheet export: a plain summary of next steps only.
  // No Who / Latest / background notes — those can hold internal CP/CC conversation and stay in the app.
  const L=[];
  const ns=String(t.nextStep||"").trim();
  if(ns) ns.split(/\s*;\s*|\s*\n+\s*/).map(s=>s.replace(/^[-•\s]+/,"").trim()).filter(Boolean)
    .forEach(s=>L.push("- "+s.charAt(0).toUpperCase()+s.slice(1)));
  if(t.doneWhen) L.push("- Done when: "+t.doneWhen);
  return L.join("\n");
}
// Download = priority items only: starred (★) open tasks, and Priority 1 partners
const prioTasks=k=>S.tasks.filter(t=>+t.cat===+k&&t.priority&&t.status!=="Complete").slice().sort(sortT);
async function doExport(dl){
  if(!window.ExcelJS){ return doCsv(dl); }
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet("Workstream",{views:[{state:"frozen",ySplit:1}]});
  ws.columns=[{width:65.3},{width:23.4},{width:23.4},{width:95.8}];
  const F=(b,sz=10)=>({name:"Arial",size:sz,bold:b});
  const fill=c=>({type:"pattern",pattern:"solid",fgColor:{argb:"FF"+c}});
  const hdr=ws.addRow(["Task Name","Status","Due Date","Notes"]); hdr.eachCell(c=>c.font=F(true,12));
  for(const k of Object.keys(CATS)){
    const [title,goal]=XL_SECTIONS[k];
    if(!prioTasks(k).length) continue;
    const r=ws.addRow([title,null,null,goal]);
    for(let i=1;i<=4;i++){ const c=r.getCell(i); c.font=F(true); c.fill=fill("B9DDFC"); c.alignment={vertical:"top",wrapText:i===1||i===4}; }
    prioTasks(k).forEach(t=>{
      let due=null; if(t.dueDate){ const [y,m,d]=t.dueDate.split("-").map(Number); due=new Date(Date.UTC(y,m-1,d)); }
      const row=ws.addRow([t.title,t.status||"Not Started",due,notesFor(t)||null]);
      for(let i=1;i<=4;i++){ const c=row.getCell(i); c.font=F(false); c.fill=fill("E2F2FE"); c.alignment={vertical:"top",wrapText:i===1||i===4}; }
      row.getCell(3).numFmt="MM/dd/yy";
    });
  }
  if(S.partners&&S.partners.length){
    const ps=wb.addWorksheet("Partners",{views:[{state:"frozen",ySplit:1}]});
    ps.columns=[{width:24},{width:34},{width:28},{width:22},{width:9},{width:34},{width:16},{width:42},{width:13},{width:70}];
    const h=ps.addRow(["Name","Organization","Role","Partner Status","Priority","Email","Phone","Next Step","Last Contact","Notes"]); h.eachCell(c=>c.font=F(true,12));
    for(const [pv,tier] of PRIS.filter(([v])=>v==="1")){
      const items=S.partners.filter(p=>priOf(p)===pv).sort((a,b)=>String(a.org||a.name||"").localeCompare(String(b.org||b.name||""),undefined,{sensitivity:"base"})); if(!items.length) continue;
      const r=ps.addRow([tier.replace(/^\S+\s/,"").toUpperCase()]); for(let i=1;i<=10;i++){ const c=r.getCell(i); c.font=F(true); c.fill=fill("B9DDFC"); }
      items.forEach(p=>{ const row=ps.addRow([p.name,p.org,p.role,p.ssStatus||"",priOf(p),p.email,p.phone,p.nextStep,p.lastContact?fmtShort(p.lastContact):"",p.notes]);
        for(let i=1;i<=10;i++){ const c=row.getCell(i); c.font=F(false); c.fill=fill("E2F2FE"); c.alignment={vertical:"top",wrapText:i===8||i===10}; } });
    }
  }
  wb.addWorksheet("Comments");
  try{
    const buf=await wb.xlsx.writeBuffer();
    await dl.save({filename:`Workstream - Priority ${ymd(new Date())}.xlsx`,data:new Uint8Array(buf)});
    toast("📤 Priority items ready for Smartsheet");
  }catch(e){
    if(e?.code==="declined") return;
    if(e?.code==="extension_not_enabled"||e?.code==="rejected_extension") return doCsv(dl);
    toast("Download isn't available here");
  }
}
async function doCsv(dl){
  const rows=[["Task Name","Status","Due Date","Notes"]];
  for(const k of Object.keys(CATS)){ if(!prioTasks(k).length) continue; rows.push([XL_SECTIONS[k][0],"","",XL_SECTIONS[k][1]]); prioTasks(k).forEach(t=>rows.push([t.title,t.status,t.dueDate,notesFor(t)])); }
  try{ await dl.save({filename:`Workstream - Priority ${ymd(new Date())}.csv`,data:rows.map(r=>r.map(csv).join(",")).join("\n")}); toast("Saved as CSV (Excel format isn't available here)"); }catch(e){ if(e?.code!=="declined") toast("Download isn't available here"); }
}

// ---- boot
$("today").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
render();
matchMedia("(prefers-color-scheme:dark)").addEventListener?.("change",()=>renderList());
(async()=>{
  const c=window.claude;
  if(!c||!c.use){ S.loaded=true; $("status").innerHTML=`<div class="banner">Open this page from claude.ai or the Claude app to load your tasks.</div>`; render(); return; }
  const [db,user,dl,sample]=await Promise.all([c.use("db"),c.use("user"),c.use("downloads"),c.use("sample")]);
  S.sample=sample;
  if(sample){ $("recapBtn").hidden=false; $("recapBtn").onclick=()=>{ S.aiCtx={kind:"cp",name:"Teams — Friday update"}; askClaude("✨ Friday update for Teams",recapPrompt()); }; }
  S.dl=dl;
  if(dl){ S.exportDl=dl; $("exportBtn").hidden=false; $("exportBtn").onclick=()=>doExport(dl); }
  const uid=user?await user.id():null;
  if(!db||!uid){ S.loaded=true; $("status").innerHTML=`<div class="banner">Sign in to load and save your tasks.</div>`; render(); return; }
  S.db=db; S.uid=uid; mqLoadSaved(); wsSyncStart();
  lcol().onSnapshot(snap=>{ S.links=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.url||x.label); render(); },()=>{});
  ucol().onSnapshot(snap=>{ S.utm=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.link); if(S.view==="tools") utmLogOut(); },()=>{});
  bgcol().onSnapshot(snap=>{ S.badges=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.name); render(); },()=>{});
  scol().onSnapshot(snap=>{ S.slides=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.name); render(); },()=>{});
  c.use("mcp").then(m=>{ S.mcp=m; loadMeet(); render(); }).catch(()=>{});
  pcol().onSnapshot(snap=>{ S.partners=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.name); S.pLoaded=true; render(); },()=>{ S.pLoaded=true; render(); });
  col().onSnapshot(snap=>{ S.tasks=snap.docs.map(d=>({id:d.id,...d.data()})).filter(t=>t.title); S.loaded=true; render(); },
    ()=>{ S.loaded=true; $("status").innerHTML=`<div class="banner">Your tasks couldn't load. Reload the page to try again.</div>`; render(); });
})();

