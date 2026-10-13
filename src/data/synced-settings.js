// ---- Synced settings (Phase 2): one source of truth for every ws.* setting.
// The page keeps reading/writing localStorage as before; this layer mirrors the synced keys
// into data/users/<uid>/settings so phone and laptop see the same ambassadors, designees,
// rules, drafts and layout. Device-only keys (theme, collapsed sections, image cache,
// web-search session) stay in the browser on purpose.
const WS_SYNC=["ws.amb","ws.ambBase","ws.des","ws.me","ws.bq2","ws.mq","ws.agentSkip","ws.rules","ws.rulesRan","ws.friday","ws.kittyOff","ws.home.order","ws.pLayout","ws.pKind","ws.chat"];
const WS_LOCAL=["ws.theme","ws.home.open","ws.pgClosed","ws.mClosed","ws.flows","ws.webSid","ws.shot.*"];
const wsSynced=k=>WS_SYNC.includes(k);
S.kv={}; S.kvReady=false; S.kvTimer=null; S.kvApplying=false;
const wsStore=k=>k==="ws.chat"?sessionStorage:localStorage;
function wsLocalGet(k){ try{ return wsStore(k).getItem(k); }catch(_){ return null; } }
function wsLog(what,err){ try{ console.warn("[settings]",what,err&&(err.message||err)); }catch(_){ } }
(()=>{ // mirror writes to synced keys
  try{
    const P=Storage.prototype, set0=P.setItem, rm0=P.removeItem;
    P.setItem=function(k,v){ set0.call(this,k,v); if(wsSynced(k)&&!S.kvApplying){ S.kv[k]=String(v); wsQueue(); } };
    P.removeItem=function(k){ rm0.call(this,k); if(wsSynced(k)&&!S.kvApplying){ S.kv[k]=null; wsQueue(); } };
  }catch(err){ wsLog("could not watch browser storage",err); }
})();
function wsDoc(){ return S.db.doc("data/users/"+S.uid+"/settings"); }
function wsQueue(){ if(!S.kvReady) return; clearTimeout(S.kvTimer); S.kvTimer=setTimeout(wsPush,600); }
function wsPush(){ S.kvTimer=null; if(!S.db||!S.uid) return; const kv={}; WS_SYNC.forEach(k=>{ if(S.kv[k]!=null) kv[k]=S.kv[k]; });
  wsDoc().set({kv,at:new Date().toISOString(),v:2}).catch(err=>{ wsLog("save failed",err); toast("⚠️ Settings didn't save to your account — check your connection, then change any setting to retry"); }); }
// Put remote values into the browser and back onto S, so screens show them without a reload.
function wsApply(remote){
  let changed=false; S.kvApplying=true;
  try{ WS_SYNC.forEach(k=>{ const v=remote[k]??null; if(v===wsLocalGet(k)) return; changed=true;
    try{ v==null?wsStore(k).removeItem(k):wsStore(k).setItem(k,v); }catch(_){ } }); }
  finally{ S.kvApplying=false; }
  S.kv={...remote}; if(changed) wsHydrate(); return changed;
}
function wsHydrate(){
  const J=(k,d)=>{ try{ const v=wsLocalGet(k); return v==null?d:JSON.parse(v); }catch(_){ return d; } };
  try{ S.amb=J("ws.amb",{}); if(!S.amb.base) S.amb.base=wsLocalGet("ws.ambBase")||""; }catch(err){ wsLog("ambassadors",err); }
  try{ S.des=J("ws.des",{}); }catch(err){ wsLog("designees",err); }
  try{ S.me=J("ws.me",{}); }catch(err){ wsLog("me",err); }
  try{ S.bq={...BQ_DEF,...J("ws.bq2",{})}; }catch(err){ wsLog("budget",err); }
  try{ S.mq={...MQ_DEF,...J("ws.mq",{})}; }catch(err){ wsLog("msa",err); }
  try{ S.rules=J("ws.rules",{}); }catch(err){ wsLog("rules",err); }
  try{ const o=J("ws.home.order",[]); S.homeOrder=HOME_SECS.filter(k=>o.includes(k)).sort((a,b)=>o.indexOf(a)-o.indexOf(b)).concat(HOME_SECS.filter(k=>!o.includes(k))); }catch(err){ wsLog("home order",err); }
  try{ S.pLayout=wsLocalGet("ws.pLayout")||"table"; S.pKind=wsLocalGet("ws.pKind")||"partners"; }catch(err){ wsLog("partner layout",err); }
  try{ S.chat=J("ws.chat",[]); }catch(err){ wsLog("chat",err); }
  try{ render(); }catch(err){ wsLog("render",err); }
}
// Boot: first device to open uploads (one-time migration). Later devices adopt the account copy;
// anything this device had that differs is saved to settings_backup/<device> first, never dropped.
function wsSyncStart(){
  if(!S.db||!S.uid) return;
  const local={}; WS_SYNC.forEach(k=>{ const v=wsLocalGet(k); if(v!=null) local[k]=v; });
  let first=true;
  try{ wsDoc().onSnapshot(d=>{
    const ex=d&&(typeof d.exists==="function"?d.exists():d.exists); const remote=(ex&&d.data()&&d.data().kv)||{};
    if(first){ first=false;
      const missing=Object.keys(local).filter(k=>remote[k]==null), clash=Object.keys(local).filter(k=>remote[k]!=null&&remote[k]!==local[k]);
      if(clash.length){ const dev=(wsLocalGet("ws.webSid")||"device").slice(0,12); const bk={}; clash.forEach(k=>bk[k]=local[k]);
        S.db.doc("data/users/"+S.uid+"/settings_backup/"+dev).set({kv:bk,at:new Date().toISOString()}).catch(err=>wsLog("backup failed",err)); }
      const merged={...remote}; missing.forEach(k=>merged[k]=local[k]);
      wsApply(merged); S.kvReady=true; if(missing.length) wsPush(); return; }
    if(!S.kvTimer) wsApply(remote);   // live update from the other device (skip while our own save is pending)
  },err=>{ wsLog("load failed",err); S.kv={...local}; S.kvReady=true; }); }
  catch(err){ wsLog("could not open settings",err); S.kv={...local}; S.kvReady=true; }
}