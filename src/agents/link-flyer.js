// ---- One tap: tracked link + QR + flyer, all logged (Oct 13 2026).
// Before: the UTM link, the flyer and the Link Log were three separate tools, and a flyer never reached
// the Link Log. Now any partner hub can run all three in one tap, and EVERY flyer — from this button,
// Ambassador/Designee onboarding or the Flyers tab — is written to the Link Log and the partner's timeline.

function lfLinkFor(p,base,project){
  const eb=enrollBase(base); if(eb.why) return {why:eb.why};
  const slug=utmClean(project||""); if(!slug) return {why:"Add the project name (e.g. Trenton) — it goes in the tracked link."};
  const org=String(p.org||p.name||"").replace(/\(.*?\)/g,"").trim();
  const src=utmClean(org).replace(/[^a-z0-9_]/g,""), camp="partner_outreach_"+slug, cont=initials(org).toUpperCase(), b=eb.url;
  const link=`${b}${b.includes("?")?"&":"?"}utm_source=${encodeURIComponent(src)}&utm_medium=community_partner&utm_campaign=${encodeURIComponent(camp)}&utm_content=${encodeURIComponent(cont)}`;
  return {link,base:b,src,camp,cont,org};
}
// Link Log + partner timeline, written once per flyer (safe to call twice).
async function lfLogFlyer(p,url){ if(!S.db||!S.uid||!url) return;
  const org=p.org||p.name||"Partner";
  if(!(S.links||[]).some(l=>l.url===url)){ try{ await lcol().add({label:"Flyer — "+org,url,kind:"flyer",pid:p.id||"",partner:org,note:p.utmLink?"QR → "+p.utmLink:"",order:99,createdAt:new Date().toISOString()}); }
    catch(err){ toast("⚠️ Flyer made, but it didn't save to your Link Log — "+((err&&err.message)||"try again")); agLog("Link Log write failed for flyer: "+org,{act:"error",ref:p.id}); } }
  if(p.id){ const cur=(S.partners||[]).find(x=>x.id===p.id)||p; if(!(cur.history||[]).some(h=>String(h.text||"").includes(url))){
    try{ await pcol().doc(p.id).update({history:[...(cur.history||[]),{at:new Date().toISOString(),text:"📄 Flyer made in Canva: "+url,changes:{}}].slice(-60)}); }catch(err){ console.warn("[flyer] timeline",err); } } }
}
// Every successful flyer, from any tool, gets logged.
{ const _flyer=flyerCanva; flyerCanva=async function(p,btn){ const before=p&&p.flyerUrl; const url=await _flyer(p,btn); if(url&&url!==before) await lfLogFlyer(p,url); return url; }; }

function lfHTML(p){
  const base=p.enrollBase||(S.amb&&S.amb.base)||"", proj=p.project||(S.amb&&S.amb.project)||"";
  const has=!!p.utmLink, fly=!!p.flyerUrl;
  const steps=[["🔗 Tracked link",has],["▦ QR code",fly],["📄 Flyer in Canva",fly],["🗂️ Saved to Link Log",fly&&(S.links||[]).some(l=>l.url===p.flyerUrl)]];
  return `<div class="lfbox" style="display:grid;gap:8px;border-top:1px dashed var(--line);padding-top:10px">
    <div class="hsteps">${steps.map(([l,on])=>`<i class="${on?"on":""}">${on?"✓ ":""}${l}</i>`).join("")}</div>
    ${has?"":`<div style="display:grid;gap:6px">
      <label class="plabel" for="lfbase">Ampion enrollment page</label><input id="lfbase" data-lfbase value="${esc(base)}" placeholder="https://ampion.net/trenton" style="border:1.5px solid var(--line);background:var(--surface);border-radius:8px;padding:8px 10px">
      <label class="plabel" for="lfproj">Project</label><input id="lfproj" data-lfproj value="${esc(proj)}" placeholder="Trenton" style="border:1.5px solid var(--line);background:var(--surface);border-radius:8px;padding:8px 10px"></div>`}
    <div class="pbtns"><button class="pbtn main" data-lfgo${S.lfBusy===p.id?" disabled":""}>${has?(fly?"♻️ Remake flyer":"📄 Make QR + flyer from their link"):"✨ Make link + QR + flyer"}</button></div>
    <div class="hempty" id="lfstat" role="status" aria-live="polite">${S.lfMsg&&S.lfMsg.pid===p.id?esc(S.lfMsg.t):""}</div>
  </div>`;
}

// Make + save the tracked link (UTM log, partner, timeline). Returns {link} or {why}.
async function lfMakeLink(p,base,proj){
  const L=lfLinkFor(p,base,proj); if(L.why) return {why:L.why};
  const now=new Date().toISOString();
  if(!(S.utm||[]).some(u=>u.link===L.link)) await ucol().add({base:L.base,src:L.src,med:"community_partner",camp:L.camp,cont:L.cont,link:L.link,material:L.org+" enrollment link",where:"",pid:p.id,date:new Date().toLocaleDateString("en-US"),by:"Sheree Taylor",approved:"",createdAt:now});
  await pcol().doc(p.id).update({utmLink:L.link,enrollBase:L.base,project:String(proj||"").trim(),kit:{...(p.kit||{}),landing:true},
    history:[...(p.history||[]),{at:now,text:"🔗 Tracked link made and saved to the UTM log: "+L.link,changes:{}}].slice(-60)});
  p.utmLink=L.link; p.history=[...(p.history||[]),{at:now,text:"🔗 Tracked link made",changes:{}}];
  agLog("Tracked link made: "+L.org,{act:"utm",ref:p.id}); return {link:L.link};
}
async function lfRun(btn){
  const p=(S.partners||[]).find(x=>x.id===S.hub); if(!p) return;
  const say=t=>{ S.lfMsg={pid:p.id,t}; const el=$("lfstat"); if(el) el.textContent=t; };
  if(S.lfBusy) return; S.lfBusy=p.id; btn.disabled=true;
  try{
    if(!p.utmLink){
      const base=(document.querySelector("[data-lfbase]")||{}).value||"", proj=(document.querySelector("[data-lfproj]")||{}).value||"";
      say("🔗 Making the tracked link…"); const r=await lfMakeLink(p,base,proj); if(r.why){ say("⚠️ "+r.why); return; }
    }
    if(!S.mcp){ say("✓ Tracked link saved. The QR + flyer step needs Canva and Google Drive allowed for this page (Permissions menu) — then tap again."); return; }
    say("📄 Making the QR code and flyer in Canva… (about 30 seconds)");
    if(p.flyerUrl) btn.dataset.redo="1";
    const url=await flyerCanva(p,btn); delete btn.dataset.redo;
    say(url?"✓ Done — link, QR and flyer made, and the flyer is in your Link Log and this partner's timeline.":"⚠️ The flyer stopped — the message above says why. Your tracked link is saved.");
  }catch(err){ say("⚠️ Stopped: "+((err&&err.message)||"try again")+". Nothing half-made was kept."); agLog("Link + flyer failed: "+(p.org||p.name)+" — "+((err&&err.message)||""),{act:"error",ref:p.id}); }
  finally{ S.lfBusy=null; btn.disabled=false; const b2=document.querySelector("[data-lfgo]"); if(b2) b2.disabled=false; }
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-lfgo]"); if(!b||S.view!=="partners"||!S.hub) return; lfRun(b); });
