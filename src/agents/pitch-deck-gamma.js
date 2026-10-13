// ---- Pitch deck: fill "IL Partnership Pitch Deck - TEMPLATE.pptx" ({{Tokens}}) with a partner's Budget + MSA numbers
async function fillDeck(JSZip, bytes, vals, hideFacility){
  const zip=await JSZip.loadAsync(bytes);
  const xe=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const names=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
  for(const n of names){ let x=await zip.file(n).async("string"); if(!x.includes("{{")) continue;
    if(hideFacility&&x.includes("{{Facility Annual Savings}}")) x=x.replace(/<p:sld(\s)/,'<p:sld show="0"$1');
    x=x.replace(/\{\{([^}]+)\}\}/g,(m,k)=>xe(vals[k]==null?"[____]":vals[k])); zip.file(n,x); }
  return await zip.generateAsync({type:"uint8array",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation",compression:"DEFLATE"});
}
const usd=v=>"$"+Math.round(+v||0).toLocaleString("en-US");
const numIn=v=>+String(v??"").replace(/[^\d.]/g,"")||0;
function deckValues(p,d){
  const m=p.msa||{}, b=p.budget||{}, has=k=>m["$"+k]!=null||b[k]!=null, g=k=>m["$"+k]!=null?+m["$"+k]:+(b[k]||0);
  const N=numIn(m.subs)||+b.N||0, pay={G:g("G"),F1:g("F1"),T1:g("T1")||100,F2:g("F2"),B1:g("B1"),TB1:g("TB1"),B2:g("B2"),TB2:g("TB2"),wage:g("wage"),hours:g("hours"),weeks:g("weeks")};
  const staff=pay.wage*pay.hours*pay.weeks;
  const total=pay.G+pay.F1*Math.min(N,pay.T1)+pay.F2*Math.max(N-pay.T1,0)+(N>=pay.TB1?pay.B1:0)+(N>=pay.TB2?pay.B2:0)+staff;
  const org=(d.name||String(p.org||"").replace(/\s*\(.*?\)\s*/g," ").trim()||m.cap||p.name||"").trim(), sub=numIn(d.subSave)||250, fa=numIn(d.fAnnual);
  const f25=numIn(d.f25)||(fa?Math.round(fa*36.459/1000)*1000:0);   // 25 years with a 3% credit-rate escalator
  const life=N*sub*25;
  return {ready:!!(N&&(has("G")||has("F1"))),hideFacility:!fa,vals:{
    "Partner Name":org, "Date":d.date||new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}),
    "Project Name":m.project||b.project||d.project||"[project]", "Project Address":d.addr||"",
    "Target Enrollments":N?N.toLocaleString("en-US"):"", "Upfront Grant":usd(pay.G), "Upfront After":String(numIn(m.$UA)||10),
    "Per Enrollment Fee":usd(pay.F1), "Tier 1 Count":String(pay.T1), "Step-Up Fee":usd(pay.F2),
    "Milestone 1 Payment":usd(pay.B1), "Milestone 1 Count":String(pay.TB1), "Milestone 2 Payment":usd(pay.B2), "Milestone 2 Count":String(pay.TB2),
    "Staff Wages":staff?usd(staff):"staff support", "Total Funding":usd(total),
    "Subscriber Annual Savings":usd(sub), "Subscriber Lifetime Savings":life?"~$"+(Math.round(life/10000)*10000).toLocaleString("en-US"):"",
    "Facility Annual Savings":fa?usd(fa):"", "Facility 25-Year Savings":f25?usd(f25):"", "Savings Start":d.start||"[quarter]", "Savings Basis":d.basis||"its recent utility bills",
    "Signing Grant":d.signGrant||"$2,000", "Sign-By Date":d.signBy||"[date]",
    "Facility Line":fa?`${org} can also enroll its own electricity accounts to save an estimated ${usd(fa)} per year for 25 years.`
                      :`${org} can also enroll its own electricity accounts in community solar to lower its electric bill, with no installation. Send us recent utility bills and we’ll prepare an official savings proposal.`
  }};
}


// ---- Girl Scouts–style pitch deck: copy the Girl Scouts template deck in Gamma (same design, layouts and icons) and fill in the partner
const GS_TPL_ID="g_y5sz92oswjd03n7";   // "IL Partnership Pitch Deck — TEMPLATE" (Gamma template with the Dimension logo; placeholder is [Org])
const gsTplId=()=>{ const t=S.slides.find(d=>d.id==="iltpl"); return (t&&t.apiId)||GS_TPL_ID; };
// What we're proposing to this partner: drives the executive summary, the "ways we can partner" tiles and their icons
const DK_OFFERS=[
  ["facilities","🏢","Enroll their facilities","Partner Facilities","We enroll your facilities in community solar, freeing up roughly 10% of your electricity spend for programming.","a building with solar panels on the roof"],
  ["community","🏘️","Community enrollment program","Savings for Your Community","We set up a local enrollment program that turns community solar sign-ups into support for {P} programs.","a group of houses with a heart"],
  ["events","🎤","Events & speakers","Events","We show up at your events. Dimension staff speak on clean energy careers and renewable energy.","a microphone at a podium"],
  ["stem","🔬","STEM education","STEM Education","We help build and sponsor a clean energy curriculum, so participants learn how renewable energy works.","a science flask with a badge"],
  ["workforce","👷","Workforce & careers","Workforce & Careers","We connect your community to clean energy job training and careers, including jobs outside of installation.","a hard hat with a wrench"],
  ["story","📣","Storytelling & press","Storytelling & Impact","We share the impact of our work together through joint press, social media and local giving.","a megaphone"]];
const DK_OFF_DEF="facilities,community,events,stem";
const offersOf=d=>String(d.offers??DK_OFF_DEF).split(",").filter(k=>DK_OFFERS.some(o=>o[0]===k));
const NUMW=["","One","Two","Three","Four","Five","Six"];
function execLines(v,offers,hasFunding,hideFacility,d){
  const P=v["Partner Name"], L=[];
  if(offers.includes("community")) L.push(hasFunding?`**Dimension's Community Solar Engagement and Enrollment grant** and fees for service would fund a community solar enrollment program at ${P}. **Dimension can provide a ${v["Upfront Grant"]} startup grant, ${v["Staff Wages"]} for staff wages, a payment for each enrollment, and milestone grants, totaling about ${v["Total Funding"]} for ${v["Target Enrollments"]} enrollments.**`
    :`**Dimension's Community Solar Engagement and Enrollment grant** and fees for service would fund a community solar enrollment program at ${P}, with a payment for each enrollment.`);
  if(offers.includes("facilities")) L.push(v["Facility Line"]);
  if(offers.includes("events")) L.push(`Dimension staff speak at ${P}'s events on renewable energy and clean energy careers.`);
  if(offers.includes("stem")) L.push(`Dimension sponsors clean energy curriculum and teacher training, created by our partner WeCare Solar, for the young people ${P} serves.`);
  if(offers.includes("workforce")) L.push(`Dimension connects ${P}'s community to clean energy job training and careers, including jobs outside of installation.`);
  if(offers.includes("story")) L.push(`Dimension and ${P} share the impact of the partnership through joint press, social media and local giving.`);
  if(d.signBy&&(offers.includes("community")||offers.includes("facilities"))) L.push(`**Time-sensitivity:** a partnership agreement in place by ${d.signBy} guarantees ${[offers.includes("community")?"program funding and subscription spots for the people "+P+" serves":"",offers.includes("facilities")?"a "+v["Signing Grant"]+" grant for enrolling its own accounts":""].filter(Boolean).join(", and ")}.`);
  return L;
}
function gsPrompt(v,hideFacility,d){ d=d||{};
  const P=v["Partner Name"], L=[], off=offersOf(d), hasF=!!v["Target Enrollments"];
  L.push(`Make the pitch deck for ${P}. Keep the template's exact design, layouts, colors, fonts, illustrations, Dimension Energy logos, footer and card order. Change only what is listed here, and do not invent numbers, dates, names or programs.`);
  L.push(`- Replace every [Org] (and any [Partner Name]) with "${P}" and [Date] with "${v["Date"]}".`);
  L.push(`- Right after the cover, add an "Executive summary" card in the same style (navy, title with the short coral rule under it, white text, key numbers in bold). Bullets, word for word:\n${execLines(v,off,hasF,hideFacility,d).map(x=>"  • "+x).join("\n")}`);
  const tiles=off.map((k,i)=>{ const o=DK_OFFERS.find(x=>x[0]===k); return `  ${String(i+1).padStart(2,"0")} ${o[3]}: "${o[4].replace("{P}",P)}" (icon: ${o[5]})`; });
  L.push(`- On the "Four ways we can partner" card, change the title to "${off.length===1?"How we can partner with "+P:NUMW[off.length]+" ways we can partner with "+P}" and show exactly these ${off.length} option tiles in this order, in the same bordered tile style. Give each tile its own small flat icon (gold with a tiny coral accent) that matches its subject, never the same icon twice:\n${tiles.join("\n")}`);
  if(v["Project Name"]&&!/^\[|trenton/i.test(v["Project Name"])) L.push(`- On "How do community solar projects work?" and "Illinois Shines overview", the local project is "${v["Project Name"]}"${v["Project Address"]?` at ${v["Project Address"]}`:""}. Replace Trenton CSG LLC and its address with that.`);
  if(off.includes("community")&&hasF) L.push(`- After the "Enrollments: facilities and community" card, add one card in the same style (three or four gold-number tiles like the "Dimension Energy nationally" card) titled "${P} can offer the same savings to the community it serves", with tiles: ${v["Target Enrollments"]} target subscribers enrolled; ${v["Subscriber Annual Savings"]} estimated annual savings per subscriber; ${v["Subscriber Lifetime Savings"]?v["Subscriber Lifetime Savings"]+" total subscriber savings over the project life; ":""}${v["Total Funding"]} Dimension funding to ${P}. Footnote: "Funding includes a ${v["Upfront Grant"]} startup grant (after the first ${v["Upfront After"]} enrollments), ${v["Per Enrollment Fee"]} per enrollment for the first ${v["Tier 1 Count"]} and ${v["Step-Up Fee"]} after, milestone grants of ${v["Milestone 1 Payment"]} at ${v["Milestone 1 Count"]}${/^\$0$/.test(v["Milestone 2 Payment"])?"":" and "+v["Milestone 2 Payment"]+" at "+v["Milestone 2 Count"]} enrollments, and ${v["Staff Wages"]} for staff wages."`);
  if(off.includes("facilities")&&!hideFacility) L.push(`- Then add one more card in the same style titled "${P} can sign up its own electricity accounts", with gold-number tiles: ${v["Signing Grant"]} grant for signing up its accounts${d.signBy?" by "+d.signBy:""}; ${v["Facility Annual Savings"]} estimated annual savings; ${v["Facility 25-Year Savings"]} estimated 25-year savings; ${v["Savings Start"]} estimated savings start. Footnote: "Estimated savings based on ${v["Savings Basis"]}, assuming a 3% credit rate escalator."`);
  return L.join("\n");
}
// ---- 📊 Pitch deck panel on each partner card: builds a Girl Scouts–style Gamma deck with this partner's numbers
const DK_F=[["name","Name on slides",""],["date","Deck date",""],["signBy","Sign-by date",""],["project","Project (if not in the MSA)",""],["addr","Project address",""],
  ["fAnnual","Facility annual savings ($)",""],["f25","Facility 25-year savings ($)","Auto-calculated"],["start","Savings start",""],["basis","Savings based on",""],
  ["signGrant","Grant for signing its accounts","$2,000"],["subSave","Subscriber annual savings","$250"],["link","Enrollment link (co-branded)","https://…"],["myPhone","Your phone (closing slide)",""],["myEmail","Your email (closing slide)",""]];
function deckOf(p){ return {...(p.deck||{})}; }
function deckHTML(p){ const d=deckOf(p), r=deckValues(p,d), v=r.vals;
  const kv=(k,l)=>`<tr><td>${esc(l)}</td><td>${esc(v[k]||"—")}</td></tr>`;
  return `<div class="ppanel" data-panel="deck"><h3>📊 Pitch deck — ${esc(v["Partner Name"])}</h3>
   <div class="pnote">Builds this partner's deck from <b>All Deck</b> in Canva (Dimension logo on every slide): only the slides this deck is for, with the partner name and date on the cover, their enrollment link + QR code on the sign-up slides, your contact line on the last slide, and the 💰 grant slide filled from their Budget (save the budget first).${p.utmLink?"":" <b>Make their UTM link first</b> so the link and QR fill in."} Saves under 🤝 Organization x Dimension in My decks. In Canva you can export it to PowerPoint or PDF.</div>
   <div class="dkoff"><label>What's this deck for? <span style="font-weight:400;color:var(--muted,#888)">(picks the slides from All Deck)</span></label><div class="dkofflist">${DK_PURPOSE.map(([k,l,w])=>`<label class="dko" title="${esc(w)}"><input type="radio" name="dkp-${esc(p.id)}" data-dkp="${k}"${(d.purpose||"intro")===k?" checked":""}> ${esc(l)}</label>`).join("")}</div>
    <div class="dkslides" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${DK_ORDER.map(n=>DK_SLIDES.find(x=>x[0]===n)).filter(Boolean).map(([n,l])=>`<label class="dko" style="padding:4px 10px;min-height:30px;font-size:13px"><input type="checkbox" data-dks="${n}"${dkPages(d).includes(n)?" checked":""}> ${esc(l)}</label>`).join("")}</div>
    <div class="pnote" style="margin-top:4px">${dkPages(d).length} slide${dkPages(d).length===1?"":"s"} · ${esc(dkPurpose(d)[2])}</div></div>
   <div class="grid2">${DK_F.filter(([k])=>["name","date","link","myPhone","myEmail"].includes(k)).map(([k,l,ph])=>`<div><label for="dk-${esc(p.id)}-${k}">${esc(l)}</label><input id="dk-${esc(p.id)}-${k}" data-dk="${k}" value="${esc(d[k]||"")}" placeholder="${esc(ph)}"></div>`).join("")}</div>
   <div class="pbtns"><button class="pbtn main" data-pact="dkcanva"${S.dkBusy?" disabled":""}>${S.dkBusy===p.id?"🪄 Canva is building…":p.deckUrl?"✨ Make a new Canva deck":"✨ Make deck in Canva"}</button>${p.deckUrl?`<a class="pbtn" href="${esc(p.deckUrl)}" target="_blank" rel="noopener">Open latest deck ↗</a>`:""}<button class="pbtn" data-pact="dksave">Save details</button></div>
   ${S.dkMsg&&S.dkMsg.id===p.id?`<div class="${S.dkMsg.err?"slstatus err":"bqok y"}">${S.dkMsg.html}</div>`:""}</div>`; }
function readDeck(card){ const o={}; card.querySelectorAll("[data-dk]").forEach(i=>o[i.dataset.dk]=i.value.trim()); const ks=[...card.querySelectorAll("[data-dko]")]; if(ks.length) o.offers=ks.filter(i=>i.checked).map(i=>i.dataset.dko).join(",");
  const pr=card.querySelector("[data-dkp]:checked"); if(pr) o.purpose=pr.dataset.dkp; const sl=[...card.querySelectorAll("[data-dks]")]; if(sl.length) o.pages=sl.filter(i=>i.checked).map(i=>i.dataset.dks).join(","); return o; }
// changing the purpose re-ticks the slides; ticking a slide by hand switches to Custom
document.addEventListener("change",e=>{ const card=e.target.closest(".ppanel[data-panel=deck]"); if(!card) return;
  if(e.target.matches("[data-dkp]")){ const pu=DK_PURPOSE.find(x=>x[0]===e.target.dataset.dkp); if(pu&&pu[0]!=="custom") card.querySelectorAll("[data-dks]").forEach(i=>i.checked=pu[3].includes(+i.dataset.dks)); }
  if(e.target.matches("[data-dks]")){ const c=card.querySelector('[data-dkp="custom"]'); if(c) c.checked=true; }
  const n=[...card.querySelectorAll("[data-dks]")].filter(i=>i.checked).length, pk=(card.querySelector("[data-dkp]:checked")||{dataset:{}}).dataset.dkp, pu=DK_PURPOSE.find(x=>x[0]===pk)||DK_PURPOSE[0]; const note=card.querySelector(".dkslides+.pnote"); if(note) note.textContent=`${n} slide${n===1?"":"s"} · ${pu[2]}`; });
async function deckBytes(p,d){ if(!window.JSZip) throw new Error("The file tools didn't load — reload the page");
  const res=await fetch("pitch-template.json"); if(!res.ok) throw new Error("Couldn't load the deck template");
  const tb=atob((await res.json()).b64), tu=new Uint8Array(tb.length); for(let i=0;i<tb.length;i++) tu[i]=tb.charCodeAt(i);
  const r=deckValues(p,d); return await fillDeck(JSZip,tu,r.vals,r.hideFacility); }
const deckFile=(p,d)=>`${safeName(deckValues(p,d).vals["Partner Name"])} x Dimension - Pitch Deck ${ymd(new Date())}.pptx`;