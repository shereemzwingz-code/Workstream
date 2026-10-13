// ---- ABP: forms, websites, designee checklist
const ABP_FORMS=[
 {g:"🚀 Start here",items:[["Become an AV or Designee (overview)","https://illinoisshines.com/become-an-av-or-designee"],["Illinois Shines portal login","https://portal.illinoisabp.com/"],["2026-27 Program Guidebook (PDF)","https://illinoisshines.com/wp-content/uploads/2026/04/Illinois-Shines-2026-27-Program-Guidebook.pdf"],["2026-27 Consumer Protection Handbook (PDF)","https://illinoisshines.com/wp-content/uploads/2026/04/2026-27-CP-Handbook-Clean.pdf"]]},
 {g:"🏢 SPAV (Approved Vendor)",items:[["Approved Vendor application — online form","https://forms.office.com/Pages/ResponsePage.aspx?id=WhykgeRTDE2nqHQvI9dkUfD3dcGAAkJHpbmk5rDFxXlURDdZNVM1VTM3OU1ISzlHTzVSQUNIOEFRQi4u"],["Approved Vendor renewal","https://forms.office.com/r/5btgMjRBJN"],["SPAV application docs (Egnyte)","https://dimensiononegnyte.egnyte.com/navigate/folder/1851ef52-9cf8-4a86-854f-069262a76b81"]]},
 {g:"🔁 Assignment",items:[["Assignment steps — Product Orders / REC contracts","https://illinoisshines.com/assignment-of-product-orders-or-entire-rec-contracts/"],["Acknowledgement of Assignment forms","https://illinoisshines.com/acknowledgment-of-assignment-forms/"],["Fillable Acknowledgement of Assignment & Consent + Assignment & Assumption Agreement","Attached to Elena's Aug 5 email “RE: ABP Part 2 Support”"],["AV Switch Template (no REC contract)","https://illinoisshines.com/wp-content/uploads/2025/09/AV-Switch-Template-Word-Sept2025.docx"]]},
 {g:"🪪 Designees",items:[["Designee Registration Form (fillable PDF)","https://illinoisshines.com/wp-content/uploads/2025/05/Designee-Registration-Form-250127-1.pdf"],["Designee Company Information Form (online)","https://energysolutionsipa.my.site.com/newdesignee/s/"],["MES Compliance Plan form (online)","https://illinoisshines.powerappsportals.com/NewEntityMES/"],["Designee folder (Egnyte)","https://dimensiononegnyte.egnyte.com/navigate/folder/28a34309-87a7-45d5-978e-a364070450fb"],["Non-Profit Designee Materials (guide, form, sample MES plan)","Z:\\Shared\\D. Business Development\\II. Market Research and Policy\\_IL\\ABP Program Strategy and Compliance\\4. Designees\\Non-Profit Designee Materials"],["Disclosure forms","https://illinoisshines.com/disclosure-forms/"]]},
 {g:"📊 Trackers (Smartsheet)",items:[["SPAV Creation Status","Search Smartsheet for “SPAV Creation Status”"],["ABP REC Contract Tracker","Search Smartsheet for “ABP REC Contract Tracker”"],["Designee Registration report","https://app.smartsheet.com/reports/gCq27X39Wg3Jh9wc93h9vVhxr67xwgg7PFpr7qg1?view=grid"]]}
];
const ABP_STEPS=[
 ["train","Consumer protection + enrollment training done","Dimension trains the partner's team (Consumer Protection Handbook)."],
 ["form","Designee Registration Form signed","Partner fills and signs the fillable PDF.","https://illinoisshines.com/wp-content/uploads/2025/05/Designee-Registration-Form-250127-1.pdf"],
 ["company","Company Information Form submitted","Online form for the partner's org details.","https://energysolutionsipa.my.site.com/newdesignee/s/"],
 ["mes","MES Compliance Plan submitted","Dimension submits it for them; sample plan is in Non-Profit Designee Materials.","https://illinoisshines.powerappsportals.com/NewEntityMES/"],
 ["elena","Sent to Elena + logged","Send signed forms to Elena; log in the Designee Registration report.","https://app.smartsheet.com/reports/gCq27X39Wg3Jh9wc93h9vVhxr67xwgg7PFpr7qg1?view=grid"],
 ["badges","ABP name badges made","Use the ABP Name Badge Guide (Enrollment Partner Education folder)."],
 ["renew","Annual renewal date set","Designees renew every year."]
];
function linkCell(where){ return /^https?:/.test(where)?`<a href="${esc(where)}" target="_blank" rel="noopener">Open ↗</a>`:esc(where); }
function abpHTML(){
  const ds=(S.partners||[]).filter(p=>p.designee==="Yes");
  return `<div class="refwrap">
   <section class="refsec"><h2>🪪 Designee partners</h2><p class="lead">Partners marked "ABP designee: Yes". Tap one to open its 📋 ABP checklist. To add a partner, edit it on 🤝 Partners and set ABP designee to Yes.</p>
    ${ds.length?ds.map(p=>{ const done=ABP_STEPS.filter(s=>(p.abp||{})[s[0]]).length; return `<div class="ritem" style="cursor:var(--cur-pointer)" data-gotopabp="${esc(p.id)}"><div class="what">${esc(p.org||p.name)}</div><div class="src">${done} of ${ABP_STEPS.length} steps done${p.name&&p.org?" · "+esc(p.name):""}</div></div>`; }).join(""):`<div class="empty">No designee partners yet.</div>`}</section>
   <section class="refsec"><h2>✨ Elena's SPAV + designee steps</h2><ol class="refsteps">${SOP.map(x=>`<li>${x}</li>`).join("")}</ol></section>
   ${ABP_FORMS.map(gr=>`<section class="refsec"><h2>${esc(gr.g)}</h2>${gr.items.map(([w,u])=>`<div class="ritem"><div class="what">${esc(w)}</div><div class="where">${linkCell(u)}</div>${/^https?:|^Z:/.test(u)?`<button class="cpy" data-copy="${esc(u)}">📋 Copy</button>`:""}</div>`).join("")}</section>`).join("")}
   <p class="refnote">Links checked on illinoisshines.com Oct 8, 2026.</p></div>`; }
function pAbpHTML(p){ const st=p.abp||{};
  return `<div class="ppanel" data-panel="abp"><h3>📋 ABP designee — ${esc(p.org||p.name)}</h3><div class="pnote">Tick each step as it's done. 📋 Copy partner info pastes their details into the forms.</div>
   ${ABP_STEPS.map(([k,l,d,u])=>`<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--ink);font-weight:500"><input type="checkbox" data-abpk="${k}" ${st[k]?"checked":""} style="width:auto;margin-top:3px"><span><b>${esc(l)}</b><br><span class="pnote">${esc(d)}</span>${u?` · <a href="${esc(u)}" target="_blank" rel="noopener">Open form ↗</a>`:""}</span></label>`).join("")}
   <div class="pbtns"><button class="pbtn main" data-pact="abpsave">💾 Save steps</button><button class="pbtn" data-pact="abpcopy">📋 Copy partner info</button></div></div>`; }
document.addEventListener("click",e=>{ const g=e.target.closest("[data-gotopabp]"); if(!g) return; S.pPanel={id:g.dataset.gotopabp,kind:"abp"}; gotoPartner(g.dataset.gotopabp); });

async function panelAct(act,p,card){
  const save=async(patch,msg,hist)=>{ try{ await pcol().doc(p.id).update({...patch,history:pHist(p,hist)}); toast(msg); }catch(err){ writeErr(err); } };
  if(act==="bcalc"){ const b=readBudget(card); await save({budget:b},"💰 Budget saved","Budget updated: total "+money(bCalc(b).total)); return true; }
  if(act==="bcopy"){ const ok=await copyText(budgetText(p,readBudget(card))); toast(ok?"📋 Budget copied":"Press and hold to copy"); return true; }
  if(act==="bxl"){ await budgetXlsx(p,readBudget(card)); return true; }
  if(act==="svsave"){ const v=readSav(card); await save({sav:{...(p.sav||{}),...v,savedAt:new Date().toISOString()}},"💾 Savings & project saved","Savings/project details updated"); return true; }
  if(act==="svslide"){ const v=readSav(card); const sav={...(p.sav||{}),...v,savedAt:new Date().toISOString()}; await save({sav},"💾 Saved — making the slide…","Savings/project details updated"); const pg=+((S.svPg)||14);
    await deckCanva({...p,sav},{...(p.deck||{})},{pages:[pg],title:pg===14?"Savings":"Project",sav:true}); const m=S.dkMsg; toast(m&&m.err?m.html.replace(/<[^>]+>/g,""):"📊 Slide ready in Canva"); renderList(); return true; }
  if(act==="bslide"){ const b=readBudget(card); await save({budget:{...b,savedAt:new Date().toISOString()}},"💾 Budget saved — making the slide…","Budget saved"); p.budget=b; await deckCanva({...p,budget:b},{...(p.deck||{})},{template:BUDGET_TPL,pages:[1],title:"Budget",budget:true}); const m=S.dkMsg; toast(m&&m.err?m.html.replace(/<[^>]+>/g,""):"📊 Budget slide ready in Canva"); renderList(); return true; }
  if(act==="msave"){ await save({msa:readMsa(card)},"💾 MSA details saved","MSA details updated"); return true; }
  if(act==="mfill"){
    if(!S.sample){ toast("Needs the Claude app or claude.ai"); return true; }
    const cur=readMsa(card); const b=card.querySelector('[data-pact="mfill"]'); b.disabled=true; b.textContent="✨ Filling…";
    try{ const name=String(cur.cap||p.org||p.name||"").trim(); b.textContent="🔎 Searching the web, email, OneDrive…"; const {r,src,warn}=await msaResearch(name,p);
      const merged={...cur}; const filled=[]; ["kind","mission","served","addr"].forEach(k=>{ if(!String(merged[k]||"").trim()&&r&&r[k]){ merged[k]=String(r[k]); filled.push(k); } });
      if(!src.length){ toast("Nothing found about "+name+(warn?" — "+warn:"")); b.disabled=false; b.textContent="🔎 Find & fill blanks"; return true; }
      await save({msa:merged},filled.length?"✅ Filled "+filled.join(", ")+" — check before sending"+(warn?" · "+warn:""):"Nothing new found — the blanks stay for you to fill"+(warn?" · "+warn:""),"MSA blanks filled from web/email/OneDrive: "+(filled.join(", ")||"none")); }
    catch(e){ toast(e?.code==="not_granted"?"Allow Claude for this page, then try again":"Couldn't fill right now"); b.disabled=false; b.textContent="🔎 Find & fill blanks"; }
    return true; }
  if(act==="mdoc"){ const m=readMsa(card); try{ await pcol().doc(p.id).update({msa:m}); }catch{}
    const name=`MSA-SOW ${(m.cap||p.name).replace(/[^\w ]+/g,"").trim()}`; await msaSave(m,budgetOf(p),name);
    return true; }
  if(act==="abpsave"){ const o={}; card.querySelectorAll("[data-abpk]").forEach(i=>o[i.dataset.abpk]=i.checked); await save({abp:o},"📋 ABP steps saved","ABP steps: "+Object.values(o).filter(Boolean).length+"/"+ABP_STEPS.length); return true; }
  if(act==="abpcopy"){ const ok=await copyText(`Organization: ${p.org||""}\nContact: ${p.name||""}${p.role?" ("+p.role+")":""}\nEmail: ${p.email||""}\nPhone: ${p.phone||""}${(p.msa||{}).addr?"\nAddress: "+p.msa.addr:""}`); toast(ok?"📋 Partner info copied":"Press and hold to copy"); return true; }
  return false;
}
