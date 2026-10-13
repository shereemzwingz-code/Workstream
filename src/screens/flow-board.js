// ======================= v4: flow board, outbox (approve & send), up next, skeletons, waveform =======================
// ---- Flow board: every flow she runs, as a live pipeline. Tap a node to open that slice.
function flowDefs(){ const P=S.partners||[], T=S.tasks||[], B=S.badges||[];
  const kit=P.filter(p=>p.needsKit); const kitAt=k=>kit.filter(p=>kitNext(p)===k).length;
  const des=P.filter(p=>p.designee==="Yes"); const desAt=k=>des.filter(p=>{ const st=p.abp||{}; const nx=ABP_STEPS.find(s=>!st[s[0]]); return nx&&nx[0]===k; }).length;
  const go=(fn)=>()=>{ fn(); render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); };
  return [
   ...Object.entries(KITS).map(([kt,K])=>{ const ks=kit.filter(p=>kitType(p)===kt); const at=k=>ks.filter(p=>kitNext(p)===k).length; const gk=go(()=>{ S.view="partners"; S.pStage="kit"; S.pSS="all"; S.pQ=""; });
     return {id:"kit-"+kt,ic:K.ic,name:K.name,color:kt==="partner"?"#E09A1F":kt==="designee"?"#D63384":"#7FB2E5",total:ks.length,nodes:[...K.steps.map(([k,ic,l])=>[l.replace(/ \+ .*$/,"").replace("Personal link","Link").replace("Printed resources mailed","Mailed").replace("Landing page link","Landing page"),at(k),gk]),["Done",ks.filter(p=>kitLeft(p)===0).length,gk,"end"]]}; }),
   {id:"pipe",ic:"🤝",name:"Partner pipeline",color:"#E8479B",total:P.length,nodes:SS.map((v,i)=>[SSHORT[i],P.filter(p=>(p.ssStatus||"")===v).length,go(()=>{ S.view="partners"; S.pSS=v; S.pStage="all"; S.pQ=""; }),i===5?"end":""])},
   {id:"reach",ic:"✉️",name:"Outreach",color:"#9B7BE0",total:P.filter(p=>p.stage&&p.stage!=="Not a fit").length,nodes:["To email","Emailed","Call set","Active partner"].map((v,i)=>[v,P.filter(p=>p.stage===v).length,go(()=>{ S.view="partners"; S.pStage=v; S.pSS="all"; S.pQ=""; }),i===3?"end":""])},
   {id:"abp",ic:"📋",name:"Designees (ABP)",color:"#4A7FC0",total:des.length,nodes:[...ABP_STEPS.slice(0,6).map(s=>[s[1].replace(/ (done|signed|submitted|\+ logged|made)$/,"").replace("Consumer protection + enrollment training","Training").replace("Designee Registration Form","Reg. form").replace("Company Information Form","Company form").replace("MES Compliance Plan","MES plan").replace("Sent to Elena","To Elena").replace("ABP name badges","Badges"),desAt(s[0]),go(()=>{ S.view="abp"; })]),["Registered",des.filter(p=>ABP_STEPS.every(s=>(p.abp||{})[s[0]])).length,go(()=>{ S.view="abp"; }),"end"]]},
   {id:"badge",ic:"🪪",name:"Badges",color:"#D63384",total:B.length,nodes:["Needed","Made","Given"].map((v,i)=>[v,B.filter(b=>(b.status||"Needed")===v).length,go(()=>{ S.view="badges"; S.bdgF=v; }),i===2?"end":""])}
  ]; }
S.flowOpen=(()=>{ try{ return localStorage.getItem("ws.flows")!=="closed"; }catch(_){ return true; } })();
function flowsHTML(){ let fl; try{ fl=flowDefs().filter(f=>f.total>0||f.id==="kit-partner"); }catch(_){ return ""; }
  return `<section class="hcard" style="margin-top:14px;padding:12px 14px"><h3>🧭 My flows <span class="n">${fl.length}</span><button class="r" data-flowtog="1">${S.flowOpen?"Hide":"Show"}</button></h3>
   ${S.flowOpen?`<div class="flows">${fl.map(f=>`<div class="flow" style="--fc:${f.color}"><h3><span aria-hidden="true">${f.ic}</span>${esc(f.name)}<span class="tot">${f.total} total</span></h3><div class="fnodes">${f.nodes.map(([l,n,_,cls],i)=>`<button class="fn${n?" hot":" zero"}${cls?" "+cls:""}" data-flow="${f.id}" data-node="${i}" title="${esc(l)}: ${n}"><span class="c">${n}</span><span class="l">${esc(l)}</span></button>`).join("")}</div></div>`).join("")}</div>`:""}</section>`; }
document.addEventListener("click",e=>{ const t=e.target.closest("[data-flowtog]"); if(t){ S.flowOpen=!S.flowOpen; try{ localStorage.setItem("ws.flows",S.flowOpen?"open":"closed"); }catch(_){} renderList(); return; }
  const b=e.target.closest("[data-flow]"); if(!b) return; const f=flowDefs().find(x=>x.id===b.dataset.flow); const nd=f&&f.nodes[+b.dataset.node]; if(nd) nd[2](); });

// ---- Up next: the next meeting (with its partner's kit status) or the top Do-now task, with a live countdown
function upNextHTML(){ const now=Date.now(); const ms=(S.meet||[]).filter(m=>m.start&&!(m.end&&m.end<now)).sort((a,b)=>a.start-b.start); const m=ms[0];
  if(m&&m.start-now<6*3600e3){ const mins=Math.max(0,Math.round((m.start-now)/60000)); const live=m.start<=now;
    const p=(S.partners||[]).find(q=>{ const k=orgKey(q.org||q.name); return k&&String(m.subject||"").toLowerCase().includes(k.split(" ")[0])&&k.split(" ")[0].length>3; });
    return `<div class="upnext"><div><span class="tm">${live?"NOW":mins<60?mins+"m":Math.floor(mins/60)+"h "+(mins%60)+"m"}</span></div><div><span class="k">${live?"Happening now":"Up next"}</span><div class="t">${esc(m.subject)}</div><div class="s">${esc(fmtT(m.start))}${m.who?" · "+esc(m.who):""}${p?` · 🧰 ${esc(p.org||p.name)} kit ${kitDone(p)}/${kitTotal(p)}`:""}</div></div><div class="btns">${m.join?`<a class="pbtn main" href="${esc(m.join)}" target="_blank" rel="noopener">${live?"Join now":"Join"}</a>`:""}${p?`<button class="pbtn" data-gopart="${esc(p.id)}">Open partner</button>`:""}</div></div>`; }
  const top=doNowList()[0]; if(!top) return "";
  return `<div class="upnext"><div><span class="tm">🔥</span></div><div><span class="k">Up next</span><div class="t">${esc(top.t.title)}</div><div class="s">${esc(top.why)}${top.t.nextStep?" · "+esc(top.t.nextStep):""}</div></div><div class="btns"><button class="pbtn main" data-goto="${esc(top.t.id)}">Open</button><button class="pbtn" data-upfocus="${esc(top.t.id)}">🎯 Focus</button></div></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-upfocus]"); if(!b) return; const t=S.tasks.find(x=>x.id===b.dataset.upfocus); if(t) focusStart(t); });
setInterval(()=>{ if(S.view==="home"&&document.querySelector(".upnext .tm")&&!document.hidden){ const el=document.querySelector(".upnext"); if(el) el.outerHTML=upNextHTML(); } },60000);

// ---- Outbox: drafts the assistant wrote, waiting for your OK. Nothing goes out without you.
const qcol=()=>S.db.doc("data/users/"+S.uid+"/agent").collection("queue");
S.outbox=[]; S.aiCtx=null;
function bootOutbox(){ if(!S.db||!S.uid||S.obBooted) return; S.obBooted=true; try{ qcol().onSnapshot(snap=>{ S.outbox=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.body).sort((a,b)=>String(b.at).localeCompare(String(a.at))); if(S.view==="agent"||S.view==="home") renderList(); else if(S.view==="outbox"){ if($("mbx")) obRenderSide(); else renderList(); } renderViews(); },()=>{}); }catch(_){} }
setInterval(bootOutbox,900);
const confOf=txt=>/\[[^\]]{1,40}\]/.test(txt)?["check","Check this — has blanks"]:["ok","I'm confident"];
async function queueDraft(){ const body=($("aiOut")&&$("aiOut").textContent||"").trim(); if(!body){ toast("Nothing to save yet"); return; } if(!S.db){ toast("Not connected"); return; }
  const c=S.aiCtx||{}; const title=(document.querySelector("#result h3")||{}).textContent||"Draft";
  const sel=+(document.querySelector('[data-aiopt][aria-pressed="true"]')?.dataset.aiopt||0);
  const vers=S.aiOpts?S.aiOpts.slice(0,3).map((o,i)=>{ const cc=obSplit(o.b); return {l:OB_LABELS[i]||o.l,subj:cc.subj,body:cc.body}; }):null;
  const extra=vers?{vers,vi:Math.min(sel,vers.length-1),subject:vers[Math.min(sel,vers.length-1)].subj,text:vers[Math.min(sel,vers.length-1)].body}:{};
  try{ await qcol().add({at:new Date().toISOString(),kind:c.kind||"draft",title,to:c.to||"",name:c.name||"",pid:c.pid||"",tid:c.tid||"",body,conf:confOf(body)[0],...extra}); toast("📥 Saved to your Outbox"); agLog("Queued for approval: "+title,{act:"queue"}); }catch(err){ writeErr(err); } }
document.addEventListener("click",e=>{ if(e.target.id==="queueAi") queueDraft(); });