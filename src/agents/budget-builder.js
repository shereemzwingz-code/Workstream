// ---- Budget builder: name + campaign variables in -> filled C&C calculator saved to OneDrive › Partner Budgets › <Partner>
const PB_DRIVE="b!LbTgD2hPLEOTjt9sOR8yACa11d2gO_FBoLFnUnH19xMFXuYbmMBHR7-1YSfLke_8", PB_FOLDER="01F2MNDESWVLP7M4ALWNGIRTTWVSR3YERX";
const BQ_PROJECTS=["","Harper Creek (Cat 4)","Trenton","Gateway","Elm Grove","Champaign","Mount Olive 2","Chicago project"];
const BQ_DEF={name:"",project:"",start:"",N:150,G:2000,F1:100,F2:150,T1:100,B1:4000,TB1:100,B2:5000,TB2:150,wage:25,weeks:12,hours:20};
const BQ_F=[["N","Projected customers acquired through channel","#"],["G","Upfront grant","$"],["F1","Per-subscriber fee","$"],["F2","Per-subscriber step-up","$"],["T1","Step-up after X subscribers","#"],["B1","Bonus 1","$"],["TB1","Bonus 1 after X subscribers","#"],["B2","Bonus 2","$"],["TB2","Bonus 2 after X subscribers","#"],["wage","Staff wage ($/hr)","$"],["weeks","Weeks","#"],["hours","# of hours per week","#"]];
S.bq=(()=>{ try{ return {...BQ_DEF,...JSON.parse(localStorage.getItem("ws.bq2")||"{}")}; }catch(_){ return {...BQ_DEF}; } })(); S.bqBusy=false; S.bqMsg="";
function bqSave(){ try{ localStorage.setItem("ws.bq2",JSON.stringify(S.bq)); }catch(_){} }
const safeName=x=>String(x||"").replace(/[\\/:*?"<>|#%]+/g," ").replace(/\s+/g," ").trim().slice(0,120);
function bqCalc(v){ const U=7500,P=0.056,S2=(+v.wage)*(+v.weeks)*(+v.hours), total=budgetTotal(v), n=Math.max(1,+v.N);
  const t1=(+v.G+S2)/(P*U-(+v.F1)), t2=(+v.G+S2+(+v.T1)*((+v.F2)-(+v.F1)))/(P*U-(+v.F2)); const be=Math.ceil(t1<=+v.T1?t1:t2);
  const p70=0.056-((0.95*0.01)+(0.05*0.02))-50/U, p100=0.08+50/U;
  return {S:S2,total,perCust:total/n,perKwh:total/(n*U),be,p70,p100}; }
function bqHTML(){ const q=S.bq;
  return `<div class="bq" id="bqform"><section class="bqcard"><h2>💰 Budget builder</h2><p class="sub">Type the partner and their campaign variables. Save fills your numbers into the original C&amp;C Campaign Cost Calculator (nothing else in the file changes) and puts it in OneDrive › Partner Budgets › the partner's folder.</p>
  <div class="bqgrid"><div class="bqbig" style="grid-column:1/-1"><label for="bq-name">Partner name</label><input id="bq-name" data-bq="name" value="${esc(q.name)}" placeholder="Partner name"></div>
   <div><label for="bq-proj">Project</label><select id="bq-proj" data-bq="project">${BQ_PROJECTS.map(x=>`<option value="${esc(x)}"${x===q.project?" selected":""}>${x||"Pick a project"}</option>`).join("")}</select></div>
   <div><label for="bq-start">Campaign start (for milestone dates)</label><input id="bq-start" type="date" data-bq="start" value="${esc(q.start)}"></div></div>
  <h3 style="font-size:14px;margin:16px 0 8px">C&amp;C Partner Campaign Variables</h3>
  <div class="bqgrid">${BQ_F.map(([k,l,t])=>`<div><label for="bq-${k}">${l}</label><input id="bq-${k}" type="number" min="0" step="any" data-bq="${k}" value="${esc(q[k])}"${t==="$"?' inputmode="decimal"':' inputmode="numeric"'}></div>`).join("")}</div>
  <div class="pbtns" style="margin-top:12px"><button class="pbtn" data-bqact="reset" type="button">Reset to template values</button></div></section>
  <section class="bqcard" id="bqout" aria-live="polite"></section></div>`; }
function bqSheet(q){ // mirrors the calculator file (total uses "After X subscribers" + pays milestones at the count, same as the MSA)
  const U=7500,P=0.056,n=+q.N||0,G=+q.G||0,F1=+q.F1||0,F2=+q.F2||0,T1=+q.T1||0,B1=+q.B1||0,TB1=+q.TB1||0,B2=+q.B2||0,TB2=+q.TB2||0;
  const Sx=(+q.wage||0)*(+q.weeks||0)*(+q.hours||0);
  const C28=G+F1*Math.min(n,T1)+F2*Math.max(n-T1,0)+(n>=TB1?B1:0)+(n>=TB2?B2:0)+Sx, C29=n?C28/n:0, C30=C29?C28/(U*C29):0;
  const C38=(G+Sx)/(P*U-F1), useT1=C38<=T1, X=G+Sx+T1*(F1-F2), Dn=P*U-F2, n2=X/Dn, n3=(X+B1)/Dn, n4=(X+B1+B2)/Dn, C41=n2<TB1?n2:(n3<TB2?n3:n4), C45=useT1?C38:C41;
  const cost=k=>G+Sx+Math.min(k,T1)*F1+Math.max(0,k-T1)*F2+(k>=TB1?B1:0)+(k>=TB2?B2:0);
  const C46=C45?cost(C45)/(C45*U):null, p100=0.08+50/U, p70=0.056-((0.95*0.01)+(0.05*0.02))-50/U;
  const rows=[50,100,150,200,300,400,500,750,1000].map(k=>{ const c=cost(k), kw=c/(k*U); return [k,c,kw,kw<p100,kw<p70]; });
  return {Sx,C28,C29,C30,C38,useT1,C41,C45,C46,rows,p100,p70}; }
function bqPreviewHTML(q){ const x=bqSheet(q), $0=v=>"$"+Math.round(v).toLocaleString(), $3=v=>"$"+v.toFixed(3), num=v=>(+v||0).toLocaleString();
  const r=(l,v,cls="")=>`<tr class="${cls}"><td>${l}</td><td>${v}</td></tr>`;
  return `<div class="pvwrap"><div class="cpmeta">Preview of ${esc(bqFileName())} — what Excel shows when it opens</div>
   <div class="pvsheet"><div class="pvtab">Tab 1</div><table class="pv">
    <tr class="pvsec"><td colspan="2">C&amp;C Partner Campaign Variables - Adjust based on market</td></tr>
    ${r("Projected Customers Aquired through Channel",num(q.N),"in")}${r("Upfront Grant",$0(q.G),"in")}${r("Per-subscriber fee",$0(q.F1),"in")}${r("Per-subscriber step-up",$0(q.F2),"in")}${r("After X subscribers",num(q.T1),"in")}
    ${r("Bonus 1",$0(q.B1),"in")}${r("After X subscribers",num(q.TB1),"in")}${r("Bonus 2",$0(q.B2),"in")}${r("After X subscribers",num(q.TB2),"in")}
    ${r("Staff salary",$0(x.Sx))}${r("Wage",num(q.wage),"in")}${r("Weeks",num(q.weeks),"in")}${r("# of hours per week",num(q.hours),"in")}
    <tr class="pvgap"><td colspan="2"></td></tr>${r("<b>Calculations</b>","<b>"+$0(x.C28)+"</b>","tot")}${r("CAC at target enrollments ($/customer)",$0(x.C29))}${r("CAC at target enrollments ($/kWh)",$3(x.C30).replace(/(\.\d\d)\d$/,"$1"))}
    <tr class="pvsec"><td colspan="2">Practical Breakeven Calculator · target $0.056/kWh</td></tr>
    ${r("Tier 1 estimate (if no step-up/bonuses)",Math.round(x.C38))}${r("Is this valid (≤ Tier 1 threshold)?",x.useT1?"YES - use this":"NO - check Tier 2")}
    ${x.useT1?"":r("Tier 2 estimate",Math.round(x.C41))}${r("<b>Final Breakeven Customers</b>","<b>"+Math.round(x.C45)+"</b>","tot")}${x.C46?r("Verification - Cost/kWh at breakeven",$3(x.C46)):""}
   </table></div>
   <div class="pvsheet"><div class="pvtab">Breakeven Analysis</div><table class="pv pv5"><thead><tr><th># Customers</th><th>Total Cost</th><th>Cost per kWh</th><th>Beats 100% Ampion?</th><th>Beats 70% Ampion?</th></tr></thead>
    <tbody>${x.rows.map(([k,c,kw,b1,b2])=>`<tr><td>${k}</td><td>${$0(c)}</td><td>${$3(kw)}</td><td>${b1?"YES":"NO"}</td><td>${b2?"YES":"NO"}</td></tr>`).join("")}</tbody></table></div></div>`; }
function bqOut(){ const el=$("bqout"); if(!el) return; const q=S.bq;
  if(!q.name.trim()){ el.innerHTML=`<div class="bqempty">Enter a partner name to build the budget.</div>`; return; }
  const x=bqSheet(q), U=7500, n=Math.max(1,+q.N||1), perKwh=x.C28/(n*U), p70=0.056-((0.95*0.01)+(0.05*0.02))-50/U, ok=perKwh<p70;
  el.innerHTML=`<div class="bqres"><h2 style="margin:0">${esc(q.name)}${q.project?` <span class="cpmeta">· ${esc(q.project)}</span>`:""}</h2>
   <div class="bqstats"><div class="bqstat"><div class="l">Total budget</div><div class="v">${money(x.C28)}</div></div>
    <div class="bqstat"><div class="l">Per customer</div><div class="v">${money(x.C28/n)}</div></div>
    <div class="bqstat"><div class="l">Cost per kWh</div><div class="v">$${perKwh.toFixed(3)}</div><div class="cpmeta">70% Ampion $${p70.toFixed(3)}</div></div>
    <div class="bqstat"><div class="l">Breakeven</div><div class="v">${x.C45>0?Math.round(x.C45):"—"}</div><div class="cpmeta">customers at $0.056/kWh</div></div></div>
   <div class="bqok ${ok?"y":"n"}">${ok?"✅ Beats the 70% Ampion cost":"⚠️ Doesn't beat the 70% Ampion cost — lower payments or raise projected customers"}</div>
   <div class="pbtns"><button class="pbtn main" data-bqact="drive" type="button"${S.bqBusy?" disabled":""}>${S.bqBusy?"Saving…":"💾 Save to OneDrive"}</button><button class="pbtn" data-bqact="xl" type="button">📤 Download</button><button class="pbtn" data-bqact="tomsa" type="button">📝 Make MSA from this budget</button><button class="pbtn" data-bqact="pv" type="button" aria-expanded="${!!S.bqPv}">${S.bqPv?"Hide preview":"👁️ Preview"}</button></div>
   ${S.bqMsg?`<div class="${S.bqErr?"slstatus err":"bqok y"}">${S.bqMsg}</div>`:""}
   ${S.bqPv?bqPreviewHTML(q):""}</div>`; }
function bqText(){ const q=S.bq, r=bqCalc(q);
  return `${q.name} — campaign budget${q.project?" ("+q.project+")":""}\nProjected customers: ${q.N}\nTotal: ${money(r.total)} · ${money(r.perCust)}/customer · $${r.perKwh.toFixed(3)}/kWh (70% Ampion: $${r.p70.toFixed(3)})\nBreakeven: ${r.be} customers at $0.056/kWh\n\nUpfront grant ${money(q.G)} · ${money(q.F1)}/sign-up, ${money(q.F2)} after ${q.T1} · Bonus 1 ${money(q.B1)} after ${q.TB1} · Bonus 2 ${money(q.B2)} after ${q.TB2} · Staff ${money(r.S)} (${money(q.wage)}/hr × ${q.hours} hrs × ${q.weeks} wks)`; }
const BQ_CELLS={N:"C14",G:"C15",F1:"C16",F2:"C17",T1:"C18",B1:"C19",TB1:"C20",B2:"C21",TB2:"C22",wage:"C24",weeks:"C25",hours:"C26"};
async function bqBytes(){ if(!window.JSZip) throw new Error("The file tools didn't load — reload the page");
  const res=await fetch("cc-template.json"); if(!res.ok) throw new Error("Couldn't load the calculator template");
  const tb=atob((await res.json()).b64), tu=new Uint8Array(tb.length); for(let i=0;i<tb.length;i++) tu[i]=tb.charCodeAt(i);
  const vals={}; for(const [k,ref] of Object.entries(BQ_CELLS)) vals[ref]=+S.bq[k]||0;
  if(!window.HyperFormula||!window.ExcelJS) throw new Error("The calculator engine didn't load — reload the page");
  return await fillTemplateXlsx(JSZip,tu,vals,{ExcelJS,HyperFormula}); }
function bqFileName(){ return `${safeName(S.bq.name)} — C&C Campaign Cost Calculator ${ymd(new Date())}.xlsx`; }
function toB64(u8){ let s=""; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
const resText=r=>{ if(r==null) return ""; if(typeof r==="string") return r; const parts=[]; if(r.payload!=null) parts.push(typeof r.payload==="string"?r.payload:JSON.stringify(r.payload)); if(r.structuredContent!=null) parts.push(JSON.stringify(r.structuredContent)); (r.content||[]).forEach(c=>{ if(c&&typeof c.text==="string") parts.push(c.text); }); return parts.join("\n")||JSON.stringify(r); };
const pickStr=(r,re)=>{ const m=resText(r).match(re); return m?m[1]:""; };
async function bqEnsureFolder(name){
  const known=(S.partners||[]).find(p=>p.budgetFolder&&p.budgetFolder.name===name); if(known) return known.budgetFolder.id;
  try{ const r=await S.mcp.callTool(M365,"sharepoint_create_folder",{driveId:PB_DRIVE,parentItemId:PB_FOLDER,name,conflictBehavior:"fail"},{cache:false});
    const id=pickStr(r,/"id"\s*:\s*"([^"]+)"/); if(id) return id; }catch(e){ if(e&&!/conflict|exist/i.test(String(e.message||e.code))) throw e; }
  const r=await S.mcp.callTool(M365,"sharepoint_folder_search",{name,limit:25},{cache:false}); const t=resText(r);
  const hits=[...t.matchAll(/\{[^{}]*?"id"\s*:\s*"([^"]+)"[^{}]*?"name"\s*:\s*"([^"]+)"[^{}]*?"webUrl"\s*:\s*"([^"]+)"/g)].map(m=>({id:m[1],name:m[2],url:m[3]}));
  const h=hits.find(x=>x.name===name&&/Partner(%20| )Budgets/.test(x.url)); if(h) return h.id; throw new Error("Couldn't find or create the partner folder");
}
async function bqToDrive(){
  if(!S.mcp){ S.bqMsg="Connect Microsoft 365 in claude.ai → Settings → Connectors, then reload."; S.bqErr=true; bqOut(); return; }
  const name=safeName(S.bq.name); S.bqBusy=true; S.bqMsg=""; bqOut();
  try{ const folderId=await bqEnsureFolder(name);
    const buf=await bqBytes();
    const r=await S.mcp.callTool(M365,"sharepoint_upload_file",{driveId:PB_DRIVE,parentItemId:folderId,filename:bqFileName(),contentBase64:toB64(buf),conflictBehavior:"rename"},{cache:false});
    const url=pickStr(r,/"webUrl"\s*:\s*"([^"]+)"/);
    S.bqMsg=`✅ Saved to OneDrive › Partner Budgets › ${esc(name)}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">Open in Excel</a>`:""}`; S.bqErr=false;
    await bqLogToPartner(name,folderId,url);
  }catch(e){ S.bqErr=true; S.bqMsg=e&&e.code==="needs_reauth"?"Microsoft 365 needs reconnecting: claude.ai → Settings → Connectors.":e&&e.code==="not_granted"?"Allow Microsoft 365 for this page to save files (Permissions menu).":"Couldn't save to OneDrive: "+esc(e&&e.message||"try again"); }
  S.bqBusy=false; bqOut(); }
async function bqLogToPartner(name,folderId,url){ if(!S.db) return; const now=new Date().toISOString(), r=bqCalc(S.bq), key=name.toLowerCase();
  const budget={...S.bq,total:Math.round(r.total),fileUrl:url||"",savedAt:now}; const folder={id:folderId,name};
  const p=(S.partners||[]).find(x=>[x.name,x.org].some(v=>v&&safeName(v).toLowerCase()===key));
  try{ if(p) await pcol().doc(p.id).update({budget,budgetFolder:folder,history:[...(p.history||[]),{at:now,text:`Budget saved to OneDrive: ${money(r.total)} for ${S.bq.N} customers`,changes:{}}].slice(-60)});
    else await pcol().add({name,org:name,stage:"Call set",tier:"➕ Added by me",source:"Budget builder",budget,budgetFolder:folder,order:Math.max(0,...(S.partners||[]).map(x=>+x.order||0))+1,lastContact:"",createdAt:now,latest:"Budget saved to OneDrive",latestAt:now,history:[{at:now,text:"Added from Budget builder",changes:{}}]}); }catch(_){ } }
async function bqDownload(){ if(!S.dl){ toast("Download isn't available here"); return; }
  try{ const buf=await bqBytes(); await S.dl.save({filename:bqFileName(),data:buf}); toast("📤 Budget ready"); }catch(e){ if(e?.code!=="declined") toast(e&&e.message?e.message:"Download isn't available here"); } }
$("list").addEventListener("input",e=>{ if(S.view!=="budget") return; const k=e.target.dataset.bq; if(!k) return; S.bq[k]=k==="name"||k==="project"||k==="start"?e.target.value:e.target.value; S.bqMsg=""; bqSave(); bqOut(); });
$("list").addEventListener("change",e=>{ if(S.view==="budget"&&e.target.dataset.bq==="project"){ S.bq.project=e.target.value; bqSave(); bqOut(); } });
$("list").addEventListener("click",async e=>{ if(S.view!=="budget") return; const b=e.target.closest("[data-bqact]"); if(!b) return; const a=b.dataset.bqact;
  if(a==="reset"){ const keep={name:S.bq.name,project:S.bq.project,start:S.bq.start}; S.bq={...BQ_DEF,...keep}; bqSave(); $("list").innerHTML=bqHTML(); bqOut(); return; }
  if(a==="pv"){ S.bqPv=!S.bqPv; bqOut(); return; }
  if(a==="xl"){ await bqDownload(); return; }
  if(a==="tomsa"){ const q=S.bq, nm=String(q.name||"").trim(); if(!nm){ toast("Type the partner name first"); return; }
    const key=safeName(nm).toLowerCase(), p=(S.partners||[]).find(x=>[x.name,x.org].some(v=>v&&safeName(v).toLowerCase()===key));
    const same=safeName(S.mq.cap||"").toLowerCase()===key;
    if(!same){ if(p) mqFromPartner(p); else S.mq={...MQ_DEF}; }
    S.mq.cap=same?S.mq.cap:(S.mq.cap||nm); if(p) S.mq.pid=p.id;
    if(String(q.project||"").trim()) S.mq.project=String(q.project).trim();
    if(+q.N) S.mq.subs=String(+q.N);
    ["G","F1","F2","T1","B1","TB1","B2","TB2","wage","hours","weeks"].forEach(k=>{ if(q[k]!=null&&q[k]!=="") S.mq[k]=+q[k]||0; });
    mqSave(); S.mqMsg=""; S.mqFindMsg=""; S.mqFindUndo=null; S.view="msa"; render(); window.scrollTo&&window.scrollTo(0,0);
    toast("📝 MSA filled from the budget — add the address, mission and signer"); return; }
  if(a==="drive"){ if(!S.bqBusy) await bqToDrive(); return; } });

