// ---- Partner kit: Budget → MSA → Slide for partners you flag
const KIT=[["budget","💰","Budget"],["msa","📝","MSA"],["deck","📊","Slide"]];
// Three kits, built from how Sheree actually runs them (SOW §5.1c, the ABP designee SOP, and her ambassador welcome emails)
const AMB_FORM="https://app.smartsheet.com/b/form/019f852e238679f1b3540c8ed1d856f1";
const KITS={
 partner:{ic:"💰",name:"Partner kit",sub:"Budget → MSA → Slide",done:"💗 Kit complete: send it to CP for review.",steps:[
   ["budget","💰","Budget","panel:budget","Fills the MSA numbers"],["msa","📝","MSA","panel:msa","Fills the slide"],["deck","📊","Slide","panel:deck","Canva deck for the signing"]]},
 designee:{ic:"🪪",name:"Designee enrollment kit",sub:"Train → materials → portal → ABP → badges",done:"💗 Designee kit complete — they can enroll people.",steps:[
   ["train","🎓","Training done","","Consumer Protection + enrollment training (CP Handbook)"],
   ["kdeck","📊","Training deck","panel:deck","Canva deck — pick 🎓 Enrollment training"],
   ["flyer","📄","Flyer: their name + QR","flyer:canva","Canva copy of the ambassador flyer with their name, number, link and QR"],
   ["faq","☀️","How solar works + FAQ","url:https://claude.ai/artifact/HEtaeYf3CFWEwzwVi8JNQj","Send the explainer"],
   ["bill","⚡","Bill guide","url:https://claude.ai/artifact/9AwYkz3yUn1pjZPhzKML6U","Understanding your bill"],
   ["landing","🔗","Landing page link + QR","tool:utm","Co-branded enrollment link, tracked"],
   ["portal","🖥️","Portal access","","Enrollment portal login for their team"],
   ["abp","📋","ABP registration","panel:abp","Registration form → Company form → MES plan → Elena"],
   ["badges","🪪","Badges: Canva → Badgy → shipped","view:badges","🎨 Make in Canva on the Badges tab, add logo + photo, 🖨️ PNG, print, ship"]]},
 ambassador:{ic:"🦋",name:"Community Ambassador kit",sub:"Sign-up → call → link → welcome → mail",done:"💗 Ambassador is fully set up. Check in at 2 weeks.",steps:[
   ["form","📝","Signed up (form)","url:"+AMB_FORM,"Smartsheet sign-up form"],
   ["call","📞","Onboarding call","","30-min Teams: overview + link set-up"],
   ["link","🔗","Personal link + QR code","tool:utm","source ambassador · medium referral · content = their initials"],
   ["flyer","📄","Flyer with THEIR name + QR","flyer:canva","Agent makes it in Canva: name, number, link, QR of their tracked link"],
   ["welcome","✉️","Welcome email","draft:welcome","Link + QR, how solar works, IL Shines info, sample bill"],
   ["mail","📦","Printed resources mailed","","Send tracking info"],
   ["check","💬","2-week check-in","","How are referrals going? Any questions on savings?"]]}};
const kitType=p=>KITS[p.kitType]?p.kitType:"partner";
const kitSteps=p=>KITS[kitType(p)].steps;
function kitHas(p,k){ if(k==="budget") return !!(p.budget&&(p.budget.savedAt||p.budget.total||p.budget.fileUrl)); if(k==="msa") return !!(p.msa&&p.msa.savedAt); if(k==="deck"||k==="kdeck") return !!p.deckUrl; if(k==="flyer"&&p.flyerUrl) return true;
  if(k==="abp"){ try{ return ABP_STEPS.slice(0,5).every(s=>(p.abp||{})[s[0]]); }catch(_){ return false; } } return !!(p.kit&&p.kit[k]); }
function kitTotal(p){ return kitSteps(p).length; }
function kitDone(p){ return kitSteps(p).filter(([k])=>kitHas(p,k)).length; }
function kitLeft(p){ return kitTotal(p)-kitDone(p); }
function kitNext(p){ const n=kitSteps(p).find(([k])=>!kitHas(p,k)); return n?n[0]:""; }
function kitStep(k,p){ const list=p?kitSteps(p):Object.values(KITS).flatMap(x=>x.steps); return list.find(y=>y[0]===k); }
function kitLabel(k,p){ const x=kitStep(k,p); return x?x[1]+" "+x[2]:""; }
function kitChips(p){ const st=kitSteps(p); const show=st.length>4?st.filter(([k])=>!kitHas(p,k)).slice(0,3):st; return `<span class="kit"><i class="ok" style="opacity:.9">${KITS[kitType(p)].ic} ${kitDone(p)}/${kitTotal(p)}</i>${show.map(([k,ic,l])=>`<i class="${kitHas(p,k)?"ok":""}">${ic} ${l}${kitHas(p,k)?" ✓":""}</i>`).join("")}</span>`; }
function pFlowHTML(p){ const K=KITS[kitType(p)], nx=kitNext(p); const color=kitType(p)==="partner"?"#E09A1F":kitType(p)==="designee"?"#D63384":"#7FB2E5";
  const stage=p.stage||"To email", sIdx=["To email","Emailed","Call set","Active partner"].indexOf(stage), n=SSN(p);
  const node=(l,st,act,title)=>`<button class="fn ${st}" ${act?`data-pact="${act}"`:""} title="${esc(title||l)}"><span class="c">${st==="hot"?"●":st==="done"?"✓":"○"}</span><span class="l">${esc(l)}</span></button>`;
  return `<div class="flow pflow" style="--fc:${color};margin:8px 0 10px"><h3><span aria-hidden="true">🧭</span>${esc(p.org||p.name)} · where this partner is<span class="tot">${kitDone(p)}/${kitTotal(p)} kit · ${n?esc(SSHORT[n-1]):"no status"}</span></h3>
   <div class="fnodes">${["To email","Emailed","Call set","Active partner"].map((l,i)=>node(l,i<sIdx?"done":i===sIdx?"hot":"zero","","Outreach: "+l)).join("")}<span class="fsep" aria-hidden="true">▸</span>${K.steps.map(([k,ic,l])=>{ const ok=kitHas(p,k); return node(ic+" "+l.replace(/ \(.*\)$/,""),ok?"done":k===nx?"hot":"zero","kitact",K.name+": "+l).replace('data-pact="kitact"',`data-pact="kitact" data-v="${k}"`); }).join("")}${n===6?node("Signed","done","","Signed"):""}</div></div>`; }
function kitLink(p,k){ if(k==="deck"||k==="kdeck") return p.deckUrl||""; if(k==="flyer") return p.flyerUrl||""; if(k==="landing"||k==="link") return p.utmLink||""; return ""; }
function kitBarHTML(p){ const on=!!p.needsKit, K=KITS[kitType(p)];
  return `<div class="kitbar"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span class="crmk" style="margin:0">📁 ${on?esc(K.name)+" · "+kitDone(p)+"/"+kitTotal(p)+" done":"Kit folder"}</span><button class="ktog" data-pact="kit" aria-pressed="${on}"><span class="sw" aria-hidden="true"></span>${on?"Needs kit":"Not needed"}</button></div>
   ${on?`${pFlowHTML(p)}<div class="ktypes" role="group" aria-label="Kit type">${Object.entries(KITS).map(([k,x])=>`<button class="qbtn${kitType(p)===k?" p":""}" data-pact="kittype" data-v="${k}" aria-pressed="${kitType(p)===k}">${x.ic} ${esc(x.name.replace(" kit","").replace(" enrollment",""))}</button>`).join("")}</div>
   <div class="ksteps">${K.steps.map(([k,ic,l,act,why],i)=>{ const ok=kitHas(p,k), auto=["budget","msa","deck","kdeck","abp"].includes(k);
     const link=kitLink(p,k); return `<div class="kstep2${ok?" ok":""}"><button class="ktick" data-pact="${auto?"kitact":"kittick"}" data-v="${k}" aria-pressed="${ok}" title="${auto?"Opens the tool; ticks itself when saved":"Tap to tick"}">${ok?"✓":i+1}</button><div class="kt"><b>${ic} ${esc(l)}</b><span class="kst ${ok?"ok":"todo"}">${ok?"✅ Done":"⬜ Needs doing"}</span>${why&&!ok?`<span>${esc(why)}</span>`:""}</div>${link?`<a class="qbtn" href="${esc(link)}" target="_blank" rel="noopener" style="text-decoration:none">Open ↗</a>`:""}${act?`<button class="qbtn" data-pact="kitact" data-v="${k}">${act.startsWith("url:")?"Open ↗":act.startsWith("draft:")?"✍️ Draft":act==="flyer:canva"?(p.flyerUrl?"📄 Canva ↗":"📄 Make"):"Open"}</button>`:""}</div>`; }).join("")}</div>
   ${kitLeft(p)===0?`<div class="bqok y">${esc(K.done)}</div>`:`<div class="pnote">${kitDone(p)}/${kitTotal(p)} done · next: ${esc(kitLabel(kitNext(p),p))}</div>`}`:""}</div>`; }