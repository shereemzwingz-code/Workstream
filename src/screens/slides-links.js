// ---- Slides (Gamma) + quick links
S.dkBusy=null; S.slides=[]; S.links=[]; S.mcp=null; S.slBusy=false; S.slMsg=""; S.slErr=false; S.slAdd=false; S.linkEdit=null;
const scol=()=>S.db.doc("data/users/"+S.uid+"/slides").collection("items");
const lcol=()=>S.db.doc("data/users/"+S.uid+"/links").collection("items");
const GAMMA="Gamma";
const gammaId=u=>{ const m=String(u||"").match(/([a-z0-9]{12,})\/?(?:[?#].*)?$/i); return m?m[1]:""; };
const findUrl=x=>{ const t=typeof x==="string"?x:JSON.stringify(x||""); const m=t.match(/https:\/\/gamma\.app\/(?:docs|presentation|embed)\/[^\s"'<>)\\]+/); return m?m[0]:""; };
const findGen=x=>{ if(x&&typeof x==="object"){ for(const k of ["generationId","generation_id","id"]) if(typeof x[k]==="string") return x[k]; } const t=typeof x==="string"?x:JSON.stringify(x||""); const m=t.match(/generations\/([A-Za-z0-9_-]+)/)||t.match(/"generationId"\s*:\s*"([^"]+)"/); return m?m[1]:""; };
const findStatus=x=>{ const t=(typeof x==="string"?x:JSON.stringify(x||"")).toLowerCase(); if(/"status"\s*:\s*"(completed|complete|done|succeeded)"/.test(t)||/status:\s*(completed|complete)/.test(t)) return "done"; if(/"status"\s*:\s*"(failed|error)"/.test(t)) return "failed"; return "pending"; };
function mcpMsg(e){ const c=e&&e.code; return ({needs_reauth:"Gamma needs reconnecting: claude.ai → Settings → Connectors → Gamma.",server_not_connected:"Add the Gamma connector in claude.ai → Settings → Connectors, then reload.",selection_required:"Pick which Gamma connector to use in the prompt above, then try again.",not_in_manifest:"Gamma isn't allowed for this page. Use the page's Permissions menu to allow it.",blocked_by_policy:"Your organization blocks this Gamma action.",not_granted:"Open this page in claude.ai or the Claude app to make slides.",capability_disabled:"Making slides isn't available in this view. Open the page in claude.ai.",tool_error:"Gamma said: "+(e&&e.message||"it couldn't finish.")}[c])||("Gamma didn't finish ("+(c||"error")+"). Your inputs are saved below; tap Make slides to try again."); }
const deckKind=d=>d.kind||(d.madeFrom==="pitch"?"final":"pitch");
function slidesHTML(){
  const decks=S.slides.slice().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  const tpls=decks.filter(d=>d.template);
  const pics=(S.slPics||"").split(/\s+/).filter(x=>/^https?:\/\//.test(x));
  const maker=`<section class="slcard"><h2>✨ Make a partner deck</h2><p class="lead">Pick a template, add the partner's name and picture links, and Gamma builds a new deck in the same look. It shows up in My decks when it's done (about 1–3 minutes).</p>
   ${!tpls.length?`<div class="slstatus">Add a deck below and tick "Use as template" first.</div>`:`<div class="slform">
    <div><label for="slTpl">Template</label><select id="slTpl">${tpls.map(d=>`<option value="${esc(d.id)}"${S.slTpl===d.id?" selected":""}>${esc(d.name)}</option>`).join("")}</select></div>
    <div><label for="slName">Partner name</label><input id="slName" value="${esc(S.slName||"")}" placeholder="Lessie Bates Davis Neighborhood House"></div>
    <div><label for="slPics">Picture links (one per line)</label><textarea id="slPics" placeholder="https://… (partner logo, event photos)">${esc(S.slPics||"")}</textarea>
     <div class="hint2" style="font-size:12.5px;color:var(--muted);margin-top:4px">Gamma can only use pictures it can open: a public link (partner website, a Gamma or Google Drive image set to "anyone with the link"). Leave blank and Gamma keeps the template's placeholders.</div>
     ${pics.length?`<div class="pics" style="margin-top:6px">${pics.slice(0,8).map(u=>`<img src="${esc(u)}" alt="" loading="lazy" onerror="this.style.display='none'">`).join("")}</div>`:""}</div>
    <div><label for="slNote">Anything to change? (optional)</label><input id="slNote" value="${esc(S.slNote||"")}" placeholder="date October 14, 2026; mention their food pantry"></div>
    <div class="slrow"><button class="pbtn main" id="slGo"${S.slBusy||!S.mcp?" disabled":""}>${S.slBusy?"🪄 Making slides…":"✨ Make slides"}</button>${S.slBusy?`<button class="pbtn" id="slStop">Stop waiting</button>`:""}</div>
    ${!S.mcp?`<div class="slstatus">Making slides needs the Gamma connector and this page opened in claude.ai or the Claude app.</div>`:""}
    ${S.slMsg?`<div class="slstatus${S.slErr?" err":""}">${S.slMsg}</div>`:""}
   </div>`}</section>`;
  const add=S.slAdd?`<div class="slform" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
     <div><label for="dkName">Deck name</label><input id="dkName" placeholder="WTFMA x Dimension"></div>
     <div><label for="dkUrl">Gamma link</label><input id="dkUrl" placeholder="https://gamma.app/docs/…"></div>
     <div><label for="dkKind">List</label><select id="dkKind"><option value="pitch">🎤 Pitch Deck</option><option value="final">🤝 Organization x Dimension</option></select></div><label style="display:flex;gap:8px;align-items:center;font-size:14px;color:var(--ink)"><input type="checkbox" id="dkTpl" style="width:auto"> Use as template</label>
     <div class="slrow"><button class="pbtn main" id="dkSave">💾 Add deck</button><button class="pbtn" id="dkCancel">Cancel</button></div></div>`:"";
  const row=d=>`<div class="deck" data-deck="${esc(d.id)}"><div><span class="nm">${esc(d.name)}</span>${d.template?`<span class="tag">Template</span>`:""}${d.status==="running"?`<span class="tag run">Making…</span>`:d.madeFrom?`<span class="tag gen">Made here</span>`:""}<div class="sub">${d.partner?esc(d.partner)+" · ":""}${d.createdAt?esc(fmtShort(d.createdAt)):""}</div></div>
     <div class="btns">${d.url?`<a class="pbtn main" href="${esc(d.url)}" target="_blank" rel="noopener">Open ↗</a>`:""}${d.url||d.gammaId?`<button class="pbtn" data-dk="edit" aria-expanded="${S.slEdit===d.id}">✏️ Edit</button>`:""}<button class="pbtn" data-dk="tpl">${d.template?"⭐ Template":"☆ Make template"}</button><button class="pbtn" data-dk="kind" title="Move to the other list">${deckKind(d)==="final"?"↩ Pitch Deck":"➜ Org x Dimension"}</button><button class="pbtn danger" data-dk="del">🗑️</button></div>${S.slEdit===d.id?deckEditHTML(d):""}</div>`;
  const grp=(k,title,lead)=>{ const ds=decks.filter(d=>deckKind(d)===k).sort((x,y)=>(y.template?1:0)-(x.template?1:0)); return `<h3 class="dkgrp">${title} <span class="dkn">${ds.length}</span></h3><p class="lead">${lead}</p>${ds.length?ds.map(row).join(""):`<div class="empty">None yet.</div>`}`; };
  const list=`<section class="slcard"><h2>📊 My decks</h2>
   ${grp("pitch","🎤 Pitch Deck","The standard partnership pitch: Dimension, community solar, Illinois Shines and our impact. Templates live here, and ✨ Make slides saves here.")}
   ${grp("final","🤝 Organization x Dimension","Made in Canva from All Deck, one per partner. 📊 Pitch deck on a partner card saves here.")}
   <div class="slrow" style="margin-top:8px"><button class="pbtn" id="dkAdd">➕ Add a deck</button></div>${add}</section>`;
  return `<div class="slwrap">${maker}${list}</div>`;
}
function deckEditHTML(d){ const busy=S.edBusy===d.id;
  return `<div class="slform dkedit" style="grid-column:1/-1;width:100%;margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
   <div><label for="edTxt">What should change in “${esc(d.name)}”?</label><textarea id="edTxt" rows="3" placeholder="Make the cover title bigger · change “October” to “November” on slide 5 · make the tone warmer · swap the colors to more pink">${esc(S.edTxt||"")}</textarea>
   <div style="font-size:12.5px;color:var(--muted);margin-top:4px">Gamma changes the slides that are already there. It can reword, restyle and rearrange, but it can't add new slides; do that in Gamma. Photos and logos work best dropped in by hand in Gamma.</div></div>
   <div class="slrow"><button class="pbtn main" data-dk="edgo"${busy||!S.mcp?" disabled":""}>${busy?"🪄 Gamma is editing…":"✏️ Send to Gamma"}</button><button class="pbtn" data-dk="edclose">Close</button></div>
   ${!S.mcp?`<div class="slstatus">Editing needs the Gamma connector and this page opened in claude.ai or the Claude app.</div>`:""}
   ${S.edMsg&&S.edFor===d.id?`<div class="slstatus${S.edErr?" err":""}">${S.edMsg}</div>`:""}</div>`; }
async function editDeck(d){
  const prompt=($("edTxt")||{}).value?.trim()||""; S.edTxt=prompt; if(!prompt){ toast("Type what you want changed"); return; }
  S.edBusy=d.id; S.edFor=d.id; S.edErr=false; S.edMsg="Sending your changes to Gamma…"; renderList();
  try{
    const r=await S.mcp.callTool(GAMMA,"edit_gamma",{gammaIdOrUrl:d.url||d.gammaId,prompt},{cache:false});
    const p=r.payload??r; const t=typeof p==="string"?p:JSON.stringify(p||"");
    const id=(p&&typeof p==="object"&&(p.editId||p.edit_id))||(t.match(/"?editId"?\s*[:=]\s*"?([A-Za-z0-9_-]+)/)||[])[1];
    if(!id) throw {code:"tool_error",message:"Gamma didn't return an edit ID. Try again in a minute."};
    S.edMsg="Gamma is editing — bigger changes can take 5+ minutes. You can leave this page open…"; renderList();
    const t0=Date.now(); let done=null;
    while(Date.now()-t0<600000){
      await new Promise(res=>setTimeout(res,5000+Math.random()*2000));
      let st; try{ st=await S.mcp.callTool(GAMMA,"get_edit_status",{editId:id},{cache:false}); }catch(e){ if(e&&e.retryable) continue; throw e; }
      const q=st.payload??st; const f=findStatus(q);
      if(f==="failed"){ const why=(q&&typeof q==="object"&&(q.error||q.reason))||""; throw {code:"tool_error",message:"Gamma couldn't make that edit."+(why?" "+String(why):"")}; }
      if(f==="done"){ done=q; break; }
    }
    if(!done){ S.edMsg="Gamma is still working. Open the deck in a few minutes to see the changes."; return; }
    const sum=(done&&typeof done==="object"&&(done.summary||done.changes))||""; const url=findUrl(done)||d.url;
    S.edMsg=`✅ Done!${sum?" "+esc(String(sum)).slice(0,600):""} ${url?`<a href="${esc(url)}" target="_blank" rel="noopener">Open ${esc(d.name)} ↗</a>`:""}`; S.edTxt=""; toast("✏️ Deck updated");
  }catch(e){ S.edErr=true; S.edMsg=esc(mcpMsg(e)); }
  finally{ S.edBusy=null; renderList(); }
}
async function pollGen(gen,deckId){
  const t0=Date.now();
  while(S.slBusy&&Date.now()-t0<240000){
    await new Promise(r=>setTimeout(r,6000+Math.random()*2000));
    if(!S.slBusy) return;
    let r; try{ r=await S.mcp.callTool(GAMMA,"get_generation_status",{generationId:gen},{cache:false}); }catch(e){ if(e&&e.retryable) continue; throw e; }
    const p=r.payload??r; const url=findUrl(p); const st=findStatus(p);
    if(url&&st!=="failed"){ await scol().doc(deckId).update({url,status:"done"}); return url; }
    if(st==="failed") throw {code:"tool_error",message:"Gamma reported the generation failed."};
  }
  return "";
}
async function makeSlides(){
  const tpl=S.slides.find(d=>d.id===$("slTpl").value); const name=$("slName").value.trim();
  S.slTpl=tpl&&tpl.id; S.slName=name; S.slPics=$("slPics").value; S.slNote=$("slNote").value;
  if(!tpl||!name){ toast("Pick a template and type the partner name"); return; }
  const pics=S.slPics.split(/\s+/).filter(x=>/^https?:\/\//.test(x));
  S.slBusy=true; S.slErr=false; S.slMsg="Reading the template from Gamma…"; renderList();
  let deckId=null;
  try{
    const src=await S.mcp.callTool(GAMMA,"read_gamma",{gammaIdOrUrl:tpl.url||tpl.gammaId});
    const raw=typeof src.payload==="string"?src.payload:(src.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
    const theme=(raw.match(/<theme id="([^"]+)"/)||[])[1];
    const was=tpl.partner||tpl.name.split(/\s+x\s+/i)[0];
    let html=raw.replace(/<HEAD>[\s\S]*?<\/HEAD>/,"");
    html=html.replace(/<section\b/g,"\n---\n<section").replace(/<\/(h[1-6]|p|li|summary|details)>/g,"\n").replace(/<li[^>]*>/g,"- ").replace(/<br\s*\/?>/g,"\n");
    let body=html.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[ \t]+/g," ").replace(/\n\s*\n+/g,"\n").replace(/^[\s\S]*?\n---\n/,"").trim();
    const esc2=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    [was+" of Central Illinois",was+" of Southern Illinois",was].filter(Boolean).forEach(w=>{ body=body.replace(new RegExp(esc2(w),"g"),name); });
    let pi=0; body=body.replace(/\[(Photo|Image[^\]]*)\]/g,m=>pi<pics.length?pics[pi++]:m);
    body=body.slice(0,60000);
    const inputText=body;
    const extra=`This is a partnership deck from Dimension Energy for ${name}. Keep one card per section separated by ---, in the same order, with the same headings and wording. Do not invent numbers, dates or programs.${S.slNote?" Also apply these changes: "+S.slNote+".":""}${pi<pics.length?" Use these extra images where they fit: "+pics.slice(pi).join(" "):""}`;
    S.slMsg="Gamma is building the deck (about 1–3 minutes)…"; renderList();
    const now=new Date().toISOString();
    const ref=scol().doc(); deckId=ref.id;
    await ref.set({name:`${name} x Dimension`,partner:name,template:false,kind:"pitch",madeFrom:tpl.id,pictures:pics,status:"running",url:"",createdAt:now});
    let res;
    if(/^g_/.test(theme||"")){   // copy the template deck itself in Gamma: same design, layouts and icons
      const prompt=`Make this deck for ${name}. Keep the exact design, layouts, colors, fonts, icons, illustrations, Dimension Energy logos, footer and card order. Replace "${was}" (and any longer form of that name) with "${name}". Do not invent numbers, dates, names or programs.${S.slNote?" Also apply these changes: "+S.slNote+".":""}${pics.length?" Put these images in the [Photo] spots, in order: "+pics.join(" "):""}`;
      res=await S.mcp.callTool(GAMMA,"generate_from_template",{gammaId:theme,prompt,title:`${name} x Dimension`},{cache:false});
    } else {
      const args={inputText,textMode:"preserve",cardSplit:"inputTextBreaks",additionalInstructions:extra,title:`${name} x Dimension`}; if(theme) args.themeId=theme;
      res=await S.mcp.callTool(GAMMA,"generate",args,{cache:false});
    }
    const p=res.payload??res; let url=findUrl(p);
    if(!url){ const gen=findGen(p); if(gen) url=await pollGen(gen,deckId); }
    if(url){ await scol().doc(deckId).update({url,status:"done"}); S.slMsg=`✅ Done! <a href="${esc(url)}" target="_blank" rel="noopener">Open ${esc(name)} x Dimension ↗</a>`; S.slName=""; S.slPics=""; S.slNote=""; toast("📊 Deck ready"); }
    else { await scol().doc(deckId).update({status:"done"}); S.slMsg="Gamma is still working. Check your Gamma home in a few minutes; the deck will be titled \""+esc(name)+" x Dimension\"."; }
  }catch(e){ S.slErr=true; S.slMsg=esc(mcpMsg(e)); if(deckId){ try{ await scol().doc(deckId).update({status:"done"}); }catch{} } }
  finally{ S.slBusy=false; renderList(); }
}
$("list").addEventListener("click",async e=>{
  if(S.view!=="slides") return;
  if(e.target.closest("#slGo")){ makeSlides(); return; }
  if(e.target.closest("#slStop")){ S.slBusy=false; S.slMsg="Stopped waiting. Gamma may still finish; check your Gamma home."; renderList(); return; }
  if(e.target.closest("#dkAdd")){ S.slAdd=true; renderList(); return; }
  if(e.target.closest("#dkCancel")){ S.slAdd=false; renderList(); return; }
  if(e.target.closest("#dkSave")){ const name=$("dkName").value.trim(), url=$("dkUrl").value.trim(); if(!name){ toast("Add a deck name"); return; }
    try{ await scol().add({name,url,gammaId:gammaId(url),template:$("dkTpl").checked,kind:$("dkKind").value,partner:name.split(/\s+x\s+/i)[0],createdAt:new Date().toISOString()}); S.slAdd=false; toast("📊 Deck added"); }catch(err){ writeErr(err); } return; }
  const row=e.target.closest("[data-deck]"); const b=e.target.closest("[data-dk]"); if(!row||!b) return;
  const d=S.slides.find(x=>x.id===row.dataset.deck); if(!d) return;
  if(b.dataset.dk==="edit"){ S.slEdit=S.slEdit===d.id?null:d.id; if(S.edFor!==d.id){ S.edMsg=""; S.edTxt=""; } renderList(); setTimeout(()=>{ const t=$("edTxt"); t&&t.focus(); },50); return; }
  if(b.dataset.dk==="edclose"){ S.slEdit=null; renderList(); return; }
  if(b.dataset.dk==="edgo"){ editDeck(d); return; }
  if(b.dataset.dk==="tpl"){ try{ await scol().doc(d.id).update({template:!d.template}); }catch(err){ writeErr(err); } return; }
  if(b.dataset.dk==="kind"){ const k=deckKind(d)==="final"?"pitch":"final"; try{ await scol().doc(d.id).update({kind:k}); toast(k==="final"?"🤝 Moved to Organization x Dimension":"🎤 Moved to Pitch Deck"); }catch(err){ writeErr(err); } return; }
  if(b.dataset.dk==="del"){ if(!b.classList.contains("armed")){ b.classList.add("armed"); b.textContent="Delete?"; setTimeout(()=>{ if(b.isConnected){ b.classList.remove("armed"); b.textContent="🗑️"; } },4000); return; }
    try{ await scol().doc(d.id).delete(); toast("🗑️ Deck removed (still in Gamma)"); }catch(err){ writeErr(err); } }
});
$("list").addEventListener("input",e=>{ if(S.view!=="slides") return; const k={slName:"slName",slPics:"slPics",slNote:"slNote",edTxt:"edTxt"}[e.target.id]; if(k) S[k]=e.target.value; });
$("list").addEventListener("change",e=>{ if(S.view==="slides"&&e.target.id==="slTpl") S.slTpl=e.target.value; });
function linksHTML(){
  const ls=S.links.slice().sort((a,b)=>(a.order??99)-(b.order??99));
  return `<section class="refsec" data-sec><h2>🔗 Partner enrollment links</h2><p class="lead">Your budget and MSA links. Tap ✏️ to paste or change a link.</p>
   ${ls.map(l=>S.linkEdit===l.id?`<div class="slform" style="padding:9px 0;border-top:1px solid var(--line)" data-link="${esc(l.id)}"><div><label>Name</label><input data-lf="label" value="${esc(l.label||"")}"></div><div><label>Link</label><input data-lf="url" value="${esc(l.url||"")}" placeholder="https://app.smartsheet.com/…"></div><div class="slrow"><button class="pbtn main" data-lk="save">💾 Save</button><button class="pbtn" data-lk="cancel">Cancel</button><button class="pbtn danger" data-lk="del">🗑️ Delete</button></div></div>`
    :`<div class="linkrow" data-q="${esc((l.label+" "+(l.url||"")+" "+(l.note||"")).toLowerCase())}" data-link="${esc(l.id)}"><div><div class="what">${esc(l.label)}</div>${l.url?"":`<div class="miss">No link yet — tap ✏️ to paste it</div>`}${l.note?`<div class="src">${esc(l.note)}</div>`:""}</div><div class="slrow">${l.url?`<a class="pbtn main" href="${esc(l.url)}" target="_blank" rel="noopener">Open ↗</a><button class="cpy" style="grid-row:auto" data-copy="${esc(l.url)}">📋</button>`:""}<button class="pbtn" data-lk="edit">✏️</button></div></div>`).join("")}
   <div class="slrow" style="margin-top:8px"><button class="pbtn" data-lk="add">➕ Add a link</button></div></section>`;
}
document.addEventListener("click",async e=>{
  if(S.view!=="ref") return; const b=e.target.closest("[data-lk]"); if(!b) return;
  const act=b.dataset.lk;
  if(act==="add"){ try{ const r=await lcol().add({label:"New link",url:"",order:99,createdAt:new Date().toISOString()}); S.linkEdit=r.id; renderList(); }catch(err){ writeErr(err); } return; }
  const row=b.closest("[data-link]"); const id=row&&row.dataset.link; if(!id) return;
  if(act==="edit"){ S.linkEdit=id; renderList(); return; }
  if(act==="cancel"){ S.linkEdit=null; renderList(); return; }
  if(act==="save"){ const v=k=>row.querySelector(`[data-lf="${k}"]`).value.trim(); try{ await lcol().doc(id).update({label:v("label")||"Link",url:v("url")}); S.linkEdit=null; toast("💾 Link saved"); }catch(err){ writeErr(err); } return; }
  if(act==="del"){ try{ await lcol().doc(id).delete(); S.linkEdit=null; toast("🗑️ Link removed"); }catch(err){ writeErr(err); } }
});

