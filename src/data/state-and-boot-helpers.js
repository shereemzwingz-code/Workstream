const CATS={
  1:{name:"1. Enrollment partner channels",icon:"🤝",goal:"5+ channels live, each averaging 10 enrollments/week",head:"#F06BAE",tint:"#FDE9F3",tintD:"#3A1A2C"},
  2:{name:"2. Community ambassador program",icon:"🦋",goal:"2+ ambassadors each signing up 20+ people",head:"#7FB2E5",tint:"#EDF4FC",tintD:"#18283C"},
  3:{name:"3. In-person enrollment events",icon:"🎪",goal:"1-2 events/month; 400+ households by year end",head:"#F4A261",tint:"#FEF1E6",tintD:"#33241A"},
  4:{name:"4. Marketing & sales toolkits",icon:"🎀",goal:"Playbooks, toolkits, collateral for IL campaigns",head:"#B9A3E0",tint:"#F4EFFB",tintD:"#272038"},
  5:{name:"5. Process, CX & acquisition",icon:"🛠️",goal:"Cut manual work, improve follow-up, scale campaigns",head:"#86CC89",tint:"#ECF7ED",tintD:"#1A2E1D"},
  6:{name:"6. Illinois Shines compliance",icon:"📋",goal:"Help Elena & Jon with Part 2 + designee registrations",head:"#F2C94C",tint:"#FFF8E0",tintD:"#2E2A17"},
  7:{name:"7. Reporting, cadence & admin",icon:"📊",goal:"Build out DE as customer facing",head:"#B3BDCB",tint:"#F1F3F6",tintD:"#212A37"},
};
const STATUSES=["Not Started","In Progress","Waiting","Complete"];
const stIcon=s=>({"Not Started":"🌱","In Progress":"💫","Waiting":"⏳","Complete":"💗"}[s]||"🌱");
const stClass=s=>({"Not Started":"st-ns","In Progress":"st-ip","Waiting":"st-w","Complete":"st-c"}[s]||"st-ns");
const S={keepDone:new Set(),view:"home",calMonth:null,calSel:null,sortMode:"mine",dragging:false,db:null,uid:null,tasks:[],loaded:false,filter:"all",range:"all",showDone:true,closed:new Set(),editing:null,open:new Set(),finOpen:new Set(),full:new Set(),sample:null,lastBatch:null,busy:false};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dark=()=>document.documentElement.dataset.theme==="dark"||(document.documentElement.dataset.theme!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);
