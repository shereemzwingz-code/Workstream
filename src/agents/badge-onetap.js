// ---- One-tap badge (Oct 13 2026): from the partner hub, one tap runs the whole badge:
// Canva badge (name, org, next Agent ID) → their headshot found in Outlook, background cut out, placed →
// the partner's logo (saved once, reused) placed → print-ready PNG → status "Made" (ready for the Badgy).
// If email has more than one possible photo, it stops on that step and asks you to pick — never guesses.
S.bt={}; // badge id -> {step, msg, need}
const BT_STEPS=[["canva","Badge in Canva"],["photo","Photo"],["logo","Logo"],["png","Ready to print"]];
function btDone(bd,k){ if(k==="canva") return !!bd.canvaId; if(k==="photo") return !!bd.photoAsset; if(k==="logo") return !!bd.logoAsset; if(k==="png") return bd.status==="Made"||bd.status==="Given"; return false; }
function btSay(bd,step,msg,need){ S.bt[bd.id]={step,msg,need:!!need}; const el=document.querySelector(`[data-btmsg="${CSS.escape(bd.id)}"]`); if(el) el.textContent=msg; }
async function btFresh(bd){ try{ const d=await bgcol().doc(bd.id).get(); const x=d&&(typeof d.data==="function"?d.data():null); return x?{...bd,...x,id:bd.id}:bd; }catch(_){ return (S.badges||[]).find(b=>b.id===bd.id)||bd; } }
// Find exactly one image in email for this person/org; return it, or the reason we need her to pick.
async function btFindImage(bd,kind){
  const first=String(bd.name||"").split(/\s+/)[0];
  const terms=kind==="photo"?[bd.name+" headshot",bd.name+" photo",bd.name,first+" headshot"]:[bd.org+" logo","logo "+bd.org,bd.org];
  const imgs=await mailImages(terms,kind);
  if(!imgs.length) return {why:`No ${kind==="photo"?"headshot for "+bd.name:"logo for "+bd.org} in your email yet. Ask them to send a .jpg or .png.`};
  const words=String(kind==="photo"?bd.name:bd.org||"").toLowerCase().split(/\s+/).filter(w=>w.length>2);
  const named=imgs.filter(x=>words.some(w=>String(x.name).toLowerCase().includes(w)));
  const one=named.length===1?named[0]:imgs.length===1?imgs[0]:null;
  return one?{img:one}:{why:`Found ${imgs.length} possible ${kind==="photo"?"photos":"logos"} — tap Pick to choose.`,pick:true};
}
async function badgeOneTap(bd){
  if(!S.mcp){ btSay(bd,"canva","Needs Canva, Google Drive and Microsoft 365 allowed for this page (Permissions menu).",true); renderList(); return; }
  if(S.btBusy) return; S.btBusy=bd.id;
  try{
    if(!bd.canvaId){ btSay(bd,"canva","🪄 Making the badge in Canva…"); await badgeCanva(bd,null); bd=await btFresh(bd); if(!bd.canvaId) throw {message:"Canva didn't make the badge — the message above says why"}; }
    if(!bd.photoAsset){ btSay(bd,"photo","📧 Looking for their headshot in your email…"); const f=await btFindImage(bd,"photo");
      if(f.why){ btSay(bd,"photo",f.why,true); return; }
      btSay(bd,"photo","✂️ Cutting out the background and placing the photo…"); await badgeAddImage(bd,"photo",{b64:null,uri:f.img.uri,mime:f.img.mime,name:f.img.name},null); bd=await btFresh(bd);
      if(!bd.photoAsset) throw {message:"the photo didn't land on the badge"}; }
    if(!bd.logoAsset){ const saved=partnerLogoAsset(bd.org);
      if(saved){ btSay(bd,"logo","🏢 Placing their saved logo…"); await badgePlace(bd,"logo",saved); await bgcol().doc(bd.id).update({logoAsset:saved,logoAt:new Date().toISOString()}); }
      else { btSay(bd,"logo","📧 Looking for their logo in your email…"); const f=await btFindImage(bd,"logo");
        if(f.why){ btSay(bd,"logo",f.why,true); return; }
        btSay(bd,"logo","🏢 Placing the logo…"); await badgeAddImage(bd,"logo",{b64:null,uri:f.img.uri,mime:f.img.mime,name:f.img.name},null); }
      bd=await btFresh(bd); if(!bd.logoAsset) throw {message:"the logo didn't land on the badge"}; }
    btSay(bd,"png","🖨️ Exporting the print-ready PNG…"); await badgePng(bd,null); bd=await btFresh(bd);
    btSay(bd,"png","✓ Ready to print on the Badgy. Mark it Given after you hand it over.");
    agLog("One-tap badge ready: "+bd.name,{act:"badge",ref:bd.id});
  }catch(err){ btSay(bd,(S.bt[bd.id]||{}).step||"canva","⚠️ Stopped: "+((err&&err.message)||"try again")+". Tap again to pick up where it stopped.",true);
    agLog("One-tap badge stopped for "+bd.name+": "+((err&&err.message)||""),{act:"error",ref:bd.id}); }
  finally{ S.btBusy=null; renderList(); }
}
function btRowHTML(bd){ const st=S.bt[bd.id]; const allDone=BT_STEPS.every(([k])=>btDone(bd,k));
  return `<div class="hrow" style="display:grid;gap:6px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="t">${esc(bd.name)}<small>Designee badge${bd.agentId?" · Agent ID #"+String(bd.agentId).padStart(4,"0"):""}${bd.status==="Given"?" · given":""}</small></span>
      ${allDone?(bd.canvaUrl?`<a class="mini" href="${esc(bd.canvaUrl)}" target="_blank" rel="noopener">Open in Canva</a>`:""):`<button class="pbtn main" data-btgo="${esc(bd.id)}"${S.btBusy?" disabled":""}>${S.btBusy===bd.id?"⏳ Working…":"🪪 "+(btDone(bd,"canva")?"Finish badge":"Make badge")}</button>`}
      ${st&&st.need&&/Pick/.test(st.msg)?`<button class="pbtn" data-btpick="${esc(bd.id)}" data-k="${esc(st.step)}">Pick ${st.step==="photo"?"photo":"logo"}</button>`:""}</div>
    <span class="hsteps">${BT_STEPS.map(([k,l])=>`<i class="${btDone(bd,k)?"on":""}">${btDone(bd,k)?"✓ ":""}${l}</i>`).join("")}</span>
    <span class="hempty" data-btmsg="${esc(bd.id)}" role="status" aria-live="polite">${st?esc(st.msg):""}</span></div>`; }
document.addEventListener("click",async e=>{ if(S.view!=="partners"||!S.hub) return;
  const g=e.target.closest("[data-btgo]"); if(g){ const bd=(S.badges||[]).find(b=>b.id===g.dataset.btgo); if(bd) badgeOneTap(bd); return; }
  const pk=e.target.closest("[data-btpick]"); if(pk){ const bd=(S.badges||[]).find(b=>b.id===pk.dataset.btpick); if(bd) badgeFromEmail(bd,pk.dataset.k,pk); return; }
  const add=e.target.closest("[data-btadd]"); if(add){ const inp=document.querySelector("[data-btname]"); const name=(inp&&inp.value||"").trim(); if(!name){ inp&&inp.focus(); toast("Type the designee's name first"); return; }
    const p=(S.partners||[]).find(x=>x.id===S.hub); if(!p) return; const org=String(p.org||p.name).trim();
    try{ const ref=await bgcol().add({name,org,pid:p.id,status:"Needed",createdAt:new Date().toISOString()}); inp.value=""; toast("🪪 "+name+" added — making the badge");
      await pcol().doc(p.id).update({history:[...(p.history||[]),{at:new Date().toISOString(),text:"🪪 Designee added for a badge: "+name,changes:{}}].slice(-60)});
      if(ref&&ref.id) badgeOneTap({id:ref.id,name,org,pid:p.id,status:"Needed"}); }
    catch(err){ toast("⚠️ Couldn't add the designee — "+((err&&err.message)||"try again")); } }
});
