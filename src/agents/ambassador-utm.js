// ---- Referral code for utm_content, per the UTM SOP: the person's initials plus a two-digit number, lowercase \u2014 rl01.
// Made once when their kit is built, kept on their card, and never handed to anyone else.
// First and last name, skipping middle initials: "Rita G. Lewis" -> rl
function nameInitials(s){ const w=String(s||"").replace(/\(.*?\)/g,"").split(/[\s.\u2014-]+/).filter(x=>/^[A-Za-z]/.test(x));
  if(!w.length) return ""; return (w.length===1?w[0][0]:w[0][0]+w[w.length-1][0]).toLowerCase(); }
// A bare domain makes a QR that lands on the homepage, not the project page. Normalize and say so.
function enrollBase(v){ let b=String(v||"").trim().replace(/\s+/g,"").replace(/\/+$/,"");
  if(!b) return {url:"",why:"Add the Community Ambassador landing page \u2014 the link and QR are built from it."};
  if(!/^https?:\/\//i.test(b)) b="https://"+b.replace(/^\/+/,"");
  let u; try{ u=new URL(b); }catch(_){ return {url:"",why:"That enrollment URL isn't a valid web address."}; }
  if(!u.pathname||u.pathname==="/") return {url:"",why:"That's just "+u.hostname+" with no project page, so the QR would land on the homepage. Use the full page \u2014 https://ampion.net/trenton"};
  return {url:b,why:""}; }
function refCode(name,pid){
  const mine=pid&&(S.partners||[]).find(q=>q.id===pid);
  if(mine&&mine.refCode) return String(mine.refCode).toLowerCase();
  const ini=(nameInitials(name)||"").replace(/[^a-z0-9]/g,"")||"xx", taken=new Set();
  (S.utm||[]).forEach(u=>{ const c=String(u.cont||"").toLowerCase(); if(c) taken.add(c); });
  (S.partners||[]).forEach(q=>{ if(pid&&q.id===pid) return; const c=String(q.refCode||"").toLowerCase(); if(c) taken.add(c); });
  for(let n=1;n<100;n++){ const c=ini+String(n).padStart(2,"0"); if(!taken.has(c)) return c; }
  return ini+"99"; }
// ---- What every Community Ambassador gets.
// Category 4 projects add the Community Solar Sign Up Guide — those subscribers have documentation to gather
// and the guide is what walks them through it.
const AMB_PTYPE=[["cdcs","CDCS \u2014 community-driven"],["cat4","Category 4"]];
const ptLabel=v=>((AMB_PTYPE.find(x=>x[0]===v)||[])[1])||"\u2014 not set \u2014";
function ambProject(p){ const t=String((p&&p.ptype)||"")||((/cdcs/i.test(String((p&&p.notes)||""))&&"cdcs")||""); return t; }
const AMB_KIT_BASE=[
  ["link","\u{1F517}","Their personal link + QR code","utm_content is their referral code \u2014 saved to your UTM log"],
  ["flyer","\u{1F4C4}","Their flyer, both pages","Name, number, link and QR \u2014 front page plus the FAQ page"],
  ["dos","\u{1F6D1}","Ambassador Do\u2019s & Don\u2019ts","Share the link, never fill out the form. Know your role. We conduct audits."],
  ["bill","\u{1F9FE}","Sample bill with solar credits","Shows exactly where the credit lands \u2014 people believe the picture"],
  ["understand","\u{1F4D6}","\u201CUnderstanding Your Bill\u201D","The utility\u2019s own guide to reading a community solar bill"],
  ["agreement","\u{1F4DD}","Subscriber Agreement + Disclosure Form","Blank copy \u2014 what the person signs, Illinois Shines protections included"]];
const AMB_KIT_ZIP=["zip","\u{1F4E6}","The whole kit in one download","Every document above, zipped \u2014 one click for them"];
const AMB_KIT_CAT4=[["guide","\u{1F4CB}","Community Solar Sign Up Guide","Category 4 only \u2014 which documents are accepted, and where to find each one"]];
// The kit documents and where they live. She sets each link once (\u{1F4CE} Kit documents on the form);
// the draft then carries all of them for every ambassador, without her hunting through OneDrive each time.
function kitDocs(){ return (S.rules&&S.rules.kitDocs)||{}; }
// Outlook's connector cannot attach files, so she attaches them herself. In that mode the draft
// names each document instead of linking it, and the run tells her exactly what to attach.
function kitAttachMode(){ return !!(S.rules&&S.rules.kitAttach); }
function kitAttachSet(v){ S.rules=S.rules||{}; S.rules.kitAttach=!!v; rulesSave(); }
function kitDocsSave(m){ S.rules=S.rules||{}; S.rules.kitDocs=m; rulesSave(); }
const AMB_BUILD=[
  ["link","\u{1F517}","Tracked link + QR","UTM conventions: source ambassador · medium referral · content = their referral code"],
  ["flyer","\u{1F4C4}","Flyer in Canva","Their name, number, link and QR on both pages"],
  ["folder","\u{1F4C1}","Kit folder in OneDrive","One folder per ambassador, with a kit sheet listing everything they were given"],
  ["email","✉️","Welcome email → Outbox","In your voice, listing everything in their kit"],
  ["draft","\u{1F4E8}","Outlook draft with the whole kit","Addressed to them, every document linked"],
  ["tasks","✅","Tasks for your half","Call, print, mail, 2-week check-in — skips the call if it is already booked"]];
function ambOnly(){ const o=(S.amb&&S.amb.only)||{}, out={}; AMB_BUILD.forEach(([k])=>out[k]=o[k]!==false); return out; }
function ambOnlyCount(){ const o=ambOnly(); return AMB_BUILD.filter(([k])=>o[k]).length; }
function ambBuildHTML(){ const o=ambOnly(), eb=enrollBase(S.amb.base);
  return `<div class="ambkit" id="ambbuild"><div class="ambkith">\u{1F528} What to build</div>
  <div class="pnote" style="margin:0 0 8px">All ticked, so <b>Build the kit</b> makes the whole thing. Untick anything you already have or would rather do yourself.</div>
  ${AMB_BUILD.map(([k,ic,l,dd])=>`<label class="ambkiti ambpick"><input type="checkbox" data-ambk="${k}"${o[k]?" checked":""}><span class="ic" aria-hidden="true">${ic}</span><div><div class="t">${esc(l)}</div><div class="d">${esc(dd)}</div></div></label>`).join("")}
  <div class="amblp"><label for="amb-base2">\u{1F310} Landing page — the project's enrollment URL</label>
   <input id="amb-base2" data-amb="base" value="${esc(S.amb.base||"")}" placeholder="https://ampion.net/trenton" inputmode="url" autocomplete="off">
   <div class="pnote" id="amb-lpnote">${S.amb.base?(eb.why?"⚠️ "+esc(eb.why):"The link and QR are built from this page."):"The link and QR are built from this page."}</div>
   <div class="pbtns" style="margin-top:8px"><button class="pbtn" type="button" data-ambact="utm">\u{1F517} Open in UTM builder</button></div></div></div>`; }
function ambKit(p){ const base=ambProject(p)==="cat4"?AMB_KIT_BASE.concat(AMB_KIT_CAT4):AMB_KIT_BASE;
  return kitDocs().zip?base.concat([AMB_KIT_ZIP]):base; }
// The link and QR the build will make, shown before she runs it — both come from the landing page field.
function ambLink(p){ const eb=enrollBase(p&&p.base), slug=utmClean((p&&p.project)||""), rc=(p&&p.name)?refCode(p.name,p&&p.pid):"";
  if(eb.why) return {link:"",why:eb.why};
  if(!slug) return {link:"",why:"Add the project name so the campaign can be named."};
  if(!rc) return {link:"",why:"Add their name so they get a referral code."};
  const b=eb.url;
  return {link:`${b}${b.includes("?")?"&":"?"}utm_source=ambassador&utm_medium=referral&utm_campaign=${encodeURIComponent("community_ambassador_"+slug)}&utm_content=${encodeURIComponent(rc)}`,why:"",code:rc}; }
function kitDocsHTML(){ const docs=kitDocs(), rows=AMB_KIT_BASE.concat(AMB_KIT_CAT4).concat([AMB_KIT_ZIP]).filter(([k])=>k!=="link"&&k!=="flyer");
  return `<details class="ambkit" id="kitdocs"><summary style="font-weight:700;font-size:14px;cursor:pointer">📎 Kit documents — ${rows.filter(([k])=>docs[k]).length} of ${rows.length} linked</summary>
  <label class="ambkiti ambpick" style="margin:8px 0"><input type="checkbox" data-kattach${kitAttachMode()?" checked":""}><span class="ic" aria-hidden="true">📎</span><div><div class="t">I’ll attach these myself</div><div class="d">Outlook can’t attach files from here. Ticked: the draft lists each document by name and the run reminds you what to attach. Unticked: the draft links them from OneDrive.</div></div></label><div class="pnote" style="margin:8px 0">${kitAttachMode()?"Links below still fill the kit sheet in each ambassador’s folder.":"Paste each document’s share link once. Every ambassador’s draft then carries all of them."}</div>
  ${rows.map(([k,ic,l])=>`<div class="kdrow"><label for="kd-${k}">${ic} ${esc(l)}</label><input id="kd-${k}" data-kd="${k}" value="${esc(docs[k]||"")}" placeholder="Paste the OneDrive or SharePoint share link" inputmode="url" autocomplete="off"></div>`).join("")}</details>`; }
function ambKitHTML(p){ const t=ambProject(p), list=ambKit(p), rc=(p&&p.name)?refCode(p.name,p&&p.pid):"", lk=ambLink(p);
  return `<div class="ambkit" id="ambgets"><div class="ambkith">\u{1F4E6} What ${esc((p&&p.name)||"this ambassador")} gets \u2014 ${esc(ptLabel(t))}${rc?` \u00b7 referral code <b>${esc(rc)}</b>`:""}${t?"":' <b style="color:var(--warn,#b45309)">pick a project type</b>'}</div>
  ${list.map(([k,ic,l,d])=>`<div class="ambkiti${k==="guide"?" cdcs":""}"><span class="ic" aria-hidden="true">${ic}</span><div><div class="t">${esc(l)}</div><div class="d">${esc(d)}</div></div></div>`).join("")}
  ${lk.link?`<div class="amblink"><div class="t">\u{1F517} Their link and QR will be</div><code>${esc(lk.link)}</code><div class="qrbox" id="ambqr" data-qr="${esc(lk.link)}"></div></div>`:`<div class="amblink warn"><div class="t">\u26A0\uFE0F No link yet</div><div class="d">${esc(lk.why)}</div></div>`}
  ${t==="cat4"?"":`<div class="pnote" style="margin-top:8px">A <b>Category 4</b> project adds the <b>Community Solar Sign Up Guide</b>, because those subscribers have documents to gather.</div>`}</div>`; }
function welcomePrompt(p){ const K=KITS.ambassador; return `Write the welcome email Sheree sends a NEW Community Ambassador the day they are signed up. It must say they are officially in and can start right away, then list exactly the things she's including digitally, as a numbered list, in this order and no others: ${ambKit(p).map((x,i)=>(i+1)+") "+x[2].replace("Sample bill with solar credits","a sample "+(/comed/i.test(p.notes||"")?"ComEd":"Ameren")+" bill with the solar credits on it")).join(", ")}. Say printed materials will come by mail with tracking info. One ask: reply with any questions. Subject line first.
${PARTNER_STYLE}
EXCEPTION FOR THIS EMAIL: write ONE version only. Ignore the three-versions rule and do not use any "===" label lines.
Ambassador: ${p.name||""}${p.org&&p.org!==p.name?" ("+p.org+")":""}
Where we met / notes: ${p.source||""} ${p.notes||""}
Their link: ${(p.deck&&p.deck.link)||p.utmLink||"[their personal link]"}`; }
async function kitAct(p,k,card){ const st=kitStep(k,p); if(!st) return; const act=st[3]||"";
  if(act.startsWith("panel:")){ const kind=act.slice(6); S.pPanel={id:p.id,kind}; if(kind==="deck"&&kitType(p)==="designee"&&!(p.deck&&p.deck.purpose)){ try{ await pcol().doc(p.id).update({deck:{...(p.deck||{}),purpose:"training"}}); }catch(_){} } renderList(); requestAnimationFrame(()=>{ const el=document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"] .ppanel[data-panel="${kind}"]`); el&&el.scrollIntoView({behavior:"smooth",block:"start"}); }); return; }
  if(act.startsWith("url:")){ const url=act.slice(4); let w=null; try{ w=window.open(url,"_blank"); if(w) w.opener=null; }catch(_){} if(!w){ copyText(url); toast("Link copied — paste it in your browser"); } return; }
  if(act.startsWith("view:")){ S.view=act.slice(5); if(S.view==="badges"){ S.bdgF="all"; S.bdgOrg=p.org||p.name; } render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); return; }
  if(act==="tool:utm"){ S.view="tools"; S.toolApp="utm"; S.utmPrefill={src:kitType(p)==="ambassador"?"ambassador":utmClean(String(p.org||p.name||"").replace(/\(.*?\)/g,"")).replace(/[^a-z0-9_]/g,""),med:kitType(p)==="ambassador"?"referral":"community_partner",camp:kitType(p)==="ambassador"?"community_ambassador_{p}":"partner_outreach_{p}",cont:kitType(p)==="ambassador"?refCode(p.name||p.org,p.id):initials(p.name||p.org).toUpperCase(),mat:(p.org||p.name)+" "+(kitType(p)==="ambassador"?"ambassador flyer":"enrollment link"),pid:p.id}; render(); window.scrollTo&&window.scrollTo({top:0,behavior:"smooth"}); setTimeout(utmApplyPrefill,120); return; }
  if(act==="flyer:canva"){ if(p.flyerUrl){ let w=null; try{ w=window.open(p.flyerUrl,"_blank"); if(w) w.opener=null; }catch(_){} if(!w){ copyText(p.flyerUrl); toast("Flyer link copied"); } return; } const btn=card&&card.querySelector(`.qbtn[data-pact="kitact"][data-v="flyer"]`); await flyerCanva(p,btn||null); renderList(); return; }
  if(act==="draft:welcome"){ S.aiCtx={kind:"followup",pid:p.id,to:p.email||"",name:p.name||p.org}; askClaude("✉️ Welcome email for "+(p.name||p.org),welcomePrompt(p)); return; }
  if(act===""){ await kitTick(p,k); } }
async function kitTick(p,k){ const on=!(p.kit&&p.kit[k]); const kit={...(p.kit||{}),[k]:on}; const st=kitStep(k,p); await pWrite(p.id,{kit,history:pHist(p,(on?"✓ ":"↩ ")+(st?st[2]:k)+" ("+KITS[kitType(p)].name+")")},on?"✓ "+(st?st[2]:k):"Unticked"); if(on&&kitLeft({...p,kit})===0) celebrate(document.querySelector(`.pcard[data-pid="${CSS.escape(p.id)}"] .kitbar`)); }
function utmApplyPrefill(){ const q=S.utmPrefill; if(!q||!$("u_base")) return; S.utmPrefill=null;
  const setSel=(id,v)=>{ const el=$(id); if(!el) return; if([...el.options].some(o=>o.value===v)) el.value=v; else { el.value="__custom"; const c=$(id+"C"); if(c) c.value=v; } };
  setSel("u_src",q.src); setSel("u_med",q.med); setSel("u_camp",q.camp); if($("u_cont")) $("u_cont").value=q.cont; if($("u_mat")) $("u_mat").value=q.mat; if(q.base&&$("u_base")) $("u_base").value=q.base; utmBuild(); toast(q.base?"🔗 Prefilled from the ambassador kit":"🔗 Prefilled — add the project enrollment URL"); }