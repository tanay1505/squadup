import { useState, useEffect, useRef } from "react";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SPORTS = [
  { emoji:"⚽", name:"Football" },
  { emoji:"🏏", name:"Cricket" },
  { emoji:"🏀", name:"Basketball" },
  { emoji:"🎾", name:"Tennis" },
  { emoji:"🤸", name:"Badminton" },
  { emoji:"🏐", name:"Volleyball" },
  { emoji:"🏓", name:"Table Tennis" },
  { emoji:"🏑", name:"Hockey" },
  { emoji:"🥒", name:"Pickleball" },
];

const UDAIPUR_AREAS = [
  "Ashok Nagar","Navratan","Hiran Magri","Sector 4","Sector 11",
  "Pratap Nagar","Suraj Pol","Chetak Circle","Bhupalpura",
  "Fatehpura","Shobhagpura","Ambamata","Bhupal Colony","Clock Tower Area"
];

const SPORT_COLORS = {
  Football:"#e11d48", Cricket:"#f97316", Basketball:"#f59e0b",
  Tennis:"#22c55e", Badminton:"#06b6d4", Volleyball:"#8b5cf6",
  "Table Tennis":"#ec4899", Hockey:"#14b8a6", Pickleball:"#a855f7",
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  ::-webkit-scrollbar { display: none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
  .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important; }
  .nav-btn { transition: all 0.2s; }
  .nav-btn:hover { transform: translateY(-1px); }
  .btn-primary {
    background: linear-gradient(135deg, #e11d48, #f43f5e);
    color: #fff; border: none; border-radius: 14px;
    padding: 14px 24px; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    width: 100%; transition: all 0.2s; letter-spacing: 0.3px;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(225,29,72,0.4); }
  .btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; box-shadow: none; }
  .input-dark {
    background: #16161f; border: 1.5px solid #2a2a3a;
    color: #fff; border-radius: 12px; padding: 13px 16px;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    width: 100%; outline: none; transition: border-color 0.2s;
  }
  .input-dark:focus { border-color: #e11d48; }
  .input-dark::placeholder { color: #555; }
  .tab-active { border-bottom: 2px solid #e11d48; color: #e11d48 !important; }
  .chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; border: 1.5px solid transparent; font-family: 'DM Sans', sans-serif; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: flex-end; justify-content: center; z-index: 999; backdrop-filter: blur(6px); animation: fadeIn 0.2s; }
  .modal-sheet { background: #13131a; border-radius: 24px 24px 0 0; width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s; padding: 28px 24px 40px; }
  .modal-handle { width: 40px; height: 4px; background: #333; border-radius: 99px; margin: 0 auto 24px; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; animation: pulse 1.5s infinite; }
  .urgent-badge { background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 99px; letter-spacing: 0.5px; animation: pulse 2s infinite; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getSportColor(sportStr) {
  const name = sportStr?.replace(/[^a-zA-Z\s]/g,'').trim();
  return SPORT_COLORS[name] || "#e11d48";
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff/60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:96, left:"50%", transform:"translateX(-50%)",
      background: type==="error" ? "#dc2626" : "#16a34a",
      color:"#fff", padding:"12px 22px", borderRadius:14, fontSize:13,
      fontWeight:600, fontFamily:"'DM Sans',sans-serif",
      boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:9999, whiteSpace:"nowrap",
      animation:"slideUp 0.3s",
    }}>
      {type==="error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

function Spinner({ size=32, color="#e11d48" }) {
  return (
    <div style={{ width:size, height:size, border:`3px solid #1a1a2a`, borderTop:`3px solid ${color}`, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
  );
}

function Avatar({ letter, color="#e11d48", size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(135deg, ${color}33, ${color}55)`,
      border:`2px solid ${color}66`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color, fontFamily:"'DM Sans',sans-serif",
    }}>{letter?.toUpperCase()}</div>
  );
}

function PlayerAvatars({ count, color }) {
  const shown = Math.min(count, 4);
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      {Array.from({length:shown}).map((_,i)=>(
        <div key={i} style={{
          width:26, height:26, borderRadius:"50%", marginLeft: i===0?0:-8,
          background:`linear-gradient(135deg,${color}44,${color}88)`,
          border:`2px solid #13131a`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:700, color, fontFamily:"'DM Sans',sans-serif",
        }}>{String.fromCharCode(65+i)}</div>
      ))}
      {count > 4 && (
        <div style={{ width:26, height:26, borderRadius:"50%", marginLeft:-8, background:"#1a1a2a", border:"2px solid #13131a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#9ca3af" }}>+{count-4}</div>
      )}
    </div>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────

function GameCard({ game, onJoin, currentUserId, myRequests, onViewContact }) {
  const color = getSportColor(game.sport);
  const isFull = game.filled_slots >= game.total_slots;
  const isHost = game.host_id === currentUserId;
  const myReq  = myRequests?.find(r=>r.game_id===game.id);
  const isApproved = myReq?.status==="approved";
  const isUrgent = game.is_urgent;
  const pct = Math.min((game.filled_slots/game.total_slots)*100,100);

  const getBtn = () => {
    if (isHost) return { label:"Your Game", style:{ background:"#1a1a2a", color:"#666", border:"none" }, disabled:true };
    if (myReq?.status==="pending") return { label:"⏳ Pending", style:{ background:"#2a2010", color:"#f59e0b", border:"1px solid #f59e0b44" }, disabled:true };
    if (myReq?.status==="approved") return { label:"✅ Joined", style:{ background:"#0a2010", color:"#22c55e", border:"1px solid #22c55e44" }, disabled:true };
    if (myReq?.status==="rejected") return { label:"Declined", style:{ background:"#1a1a2a", color:"#666", border:"none" }, disabled:true };
    if (isFull) return { label:"Full", style:{ background:"#1a1a2a", color:"#666", border:"none" }, disabled:true };
    return {
      label: game.join_type==="direct" ? "Join Game" : "Request Spot",
      style:{ background:`linear-gradient(135deg,${color},${color}cc)`, color:"#fff", border:"none" },
      disabled:false
    };
  };

  const btn = getBtn();

  return (
    <div className="card-hover" style={{
      background:"#13131a", borderRadius:20, overflow:"hidden",
      border:`1px solid ${isUrgent?"#f5900344":"#1e1e2a"}`,
      boxShadow: isUrgent ? "0 0 20px rgba(245,144,3,0.15)" : "0 2px 12px rgba(0,0,0,0.3)",
    }}>
      {/* Top accent */}
      <div style={{ height:3, background:`linear-gradient(90deg,${color},transparent)` }}/>

      <div style={{ padding:"16px 18px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {game.sport?.split(" ")[0]}
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <span style={{ fontSize:11, fontWeight:700, color, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5 }}>
                  {game.sport?.replace(/[^a-zA-Z\s]/g,'').trim().toUpperCase()}
                </span>
                {isUrgent && <span className="urgent-badge">⚡ URGENT</span>}
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", lineHeight:1.2 }}>{game.title}</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            <span style={{
              fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99,
              background: game.skill_level==="Casual"?"#16a34a22":game.skill_level==="Competitive"?"#dc262622":"#2563eb22",
              color: game.skill_level==="Casual"?"#4ade80":game.skill_level==="Competitive"?"#f87171":"#60a5fa",
              fontFamily:"'DM Sans',sans-serif",
            }}>{game.skill_level}</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ display:"flex", gap:16, marginBottom:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
            📍 {game.location}
          </span>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
            🕐 {game.game_date} · {game.game_time}
          </span>
        </div>

        {/* Player bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <PlayerAvatars count={game.filled_slots} color={color}/>
              <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>
                {game.filled_slots}/{game.total_slots} Players
              </span>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color: isFull?"#dc2626":color, fontFamily:"'DM Sans',sans-serif" }}>
              {isFull ? "🔴 Full" : `${game.total_slots-game.filled_slots} spots open`}
            </span>
          </div>
          <div style={{ height:4, background:"#1e1e2a", borderRadius:99 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:99, transition:"width 0.5s" }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Avatar letter={game.host_avatar} color={color} size={30}/>
            <div>
              <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>Host</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#ccc", fontFamily:"'DM Sans',sans-serif" }}>{game.host_name}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span className="live-dot"/>
              <span style={{ fontSize:11, color:"#4ade80", fontFamily:"'DM Sans',sans-serif" }}>Live</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {game.cost_per_player > 0 && (
              <span style={{ fontSize:12, fontWeight:700, color:"#f59e0b", fontFamily:"'DM Sans',sans-serif" }}>
                ₹{game.cost_per_player}
              </span>
            )}
            {(isApproved || isHost) && (
              <button onClick={()=>onViewContact(game, isHost)} style={{
                background:"#1a1a2a", color:"#4ade80", border:"1px solid #4ade8033",
                borderRadius:10, padding:"7px 12px", fontSize:12, fontWeight:600,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              }}>📞</button>
            )}
            <button onClick={()=>!btn.disabled&&onJoin(game)} style={{
              ...btn.style, borderRadius:12, padding:"8px 16px",
              fontSize:13, fontWeight:700, cursor:btn.disabled?"default":"pointer",
              fontFamily:"'DM Sans',sans-serif",
            }}>{btn.label}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POST GAME — 3 STEP ───────────────────────────────────────────────────────

function PostGameModal({ onClose, onPost, user }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    sport:"⚽ Football", title:"", venue:"", area:UDAIPUR_AREAS[0],
    date:"", time:"", totalSlots:10, filledSlots:1,
    skillLevel:"Casual", tags:"", joinType:"direct", costPerPlayer:0,
    isUrgent:false, urgentMins:15, urgentNeed:2,
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handlePost = async () => {
    setLoading(true);
    await onPost(form);
    setLoading(false);
  };

  const steps = ["Sport & Details", "Date & Players", "Cost & Access"];

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>

        {/* Step indicator */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, color:"#fff", fontWeight:800 }}>Post a Game</h2>
            <button onClick={onClose} style={{ background:"#1e1e2a", border:"none", borderRadius:10, width:32, height:32, color:"#666", cursor:"pointer", fontSize:16 }}>×</button>
          </div>

          {/* Step bars */}
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            {steps.map((_,i)=>(
              <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i+1<=step ? "#e11d48" : "#1e1e2a", transition:"background 0.3s" }}/>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            {steps.map((s,i)=>(
              <span key={i} style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color: i+1===step?"#e11d48":"#555", fontWeight: i+1===step?700:500 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Step 1: Sport & Details */}
        {step===1 && (
          <div style={{ animation:"slideUp 0.3s" }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Select Sport</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {SPORTS.map(s=>{
                  const full = `${s.emoji} ${s.name}`;
                  const sel = form.sport===full;
                  const c = SPORT_COLORS[s.name]||"#e11d48";
                  return (
                    <div key={s.name} onClick={()=>set("sport",full)} style={{
                      background: sel ? `${c}22` : "#1a1a2a",
                      border:`1.5px solid ${sel?c:"#2a2a3a"}`,
                      borderRadius:14, padding:"12px 8px", cursor:"pointer",
                      textAlign:"center", transition:"all 0.15s",
                    }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:sel?c:"#777", fontFamily:"'DM Sans',sans-serif" }}>{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Game Title *</label>
              <input className="input-dark" placeholder="e.g. Evening 5-a-side at Navratan" value={form.title} onChange={e=>set("title",e.target.value)}/>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Venue *</label>
              <input className="input-dark" placeholder="e.g. Green Turf, City Sports Complex" value={form.venue} onChange={e=>set("venue",e.target.value)}/>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Area</label>
              <select className="input-dark" value={form.area} onChange={e=>set("area",e.target.value)}>
                {UDAIPUR_AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>

            {/* Quick game option */}
            <div onClick={()=>set("isUrgent",!form.isUrgent)} style={{
              background: form.isUrgent ? "#2a1500" : "#1a1a2a",
              border:`1.5px solid ${form.isUrgent?"#f59e0b":"#2a2a3a"}`,
              borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:20,
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{ fontSize:28 }}>⚡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color: form.isUrgent?"#f59e0b":"#fff", fontFamily:"'DM Sans',sans-serif" }}>Last-minute Game</div>
                <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>Need players urgently? Mark as urgent</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${form.isUrgent?"#f59e0b":"#333"}`, background:form.isUrgent?"#f59e0b":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {form.isUrgent && <span style={{ color:"#000", fontSize:12, fontWeight:800 }}>✓</span>}
              </div>
            </div>

            {form.isUrgent && (
              <div style={{ background:"#1a1000", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#f59e0b", fontWeight:600, fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}>⚡ Quick Game Details</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Need players in (mins)</label>
                    <input type="number" className="input-dark" value={form.urgentMins} min={5} max={120} onChange={e=>set("urgentMins",+e.target.value)} style={{ textAlign:"center" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Players needed</label>
                    <input type="number" className="input-dark" value={form.urgentNeed} min={1} max={20} onChange={e=>set("urgentNeed",+e.target.value)} style={{ textAlign:"center" }}/>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={()=>{ if(!form.title.trim()||!form.venue.trim()) return alert("Fill in all fields"); setStep(2); }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Date & Players */}
        {step===2 && (
          <div style={{ animation:"slideUp 0.3s" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Date *</label>
                <input type="date" className="input-dark" value={form.date} onChange={e=>set("date",e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Time *</label>
                <input type="time" className="input-dark" value={form.time} onChange={e=>set("time",e.target.value)}/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Total Players</label>
                <input type="number" className="input-dark" value={form.totalSlots} min={2} max={30} onChange={e=>set("totalSlots",+e.target.value)} style={{ textAlign:"center" }}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>You Already Have</label>
                <input type="number" className="input-dark" value={form.filledSlots} min={1} onChange={e=>set("filledSlots",+e.target.value)} style={{ textAlign:"center" }}/>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Skill Level</label>
              <div style={{ display:"flex", gap:8 }}>
                {["Beginner","Casual","Competitive"].map(lv=>{
                  const sel = form.skillLevel===lv;
                  return (
                    <button key={lv} onClick={()=>set("skillLevel",lv)} style={{
                      flex:1, padding:"12px 0", borderRadius:12,
                      border:`1.5px solid ${sel?"#e11d48":"#2a2a3a"}`,
                      background: sel ? "#e11d4822" : "#1a1a2a",
                      color: sel ? "#e11d48" : "#666",
                      fontWeight:700, fontSize:13, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                    }}>{lv}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Tags</label>
              <input className="input-dark" placeholder="e.g. Floodlit, Turf, Mixed, Friendly" value={form.tags} onChange={e=>set("tags",e.target.value)}/>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, background:"#1a1a2a", color:"#fff", border:"1px solid #2a2a3a", borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={()=>{ if(!form.date||!form.time) return alert("Pick date and time"); setStep(3); }}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: Cost & Access */}
        {step===3 && (
          <div style={{ animation:"slideUp 0.3s" }}>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Cost per Player (₹)</label>
              <input type="number" className="input-dark" value={form.costPerPlayer} min={0} onChange={e=>set("costPerPlayer",+e.target.value)} placeholder="0 = Free" style={{ textAlign:"center", fontSize:20, fontWeight:700 }}/>
              <div style={{ fontSize:12, color:"#555", marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>Leave 0 for a free game</div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:12, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Who can join?</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { val:"direct", icon:"⚡", title:"Anyone", desc:"Players join instantly" },
                  { val:"request", icon:"🔒", title:"You Approve", desc:"Review each request" },
                ].map(opt=>{
                  const sel = form.joinType===opt.val;
                  return (
                    <div key={opt.val} onClick={()=>set("joinType",opt.val)} style={{
                      border:`1.5px solid ${sel?"#e11d48":"#2a2a3a"}`,
                      borderRadius:16, padding:"16px 14px", cursor:"pointer",
                      background: sel ? "#e11d4822" : "#1a1a2a",
                      transition:"all 0.15s",
                    }}>
                      <div style={{ fontSize:24, marginBottom:6 }}>{opt.icon}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:sel?"#e11d48":"#fff", fontFamily:"'Syne',sans-serif" }}>{opt.title}</div>
                      <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(2)} style={{ flex:1, background:"#1a1a2a", color:"#fff", border:"1px solid #2a2a3a", borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
              <button className="btn-primary" style={{ flex:2, opacity:loading?0.7:1 }} onClick={handlePost} disabled={loading}>
                {loading ? "Posting..." : "🚀 Post Game"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JOIN MODAL ───────────────────────────────────────────────────────────────

function JoinModal({ game, onClose, onConfirm, user }) {
  const [note, setNote]       = useState("");
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const isDirect = game.join_type==="direct";
  const color = getSportColor(game.sport);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>{isDirect?"🎉":"📩"}</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, color:"#fff", marginBottom:8 }}>
              {isDirect ? `You're in!` : "Request sent!"}
            </h2>
            <p style={{ color:"#6b7280", fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              {isDirect ? "You're on the team. Contact info is now visible on the game card." : `Your request is with ${game.host_name}. You'll be notified when approved.`}
            </p>
            {game.cost_per_player > 0 && (
              <div style={{ background:"#1a1000", border:"1px solid #f59e0b33", borderRadius:14, padding:"12px", marginBottom:20 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#f59e0b", fontFamily:"'DM Sans',sans-serif" }}>💰 Pay ₹{game.cost_per_player} to the host at venue</div>
              </div>
            )}
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{game.sport?.split(" ")[0]}</div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif" }}>{game.title}</div>
                <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>📍 {game.location}</div>
              </div>
            </div>

            {game.cost_per_player>0 ? (
              <div style={{ background:"#1a1000", border:"1px solid #f59e0b33", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#f59e0b", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Cost per player</div>
                <div style={{ fontSize:28, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif" }}>₹{game.cost_per_player}</div>
                <div style={{ fontSize:11, color:"#666", fontFamily:"'DM Sans',sans-serif" }}>Pay at the venue</div>
              </div>
            ):(
              <div style={{ background:"#0a1a0a", border:"1px solid #16a34a33", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#4ade80", fontFamily:"'DM Sans',sans-serif" }}>🆓 Free to join</div>
              </div>
            )}

            <div style={{ background: isDirect?"#0a0a1a":"#0a001a", border:`1px solid ${isDirect?"#2563eb33":"#7c3aed33"}`, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:isDirect?"#60a5fa":"#a78bfa", fontFamily:"'DM Sans',sans-serif" }}>
                {isDirect ? "⚡ You'll be added instantly" : "🔒 Host reviews your request first"}
              </div>
            </div>

            {!isDirect && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Message to host</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="Hey! I play casually, would love to join..."
                  rows={3} className="input-dark" style={{ resize:"none", lineHeight:1.5 }}/>
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#1a1a2a", color:"#fff", border:"1px solid #2a2a3a", borderRadius:14, padding:"13px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={async()=>{ setLoading(true); await onConfirm(game,note); setLoading(false); setDone(true); }}
                style={{ flex:2, background:`linear-gradient(135deg,${isDirect?color:"#7c3aed"},${isDirect?color+"cc":"#6d28d9"})`, color:"#fff", border:"none", borderRadius:14, padding:"13px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {loading ? "..." : isDirect ? "Confirm Join ✓" : "Send Request →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── REQUESTS PANEL ───────────────────────────────────────────────────────────

function RequestsPanel({ onClose, onApprove, onReject, requests, games }) {
  const [tab, setTab] = useState("pending");
  const pending  = requests.filter(r=>r.status==="pending");
  const approved = requests.filter(r=>r.status==="approved");
  const rejected = requests.filter(r=>r.status==="rejected");
  const getGame  = id => games.find(g=>g.id===id);
  const shown = tab==="pending"?pending:tab==="approved"?approved:rejected;

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, color:"#fff", fontWeight:800 }}>Join Requests</h2>
          <button onClick={onClose} style={{ background:"#1e1e2a", border:"none", borderRadius:10, width:32, height:32, color:"#666", cursor:"pointer", fontSize:16 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:"1px solid #1e1e2a", marginBottom:20 }}>
          {[["pending",pending.length],["approved",approved.length],["declined",rejected.length]].map(([t,c])=>(
            <button key={t} onClick={()=>setTab(t)} className={tab===t?"tab-active":""} style={{
              flex:1, padding:"10px 0", background:"none", border:"none",
              color: tab===t?"#e11d48":"#555", fontWeight:700, fontSize:13,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              borderBottom: tab===t?"2px solid #e11d48":"2px solid transparent",
              textTransform:"capitalize",
            }}>{t} {c>0&&<span style={{ background:"#e11d4833", color:"#e11d48", borderRadius:99, padding:"1px 7px", fontSize:11, marginLeft:4 }}>{c}</span>}</button>
          ))}
        </div>

        {shown.length===0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#555" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No {tab} requests</div>
          </div>
        ) : shown.map(r=>(
          <div key={r.id} style={{ background:"#1a1a2a", borderRadius:16, padding:"14px 16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:r.note?10:tab==="pending"?10:0 }}>
              <Avatar letter={r.user_name[0]} color="#e11d48" size={40}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{r.user_name}</div>
                <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>
                  {getGame(r.game_id)?.title} · {timeAgo(r.created_at)}
                </div>
              </div>
            </div>
            {r.note && <div style={{ background:"#111", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:13, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", fontStyle:"italic" }}>"{r.note}"</div>}
            {tab==="pending" && (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>onReject(r)} style={{ flex:1, background:"transparent", color:"#dc2626", border:"1px solid #dc262633", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Decline</button>
                <button onClick={()=>onApprove(r)} style={{ flex:2, background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✓ Approve</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONTACT MODAL ────────────────────────────────────────────────────────────

function ContactModal({ data, onClose }) {
  if (!data) return null;
  const { game, contacts, isHost } = data;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, color:"#fff", fontWeight:800 }}>{isHost?"Approved Players":"Host Contact"}</h2>
            <p style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>{game.title}</p>
          </div>
          <button onClick={onClose} style={{ background:"#1e1e2a", border:"none", borderRadius:10, width:32, height:32, color:"#666", cursor:"pointer", fontSize:16 }}>×</button>
        </div>
        {contacts.length===0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"#555" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No approved players yet</div>
          </div>
        ) : contacts.map((c,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"#1a1a2a", borderRadius:16, padding:"14px 16px", marginBottom:10 }}>
            <Avatar letter={c.avatar||c.name?.[0]||"?"} color="#e11d48" size={44}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{c.name}</div>
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>
                {c.phone ? `📱 +91 ${c.phone}` : "No phone on file"}
              </div>
            </div>
            {c.phone && (
              <a href={`tel:+91${c.phone}`} style={{ background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, textDecoration:"none", fontFamily:"'DM Sans',sans-serif" }}>Call</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────

function ProfileScreen({ user, profile, myGames, onLogout }) {
  return (
    <div style={{ padding:"0 16px 100px", maxWidth:680, margin:"0 auto" }}>
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#1a0010,#0a001a)", borderRadius:24, padding:"28px 24px", marginBottom:20, border:"1px solid #2a0020", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, fontSize:120, opacity:0.04 }}>🏟️</div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,#e11d48,#f43f5e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif" }}>
            {(profile?.avatar||user.email[0]).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff" }}>{profile?.name||user.email}</div>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>{user.email}</div>
            {profile?.phone && (
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                +91 {profile.phone}
                {profile.phone_verified && <span style={{ fontSize:10, background:"#16a34a22", color:"#4ade80", borderRadius:6, padding:"1px 6px", fontWeight:700 }}>✓ Verified</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          {[{ v:myGames.length, l:"Hosted" },{ v:"—", l:"Joined" },{ v:"—", l:"Requests" }].map(s=>(
            <div key={s.l} style={{ background:"rgba(255,255,255,0.05)", borderRadius:14, padding:"14px 0", textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#fff" }}>{s.v}</div>
              <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {myGames.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#555", letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>Your Games</div>
          {myGames.map(g=>{
            const c = getSportColor(g.sport);
            return (
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#13131a", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid #1e1e2a" }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${c}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{g.sport?.split(" ")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{g.title}</div>
                  <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>{g.area} · {g.game_date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:c, fontFamily:"'DM Sans',sans-serif" }}>{g.filled_slots}/{g.total_slots}</div>
                  {g.cost_per_player>0 && <div style={{ fontSize:11, color:"#f59e0b" }}>₹{g.cost_per_player}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onLogout} style={{ width:"100%", background:"transparent", color:"#dc2626", border:"1px solid #dc262633", borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
        Sign Out
      </button>
    </div>
  );
}

// ─── EXPLORE SCREEN ───────────────────────────────────────────────────────────

function ExploreScreen({ games, onJoin, currentUserId, myRequests, onViewContact }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ padding:"0 16px 100px", maxWidth:680, margin:"0 auto" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>Explore Sports</div>
        <div style={{ fontSize:13, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>Browse by sport in Udaipur</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {SPORTS.map(s=>{
          const c = SPORT_COLORS[s.name]||"#e11d48";
          const count = games.filter(g=>g.sport?.includes(s.name)).length;
          const sel = selected===s.name;
          return (
            <div key={s.name} onClick={()=>setSelected(sel?null:s.name)} style={{
              background: sel ? `${c}22` : "#13131a",
              border:`1.5px solid ${sel?c:"#1e1e2a"}`,
              borderRadius:18, padding:"18px 12px", cursor:"pointer",
              textAlign:"center", transition:"all 0.15s",
            }}>
              <div style={{ fontSize:30, marginBottom:8 }}>{s.emoji}</div>
              <div style={{ fontSize:12, fontWeight:700, color:sel?c:"#ccc", fontFamily:"'DM Sans',sans-serif" }}>{s.name}</div>
              <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{count} game{count!==1?"s":""}</div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#555", letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{selected} Games</div>
          {games.filter(g=>g.sport?.includes(selected)).map(g=>(
            <GameCard key={g.id} game={g} onJoin={onJoin} currentUserId={currentUserId} myRequests={myRequests} onViewContact={onViewContact}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function SquadUp() {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [games, setGames]             = useState([]);
  const [requests, setRequests]       = useState([]);
  const [tab, setTab]                 = useState("home");
  const [sportFilter, setSport]       = useState("All");
  const [areaFilter, setArea]         = useState("All Areas");
  const [search, setSearch]           = useState("");
  const [showPost, setShowPost]       = useState(false);
  const [joining, setJoining]         = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState({ msg:"", type:"" });
  const [liveCount, setLiveCount]     = useState(0);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast({ msg:"", type:"" }), 3500);
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({ data:{ session } })=>{
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      else setLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,session)=>{
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      else { setUser(null); setProfile(null); setLoading(false); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Simulate live player count
  useEffect(()=>{
    const base = Math.floor(Math.random()*20)+5;
    setLiveCount(base);
    const interval = setInterval(()=>{
      setLiveCount(c=>c+Math.floor(Math.random()*3)-1);
    },4000);
    return ()=>clearInterval(interval);
  },[]);

  const loadProfile = async (id)=>{ const{data}=await supabase.from("profiles").select("*").eq("id",id).single(); setProfile(data); setLoading(false); };

  useEffect(()=>{ if(!user)return; loadGames(); loadRequests(); },[user]);

  useEffect(()=>{
    if(!user)return;
    const ch = supabase.channel("games-rt")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"games"},p=>{
        if(p.new.host_id!==user.id){ setGames(prev=>[p.new,...prev]); showToast(`New game: ${p.new.title}!`); }
      }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[user]);

  useEffect(()=>{
    if(!user)return;
    const ch = supabase.channel("req-rt")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"requests"},p=>{
        if(p.new.user_id===user.id){
          loadRequests();
          if(p.new.status==="approved") showToast("Your request was approved! ✅");
          else if(p.new.status==="rejected") showToast("Your request was declined.", "error");
        }
      }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[user]);

  const loadGames = async()=>{ const{data}=await supabase.from("games").select("*").order("created_at",{ascending:false}); setGames(data||[]); };
  const loadRequests = async()=>{ const{data}=await supabase.from("requests").select("*").order("created_at",{ascending:false}); setRequests(data||[]); };

  const handlePost = async(form)=>{
    const color = getSportColor(form.sport);
    const title = form.isUrgent ? `⚡ Need ${form.urgentNeed} in ${form.urgentMins}mins — ${form.title}` : form.title;
    const{error}=await supabase.from("games").insert([{
      sport:form.sport, title, location:`${form.venue}, ${form.area}`, area:form.area,
      game_date:form.date, game_time:form.time, total_slots:+form.totalSlots,
      filled_slots:+form.filledSlots, skill_level:form.skillLevel,
      host_name:profile?.name||user.email, host_id:user.id,
      host_avatar:profile?.avatar||user.email[0].toUpperCase(),
      color, tags:form.tags?form.tags.split(",").map(t=>t.trim()).filter(Boolean):[],
      join_type:form.joinType, cost_per_player:+form.costPerPlayer,
      is_urgent:form.isUrgent,
    }]);
    if(error){ showToast("Failed to post.", "error"); return; }
    showToast("Game posted! 🎉"); setShowPost(false); loadGames();
  };

  const handleJoinConfirm = async(game,note)=>{
    if(game.join_type==="direct"){
      await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);
      showToast(`Joined ${game.title}! 🏟️`);
    } else {
      await supabase.from("requests").insert([{ game_id:game.id, user_id:user.id, user_name:profile?.name||user.email, note:note||null, status:"pending" }]);
      showToast("Request sent! 📩");
    }
    setJoining(null); loadGames(); loadRequests();
  };

  const handleApprove = async(req)=>{
    await supabase.from("requests").update({status:"approved"}).eq("id",req.id);
    const game=games.find(g=>g.id===req.game_id);
    if(game) await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);
    showToast(`${req.user_name} approved! ✅`); loadGames(); loadRequests();
  };

  const handleReject = async(req)=>{ await supabase.from("requests").update({status:"rejected"}).eq("id",req.id); loadRequests(); };

  const handleViewContact = async(game,isHost)=>{
    if(isHost){
      const approved=requests.filter(r=>r.game_id===game.id&&r.status==="approved");
      const contacts=await Promise.all(approved.map(async r=>{
        const{data}=await supabase.from("profiles").select("name,phone,avatar").eq("id",r.user_id).single();
        return data||{name:r.user_name,phone:null,avatar:r.user_name[0]};
      }));
      setContactData({game,contacts,isHost:true});
    } else {
      const{data}=await supabase.from("profiles").select("name,phone,avatar").eq("id",game.host_id).single();
      setContactData({game,contacts:[data||{name:game.host_name,phone:null}],isHost:false});
    }
  };

  const handleLogout = async()=>{ await supabase.auth.signOut(); };

  const sportFilters = ["All",...SPORTS.map(s=>s.name)];
  const areaFilters  = ["All Areas",...UDAIPUR_AREAS];
  const myGames      = games.filter(g=>g.host_id===user?.id);
  const myRequests   = requests.filter(r=>r.user_id===user?.id);
  const hostRequests = requests.filter(r=>{ const g=games.find(x=>x.id===r.game_id); return g?.host_id===user?.id; });
  const pendingCount = hostRequests.filter(r=>r.status==="pending").length;
  const activityCount = pendingCount + myRequests.filter(r=>r.status==="approved").length;

  const filtered = games.filter(g=>{
    const sm = sportFilter==="All"||g.sport?.includes(sportFilter);
    const am = areaFilter==="All Areas"||g.area===areaFilter;
    const se = !search||g.title?.toLowerCase().includes(search.toLowerCase())||g.location?.toLowerCase().includes(search.toLowerCase());
    return sm&&am&&se;
  });

  if(loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <style>{CSS}</style>
      <img
src="/logo192.png"
alt="SquadUp"
style={{
width:"56px",
height:"56px",
borderRadius:"16px"
}}
/>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:"#fff" }}>SquadUp</div>
      <Spinner size={28}/>
    </div>
  );

  if(!user) return <><style>{CSS}</style><AuthPage onAuth={u=>{setUser(u);loadProfile(u.id);}}/></>;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:"#0a0a0f", fontFamily:"'DM Sans',sans-serif", paddingBottom:80 }}>

        {/* ── HOME TAB ── */}
        {tab==="home" && (
          <div style={{ maxWidth:680, margin:"0 auto", padding:"0 16px" }}>

            {/* Header */}
            <div style={{ padding:"20px 0 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <img
src="/logo512.png"
alt="SquadUp"
style={{
width:"40px",
height:"40px",
borderRadius:"12px",
objectFit:"cover",
boxShadow:"0 0 15px rgba(255,47,185,.4)"
}}
/>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff" }}>SquadUp</span>
                </div>
                <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>
                  <span className="live-dot" style={{ marginRight:5 }}/>
                  <span style={{ color:"#4ade80" }}>{liveCount} players online</span>
                  <span style={{ color:"#555" }}> · Udaipur</span>
                </div>
              </div>
              <div onClick={()=>setShowRequests(true)} style={{ position:"relative", cursor:"pointer", background:"#13131a", borderRadius:14, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:"1px solid #1e1e2a" }}>
                🔔
                {pendingCount>0 && (
                  <div style={{ position:"absolute", top:-4, right:-4, background:"#e11d48", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {pendingCount}
                  </div>
                )}
              </div>
            </div>

            {/* Hero banner */}
            <div style={{ background:"linear-gradient(135deg,#1a0010 0%,#0a001a 50%,#001a0a 100%)", borderRadius:24, padding:"24px", marginBottom:20, position:"relative", overflow:"hidden", border:"1px solid #2a0020" }}>
              <div style={{ position:"absolute", right:-30, top:-30, fontSize:130, opacity:0.07 }}>⚽</div>
              <div style={{ fontSize:13, color:"#e11d4888", fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>
                Hey {(profile?.name||user.email).split(" ")[0]} 👋
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:16 }}>
                Find players nearby.<br/>
                <span style={{ color:"#e11d48" }}>Complete your squad</span> instantly.
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setSport("All")} style={{ background:"linear-gradient(135deg,#e11d48,#f43f5e)", color:"#fff", border:"none", borderRadius:12, padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  Join Game
                </button>
                <button onClick={()=>setShowPost(true)} style={{ background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  + Create Game
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:14 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.5 }}>🔍</span>
              <input className="input-dark" placeholder="Search games, venues, players..."
                value={search} onChange={e=>setSearch(e.target.value)}
                style={{ paddingLeft:42 }}
                onFocus={e=>e.target.style.borderColor="#e11d48"}
                onBlur={e=>e.target.style.borderColor="#2a2a3a"}
              />
            </div>

            {/* Sport filter chips */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:10, scrollbarWidth:"none" }}>
              {sportFilters.map(f=>{
                const sel = sportFilter===f;
                const c = f==="All"?"#e11d48":(SPORT_COLORS[f]||"#e11d48");
                return (
                  <button key={f} onClick={()=>setSport(f)} style={{
                    flexShrink:0, padding:"7px 16px", borderRadius:99, border:`1.5px solid ${sel?c:"#2a2a3a"}`,
                    background: sel?`${c}22`:"#13131a", color:sel?c:"#777",
                    fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s", whiteSpace:"nowrap",
                  }}>{f==="All"?"🎮 All":SPORTS.find(s=>s.name===f)?.emoji+" "+f}</button>
                );
              })}
            </div>

            {/* Area chips */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }}>
              {areaFilters.map(a=>{
                const sel = areaFilter===a;
                return (
                  <button key={a} onClick={()=>setArea(a)} style={{
                    flexShrink:0, padding:"6px 14px", borderRadius:99,
                    border:`1.5px solid ${sel?"#e11d48":"#2a2a3a"}`,
                    background: sel?"#e11d4822":"#13131a", color:sel?"#e11d48":"#666",
                    fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s", whiteSpace:"nowrap",
                  }}>{a}</button>
                );
              })}
            </div>

            {/* Games heading */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#fff" }}>Games Near You</div>
              <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>{filtered.length} found</div>
            </div>

            {/* Urgent games first */}
            {filtered.filter(g=>g.is_urgent).length>0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                  <span className="urgent-badge">⚡ URGENT</span> Last-minute games
                </div>
                {filtered.filter(g=>g.is_urgent).map(g=>(
                  <div key={g.id} style={{ marginBottom:12 }}>
                    <GameCard game={g} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact}/>
                  </div>
                ))}
              </div>
            )}

            {/* All games */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {filtered.filter(g=>!g.is_urgent).length===0&&filtered.filter(g=>g.is_urgent).length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#555" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🏟️</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#fff", marginBottom:6 }}>No games yet</div>
                  <div style={{ fontSize:14, marginBottom:20 }}>Be the first to post one!</div>
                  <button className="btn-primary" style={{ width:"auto", padding:"12px 28px" }} onClick={()=>setShowPost(true)}>+ Post a Game</button>
                </div>
              ) : filtered.filter(g=>!g.is_urgent).map(g=>(
                <GameCard key={g.id} game={g} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact}/>
              ))}
            </div>
          </div>
        )}

        {/* ── EXPLORE TAB ── */}
        {tab==="explore" && (
          <ExploreScreen games={games} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact}/>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab==="activity" && (
          <div style={{ padding:"20px 16px 100px", maxWidth:680, margin:"0 auto" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>Activity</div>
            <div style={{ fontSize:13, color:"#555", fontFamily:"'DM Sans',sans-serif", marginBottom:20 }}>Your requests and notifications</div>

            {/* My outgoing requests */}
            <div style={{ fontSize:13, fontWeight:700, color:"#555", letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>My Requests</div>
            {myRequests.length===0 ? (
              <div style={{ background:"#13131a", borderRadius:16, padding:"20px", textAlign:"center", color:"#555", marginBottom:20 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎮</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No requests sent yet</div>
              </div>
            ) : myRequests.map(r=>{
              const g = games.find(x=>x.id===r.game_id);
              return (
                <div key={r.id} style={{ background:"#13131a", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid #1e1e2a", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:24 }}>{g?.sport?.split(" ")[0]||"🎮"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{g?.title||"Game"}</div>
                    <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>{timeAgo(r.created_at)}</div>
                  </div>
                  <span style={{
                    fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:99,
                    background: r.status==="approved"?"#16a34a22":r.status==="rejected"?"#dc262622":"#f59e0b22",
                    color: r.status==="approved"?"#4ade80":r.status==="rejected"?"#f87171":"#fbbf24",
                    fontFamily:"'DM Sans',sans-serif",
                  }}>{r.status==="approved"?"✅ Approved":r.status==="rejected"?"❌ Declined":"⏳ Pending"}</span>
                </div>
              );
            })}

            {/* Incoming requests for my games */}
            {hostRequests.length>0 && (
              <>
                <div style={{ fontSize:13, fontWeight:700, color:"#555", letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", margin:"20px 0 12px" }}>Requests for Your Games</div>
                {hostRequests.map(r=>{
                  const g=games.find(x=>x.id===r.game_id);
                  return (
                    <div key={r.id} style={{ background:"#13131a", borderRadius:16, padding:"14px 16px", marginBottom:10, border:`1px solid ${r.status==="pending"?"#e11d4833":"#1e1e2a"}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:r.status==="pending"?10:0 }}>
                        <Avatar letter={r.user_name[0]} color="#e11d48" size={38}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{r.user_name}</div>
                          <div style={{ fontSize:12, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>{g?.title} · {timeAgo(r.created_at)}</div>
                        </div>
                        {r.status!=="pending" && (
                          <span style={{ fontSize:12, fontWeight:700, color:r.status==="approved"?"#4ade80":"#f87171", fontFamily:"'DM Sans',sans-serif" }}>
                            {r.status==="approved"?"✅":"❌"}
                          </span>
                        )}
                      </div>
                      {r.status==="pending" && (
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>handleReject(r)} style={{ flex:1, background:"transparent", color:"#dc2626", border:"1px solid #dc262633", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Decline</button>
                          <button onClick={()=>handleApprove(r)} style={{ flex:2, background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✓ Approve</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab==="profile" && (
          <ProfileScreen user={user} profile={profile} myGames={myGames} onLogout={handleLogout}/>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"rgba(10,10,15,0.95)", backdropFilter:"blur(20px)",
          borderTop:"1px solid #1e1e2a", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"space-around",
          padding:"8px 16px 20px",
        }}>
          {[
            { id:"home", icon:"🏠", label:"Home" },
            { id:"explore", icon:"🔭", label:"Explore" },
          ].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className="nav-btn" style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              background:"none", border:"none", cursor:"pointer", padding:"6px 16px",
              opacity:tab===n.id?1:0.5,
            }}>
              <span style={{ fontSize:22 }}>{n.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, color:tab===n.id?"#e11d48":"#666", fontFamily:"'DM Sans',sans-serif" }}>{n.label}</span>
            </button>
          ))}

          {/* Center POST button */}
          <button onClick={()=>setShowPost(true)} style={{
            width:56, height:56, borderRadius:"50%",
            background:"linear-gradient(135deg,#e11d48,#f43f5e)",
            border:"none", cursor:"pointer", fontSize:24,
            boxShadow:"0 4px 20px rgba(225,29,72,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transform:"translateY(-8px)", transition:"all 0.2s",
          }}>+</button>

          {[
            { id:"activity", icon:"⚡", label:"Activity", badge:activityCount },
            { id:"profile", icon:"👤", label:"Profile" },
          ].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className="nav-btn" style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              background:"none", border:"none", cursor:"pointer", padding:"6px 16px",
              opacity:tab===n.id?1:0.5, position:"relative",
            }}>
              <span style={{ fontSize:22 }}>{n.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, color:tab===n.id?"#e11d48":"#666", fontFamily:"'DM Sans',sans-serif" }}>{n.label}</span>
              {n.badge>0 && (
                <div style={{ position:"absolute", top:0, right:8, background:"#e11d48", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {n.badge}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Modals */}
        {showPost     && <PostGameModal onClose={()=>setShowPost(false)} onPost={handlePost} user={{ name:profile?.name||user.email }}/>}
        {joining      && <JoinModal game={joining} onClose={()=>setJoining(null)} onConfirm={handleJoinConfirm} user={{ name:profile?.name||user.email }}/>}
        {showRequests && <RequestsPanel onClose={()=>setShowRequests(false)} onApprove={handleApprove} onReject={handleReject} requests={hostRequests} games={games}/>}
        {contactData  && <ContactModal data={contactData} onClose={()=>setContactData(null)}/>}

        <Toast msg={toast.msg} type={toast.type}/>
      </div>
    </>
  );
}