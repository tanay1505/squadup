import { useState, useEffect } from "react";
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
  Tennis:"#16a34a", Badminton:"#0891b2", Volleyball:"#7c3aed",
  "Table Tennis":"#db2777", Hockey:"#0d9488", Pickleball:"#9333ea",
};


// notifications
function requestNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission();
}
function sendNotif(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/icon-192.png" }); } catch(e) {}
  }
}
function getSportColor(sportStr) {
  const name = sportStr?.replace(/[^a-zA-Z\s]/g,"").trim();
  return SPORT_COLORS[name] || "#e11d48";
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .card { transition: transform 0.18s, box-shadow 0.18s; }
  .card:hover { transform: translateY(-2px); }
  .nav-item { transition: all 0.2s; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; padding:8px 20px; }
  .btn-red {
    background: linear-gradient(135deg,#e11d48,#f43f5e);
    color:#fff; border:none; border-radius:14px;
    padding:14px 24px; font-size:14px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif; width:100%;
    transition:all 0.2s; letter-spacing:0.3px;
    box-shadow: 0 4px 16px rgba(225,29,72,0.25);
  }
  .btn-red:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(225,29,72,0.4); }
  .btn-red:disabled { background:#e5e7eb; color:#aaa; cursor:not-allowed; transform:none; box-shadow:none; }
  .input-field {
    background:#f8f8f8; border:2px solid #f0f0f0;
    color:#111; border-radius:14px; padding:13px 16px;
    font-size:14px; font-family:'DM Sans',sans-serif;
    width:100%; outline:none; transition:border-color 0.2s;
  }
  .input-field:focus { border-color:#e11d48; background:#fff; }
  .input-field::placeholder { color:#bbb; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:flex-end; justify-content:center; z-index:999; backdrop-filter:blur(8px); animation:fadeIn 0.2s; }
  .modal-sheet { background:#fff; border-radius:28px 28px 0 0; width:100%; max-width:680px; max-height:92vh; overflow-y:auto; animation:slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1); padding:24px 24px 48px; }
  .modal-handle { width:36px; height:4px; background:#e5e7eb; border-radius:99px; margin:0 auto 20px; }
  .tag { display:inline-flex; align-items:center; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:700; font-family:'DM Sans',sans-serif; }
  select.input-field { appearance:none; cursor:pointer; }
`;

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background: type==="error" ? "#e11d48" : "#111",
      color:"#fff", padding:"12px 22px", borderRadius:14, fontSize:13,
      fontWeight:700, fontFamily:"'DM Sans',sans-serif",
      boxShadow:"0 8px 32px rgba(0,0,0,0.2)", zIndex:9999,
      whiteSpace:"nowrap", animation:"slideUp 0.3s",
    }}>
      {type==="error"?"⚠️":"✅"} {msg}
    </div>
  );
}

function Spinner({ size=28, color="#e11d48" }) {
  return <div style={{ width:size, height:size, border:`3px solid #f0f0f0`, borderTop:`3px solid ${color}`, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>;
}

function Avatar({ letter, color="#e11d48", size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`${color}18`, border:`2px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color,
      fontFamily:"'DM Sans',sans-serif",
    }}>{letter?.toUpperCase()}</div>
  );
}

function SlotPips({ filled, total, color }) {
  const pips = Math.min(total, 10);
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {Array.from({length:pips}).map((_,i)=>(
        <div key={i} style={{
          width:8, height:8, borderRadius:"50%",
          background: i < filled ? color : "#e5e7eb",
          transition:"background 0.3s",
        }}/>
      ))}
      {total > 10 && <span style={{ fontSize:10, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", marginLeft:2 }}>+{total-10}</span>}
    </div>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────

function GameCard({ game, onJoin, currentUserId, myRequests, onViewContact, onCancel, onLeave }) {
  const color   = getSportColor(game.sport);
  const isFull  = game.filled_slots >= game.total_slots;
  const isHost  = game.host_id === currentUserId;
  const myReq   = myRequests?.find(r=>r.game_id===game.id);
  const isApproved = myReq?.status==="approved";
  const isDirect   = game.join_type==="direct";
  const pct = Math.min((game.filled_slots/game.total_slots)*100,100);
  const isUrgent =
  game.title?.includes("⚡") ||
  game.is_urgent === true;

  const getBtn = () => {
    if (isHost) return null;
    if (myReq?.status==="pending")  return { label:"⏳ Pending",  bg:"#fef9c3", tc:"#92400e", disabled:true };
    if (myReq?.status==="approved") return { label:"Leave Game", bg:"#fee2e2", tc:"#dc2626", disabled:false, action:"leave" };
    if (myReq?.status==="rejected") return { label:"Declined",   bg:"#f3f4f6", tc:"#9ca3af", disabled:true };
    if (isFull) return { label:"Full", bg:"#f3f4f6", tc:"#9ca3af", disabled:true };
    return {
      label: isDirect ? "Join →" : "Request →",
      bg: color, tc:"#fff", disabled:false, action:"join",
    };
  };

  const btn = getBtn();

  return (
    <div className="card" style={{
      background:"#fff", borderRadius:20, overflow:"hidden",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      border:`1px solid ${isUrgent?"#fde68a":"#f0f0f0"}`,
      background: isUrgent ? "linear-gradient(to bottom right,#fffbeb,#fff)" : "#fff",
    }}>
      {/* Color stripe */}
      <div style={{ height:4, background:`linear-gradient(90deg,${color},${color}66)` }}/>

      <div style={{ padding:"16px 18px" }}>
        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:14, background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {game.sport?.split(" ")[0]}
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <span style={{ fontSize:11, fontWeight:800, color, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.8, textTransform:"uppercase" }}>
                  {game.sport?.replace(/[^a-zA-Z\s]/g,"").trim()}
                </span>
                {isUrgent && (
                  <span style={{ background:"#f59e0b", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:99, letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif" }}>⚡ URGENT</span>
                )}
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#111", letterSpacing:0.5, lineHeight:1 }}>{game.title}</div>
            </div>
          </div>
          <span style={{
            fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99,
            background: game.skill_level==="Casual"?"#f0fdf4":game.skill_level==="Competitive"?"#fff1f2":"#eff6ff",
            color: game.skill_level==="Casual"?"#15803d":game.skill_level==="Competitive"?"#be123c":"#1d4ed8",
            fontFamily:"'DM Sans',sans-serif",
          }}>{game.skill_level}</span>
        </div>

        {/* Meta */}
        <div style={{ display:"flex", gap:14, marginBottom:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>📍 {game.location}</span>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>🕐 {game.game_date} · {game.game_time}</span>
        </div>

        {/* Slots */}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <SlotPips filled={game.filled_slots} total={game.total_slots} color={color}/>
            <span style={{ fontSize:12, fontWeight:700, color:isFull?"#dc2626":color, fontFamily:"'DM Sans',sans-serif" }}>
              {isFull ? "🔴 Full" : `${game.total_slots-game.filled_slots} spots left`}
            </span>
          </div>
          <div style={{ height:4, background:"#f3f4f6", borderRadius:99 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.4s" }}/>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
          <span className="tag" style={{ background:game.cost_per_player===0?"#f0fdf4":"#fffbeb", color:game.cost_per_player===0?"#15803d":"#92400e" }}>
            {game.cost_per_player===0?"🆓 Free":`💰 ₹${game.cost_per_player}`}
          </span>
          <span className="tag" style={{ background:isDirect?"#eff6ff":"#faf5ff", color:isDirect?"#1d4ed8":"#7c3aed" }}>
            {isDirect?"⚡ Open":"🔒 Approval"}
          </span>
          {(game.tags||[]).slice(0,2).map(t=>(
            <span key={t} className="tag" style={{ background:"#f8f8f8", color:"#6b7280" }}>{t}</span>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Avatar letter={game.host_avatar||"?"} color={color} size={30}/>
            <div>
              <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Host</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{game.host_name}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Contact button */}
            {(isApproved || isHost) && (
              <button onClick={()=>onViewContact(game,isHost)} style={{ background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:10, padding:"7px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                📞
              </button>
            )}
            {/* Host cancel game */}
            {isHost && (
              <button onClick={()=>onCancel(game)} style={{ background:"#fff1f2", color:"#be123c", border:"1px solid #fecdd3", borderRadius:10, padding:"7px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Cancel Game
              </button>
            )}
            {/* Player join/leave */}
            {btn && (
              <button onClick={()=>!btn.disabled&&(btn.action==="leave"?onLeave(game,myReq):onJoin(game))} style={{
                background:btn.bg, color:btn.tc, border:"none", borderRadius:12,
                padding:"9px 18px", fontSize:13, fontWeight:700,
                cursor:btn.disabled?"default":"pointer", fontFamily:"'DM Sans',sans-serif",
              }}>{btn.label}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POST GAME MODAL (3 steps) ────────────────────────────────────────────────

function PostGameModal({ onClose, onPost, user }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    sport:"⚽ Football", title:"", venue:"", area:UDAIPUR_AREAS[0],
    date:"", time:"", totalSlots:10, filledSlots:1,
    skillLevel:"Casual", tags:"", joinType:"direct",
    costPerPlayer:0, isUrgent:false, urgentMins:15, urgentNeed:2,
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const steps = ["Sport & Venue","Date & Players","Cost & Access"];

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>

        {/* Step header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#111", letterSpacing:1 }}>Post a Game</div>
            <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>×</button>
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            {steps.map((_,i)=>(
              <div key={i} style={{ flex:1, height:3, borderRadius:99, background:i+1<=step?"#e11d48":"#f0f0f0", transition:"background 0.3s" }}/>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            {steps.map((s,i)=>(
              <span key={i} style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color:i+1===step?"#e11d48":"#9ca3af", fontWeight:i+1===step?700:500 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* STEP 1 */}
        {step===1 && (
          <div style={{ animation:"slideUp 0.25s" }}>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Select Sport</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {SPORTS.map(s=>{
                  const full = `${s.emoji} ${s.name}`;
                  const sel = form.sport===full;
                  const c = SPORT_COLORS[s.name]||"#e11d48";
                  return (
                    <div key={s.name} onClick={()=>set("sport",full)} style={{
                      background:sel?`${c}10`:"#fafafa",
                      border:`2px solid ${sel?c:"#f0f0f0"}`,
                      borderRadius:14, padding:"12px 8px",
                      cursor:"pointer", textAlign:"center", transition:"all 0.15s",
                    }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:sel?c:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {[
              { label:"Game Title *", key:"title", placeholder:"e.g. Evening 5-a-side at Navratan" },
              { label:"Venue *", key:"venue", placeholder:"e.g. Green Turf, City Sports Complex" },
            ].map(f=>(
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{f.label}</label>
                <input className="input-field" placeholder={f.placeholder} value={form[f.key]} onChange={e=>set(f.key,e.target.value)}/>
              </div>
            ))}

            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Area</label>
              <select className="input-field" value={form.area} onChange={e=>set("area",e.target.value)}>
                {UDAIPUR_AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>

            {/* Urgent toggle */}
            <div onClick={()=>set("isUrgent",!form.isUrgent)} style={{
              background:form.isUrgent?"#fffbeb":"#fafafa",
              border:`2px solid ${form.isUrgent?"#f59e0b":"#f0f0f0"}`,
              borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:16,
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{ fontSize:26 }}>⚡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:form.isUrgent?"#92400e":"#374151", fontFamily:"'DM Sans',sans-serif" }}>Last-minute Game</div>
                <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Need players urgently right now?</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${form.isUrgent?"#f59e0b":"#d1d5db"}`, background:form.isUrgent?"#f59e0b":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {form.isUrgent && <span style={{ color:"#fff", fontSize:12, fontWeight:800 }}>✓</span>}
              </div>
            </div>

            {form.isUrgent && (
              <div style={{ background:"#fffbeb", borderRadius:14, padding:"14px 16px", marginBottom:16, border:"1px solid #fde68a" }}>
                <div style={{ fontSize:13, color:"#92400e", fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}>⚡ Urgent Details</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Need in (mins)</label>
                    <input type="number" className="input-field" value={form.urgentMins} min={5} max={120} onChange={e=>set("urgentMins",+e.target.value)} style={{ textAlign:"center" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Players needed</label>
                    <input type="number" className="input-field" value={form.urgentNeed} min={1} max={20} onChange={e=>set("urgentNeed",+e.target.value)} style={{ textAlign:"center" }}/>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-red" onClick={()=>{ if(!form.title.trim()||!form.venue.trim()) return alert("Fill in title and venue"); setStep(2); }}>
              Next →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div style={{ animation:"slideUp 0.25s" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:"Date *", key:"date", type:"date" },
                { label:"Time *", key:"time", type:"time" },
                { label:"Total Players", key:"totalSlots", type:"number" },
                { label:"You Already Have", key:"filledSlots", type:"number" },
              ].map(f=>(
                <div key={f.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{f.label}</label>
                  <input type={f.type} className="input-field" value={form[f.key]} min={f.key==="totalSlots"?2:1} max={f.key==="totalSlots"?30:undefined} onChange={e=>set(f.key,f.type==="number"?+e.target.value:e.target.value)} style={{ textAlign:f.type==="number"?"center":"left" }}/>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Skill Level</label>
              <div style={{ display:"flex", gap:8 }}>
                {["Beginner","Casual","Competitive"].map(lv=>{
                  const sel = form.skillLevel===lv;
                  return (
                    <button key={lv} onClick={()=>set("skillLevel",lv)} style={{
                      flex:1, padding:"11px 0", borderRadius:12,
                      border:`2px solid ${sel?"#e11d48":"#f0f0f0"}`,
                      background:sel?"#fff1f2":"#fafafa",
                      color:sel?"#e11d48":"#6b7280",
                      fontWeight:700, fontSize:13, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                    }}>{lv}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Tags</label>
              <input className="input-field" placeholder="e.g. Floodlit, Turf, Mixed, Friendly" value={form.tags} onChange={e=>set("tags",e.target.value)}/>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, background:"#f3f4f6", color:"#374151", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
              <button className="btn-red" style={{ flex:2 }} onClick={()=>{ if(!form.date||!form.time) return alert("Pick date and time"); setStep(3); }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div style={{ animation:"slideUp 0.25s" }}>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Cost per Player (₹)</label>
              <input type="number" className="input-field" value={form.costPerPlayer} min={0} onChange={e=>set("costPerPlayer",+e.target.value)} placeholder="0 = Free" style={{ textAlign:"center", fontSize:22, fontWeight:800, color:"#111" }}/>
              <div style={{ fontSize:12, color:"#9ca3af", marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>Leave 0 if the game is free to join</div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:12, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Who Can Join?</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { val:"direct", icon:"⚡", title:"Anyone", desc:"Players join instantly" },
                  { val:"request", icon:"🔒", title:"You Approve", desc:"Review each request" },
                ].map(opt=>{
                  const sel = form.joinType===opt.val;
                  return (
                    <div key={opt.val} onClick={()=>set("joinType",opt.val)} style={{
                      border:`2px solid ${sel?"#e11d48":"#f0f0f0"}`,
                      borderRadius:16, padding:"16px 14px", cursor:"pointer",
                      background:sel?"#fff1f2":"#fafafa", transition:"all 0.15s",
                    }}>
                      <div style={{ fontSize:24, marginBottom:6 }}>{opt.icon}</div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:sel?"#e11d48":"#111", letterSpacing:0.5 }}>{opt.title}</div>
                      <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(2)} style={{ flex:1, background:"#f3f4f6", color:"#374151", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
              <button className="btn-red" style={{ flex:2, opacity:loading?0.7:1 }} onClick={async()=>{ setLoading(true); await onPost(form); setLoading(false); }} disabled={loading}>
                {loading?"Posting...":"🚀 Post Game"}
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
            <div style={{ fontSize:60, marginBottom:14 }}>{isDirect?"🎉":"📩"}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#111", letterSpacing:0.5, marginBottom:8 }}>
              {isDirect?`You're In!`:"Request Sent!"}
            </div>
            <p style={{ color:"#6b7280", fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              {isDirect?"You're on the team. Contact info is now visible on the game card.":`Your request is with ${game.host_name}. You'll be notified when approved.`}
            </p>
            {game.cost_per_player > 0 && (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:14, padding:"12px", marginBottom:20 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#92400e", fontFamily:"'DM Sans',sans-serif" }}>💰 Pay ₹{game.cost_per_player} to host at venue</div>
              </div>
            )}
            <button className="btn-red" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:18 }}>
              <div style={{ width:50, height:50, borderRadius:16, background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{game.sport?.split(" ")[0]}</div>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#111", letterSpacing:0.5 }}>{game.title}</div>
                <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>📍 {game.location} · {game.game_date}</div>
              </div>
            </div>

            {game.cost_per_player>0 ? (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#92400e", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cost per player</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:"#111", letterSpacing:0.5 }}>₹{game.cost_per_player}</div>
                <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Pay at the venue</div>
              </div>
            ):(
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#15803d", fontFamily:"'DM Sans',sans-serif" }}>🆓 Free to join</div>
              </div>
            )}

            <div style={{ background:isDirect?"#eff6ff":"#faf5ff", border:`1px solid ${isDirect?"#bfdbfe":"#e9d5ff"}`, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:isDirect?"#1d4ed8":"#7c3aed", fontFamily:"'DM Sans',sans-serif" }}>
                {isDirect?"⚡ You'll be added instantly":"🔒 Host reviews your request first"}
              </div>
            </div>

            {!isDirect && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7280", display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Message to host (optional)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Hey! I play casually and would love to join..." rows={3} className="input-field" style={{ resize:"none", lineHeight:1.5 }}/>
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#f3f4f6", color:"#374151", border:"none", borderRadius:14, padding:"13px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={async()=>{ setLoading(true); await onConfirm(game,note); setLoading(false); setDone(true); }}
                style={{ flex:2, background:isDirect?`linear-gradient(135deg,${color},${color}cc)`:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"#fff", border:"none", borderRadius:14, padding:"13px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {loading?"…":isDirect?"Confirm Join ✓":"Send Request →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CONFIRM CANCEL MODAL (host cancel game / player leave) ──────────────────

function ConfirmModal({ title, message, confirmLabel, confirmColor="#e11d48", onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet" style={{ maxHeight:"50vh" }}>
        <div className="modal-handle"/>
        <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
          <div style={{ fontSize:48, marginBottom:14 }}>⚠️</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:"#111", letterSpacing:0.5, marginBottom:8 }}>{title}</div>
          <p style={{ color:"#6b7280", fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.6, marginBottom:24 }}>{message}</p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, background:"#f3f4f6", color:"#374151", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Keep it</button>
            <button onClick={async()=>{ setLoading(true); await onConfirm(); setLoading(false); }} style={{ flex:2, background:confirmColor, color:"#fff", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {loading?"…":confirmLabel}
            </button>
          </div>
        </div>
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
  const shown    = tab==="pending"?pending:tab==="approved"?approved:rejected;
  const getGame  = id => games.find(g=>g.id===id);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:"#111", letterSpacing:0.5 }}>Join Requests</div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>×</button>
        </div>

        <div style={{ display:"flex", gap:0, borderBottom:"2px solid #f0f0f0", marginBottom:18 }}>
          {[["pending",pending.length],["approved",approved.length],["declined",rejected.length]].map(([t,c])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:"10px 0", background:"none", border:"none",
              color:tab===t?"#e11d48":"#9ca3af", fontWeight:700, fontSize:13,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              borderBottom:`2px solid ${tab===t?"#e11d48":"transparent"}`,
              textTransform:"capitalize", marginBottom:-2,
            }}>
              {t} {c>0&&<span style={{ background:tab===t?"#fff1f2":"#f3f4f6", color:tab===t?"#e11d48":"#9ca3af", borderRadius:99, padding:"1px 7px", fontSize:11, marginLeft:4 }}>{c}</span>}
            </button>
          ))}
        </div>

        {shown.length===0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No {tab} requests</div>
          </div>
        ) : shown.map(r=>(
          <div key={r.id} style={{ background:"#fafafa", borderRadius:16, padding:"14px 16px", marginBottom:12, border:"1px solid #f0f0f0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:r.note?10:tab==="pending"?10:0 }}>
              <Avatar letter={r.user_name[0]} color="#e11d48" size={40}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:"#111", fontFamily:"'DM Sans',sans-serif" }}>{r.user_name}</div>
                <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>
                  {getGame(r.game_id)?.title} · {timeAgo(r.created_at)}
                </div>
              </div>
              {tab!=="pending" && (
                <span style={{ fontSize:12, fontWeight:700, color:r.status==="approved"?"#15803d":"#dc2626" }}>
                  {r.status==="approved"?"✅ Approved":"❌ Declined"}
                </span>
              )}
            </div>
            {r.note && <div style={{ background:"#fff", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", border:"1px solid #f0f0f0" }}>"{r.note}"</div>}
            {tab==="pending" && (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>onReject(r)} style={{ flex:1, background:"#fff", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Decline</button>
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
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#111", letterSpacing:0.5 }}>{isHost?"Approved Players":"Host Contact"}</div>
            <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{game.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>×</button>
        </div>
        {contacts.length===0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No approved players yet</div>
          </div>
        ) : contacts.map((c,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"#fafafa", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid #f0f0f0" }}>
            <Avatar letter={c.avatar||c.name?.[0]||"?"} color="#e11d48" size={44}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#111", fontFamily:"'DM Sans',sans-serif" }}>{c.name}</div>
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>{c.phone?`📱 +91 ${c.phone}`:"No phone on file"}</div>
            </div>
            {c.phone && (
              <a href={`tel:+91${c.phone}`} style={{ background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", borderRadius:12, padding:"9px 16px", fontSize:13, fontWeight:700, textDecoration:"none", fontFamily:"'DM Sans',sans-serif" }}>Call</a>
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
    <div style={{ padding:"0 16px 120px", maxWidth:680, margin:"0 auto" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#111", letterSpacing:0.5 }}>My Profile</div>
      </div>

      <div style={{ background:"linear-gradient(135deg,#fff1f2,#fff)", border:"1px solid #fecdd3", borderRadius:24, padding:"24px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <div style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#e11d48,#f43f5e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>
            {(profile?.avatar||user.email[0]).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#111", letterSpacing:0.5 }}>{profile?.name||user.email}</div>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>{user.email}</div>
            {profile?.phone && (
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                +91 {profile.phone}
                {profile.phone_verified && <span style={{ fontSize:10, background:"#f0fdf4", color:"#15803d", borderRadius:6, padding:"1px 6px", fontWeight:700, border:"1px solid #bbf7d0" }}>✓ Verified</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[{v:myGames.length,l:"Hosted"},{v:"—",l:"Joined"},{v:"—",l:"Requests"}].map(s=>(
            <div key={s.l} style={{ background:"#fff", borderRadius:14, padding:"14px 0", textAlign:"center", border:"1px solid #f0f0f0" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#111", letterSpacing:0.5 }}>{s.v}</div>
              <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {myGames.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#111", letterSpacing:0.5, marginBottom:12 }}>Your Games</div>
          {myGames.map(g=>{
            const c = getSportColor(g.sport);
            return (
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid #f0f0f0", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${c}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{g.sport?.split(" ")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#111", fontFamily:"'DM Sans',sans-serif" }}>{g.title}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{g.area} · {g.game_date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:c, fontFamily:"'DM Sans',sans-serif" }}>{g.filled_slots}/{g.total_slots}</div>
                  {g.cost_per_player>0 && <div style={{ fontSize:11, color:"#92400e" }}>₹{g.cost_per_player}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onLogout} style={{ width:"100%", background:"#fff1f2", color:"#e11d48", border:"1.5px solid #fecdd3", borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
        Sign Out
      </button>
    </div>
  );
}

// ─── EXPLORE SCREEN ───────────────────────────────────────────────────────────

function ExploreScreen({ games, onJoin, currentUserId, myRequests, onViewContact, onCancel, onLeave }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ padding:"0 16px 120px", maxWidth:680, margin:"0 auto" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#111", letterSpacing:0.5 }}>Explore Sports</div>
        <div style={{ fontSize:13, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Browse by sport in Udaipur</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {SPORTS.map(s=>{
          const c = SPORT_COLORS[s.name]||"#e11d48";
          const count = games.filter(g=>g.sport?.includes(s.name)).length;
          const sel = selected===s.name;
          return (
            <div key={s.name} onClick={()=>setSelected(sel?null:s.name)} style={{
              background:sel?`${c}08`:"#fff", border:`2px solid ${sel?c:"#f0f0f0"}`,
              borderRadius:18, padding:"18px 12px", cursor:"pointer",
              textAlign:"center", transition:"all 0.15s",
              boxShadow:sel?`0 4px 16px ${c}22`:"0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize:30, marginBottom:8 }}>{s.emoji}</div>
              <div style={{ fontSize:12, fontWeight:700, color:sel?c:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{s.name}</div>
              <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{count} game{count!==1?"s":""}</div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#111", letterSpacing:0.5 }}>{selected} Games</div>
          {games.filter(g=>g.sport?.includes(selected)).length===0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🏟️</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No {selected} games yet</div>
            </div>
          ) : games.filter(g=>g.sport?.includes(selected)).map(g=>(
            <GameCard key={g.id} game={g} onJoin={onJoin} currentUserId={currentUserId} myRequests={myRequests} onViewContact={onViewContact} onCancel={onCancel} onLeave={onLeave}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY SCREEN ──────────────────────────────────────────────────────────

function ActivityScreen({ myRequests, hostRequests, games, onApprove, onReject }) {
  const getGame = id => games.find(g=>g.id===id);
  return (
    <div style={{ padding:"0 16px 120px", maxWidth:680, margin:"0 auto" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#111", letterSpacing:0.5 }}>Activity</div>
        <div style={{ fontSize:13, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Your requests and notifications</div>
      </div>

      {/* My sent requests */}
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#111", letterSpacing:0.5, marginBottom:12 }}>My Requests</div>
      {myRequests.length===0 ? (
        <div style={{ background:"#fafafa", borderRadius:16, padding:"24px", textAlign:"center", color:"#9ca3af", marginBottom:24, border:"1px solid #f0f0f0" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎮</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>No requests sent yet</div>
        </div>
      ) : (
        <div style={{ marginBottom:24 }}>
          {myRequests.map(r=>{
            const g = getGame(r.game_id);
            return (
              <div key={r.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid #f0f0f0", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:24 }}>{g?.sport?.split(" ")[0]||"🎮"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#111", fontFamily:"'DM Sans',sans-serif" }}>{g?.title||"Game"}</div>
                  <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{timeAgo(r.created_at)}</div>
                </div>
                <span style={{
                  fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:99, fontFamily:"'DM Sans',sans-serif",
                  background:r.status==="approved"?"#f0fdf4":r.status==="rejected"?"#fff1f2":"#fffbeb",
                  color:r.status==="approved"?"#15803d":r.status==="rejected"?"#dc2626":"#92400e",
                }}>
                  {r.status==="approved"?"✅ Approved":r.status==="rejected"?"❌ Declined":"⏳ Pending"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Incoming requests */}
      {hostRequests.length>0 && (
        <>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#111", letterSpacing:0.5, marginBottom:12 }}>Requests for Your Games</div>
          {hostRequests.map(r=>{
            const g = getGame(r.game_id);
            return (
              <div key={r.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:`1px solid ${r.status==="pending"?"#fecdd3":"#f0f0f0"}`, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:r.status==="pending"?10:0 }}>
                  <Avatar letter={r.user_name[0]} color="#e11d48" size={38}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#111", fontFamily:"'DM Sans',sans-serif" }}>{r.user_name}</div>
                    <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{g?.title} · {timeAgo(r.created_at)}</div>
                  </div>
                  {r.status!=="pending" && (
                    <span style={{ fontSize:12, fontWeight:700, color:r.status==="approved"?"#15803d":"#dc2626" }}>
                      {r.status==="approved"?"✅":"❌"}
                    </span>
                  )}
                </div>
                {r.note && <div style={{ background:"#fafafa", borderRadius:10, padding:"8px 12px", marginBottom:10, fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", border:"1px solid #f0f0f0" }}>"{r.note}"</div>}
                {(r.status==="pending" || r.status==="rejected") && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>onReject(r)} style={{ flex:1, background:"#fff1f2", color:"#dc2626", border:"1px solid #fecdd3", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Decline</button>
                    <button onClick={()=>onApprove(r)} style={{ flex:2, background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{r.status==="rejected" ? "↺ Reapprove" : "✓ Approve"}</button>
                  </div>
                )}
              </div>
            );
          })}
        </>
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
  const [confirmData, setConfirmData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState({ msg:"", type:"" });

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast({ msg:"", type:"" }), 3500); };

  useEffect(()=>{ requestNotifPermission(); }, []);

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

  const loadProfile = async id => { const{data}=await supabase.from("profiles").select("*").eq("id",id).single(); setProfile(data); setLoading(false); };

  useEffect(()=>{ if(!user)return; loadGames(); loadRequests(); },[user]);

  // Realtime
  useEffect(()=>{

if(!user) return;

const ch = supabase
.channel("games-rt")

.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"games"
},
payload=>{

console.log("games realtime",payload);

loadGames();

if(payload.eventType==="DELETE"){

setGames(prev =>
  prev.filter(g => g.id !== payload.old.id)
);

showToast("Game removed");

sendNotif(
  "Game Cancelled ❌",
  "A game was cancelled"
);

}

if(payload.eventType==="INSERT"){

sendNotif(
"New Game Posted 🎮",
"Someone posted a new game"
);

}

}
)

.subscribe();

return ()=>supabase.removeChannel(ch);

},[user]);

  useEffect(()=>{
    if(!user)return;
    const ch = supabase.channel("req-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"requests"},p=>{
        if(p.new.user_id===user.id){
          loadRequests();
          if(p.eventType==="INSERT"){

showToast("New join request received 📩");

sendNotif(
"New Join Request 📩",
"Someone requested to join"
);

loadRequests();
loadGames();

}
          if(p.new.status==="approved"){ showToast("Your request was approved! ✅"); sendNotif("Approved! ✅", "You got a spot. Check contact info on the game card."); } else if(p.new.status==="rejected"){ showToast("Your request was declined.", "error"); sendNotif("Request Declined", "The host could not take you this time."); }
          if(p.new.status==="rejected"){

showToast("Request rejected");

sendNotif(
"Request Rejected ❌",
"Host declined your request"
);

loadRequests();
loadGames();

}
        }
      }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[user]);

  const loadGames    = async()=>{ const{data}=await supabase.from("games").select("*").order("created_at",{ascending:false}); setGames(data||[]); };
  const loadRequests = async()=>{ const{data}=await supabase.from("requests").select("*").order("created_at",{ascending:false}); setRequests(data||[]); };

  const handlePost = async form => {
    const color = getSportColor(form.sport);
    const title = form.isUrgent?`⚡ Need ${form.urgentNeed} in ${form.urgentMins}mins — ${form.title}`:form.title;
    const{error}=await supabase.from("games").insert([{
      sport:form.sport, title, location:`${form.venue}, ${form.area}`, area:form.area,
      game_date:form.date, game_time:form.time,
      total_slots:+form.totalSlots, filled_slots:+form.filledSlots,
      skill_level:form.skillLevel,
      host_name:profile?.name||user.email, host_id:user.id,
      host_avatar:profile?.avatar||user.email[0].toUpperCase(),
      color, tags:form.tags?form.tags.split(",").map(t=>t.trim()).filter(Boolean):[],
      join_type:form.joinType, cost_per_player:+form.costPerPlayer,
    }]);
    if(error){ showToast("Failed to post.", "error"); return; }
    showToast("Game posted! 🎉"); setShowPost(false); loadGames();
  };

  const handleJoinConfirm = async(game, note)=>{
    if(game.join_type==="direct"){
      await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);
      showToast(`Joined ${game.title}! 🏟️`);
    } else {
      await supabase.from("requests").insert([{ game_id:game.id, user_id:user.id, user_name:profile?.name||user.email, note:note||null, status:"pending" }]);
      showToast("Request sent! 📩");
    }
    setJoining(null); loadGames(); loadRequests();
  };

  // Host cancels game
  const handleCancelGame = game => {
    setConfirmData({
      title:"Cancel This Game?",
      message:`This will remove "${game.title}" and notify all players that it's been cancelled.`,
      confirmLabel:"Yes, Cancel Game",
      confirmColor:"#e11d48",
      onConfirm: async()=>{

try{

const { error:reqErr } = await supabase
.from("requests")
.delete()
.eq("game_id",game.id);

if(reqErr){
console.log(reqErr);
throw reqErr;
}

const { data:deletedGame, error:gameErr } = await supabase
.from("games")
.delete()
.eq("id",game.id)
.select();

console.log("DELETED GAME", deletedGame);
console.log("DELETE ERROR", gameErr);

if(gameErr){
console.log(gameErr);
throw gameErr;
}

setGames(prev =>
prev.filter(g=>g.id!==game.id)
);

showToast("Game cancelled successfully.");

}catch(err){

console.log(err);

showToast(
err.message || "Failed to cancel game",
"error"
);

}finally{

setConfirmData(null);

}

      },
    });
  };

  // Player leaves game
  const handleLeaveGame = (game, req)=>{
    setConfirmData({
      title:"Leave This Game?",
      message:`You'll lose your spot in "${game.title}" and the host will be notified.`,
      confirmLabel:"Yes, Leave Game",
      confirmColor:"#e11d48",
      onConfirm: async()=>{
        if(req){ await supabase.from("requests").update({status:"left"}).eq("id",req.id); }
        if(game.join_type==="direct" && game.filled_slots>0){
          await supabase.from("games").update({filled_slots:game.filled_slots-1}).eq("id",game.id);
        }
        showToast("You've left the game.");
        setConfirmData(null); loadGames(); loadRequests();
      },
    });
  };

  const handleApprove = async req=>{
    await supabase.from("requests").update({status:"approved"}).eq("id",req.id);
    const game=games.find(g=>g.id===req.game_id);
    if(game) await supabase.from("games").update({filled_slots:game.filled_slots+1}).eq("id",game.id);
    showToast(`${req.user_name} approved! ✅`);
    sendNotif(
  "Request Approved ✅",
  `You were approved for ${game?.title || "a game"}`
);loadGames(); loadRequests();
  };

  const handleReject = async req => {
  const { error } = await supabase
    .from("requests")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString()
    })
    .eq("id", req.id);

  if (error) {
    showToast("Failed to reject request", "error");
    return;
  }

  showToast("Request declined.");

  sendNotif(
    "Request Declined ❌",
    "Host declined your join request."
  );

  loadRequests();
};

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
  const myRequests   = requests.filter(r=>r.user_id===user?.id&&r.status!=="left");
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
    <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONTS} rel="stylesheet"/>
      <style>{CSS}</style>
      <div style={{ width:56, height:56, borderRadius:18, background:"linear-gradient(135deg,#e11d48,#f43f5e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, boxShadow:"0 8px 24px rgba(225,29,72,0.3)" }}>🏟️</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:"#111", letterSpacing:2 }}>SQUAD UP</div>
      <Spinner size={24}/>
    </div>
  );

  if(!user) return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONTS} rel="stylesheet"/>
      <AuthPage onAuth={u=>{ setUser(u); loadProfile(u.id); }}/>
    </>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONTS} rel="stylesheet"/>
      <style>{CSS}</style>

      <div style={{ minHeight:"100vh", background:"#f8f8f8", fontFamily:"'DM Sans',sans-serif", overflowX:"hidden" }}>

        {/* ── HOME ── */}
        {tab==="home" && (
          <div style={{ maxWidth:680, margin:"0 auto", padding:"0 16px 120px", boxSizing:"border-box" }}>

            {/* Header */}
            <div style={{ padding:"20px 0 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#e11d48,#f43f5e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 12px rgba(225,29,72,0.3)", flexShrink:0 }}>🏟️</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#111", letterSpacing:1, lineHeight:1 }}>SQUAD UP</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>Udaipur · Find your game</div>
                </div>
              </div>
              <div onClick={()=>setShowRequests(true)} style={{ position:"relative", cursor:"pointer", background:"#fff", borderRadius:14, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:"1px solid #f0f0f0", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                🔔
                {pendingCount>0&&<div style={{ position:"absolute", top:-4, right:-4, background:"#e11d48", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>{pendingCount}</div>}
              </div>
            </div>

            {/* Hero */}
            <div style={{ background:"#111", borderRadius:22, padding:"22px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-20, top:-20, fontSize:110, opacity:0.06 }}>⚽</div>
              <div style={{ fontSize:12, color:"#e11d4888", fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>
                Hey {(profile?.name||user.email).split(" ")[0]} 👋
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#fff", lineHeight:1.2, marginBottom:16, letterSpacing:0.5 }}>
                Find players nearby.<br/>
                <span style={{ color:"#e11d48" }}>Complete your squad</span> instantly.
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setSport("All")} style={{ background:"linear-gradient(135deg,#e11d48,#f43f5e)", color:"#fff", border:"none", borderRadius:12, padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 14px rgba(225,29,72,0.4)" }}>
                  Join a Game
                </button>
                <button onClick={()=>setShowPost(true)} style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  + Create Game
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:14 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.4 }}>🔍</span>
              <input className="input-field" placeholder="Search games, venues, areas..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:42 }}/>
            </div>

            {/* Sport filters */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:10, scrollbarWidth:"none" }}>
              {sportFilters.map(f=>{
                const sel = sportFilter===f;
                const c = SPORT_COLORS[f]||"#e11d48";
                return (
                  <button key={f} onClick={()=>setSport(f)} style={{
                    flexShrink:0, padding:"7px 16px", borderRadius:99,
                    border:`2px solid ${sel?c:"#e5e7eb"}`,
                    background:sel?`${c}10`:"#fff",
                    color:sel?c:"#6b7280", fontSize:12, fontWeight:700,
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s", whiteSpace:"nowrap",
                  }}>
                    {f==="All"?"🎮 All":`${SPORTS.find(s=>s.name===f)?.emoji} ${f}`}
                  </button>
                );
              })}
            </div>

            {/* Area filters */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }}>
              {areaFilters.map(a=>{
                const sel = areaFilter===a;
                return (
                  <button key={a} onClick={()=>setArea(a)} style={{
                    flexShrink:0, padding:"6px 14px", borderRadius:99,
                    border:`2px solid ${sel?"#e11d48":"#e5e7eb"}`,
                    background:sel?"#fff1f2":"#fff",
                    color:sel?"#e11d48":"#6b7280", fontSize:12,
                    fontWeight:600, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s", whiteSpace:"nowrap",
                  }}>{a}</button>
                );
              })}
            </div>

            {/* Section heading */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#111", letterSpacing:0.5 }}>Games Near You</div>
              <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>{filtered.length} found</div>
            </div>

            {/* Urgent section */}
            {filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).length>0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ background:"#f59e0b", color:"#fff", fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:99, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5 }}>⚡ URGENT</span>
                  <span style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans',sans-serif" }}>Last-minute games</span>
                </div>
                {filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).map(g=>(
                  <div key={g.id} style={{ marginBottom:12 }}>
                    <GameCard game={g} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact} onCancel={handleCancelGame} onLeave={handleLeaveGame}/>
                  </div>
                ))}
              </div>
            )}

            {/* Regular games */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {filtered.filter(g=>!(g.is_urgent||g.title?.startsWith("⚡"))).length===0&&filtered.filter(g=>g.is_urgent||g.title?.startsWith("⚡")).length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🏟️</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#374151", letterSpacing:0.5, marginBottom:6 }}>No games yet</div>
                  <div style={{ fontSize:14, marginBottom:20 }}>Be the first to post one!</div>
                  <button className="btn-red" style={{ width:"auto", padding:"12px 28px" }} onClick={()=>setShowPost(true)}>+ Post a Game</button>
                </div>
              ) : filtered.filter(g=>!(g.is_urgent||g.title?.startsWith("⚡"))).map(g=>(
                <GameCard key={g.id} game={g} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact} onCancel={handleCancelGame} onLeave={handleLeaveGame}/>
              ))}
            </div>
            <div style={{ height:20 }}/>
          </div>
        )}

        {/* ── EXPLORE ── */}
        {tab==="explore" && <ExploreScreen games={games} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests} onViewContact={handleViewContact} onCancel={handleCancelGame} onLeave={handleLeaveGame}/>}

        {/* ── ACTIVITY ── */}
        {tab==="activity" && <ActivityScreen myRequests={myRequests} hostRequests={hostRequests} games={games} onApprove={handleApprove} onReject={handleReject}/>}

        {/* ── PROFILE ── */}
        {tab==="profile" && <ProfileScreen user={user} profile={profile} myGames={myGames} onLogout={handleLogout}/>}

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"rgba(255,255,255,0.95)", backdropFilter:"blur(20px)",
          borderTop:"1px solid #f0f0f0", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"space-around",
          padding:"6px 8px 24px",
        }}>
          {[
            { id:"home",     icon:"🏠", label:"Home" },
            { id:"explore",  icon:"🔭", label:"Explore" },
          ].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className="nav-item" style={{ opacity:tab===n.id?1:0.45 }}>
              <span style={{ fontSize:22 }}>{n.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, color:tab===n.id?"#e11d48":"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>{n.label}</span>
            </button>
          ))}

          {/* Center button */}
          <button onClick={()=>setShowPost(true)} style={{
            width:54, height:54, borderRadius:"50%",
            background:"linear-gradient(135deg,#e11d48,#f43f5e)",
            border:"none", cursor:"pointer", fontSize:24,
            boxShadow:"0 4px 18px rgba(225,29,72,0.45)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transform:"translateY(-8px)", transition:"all 0.2s",
            color:"#fff", fontWeight:700,
          }}>+</button>

          {[
            { id:"activity", icon:"⚡", label:"Activity", badge:activityCount },
            { id:"profile",  icon:"👤", label:"Profile" },
          ].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className="nav-item" style={{ opacity:tab===n.id?1:0.45, position:"relative" }}>
              <span style={{ fontSize:22 }}>{n.icon}</span>
              <span style={{ fontSize:10, fontWeight:700, color:tab===n.id?"#e11d48":"#6b7280", fontFamily:"'DM Sans',sans-serif" }}>{n.label}</span>
              {n.badge>0&&<div style={{ position:"absolute", top:2, right:12, background:"#e11d48", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{n.badge}</div>}
            </button>
          ))}
        </div>

        {/* Modals */}
        {showPost     && <PostGameModal onClose={()=>setShowPost(false)} onPost={handlePost} user={{ name:profile?.name||user.email }}/>}
        {joining      && <JoinModal game={joining} onClose={()=>setJoining(null)} onConfirm={handleJoinConfirm} user={{ name:profile?.name||user.email }}/>}
        {showRequests && <RequestsPanel onClose={()=>setShowRequests(false)} onApprove={handleApprove} onReject={handleReject} requests={hostRequests} games={games}/>}
        {contactData  && <ContactModal data={contactData} onClose={()=>setContactData(null)}/>}
        {confirmData  && <ConfirmModal {...confirmData} onClose={()=>setConfirmData(null)}/>}

        <Toast msg={toast.msg} type={toast.type}/>
      </div>
    </>
  );
}
