// ---- 🧰 Tools: UTM Link Builder (from Dimension_Energy_UTM_Builder.html · UTM SOP Section 2) + launchers
S.utm=[]; S.utmQR=false;
const ucol=()=>S.db.doc("data/users/"+S.uid+"/utm").collection("items");
const INTAKE_URL="https://claude.ai/artifact/98Hj8KPiWAFp6ynqZGE1fN", INTAKE_HOWTO="https://claude.ai/artifact/Gw1dnDLVwrcSFaYyGMJNF9";
const UTM_SRC=["ambassador","mayor","flyer","propel"];
const UTM_MED=["referral","municipality","community_partner","housing_partner","tech_partner","misc_partner","paid","email","event","print","social"];
const UTM_CAMP=[["Referral program",[["community_ambassador_{p}","community_ambassador_[project]"]]],
 ["Outreach materials",[["mayors_letter_{p}","mayors_letter_[project]"],["partner_outreach_{p}","partner_outreach_[project]"],["housing_outreach_{p}","housing_outreach_[project]"],["faith_outreach_{p}","faith_outreach_[project]"]]],
 ["Events",[["enrollment_event_{p}","enrollment_event_[project]"],["tabling_event_{p}","tabling_event_[project]"],["farmers_market_{p}","farmers_market_[project]"],["food_truck_event_{p}","food_truck_event_[project]"]]],
 ["Community groups (no project suffix)",[["green_team","green_team"],["senior_center","senior_center"],["block_club_outreach","block_club_outreach"]]]];
const utmClean=s=>String(s||"").trim().toLowerCase().replace(/\s+/g,"_");
const TOOL_APPS=[
 {id:"outbox",icon:"📥",name:"Outbox",bg:"linear-gradient(135deg,#FF6FB5,#B33684)",go:"outbox",desc:"Read, remix & approve emails"},
 {id:"agent",icon:"🤖",name:"Assistant",bg:"linear-gradient(135deg,#9B7BE0,#5B2BA8)",go:"agent",desc:"Game plan + what needs a push"},
 {id:"flyers",icon:"📄",name:"Flyers",bg:"linear-gradient(135deg,#FF9F6B,#E2553A)",go:"flyers",desc:"Flyers with their name, number + QR"},
 {id:"testing",icon:"🧪",name:"Testing",bg:"linear-gradient(135deg,#5FC8C0,#2A938C)",go:"testing",desc:"Landing-page and link checks"},
 {id:"utm",icon:"🔗",name:"UTM Builder",bg:"linear-gradient(135deg,#E8479B,#B33684)",desc:"Tracked links + QR codes"},
 {id:"log",icon:"🗂️",name:"Link Log",bg:"linear-gradient(135deg,#7FB2E5,#4A7FC0)",desc:"Links you've saved"},
 {id:"budget",icon:"💰",name:"Budget",bg:"linear-gradient(135deg,#F4C25B,#E09A1F)",go:"budget",desc:"C&C campaign budget"},
 {id:"msa",icon:"📝",name:"MSA",bg:"linear-gradient(135deg,#86CC89,#3F9C55)",go:"msa",desc:"Partner agreement draft"},
 {id:"slides",icon:"📊",name:"Pitch Decks",bg:"linear-gradient(135deg,#B9A3E0,#7A5CC0)",go:"slides",desc:"Gamma partner decks"},
 {id:"des",icon:"🪪",name:"Designee Onboarding",bg:"linear-gradient(135deg,#FF8FC4,#D63384)",desc:"Agent runs the designee enrollment kit"},
 {id:"amb",icon:"🦋",name:"Ambassador Onboarding",bg:"linear-gradient(135deg,#7FB2E5,#4A7FC0)",desc:"Agent runs the whole sign-up flow"},
 {id:"kitty",icon:"🐱",name:"Kitty",bg:"linear-gradient(135deg,#FFB3D1,#F06292)",desc:"Pop up a verse or encouragement"},
 {id:"intake",icon:"📥",name:"Partner Intake",bg:"linear-gradient(135deg,#F06B3E,#C8461C)",url:"https://claude.ai/artifact/98Hj8KPiWAFp6ynqZGE1fN",desc:"Notes → tracker CSV"},
 {id:"intakehow",icon:"🎓",name:"Intake How-To",bg:"linear-gradient(135deg,#F7A07E,#E06A45)",url:"https://claude.ai/artifact/Gw1dnDLVwrcSFaYyGMJNF9",desc:"Walkthrough"},
 {id:"poi",icon:"🔎",name:"Proof of Income",bg:"linear-gradient(135deg,#5FC8C0,#2A938C)",url:"https://claude.ai/artifact/TrvjjnTag41HDCj9QKd6Vh",desc:"Find the right doc"},
 {id:"poidir",icon:"📚",name:"Income Doc List",bg:"linear-gradient(135deg,#4FB3AA,#22786F)",url:"https://claude.ai/artifact/H7FrecULDVcsppwCFAw3qy",desc:"Documentation directory"},
 {id:"comed",icon:"⚡",name:"ComEd Bill Guide",bg:"linear-gradient(135deg,#FFD54F,#F2A900)",url:"https://claude.ai/artifact/9AwYkz3yUn1pjZPhzKML6U",desc:"Read a solar bill"},
 {id:"howcs",icon:"☀️",name:"How Solar Works",bg:"linear-gradient(135deg,#FBAE40,#F26B43)",url:"https://claude.ai/artifact/HEtaeYf3CFWEwzwVi8JNQj",desc:"Explain community solar"},
 {id:"chiree",icon:"🏙️",name:"Chi.ree",bg:"linear-gradient(135deg,#9AA3B5,#5D6880)",url:"https://claude.ai/artifact/SmhMNZuPs5jYLcxJzzBiyL",desc:"Chicago resources"},
 {id:"prospects",icon:"🎯",name:"Prospect Report",bg:"linear-gradient(135deg,#E06AAE,#A23A79)",url:"https://claude.ai/artifact/G4io93SBZGuw1DSdoXqWCD",desc:"Housing conference leads"},
 {id:"playbook",icon:"📘",name:"Partnership Playbook",bg:"linear-gradient(135deg,#5A7BD8,#33479B)",url:"https://claude.ai/artifact/KEeaxYV5TMS2qnoktpd8Wh",desc:"Partner process"},
 {id:"cityplay",icon:"🏛️",name:"City Playbook",bg:"linear-gradient(135deg,#6E8FA8,#3E5B72)",url:"https://claude.ai/artifact/6ghPZN8VJ5U78ZEmeYryWG",desc:"Municipal partners"},
 {id:"fieldtrip",icon:"🚌",name:"Field Trip Playbook",bg:"linear-gradient(135deg,#8BCF6B,#4E9A35)",url:"https://claude.ai/artifact/25P4E3SYTPFUZxWYEJEdJW",desc:"School partnerships"}];
S.toolApp=null;
function appCount(id){ try{ return id==="outbox"?obPend().length:id==="agent"?(S.loaded?agentSuggest().length:0):0; }catch(_){ return 0; } }
function appN(id){ const n=appCount(id); return n?`<span class="appn" aria-label="${n} waiting">${n>99?"99+":n}</span>`:""; }
function toolsHTML(){
  const app=TOOL_APPS.find(x=>x.id===S.toolApp);
  if(!app){
    const tile=x=>x.url?`<button class="appicon" type="button" data-turl="${esc(x.url)}" title="${esc(x.desc)} (opens in a new tab)"><span class="appbadge" style="background:${x.bg}"><span aria-hidden="true">${x.icon}</span><i class="appext" aria-hidden="true">↗</i></span><span class="applabel">${esc(x.name)}</span></button>`
      :`<button class="appicon" type="button" data-tapp="${esc(x.id)}" title="${esc(x.desc)}"><span class="appbadge" style="background:${x.bg}"><span aria-hidden="true">${x.icon}</span>${appN(x.id)}</span><span class="applabel">${esc(x.name)}</span></button>`;
    const inApp=TOOL_APPS.filter(x=>!x.url), out=TOOL_APPS.filter(x=>x.url);
    return `<div class="bq" id="toolsroot"><section class="bqcard apphome"><h2>🧰 Tools</h2><p class="sub">Tap an app to open it. ↗ apps open in a new tab.</p>
      <div class="appgrid">${inApp.map(tile).join("")}</div>
      <h3 class="appsec">My other pages</h3><div class="appgrid">${out.map(tile).join("")}</div></section></div>`; }
  const bar=`<div class="appbar"><button class="pbtn" type="button" data-tapp="">‹ All tools</button><span class="appbadge sm" style="background:${app.bg}">${app.icon}</span><b>${esc(app.name)}</b></div>`;
  if(app.id==="amb") return `<div class="bq" id="toolsroot">${bar}${ambHTML()}</div>`;
  if(app.id==="des") return `<div class="bq" id="toolsroot">${bar}${desHTML()}</div>`;
  if(app.id==="log") return `<div class="bq" id="toolsroot">${bar}<section class="bqcard"><h2>🗂️ My UTM link log</h2><p class="sub">Links you save in the UTM Builder stay here in your account. Download it to paste into the shared UTM Link Log.</p><div id="utmlog"></div></section></div>`;
  const opt=(a)=>a.map(x=>`<option>${esc(x)}</option>`).join("");
  const pnames=[...new Set((S.partners||[]).map(p=>utmClean(String(p.org||p.name||"").replace(/\(.*?\)/g,"")).replace(/[^a-z0-9_]/g,"")).filter(Boolean))].sort();
  return `<div class="bq" id="toolsroot">${bar}<div id="utmform">
  <section class="bqcard"><h2>🔗 UTM Link Builder</h2><p class="sub">Approved values from the UTM SOP (Section 2). Every link is lowercase with underscores. Save it to your log before it goes on any material.</p>
   <div class="bqgrid">
    <div style="grid-column:1/-1"><label for="u_base">Project enrollment URL</label><input id="u_base" data-u placeholder="https://ampion.net/newlenox"></div>
    <div><label for="u_slug">Project name (for campaign)</label><input id="u_slug" data-u placeholder="newlenox"></div>
    <div><label for="u_src">utm_source — who is distributing</label><select id="u_src" data-u>${opt(UTM_SRC)}<option value="__custom">Other (partner name)…</option></select><input id="u_srcC" data-u list="u_plist" placeholder="partner_name" style="display:none;margin-top:6px"><datalist id="u_plist">${pnames.map(n=>`<option value="${esc(n)}">`).join("")}</datalist></div>
    <div><label for="u_med">utm_medium — channel type</label><select id="u_med" data-u>${opt(UTM_MED)}<option value="__custom">Other (enter your own)…</option></select><input id="u_medC" data-u placeholder="e.g. faith_partner" style="display:none;margin-top:6px"></div>
    <div><label for="u_camp">utm_campaign — initiative + site</label><select id="u_camp" data-u>${UTM_CAMP.map(([g,os])=>`<optgroup label="${esc(g)}">${os.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("")}</optgroup>`).join("")}<option value="__custom">Other — enter your own (needs approval)…</option></select><input id="u_campC" data-u placeholder="initiative_project, e.g. school_outreach_trenton" style="display:none;margin-top:6px"></div>
    <div><label for="u_cont">utm_content — version or person</label><input id="u_cont" data-u placeholder="rl01, letter_v1, flyer_a"></div>
    <div><label for="u_mat">Material name (for the log)</label><input id="u_mat" data-u placeholder="Ambassador referral flyer"></div>
    <div><label for="u_where">Where used</label><input id="u_where" data-u placeholder="Mason Clark MS event 10/15"></div>
   </div>
   <div class="bqok n" id="u_warn" hidden></div>
   <div class="utmout" style="margin-top:12px"><h3>Your UTM link</h3><div class="utmlink" id="u_link">Fill in the fields above…</div>
    <div class="pbtns"><button class="pbtn main" type="button" data-uact="copy">📋 Copy link</button><button class="pbtn" type="button" data-uact="qr">▦ QR code</button><button class="pbtn" type="button" data-uact="save">💾 Save to my link log</button><button class="pbtn" type="button" data-uact="row">Copy log row</button></div>
    <div id="utmqrwrap" hidden><div id="utmqr"></div><div class="pbtns" style="margin-top:8px"><button class="pbtn" type="button" data-uact="qrdl">⬇ Download QR (PNG)</button></div></div></div>
   <p class="utmrules" style="margin-top:12px"><b>Rules:</b> lowercase always · underscores, no spaces · lock spellings once used · campaign pattern is initiative_site · never guess a campaign name; new ones need program lead approval.<br><b>QR codes:</b> always from the full UTM link, never the bare URL. <b>Before printing:</b> open the link and check the full parameter string shows in the address bar.</p>
  </section>
  </div><p class="utmrules" style="margin:0 4px">Saved links are in <button class="mini" type="button" data-tapp="log">🗂️ Link Log</button>.</p></div>`; }
function utmVal(id){ const el=$(id); if(!el) return ""; if(el.value==="__custom"){ const c=$(id+"C"); return c?c.value.trim():""; } return el.value.trim(); }
function utmAutoSlug(){ const b=String($("u_base")?.value||"").trim().replace(/[?#].*$/,"").replace(/\/+$/,""); const m=b.match(/\/([^\/]+)$/); return m&&!/\./.test(m[1])?utmClean(m[1]):""; }
function utmBuild(){
  if(!$("u_base")) return;
  ["u_src","u_med","u_camp"].forEach(id=>{ const c=$(id+"C"); if(c) c.style.display=$(id).value==="__custom"?"block":"none"; });
  const sl=$("u_slug"); if(sl&&!sl.dataset.touched) sl.value=utmAutoSlug();
  const base=String($("u_base").value||"").trim().replace(/\/+$/,""), src=utmClean(utmVal("u_src")), med=utmClean(utmVal("u_med")), slug=utmClean(sl.value||utmAutoSlug());
  const camp=utmClean(utmVal("u_camp")).replace("{p}",slug), cont=String($("u_cont").value||"").trim().replace(/\s+/g,"_");
  const raw=[$("u_srcC").value,$("u_medC").value,$("u_campC").value,$("u_cont").value], issues=[];
  if(raw.some(v=>/[A-Z]/.test(v))) issues.push("Uppercase is changed to lowercase automatically.");
  if(raw.some(v=>/\s/.test(v))) issues.push("Spaces are changed to underscores automatically.");
  if(utmVal("u_camp").includes("{p}")&&!slug) issues.push("Add a project name so the campaign name is complete.");
  if($("u_med").value==="__custom"&&med) issues.push("Custom medium: confirm with the program lead so it stays consistent.");
  if($("u_camp").value==="__custom"&&camp) issues.push("New campaign name: get program lead approval before using it.");
  if(base&&!/^https?:\/\//i.test(base)) issues.push("The enrollment URL should start with https://");
  const w=$("u_warn"); w.hidden=!issues.length; w.textContent=issues.join(" ");
  S.utmCur=(base&&src&&med&&camp&&cont)?`${base}${base.includes("?")?"&":"?"}utm_source=${encodeURIComponent(src)}&utm_medium=${encodeURIComponent(med)}&utm_campaign=${encodeURIComponent(camp)}&utm_content=${encodeURIComponent(cont)}`:"";
  S.utmParts={base,src,med,camp,cont};
  $("u_link").textContent=S.utmCur||"Fill in the fields above…";
  if(S.utmQR) utmQR(); }
function utmQR(){ const box=$("utmqr"), wrap=$("utmqrwrap"); if(!box) return; box.innerHTML="";
  if(!S.utmCur){ wrap.hidden=true; return; }
  if(!window.QRCode){ wrap.hidden=false; box.textContent="QR maker didn't load — reload the page."; return; }
  new QRCode(box,{text:S.utmCur,width:512,height:512,correctLevel:QRCode.CorrectLevel.M}); wrap.hidden=false; }
function utmRowText(x){ return [x.material||"",x.base||"",x.src,x.med,x.camp,x.cont,x.link,x.date||"",x.by||"",x.where||"",x.approved||""].join("\t"); }
function utmLogOut(){ const el=$("utmlog"); if(!el) return; const ls=(S.utm||[]).slice().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  el.innerHTML=ls.length?`<div style="overflow:auto"><table class="utmtbl"><tr><th>Material</th><th>Campaign</th><th>Content</th><th>Link</th><th>Where used</th><th>Date</th><th></th></tr>${ls.map(x=>`<tr data-uid="${esc(x.id)}"><td>${esc(x.material||"—")}</td><td>${esc(x.camp)}</td><td>${esc(x.cont)}</td><td class="lk">${esc(x.link)}</td><td>${esc(x.where||"")}</td><td>${esc(x.date||"")}</td><td style="white-space:nowrap"><button class="mini" data-uact="lcopy">Copy</button> <button class="mini" data-uact="ldel">Delete</button></td></tr>`).join("")}</table></div><div class="pbtns" style="margin-top:10px"><button class="pbtn" type="button" data-uact="csv">⬇ Download log (CSV)</button></div>`
  :`<div class="bqempty">No links saved yet. Build one above and tap 💾 Save to my link log.</div>`; }
$("list").addEventListener("click",e=>{ if(S.view!=="tools") return; const u=e.target.closest("[data-turl]");
  if(u){ const url=u.dataset.turl; let w=null; try{ w=window.open(url,"_blank"); if(w) w.opener=null; }catch(_){}
    if(!w){ try{ window.top.location.href=url; return; }catch(_){} copyText(url); toast("Link copied — paste it in your browser to open"); } return; }
  const b=e.target.closest("[data-tapp]"); if(!b) return;
  // An open tool's form lives inside its tile. Touching a field in it is not a tap on the tile,
  // so don't redraw the screen and don't scroll her back to the top mid-sentence.
  const ctl=e.target.closest("input,select,textarea,label,a,button,[contenteditable]");
  if(ctl&&ctl!==b&&b.contains(ctl)) return;
  const id=b.dataset.tapp, app=TOOL_APPS.find(x=>x.id===id);
  if(id==="kitty"){ kSet("ws.kittyOff",null); kShow(true); return; }
  if(app&&app.go){ S.view=app.go; render(); window.scrollTo&&window.scrollTo(0,0); return; }
  if(id&&id===S.toolApp) return;   // already open
  S.toolApp=id||null; S.utmQR=false; renderList(); window.scrollTo&&window.scrollTo(0,0); });
$("list").addEventListener("input",e=>{ if(S.view!=="tools"||!e.target.matches("[data-u]")) return; if(e.target.id==="u_slug") e.target.dataset.touched="1"; utmBuild(); });
$("list").addEventListener("change",e=>{ if(S.view!=="tools"||!e.target.matches("[data-u]")) return; utmBuild(); });
$("list").addEventListener("click",async e=>{ if(S.view!=="tools") return; const b=e.target.closest("[data-uact]"); if(!b) return; const a=b.dataset.uact;
  if(a==="copy"){ if(!S.utmCur){ toast("Fill in every field first"); return; } const ok=await copyText(S.utmCur); toast(ok?"📋 Link copied":"Press and hold the link to copy it"); return; }
  if(a==="qr"){ if(!S.utmCur){ toast("Fill in every field first"); return; } S.utmQR=true; utmQR(); return; }
  if(a==="qrdl"){ const c=$("utmqr")?.querySelector("canvas"); if(!c){ toast("Make the QR code first"); return; } if(!S.dl){ toast("Download isn't available here"); return; }
    try{ const bin=atob(c.toDataURL("image/png").split(",")[1]), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
      await S.dl.save({filename:`QR ${S.utmParts.camp}_${S.utmParts.cont}.png`,data:u8}); toast("▦ QR code ready"); }catch(err){ if(err?.code!=="declined") toast("Couldn't save the QR code"); } return; }
  if(a==="row"){ if(!S.utmCur){ toast("Fill in every field first"); return; } const x={...S.utmParts,link:S.utmCur,material:$("u_mat").value.trim(),where:$("u_where").value.trim(),date:new Date().toLocaleDateString("en-US"),by:"Sheree Taylor"}; const ok=await copyText(utmRowText(x)); toast(ok?"📋 Log row copied — paste into the UTM Link Log":"Couldn't copy"); return; }
  if(a==="save"){ if(!S.utmCur){ toast("Fill in every field first"); return; } if(!S.db){ toast("Not connected"); return; }
    if((S.utm||[]).some(x=>x.link===S.utmCur)){ toast("That link is already in your log"); return; }
    try{ await ucol().add({...S.utmParts,link:S.utmCur,material:$("u_mat").value.trim(),where:$("u_where").value.trim(),date:new Date().toLocaleDateString("en-US"),by:"Sheree Taylor",approved:"",createdAt:new Date().toISOString()}); toast("💾 Saved to your link log"); }catch(err){ writeErr(err); } return; }
  const tr=b.closest("[data-uid]"), x=tr&&(S.utm||[]).find(y=>y.id===tr.dataset.uid);
  if(a==="lcopy"&&x){ const ok=await copyText(x.link); toast(ok?"📋 Link copied":"Couldn't copy"); return; }
  if(a==="ldel"&&x){ if(!b.classList.contains("armed")){ b.classList.add("armed"); b.textContent="Sure?"; setTimeout(()=>{ if(b.isConnected){ b.classList.remove("armed"); b.textContent="Delete"; } },4000); return; } try{ await ucol().doc(x.id).delete(); toast("🗑️ Removed from your log"); }catch(err){ writeErr(err); } return; }
  if(a==="csv"){ if(!S.dl){ toast("Download isn't available here"); return; }
    const head=["Material Name","Base URL","utm_source","utm_medium","utm_campaign","utm_content","Full Link","Date Created","Created By","Where Used","Approved"];
    const rows=[head].concat((S.utm||[]).map(x=>[x.material,x.base,x.src,x.med,x.camp,x.cont,x.link,x.date,x.by,x.where,x.approved]));
    try{ await S.dl.save({filename:`UTM Link Log ${ymd(new Date())}.csv`,data:rows.map(r=>r.map(csv).join(",")).join("\n")}); toast("⬇ Log ready"); }catch(err){ if(err?.code!=="declined") toast("Download isn't available here"); } return; }
});