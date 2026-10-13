/* ---- Pink sparkle trail ---- */
(function(){ try{ if(!matchMedia("(pointer:fine)").matches||matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(_){ return; }
  const C=["#FF8FC4","#E8479B","#FFB3D9","#F06BAE","#FFD6EC"]; let last=0, lx=0, ly=0;
  document.addEventListener("pointermove",e=>{ const now=performance.now(); const d=Math.hypot(e.clientX-lx,e.clientY-ly); if(now-last<28||d<6) return; last=now; lx=e.clientX; ly=e.clientY;
    const n=d>30?2:1; for(let i=0;i<n;i++){ const sp=document.createElement("span"); sp.className="spark"; sp.style.left=(e.clientX+4+Math.random()*6-3)+"px"; sp.style.top=(e.clientY+6+Math.random()*6-3)+"px";
      const sz=6+Math.random()*8; sp.style.width=sp.style.height=sz+"px"; sp.style.setProperty("--sc",C[Math.floor(Math.random()*C.length)]);
      sp.style.setProperty("--sx",(Math.random()*30-15)+"px"); sp.style.setProperty("--sy",(14+Math.random()*26)+"px"); document.body.appendChild(sp); setTimeout(()=>sp.remove(),950); } },{passive:true});
})();
/* ---- Duchess: a confident, bougie, regal kitty. [line, attribution, mood] ---- */
const KITTY_SAYS=[
 // Scripture — she delivers these with the crown glowing
 ["I can do all things through Christ which strengtheneth me.","Philippians 4:13","shine"],
 ["Trust in the LORD with all thine heart; and lean not unto thine own understanding.","Proverbs 3:5","shine"],
 ["God is in the midst of her; she shall not be moved.","Psalm 46:5","shine"],
 ["Strength and honour are her clothing; and she shall rejoice in time to come.","Proverbs 31:25","shine"],
 ["And let us not be weary in well doing: for in due season we shall reap, if we faint not.","Galatians 6:9","shine"],
 ["This is the day which the LORD hath made; we will rejoice and be glad in it.","Psalm 118:24","shine"],
 ["Commit thy works unto the LORD, and thy thoughts shall be established.","Proverbs 16:3","shine"],
 ["And whatsoever ye do, do it heartily, as to the Lord, and not unto men.","Colossians 3:23","shine"],
 ["Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.","Psalm 37:5","shine"],
 ["For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.","2 Timothy 1:7","shine"],
 ["They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.","Isaiah 40:31","shine"],
 ["Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.","Joshua 1:9","shine"],
 ["And we know that all things work together for good to them that love God.","Romans 8:28","shine"],
 ["Casting all your care upon him; for he careth for you.","1 Peter 5:7","shine"],
 ["His compassions fail not. They are new every morning: great is thy faithfulness.","Lamentations 3:22–23","shine"],
 ["For who hath despised the day of small things?","Zechariah 4:10","shine"],
 ["To every thing there is a season, and a time to every purpose under the heaven.","Ecclesiastes 3:1","shine"],
 ["Now faith is the substance of things hoped for, the evidence of things not seen.","Hebrews 11:1","shine"],
 ["I am come that they might have life, and that they might have it more abundantly.","John 10:10","shine"],
 ["Let your light so shine before men, that they may see your good works.","Matthew 5:16","shine"],
 ["Ye are the light of the world. A city that is set on an hill cannot be hid.","Matthew 5:14","shine"],
 ["The Sun of righteousness arise with healing in his wings.","Malachi 4:2","shine"],
 ["Behold, I will do a new thing; now it shall spring forth; shall ye not know it?","Isaiah 43:19","shine"],
 ["He giveth power to the faint; and to them that have no might he increaseth strength.","Isaiah 40:29","shine"],
 ["The liberal soul shall be made fat: and he that watereth shall be watered also himself.","Proverbs 11:25","shine"],
 ["He that hath pity upon the poor lendeth unto the LORD.","Proverbs 19:17","shine"],
 ["Open thy mouth, judge righteously, and plead the cause of the poor and needy.","Proverbs 31:9","shine"],
 ["Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over.","Luke 6:38","shine"],
 ["Let us not love in word, neither in tongue; but in deed and in truth.","1 John 3:18","shine"],
 ["Bear ye one another's burdens, and so fulfil the law of Christ.","Galatians 6:2","shine"],
 ["Whatsoever thy hand findeth to do, do it with thy might.","Ecclesiastes 9:10","shine"],
 ["In all labour there is profit.","Proverbs 14:23","shine"],
 ["Seest thou a man diligent in his business? he shall stand before kings.","Proverbs 22:29","shine"],
 ["A man's gift maketh room for him, and bringeth him before great men.","Proverbs 18:16","shine"],
 ["Two are better than one; because they have a good reward for their labour.","Ecclesiastes 4:9","shine"],
 ["As iron sharpeneth iron; so a man sharpeneth the countenance of his friend.","Proverbs 27:17","shine"],
 ["Where no counsel is, the people fall: but in the multitude of counsellers there is safety.","Proverbs 11:14","shine"],
 ["Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.","Proverbs 13:12","shine"],
 ["The steps of a good man are ordered by the LORD.","Psalm 37:23","shine"],
 ["Delight thyself also in the LORD; and he shall give thee the desires of thine heart.","Psalm 37:4","shine"],
 ["The LORD will perfect that which concerneth me.","Psalm 138:8","shine"],
 ["Thy word is a lamp unto my feet, and a light unto my path.","Psalm 119:105","shine"],
 ["The LORD is my shepherd; I shall not want.","Psalm 23:1","shine"],
 ["Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight.","Psalm 19:14","shine"],
 ["A good name is rather to be chosen than great riches.","Proverbs 22:1","shine"],
 ["Many daughters have done virtuously, but thou excellest them all.","Proverbs 31:29","shine"],
 ["She looketh well to the ways of her household, and eateth not the bread of idleness.","Proverbs 31:27","shine"],
 ["Let all things be done decently and in order.","1 Corinthians 14:40","shine"],
 ["Be ye kind one to another, tenderhearted.","Ephesians 4:32","shine"],
 // Duchess, holding court
 ["We do not chase, darling. We follow up <i>once</i>, with excellent posture, and let it marinate.","","sip"],
 ["Sit up. You are not asking them for a favor — you are handing them a 20% discount and a press photo.","","point"],
 ["Standards, not stress. Pick the three that matter and let the rest wait their turn.","","fan"],
 ["A queen answers on her own schedule. Today, the schedule is yours.","","shades"],
 ["Somebody is about to say yes to you. Be ready, and be fabulous about it.","","strut"],
 ["Darling, that was <i>beautifully</i> handled. I saw the whole thing.","","clap"],
 ["You walked into that room as the expert. Keep walking like it.","","strut"],
 ["\u201CNo\u201D is just \u201Cnot this quarter\u201D wearing a bad outfit. Next.","","shades"],
 ["Elegance is finishing one thing completely. Shall we?","","point"],
 ["Every partner you sign eats better, sleeps better, and pays less. That is legacy work.","","shine"],
 ["Do the email. Then do something lovely for yourself. In that order.","","preen"],
 ["Tea first. Then the hard call. The call will still be there — the tea will not.","","sip"],
 ["You built this whole system yourself. Let that sit with you for a second.","","clap"],
 ["Your follow-up game is the reason those families get the credit. Don't let it slip.","","point"],
 ["Grace under pressure is the whole brand. Shoulders back.","","strut"],
 ["Nobody out-prepares you. Nobody. Go in knowing that.","","shades"],
 ["Rest is not a reward for finishing — it is part of how the work gets done.","","rest"],
 ["Water. Stretch. Posture. We are not doing hunched-over-the-laptop today.","","fan"],
 ["Small steps still count, darling. One call. One email. One yes.","","preen"],
 ["Done beats perfect, and done-with-style beats both.","","strut"],
 ["Relationships first, paperwork second. They remember how you made them feel.","","sip"],
 ["A thank-you note today opens a door next month. Write the note.","","point"],
 ["You don't have to do it all today. You just have to do the next right thing.","","rest"],
 ["Celebrate the small wins out loud. I certainly do.","","clap"],
 ["Be as generous with yourself as you are with everybody else.","","preen"],
 ["If the day got away from you, close the laptop with dignity and start fresh.","","rest"],
 ["Go on. Make the ask. The worst they can say is \u201Cnot yet.\u201D","","point"]
];
const KMOODS={walk:"on patrol",lick:"grooming",stretch:"stretching",sip:"sipping",preen:"unbothered",strut:"strutting",fan:"fanning herself",shades:"unbothered",clap:"applauding you",rest:"resting",point:"pointing",shine:"a word for you"};
const KITTY={timer:null,hide:null,last:-1,walk:null,idle:null,x:14,dir:1};
const KIDLE=[["lick",3800],["stretch",3600],["preen",3200],["sip",3400],["fan",2600],["point",2200]];
function kWidth(){ try{ return Math.max(240,innerWidth-150); }catch(_){ return 600; } }
function kSetX(x,dur){ const k=$("kitty"); if(!k) return; KITTY.x=x; k.style.setProperty("--kdur",(dur||7)+"s"); k.style.setProperty("--kx",Math.round(x)+"px"); }
function kFace(dir){ const k=$("kitty"); if(!k) return; KITTY.dir=dir; k.classList.toggle("facing-left",dir<0); }
function kStopMoving(){ clearTimeout(KITTY.walk); clearTimeout(KITTY.idle); const k=$("kitty"); if(k) k.classList.remove("walking"); }
// She crosses the screen at her own pace, pausing to groom, stretch or simply be admired.
function kPatrol(){ const k=$("kitty"); if(!k||k.hidden||!k.classList.contains("show")) return;
  clearTimeout(KITTY.walk); clearTimeout(KITTY.idle);
  const span=kWidth(), here=KITTY.x;
  let to=Math.round(14+Math.random()*span); if(Math.abs(to-here)<span*0.3) to=here<span/2?Math.round(span*0.72+Math.random()*span*0.25):Math.round(14+Math.random()*span*0.28);
  const dist=Math.abs(to-here), dur=Math.max(3.2,Math.min(11,dist/78));   // an unhurried ~78px a second
  kFace(to>here?1:-1); kMood("walk"); k.classList.add("walking"); kSetX(to,dur);
  KITTY.walk=setTimeout(()=>{ k.classList.remove("walking");
    const [m,ms]=KIDLE[Math.floor(Math.random()*KIDLE.length)]; kMood(m);        // arrives, then does a thing
    KITTY.idle=setTimeout(kPatrol,ms+Math.random()*1800);
  },dur*1000+60); }
function kGet(k){ try{ return localStorage.getItem(k); }catch(_){ return null; } }
function kSet(k,v){ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(_){} }
function kSnoozed(){ return kGet("ws.kittyOff")===ymd(new Date()); }
// Scripture is most of what she says now; the rest is her own commentary.
function kPick(){ const scr=KITTY_SAYS.filter(x=>x[1]), own=KITTY_SAYS.filter(x=>!x[1]);
  let src=(Math.random()<0.6?scr:own); if(!src.length) src=KITTY_SAYS;
  let pick=src[0]; for(let n=0;n<8;n++){ pick=src[Math.floor(Math.random()*src.length)]; if(pick!==KITTY.last||src.length<2) break; }
  KITTY.last=pick; return pick; }
function kMood(m){ const k=$("kitty"); if(!k) return; Object.keys(KMOODS).forEach(x=>k.classList.remove("m-"+x)); if(m) k.classList.add("m-"+m); }
function kSayMood(m){ const k=$("kitty"); if(k&&k.classList.contains("walking")) return; kMood(m); }
// her lines are written here, so the italics in them are ours to trust; everything interpolated is escaped
function kSay(pick){ const [t,r,m]=pick||kPick(); kSayMood(m);
  $("ktxt").innerHTML=`<span class="kmood">👑 ${esc(KMOODS[m]||"holding court")}</span><br>`+(r?`<q>${t}</q><span class="kref">— ${esc(r)}</span>`:`${t}<span class="kref">— Duchess 🐾</span>`); }
// she reacts to what actually happens in the Workstream
const KITTY_REACT={
  done:[["That is <i>handled</i>. Look at you.","","clap"],["One down, beautifully. Next.","","clap"],["Crossed off with style. I love that for us.","","strut"]],
  badge:[["A badge worthy of the wearer. Gorgeous.","","shine"],["Credentials, darling. That is how we do it.","","strut"]],
  deck:[["That deck is <i>dressed</i>. Go close somebody.","","shades"],["Built, branded and ready. Strut in there.","","strut"]],
  signed:[["SIGNED. Oh, we are celebrating this one.","","clap"],["Another partner in the fold. Magnificent.","","shine"]],
  email:[["Sent with grace. Now let it breathe.","","sip"],["Beautifully worded. Close the laptop for a minute.","","fan"]]
};
function kCheer(kind){ const set=KITTY_REACT[kind]; if(!set||kSnoozed()) return; const pick=set[Math.floor(Math.random()*set.length)];
  const k=$("kitty"); if(!k) return; kStopMoving(); k.classList.remove("walking"); k.hidden=false; kSetX(KITTY.x,0); kSay(pick);
  requestAnimationFrame(()=>requestAnimationFrame(()=>k.classList.add("show")));
  clearTimeout(KITTY.hide); KITTY.hide=setTimeout(kHide,11000); KITTY.idle=setTimeout(kPatrol,7000); }
function kShow(force){ const k=$("kitty"); if(!k) return; if(!force&&(kSnoozed()||document.hidden)) { kSchedule(); return; }
  const h=new Date().getHours(); const want=h<9?"sip":h>=21?"rest":null;   // morning tea, late-night wind-down
  const pick=want&&Math.random()<.6?(KITTY_SAYS.filter(x=>x[2]===want)[Math.floor(Math.random()*KITTY_SAYS.filter(x=>x[2]===want).length)]):null;
  kSay(pick); k.hidden=false; kSetX(KITTY.x,0); requestAnimationFrame(()=>requestAnimationFrame(()=>k.classList.add("show")));
  clearTimeout(KITTY.hide); KITTY.hide=setTimeout(kHide,26000); KITTY.idle=setTimeout(kPatrol,6500); }
function kHide(){ const k=$("kitty"); if(!k) return; kStopMoving(); k.classList.remove("show"); clearTimeout(KITTY.hide); setTimeout(()=>{ if(!k.classList.contains("show")) k.hidden=true; },600); kSchedule(); }
function kSchedule(){ clearTimeout(KITTY.timer); KITTY.timer=setTimeout(()=>kShow(false),(12+Math.random()*10)*60000); }
(function kInit(){ if(!$("kitty")) return;
  $("kcat").addEventListener("click",()=>{ const k=$("kitty"); kStopMoving(); if(k) k.classList.remove("walking"); kSay(); clearTimeout(KITTY.hide); KITTY.hide=setTimeout(kHide,26000); KITTY.idle=setTimeout(kPatrol,7000); });
  $("kmore").addEventListener("click",()=>{ kSay(); clearTimeout(KITTY.hide); KITTY.hide=setTimeout(kHide,18000); });
  $("kx").addEventListener("click",kHide);
  $("ksnooze").addEventListener("click",()=>{ kSet("ws.kittyOff",ymd(new Date())); kHide(); toast("Kitty will nap until tomorrow 😴 — Tools › Kitty brings her back"); });
  clearTimeout(KITTY.timer); KITTY.timer=setTimeout(()=>kShow(false),45000);
})();