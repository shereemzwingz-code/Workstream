// ---- CP check-in view
// Agenda = tasks flagged cpAgenda. Grouped by what CP is being asked to do, not by work area.
// Meeting records live in data/users/<uid>/meetings/items — the same shape a future Teams-transcript agent will write.
const CPT=[["decide","🔴 Decision needed","CP makes a call"],["review","👀 Review / approve","CP signs off or gives feedback"],["plan","🧭 Plan together","Work it out live"],["fyi","📣 FYI","30 seconds, no input needed"]];
const mcol=()=>S.db.doc("data/users/"+S.uid+"/meetings").collection("items");
S.meetings=[]; S.mOpenId=null;
function cpItems(){ return S.tasks.filter(t=>t.cpAgenda&&t.status!=="Complete"&&!t.goal); }
function cpWaiting(){ return S.tasks.filter(t=>t.owner==="CP"&&t.status!=="Complete"&&!t.goal); }
function nextCheckin(){ const d=new Date(); for(let i=0;i<8;i++){ const x=new Date(d); x.setDate(d.getDate()+i); const w=x.getDay(); if((w===2&&(i>0||d.getHours()<10))||(w===4&&(i>0||d.getHours()<15))) return x.toLocaleDateString(undefined,{weekday:"short",month:"numeric",day:"numeric"})+(w===2?" · 9:30 CT":" · 2:00 CT"); } return ""; }
const cpSort=(a,b)=>String(a.dueDate||"9999").localeCompare(String(b.dueDate||"9999"))||sortT(a,b);
function dueChip(t){ return t.dueDate?`<span class="chip${isLate(t)?" late":""}">${isLate(t)?"Overdue ":"Due "}${esc(fmtDue(t))}</span>`:""; }
function cpHTML(){
  const items=cpItems(), wait=cpWaiting(), noAsk=items.filter(t=>!t.cpAsk||!t.cpType).length;
  const mins=items.reduce((m,t)=>m+(t.cpType==="fyi"?1:t.cpType==="plan"?10:5),0);
  let n=0;
  const bar=`<div class="cpbar"><div class="grow"><h2>🗣️ Check-in with Charlotte</h2><div class="sub">${nextCheckin()?"Next: "+esc(nextCheckin())+" · ":""}${items.length} item${items.length===1?"":"s"} · about ${mins} min</div></div>
    ${items.length?`<button class="pbtn main" data-cpcopy="1">📋 Copy agenda for Teams</button>`:""}</div>`;
  const prep=noAsk?`<div class="cpprep">✏️ ${noAsk} item${noAsk===1?" needs":"s need"} an ask before the call — pick a type and write one line on what you need from her.</div>`:"";
  const untyped=items.filter(t=>!t.cpType);
  const groups=[...CPT,["","✏️ Not sorted yet","Pick a type"]].map(([id,label,hint])=>{
    const its=(id?items.filter(t=>t.cpType===id):untyped).sort(cpSort); if(!its.length) return "";
    return `<section class="cpsec"><h3>${label} <span class="n">${its.length}</span><span class="hint2">${hint}</span></h3>${its.map(t=>{ n++; const c=CATS[t.cat]||CATS[1];
      return `<div class="cpitem" style="--c:${c.head}">
        <div class="cptop"><span class="cpnum">${n}.</span><span class="cpt" data-goto="${esc(t.id)}" role="button" tabindex="0">${esc(t.title)}</span>${dueChip(t)}<span class="chip">${stIcon(t.status)} ${esc(t.status)}</span></div>
        <div class="cpaskline"><label for="cpa-${esc(t.id)}">Ask</label><input id="cpa-${esc(t.id)}" class="${t.cpAsk?"":"need"}" data-cpask="${esc(t.id)}" value="${esc(t.cpAsk||"")}" placeholder="One line: what do you need from Charlotte?"></div>
        <div class="types" role="group" aria-label="Type of ask">${CPT.map(([tid,tl])=>`<button data-cptype="${tid}" data-id="${esc(t.id)}" aria-pressed="${t.cpType===tid}">${tl}</button>`).join("")}</div>
        ${t.latest?`<div class="cpctx">Where it stands: ${esc(t.latest)}</div>`:""}
        <div class="cpdone"><input data-cpout="${esc(t.id)}" placeholder="During the call: what did she decide or say?" aria-label="Outcome for ${esc(t.title)}"><button class="pbtn" data-cpdisc="${esc(t.id)}">✓ Discussed</button></div>
      </div>`; }).join("")}</section>`; }).join("");
  const empty=items.length?"":`<section class="cpsec"><div class="cpempty">Nothing on the agenda yet. Monday: update the tracker, then open each task that needs Charlotte and tap <b>🗣️ Add to CP agenda</b>.</div></section>`;
  const waitHTML=`<section class="cpsec"><h3>⏳ Waiting on Charlotte <span class="n">${wait.length}</span><span class="hint2">Her to-dos — check in on these</span></h3>${wait.length?wait.sort(cpSort).map(t=>`<div class="cpwait"><span class="cpt" data-goto="${esc(t.id)}" role="button" tabindex="0">${esc(t.title)}</span>${dueChip(t)}</div>`).join(""):`<div class="cpempty">Nothing waiting on her.</div>`}</section>`;
  const ms=S.meetings.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8);
  const li=a=>(a||[]).length?`<ul>${a.map(x=>`<li>${typeof x==="string"?esc(x):esc(x.text)+(x.due?` <span class="chip">Due ${esc(x.due)}</span>`:"")}</li>`).join("")}</ul>`:`<div class="cpctx">None</div>`;
  const recs=`<section class="cpsec"><h3>🗒️ Past check-ins <span class="n">${S.meetings.length}</span></h3>${ms.length?ms.map((m,i)=>`<details class="mrec"${i===0?" open":""}><summary>${esc(m.title||"Check-in")} <span class="sub">· ${esc(m.date)}${m.source?" · "+esc(m.source):""}</span></summary><div class="mbody">
      ${m.decisions?.length?`<div><h4>Decisions</h4>${li(m.decisions)}</div>`:""}
      <div><h4>My action items</h4>${li(m.actionsMe)}</div>
      <div><h4>Charlotte's action items</h4>${li(m.actionsCP)}</div>
      ${m.discussed?.length?`<div><h4>Discussed</h4>${li(m.discussed.map(d=>d.title+(d.outcome?" — "+d.outcome:"")))}</div>`:""}
      ${m.open?.length?`<div><h4>Open questions</h4>${li(m.open)}</div>`:""}
      ${m.gaps?`<div class="mgap">⚠️ ${esc(m.gaps)}</div>`:""}
    </div></details>`).join(""):`<div class="cpempty">Notes from each check-in land here.</div>`}</section>`;
  return `<div class="cpwrap">${bar}${prep}${groups}${empty}${waitHTML}${recs}</div>`;
}
function cpAgendaText(){
  const items=cpItems(); let n=0; const L=["Check-in agenda"+(nextCheckin()?" — "+nextCheckin():""),""];
  for(const [id,label] of [...CPT,["","Other"]]){ const its=(id?items.filter(t=>t.cpType===id):items.filter(t=>!t.cpType)).sort(cpSort); if(!its.length) continue;
    L.push(label.replace(/^\S+\s/,"").toUpperCase()); its.forEach(t=>{ n++; L.push(`${n}. ${t.title}${t.dueDate?" (due "+fmtDue(t)+")":""}`); if(t.cpAsk) L.push("   → "+t.cpAsk); }); L.push(""); }
  const w=cpWaiting(); if(w.length){ L.push("ON YOUR LIST"); w.forEach(t=>L.push("• "+t.title)); }
  return L.join("\n").trim();
}
async function cpUpdate(t,patch,text){ const now=new Date().toISOString(); const ch={}; for(const k in patch) ch[k]=[String(t[k]??""),String(patch[k]??"")];
  const hist=[...(t.history||[]),{at:now,text,changes:ch}].slice(-60); await col().doc(t.id).update({...patch,history:hist}); }
$("list").addEventListener("change",async e=>{ const id=e.target.dataset?.cpask; if(!id||!S.db) return; const t=S.tasks.find(x=>x.id===id); if(!t) return;
  const v=e.target.value.trim(); if(v===(t.cpAsk||"")) return;
  try{ await cpUpdate(t,{cpAsk:v},"Ask for CP: "+(v||"(cleared)")); toast("💾 Saved"); }catch(err){ writeErr(err); } });
$("list").addEventListener("click",async e=>{
  if(S.view!=="cp") return;
  if(e.target.closest("[data-cpcopy]")){ const txt=cpAgendaText();
    try{ await navigator.clipboard.writeText(txt); toast("📋 Copied — paste it in the Teams chat"); }catch(_){ const ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); toast("📋 Copied"); }catch(__){ toast("Couldn't copy. Select the text and copy it."); } ta.remove(); } return; }
  const ty=e.target.closest("[data-cptype]"); if(ty){ const t=S.tasks.find(x=>x.id===ty.dataset.id); if(!t) return; const v=t.cpType===ty.dataset.cptype?"":ty.dataset.cptype;
    try{ await cpUpdate(t,{cpType:v},"CP ask type: "+(v||"(cleared)")); }catch(err){ writeErr(err); } return; }
  const dz=e.target.closest("[data-cpdisc]"); if(dz){ const t=S.tasks.find(x=>x.id===dz.dataset.cpdisc); if(!t) return;
    const out=(document.querySelector(`[data-cpout="${CSS.escape(t.id)}"]`)?.value||"").trim(); const day=ymd(new Date());
    try{
      await cpUpdate(t,{cpAgenda:false,cpAsk:"",cpType:"",latest:out?"CP: "+out:t.latest||"",latestAt:new Date().toISOString()},"Discussed with CP"+(out?": "+out:""));
      const ref=mcol().doc(day); const ex=S.meetings.find(m=>m.id===day);
      const disc=[...((ex&&ex.discussed)||[]),{taskId:t.id,title:t.title,outcome:out}];
      if(ex) await ref.update({discussed:disc}); else await ref.set({date:day,title:"CP check-in",source:"Logged live",decisions:[],actionsMe:[],actionsCP:[],open:[],discussed:disc,createdAt:new Date().toISOString()});
      toast("✓ Logged to today's check-in");
    }catch(err){ writeErr(err); } return; }
});
function bootMeetings(){ if(!S.db||!S.uid||S.mBooted) return; S.mBooted=true; mcol().onSnapshot(snap=>{ S.meetings=snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.date); if(S.view==="cp") renderList(); },()=>{}); }
setInterval(bootMeetings,500);



// Rebuilds "C&C Campaign Cost Calculator_7.13.xlsx" with a partner's variables filled in.
// Shared by the Workstream page (window.ExcelJS) and the node test.
function buildBudgetWorkbook(ExcelJS, v){
  const wb=new ExcelJS.Workbook();
  const T=wb.addWorksheet("Tab 1"), A=wb.addWorksheet("Breakeven Analysis"), N=wb.addWorksheet("Notes");
  const USD0='"$"#,##0', USD3='"$"0.000', USD2='"$"0.00';
  const put=(ws,addr,val,fmt,bold)=>{ const c=ws.getCell(addr); c.value=val; if(fmt) c.numFmt=fmt; if(bold) c.font={bold:true}; return c; };
  const f=x=>({formula:x});
  const fmtD=iso=>{ const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
  const addDays=(iso,n)=>{ const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const len=Math.max(1,+v.weeks||12)*7, Nn=Math.max(1,+v.N||1);
  const when=n=>v.start?fmtD(addDays(v.start,Math.round(len*Math.min(1,n/Nn)))):"";

  T.columns=[{width:3},{width:52},{width:14},{width:40},{width:26},{width:6}];
  put(T,"B1",`${v.name} — C&C Campaign Budget`,null,true).font={bold:true,size:14};
  put(T,"B2","Market Rate Assumptions - $/kWh [Adjust based on market]",null,true); put(T,"E2","Legend",null,true);
  put(T,"B3","Avg Customer Usage STATE (kWh) (As of 2/6/26)"); put(T,"C3",+v.U||7500,"#,##0"); put(T,"E3","market-specific input");
  put(T,"B4","Ampion aquistition costs"); put(T,"C4",f("0.08"),USD3); put(T,"E4","partner-specific input");
  put(T,"B5","70% Ampion costs"); put(T,"C5",f("C4*0.7"),USD3);
  put(T,"B6","Ampion assist cost (5% of enrollment cases)"); put(T,"C6",0.02,USD3);
  put(T,"B7","Ampion onboarding cost (95% of enrollment cases"); put(T,"C7",0.01,USD3);
  put(T,"B8","Target all-in C&C partner cost"); put(T,"C8",f("C5-((0.95*C7)+(0.05*C6))"),USD3);
  put(T,"B9","Gift Card "); put(T,"C9",f("50/C3"),USD3); put(T,"D9","$/customer");
  put(T,"B10","Target C&C partner direct cost"); put(T,"C10",f("C5-((0.95*C7)+(0.05*C6))-C9"),USD3); put(T,"D10",f("C10*C3"),'"$"#,##0.000');
  put(T,"B11","100% Ampion partner direct cost"); put(T,"C11",f("C4+C9"),USD3); put(T,"D11",f("C11*C3"),USD2);
  put(T,"B13","C&C Partner Campaign Variables - Adjust based on market",null,true); put(T,"D13","Notes",null,true);
  const rows=[[14,"Projected Customers Aquired through Channel ",+v.N,"#,##0"],[15,"Upfront Grant ",+v.G,USD0],[16,"Per-subscriber fee",+v.F1,USD0],[17,"Per-subscriber step-up",+v.F2,USD0],[18,"After X subscribers",+v.T1,"#,##0"],[19,"Bonus 1",+v.B1,USD0],[20,"After X subscribers",+v.TB1,"#,##0"],[21,"Bonus 2",+v.B2,USD0],[22,"After X subscribers",+v.TB2,"#,##0"]];
  rows.forEach(([r,l,val,fm])=>{ put(T,"B"+r,l); const c=put(T,"C"+r,val,fm); c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFF2CC"}}; });
  put(T,"D14",`${Math.round(Nn/Math.max(1,+v.weeks||12)*4.33)}/month pace${v.project?" · Project: "+v.project:""}`);
  put(T,"D18",`Milestone 1: ${v.T1} customers${when(+v.T1)?" by "+when(+v.T1):""}`);
  put(T,"D20",`Milestone 2: ${v.TB1} customers${when(+v.TB1)?" by "+when(+v.TB1):""}`);
  put(T,"D22",`Milestone 3: ${v.TB2} customers${when(+v.TB2)?" by "+when(+v.TB2):""}`);
  put(T,"B23","Staff salary"); put(T,"C23",f("PRODUCT(C24,C25,C26)"),USD0);
  [[24,"Wage",+v.wage,USD2],[25,"Weeks",+v.weeks,"0"],[26,"# of hours per week",+v.hours,"0"]].forEach(([r,l,val,fm])=>{ put(T,"B"+r,l); const c=put(T,"C"+r,val,fm); c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFF2CC"}}; });
  if(v.start) put(T,"D25",`extend based on meeting goal^ · starts ${fmtD(v.start)}`); else put(T,"D25","extend based on meeting goal^");
  put(T,"B28","Calculations",null,true); put(T,"C28",f("C15+C16*MIN(C14,C18)+C17*MAX(C14-C18,0)+IF(C14>=C20,C19,0)+IF(C14>=C22,C21,0)+C23"),USD0,true);
  put(T,"B29","CAC at target enrollments ($/customer)"); put(T,"C29",f("C28/C14"),USD0);
  put(T,"B30","CAC at target enrollments ($/kWh)"); put(T,"C30",f("C28/(C3*C14)"),USD3);
  put(T,"B33","Practical Breakeven Calculator",null,true);
  put(T,"B35","Enter target $/kWh:"); put(T,"C35",+v.target||0.056,USD3);
  put(T,"B37","Calculated Breakeven (iterative check):",null,true);
  const BA="'Breakeven Analysis'!";
  put(T,"B38","Tier 1 estimate (if no step-up/bonuses):"); put(T,"C38",f(`(${BA}$C$4+${BA}$C$5)/($C$35*${BA}$C$13-${BA}$C$6)`),"0");
  put(T,"B39","Is this valid (≤ Tier 1 threshold)?"); put(T,"C39",f(`IF(C38<=${BA}$C$7,"YES - use this","NO - check Tier 2")`));
  put(T,"B41","Tier 2 estimate:"); put(T,"C41",f(`(${BA}$C$4+${BA}$C$5+${BA}$C$7*(${BA}$C$8-${BA}$C$6))/($C$35*${BA}$C$13-${BA}$C$8)`),"0");
  put(T,"B42","Includes Bonus 1?"); put(T,"C42",f(`IF(C41>=${BA}$C$10,"YES","NO")`));
  put(T,"B43","Includes Bonus 2?"); put(T,"C43",f(`IF(C41>=${BA}$C$12,"YES","NO")`));
  put(T,"B45","Final Breakeven Customers:",null,true); put(T,"C45",f(`IF(C38<=${BA}$C$7,C38,C41)`),"0",true);
  put(T,"B46","Verification - Cost/kWh at breakeven:"); put(T,"C46",f(`(${BA}$C$4+${BA}$C$5+(MIN(C45,${BA}$C$7)*${BA}$C$6)+(MAX(0,C45-${BA}$C$7)*${BA}$C$8)+IF(C45>=${BA}$C$10,${BA}$C$9,0)+IF(C45>=${BA}$C$12,${BA}$C$11,0))/(C45*${BA}$C$13)`),USD3);

  A.columns=[{width:16},{width:24},{width:14},{width:22},{width:22}];
  put(A,"A1","Breakeven Analysis - Cost Per kWh at Different Customer Levels",null,true);
  put(A,"A3","Inputs (from Tab 1)",null,true);
  [[4,"Upfront Grant (G)","'Tab 1'!C15",USD0],[5,"Staff Salary","'Tab 1'!C23",USD0],[6,"Per-subscriber fee (Tier 1)","'Tab 1'!C16",USD0],[7,"Tier 1 threshold","'Tab 1'!C18","0"],[8,"Per-subscriber step-up (Tier 2)","'Tab 1'!C17",USD0],[9,"Bonus 1 (at threshold)","'Tab 1'!C19",USD0],[10,"Bonus 1 threshold","'Tab 1'!C20","0"],[11,"Bonus 2 (at threshold)","'Tab 1'!C21",USD0],[12,"Bonus 2 threshold","'Tab 1'!C22","0"],[13,"Avg Customer Usage (kWh)","'Tab 1'!C3","#,##0"]]
    .forEach(([r,l,fx,fm])=>{ put(A,"A"+r,l); put(A,"C"+r,f(fx),fm); });
  put(A,"A15","Target Thresholds",null,true);
  put(A,"A16","100% Ampion Cost"); put(A,"C16",f("'Tab 1'!C11"),USD3);
  put(A,"A17","70% Ampion Cost"); put(A,"C17",f("'Tab 1'!C10"),USD3);
  put(A,"A19","Cost Analysis by Customer Count",null,true);
  ["# Customers","Total Cost","Cost per kWh","Beats 100% Ampion?","Beats 70% Ampion?"].forEach((h,i)=>{ const c=A.getRow(20).getCell(i+1); c.value=h; c.font={bold:true}; });
  [50,100,150,200,300,400,500,750,1000].forEach((n,j)=>{ const r=21+j;
    put(A,"A"+r,n); put(A,"B"+r,f(`$C$4 + $C$5 + (MIN(A${r}, $C$7) * $C$6) + (MAX(0, A${r} - $C$7) * $C$8) + IF(A${r} >= $C$10, $C$9, 0) + IF(A${r} >= $C$12, $C$11, 0)`),USD0);
    put(A,"C"+r,f(`B${r} / (A${r} * $C$13)`),USD3); put(A,"D"+r,f(`IF(C${r} < $C$16, "YES", "NO")`)); put(A,"E"+r,f(`IF(C${r} < $C$17, "YES", "NO")`)); });
  const gen=["Generic Breakeven Formula (with Tiered Costs)","","Total Cost (N) = G + S + (min(N, T₁) × F₁) + (max(0, N - T₁) × F₂) + B₁(N) + B₂(N)","","TIER 1 (N ≤ T₁): N = (G + S) / (P × U - F₁)","TIER 2 (N > T₁, before bonuses): N = (G + S + T₁ × (F₂ - F₁)) / (P × U - F₂)","TIER 2 + BONUS 1: N = (G + S + T₁ × (F₂ - F₁) + B₁) / (P × U - F₂)","TIER 2 + BOTH BONUSES: N = (G + S + T₁ × (F₂ - F₁) + B₁ + B₂) / (P × U - F₂)","","Note: The breakeven formula becomes piecewise because costs 'jump' at each threshold."];
  gen.forEach((t,i)=>{ if(t) put(A,"A"+(33+i),t,null,i===0); });

  N.columns=[{width:110}];
  ["CC Review Note","Review notes for CC","Our actual breakeven point is where our new cost structure's cost per kWh equals $0.063/kWh","Our desired breakeven point is where our new cost structure's cost per kWh equals $0.028/kWh (30% haircut to Ampion)","Let's calculate both. ","An easy way to think about this is that we should set our new cost/kWh equal to the cost to beat, solving for N, where N is number of customers needed to breakeven with the new costs. G is really the main cost to \"dig out of\" where scale helps us.","Upfront grant (G) + (fixed cost F * number of customers N)]/Total usage e.g. Avg usage * N = 0.063","N = G/(0.063 X usage) - F"]
    .forEach((t,i)=>{ const c=N.getCell("A"+(i+1)); c.value=t; c.alignment={wrapText:true}; if(i===0) c.font={bold:true}; });
  wb.calcProperties={fullCalcOnLoad:true};
  return wb;
}
// Fills the original C&C calculator in place: only the input cells change, then every formula's saved result
// is recalculated and written back, so the file shows correct numbers even before Excel recalculates (Protected View, previews).
async function fillTemplateXlsx(JSZip, bytes, vals, libs){
  const zip=await JSZip.loadAsync(bytes);
  const wbx=await zip.file("xl/workbook.xml").async("string"), rels=await zip.file("xl/_rels/workbook.xml.rels").async("string");
  const pathOf={}; for(const m of wbx.matchAll(/<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)){ const t=(rels.match(new RegExp('<Relationship [^>]*Id="'+m[2]+'"[^>]*Target="([^"]+)"'))||rels.match(new RegExp('<Relationship [^>]*Target="([^"]+)"[^>]*Id="'+m[2]+'"'))||[])[1]; if(t) pathOf[m[1].replace(/&amp;/g,"&")]="xl/"+t.replace(/^\/?xl\//,""); }
  const tabPath=pathOf["Tab 1"]; if(!tabPath) throw new Error("Couldn't find Tab 1 in the template");
  const cellRe=ref=>new RegExp('<c r="'+ref+'"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)');
  let tab=await zip.file(tabPath).async("string");
  for(const [ref,num] of Object.entries(vals)){ const m=tab.match(cellRe(ref)); if(!m) throw new Error("Cell "+ref+" missing in template");
    const rep='<c r="'+ref+'"'+m[1].replace(/\s+t="[^"]*"/,"")+'><v>'+String(+num)+'</v></c>'; tab=tab.replace(cellRe(ref),()=>rep); }
  // Fix Tab 1!C41 (Tier 2 breakeven): the template's formula referenced itself and flipped a sign, so it showed 0.
  const BA="'Breakeven Analysis'!", X=`(${BA}$C$4+${BA}$C$5+${BA}$C$7*(${BA}$C$6-${BA}$C$8))`, Dn=`($C$35*${BA}$C$13-${BA}$C$8)`;
  const c41=`IF(${X}/${Dn}<${BA}$C$10,${X}/${Dn},IF((${X}+${BA}$C$9)/${Dn}<${BA}$C$12,(${X}+${BA}$C$9)/${Dn},(${X}+${BA}$C$9+${BA}$C$11)/${Dn}))`;
  const xmlF=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  tab=tab.replace(/(<c r="C41"[^>]*>)<f[^>]*>[\s\S]*?<\/f>/,(m,o)=>o+"<f>"+xmlF(c41)+"</f>");
  tab=tab.replace(/(<c r="C4[23]"[^>]*>)<f ca="1">/g,(m,o)=>o+"<f>");
  zip.file(tabPath,tab);
  // Recalculate every formula and store its result
  const {ExcelJS,HyperFormula}=libs||{};
  if(ExcelJS&&HyperFormula){
    const tmp=await zip.generateAsync({type:"uint8array"}); const wb=new ExcelJS.Workbook(); await wb.xlsx.load(tmp);
    const plain=v=>{ if(v==null) return null; if(typeof v==="object"){ if(v.richText) return v.richText.map(x=>x.text).join(""); if(v.text!=null) return v.text; if("formula" in v||"sharedFormula" in v) return null; if(v.error) return v.error; } return v; };
    const data={}; for(const ws of wb.worksheets){ const rows=[]; ws.eachRow({includeEmpty:true},(row,r)=>{ const a=[]; row.eachCell({includeEmpty:true},(c,ci)=>{ a[ci-1]=c.formula?"="+c.formula:plain(c.value); }); rows[r-1]=a; }); for(let i=0;i<rows.length;i++) if(!rows[i]) rows[i]=[]; data[ws.name]=rows; }
    const hf=HyperFormula.buildFromSheets(data,{licenseKey:"gpl-v3"});
    for(const ws of wb.worksheets){ const p=pathOf[ws.name]; if(!p||!zip.file(p)) continue; let x=await zip.file(p).async("string"); const sid=hf.getSheetId(ws.name);
      ws.eachRow({includeEmpty:false},(row,r)=>row.eachCell({includeEmpty:false},(cell,c)=>{ if(!cell.formula) return;
        const v=hf.getCellValue({sheet:sid,row:r-1,col:c-1}); if(v&&typeof v==="object") return; // keep Excel's saved result for errors / circular cells
        const ref=cell.address, re=new RegExp('<c r="'+ref+'"([^>]*?)>(<f[^>]*/>|<f[^>]*>[\\s\\S]*?</f>)(?:<v>[\\s\\S]*?</v>)?</c>'); const m=x.match(re); if(!m) return;
        const attrs=m[1].replace(/\s+t="[^"]*"/,"")+(typeof v==="string"?' t="str"':typeof v==="boolean"?' t="b"':"");
        const val=typeof v==="boolean"?(v?1:0):typeof v==="string"?v.replace(/&/g,"&amp;").replace(/</g,"&lt;"):String(v);
        const rep='<c r="'+ref+'"'+attrs+'>'+m[2]+'<v>'+val+'</v></c>'; x=x.replace(re,()=>rep); }));
      zip.file(p,x); }
  }
  zip.file("xl/workbook.xml",wbx.replace(/<calcPr([^>]*?)\/>/,(m,a)=>'<calcPr'+a.replace(/\s+fullCalcOnLoad="[^"]*"/,"")+' fullCalcOnLoad="1"/>'));
  Object.keys(zip.files).forEach(n=>{ if(zip.files[n].dir) delete zip.files[n]; });
  return await zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
}
// Matches the MSA: step-up starts after T1 subscribers, milestones pay when the count is reached (CC's sheet had 100 typed in and ">" — fixed in our copy)
function budgetTotal(v){ const n=+v.N, t=+v.T1||100; return +v.G+(+v.F1)*Math.min(n,t)+(+v.F2)*Math.max(n-t,0)+(n>=+v.TB1?+v.B1:0)+(n>=+v.TB2?+v.B2:0)+(+v.wage)*(+v.weeks)*(+v.hours); }
