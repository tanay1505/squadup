import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";

const SPORTS = [
  { emoji:"⚽", name:"Football" },{ emoji:"🏏", name:"Cricket" },
  { emoji:"🏀", name:"Basketball" },{ emoji:"🎾", name:"Tennis" },
  { emoji:"🤸", name:"Badminton" },{ emoji:"🏐", name:"Volleyball" },
  { emoji:"🏓", name:"Table Tennis" },{ emoji:"🏑", name:"Hockey" },
  { emoji:"🥒", name:"Pickleball" },
];

const AREAS = [
  "Ashok Nagar","Navratan","Hiran Magri","Sector 4","Sector 11",
  "Pratap Nagar","Suraj Pol","Chetak Circle","Bhupalpura",
  "Fatehpura","Shobhagpura","Ambamata","Bhupal Colony","Clock Tower Area"
];

const SPORT_COLORS = {
  Football:"#2563eb",Cricket:"#d97706",Basketball:"#7c3aed",
  Tennis:"#059669",Badminton:"#0891b2",Volleyball:"#db2777",
  "Table Tennis":"#0d9488",Hockey:"#9333ea",Pickleball:"#65a30d",
};

const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap";

function getSC(sport) {
  const n = sport?.replace(/[^a-zA-Z\s]/g,"").trim();
  return SPORT_COLORS[n]||"#2563eb";
}

function timeAgo(ts) {
  const m = Math.floor((Date.now()-new Date(ts))/60000);
  if(m<1)return"just now";if(m<60)return`${m}m`;
  const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`;
}

function requestNotif() {
  if("Notification"in window&&Notification.permission==="default")Notification.requestPermission();
}
function sendNotif(t,b) {
  if("Notification"in window&&Notification.permission==="granted"){try{new Notification(t,{body:b,icon:"/icon-192.png"});}catch(e){}}
}

const G = `
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{display:none;}
@keyframes in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
body{background:#f5f3ee;}
.page{max-width:680px;margin:0 auto;padding:0 16px 100px;}
.card{background:#fff;border:1.5px solid #e8e4dc;border-radius:16px;transition:transform .15s,box-shadow .15s;overflow:hidden;}
.card:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,0.07);}
.pill{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:0.3px;}
.sheet{background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;animation:in .25s cubic-bezier(.34,1.56,.64,1);padding:22px 20px 48px;}
.overlay{position:fixed;inset:0;background:rgba(30,20,10,.4);display:flex;align-items:flex-end;justify-content:center;z-index:999;backdrop-filter:blur(6px);}
.handle{width:32px;height:3px;background:#ddd;border-radius:99px;margin:0 auto 20px;}
.input{background:#f9f7f3;border:1.5px solid #e8e4dc;color:#1a1a1a;border-radius:12px;padding:12px 16px;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border-color .2s,background .2s;}
.input:focus{border-color:#2563eb;background:#fff;}
.input::placeholder{color:#bbb;}
select.input{cursor:pointer;}
.btn{padding:13px 20px;border-radius:12px;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;border:none;transition:all .15s;width:100%;}
.btn-primary{background:#1a1a1a;color:#fff;}
.btn-primary:hover{background:#333;}
.btn-primary:disabled{background:#ccc;cursor:not-allowed;}
.btn-ghost{background:#f5f3ee;color:#555;border:1.5px solid #e8e4dc;}
.btn-ghost:hover{background:#ede9e0;}
.nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1.5px solid #e8e4dc;display:flex;align-items:center;justify-content:space-around;padding:10px 8px 20px;z-index:100;}
.nav-btn{display:flex;flex-direction:column;align-items:center;background:none;border:none;cursor:pointer;padding:6px 18px;transition:transform .15s;}
.nav-btn:hover{transform:translateY(-1px);}
.nav-btn span{font-size:20px;line-height:1;}
.nav-center{width:50px;height:50px;border-radius:50%;background:#1a1a1a;color:#fff;border:none;cursor:pointer;font-size:22px;transform:translateY(-10px);box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:all .2s;}
.nav-center:hover{background:#333;transform:translateY(-12px);}
.badge{position:absolute;top:-2px;right:10px;background:#ef4444;color:#fff;border-radius:99px;width:15px;height:15px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.tag-chip{display:inline-block;padding:3px 8px;background:#f5f3ee;border:1px solid #e8e4dc;border-radius:5px;font-size:11px;color:#666;font-family:'DM Sans',sans-serif;}
`;

function Toast({msg,type}){
  if(!msg)return null;
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:type==="error"?"#ef4444":"#1a1a1a",color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",zIndex:9999,whiteSpace:"nowrap",animation:"in .25s"}}>{type==="error"?"⚠ ":"✓ "}{msg}</div>;
}

function Spin(){return <div style={{width:24,height:24,border:"2px solid #eee",borderTop:"2px solid #1a1a1a",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>;}

function Av({letter,color="#2563eb",size=36}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${color}15`,border:`2px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:700,color,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>{letter?.toUpperCase()}</div>;
}

// ── GAME CARD ─────────────────────────────────────────────────────────────────

function GameCard({game,onJoin,uid,myReqs,onContact,onCancel,onLeave}){
  const color = getSC(game.sport);
  const full  = game.filled_slots>=game.total_slots;
  const host  = game.host_id===uid;
  const req   = myReqs?.find(r=>r.game_id===game.id);
  const ok    = req?.status==="approved";
  const urg   = game.is_urgent||game.title?.startsWith("⚡");
  const pct   = Math.min((game.filled_slots/game.total_slots)*100,100);

  const getBtn=()=>{
    if(host) return null;
    if(req?.status==="pending")  return {t:"Requested",s:{background:"#fffbeb",color:"#92400e",border:"1.5px solid #fde68a"},dis:true};
    if(req?.status==="approved") return {t:"Leave",s:{background:"#fff1f2",color:"#be123c",border:"1.5px solid #fecdd3"},dis:false,leave:true};
    if(req?.status==="rejected") return {t:"Declined",s:{background:"#f5f3ee",color:"#999",border:"1.5px solid #e8e4dc"},dis:true};
    if(full) return {t:"Full",s:{background:"#f5f3ee",color:"#999",border:"1.5px solid #e8e4dc"},dis:true};
    return {t:game.join_type==="direct"?"Join game →":"Request spot →",s:{background:"#1a1a1a",color:"#fff",border:"none"},dis:false};
  };
  const btn=getBtn();

  return(
    <div className="card" style={{marginBottom:12,borderLeft:`3px solid ${color}`}}>
      <div style={{padding:"16px 18px"}}>

        {/* Sport + urgency */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${color}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
              {game.sport?.split(" ")[0]}
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:10,fontWeight:700,color,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,textTransform:"uppercase"}}>
                  {game.sport?.replace(/[^a-zA-Z\s]/g,"").trim()}
                </span>
                {urg&&<span style={{background:"#fef3c7",color:"#92400e",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4,fontFamily:"'DM Sans',sans-serif"}}>⚡ urgent</span>}
              </div>
              <div style={{fontSize:17,fontWeight:700,color:"#1a1a1a",fontFamily:"'Bricolage Grotesque',sans-serif",lineHeight:1.2}}>{game.title}</div>
            </div>
          </div>
          <span className="pill" style={{background:game.skill_level==="Competitive"?"#fff1f2":game.skill_level==="Casual"?"#f0fdf4":"#eff6ff",color:game.skill_level==="Competitive"?"#be123c":game.skill_level==="Casual"?"#15803d":"#1d4ed8",flexShrink:0,marginLeft:8}}>
            {game.skill_level}
          </span>
        </div>

        {/* Where + when */}
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
          <span style={{fontSize:13,color:"#666",fontFamily:"'DM Sans',sans-serif"}}>📍 {game.location}</span>
          <span style={{fontSize:13,color:"#666",fontFamily:"'DM Sans',sans-serif"}}>🗓 {game.game_date} · {game.game_time}</span>
        </div>

        {/* Slot bar */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:"#999",fontFamily:"'DM Sans',sans-serif"}}>{game.filled_slots} of {game.total_slots} joined</span>
            <span style={{fontSize:12,fontWeight:600,color:full?"#ef4444":color,fontFamily:"'DM Sans',sans-serif"}}>{full?"Full · no spots":""+`${game.total_slots-game.filled_slots} open`}</span>
          </div>
          <div style={{height:5,background:"#f0ede8",borderRadius:99}}>
            <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width .4s"}}/>
          </div>
        </div>

        {/* Tags */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          <span className="tag-chip">{game.cost_per_player===0?"Free":"₹"+game.cost_per_player}</span>
          <span className="tag-chip">{game.join_type==="direct"?"Open join":"Host approves"}</span>
          {(game.tags||[]).slice(0,2).map(t=><span key={t} className="tag-chip">{t}</span>)}
        </div>

        {/* Footer */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Av letter={game.host_avatar||"?"} color={color} size={28}/>
            <div>
              <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>by {game.host_name}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {(ok||host)&&<button onClick={()=>onContact(game,host)} style={{background:"#f5f3ee",color:"#1a1a1a",border:"1.5px solid #e8e4dc",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📞</button>}
            {host&&<button onClick={()=>onCancel(game)} style={{background:"#fff1f2",color:"#be123c",border:"1.5px solid #fecdd3",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>}
            {btn&&<button onClick={()=>!btn.dis&&(btn.leave?onLeave(game,req):onJoin(game))} style={{...btn.s,borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:btn.dis?"default":"pointer",fontFamily:"'DM Sans',sans-serif"}}>{btn.t}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── POST GAME (3 steps) ───────────────────────────────────────────────────────

function PostModal({onClose,onPost,user}){
  const [step,setStep]=useState(1);
  const [f,setF]=useState({sport:"⚽ Football",title:"",venue:"",area:AREAS[0],date:"",time:"",total:10,have:1,skill:"Casual",tags:"",join:"direct",cost:0,urgent:false,umins:15,uneed:2});
  const [loading,setLoading]=useState(false);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle"/>

        {/* Step tracker */}
        <div style={{marginBottom:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:700,color:"#1a1a1a"}}>Post a game</div>
            <button onClick={onClose} style={{background:"#f5f3ee",border:"1.5px solid #e8e4dc",borderRadius:8,width:30,height:30,fontSize:15,cursor:"pointer",color:"#666"}}>×</button>
          </div>
          <div style={{display:"flex",gap:5}}>
            {["Sport & place","Date & players","Access & cost"].map((lbl,i)=>(
              <div key={i} style={{flex:1}}>
                <div style={{height:3,borderRadius:99,background:i+1<=step?"#1a1a1a":"#e8e4dc",marginBottom:4,transition:"background .25s"}}/>
                <div style={{fontSize:10,color:i+1===step?"#1a1a1a":"#aaa",fontFamily:"'DM Sans',sans-serif",fontWeight:i+1===step?600:400}}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1 */}
        {step===1&&<div style={{animation:"in .25s"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:"#666",fontFamily:"'DM Sans',sans-serif",marginBottom:10,letterSpacing:.5,textTransform:"uppercase"}}>Pick a sport</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {SPORTS.map(sp=>{
                const full=`${sp.emoji} ${sp.name}`;
                const sel=f.sport===full;
                const c=SPORT_COLORS[sp.name]||"#2563eb";
                return <div key={sp.name} onClick={()=>s("sport",full)} style={{background:sel?`${c}08`:"#fafaf8",border:`2px solid ${sel?c:"#e8e4dc"}`,borderRadius:12,padding:"12px 6px",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{sp.emoji}</div>
                  <div style={{fontSize:11,fontWeight:600,color:sel?c:"#888",fontFamily:"'DM Sans',sans-serif"}}>{sp.name}</div>
                </div>;
              })}
            </div>
          </div>

          {[["Game title *","title","e.g. Evening 5-a-side"],["Venue *","venue","e.g. Green Turf, Navratan"]].map(([lbl,key,ph])=>(
            <div key={key} style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:6,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>{lbl}</label>
              <input className="input" placeholder={ph} value={f[key]} onChange={e=>s(key,e.target.value)}/>
            </div>
          ))}

          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:6,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Area</label>
            <select className="input" value={f.area} onChange={e=>s("area",e.target.value)}>{AREAS.map(a=><option key={a}>{a}</option>)}</select>
          </div>

          {/* Urgent toggle */}
          <div onClick={()=>s("urgent",!f.urgent)} style={{background:f.urgent?"#fffbeb":"#fafaf8",border:`2px solid ${f.urgent?"#fde68a":"#e8e4dc"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:24}}>⚡</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:f.urgent?"#92400e":"#333",fontFamily:"'DM Sans',sans-serif"}}>Last-minute game</div>
              <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>Need players right now? Mark as urgent</div>
            </div>
            <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${f.urgent?"#f59e0b":"#ccc"}`,background:f.urgent?"#f59e0b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {f.urgent&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
            </div>
          </div>
          {f.urgent&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:"#92400e",fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>Urgent details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:11,color:"#aaa",display:"block",marginBottom:5,fontFamily:"'DM Sans',sans-serif"}}>Need in (mins)</label><input type="number" className="input" value={f.umins} min={5} onChange={e=>s("umins",+e.target.value)} style={{textAlign:"center"}}/></div>
              <div><label style={{fontSize:11,color:"#aaa",display:"block",marginBottom:5,fontFamily:"'DM Sans',sans-serif"}}>Players needed</label><input type="number" className="input" value={f.uneed} min={1} onChange={e=>s("uneed",+e.target.value)} style={{textAlign:"center"}}/></div>
            </div>
          </div>}

          <button className="btn btn-primary" onClick={()=>{if(!f.title.trim()||!f.venue.trim())return alert("Fill in title and venue");setStep(2);}}>Next →</button>
        </div>}

        {/* STEP 2 */}
        {step===2&&<div style={{animation:"in .25s"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["Date *","date","date"],["Time *","time","time"],["Total players","total","number"],["You already have","have","number"]].map(([lbl,key,type])=>(
              <div key={key}>
                <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:6,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>{lbl}</label>
                <input type={type} className="input" value={f[key]} min={key==="total"?2:1} max={key==="total"?30:undefined} onChange={e=>s(key,type==="number"?+e.target.value:e.target.value)} style={{textAlign:type==="number"?"center":"left"}}/>
              </div>
            ))}
          </div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:8,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Skill level</label>
            <div style={{display:"flex",gap:8}}>
              {["Beginner","Casual","Competitive"].map(lv=>{
                const sel=f.skill===lv;
                return <button key={lv} onClick={()=>s("skill",lv)} style={{flex:1,padding:"10px 0",borderRadius:10,border:`2px solid ${sel?"#1a1a1a":"#e8e4dc"}`,background:sel?"#1a1a1a":"#fafaf8",color:sel?"#fff":"#666",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>{lv}</button>;
              })}
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:6,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Tags</label>
            <input className="input" placeholder="Floodlit, Turf, Mixed…" value={f.tags} onChange={e=>s("tags",e.target.value)}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{flex:2}} onClick={()=>{if(!f.date||!f.time)return alert("Pick date and time");setStep(3);}}>Next →</button>
          </div>
        </div>}

        {/* STEP 3 */}
        {step===3&&<div style={{animation:"in .25s"}}>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:8,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Cost per player (₹)</label>
            <input type="number" className="input" value={f.cost} min={0} onChange={e=>s("cost",+e.target.value)} placeholder="0 = free" style={{textAlign:"center",fontSize:24,fontWeight:700}}/>
            <div style={{fontSize:12,color:"#aaa",marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>Leave at 0 if the game is free</div>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:10,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Who can join?</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{val:"direct",icon:"⚡",t:"Anyone",d:"Players join instantly"},{val:"request",icon:"🔒",t:"You approve",d:"Review each request"}].map(opt=>{
                const sel=f.join===opt.val;
                return <div key={opt.val} onClick={()=>s("join",opt.val)} style={{border:`2px solid ${sel?"#1a1a1a":"#e8e4dc"}`,borderRadius:12,padding:"16px 12px",cursor:"pointer",background:sel?"#1a1a1a":"#fafaf8",transition:"all .15s"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{opt.icon}</div>
                  <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:700,color:sel?"#fff":"#1a1a1a"}}>{opt.t}</div>
                  <div style={{fontSize:12,color:sel?"#aaa":"#999",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{opt.d}</div>
                </div>;
              })}
            </div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(2)}>← Back</button>
            <button className="btn btn-primary" style={{flex:2,opacity:loading?.7:1}} onClick={async()=>{setLoading(true);await onPost(f);setLoading(false);}} disabled={loading}>{loading?"Posting…":"Post game 🚀"}</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── JOIN MODAL ────────────────────────────────────────────────────────────────

function JoinModal({game,onClose,onConfirm,user}){
  const [note,setNote]=useState("");
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const direct=game.join_type==="direct";
  const color=getSC(game.sport);

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle"/>
        {done?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:54,marginBottom:14,animation:"bob 1s infinite"}}>{direct?"🎉":"📬"}</div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:24,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>{direct?`You're in!`:"Request sent!"}</div>
            <p style={{color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.7,marginBottom:24}}>{direct?"You're on the team. Contact info shows on the game card.":` Waiting on ${game.host_name}. You'll get notified.`}</p>
            {game.cost_per_player>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px",marginBottom:20,fontSize:13,fontWeight:600,color:"#92400e",fontFamily:"'DM Sans',sans-serif"}}>Pay ₹{game.cost_per_player} to host at venue</div>}
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ):(
          <>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
              <div style={{width:46,height:46,borderRadius:12,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{game.sport?.split(" ")[0]}</div>
              <div>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:700,color:"#1a1a1a"}}>{game.title}</div>
                <div style={{fontSize:13,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>📍 {game.location}</div>
              </div>
            </div>

            {game.cost_per_player>0?(
              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"14px",marginBottom:14}}>
                <div style={{fontSize:11,color:"#92400e",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>COST PER PLAYER</div>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:28,fontWeight:700,color:"#1a1a1a"}}>₹{game.cost_per_player}</div>
                <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>Pay at the venue</div>
              </div>
            ):(
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:600,color:"#15803d",fontFamily:"'DM Sans',sans-serif"}}>Free to join</div>
              </div>
            )}

            <div style={{background:direct?"#eff6ff":"#faf5ff",border:`1px solid ${direct?"#bfdbfe":"#e9d5ff"}`,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:600,color:direct?"#1d4ed8":"#7c3aed",fontFamily:"'DM Sans',sans-serif"}}>{direct?"⚡ You'll be added right away":"🔒 Host reviews first"}</div>
            </div>

            {!direct&&<div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:6,fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,textTransform:"uppercase"}}>Message to host (optional)</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Hey! I play casually and would love to join…" rows={3} className="input" style={{resize:"none",lineHeight:1.5}}/>
            </div>}

            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={onClose}>Cancel</button>
              <button onClick={async()=>{setLoading(true);await onConfirm(game,note);setLoading(false);setDone(true);}} style={{flex:2,background:direct?"#1a1a1a":"#4c1d95",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                {loading?"…":direct?"Confirm join ✓":"Send request →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────

function ConfirmModal({title,message,confirmLabel,onConfirm,onClose}){
  const [loading,setLoading]=useState(false);
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"50vh"}}>
        <div className="handle"/>
        <div style={{textAlign:"center",padding:"10px 0 20px"}}>
          <div style={{fontSize:40,marginBottom:14}}>⚠️</div>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>{title}</div>
          <p style={{color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.6,marginBottom:24}}>{message}</p>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1}} onClick={onClose}>Keep it</button>
            <button style={{flex:2,background:"#ef4444",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={async()=>{setLoading(true);await onConfirm();setLoading(false);}}>
              {loading?"…":confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REQUESTS PANEL ────────────────────────────────────────────────────────────

function ReqPanel({onClose,onApprove,onReject,requests,games}){
  const [tab,setTab]=useState("pending");
  const p=requests.filter(r=>r.status==="pending");
  const a=requests.filter(r=>r.status==="approved");
  const d=requests.filter(r=>r.status==="rejected");
  const shown=tab==="pending"?p:tab==="approved"?a:d;
  const getG=id=>games.find(g=>g.id===id);

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:700,color:"#1a1a1a"}}>Join requests</div>
          <button onClick={onClose} style={{background:"#f5f3ee",border:"1.5px solid #e8e4dc",borderRadius:8,width:30,height:30,fontSize:15,cursor:"pointer",color:"#666"}}>×</button>
        </div>

        <div style={{display:"flex",borderBottom:"1.5px solid #e8e4dc",marginBottom:16}}>
          {[["pending",p.length],["approved",a.length],["declined",d.length]].map(([t,c])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:tab===t?"#1a1a1a":"#aaa",fontWeight:tab===t?700:500,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",borderBottom:`2px solid ${tab===t?"#1a1a1a":"transparent"}`,marginBottom:-2,textTransform:"capitalize"}}>
              {t}{c>0&&` (${c})`}
            </button>
          ))}
        </div>

        {shown.length===0?(
          <div style={{textAlign:"center",padding:"40px 0",color:"#aaa"}}>
            <div style={{fontSize:32,marginBottom:8}}>📭</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14}}>No {tab} requests</div>
          </div>
        ):shown.map(r=>{
          const g=getG(r.game_id);
          return(
            <div key={r.id} style={{background:"#fafaf8",borderRadius:12,padding:"14px",marginBottom:10,border:"1.5px solid #e8e4dc"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:r.note?10:tab==="pending"?10:0}}>
                <Av letter={r.user_name[0]} color="#2563eb" size={38}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{r.user_name}</div>
                  <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{g?.title} · {timeAgo(r.created_at)}</div>
                </div>
                {tab!=="pending"&&<span style={{fontSize:12,fontWeight:600,color:r.status==="approved"?"#15803d":"#ef4444",fontFamily:"'DM Sans',sans-serif"}}>{r.status==="approved"?"✓ OK":"✗ No"}</span>}
              </div>
              {r.note&&<div style={{background:"#fff",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",border:"1px solid #e8e4dc"}}>"{r.note}"</div>}
              {tab==="pending"&&<div style={{display:"flex",gap:8}}>
                <button onClick={()=>onReject(r)} style={{flex:1,background:"#fff",color:"#ef4444",border:"1.5px solid #fecdd3",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Decline</button>
                <button onClick={()=>onApprove(r)} style={{flex:2,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✓ Approve</button>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CONTACT MODAL ─────────────────────────────────────────────────────────────

function ContactModal({data,onClose}){
  if(!data)return null;
  const{game,contacts,isHost}=data;
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:700,color:"#1a1a1a"}}>{isHost?"Your players":"Host contact"}</div>
            <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{game.title}</div>
          </div>
          <button onClick={onClose} style={{background:"#f5f3ee",border:"1.5px solid #e8e4dc",borderRadius:8,width:30,height:30,fontSize:15,cursor:"pointer",color:"#666"}}>×</button>
        </div>
        {contacts.length===0?(
          <div style={{textAlign:"center",padding:"30px 0",color:"#aaa"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><div style={{fontSize:14}}>No approved players yet</div></div>
        ):contacts.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"#fafaf8",borderRadius:12,padding:"14px",marginBottom:10,border:"1.5px solid #e8e4dc"}}>
            <Av letter={c.avatar||c.name?.[0]||"?"} color="#2563eb" size={42}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{c.name}</div>
              <div style={{fontSize:13,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{c.phone?`+91 ${c.phone}`:"No number on file"}</div>
            </div>
            {c.phone&&<a href={`tel:+91${c.phone}`} style={{background:"#1a1a1a",color:"#fff",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}>Call</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EXPLORE ───────────────────────────────────────────────────────────────────

function Explore({games,onJoin,uid,myReqs,onContact,onCancel,onLeave}){
  const [sel,setSel]=useState(null);
  return(
    <div className="page" style={{paddingTop:20}}>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Explore sports</div>
      <div style={{fontSize:13,color:"#aaa",fontFamily:"'DM Sans',sans-serif",marginBottom:18}}>Browse by sport in Udaipur</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
        {SPORTS.map(sp=>{
          const c=SPORT_COLORS[sp.name]||"#2563eb";
          const count=games.filter(g=>g.sport?.includes(sp.name)).length;
          const active=sel===sp.name;
          return <div key={sp.name} onClick={()=>setSel(active?null:sp.name)} style={{background:active?`${c}08`:"#fff",border:`2px solid ${active?c:"#e8e4dc"}`,borderRadius:14,padding:"16px 10px",cursor:"pointer",textAlign:"center",transition:"all .15s",boxShadow:active?`0 2px 12px ${c}22`:"none"}}>
            <div style={{fontSize:28,marginBottom:6}}>{sp.emoji}</div>
            <div style={{fontSize:12,fontWeight:600,color:active?c:"#555",fontFamily:"'DM Sans',sans-serif"}}>{sp.name}</div>
            <div style={{fontSize:11,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>{count} game{count!==1?"s":""}</div>
          </div>;
        })}
      </div>
      {sel&&(
        <>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>{sel} games</div>
          {games.filter(g=>g.sport?.includes(sel)).length===0
            ?<div style={{textAlign:"center",padding:"40px 0",color:"#aaa"}}><div style={{fontSize:32,marginBottom:8}}>🏟</div><div style={{fontSize:14}}>No {sel} games yet</div></div>
            :games.filter(g=>g.sport?.includes(sel)).map(g=><GameCard key={g.id} game={g} onJoin={onJoin} uid={uid} myReqs={myReqs} onContact={onContact} onCancel={onCancel} onLeave={onLeave}/>)
          }
        </>
      )}
    </div>
  );
}

// ── ACTIVITY ──────────────────────────────────────────────────────────────────

function Activity({myReqs,hostReqs,games,onApprove,onReject}){
  const getG=id=>games.find(g=>g.id===id);
  return(
    <div className="page" style={{paddingTop:20}}>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Activity</div>
      <div style={{fontSize:13,color:"#aaa",fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>Your requests and notifications</div>

      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:700,color:"#333",marginBottom:10}}>My requests</div>
      {myReqs.length===0
        ?<div style={{background:"#fafaf8",borderRadius:12,padding:"20px",textAlign:"center",color:"#aaa",marginBottom:20,border:"1.5px solid #e8e4dc"}}><div style={{fontSize:28,marginBottom:6}}>🎮</div><div style={{fontSize:13}}>No requests sent yet</div></div>
        :<div style={{marginBottom:20}}>{myReqs.map(r=>{
          const g=getG(r.game_id);
          return <div key={r.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1.5px solid #e8e4dc",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:20}}>{g?.sport?.split(" ")[0]||"🎮"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{g?.title||"Game"}</div>
              <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{timeAgo(r.created_at)}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:5,fontFamily:"'DM Sans',sans-serif",background:r.status==="approved"?"#f0fdf4":r.status==="rejected"?"#fff1f2":"#fffbeb",color:r.status==="approved"?"#15803d":r.status==="rejected"?"#be123c":"#92400e"}}>
              {r.status==="approved"?"✓ In":r.status==="rejected"?"✗ Out":"Pending"}
            </span>
          </div>;
        })}</div>
      }

      {hostReqs.length>0&&<>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:700,color:"#333",marginBottom:10}}>For your games</div>
        {hostReqs.map(r=>{
          const g=getG(r.game_id);
          return <div key={r.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:10,border:`1.5px solid ${r.status==="pending"?"#fde68a":"#e8e4dc"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:r.status==="pending"?10:0}}>
              <Av letter={r.user_name[0]} color="#2563eb" size={36}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{r.user_name}</div>
                <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{g?.title} · {timeAgo(r.created_at)}</div>
              </div>
              {r.status!=="pending"&&<span style={{fontSize:12,fontWeight:600,color:r.status==="approved"?"#15803d":"#ef4444"}}>{r.status==="approved"?"✓":"✗"}</span>}
            </div>
            {r.note&&<div style={{background:"#fafaf8",borderRadius:8,padding:"8px 10px",marginBottom:8,fontSize:12,color:"#555",fontStyle:"italic",border:"1px solid #e8e4dc",fontFamily:"'DM Sans',sans-serif"}}>"{r.note}"</div>}
            {r.status==="pending"&&<div style={{display:"flex",gap:8}}>
              <button onClick={()=>onReject(r)} style={{flex:1,background:"#fff1f2",color:"#be123c",border:"1px solid #fecdd3",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Decline</button>
              <button onClick={()=>onApprove(r)} style={{flex:2,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✓ Approve</button>
            </div>}
          </div>;
        })}
      </>}
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

function Profile({user,profile,myGames,onLogout}){
  return(
    <div className="page" style={{paddingTop:20}}>
      <div style={{background:"#fff",border:"1.5px solid #e8e4dc",borderRadius:20,padding:"22px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{width:56,height:56,borderRadius:16,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#fff",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
            {(profile?.avatar||user.email[0]).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:700,color:"#1a1a1a"}}>{profile?.name||user.email}</div>
            <div style={{fontSize:13,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{user.email}</div>
            {profile?.phone&&<div style={{fontSize:13,color:"#888",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>+91 {profile.phone}{profile.phone_verified&&<span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",borderRadius:4,padding:"1px 5px",fontWeight:700,border:"1px solid #bbf7d0"}}>✓</span>}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[{v:myGames.length,l:"Hosted"},{v:"—",l:"Joined"},{v:"—",l:"Activity"}].map(s=>(
            <div key={s.l} style={{background:"#f5f3ee",borderRadius:12,padding:"14px 0",textAlign:"center",border:"1px solid #e8e4dc"}}>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:24,fontWeight:700,color:"#1a1a1a"}}>{s.v}</div>
              <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {myGames.length>0&&<div style={{marginBottom:16}}>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:700,color:"#333",marginBottom:10}}>Your games</div>
        {myGames.map(g=>{
          const c=getSC(g.sport);
          return <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1.5px solid #e8e4dc",borderLeft:`3px solid ${c}`}}>
            <div style={{fontSize:20}}>{g.sport?.split(" ")[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{g.title}</div>
              <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{g.area} · {g.game_date}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:700,color:c,fontFamily:"'DM Sans',sans-serif"}}>{g.filled_slots}/{g.total_slots}</div>
              {g.cost_per_player>0&&<div style={{fontSize:11,color:"#aaa"}}>₹{g.cost_per_player}</div>}
            </div>
          </div>;
        })}
      </div>}

      <button onClick={async()=>{await supabase.auth.refreshSession();window.location.reload();}} className="btn btn-ghost" style={{marginBottom:10}}>🔄 Refresh session</button>
      <button onClick={onLogout} style={{width:"100%",background:"#fff",color:"#ef4444",border:"1.5px solid #fecdd3",borderRadius:12,padding:"13px 0",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function SquadUp(){
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [games,setGames]=useState([]);
  const [requests,setRequests]=useState([]);
  const [tab,setTab]=useState("home");
  const [sport,setSport]=useState("All");
  const [area,setArea]=useState("All");
  const [search,setSearch]=useState("");
  const [showPost,setPost]=useState(false);
  const [joining,setJoining]=useState(null);
  const [showReqs,setReqs]=useState(false);
  const [contact,setContact]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState({msg:"",type:""});

  const toast2=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast({msg:"",type:""}),3000);};

  useEffect(()=>{requestNotif();},[]);

  useEffect(()=>{
    supabase.auth.refreshSession().then(({data,error})=>{
      if(error||!data?.session){supabase.auth.signOut();setLoading(false);return;}
      setUser(data.session.user);loadProfile(data.session.user.id);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((ev,session)=>{
      if(ev==="SIGNED_IN"||ev==="TOKEN_REFRESHED"){if(session?.user){setUser(session.user);loadProfile(session.user.id);}}
      else if(ev==="SIGNED_OUT"){setUser(null);setProfile(null);setLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const loadProfile=async id=>{const{data}=await supabase.from("profiles").select("*").eq("id",id).single();setProfile(data);setLoading(false);};

  useEffect(()=>{if(!user)return;loadGames();loadRequests();},[user]);

  useEffect(()=>{
    if(!user)return;
    const ch=supabase.channel("g").on("postgres_changes",{event:"INSERT",schema:"public",table:"games"},p=>{if(p.new.host_id!==user.id){setGames(prev=>[p.new,...prev]);sendNotif("New game posted 🏟",p.new.title+" — "+p.new.area);}}).on("postgres_changes",{event:"DELETE",schema:"public",table:"games"},p=>{setGames(prev=>prev.filter(g=>g.id!==p.old.id));sendNotif("Game cancelled","A game you were part of was cancelled.");}).subscribe();
    return()=>supabase.removeChannel(ch);
  },[user]);

  useEffect(()=>{
    if(!user)return;
    const ch=supabase.channel("r").on("postgres_changes",{event:"UPDATE",schema:"public",table:"requests"},p=>{if(p.new.user_id===user.id){loadRequests();if(p.new.status==="approved"){toast2("Your request was approved! ✅");sendNotif("Approved! ✅","You got a spot. Check contact info on the card.");}else if(p.new.status==="rejected"){toast2("Request declined","error");sendNotif("Request declined","The host couldn't take you this time.");}}}).subscribe();
    return()=>supabase.removeChannel(ch);
  },[user]);

  const loadGames=async()=>{const{data}=await supabase.from("games").select("*").order("created_at",{ascending:false});setGames(data||[]);};
  const loadRequests=async()=>{const{data}=await supabase.from("requests").select("*").order("created_at",{ascending:false});setRequests(data||[]);};

  const handlePost=async f=>{
    const color=getSC(f.sport);
    const title=f.urgent?`⚡ Need ${f.uneed} in ${f.umins}mins — ${f.title}`:f.title;
    const{error}=await supabase.from("games").insert([{sport:f.sport,title,location:`${f.venue}, ${f.area}`,area:f.area,game_date:f.date,game_time:f.time,total_slots:+f.total,filled_slots:+f.have,skill_level:f.skill,host_name:profile?.name||user.email,host_id:user.id,host_avatar:profile?.avatar||user.email[0].toUpperCase(),color,tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[],join_type:f.join,cost_per_player:+f.cost}]);
    if(error){console.error(error);toast2("Failed to post. Try again.","error");return;}
    toast2("Game posted! 🎉");setPost(false);loadGames();
  };

  const handleJoin=async(game,note)=>{
    if(game.join_type==="direct"){const{error}=await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);if(error){toast2("Failed to join","error");return;}toast2("Joined! See you there 🏟");}
    else{const{error}=await supabase.from("requests").insert([{game_id:game.id,user_id:user.id,user_name:profile?.name||user.email,note:note||null,status:"pending"}]);if(error){toast2("Failed to send request","error");return;}toast2("Request sent! 📬");}
    setJoining(null);loadGames();loadRequests();
  };

  const handleCancel=game=>{
    setConfirm({title:"Cancel this game?",message:`"${game.title}" will be removed and players will be notified.`,confirmLabel:"Yes, cancel it",onConfirm:async()=>{await supabase.from("requests").delete().eq("game_id",game.id);const{error}=await supabase.from("games").delete().eq("id",game.id);if(error){toast2("Failed to cancel","error");return;}toast2("Game cancelled.");setConfirm(null);loadGames();loadRequests();}});
  };

  const handleLeave=(game,req)=>{
    setConfirm({title:"Leave this game?",message:`You'll lose your spot in "${game.title}" and the host will be notified.`,confirmLabel:"Yes, leave",onConfirm:async()=>{if(req)await supabase.from("requests").update({status:"left"}).eq("id",req.id);if(game.join_type==="direct"&&game.filled_slots>0)await supabase.from("games").update({filled_slots:game.filled_slots-1}).eq("id",game.id);toast2("Left the game.");setConfirm(null);loadGames();loadRequests();}});
  };

  const handleApprove=async req=>{
    const{error}=await supabase.from("requests").update({status:"approved"}).eq("id",req.id);
    if(error){toast2(error.message?.includes("JWT")?"Session expired — sign out and back in":"Failed to approve","error");return;}
    const game=games.find(g=>g.id===req.game_id);
    if(game)await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);
    toast2(`${req.user_name} approved!`);loadGames();loadRequests();
  };

  const handleReject=async req=>{
    const{error}=await supabase.from("requests").update({status:"rejected"}).eq("id",req.id);
    if(error){toast2(error.message?.includes("JWT")?"Session expired — sign out and back in":"Failed to decline","error");return;}
    toast2("Request declined.");loadRequests();
  };

  const handleContact=async(game,isHost)=>{
    if(isHost){const approved=requests.filter(r=>r.game_id===game.id&&r.status==="approved");const contacts=await Promise.all(approved.map(async r=>{const{data}=await supabase.from("profiles").select("name,phone,avatar").eq("id",r.user_id).single();return data||{name:r.user_name,phone:null,avatar:r.user_name[0]};}));setContact({game,contacts,isHost:true});}
    else{const{data}=await supabase.from("profiles").select("name,phone,avatar").eq("id",game.host_id).single();setContact({game,contacts:[data||{name:game.host_name,phone:null}],isHost:false});}
  };

  const myGames=games.filter(g=>g.host_id===user?.id);
  const myReqs=requests.filter(r=>r.user_id===user?.id&&r.status!=="left");
  const hostReqs=requests.filter(r=>{const g=games.find(x=>x.id===r.game_id);return g?.host_id===user?.id;});
  const pending=hostReqs.filter(r=>r.status==="pending").length;
  const actN=pending+myReqs.filter(r=>r.status==="approved").length;

  const filtered=games.filter(g=>{
    const sm=sport==="All"||g.sport?.includes(sport);
    const am=area==="All"||g.area===area;
    const se=!search||g.title?.toLowerCase().includes(search.toLowerCase())||g.location?.toLowerCase().includes(search.toLowerCase());
    return sm&&am&&se;
  });

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#f5f3ee",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONTS} rel="stylesheet"/>
      <style>{G}</style>
      <div style={{width:52,height:52,borderRadius:16,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🏟️</div>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:28,fontWeight:700,color:"#1a1a1a",letterSpacing:-0.5}}>SquadUp</div>
      <Spin/>
    </div>
  );

  if(!user)return(<><link rel="preconnect" href="https://fonts.googleapis.com"/><link href={FONTS} rel="stylesheet"/><AuthPage onAuth={u=>{setUser(u);loadProfile(u.id);}}/></>);

  return(
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONTS} rel="stylesheet"/>
      <style>{G}</style>
      <div style={{minHeight:"100vh",background:"#f5f3ee",fontFamily:"'DM Sans',sans-serif"}}>

        {/* ── HOME ── */}
        {tab==="home"&&<div className="page">
          {/* Header */}
          <div style={{paddingTop:20,paddingBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏟️</div>
              <div>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:700,color:"#1a1a1a",lineHeight:1,letterSpacing:-0.3}}>SquadUp</div>
                <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>Udaipur · Find your game</div>
              </div>
            </div>
            <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setReqs(true)}>
              <div style={{width:38,height:38,borderRadius:10,background:"#fff",border:"1.5px solid #e8e4dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🔔</div>
              {pending>0&&<div className="badge">{pending}</div>}
            </div>
          </div>

          {/* Hero */}
          <div style={{background:"#1a1a1a",borderRadius:18,padding:"22px 22px 24px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-16,top:-16,fontSize:100,opacity:.05}}>⚽</div>
            <div style={{fontSize:12,color:"#666",fontWeight:500,fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>Hey {(profile?.name||user.email).split(" ")[0]} 👋</div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:26,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:18,letterSpacing:-0.3}}>
              Find players nearby.<br/>
              <span style={{color:"#a3a3a3"}}>Complete your squad.</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setSport("All")} style={{background:"#fff",color:"#1a1a1a",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Join a game</button>
              <button onClick={()=>setPost(true)} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Create</button>
            </div>
          </div>

          {/* Search */}
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,opacity:.35}}>🔍</span>
            <input className="input" placeholder="Search games, venues…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:40}}/>
          </div>

          {/* Sport chips */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:10,scrollbarWidth:"none"}}>
            {["All",...SPORTS.map(s=>s.name)].map(sp=>{
              const sel=sport===sp;
              const c=SPORT_COLORS[sp]||"#1a1a1a";
              return <button key={sp} onClick={()=>setSport(sp)} style={{flexShrink:0,padding:"6px 14px",borderRadius:8,border:`1.5px solid ${sel?c:"#e8e4dc"}`,background:sel?`${c}0f`:"#fff",color:sel?c:"#666",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",whiteSpace:"nowrap"}}>
                {sp==="All"?"All sports":`${SPORTS.find(s=>s.name===sp)?.emoji||""} ${sp}`}
              </button>;
            })}
          </div>

          {/* Area chips */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:20,scrollbarWidth:"none"}}>
            {["All",...AREAS].map(a=>{
              const sel=area===a;
              return <button key={a} onClick={()=>setArea(a)} style={{flexShrink:0,padding:"5px 12px",borderRadius:8,border:`1.5px solid ${sel?"#1a1a1a":"#e8e4dc"}`,background:sel?"#1a1a1a":"#fff",color:sel?"#fff":"#666",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                {a==="All"?"All areas":a}
              </button>;
            })}
          </div>

          {/* Heading */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:700,color:"#1a1a1a"}}>Games near you</div>
            <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{filtered.length} found</div>
          </div>

          {/* Urgent first */}
          {filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).length>0&&<div style={{marginBottom:8}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fef3c7",border:"1px solid #fde68a",borderRadius:6,padding:"3px 8px",marginBottom:10,fontSize:11,fontWeight:700,color:"#92400e",fontFamily:"'DM Sans',sans-serif"}}>⚡ Urgent — need players now</div>
            {filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).map(g=><GameCard key={g.id} game={g} onJoin={setJoining} uid={user.id} myReqs={myReqs} onContact={handleContact} onCancel={handleCancel} onLeave={handleLeave}/>)}
          </div>}

          {/* Regular */}
          {filtered.filter(g=>!(g.is_urgent||g.title?.startsWith("⚡"))).length===0&&filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).length===0
            ?<div style={{textAlign:"center",padding:"60px 0",color:"#aaa"}}>
              <div style={{fontSize:48,marginBottom:12}}>🏟️</div>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:700,color:"#555",marginBottom:6}}>No games yet</div>
              <div style={{fontSize:14,marginBottom:20}}>Be the first to post one!</div>
              <button className="btn btn-primary" style={{width:"auto",padding:"12px 24px"}} onClick={()=>setPost(true)}>Post a game</button>
            </div>
            :filtered.filter(g=>!(g.is_urgent||g.title?.startsWith("⚡"))).map(g=><GameCard key={g.id} game={g} onJoin={setJoining} uid={user.id} myReqs={myReqs} onContact={handleContact} onCancel={handleCancel} onLeave={handleLeave}/>)
          }
        </div>}

        {tab==="explore"&&<Explore games={games} onJoin={setJoining} uid={user.id} myReqs={myReqs} onContact={handleContact} onCancel={handleCancel} onLeave={handleLeave}/>}
        {tab==="activity"&&<Activity myReqs={myReqs} hostReqs={hostReqs} games={games} onApprove={handleApprove} onReject={handleReject}/>}
        {tab==="profile"&&<Profile user={user} profile={profile} myGames={myGames} onLogout={()=>supabase.auth.signOut()}/>}

        {/* Bottom nav — icons only, no labels */}
        <nav className="nav">
          {[{id:"home",icon:"🏠"},{id:"explore",icon:"🔭"}].map(n=>(
            <button key={n.id} className="nav-btn" onClick={()=>setTab(n.id)} style={{opacity:tab===n.id?1:.4}}>
              <span style={{fontSize:22,filter:tab===n.id?"none":"grayscale(1)"}}>{n.icon}</span>
            </button>
          ))}
          <button className="nav-center" onClick={()=>setPost(true)}>+</button>
          {[{id:"activity",icon:"⚡",badge:actN},{id:"profile",icon:"👤"}].map(n=>(
            <button key={n.id} className="nav-btn" onClick={()=>setTab(n.id)} style={{opacity:tab===n.id?1:.4,position:"relative"}}>
              <span style={{fontSize:22,filter:tab===n.id?"none":"grayscale(1)"}}>{n.icon}</span>
              {n.badge>0&&<div className="badge">{n.badge}</div>}
            </button>
          ))}
        </nav>

        {/* Modals */}
        {showPost&&<PostModal onClose={()=>setPost(false)} onPost={handlePost} user={{name:profile?.name||user.email}}/>}
        {joining&&<JoinModal game={joining} onClose={()=>setJoining(null)} onConfirm={handleJoin} user={{name:profile?.name||user.email}}/>}
        {showReqs&&<ReqPanel onClose={()=>setReqs(false)} onApprove={handleApprove} onReject={handleReject} requests={hostReqs} games={games}/>}
        {contact&&<ContactModal data={contact} onClose={()=>setContact(null)}/>}
        {confirm&&<ConfirmModal {...confirm} onClose={()=>setConfirm(null)}/>}
        <Toast msg={toast.msg} type={toast.type}/>
      </div>
    </>
  );
}