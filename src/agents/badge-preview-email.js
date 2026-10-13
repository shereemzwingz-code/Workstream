// ---- Badge preview: the real Canva badge when it exists, otherwise a layout mock-up with name / org / Agent ID
function badgeMockHTML(bd){ const id=bd.agentId?"#"+String(bd.agentId).padStart(4,"0"):"#"+String(nextAgentId()).padStart(4,"0")+" (next)";
  return `<div class="bpcard"><div class="bptop">Dimension Energy<span>Community Solar · ABP Enrollment Agent</span></div><div class="bpphoto" aria-hidden="true">📷</div><div class="bpname">${esc(bd.name)}</div><div class="bporg">${esc(bd.org||"Company logo")}</div><div class="bpid">Agent ID ${esc(id)}</div></div>`; }
function badgeModal(bd,inner,note){ document.getElementById("bpov")?.remove(); const ov=document.createElement("div"); ov.id="bpov"; ov.className="bpov"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true"); ov.setAttribute("aria-label","Badge preview for "+bd.name);
  ov.innerHTML=`<div class="bpbox"><div class="bphead"><b>🪪 ${esc(bd.name)}</b><button class="pbtn" data-bpclose aria-label="Close preview">✕</button></div><div class="bpbody">${inner}</div>${note?`<div class="bpnote">${note}</div>`:""}</div>`;
  ov.addEventListener("click",e=>{ if(e.target===ov||e.target.closest("[data-bpclose]")) ov.remove(); }); document.body.appendChild(ov); ov.querySelector("[data-bpclose]").focus(); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape") document.getElementById("bpov")?.remove(); });
async function badgePreview(bd,btn){
  if(!bd.canvaId||!S.mcp){ const id=String(bd.agentId||nextAgentId()).padStart(4,"0");
    badgeModal(bd,`<div class="bptpl"><figure class="bptplf"><img class="bpimg" src="${BADGE_ART.v}" alt="Badge template"><figcaption>The template their badge is copied from</figcaption></figure>${badgeMockHTML(bd)}</div>`,`${esc(bd.name)} goes on this template as <b>Agent ID #${id}</b>${bd.org?` for ${esc(bd.org)}`:""}. Tap <b>🎨 Make in Canva</b> to build it, then Preview again for the real one.`); return; }
  const cached=shotGet(bd); if(cached) badgeModal(bd,`<img class="bpimg" src="${cached}" alt="Badge for ${esc(bd.name)}">`,`Last snapshot of the badge.${bd.canvaUrl?` <a href="${esc(bd.canvaUrl)}" target="_blank" rel="noopener">Edit in Canva ↗</a>`:""}`);
  if(btn){ btn.disabled=true; btn.textContent="⏳"; }
  try{ // the page can't load outside images, so ask Canva for the thumbnail as image data (the page in ID BADGE when it's filed there, else the copy)
    const useMaster=!!bd.masterPage; const res=await S.mcp.callTool(CANVA,"read-design",{design_id:useMaster?BADGE_TPL:bd.canvaId,filter:{fields:["thumbnails"],thumbnail_pages:[useMaster?bd.masterPage:1]},user_intent:"Preview the badge for "+bd.name},{cache:false});
    const img=(res&&res.content||[]).find(c=>c&&c.type==="image"&&c.data); if(!img) throw {message:"Canva didn't send a picture back — open it in Canva instead."};
    const url=`data:${img.mimeType||"image/png"};base64,${img.data}`; shotPut(bd,url);
    badgeModal(bd,`<img class="bpimg" src="${url}" alt="Badge for ${esc(bd.name)}">`,`This is the badge in Canva right now, with any photo and logo you've added.${bd.canvaUrl?` <a href="${esc(bd.canvaUrl)}" target="_blank" rel="noopener">Edit in Canva ↗</a>`:""}`);
  }catch(e){ badgeModal(bd,badgeMockHTML(bd),esc((e&&e.message)||"Couldn't load the Canva badge.")+" Showing the layout with their details instead."); }
  finally{ if(btn){ btn.disabled=false; btn.textContent="👁️ Preview"; } } }
// ---- 📧 From email: find the headshot / logo in Outlook, pull the attachment straight out, and run the same Drive → Canva → cutout → place chain. No file picking.
const MAIL_SRV="Microsoft 365";
async function mailImages(terms,kind){ const seen=new Set(), out=[];
  for(const q of terms){ if(!q) continue; let res; try{ res=await S.mcp.callTool(MAIL_SRV,"outlook_email_search",{query:q,limit:8},{cache:false}); }catch(e){ if(e&&(e.code==="not_in_manifest"||e.code==="not_granted")) throw e; continue; }
    const items=resultObjs(res).filter(m=>m&&m.uri&&m.hasAttachments); for(const m of items){ if(seen.has(m.uri)) continue; seen.add(m.uri); if(out.length>=12) break;
      try{ const full=mcpPayload(await S.mcp.callTool(MAIL_SRV,"read_resource",{uri:m.uri},{cache:false})); (full.attachments||[]).forEach(a=>{ const img=/^image\//i.test(a.contentType||"")||/\.(png|jpe?g|webp|heic)$/i.test(a.name||""); if(!img||a.isInline||(a.size||0)<30000) return; if(kind==="logo"&&!/logo|brand|epha|housing/i.test(a.name+" "+(full.subject||""))&&(a.size||0)>3e6) return; out.push({uri:a.uri,name:a.name,size:a.size,mime:a.contentType||"image/png",subject:full.subject||m.subject||"",from:(full.sender&&(full.sender.name||full.sender.address))||m.sender||"",when:full.receivedDateTime||m.receivedDateTime||""}); }); }catch(_){ } } }
  return out; }
function blockImage(res){ // image data can arrive as {type:"image",data}, {type:"resource",resource:{blob}}, or a text/payload field holding base64
  const blocks=(res&&res.content)||[]; for(const c of blocks){ if(!c) continue; if(c.type==="image"&&c.data) return {b64:c.data,mime:c.mimeType||"image/png"}; const r=c.resource||c; if(r&&r.blob) return {b64:r.blob,mime:r.mimeType||c.mimeType||"image/png"}; if(c.data&&/^[A-Za-z0-9+/=\s]{200,}$/.test(c.data)) return {b64:c.data.replace(/\s/g,""),mime:c.mimeType||"image/png"}; }
  const p=res&&res.payload; if(p&&typeof p==="object"){ const b=p.contentBytes||p.blob||p.data||p.base64||(p.resource&&p.resource.blob); if(typeof b==="string"&&b.length>200) return {b64:b.replace(/^data:[^,]+,/,""),mime:p.contentType||p.mimeType||"image/png"}; }
  if(typeof p==="string"&&/^data:image\//.test(p)) return {b64:p.replace(/^data:[^,]+,/,""),mime:(p.match(/^data:([^;]+)/)||[])[1]||"image/png"};
  return null; }
async function mailImageB64(uri){ const res=await S.mcp.callTool(MAIL_SRV,"read_resource",{uri},{cache:false}); const img=blockImage(res); if(!img){ try{ agLog("Attachment read shape: "+JSON.stringify(res).slice(0,300),{act:"badge"}); }catch(_){ } throw {message:"Outlook sent the attachment back without the picture"}; } return img; }
function shrinkB64(b64,mime,max,circle){ return new Promise(ok=>{ try{ const im=new Image(); im.onload=()=>{
      if(circle){ const side=Math.min(im.width,im.height), sx=(im.width-side)/2, sy=Math.max(0,Math.min(im.height-side,(im.height-side)*0.25)); const c=document.createElement("canvas"); c.width=c.height=Math.min(side,max); const g=c.getContext("2d"); g.beginPath(); g.arc(c.width/2,c.height/2,c.width/2,0,Math.PI*2); g.closePath(); g.clip(); g.drawImage(im,sx,sy,side,side,0,0,c.width,c.height); return ok({b64:c.toDataURL("image/png").split(",")[1],mime:"image/png"}); }
      const k=Math.min(1,max/Math.max(im.width,im.height)); if(k>=1&&b64.length<700000) return ok({b64,mime}); const c=document.createElement("canvas"); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k); c.getContext("2d").drawImage(im,0,0,c.width,c.height); const png=/png|gif|webp|svg/i.test(mime); const out=c.toDataURL(png?"image/png":"image/jpeg",0.9); ok({b64:out.split(",")[1],mime:png?"image/png":"image/jpeg"}); }; im.onerror=()=>ok({b64,mime}); im.src="data:"+mime+";base64,"+b64; }catch(_){ ok({b64,mime}); } }); }
function tplArtHTML(live){ const v=(live&&live[0])||BADGE_ART.v, h=(live&&live[1])||BADGE_ART.h;
  return `<div class="bptpl"><figure class="bptplf"><img class="bpimg" src="${v}" alt="Vertical badge template"><figcaption>Vertical · p.${BADGE_TPL_PAGE}<br><b>new badges copy this one</b></figcaption></figure>${BADGE_TPL_PAGE_H?`<figure class="bptplf"><img class="bpimg" src="${h}" alt="Horizontal badge template"><figcaption>Horizontal · p.${BADGE_TPL_PAGE_H}</figcaption></figure>`:""}</div>`; }
// ---- Live snapshot of each badge, straight from Canva, cached so the card draws instantly next time
S.bdgShot=S.bdgShot||{};
function shotKey(bd){ return "ws.shot."+bd.id+"."+(bd.canvaId||"")+"."+(bd.photoAt||"")+(bd.logoAt||""); }
function shotGet(bd){ if(S.bdgShot[bd.id]) return S.bdgShot[bd.id]; try{ const v=localStorage.getItem(shotKey(bd)); if(v){ S.bdgShot[bd.id]=v; return v; } }catch(_){ } return null; }
function shotPut(bd,uri){ S.bdgShot[bd.id]=uri; try{ localStorage.setItem(shotKey(bd),uri); }catch(_){ } }
async function badgeShot(bd,force){ if(!S.mcp||!bd.canvaId) return null; if(!force){ const c=shotGet(bd); if(c) return c; }
  const page=bd.masterPage||1, design=bd.masterPage?BADGE_TPL:bd.canvaId;
  const res=await S.mcp.callTool(CANVA,"read-design",{design_id:design,filter:{fields:["thumbnails"],thumbnail_pages:[page]},user_intent:"Snapshot of "+bd.name+"'s badge"},{cache:false});
  const img=((res&&res.content)||[]).find(c=>c&&c.type==="image"&&c.data); if(!img) return null;
  let uri="data:"+(img.mimeType||"image/png")+";base64,"+img.data;
  try{ const sm=await shrinkB64(img.data,img.mimeType||"image/png",320); uri="data:"+sm.mime+";base64,"+sm.b64; }catch(_){ }
  shotPut(bd,uri); return uri; }
async function badgeShots(){ if(!S.mcp||S.shotRun) return; const need=(S.badges||[]).filter(b=>b.canvaId&&!shotGet(b)); if(!need.length) return;
  S.shotRun=true; let got=0;
  for(const bd of need.slice(0,8)){ try{ if(await badgeShot(bd)) got++; }catch(_){ } }
  S.shotRun=false; if(got&&S.view==="badges") renderList(); }
async function badgeTplPreview(btn){ const tpl={name:"ID BADGE template"};
  const note=live=>`${live?"Straight from Canva just now":"Your ID BADGE template"} — <b>🎨 Make in Canva</b> copies the vertical page and fills in the name, the organization and Agent ID <b>#${String(nextAgentId()).padStart(4,"0")}</b> (the next one up). <a href="#" data-bdg="opentpl">Edit in Canva ↗</a>`;
  badgeModal(tpl,tplArtHTML(null),note(false));   // draw immediately, then refresh from Canva if it is connected
  if(!S.mcp) return; const lbl=(btn&&btn.textContent)||"🪪 Template"; if(btn){ btn.disabled=true; btn.textContent="⏳"; }
  try{ const res=await S.mcp.callTool(CANVA,"read-design",{design_id:BADGE_TPL,filter:{fields:["thumbnails"],thumbnail_pages:BADGE_TPL_PAGE_H?[BADGE_TPL_PAGE,BADGE_TPL_PAGE_H]:[BADGE_TPL_PAGE]},user_intent:"Preview the ID BADGE template"},{cache:false});
    const live=((res&&res.content)||[]).filter(c=>c&&c.type==="image"&&c.data).map(c=>`data:${c.mimeType||"image/png"};base64,${c.data}`);
    if(live.length&&document.getElementById("bpov")) badgeModal(tpl,tplArtHTML(live),note(true));
  }catch(_){ }
  finally{ if(btn){ btn.disabled=false; btn.textContent=lbl; } } }
async function badgeFromEmail(bd,kind,btn){ if(!S.mcp){ toast("Needs Microsoft 365 + Canva + Google Drive connected in claude.ai"); return; } const lbl=btn&&btn.textContent; if(btn){ btn.disabled=true; btn.textContent="📧 Looking…"; }
  try{ const first=String(bd.name||"").split(/\s+/)[0]; const terms=kind==="photo"?[bd.name+" headshot",bd.name+" photo",bd.name,bd.org+" headshot",first+" headshot"]:[bd.org+" logo","logo "+bd.org,bd.org];
    const imgs=await mailImages(terms,kind); if(!imgs.length) throw {message:"No image attachments found in email for "+(kind==="photo"?bd.name:bd.org)+". Ask them to send a .jpg or .png (not inside a Word doc)."};
    const pick=u=>{ document.getElementById("bpov")?.remove(); const it=imgs.find(x=>x.uri===u); if(btn){ btn.disabled=false; btn.textContent=lbl; } if(it) badgeAddImage(bd,kind,{b64:null,uri:it.uri,mime:it.mime,name:it.name},btn); };
    const nm=String(kind==="photo"?bd.name:bd.org||"").toLowerCase().split(/\s+/).filter(w=>w.length>2); const named=imgs.filter(x=>nm.some(w=>String(x.name).toLowerCase().includes(w)));
    if(named.length===1){ pick(named[0].uri); return; }
    badgeModal(bd,`<div class="ob" style="width:100%">${imgs.map(x=>`<button class="obr" type="button" data-bpick="${esc(x.uri)}"><span class="ic" aria-hidden="true">🖼️</span><span class="m"><span class="t">${esc(x.name)}</span><span class="s">${esc(x.subject)}</span><span class="p">${esc(x.from)} · ${esc(x.when?fmtShort(x.when):"")} · ${Math.round((x.size||0)/1024)} KB</span></span><span class="r"><span class="go2">Use ›</span></span></button>`).join("")}</div>`,"Pick the "+(kind==="photo"?"headshot":"logo")+" — it goes Drive → Canva → "+(kind==="photo"?"background removed → ":"")+"placed on the badge.");
    const ov=document.getElementById("bpov"); ov&&ov.addEventListener("click",e=>{ const b=e.target.closest("[data-bpick]"); if(b) pick(b.dataset.bpick); });
  }catch(e){ toast(e&&(e.code==="not_in_manifest"||e.code==="not_granted")?"Allow Microsoft 365 for this page (Permissions menu), then try again":(e&&e.message)||"Couldn't search email"); try{ agLog("Badge "+kind+" from email failed: "+((e&&e.message)||e&&e.code||"?")+" ("+bd.name+")",{act:"badge",ref:bd.id}); }catch(_){ } }
  finally{ if(btn){ btn.disabled=false; btn.textContent=lbl; } } }
window.Workstream.badge={make:badgeCanva,png:badgePng,preview:badgePreview,tpl:badgeTplPreview,nextAgentId,addImage:badgeAddImage,fromEmail:badgeFromEmail};
window.Workstream.designee={run:desRun,steps:()=>KITS.designee.steps.map(([k,ic,l])=>({k,label:l}))};
window.Workstream.ambassador={run:ambRun,steps:()=>KITS.ambassador.steps.map(([k,ic,l])=>({k,label:l}))};
window.Workstream.version=4; window.Workstream.flows=flowDefs; window.Workstream.outbox=()=>S.outbox; window.Workstream.queue=async d=>{ await qcol().add({at:new Date().toISOString(),kind:d.kind||"draft",title:d.title||"Draft",to:d.to||"",name:d.name||"",pid:d.pid||"",tid:d.tid||"",body:String(d.body||""),conf:confOf(String(d.body||""))[0],by:d.by||"agent"}); };
