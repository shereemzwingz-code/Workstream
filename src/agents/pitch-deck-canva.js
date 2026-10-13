// ---- Canva: copy All Deck and fill the partner's blanks (cover, enrollment link, contact line)
const CANVA="Canva", CANVA_TPL="DAHXpH_Y-zk";   // "All Deck" — every slide variation; the deck tool picks from it
// Each slide is pinned to its Canva page ID. The page NUMBER is looked up fresh every time a deck is built,
// so moving slides around in the All Deck can't make the Workstream pull the wrong slide again.
const DK_PAGE_IDS={1:"PBW7PRtHnKJMQGvN",2:"PB5Ll6pbHhk70vNS",3:"PBt40464HWbytRGv",4:"PBCBQJvlZyCGqwVq",5:"PBJ9wvFW1440VYcp",6:"PB94BkdjvvpV8FqX",7:"PBtpSWbHgHr8QyTv",8:"PB40YYNvFFFdkw9X",9:"PBPdQ15DZDhzWLqx",10:"PBX79ky6qh1l7NMy",11:"PBjDkvyLj7zDjj6r",12:"PBTny3lQDJsW6ntG",13:"PBybbhY3GXNmlx76",14:"PBXGzq5gSlYZnxyS",15:"PBzN5x9dZF5PwVG1",16:"PBW9Yk8S0knHc9dB",17:"PB9rFkQ5lGFRShfm",18:"PBV4pBgH1Sx12gNY",19:"PBFMvHnWHq6S1ldt",20:"PBBWL1fbnykY0ZcG",21:"PBNLTGBCCw9FK9pY",22:"PBlqtL1TNcG6tlbm",23:"PBjJvQ5fYQ6rw4Lg",24:"PBHFvBhd2hVtWklR",25:"PBKj363HnSdhD6SL",26:"PB5ck5kRV0GwKMyQ"};
const DK_SLIDES=[[1,"Cover"],[2,"Who is Dimension"],[3,"What is community solar"],[4,"How projects work"],[5,"How bill credits work"],[6,"Read your bill"],[7,"Where the savings show up (Ameren bill)"],[8,"Illinois Shines protections"],[9,"How to sign up"],[10,"Common questions"],[11,"Organizations we support"],[12,"Sign up today + contact"],[13,"Grant program & budget 💰"],[14,"Savings over 25 years 📈"],[15,"Your project ☀️"],[16,"Workforce development 🔧"],[17,"STEM education 🔬"],[18,"Field trips & speaking 🚌"],[19,"Initiatives we support 🤲"],[20,"Dimension in the news 📰"],[21,"A household's yearly savings 🏠"],[22,"Working with Dimension 🤝"],[23,"How to enroll (step by step) 📝"],[24,"Sample marketing / flier 🗞️"],[25,"Proposed next steps ✅"],[26,"Executive summary 📋"]];
const DK_ORDER=[1,26,2,20,3,4,5,21,6,7,8,9,10,11,12,13,14,15,16,17,18,19,22,23,24,25];  // the All Deck's page order, so the checklist reads like the deck
async function dkResolve(keys){ // slide keys -> the All Deck's current page numbers, in deck order
  const r=mcpPayload(await S.mcp.callTool(CANVA,"read-design",{design_id:CANVA_TPL,filter:{fields:["page_metadata"]},user_intent:"Look up where each slide sits in the All Deck right now"},{cache:false}));
  const pm=r.page_metadata||[], at={}; pm.forEach(x=>{ at[x.id]=x.page_number||x.index; });
  const gone=keys.filter(k=>!at[DK_PAGE_IDS[k]]);
  if(gone.length) throw {message:"These slides aren't in the All Deck anymore: "+gone.map(k=>(DK_SLIDES.find(x=>x[0]===k)||[k,"#"+k])[1]).join(", ")+". Untick them, or tell Claude which page replaced them."};
  return [...new Set(keys.map(k=>at[DK_PAGE_IDS[k]]))].sort((a,b)=>a-b); }
const DK_PURPOSE=[["intro","🤝 Partner intro / pitch","for the org's leadership — who we are, their savings, the project, the grant",[1,26,2,3,4,5,15,21,14,13,22,20,11,12,25]],
 ["signing","✍️ MSA signing / kickoff","the day they sign — savings, project, grant, what happens next",[1,26,2,3,4,15,21,14,13,22,24,9,11,12,25]],
 ["training","🎓 Enrollment training","for their staff or designees who will enroll people",[1,3,4,5,21,6,7,8,9,23,10,12]],
 ["event","🎪 Enrollment event / tabling","resident-facing — savings, protections, how to sign up",[1,3,21,4,5,6,7,8,9,10,12]],
 ["impact","🤲 Community impact","workforce, STEM, field trips, what we've supported, press",[1,2,16,17,18,19,11,20,12]],
 ["school","🎓 School or college partner","for a district, college or CTE program — STEM, field trips, savings",[1,26,2,3,17,18,16,15,14,11,12]],
 ["custom","🧩 Custom","pick the slides yourself",[]]];
const dkPurpose=d=>DK_PURPOSE.find(x=>x[0]===(d.purpose||"intro"))||DK_PURPOSE[0];
function dkPages(d){ const raw=String(d.pages||"").split(",").map(x=>+x).filter(x=>x>=1&&x<=DK_SLIDES.length); if(d.purpose==="custom"||(d.pages&&raw.length)) return [...new Set(raw)].sort((a,b)=>a-b); return dkPurpose(d)[3]; }
const mcpPayload=r=>{ let p=r&&(r.payload??r); if(typeof p==="string"){ try{ p=JSON.parse(p); }catch(_){ } } if(p&&typeof p==="object"&&!Array.isArray(p)) return p; const o=resultObjs(r); return o[0]||{}; };
S.me=(()=>{ try{ return JSON.parse(localStorage.getItem("ws.me")||"{}"); }catch(_){ return {}; } })();
const BUDGET_TPL="DAHXv3LERkI";   // "Budget" deck — the grant program slide, filled from the partner's 💰 Budget
async function deckCanva(p,d,opts){ opts=opts||{}; const TPL=opts.template||CANVA_TPL;
  if(!S.mcp){ S.dkMsg={id:p.id,err:true,html:"Making decks needs the Canva connector and this page opened in claude.ai or the Claude app."}; renderList(); return; }
  if(S.dkBusy) return;
  const org=(d.name||String(p.org||"").replace(/\s*\(.*?\)\s*/g," ").trim()||p.name||"").trim(), pu=dkPurpose(d), pages=opts.pages||dkPages(d), title=opts.title?`${org} x Dimension — ${opts.title}`:`${org} x Dimension — ${pu[0]==="custom"?"Community Solar":pu[1].replace(/^\S+\s/,"")}`;
  if(!pages.length){ S.dkMsg={id:p.id,err:true,html:"Pick at least one slide."}; renderList(); return; }
  const date=d.date||new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  if(d.myPhone||d.myEmail){ S.me={phone:d.myPhone||S.me.phone||"",email:d.myEmail||S.me.email||""}; try{ localStorage.setItem("ws.me",JSON.stringify(S.me)); }catch(_){} }
  const phone=d.myPhone||S.me.phone||"(773) 322-2694", email=d.myEmail||S.me.email||"staylor@dimension-energy.com", link=(d.link||p.utmLink||"").trim();
  const rep={"[Event name]":org,"[Date]":date,"[Your name]":"Sheree Taylor","[Partner]":org}; if(link) rep["[enrollment link]"]=link; if(phone) rep["[phone]"]=phone; if(email) rep["[email]"]=email;
  const sv=savOf(p), sr=savCalc(sv); const num=n=>Math.round(n).toLocaleString();
  if(pages.includes(14)||pages.includes(15)||opts.sav){ Object.assign(rep,{"[pct]":sv.disc+"%","[discount]":sv.disc+"%","[yr1]":money(sr.yr1),"[life]":money(sr.life),"[years]":String(sv.years),"[kwh]":num(sv.kwh),"[allocation]":num(sv.kwh),"[escalator]":sv.esc+"%","[start]":sv.start||"",
    "[project name]":sv.pname||(d.project||""),"[project address]":sv.paddr||(d.addr||""),"[kw]":sv.pkw?num(sv.pkw):"","[utility]":sv.putil||""}); }
  if(opts.budget||pages.includes(13)){ const b=budgetOf(p), r=bCalc(b); Object.assign(rep,{"[grant]":money(b.G),"[per enroll]":money(b.F1),"[per enrollment detail]":`${money(b.F1)} each for the first ${b.T1} enrollments, then ${money(b.F2)} each`,"[bonus]":money(b.B1),"[milestone detail]":`${money(b.B1)} at ${b.TB1} enrollments and ${money(b.B2)} at ${b.TB2}`,"[staff]":money(r.sal),"[staff detail]":`$${b.wage}/hr × ${b.hours} hrs/wk × ${b.weeks} weeks for an enrollment lead`,"[total]":money(r.total),"[enrollments]":String(r.N)}); }
  S.dkBusy=p.id; S.dkMsg={id:p.id,err:false,html:"🪄 Copying the Canva template and filling in "+esc(org)+"…"}; renderList();
  let deckId=null, tx=null;
  try{
    const ref=scol().doc(); deckId=ref.id;
    await ref.set({name:title,partner:org,partnerId:p.id,template:false,kind:opts.budget?"budget":"final",madeFrom:"canva",purpose:opts.budget?"budget":pu[0],pages:pages.join(","),status:"running",url:"",createdAt:new Date().toISOString()});
    const nums=TPL===CANVA_TPL?await dkResolve(pages):pages;
    const c=mcpPayload(await S.mcp.callTool(CANVA,"copy-design",{design_id:TPL,page_numbers:nums,user_intent:"Make the "+org+" "+pu[1].replace(/^\S+\s/,"")+" deck from All Deck ("+pages.length+" slides)"},{cache:false}));
    const des=c.design||c; const id=des.id; if(!id) throw {message:"Canva didn't return the new design."};
    const url=(des.urls&&des.urls.edit_url)||("https://www.canva.com/design/"+id+"/edit");
    const rd=mcpPayload(await S.mcp.callTool(CANVA,"read-design",{design_id:id,open_transaction:true,filter:{fields:["design_content"]},user_intent:"Find the placeholder text to fill for "+org},{cache:false}));
    tx=rd.transaction&&rd.transaction.transaction_id; const pgs=(rd.design_content&&rd.design_content.pages)||[]; if(!tx) throw {message:"Canva didn't open an edit session."};
    let n=0, first=true;
    for(let i=0;i<pgs.length;i++){ const pg=pgs[i]; const ops=[]; if(first){ ops.push({type:"update_title",title}); first=false; }
      (pg.elements||[]).forEach(el=>{ if(el.type!=="text") return; const txt=(el.textRegions||[]).map(r=>r.characters||"").join("");
        const ks=Object.keys(rep).filter(k=>txt.includes(k)); ks.filter(k=>!ks.some(o=>o!==k&&o.includes(k))).forEach(k=>ops.push({type:"find_and_replace_text",locator_id:el.locator_id,find_text:k,replace_text:rep[k]})); });
      if(ops.length){ await S.mcp.callTool(CANVA,"edit-design",{transaction_id:tx,page_index:i+1,finalize:"keep_open",operations:ops,user_intent:"Fill "+org+" into the deck"},{cache:false}); n+=ops.length; } }
    // project photo into the photo box (slide 14) and bar heights (slide 13) when the escalator isn't the template's 3%
    for(let i=0;i<pgs.length;i++){ const pg=pgs[i], els=pg.elements||[]; const ops=[];
      const ph=els.find(e=>e.type==="text"&&(e.textRegions||[]).map(r=>r.characters||"").join("").includes("[project photo]"));
      if(ph){ if(sv.photoAsset){ const box=els.find(e=>e.type==="shape"&&Math.abs((e.width||0)-824)<3&&Math.abs((e.height||0)-700)<3)||{top:230,left:1000,width:824,height:700}; ops.push({type:"insert_fill",page_id:pg.id,asset_type:"image",asset_id:sv.photoAsset,alt_text:(sv.pname||org)+" project photo",top:box.top+4,left:box.left+4,width:box.width-8,height:box.height-8},{type:"delete_element",locator_id:ph.locator_id}); }
        else ops.push({type:"find_and_replace_text",locator_id:ph.locator_id,find_text:"[project photo]",replace_text:"Add a project photo here"}); }
      // the circle graph: resize each slice to its real share whenever the escalator or term differs from the template's 25 years at 3%
      const colOf=e=>String((((e.paths||[])[0]||{}).fill||{}).color&&e.paths[0].fill.color.color||"").toLowerCase();
      // slices = the five 420×420 ring shapes, put in clockwise order from 12 o'clock (whatever their color)
      const angOf=e=>{ const m=String(((e.paths||[])[0]||{}).d||"").match(/M\s*([\d.\-]+)[ ,]+([\d.\-]+)/); if(!m) return 999; let a=Math.atan2(+m[1]-210,210-+m[2])*180/Math.PI; return a<0?a+360:a; };
      const ring=els.filter(e=>e.type==="shape"&&Math.abs((e.width||0)-420)<2&&Math.abs((e.height||0)-420)<2).sort((a,b)=>angOf(a)-angOf(b));
      const tx_=e=>(e.textRegions||[]).map(r=>r.characters||"").join("").trim();
      const pcts=els.filter(e=>e.type==="text"&&(e.left||0)>1400&&/^\d+%$/.test(tx_(e))).sort((a,b)=>a.top-b.top);
      if(ring.length===5&&(Math.abs(sv.esc-3)>0.01||(+sv.years||25)!==25)){
        const bl=donutBlocks(sv); let a=0;
        bl.forEach((b,k)=>{ const a1=a+b.share*360;
          ops.push({type:"replace_shape",locator_id:ring[k].locator_id,path:donutSeg(a+1.25,a1-1.25,420,205,128),view_box_width:420,view_box_height:420});
          a=a1; });
        if(pcts.length===5) bl.forEach((b,k)=>{ const was=(pcts[k].textRegions||[]).map(r=>r.characters||"").join("").trim(), now=Math.round(b.share*100)+"%";
          if(was&&was!==now) ops.push({type:"find_and_replace_text",locator_id:pcts[k].locator_id,find_text:was,replace_text:now}); });
        const labs=els.filter(e=>e.type==="text"&&/^Years \d+\s*[\u2013-]\s*\d+$/.test(tx_(e))).sort((a2,b2)=>a2.top-b2.top);
        if(labs.length===5) bl.forEach((b,k)=>{ const was=(labs[k].textRegions||[]).map(r=>r.characters||"").join("").trim(), now="Years "+b.from+"\u2013"+b.to;
          if(was&&was!==now) ops.push({type:"find_and_replace_text",locator_id:labs[k].locator_id,find_text:was,replace_text:now}); });
      }
      if(ops.length){ try{ await S.mcp.callTool(CANVA,"edit-design",{transaction_id:tx,page_index:i+1,finalize:"keep_open",operations:ops,user_intent:"Place the project photo / fit the savings chart for "+org},{cache:false}); n+=ops.length; }catch(_){ } } }
    let qrDone=0, qrNote="";
    if(link&&!opts.budget){ try{ S.dkMsg={id:p.id,err:false,html:"🔲 Making the QR code for the sign-up slides…"}; renderList();
        const qf=await qrPngFile(link,safeName(org)+"_deck_QR.png"); const dsh=await driveShare(qf,org+" — deck QR.png"); const asset=await canvaImport(dsh.url,org+" deck QR");
        for(let i=0;i<pgs.length;i++){ const pg=pgs[i]; const el=(pg.elements||[]).find(e=>e.type==="text"&&(e.textRegions||[]).map(r=>r.characters||"").join("").includes("[QR code]")); if(!el) continue;
          const size=Math.round(((pg.dimensions&&pg.dimensions.height)||1080)*0.195), cx=(el.left||0)+(el.width||0)/2, cy=(el.top||0)+(el.height||0)/2; const ops=[{type:"insert_fill",page_id:pg.id,asset_type:"image",asset_id:asset,alt_text:"QR code — "+link,top:Math.round(cy-size/2),left:Math.round(cx-size/2),width:size,height:size},{type:"delete_element",locator_id:el.locator_id}];
          await S.mcp.callTool(CANVA,"edit-design",{transaction_id:tx,page_index:i+1,finalize:"keep_open",operations:ops,user_intent:"Place the sign-up QR code on the "+org+" deck"},{cache:false}); qrDone++; } }
      catch(qe){ qrNote=" QR code skipped — "+((qe&&qe.message)||"allow Google Drive + Canva and try again")+"."; } }
    await S.mcp.callTool(CANVA,"edit-design",{transaction_id:tx,finalize:"commit",user_intent:"Save the "+org+" deck"},{cache:false}); tx=null;
    await scol().doc(deckId).update({url,status:"done",canvaId:id});
    try{ kCheer("deck"); }catch(_){ }
    try{ if(opts.sav) await pcol().doc(p.id).update({savDeckUrl:url,history:pHist(p,"Savings/project slide made in Canva: "+url)}); else if(opts.budget) await pcol().doc(p.id).update({budgetDeckUrl:url,history:pHist(p,"Budget slide made in Canva: "+url)}); else await pcol().doc(p.id).update({deckUrl:url,deck:{...(p.deck||{}),...d},history:pHist(p,"Deck made in Canva from All Deck: "+url)}); }catch(_){ }
    const left=["[enrollment link]","[phone]","[email]"].filter(k=>!rep[k]); if(link&&!qrDone) left.push("[QR code]");
    S.dkMsg={id:p.id,err:false,html:`✅ Done — ${pages.length} slides, ${n} blank${n===1?"":"s"} filled${qrDone?`, QR code on ${qrDone} slide${qrDone===1?"":"s"}`:""}. <a href="${esc(url)}" target="_blank" rel="noopener">Open ${esc(title)} in Canva ↗</a>${left.length?`<br>Still to add in Canva: ${esc(left.join(", "))} — ${link?"":"make their UTM link first and the link + QR fill next time."}`:""}${esc(qrNote)}`}; toast("📊 Deck ready in Canva");
    try{ agLog("Made the Canva deck for "+org,{act:"deck",ref:p.id}); }catch(_){ }
  }catch(e){ if(tx){ try{ await S.mcp.callTool(CANVA,"edit-design",{transaction_id:tx,finalize:"cancel",user_intent:"Discard the unfinished edit"},{cache:false}); }catch(_){ } }
    const code=e&&e.code; S.dkMsg={id:p.id,err:true,html:esc(code==="server_not_connected"?"Add the Canva connector in claude.ai → Settings → Connectors, then reload.":code==="needs_reauth"?"Canva needs reconnecting: claude.ai → Settings → Connectors → Canva.":code==="not_in_manifest"||code==="not_granted"||code==="blocked_by_policy"?"Allow Canva for this page from the Permissions menu, then try again.":(e&&e.message)||"Canva couldn't finish the deck.")};
    if(deckId){ try{ await scol().doc(deckId).update({status:"done"}); }catch(_){ } } }
  finally{ S.dkBusy=null; renderList(); } }
async function deckAct(act,p,card){
  if(!["dkdl","dkdrive","dksave","dkgamma","dkcanva"].includes(act)) return false;
  const d=readDeck(card); const was={...Object.fromEntries(DK_F.map(([k])=>[k,""])),offers:DK_OFF_DEF,purpose:"intro",pages:"",...(p.deck||{})}; const changed=Object.keys(d).some(k=>String(d[k]??"")!==String(was[k]??""));
  if(changed){ try{ await pcol().doc(p.id).update({deck:d,history:pHist(p,"Pitch deck details updated")}); }catch(_){ } }
  if(act==="dksave"){ toast(changed?"💾 Deck details saved":"No changes"); return true; }
  if(act==="dkcanva"){ await deckCanva(p,d); return true; }
  if(act==="dkgamma"){ if(!S.mcp){ S.dkMsg={id:p.id,err:true,html:"Making decks needs the Gamma connector and this page opened in claude.ai or the Claude app."}; renderList(); return true; }
    if(S.dkBusy) return true;
    if(!offersOf(d).length){ S.dkMsg={id:p.id,err:true,html:"Pick at least one thing we're proposing first."}; renderList(); return true; }
    const r=deckValues(p,d), nm=r.vals["Partner Name"], title=`${nm} x Dimension`;
    S.dkBusy=p.id; S.dkMsg={id:p.id,err:false,html:"🪄 Gamma is building the deck (about 1–3 minutes)…"}; renderList();
    let deckId=null;
    try{ const ref=scol().doc(); deckId=ref.id;
      await ref.set({name:title,partner:nm,partnerId:p.id,template:false,kind:"final",madeFrom:"pitch",status:"running",url:"",createdAt:new Date().toISOString()});
      const res=await S.mcp.callTool(GAMMA,"generate_from_template",{gammaId:gsTplId(),prompt:gsPrompt(r.vals,r.hideFacility,d),title},{cache:false});
      const pl=res.payload??res; let url=findUrl(pl); const gen=url?"":findGen(pl); const t0=Date.now();
      while(!url&&gen&&Date.now()-t0<300000){ await new Promise(z=>setTimeout(z,6000+Math.random()*2000));
        let st; try{ st=await S.mcp.callTool(GAMMA,"get_generation_status",{generationId:gen},{cache:false}); }catch(e){ if(e&&e.retryable) continue; throw e; }
        const q=st.payload??st; url=findUrl(q); if(findStatus(q)==="failed") throw {message:"Gamma reported the generation failed."}; }
      await scol().doc(deckId).update({url,status:"done"});
      if(url){ try{ await pcol().doc(p.id).update({deckUrl:url,history:pHist(p,"Pitch deck made in Gamma: "+url)}); }catch(_){ }
        S.dkMsg={id:p.id,err:false,html:`✅ Done! <a href="${esc(url)}" target="_blank" rel="noopener">Open ${esc(title)} ↗</a>`}; toast("📊 Deck ready"); }
      else S.dkMsg={id:p.id,err:false,html:`Gamma is still working. It will show up in your Gamma home as “${esc(title)}”.`};
    }catch(e){ S.dkMsg={id:p.id,err:true,html:esc(e&&e.code?mcpMsg(e):(e&&e.message)||"Couldn't make the deck")}; if(deckId){ try{ await scol().doc(deckId).update({status:"done"}); }catch(_){ } } }
    finally{ S.dkBusy=null; renderList(); }
    return true; }
  if(act==="dkdl"){ if(!S.dl){ toast("Download isn't available here"); return true; }
    try{ const u8=await deckBytes(p,d); await S.dl.save({filename:deckFile(p,d),data:u8}); toast("📊 Deck ready"); }catch(e){ if(e?.code!=="declined") toast(e&&e.message?e.message:"Couldn't build the deck"); } return true; }
  if(act==="dkdrive"){ if(!S.mcp){ S.dkMsg={id:p.id,err:true,html:"Connect Microsoft 365 in claude.ai → Settings → Connectors, then reload."}; renderList(); return true; }
    S.dkMsg={id:p.id,err:false,html:"Saving…"}; renderList();
    try{ const name=safeName(deckValues(p,d).vals["Partner Name"]); const folderId=await bqEnsureFolder(name); const u8=await deckBytes(p,d);
      const r=await S.mcp.callTool(M365,"sharepoint_upload_file",{driveId:PB_DRIVE,parentItemId:folderId,filename:deckFile(p,d),contentBase64:toB64(u8),conflictBehavior:"rename"},{cache:false});
      const url=pickStr(r,/"webUrl"\s*:\s*"([^"]+)"/);
      S.dkMsg={id:p.id,err:false,html:`✅ Saved to OneDrive › Partner Budgets › ${esc(name)}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">Open in PowerPoint</a>`:""}`};
      try{ await pcol().doc(p.id).update({history:pHist(p,"Pitch deck saved to OneDrive"+(url?": "+url:""))}); }catch(_){ }
    }catch(e){ S.dkMsg={id:p.id,err:true,html:e&&e.code==="needs_reauth"?"Microsoft 365 needs reconnecting: claude.ai → Settings → Connectors.":"Couldn't save to OneDrive: "+esc(e&&e.message||"try again")}; }
    renderList(); return true; }
  return false; }
