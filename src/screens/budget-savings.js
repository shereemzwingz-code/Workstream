// ---- Partner Budget (CC Campaign Cost Calculator 7.13)
const BDEF={N:300,G:5000,F1:100,F2:150,T1:100,B1:2000,TB1:200,B2:5000,TB2:500,wage:20,weeks:8,hours:40,U:7500,acq:0.08,target:0.056,project:""};
const BLBL=[["N","Projected customers"],["G","Upfront grant ($)"],["F1","Per-subscriber fee ($)"],["T1","Step-up after # subscribers"],["F2","Per-subscriber step-up ($)"],["B1","Bonus 1 ($)"],["TB1","Bonus 1 after #"],["B2","Bonus 2 ($)"],["TB2","Bonus 2 after #"],["wage","Staff wage ($/hr)"],["hours","Hours / week"],["weeks","Weeks"],["U","Avg usage (kWh/customer)"],["acq","Ampion acquisition ($/kWh)"],["target","Target $/kWh"]];
function bCost(b,N){ return b.G+b.wage*b.weeks*b.hours+b.F1*Math.min(N,b.T1)+b.F2*Math.max(N-b.T1,0)+(N>=b.TB1?b.B1:0)+(N>=b.TB2?b.B2:0); }
function bCalc(b){ const N=Math.max(1,b.N), total=bCost(b,N), sal=b.wage*b.weeks*b.hours;
  const amp100=b.acq+50/b.U, amp70=b.acq*0.7-(0.95*0.01+0.05*0.02)-50/b.U;
  let be=null; for(let n=1;n<=10000;n++){ if(bCost(b,n)/(n*b.U)<=b.target){ be=n; break; } }
  const rows=[50,100,150,200,300,400,500,750,1000].map(n=>{ const c=bCost(b,n), k=c/(n*b.U); return {n,c,k,b100:k<amp100,b70:k<amp70}; });
  return {N,total,sal,perCust:total/N,perKwh:total/(N*b.U),amp100,amp70,be,rows}; }
const money=v=>"$"+Math.round(v).toLocaleString();
function budgetOf(p){ return {...BDEF,...(p.budget||{})}; }
// ---- 📈 Savings & ☀️ project: the facility's own bill savings (slide 13) and the project card (slide 14)
// ---- Circle graph on slide 14: five blocks of years, sized by their share of the lifetime total
const DONUT_COLS=["#7d3317","#a84a24","#d05e33","#e87241","#f59e73"];  // brand-orange ramp on the All Deck's donut
function donutSeg(a0,a1,SZ,R,r){ const C=SZ/2, f=v=>Math.round(v*100)/100,
  p=(rad,a)=>{ const t=a*Math.PI/180; return [C+rad*Math.sin(t), C-rad*Math.cos(t)]; };
  const big=(a1-a0)>180?1:0, [ox0,oy0]=p(R,a0), [ox1,oy1]=p(R,a1), [ix1,iy1]=p(r,a1), [ix0,iy0]=p(r,a0);
  return `M${f(ox0)} ${f(oy0)} A${R} ${R} 0 ${big} 1 ${f(ox1)} ${f(oy1)} L${f(ix1)} ${f(iy1)} A${r} ${r} 0 ${big} 0 ${f(ix0)} ${f(iy0)} Z`; }
function donutBlocks(sv){ const e=1+(+sv.esc||3)/100, yrs=[], N=Math.max(5,+sv.years||25);
  for(let n=1;n<=N;n++) yrs.push(Math.pow(e,n-1));
  const tot=yrs.reduce((a,b)=>a+b,0), step=Math.floor(N/5), out=[];
  for(let i=0;i<5;i++){ const a=i*step, b=(i===4?N:(i+1)*step); out.push({from:a+1,to:b,share:yrs.slice(a,b).reduce((x,y)=>x+y,0)/tot}); }
  return out; }
const SDEF={kwh:1000000,rate:0.124,disc:10,esc:3,years:25,start:"Q1 2027",pname:"",paddr:"",pkw:"",putil:"Ameren Illinois"};
function savOf(p){ return {...SDEF,...(p.sav||{})}; }
function savCalc(v){ const yr1=v.kwh*v.rate*(v.disc/100); const rows=[]; let cum=0; for(let n=0;n<v.years;n++){ const a=yr1*Math.pow(1+v.esc/100,n); cum+=a; rows.push({n:n+1,a,cum}); } return {yr1,life:cum,rows}; }
// Circle graph: the ring is one year of electricity — the lit arc is the part community solar covers.
// Milestone dots around the ring mark how the lifetime total stacks up.
function savChartSVG(v,r){
  const W=640,H=320,cx=200,cy=160,R=112,TH=34;
  const pct=Math.max(0,Math.min(100,+v.disc||0));
  const pol=(a,rad)=>[cx+rad*Math.cos((a-90)*Math.PI/180),cy+rad*Math.sin((a-90)*Math.PI/180)];
  const arc=(from,to,rad,th,cls,title)=>{ const big=(to-from)>180?1:0; const [x1,y1]=pol(from,rad), [x2,y2]=pol(to,rad);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rad} ${rad} 0 ${big} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" class="${cls}" stroke-width="${th}" fill="none" stroke-linecap="round">${title?`<title>${title}</title>`:""}</path>`; };
  const end=pct/100*360;
  const ring=`${arc(0,359.9,R,TH,"dring")}${pct>0?arc(0,Math.max(end,2),R,TH,"dsave","You keep "+pct+"% of what you would have paid"):""}`;
  const marks=[1,Math.max(2,Math.round(v.years/2)),v.years].filter((x,k,a)=>a.indexOf(x)===k);
  const mid=`<text x="${cx}" y="${cy-6}" text-anchor="middle" class="dpct">${pct}%</text>
    <text x="${cx}" y="${cy+26}" text-anchor="middle" class="dlbl">off every bill</text>`;
  // the running total, read as a stack of figures beside the ring
  const LX=392; const rowsOut=marks.map((yn,k)=>{ const row=r.rows[yn-1]; if(!row) return "";
    const y=72+k*74; const w=Math.max(6,(row.cum/(r.life||1))*196);
    return `<text x="${LX}" y="${y}" class="dkey">After year ${yn}</text>
      <text x="${LX}" y="${y+32}" class="dval">${money(row.cum)}</text>
      <rect x="${LX}" y="${y+42}" width="196" height="7" rx="3.5" class="dtrack"/>
      <rect x="${LX}" y="${y+42}" width="${w.toFixed(1)}" height="7" rx="3.5" class="dfill"/>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="savchart" role="img" aria-label="Community solar covers ${pct}% of the bill; ${money(r.life)} saved over ${v.years} years">
    ${ring}${mid}${rowsOut}</svg>`; }
function savHTML(p){ const v=savOf(p), r=savCalc(v); const f=(k,l,ph,extra="")=>`<div><label for="sv-${esc(p.id)}-${k}">${esc(l)}</label><input id="sv-${esc(p.id)}-${k}" data-sv="${k}" value="${esc(v[k]??"")}" placeholder="${esc(ph)}" ${extra}></div>`;
  return `<div class="ppanel" data-panel="savings"><h3>📈 Savings & project — ${esc(p.org||p.name)}</h3>
   <div class="pnote">What ${esc(p.org||p.name)} saves on its own electric bills, the way the Lessie Bates proposal did it: annual kWh allocation × credit rate × your discount, growing with the credit-rate escalator. Drag any number — the chart updates live. 📊 makes the slides in Canva.</div>
   <div class="grid2">${f("kwh","Annual allocation (kWh)","1000000",'inputmode="numeric"')}${f("rate","Credit rate ($ per kWh)","0.124",'inputmode="decimal"')}${f("disc","Discount (% off credits)","10",'inputmode="decimal"')}${f("esc","Credit-rate escalator (% per year)","3",'inputmode="decimal"')}${f("years","Years","25",'inputmode="numeric"')}${f("start","Savings start","Q1 2027")}</div>
   <div class="savstats"><div><b>${esc(v.disc)}%</b><span>off their credits</span></div><div><b>${money(r.yr1)}</b><span>year-1 savings</span></div><div><b>${money(r.life)}</b><span>over ${esc(v.years)} years</span></div></div>
   ${savChartSVG(v,r)}
   <h4 style="margin:14px 0 4px">☀️ The project</h4>
   <div class="grid2">${f("pname","Project name","Trenton CSG")}${f("paddr","Project address","")}${f("pkw","Size (kW)","",'inputmode="decimal"')}${f("putil","Utility","Ameren Illinois")}</div>
   <div class="pbtns" style="margin-top:6px"><label class="pbtn" style="cursor:pointer">🖼️ Project photo${p.sav&&p.sav.photoAsset?" ✓":""}<input type="file" accept="image/*" class="bfile" data-svphoto="${esc(p.id)}"></label><span class="pnote" id="svphoto-${esc(p.id)}">${p.sav&&p.sav.photoAsset?"Photo saved — goes on the project slide":"Optional — a picture of the solar farm or the site"}</span></div>
   <div class="pbtns"><button class="pbtn main" data-pact="svsave">💾 Save</button><button class="pbtn" data-pact="svslide" data-v="14">📊 Savings slide</button><button class="pbtn" data-pact="svslide" data-v="15">📊 Project slide</button>${p.savDeckUrl?`<a class="pbtn" href="${esc(p.savDeckUrl)}" target="_blank" rel="noopener">Open latest ↗</a>`:""}</div></div>`; }
function readSav(card){ const o={}; card.querySelectorAll("[data-sv]").forEach(i=>{ const k=i.dataset.sv; o[k]=["kwh","rate","disc","esc","years","pkw"].includes(k)?(+String(i.value).replace(/[^0-9.]/g,"")||0):i.value.trim(); }); if(!o.years) o.years=25; return o; }
document.addEventListener("input",e=>{ const card=e.target.closest(".ppanel[data-panel=savings]"); if(!card||!e.target.matches("[data-sv]")) return; const v={...SDEF,...readSav(card)}; const r=savCalc(v); const st=card.querySelector(".savstats"); if(st) st.innerHTML=`<div><b>${esc(v.disc)}%</b><span>off their credits</span></div><div><b>${money(r.yr1)}</b><span>year-1 savings</span></div><div><b>${money(r.life)}</b><span>over ${esc(v.years)} years</span></div>`; const sv=card.querySelector(".savchart"); if(sv) sv.outerHTML=savChartSVG(v,r); });
document.addEventListener("change",async e=>{ const inp=e.target.closest("[data-svphoto]"); if(!inp||!inp.files||!inp.files[0]) return; const pid=inp.dataset.svphoto, p=(S.partners||[]).find(x=>x.id===pid); const note=$("svphoto-"+pid); if(!p) return; if(!S.mcp){ note.textContent="Open in claude.ai with Google Drive + Canva allowed to add a photo"; return; }
  try{ note.textContent="☁️ Uploading…"; const b64=await shrinkB64(await fileB64(inp.files[0]),inp.files[0].type||"image/jpeg",1600,false); const d=await driveShare({b64,mime:"image/jpeg"},(p.org||p.name)+" — project photo.jpg"); note.textContent="🎨 Importing to Canva…"; const asset=await canvaImport(d.url,(p.org||p.name)+" project photo"); await pcol().doc(p.id).update({sav:{...(p.sav||{}),photoAsset:asset,photoUrl:d.url}}); note.textContent="✓ Photo saved — goes on the project slide"; toast("🖼️ Project photo saved"); }
  catch(err){ note.textContent="Didn't upload — "+((err&&err.message)||"allow Google Drive + Canva and try again"); } });
function budgetHTML(p){ const b=budgetOf(p), r=bCalc(b);
  return `<div class="ppanel" data-panel="budget"><h3>💰 Budget — ${esc(p.org||p.name)}</h3><div class="pnote">From the CC Campaign Cost Calculator (7.13). Change any number and tap Recalculate.</div>
   <div class="grid2">${BLBL.map(([k,l])=>`<div><label>${l}</label><input type="number" step="any" data-bf="${k}" value="${esc(b[k])}"></div>`).join("")}<div><label>Project (SPV)</label><input data-bf="project" value="${esc(b.project||"")}" placeholder="New Lenox CSG 1 LLC"></div></div>
   <div class="btotal">Total cost at ${r.N.toLocaleString()} customers: <b>${money(r.total)}</b><br>${money(r.perCust)} per customer · $${r.perKwh.toFixed(4)}/kWh · staff ${money(r.sal)}<br>Breakeven at $${b.target}/kWh: <b>${r.be?r.be.toLocaleString()+" customers":"not reached by 10,000"}</b> · 100% Ampion $${r.amp100.toFixed(4)} · 70% Ampion $${r.amp70.toFixed(4)}
   <table><tr><td><b>Customers</b></td><td><b>Total</b></td><td><b>$/kWh</b></td><td><b>Beats 100% / 70%</b></td></tr>${r.rows.map(x=>`<tr><td>${x.n}</td><td>${money(x.c)}</td><td>$${x.k.toFixed(4)}</td><td>${x.b100?"✅":"—"} / ${x.b70?"✅":"—"}</td></tr>`).join("")}</table></div>
   <div class="pbtns"><button class="pbtn main" data-pact="bcalc">🧮 Recalculate + save</button><button class="pbtn" data-pact="bcopy">📋 Copy summary</button><button class="pbtn" data-pact="bxl">📤 Excel</button><button class="pbtn" data-pact="bslide" title="Makes the grant-program slide in Canva from the Budget deck, filled with these numbers">📊 Budget slide${p.budgetDeckUrl?" (new)":""}</button>${p.budgetDeckUrl?`<a class="pbtn" href="${esc(p.budgetDeckUrl)}" target="_blank" rel="noopener">Open slide ↗</a>`:""}<button class="pbtn" data-pact="msa">📝 Use in MSA</button></div></div>`; }
function readBudget(card){ const o={}; card.querySelectorAll("[data-bf]").forEach(i=>{ o[i.dataset.bf]=i.dataset.bf==="project"?i.value.trim():(+i.value||0); }); return {...BDEF,...o}; }
function budgetText(p,b){ const r=bCalc(b); return `${p.org||p.name} — campaign budget\nProjected customers: ${r.N}\nUpfront grant: ${money(b.G)}\nPer-subscriber: ${money(b.F1)} (first ${b.T1}), then ${money(b.F2)}\nBonuses: ${money(b.B1)} at ${b.TB1}; ${money(b.B2)} at ${b.TB2}\nStaff: ${money(r.sal)} (${b.wage}/hr × ${b.hours} hrs × ${b.weeks} wks)\nTotal: ${money(r.total)} · ${money(r.perCust)}/customer · $${r.perKwh.toFixed(4)}/kWh\nBreakeven at $${b.target}/kWh: ${r.be||"n/a"} customers`; }
async function budgetXlsx(p,b){
  if(!window.ExcelJS||!S.dl){ toast("Download isn't available here"); return; }
  const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet("Budget"); ws.columns=[{width:44},{width:16},{width:16},{width:14},{width:14}];
  const B=(r,c)=>ws.getCell(r,c); B(1,1).value=`${p.org||p.name} — Campaign Cost Calculator`; B(1,1).font={bold:true,size:13};
  const put=(row,l,v,fmt)=>{ B(row,1).value=l; B(row,2).value=v; if(fmt) B(row,2).numFmt=fmt; };
  put(3,"Avg customer usage (kWh)",b.U); put(4,"Ampion acquisition cost ($/kWh)",b.acq,"0.000"); put(5,"Projected customers",b.N); put(6,"Upfront grant",b.G,"$#,##0"); put(7,"Per-subscriber fee",b.F1,"$#,##0"); put(8,"Step-up after # subscribers",b.T1); put(9,"Per-subscriber step-up",b.F2,"$#,##0"); put(10,"Bonus 1",b.B1,"$#,##0"); put(11,"Bonus 1 after #",b.TB1); put(12,"Bonus 2",b.B2,"$#,##0"); put(13,"Bonus 2 after #",b.TB2); put(14,"Wage",b.wage,"$#,##0.00"); put(15,"Weeks",b.weeks); put(16,"Hours per week",b.hours);
  B(17,1).value="Staff salary"; B(17,2).value={formula:"B14*B15*B16"}; B(17,2).numFmt="$#,##0";
  B(19,1).value="Total cost"; B(19,2).value={formula:"B6+B17+B7*MIN(B5,B8)+B9*MAX(B5-B8,0)+IF(B5>=B11,B10,0)+IF(B5>=B13,B12,0)"}; B(19,2).numFmt="$#,##0";
  B(20,1).value="CAC ($/customer)"; B(20,2).value={formula:"B19/B5"}; B(20,2).numFmt="$#,##0.00";
  B(21,1).value="CAC ($/kWh)"; B(21,2).value={formula:"B19/(B5*B3)"}; B(21,2).numFmt="$0.0000";
  B(22,1).value="100% Ampion cost ($/kWh)"; B(22,2).value={formula:"B4+50/B3"}; B(22,2).numFmt="$0.0000";
  B(23,1).value="70% Ampion target ($/kWh)"; B(23,2).value={formula:"B4*0.7-(0.95*0.01+0.05*0.02)-50/B3"}; B(23,2).numFmt="$0.0000";
  [3,5].forEach(r=>{}); for(let r=3;r<=23;r++) B(r,1).font={bold:r>=19};
  ["# Customers","Total cost","Cost per kWh","Beats 100%?","Beats 70%?"].forEach((h,c)=>{ B(25,c+1).value=h; B(25,c+1).font={bold:true}; });
  [50,100,150,200,300,400,500,750,1000].forEach((n,j)=>{ const i=26+j; const row=ws.getRow(i); row.getCell(1).value=n;
    row.getCell(2).value={formula:`$B$6+$B$17+$B$7*MIN(A${i},$B$8)+$B$9*MAX(A${i}-$B$8,0)+IF(A${i}>=$B$11,$B$10,0)+IF(A${i}>=$B$13,$B$12,0)`}; row.getCell(2).numFmt="$#,##0";
    row.getCell(3).value={formula:`B${i}/(A${i}*$B$3)`}; row.getCell(3).numFmt="$0.0000";
    row.getCell(4).value={formula:`IF(C${i}<$B$22,"YES","NO")`}; row.getCell(5).value={formula:`IF(C${i}<$B$23,"YES","NO")`}; });
  try{ const buf=await wb.xlsx.writeBuffer(); await S.dl.save({filename:`${(p.org||p.name).replace(/[^\w ]+/g,"").trim()} Budget.xlsx`,data:new Uint8Array(buf)}); toast("📤 Budget ready"); }catch(e){ if(e?.code!=="declined") toast("Download isn't available here"); }
}
