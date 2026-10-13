// ---- partners
const STAGES=["To email","Emailed","Call set","Active partner","Not a fit"];
const STAGE_ICON={"To email":"✉️","Emailed":"📨","Call set":"📞","Active partner":"🤝","Not a fit":"🚫"};
const STAGE_CLS={"To email":"st-ns","Emailed":"st-ip","Call set":"st-w","Active partner":"st-c","Not a fit":"st-nf"};
S.pLayout=(()=>{ try{ return localStorage.getItem("ws.pLayout")||"table"; }catch(_){ return "table"; } })();
const SSN=p=>{ const m=String(p.ssStatus||"").match(/^(\d)/); return m?+m[1]:0; };
const ssSort=(a,b)=>(SSN(b)-SSN(a))||((+priOf(a)||9)-(+priOf(b)||9))||String(a.org||a.name||"").localeCompare(String(b.org||b.name||""),undefined,{sensitivity:"base"});
function ptableHTML(ps){
  const cols=["","Organization","Partner Status","Relationship Priority","Next Steps","Last Contact Date","Partner Summary","Estimated LMI Subscriber Reach","Primary Contact","Primary Contact Title","Primary Contact Email","Primary Contact Cell Phone","Relationship Tracker","DRE Main Point of Contact","DRE Secondary Point of Contact"];
  const d=v=>v?esc(v):"";
  let n=0, last=null, rows="";
  ps.slice().sort(ssSort).forEach(p=>{
    const g=p.ssStatus||"No partner status yet";
    if(g!==last){ last=g; rows+=`<tr class="pgrp"><td colspan="${cols.length}">${esc(g)}</td></tr>`; }
    n++; const pr=priOf(p), open=S.pOpen===p.id;
    rows+=`<tr class="${open?"open":""}" data-ptr="${esc(p.id)}"><td class="num">${n}</td><td class="c-org" data-ptoggle="${esc(p.id)}" role="button" tabindex="0" aria-expanded="${open}">${esc(p.org||p.name)}</td><td>${d(p.ssStatus)}</td><td class="pri${pr?" pri"+pr:""}">${pr}</td><td class="c-next2">${d(p.nextStep||p.ssNext)}</td><td>${p.lastContact?esc(fmtShort(p.lastContact)):""}</td><td class="c-sum">${d(p.summary)}</td><td class="reach">${d(p.reach)}</td><td>${p.org&&p.name!==p.org?d(p.name):""}</td><td>${d(p.role)}</td><td>${p.email?`<a href="mailto:${esc(p.email)}" target="_blank" rel="noopener">${esc(p.email)}</a>`:""}</td><td>${d(p.phone)}</td><td>${d(p.ssTracker)}</td><td>${d(p.owner)}</td><td>${d(p.owner2)}</td></tr>`;
    if(open) rows+=`<tr><td class="pcell" colspan="${cols.length}">${pCardHTML(p)}</td></tr>`;
  });
  return `<div class="ptwrap"><table class="pt"><thead><tr>${cols.map((c,i)=>`<th${i===1?' class="c-org"':""}>${c}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
document.addEventListener("click",e=>{ const t=e.target.closest("[data-ptoggle]"); if(!t||S.view!=="partners") return; const id=t.dataset.ptoggle; S.pOpen=S.pOpen===id?null:id; S.pEdit=null; S.pPanel=null; renderList(); });
document.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.matches?.("[data-ptoggle]")){ e.preventDefault(); e.target.click(); } });
document.addEventListener("click",e=>{ const b=e.target.closest("[data-playout]"); if(!b) return; S.pLayout=b.dataset.playout; try{ localStorage.setItem("ws.pLayout",S.pLayout); }catch(_){} renderPBar(); renderList(); });
const PRIS=[["1","🔴 Priority 1"],["2","🟠 Priority 2"],["3","🟡 Priority 3"],["","⚪ No priority set"]];
const priOf=p=>{ const v=String(p.priority??"").trim(); return ["1","2","3"].includes(v)?v:""; };
const TIERS=["⭐ Priority","🎯 Set next step","🏦 Banks & lenders","🏠 Housing counseling & tenant orgs","🏛️ Local government","🌱 Community & service orgs","➕ Added by me"];
S.partners=[]; S.pOpen=null; S.pStage="all"; S.pEdit=null; S.pAdding=false;
const pcol=()=>S.db.doc("data/users/"+S.uid+"/partners").collection("items");
const daysSince=iso=>{ if(!iso) return null; const d=new Date(iso); return isNaN(d)?null:Math.floor((Date.now()-d)/864e5); };
S.pKind=(()=>{ try{ return localStorage.getItem("ws.pKind")||"partners"; }catch(_){ return "partners"; } })();
function pKindList(){ return (S.partners||[]).filter(p=>S.pKind==="amb"?isAmb(p):!isAmb(p)); }
function pKindHTML(){ const a=(S.partners||[]).filter(isAmb).length, n=(S.partners||[]).length-a;
  return `<div class="pkind" role="tablist" aria-label="Who to show"><button role="tab" type="button" data-pkind="partners" aria-selected="${S.pKind!=="amb"}">🤝 Partners<b>${n}</b></button><button role="tab" type="button" data-pkind="amb" aria-selected="${S.pKind==="amb"}">🦋 Ambassadors<b>${a}</b></button></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-pkind]"); if(!b) return; S.pKind=b.dataset.pkind; try{ localStorage.setItem("ws.pKind",S.pKind); }catch(_){} S.pStage="all"; S.pSS="all"; S.pOpen=null; S.pAdding=false; renderPBar(); renderList(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); });
function renderPBar(){
  if(S.hub){ $("bar").innerHTML=""; if($("psw")) $("psw").innerHTML=""; return; }
  const KL=pKindList(), amb=S.pKind==="amb";
  const n=st=>KL.filter(p=>st==="all"||p.stage===st).length;
  const chip=(id,label)=>`<button class="count" data-pstage="${id}" aria-pressed="${S.pStage===id}"><b>${n(id)}</b> ${label}</button>`;
  const stale=KL.filter(p=>p.stage==="Emailed"&&daysSince(p.lastContact)>=7).length;
  $("bar").innerHTML=`<span class="barlbl">Show</span>`+chip("all","🌸 all")+(amb?"":STAGES.map(st=>chip(st,`${STAGE_ICON[st]} ${st.toLowerCase()}`)).join(""))
   +(stale?`<button class="count late" data-pstage="stale" aria-pressed="${S.pStage==="stale"}"><b>${stale}</b> ⏰ no reply 7+ days</button>`:"")
   +(KL.some(p=>p.needsKit)?`<button class="count kitf" data-pstage="kit" aria-pressed="${S.pStage==="kit"}"><b>${KL.filter(p=>p.needsKit&&kitLeft(p)>0).length}</b> 🧰 kits to finish</button>`:"")
   +`<span class="spacer"></span><button class="count" id="addPartner">${amb?"➕ Add ambassador":"➕ Add partner"}</button>`
   ;
  $("psw").innerHTML=pKindHTML()+(amb?"":pipeHTML())+`<div class="psearch" style="display:flex;gap:8px;align-items:center;margin:8px 0 16px"><input id="pSearch" type="search" placeholder="🔎 Search ${amb?"ambassadors":"partners"} (finds anyone): name, org, email, notes" aria-label="Search partners" value="${esc(S.pQ||"")}" autocomplete="off" style="flex:1;min-width:0;border:1px solid var(--line);background:var(--card,var(--bg));color:var(--ink);border-radius:10px;padding:11px 12px;font:inherit;font-size:16px">${S.pQ?`<button class="count" id="pSearchClear" type="button">✕ Clear</button>`:""}</div>`;
  if(S.pQFocus){ const i=$("pSearch"); if(i){ i.focus(); const L=i.value.length; try{ i.setSelectionRange(L,L); }catch(_){} } }
}
S.pQ=""; S.pQFocus=false;
const pText=p=>[p.name,p.org,p.role,p.email,p.phone,p.notes,p.nextStep,p.summary,p.source,p.tier,p.stage,p.ssStatus,p.owner,p.latest].join(" ").toLowerCase();
function pMatch(p,q){ return q.split(/\s+/).filter(Boolean).every(w=>pText(p).includes(w)); }
document.addEventListener("input",e=>{ if(e.target.id!=="pSearch") return; S.pQ=e.target.value; S.pQFocus=true; renderList();
  const c=$("pSearchClear"); if(!!S.pQ!==!!c) { renderPBar(); } });
document.addEventListener("focusout",e=>{ if(e.target.id==="pSearch") setTimeout(()=>{ if(document.activeElement?.id!=="pSearch") S.pQFocus=false; },0); });
document.addEventListener("keydown",e=>{ if(e.target.id!=="pSearch") return;
  if(e.key==="Escape"){ S.pQ=""; renderPBar(); renderList(); return; }
  if(e.key==="Enter"){ e.preventDefault(); const first=document.querySelector("#list .pcard"); if(first){ S.pOpen=first.dataset.pid; S.pQFocus=false; renderList(); first.scrollIntoView?.({block:"start"}); } } });
document.addEventListener("click",e=>{ if(e.target.id!=="pSearchClear") return; S.pQ=""; S.pQFocus=true; renderPBar(); renderList(); });
function pFormHTML(p,isNew){
  const f=(k,l,type="text",ph="")=>`<div><label>${l}</label><input type="${type}" data-pf="${k}" value="${esc(p[k]||"")}" placeholder="${esc(ph)}"></div>`;
  return `<div class="pform">
    <div class="efields">${f("name","Name")}${f("org","Organization")}${f("role","Role")}${f("email","Email","email")}${f("phone","Phone","tel")}
      <div><label>Group</label><select data-pf="tier">${TIERS.map(t=>`<option${t===(p.tier||TIERS[6])?" selected":""}>${esc(t)}</option>`).join("")}</select></div>
      <div><label>Partner status</label><select data-pf="ssStatus"><option value="">—</option>${SS.map(v=>`<option${v===p.ssStatus?" selected":""}>${v}</option>`).join("")}</select></div>
      <div><label>Priority</label><select data-pf="priority">${[["","—"],["1","1"],["2","2"],["3","3"]].map(([v,l])=>`<option value="${v}"${v===priOf(p)?" selected":""}>${l}</option>`).join("")}</select></div>
      <div><label>Stage</label><select data-pf="stage">${STAGES.map(t=>`<option${t===(p.stage||"To email")?" selected":""}>${t}</option>`).join("")}</select></div>
      <div><label>Kit</label><select data-pf="kitType">${[["","— none —"],["partner","💰 Partner kit"],["designee","🪪 Designee enrollment kit"],["ambassador","🦋 Community Ambassador kit"]].map(([v,l])=>`<option value="${v}"${(p.needsKit?(p.kitType||"partner"):"")===v?" selected":""}>${l}</option>`).join("")}</select></div>
      <div><label>ABP designee?</label><select data-pf="designee">${["No","Yes"].map(t=>`<option${t===(p.designee||"No")?" selected":""}>${t}</option>`).join("")}</select></div>
      <div><label>Whose designee</label><select data-pf="desWho">${[["mine","Mine"],["cc","CC's"],["shared","Mine + CC"]].map(([v,t])=>`<option value="${v}"${(p.desWho||"mine")===v?" selected":""}>${t}</option>`).join("")}</select></div>
      ${f("source","Where we met","text","e.g. Housing Action Conference")}
    </div>
    ${f("nextStep","Next step")}
    <div><label>What they said / notes</label><textarea data-pf="notes">${esc(p.notes||"")}</textarea></div>
    ${f("subject","Email subject")}
    <div><label>Email</label><textarea data-pf="body" style="min-height:140px">${esc(p.body||"")}</textarea></div>
    <div class="pbtns"><button class="pbtn main" data-pact="${isNew?"create":"save"}">💾 ${isNew?"Add partner":"Save"}</button><button class="pbtn" data-pact="cancel">Cancel</button></div>
  </div>`;
}