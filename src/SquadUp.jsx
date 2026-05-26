import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SPORTS = [
  "⚽ Football","🏀 Basketball","🏏 Cricket","🎾 Tennis",
  "🏐 Volleyball","🏑 Hockey","🏓 Table Tennis","🤸 Badminton","🥒 Pickleball"
];

const UDAIPUR_AREAS = [
  "Ashok Nagar","Navratan","Hiran Magri","Sector 4","Sector 11",
  "Pratap Nagar","Suraj Pol","Chetak Circle","Bhupalpura",
  "Fatehpura","Shobhagpura","Ambamata","Bhupal Colony","Clock Tower Area"
];

const SPORT_COLORS = [
  "#16a34a","#2563eb","#ea580c","#db2777",
  "#9333ea","#d97706","#0d9488","#4f46e5","#dc2626"
];

const SKILL_COLORS = {
  Casual:      { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0" },
  Competitive: { bg:"#fff1f2", text:"#be123c", border:"#fecdd3" },
  Beginner:    { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe" },
};

const inputStyle = {
  width:"100%", padding:"12px 16px", borderRadius:14,
  border:"2px solid #e5e7eb", fontSize:14,
  fontFamily:"'Plus Jakarta Sans', sans-serif", outline:"none",
  boxSizing:"border-box", color:"#111", background:"#fff",
  transition:"border-color 0.2s",
};

const labelStyle = {
  display:"block", fontSize:12, fontWeight:700, color:"#6b7280",
  marginBottom:6, fontFamily:"'Plus Jakarta Sans', sans-serif",
  textTransform:"uppercase", letterSpacing:0.8,
};

function getColor(sport) {
  const idx = SPORTS.findIndex(s=>s===sport);
  return SPORT_COLORS[idx>=0?idx:0];
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────

async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendPushNotification(title, body, icon="/icon-192.png") {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon });
  }
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background: type==="error" ? "#dc2626" : "#111",
      color:"#fff", padding:"14px 24px", borderRadius:16, fontSize:14,
      fontWeight:600, fontFamily:"'Plus Jakarta Sans', sans-serif",
      boxShadow:"0 8px 32px rgba(0,0,0,0.2)", zIndex:9999,
      whiteSpace:"nowrap",
    }}>
      {type==="error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
      <div style={{ width:32, height:32, border:"3px solid #f0f0f0", borderTop:"3px solid #16a34a", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Avatar({ letter, color, size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`linear-gradient(135deg, ${color}22, ${color}44)`,
      border:`2px solid ${color}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*0.38, color,
      fontFamily:"'Plus Jakarta Sans', sans-serif", flexShrink:0,
    }}>{letter}</div>
  );
}

function SlotBar({ filled, total, color }) {
  const pct = Math.min((filled/total)*100, 100);
  const remaining = total - filled;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          {filled} of {total} players joined
        </span>
        <span style={{ fontSize:12, fontWeight:700, color:remaining<=0?"#dc2626":color, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          {remaining<=0 ? "🔴 Full" : `${remaining} spots open`}
        </span>
      </div>
      <div style={{ height:8, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius:99, transition:"width 0.5s ease",
        }}/>
      </div>
    </div>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────

function GameCard({ game, onJoin, currentUserId, myRequests, onViewContact }) {
  const skill   = SKILL_COLORS[game.skill_level] || SKILL_COLORS.Casual;
  const isFull  = game.filled_slots >= game.total_slots;
  const isHost  = game.host_id === currentUserId;
  const myReq   = myRequests?.find(r=>r.game_id===game.id);
  const color   = game.color || getColor(game.sport);
  const isApproved = myReq?.status === "approved";

  const getJoinBtn = () => {
    if (isFull && !isHost && !isApproved) return { label:"Full", disabled:true, bg:"#f3f4f6", color:"#9ca3af" };
    if (isHost)   return { label:"Your Game", disabled:true, bg:"#f3f4f6", color:"#6b7280" };
    if (myReq?.status==="pending")  return { label:"⏳ Pending", disabled:true, bg:"#fef9c3", color:"#92400e" };
    if (myReq?.status==="approved") return { label:"✅ Joined!", disabled:true, bg:"#dcfce7", color:"#15803d" };
    if (myReq?.status==="rejected") return { label:"❌ Declined", disabled:true, bg:"#fee2e2", color:"#dc2626" };
    return {
      label: game.join_type==="direct" ? "Join Game" : "Request Spot",
      disabled: false,
      bg: color, color: "#fff"
    };
  };

  const btn = getJoinBtn();

  return (
    <div style={{
      background:"#fff", borderRadius:20, overflow:"hidden",
      boxShadow:"0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
      border:"1px solid #f3f4f6",
      transition:"transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.10)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)";}}
    >
      {/* Color top bar */}
      <div style={{ height:4, background:`linear-gradient(90deg, ${color}, ${color}88)` }}/>

      <div style={{ padding:"18px 20px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20 }}>{game.sport.split(" ")[0]}</span>
              <span style={{
                fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
                background:skill.bg, color:skill.text,
                border:`1px solid ${skill.border}`,
                fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}>{game.skill_level}</span>
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif", lineHeight:1.3 }}>
              {game.title}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📍</span>
            <span style={{ fontSize:13, color:"#4b5563", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{game.location}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🕐</span>
            <span style={{ fontSize:13, color:"#4b5563", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{game.game_date} at {game.game_time}</span>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          <span style={{
            fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:99,
            background: game.cost_per_player===0 ? "#f0fdf4" : "#fffbeb",
            color: game.cost_per_player===0 ? "#15803d" : "#92400e",
            border: `1px solid ${game.cost_per_player===0 ? "#bbf7d0" : "#fde68a"}`,
            fontFamily:"'Plus Jakarta Sans', sans-serif",
          }}>
            {game.cost_per_player===0 ? "🆓 Free" : `💰 ₹${game.cost_per_player}/player`}
          </span>
          <span style={{
            fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:99,
            background: game.join_type==="direct" ? "#eff6ff" : "#faf5ff",
            color: game.join_type==="direct" ? "#1d4ed8" : "#7c3aed",
            border: `1px solid ${game.join_type==="direct" ? "#bfdbfe" : "#e9d5ff"}`,
            fontFamily:"'Plus Jakarta Sans', sans-serif",
          }}>
            {game.join_type==="direct" ? "⚡ Open" : "🔒 Approval"}
          </span>
          {(game.tags||[]).slice(0,2).map(t=>(
            <span key={t} style={{
              fontSize:12, padding:"4px 10px", borderRadius:99,
              background:"#f9fafb", color:"#6b7280",
              border:"1px solid #e5e7eb",
              fontFamily:"'Plus Jakarta Sans', sans-serif",
            }}>{t}</span>
          ))}
        </div>

        <SlotBar filled={game.filled_slots} total={game.total_slots} color={color}/>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Avatar letter={game.host_avatar||"?"} color={color} size={34}/>
            <div>
              <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Hosted by</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{game.host_name}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Show contact button if approved or is host */}
            {(isApproved || isHost) && (
              <button onClick={()=>onViewContact(game, isHost)} style={{
                background:"#f0fdf4", color:"#15803d",
                border:"1px solid #bbf7d0", borderRadius:12,
                padding:"8px 12px", fontSize:12, fontWeight:700,
                cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}>📞 Contact</button>
            )}
            <button
              onClick={()=>!btn.disabled&&onJoin(game)}
              style={{
                background:btn.bg, color:btn.color,
                border:"none", borderRadius:12,
                padding:"9px 18px", fontSize:13, fontWeight:700,
                cursor:btn.disabled?"default":"pointer",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                transition:"opacity 0.15s",
              }}
            >{btn.label}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT MODAL ────────────────────────────────────────────────────────────

function ContactModal({ data, onClose }) {
  if (!data) return null;
  const { game, contacts, isHost } = data;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:400, boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:20, fontWeight:800, color:"#111", margin:0 }}>
              {isHost ? "Approved Players" : "Host Contact"}
            </h2>
            <p style={{ fontSize:12, color:"#9ca3af", margin:"4px 0 0", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{game.title}</p>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer" }}>×</button>
        </div>

        {contacts.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:14 }}>No approved players yet</div>
          </div>
        ) : contacts.map((c,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"#f9fafb", borderRadius:14, marginBottom:10 }}>
            <Avatar letter={c.avatar||c.name[0]} color="#16a34a" size={42}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{c.name}</div>
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                {c.phone ? `📱 +91 ${c.phone}` : "No phone available"}
              </div>
              {c.email && <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>✉️ {c.email}</div>}
            </div>
            {c.phone && (
              <a href={`tel:+91${c.phone}`} style={{
                background:"#16a34a", color:"#fff", borderRadius:10,
                padding:"8px 12px", fontSize:12, fontWeight:700,
                textDecoration:"none", fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}>Call</a>
            )}
          </div>
        ))}
        <button onClick={onClose} style={{
          width:"100%", marginTop:8, background:"#111", color:"#fff",
          border:"none", borderRadius:14, padding:"13px 0", fontSize:14,
          fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif",
        }}>Close</button>
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
  const color = game.color || getColor(game.sport);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(game, note);
    setLoading(false);
    setDone(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:400, textAlign:"center", boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
        {done ? (
          <>
            <div style={{ fontSize:56, marginBottom:12 }}>{isDirect ? "🎉" : "📩"}</div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:22, fontWeight:800, color:"#111", margin:"0 0 8px" }}>
              {isDirect ? `You're in, ${user.name?.split(" ")[0]}!` : "Request sent!"}
            </h2>
            <p style={{ color:"#6b7280", fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:14, marginBottom:20, lineHeight:1.6 }}>
              {isDirect ? "See you on the field! The host's contact will appear on the game card." : `Your request is with ${game.host_name}. You'll get notified when approved.`}
            </p>
            {game.cost_per_player > 0 && (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#92400e", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  💰 Pay ₹{game.cost_per_player} to the host at the venue
                </div>
              </div>
            )}
            <button onClick={onClose} style={{ width:"100%", background:"#111", color:"#fff", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Done</button>
          </>
        ) : (
          <>
            <div style={{ fontSize:36, marginBottom:10 }}>{game.sport.split(" ")[0]}</div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:18, fontWeight:800, color:"#111", margin:"0 0 4px" }}>{game.title}</h2>
            <p style={{ color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:13, marginBottom:16 }}>📍 {game.location} · {game.game_date}</p>

            {game.cost_per_player > 0 ? (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:14, padding:"12px 16px", marginBottom:14, textAlign:"left" }}>
                <div style={{ fontSize:12, color:"#92400e", fontFamily:"'Plus Jakarta Sans', sans-serif", fontWeight:600 }}>Cost per player</div>
                <div style={{ fontSize:24, fontWeight:800, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>₹{game.cost_per_player}</div>
                <div style={{ fontSize:11, color:"#b45309", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Pay at the venue</div>
              </div>
            ) : (
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:"10px 16px", marginBottom:14, textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#15803d", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>🆓 Free to join</div>
              </div>
            )}

            <div style={{ background:isDirect?"#eff6ff":"#faf5ff", borderRadius:14, padding:"10px 16px", marginBottom:14, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:600, color:isDirect?"#1d4ed8":"#7c3aed", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                {isDirect ? "⚡ You'll be added directly" : "🔒 Host reviews your request first"}
              </div>
            </div>

            {!isDirect && (
              <div style={{ marginBottom:14, textAlign:"left" }}>
                <label style={labelStyle}>Message to host (optional)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="Hey! I play casually, would love to join..."
                  rows={3} style={{ ...inputStyle, resize:"none", lineHeight:1.5 }}/>
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#f3f4f6", border:"none", borderRadius:12, padding:"12px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif", color:"#374151" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ flex:2, background:isDirect?color:"#7c3aed", border:"none", borderRadius:12, padding:"12px 0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif", color:"#fff" }}>
                {loading ? "Please wait..." : isDirect ? "Confirm Join ✓" : "Send Request →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── REQUESTS MODAL ───────────────────────────────────────────────────────────

function RequestsModal({ onClose, onApprove, onReject, requests, games }) {
  const pending = requests.filter(r=>r.status==="pending");
  const handled = requests.filter(r=>r.status!=="pending");
  const getGame = (id) => games.find(g=>g.id===id);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:20, fontWeight:800, color:"#111", margin:0 }}>Join Requests</h2>
            {pending.length > 0 && <span style={{ fontSize:12, color:"#7c3aed", fontWeight:700, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{pending.length} need your response</span>}
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer" }}>×</button>
        </div>

        {requests.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
            <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:15, fontWeight:600 }}>No requests yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>When players request to join your games, they'll show up here</div>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", letterSpacing:1, textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans', sans-serif", marginBottom:12 }}>Waiting for you</div>
            {pending.map(r=>{
              const game = getGame(r.game_id);
              return (
                <div key={r.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:16, padding:"16px", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <Avatar letter={r.user_name[0]} color="#7c3aed" size={42}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{r.user_name}</div>
                      <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                        wants to join <b style={{color:"#374151"}}>{game?.title || "your game"}</b>
                      </div>
                    </div>
                  </div>
                  {r.note && (
                    <div style={{ background:"#f9fafb", borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:13, color:"#374151", fontFamily:"'Plus Jakarta Sans', sans-serif", fontStyle:"italic", lineHeight:1.5 }}>
                      "{r.note}"
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>onReject(r)} style={{ flex:1, background:"#fff", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Decline</button>
                    <button onClick={()=>onApprove(r)} style={{ flex:2, background:"#16a34a", color:"#fff", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>✓ Approve</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {handled.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans', sans-serif", margin:"16px 0 12px" }}>Past</div>
            {handled.map(r=>(
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#f9fafb", borderRadius:12, marginBottom:8 }}>
                <Avatar letter={r.user_name[0]} color={r.status==="approved"?"#16a34a":"#dc2626"} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{r.user_name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{getGame(r.game_id)?.title}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:r.status==="approved"?"#15803d":"#dc2626", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  {r.status==="approved" ? "✅ Approved" : "❌ Declined"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── POST GAME MODAL ──────────────────────────────────────────────────────────

function PostGameModal({ onClose, onPost, user }) {
  const [form, setForm] = useState({
    sport:"⚽ Football", title:"", venue:"", area:UDAIPUR_AREAS[0],
    date:"", time:"", totalSlots:10, filledSlots:1,
    skillLevel:"Casual", tags:"", joinType:"direct", costPerPlayer:0,
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handlePost = async () => {
    if (!form.title.trim()) return alert("Please enter a game title.");
    if (!form.venue.trim()) return alert("Please enter a venue name.");
    if (!form.date)         return alert("Please select a date.");
    if (!form.time)         return alert("Please select a time.");
    setLoading(true);
    await onPost(form);
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:22, fontWeight:800, color:"#111", margin:0 }}>Post a Game</h2>
            <p style={{ fontSize:13, color:"#9ca3af", margin:"4px 0 0", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>as <b style={{color:"#111"}}>{user.name}</b></p>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer" }}>×</button>
        </div>

        {[
          { label:"Sport", el:<select value={form.sport} onChange={e=>set("sport",e.target.value)} style={inputStyle}>{SPORTS.map(s=><option key={s}>{s}</option>)}</select> },
          { label:"Game Title *", el:<input placeholder="e.g. Evening 5-a-side at Navratan" value={form.title} onChange={e=>set("title",e.target.value)} style={inputStyle}/> },
          { label:"Venue *", el:<input placeholder="e.g. Green Turf, City Sports Complex" value={form.venue} onChange={e=>set("venue",e.target.value)} style={inputStyle}/> },
          { label:"Area", el:<select value={form.area} onChange={e=>set("area",e.target.value)} style={inputStyle}>{UDAIPUR_AREAS.map(a=><option key={a}>{a}</option>)}</select> },
          { label:"Date *", el:<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inputStyle}/> },
          { label:"Time *", el:<input type="time" value={form.time} onChange={e=>set("time",e.target.value)} style={inputStyle}/> },
        ].map(({label,el})=>(
          <div key={label} style={{ marginBottom:14 }}>
            <label style={labelStyle}>{label}</label>{el}
          </div>
        ))}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><label style={labelStyle}>Total Players</label><input type="number" value={form.totalSlots} min={2} max={30} onChange={e=>set("totalSlots",+e.target.value)} style={inputStyle}/></div>
          <div><label style={labelStyle}>You Already Have</label><input type="number" value={form.filledSlots} min={1} onChange={e=>set("filledSlots",+e.target.value)} style={inputStyle}/></div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Cost per Player (₹) — 0 for free</label>
          <input type="number" value={form.costPerPlayer} min={0} onChange={e=>set("costPerPlayer",+e.target.value)} style={inputStyle}/>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Who can join?</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { val:"direct", icon:"⚡", title:"Anyone", desc:"Players join instantly" },
              { val:"request", icon:"🔒", title:"You Approve", desc:"Review each request" },
            ].map(opt=>(
              <div key={opt.val} onClick={()=>set("joinType",opt.val)} style={{
                border:`2px solid ${form.joinType===opt.val?(opt.val==="direct"?"#2563eb":"#7c3aed"):"#e5e7eb"}`,
                borderRadius:14, padding:"14px 12px", cursor:"pointer",
                background:form.joinType===opt.val?(opt.val==="direct"?"#eff6ff":"#faf5ff"):"#fff",
                transition:"all 0.15s",
              }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{opt.icon}</div>
                <div style={{ fontSize:13, fontWeight:800, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{opt.title}</div>
                <div style={{ fontSize:11, color:"#6b7280", fontFamily:"'Plus Jakarta Sans', sans-serif", marginTop:2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Skill Level</label>
          <div style={{ display:"flex", gap:8 }}>
            {["Beginner","Casual","Competitive"].map(lv=>(
              <button key={lv} onClick={()=>set("skillLevel",lv)} style={{
                flex:1, padding:"10px 0", borderRadius:12,
                border:`2px solid ${form.skillLevel===lv?"#111":"#e5e7eb"}`,
                background:form.skillLevel===lv?"#111":"#fff",
                color:form.skillLevel===lv?"#fff":"#374151",
                fontWeight:700, fontSize:13, cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}>{lv}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input placeholder="e.g. Floodlit, Turf, Mixed, Friendly" value={form.tags} onChange={e=>set("tags",e.target.value)} style={inputStyle}/>
        </div>

        <button onClick={handlePost} disabled={loading} style={{
          width:"100%", background:loading?"#e5e7eb":"#111", color:loading?"#9ca3af":"#fff",
          border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:800,
          cursor:loading?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif",
        }}>{loading ? "Posting..." : "🚀 Post Game"}</button>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────

function ProfileModal({ user, profile, onClose, onLogout, myGames }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:400, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:20, fontWeight:800, color:"#111", margin:0 }}>My Profile</h2>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:32, height:32, fontSize:16, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, background:"#f9fafb", borderRadius:16, padding:"16px" }}>
          <Avatar letter={profile?.avatar||user.email[0].toUpperCase()} color="#16a34a" size={54}/>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{profile?.name||user.email}</div>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{user.email}</div>
            {profile?.phone && (
              <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'Plus Jakarta Sans', sans-serif", marginTop:2 }}>
                +91 {profile.phone}
                {profile.phone_verified && <span style={{ marginLeft:6, fontSize:11, background:"#dcfce7", color:"#15803d", borderRadius:6, padding:"1px 6px", fontWeight:700 }}>✓ Verified</span>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {[{ label:"Games Hosted", value:myGames.length, icon:"🏟️" },{ label:"Games Joined", value:"—", icon:"🤝" }].map(s=>(
            <div key={s.label} style={{ background:"#f9fafb", borderRadius:14, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:26, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {myGames.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans', sans-serif", marginBottom:10 }}>Your Games</div>
            {myGames.map(g=>(
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f9fafb", borderRadius:12, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{g.sport.split(" ")[0]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{g.title}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{g.area} · {g.game_date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#16a34a", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{g.total_slots-g.filled_slots} left</div>
                  {g.cost_per_player>0 && <div style={{ fontSize:11, color:"#92400e" }}>₹{g.cost_per_player}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onLogout} style={{ width:"100%", background:"#fff", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function SquadUp() {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [games, setGames]             = useState([]);
  const [requests, setRequests]       = useState([]);
  const [sportFilter, setSport]       = useState("All");
  const [areaFilter, setArea]         = useState("All Areas");
  const [search, setSearch]           = useState("");
  const [showPost, setShowPost]       = useState(false);
  const [joining, setJoining]         = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState({ msg:"", type:"" });

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast({ msg:"", type:"" }), 3500);
  };

  // Request notification permission on load
  useEffect(()=>{ requestNotificationPermission(); },[]);

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

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id",userId).single();
    setProfile(data);
    setLoading(false);
  };

  useEffect(()=>{ if (!user) return; loadGames(); loadRequests(); },[user]);

  // Realtime subscription for new games
  useEffect(()=>{
    if (!user) return;
    const channel = supabase
      .channel("games-channel")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"games" }, payload=>{
        const newGame = payload.new;
        if (newGame.host_id !== user.id) {
          setGames(prev=>[newGame, ...prev]);
          sendPushNotification(
            "New Game Posted! 🏟️",
            `${newGame.title} — ${newGame.area}`
          );
          showToast(`New game: ${newGame.title}!`);
        }
      })
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[user]);

  // Realtime for request status changes (approval/rejection)
  useEffect(()=>{
    if (!user) return;
    const channel = supabase
      .channel("requests-channel")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"requests" }, payload=>{
        const updated = payload.new;
        if (updated.user_id === user.id) {
          loadRequests();
          if (updated.status === "approved") {
            sendPushNotification("Request Approved! ✅", "The host approved your join request. Check the game for contact info.");
            showToast("Your request was approved! ✅");
          } else if (updated.status === "rejected") {
            sendPushNotification("Request Declined", "The host couldn't take you this time.");
            showToast("Your request was declined.", "error");
          }
        }
        // Notify host of new requests
        if (updated.status === "pending") loadRequests();
      })
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[user]);

  const loadGames = async () => {
    const { data } = await supabase.from("games").select("*").order("created_at",{ ascending:false });
    setGames(data||[]);
  };

  const loadRequests = async () => {
    const { data } = await supabase.from("requests").select("*").order("created_at",{ ascending:false });
    setRequests(data||[]);
  };

  const handlePost = async (form) => {
    const color = getColor(form.sport);
    const { error } = await supabase.from("games").insert([{
      sport:form.sport, title:form.title,
      location:`${form.venue}, ${form.area}`, area:form.area,
      game_date:form.date, game_time:form.time,
      total_slots:+form.totalSlots, filled_slots:+form.filledSlots,
      skill_level:form.skillLevel,
      host_name:profile?.name||user.email, host_id:user.id,
      host_avatar:profile?.avatar||user.email[0].toUpperCase(),
      color, tags:form.tags?form.tags.split(",").map(t=>t.trim()).filter(Boolean):[],
      join_type:form.joinType, cost_per_player:+form.costPerPlayer,
    }]);
    if (error) { showToast("Failed to post game.", "error"); return; }
    showToast("Game posted! 🎉");
    setShowPost(false);
    loadGames();
  };

  const handleJoinConfirm = async (game, note) => {
    if (game.join_type==="direct") {
      const { error } = await supabase.from("games").update({ filled_slots:game.filled_slots+1 }).eq("id",game.id);
      if (error) { showToast("Failed to join.", "error"); return; }
      showToast(`Joined ${game.title}! 🏟️`);
    } else {
      const { error } = await supabase.from("requests").insert([{
        game_id:game.id, user_id:user.id,
        user_name:profile?.name||user.email,
        note:note||null, status:"pending",
      }]);
      if (error) { showToast("Failed to send request.", "error"); return; }
      showToast("Request sent! 📩");
    }
    setJoining(null);
    loadGames();
    loadRequests();
  };

  const handleApprove = async (req) => {
    await supabase.from("requests").update({ status:"approved" }).eq("id",req.id);
    const game = games.find(g=>g.id===req.game_id);
    if (game) await supabase.from("games").update({ filled_slots:game.filled_slots+1 }).eq("id",game.id);
    // Send push to approved player
    sendPushNotification("Player Approved ✅", `You approved ${req.user_name}`);
    showToast(`${req.user_name} approved! ✅`);
    loadGames();
    loadRequests();
  };

  const handleReject = async (req) => {
    await supabase.from("requests").update({ status:"rejected" }).eq("id",req.id);
    showToast("Request declined.");
    loadRequests();
  };

  // View contact info
  const handleViewContact = async (game, isHost) => {
    if (isHost) {
      // Host sees approved players' contact info
      const approvedRequests = requests.filter(r=>r.game_id===game.id && r.status==="approved");
      const contacts = await Promise.all(approvedRequests.map(async r=>{
        const { data } = await supabase.from("profiles").select("name,phone,avatar").eq("id",r.user_id).single();
        return data || { name:r.user_name, phone:null, avatar:r.user_name[0] };
      }));
      setContactData({ game, contacts, isHost:true });
    } else {
      // Approved player sees host contact
      const { data } = await supabase.from("profiles").select("name,phone,avatar").eq("id",game.host_id).single();
      setContactData({ game, contacts:[data || { name:game.host_name, phone:null }], isHost:false });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfile(false); };

  const sportFilters = ["All", ...SPORTS.map(s=>s.split(" ")[1])];
  const areaFilters  = ["All Areas", ...UDAIPUR_AREAS];
  const myGames      = games.filter(g=>g.host_id===user?.id);
  const myRequests   = requests.filter(r=>r.user_id===user?.id);
  const hostRequests = requests.filter(r=>{ const g=games.find(x=>x.id===r.game_id); return g?.host_id===user?.id; });
  const pendingCount = hostRequests.filter(r=>r.status==="pending").length;

  const filtered = games.filter(g=>{
    const sportMatch  = sportFilter==="All" || g.sport.includes(sportFilter);
    const areaMatch   = areaFilter==="All Areas" || g.area===areaFilter;
    const searchMatch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase());
    return sportMatch && areaMatch && searchMatch;
  });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:52, marginBottom:16 }}>🏟️</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:28, fontWeight:800, letterSpacing:2, color:"#fff" }}>SquadUp</div>
      <Spinner/>
    </div>
  );

  if (!user) return <AuthPage onAuth={u=>{ setUser(u); loadProfile(u.id); }}/>;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * { box-sizing: border-box; }`}</style>

      <div style={{ minHeight:"100vh", background:"#f8f8f6", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f0f0f0", padding:"0 20px", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>🏟️</span>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:"#111", lineHeight:1 }}>SquadUp</div>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:500 }}>Udaipur · Find your game</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div onClick={()=>setShowRequests(true)} style={{ position:"relative", cursor:"pointer", background:"#f3f4f6", borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                🔔
                {pendingCount > 0 && (
                  <div style={{ position:"absolute", top:-3, right:-3, background:"#dc2626", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {pendingCount}
                  </div>
                )}
              </div>
              <button onClick={()=>setShowPost(true)} style={{ background:"#111", color:"#fff", border:"none", borderRadius:12, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                + Post Game
              </button>
              <div onClick={()=>setShowProfile(true)} style={{ cursor:"pointer" }}>
                <Avatar letter={profile?.avatar||user.email[0].toUpperCase()} color="#16a34a" size={36}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px" }}>

          {/* Welcome */}
          <div style={{ background:"#111", borderRadius:20, padding:"22px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:-10, top:-10, fontSize:90, opacity:0.05 }}>⚽</div>
            <div style={{ fontSize:14, color:"#9ca3af", marginBottom:4 }}>
              Hey {(profile?.name||user.email).split(" ")[0]} 👋
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff", lineHeight:1.3, marginBottom:8 }}>
              Who's playing today<br/>in Udaipur?
            </div>
            <div style={{ fontSize:13, color:"#6b7280" }}>
              From Ashok Nagar to Hiran Magri — find your game.
            </div>
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:14 }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔍</span>
            <input
              placeholder="Search games, venues, areas..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft:42, background:"#fff" }}
              onFocus={e=>e.target.style.borderColor="#16a34a"}
              onBlur={e=>e.target.style.borderColor="#e5e7eb"}
            />
          </div>

          {/* Sport filters */}
          <div style={{ display:"flex", gap:8, marginBottom:10, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
            {sportFilters.map(f=>(
              <button key={f} onClick={()=>setSport(f)} style={{
                flexShrink:0,
                background: sportFilter===f ? "#111" : "#fff",
                color: sportFilter===f ? "#fff" : "#374151",
                border: sportFilter===f ? "2px solid #111" : "2px solid #e5e7eb",
                borderRadius:99, padding:"6px 16px", fontSize:13,
                fontWeight:600, cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                transition:"all 0.15s",
              }}>{f}</button>
            ))}
          </div>

          {/* Area filters */}
          <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
            {areaFilters.map(a=>(
              <button key={a} onClick={()=>setArea(a)} style={{
                flexShrink:0,
                background: areaFilter===a ? "#16a34a" : "#fff",
                color: areaFilter===a ? "#fff" : "#374151",
                border: areaFilter===a ? "2px solid #16a34a" : "2px solid #e5e7eb",
                borderRadius:99, padding:"5px 14px", fontSize:12,
                fontWeight:600, cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                transition:"all 0.15s",
              }}>{a}</button>
            ))}
          </div>

          {/* Count */}
          <div style={{ fontSize:13, color:"#9ca3af", marginBottom:14, fontWeight:600 }}>
            {filtered.length === 0 ? "No games found" : `${filtered.length} game${filtered.length!==1?"s":""} near you`}
          </div>

          {/* Cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🌿</div>
                <div style={{ fontSize:18, fontWeight:800, color:"#374151", marginBottom:6 }}>No games here yet</div>
                <div style={{ fontSize:14, marginBottom:20 }}>Be the first to post one in this area!</div>
                <button onClick={()=>setShowPost(true)} style={{ background:"#111", color:"#fff", border:"none", borderRadius:14, padding:"12px 24px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  + Post a Game
                </button>
              </div>
            ) : filtered.map(g=>(
              <GameCard
                key={g.id} game={g}
                onJoin={setJoining}
                currentUserId={user.id}
                myRequests={myRequests}
                onViewContact={handleViewContact}
              />
            ))}
          </div>
        </div>

        {showPost     && <PostGameModal onClose={()=>setShowPost(false)} onPost={handlePost} user={{ name:profile?.name||user.email }}/>}
        {joining      && <JoinModal game={joining} onClose={()=>setJoining(null)} onConfirm={handleJoinConfirm} user={{ name:profile?.name||user.email }}/>}
        {showProfile  && <ProfileModal user={user} profile={profile} onClose={()=>setShowProfile(false)} onLogout={handleLogout} myGames={myGames}/>}
        {showRequests && <RequestsModal onClose={()=>setShowRequests(false)} onApprove={handleApprove} onReject={handleReject} requests={hostRequests} games={games}/>}
        {contactData  && <ContactModal data={contactData} onClose={()=>setContactData(null)}/>}

        <Toast msg={toast.msg} type={toast.type}/>
      </div>
    </>
  );
}
