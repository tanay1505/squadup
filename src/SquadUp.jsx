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
  "#22c55e","#3b82f6","#f97316","#ec4899",
  "#a855f7","#f59e0b","#14b8a6","#6366f1","#ef4444"
];

const SKILL_COLORS = {
  Casual:      { bg:"#dcfce7", text:"#16a34a" },
  Competitive: { bg:"#fee2e2", text:"#dc2626" },
  Beginner:    { bg:"#dbeafe", text:"#2563eb" },
};

const inputStyle = {
  width:"100%", padding:"11px 14px", borderRadius:12,
  border:"1.5px solid #e5e7eb", fontSize:14,
  fontFamily:"'DM Sans', sans-serif", outline:"none",
  boxSizing:"border-box", color:"#111", background:"#fafafa",
};
const labelStyle = {
  display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
  marginBottom:6, fontFamily:"'DM Sans', sans-serif",
  textTransform:"uppercase", letterSpacing:0.8,
};

function getColor(sport) {
  const idx = SPORTS.findIndex(s=>s===sport);
  return SPORT_COLORS[idx>=0?idx:0];
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:type==="error"?"#dc2626":"#111",
      color:"#fff", padding:"12px 24px", borderRadius:14, fontSize:14,
      fontWeight:700, fontFamily:"'DM Sans', sans-serif",
      boxShadow:"0 8px 32px rgba(0,0,0,0.25)", zIndex:9999,
    }}>{type==="error"?"⚠️":"✅"} {msg}</div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
      <div style={{ width:36, height:36, border:"4px solid #f0f0f0", borderTop:"4px solid #22c55e", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    </div>
  );
}

function AvatarBubble({ letter, color, size=32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:color+"22", border:`2px solid ${color}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*0.4, color, flexShrink:0,
      fontFamily:"'Bebas Neue', sans-serif", letterSpacing:1,
    }}>{letter}</div>
  );
}

function SlotBar({ filled, total, color }) {
  const pct = Math.min((filled/total)*100,100);
  const remaining = total-filled;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>{filled}/{total} players</span>
        <span style={{ fontSize:12, fontWeight:700, color:remaining<=0?"#dc2626":color, fontFamily:"'DM Sans', sans-serif" }}>
          {remaining<=0?"FULL":`${remaining} spots left`}
        </span>
      </div>
      <div style={{ height:6, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:99, transition:"width 0.6s ease" }}/>
      </div>
    </div>
  );
}

function GameCard({ game, onJoin, currentUserId, myRequests }) {
  const skill   = SKILL_COLORS[game.skill_level] || SKILL_COLORS.Casual;
  const isFull  = game.filled_slots >= game.total_slots;
  const isHost  = game.host_id === currentUserId;
  const myReq   = myRequests?.find(r=>r.game_id===game.id);
  const color   = game.color || getColor(game.sport);

  const getJoinLabel = () => {
    if (isFull)                     return "Full";
    if (isHost)                     return "Your Game";
    if (myReq?.status==="pending")  return "⏳ Requested";
    if (myReq?.status==="approved") return "✅ Joined";
    if (myReq?.status==="rejected") return "❌ Rejected";
    return game.join_type==="direct" ? "Join →" : "Request →";
  };

  const joinDisabled = isFull || isHost || !!myReq;

  return (
    <div style={{
      background:"#fff", border:"1.5px solid #f0f0f0", borderRadius:20,
      padding:"20px 22px", transition:"transform 0.18s, box-shadow 0.18s",
      boxShadow:"0 2px 12px rgba(0,0,0,0.05)", position:"relative", overflow:"hidden",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.10)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.05)";}}
    >
      <div style={{ position:"absolute", top:0, left:0, width:5, height:"100%", background:color, borderRadius:"20px 0 0 20px" }}/>
      <div style={{ paddingLeft:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:19, marginBottom:2 }}>{game.sport}</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#111", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:0.5 }}>{game.title}</div>
          </div>
          <span style={{ background:skill.bg, color:skill.text, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, flexShrink:0, marginLeft:10, fontFamily:"'DM Sans', sans-serif" }}>{game.skill_level}</span>
        </div>
        <div style={{ display:"flex", gap:14, marginBottom:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>📍 {game.location}</span>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>🕐 {game.game_date} · {game.game_time}</span>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{
            background:game.cost_per_player===0?"#dcfce7":"#fef3c7",
            color:game.cost_per_player===0?"#16a34a":"#92400e",
            fontSize:12, fontWeight:800, padding:"4px 12px", borderRadius:99,
            fontFamily:"'DM Sans', sans-serif",
            border:`1px solid ${game.cost_per_player===0?"#86efac":"#fcd34d"}`,
          }}>{game.cost_per_player===0?"🆓 Free":`💰 ₹${game.cost_per_player}/player`}</span>
          <span style={{
            background:game.join_type==="direct"?"#dbeafe":"#f3e8ff",
            color:game.join_type==="direct"?"#1d4ed8":"#7c3aed",
            fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99,
            fontFamily:"'DM Sans', sans-serif",
          }}>{game.join_type==="direct"?"⚡ Direct Join":"🔒 Host Approval"}</span>
          {(game.tags||[]).map(t=>(
            <span key={t} style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:11, padding:"2px 8px", color:"#374151", fontFamily:"'DM Sans', sans-serif" }}>{t}</span>
          ))}
        </div>
        <SlotBar filled={game.filled_slots} total={game.total_slots} color={color}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <AvatarBubble letter={game.host_avatar||"?"} color={color}/>
            <span style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>
              Hosted by <b style={{ color:"#111" }}>{game.host_name}</b>
            </span>
          </div>
          <button onClick={()=>!joinDisabled&&onJoin(game)} style={{
            background:joinDisabled?"#f3f4f6":game.join_type==="direct"?color:"#7c3aed",
            color:joinDisabled?"#9ca3af":"#fff",
            border:"none", borderRadius:12, padding:"8px 18px", fontSize:13,
            fontWeight:700, cursor:joinDisabled?"not-allowed":"pointer",
            fontFamily:"'DM Sans', sans-serif",
          }}>{getJoinLabel()}</button>
        </div>
      </div>
    </div>
  );
}

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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:400, textAlign:"center", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        {done ? (
          <>
            <div style={{ fontSize:56, marginBottom:12 }}>{isDirect?"🎉":"📩"}</div>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:"#111", margin:"0 0 8px" }}>
              {isDirect?`You're In, ${user.name?.split(" ")[0]}!`:"Request Sent!"}
            </h2>
            <p style={{ color:"#6b7280", fontFamily:"'DM Sans', sans-serif", fontSize:14, marginBottom:24, lineHeight:1.6 }}>
              {isDirect?`You've joined ${game.title}. See you on the court!`:`Your request has been sent to ${game.host_name}.`}
            </p>
            {game.cost_per_player>0 && (
              <div style={{ background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:14, padding:"12px 16px", marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#92400e", fontFamily:"'DM Sans', sans-serif" }}>
                  💰 Amount to Pay: <span style={{ fontSize:20 }}>₹{game.cost_per_player}</span>
                </div>
                <div style={{ fontSize:11, color:"#b45309", marginTop:4, fontFamily:"'DM Sans', sans-serif" }}>Pay the host at the venue</div>
              </div>
            )}
            <div style={{ background:color+"15", borderRadius:14, padding:"12px 16px", marginBottom:20 }}>
              <div style={{ fontSize:13, color:"#374151", fontFamily:"'DM Sans', sans-serif" }}>📍 {game.location}</div>
              <div style={{ fontSize:13, color:"#374151", fontFamily:"'DM Sans', sans-serif", marginTop:4 }}>🕐 {game.game_date} · {game.game_time}</div>
            </div>
            <button onClick={onClose} style={{ width:"100%", background:"#111", color:"#fff", border:"none", borderRadius:14, padding:"13px 0", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:1 }}>DONE</button>
          </>
        ) : (
          <>
            <div style={{ fontSize:40, marginBottom:8 }}>{game.sport}</div>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:"#111", margin:"0 0 6px" }}>{game.title}</h2>
            <p style={{ color:"#6b7280", fontFamily:"'DM Sans', sans-serif", fontSize:13, marginBottom:16 }}>📍 {game.location} · {game.game_date} at {game.game_time}</p>
            {game.cost_per_player>0 ? (
              <div style={{ background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:14, padding:"12px 16px", marginBottom:16, textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#92400e", fontFamily:"'DM Sans', sans-serif" }}>💰 Cost per player</div>
                <div style={{ fontSize:26, fontWeight:800, color:"#111", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:1 }}>₹{game.cost_per_player}</div>
                <div style={{ fontSize:11, color:"#b45309", fontFamily:"'DM Sans', sans-serif" }}>Payable to the host at the venue</div>
              </div>
            ) : (
              <div style={{ background:"#dcfce7", border:"1px solid #86efac", borderRadius:14, padding:"10px 16px", marginBottom:16, textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#16a34a", fontFamily:"'DM Sans', sans-serif" }}>🆓 This game is free to join!</div>
              </div>
            )}
            <div style={{ background:isDirect?"#dbeafe":"#f3e8ff", borderRadius:14, padding:"10px 16px", marginBottom:16, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:isDirect?"#1d4ed8":"#7c3aed", fontFamily:"'DM Sans', sans-serif" }}>
                {isDirect?"⚡ Direct Join — You're in immediately!":"🔒 Requires Host Approval"}
              </div>
            </div>
            {!isDirect && (
              <div style={{ marginBottom:16, textAlign:"left" }}>
                <label style={labelStyle}>Message to Host (optional)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Hi! I play casually and would love to join..." rows={3}
                  style={{ ...inputStyle, resize:"none", lineHeight:1.5 }}/>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"#f3f4f6", border:"none", borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", color:"#374151" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ flex:2, background:isDirect?color:"#7c3aed", border:"none", borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans', sans-serif", color:"#fff" }}>
                {loading?"Please wait...":(isDirect?"Confirm Join ✓":"Send Request →")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RequestsModal({ onClose, onApprove, onReject, requests, games }) {
  const pending = requests.filter(r=>r.status==="pending");
  const handled = requests.filter(r=>r.status!=="pending");
  const getGameTitle = (gameId) => games.find(g=>g.id===gameId)?.title || "Unknown Game";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:26, color:"#111", margin:0, letterSpacing:1 }}>Join Requests</h2>
            {pending.length>0 && <span style={{ fontSize:12, color:"#7c3aed", fontWeight:700, fontFamily:"'DM Sans', sans-serif" }}>{pending.length} pending</span>}
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:34, height:34, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        {requests.length===0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:20, letterSpacing:1 }}>No requests yet</div>
          </div>
        )}
        {pending.length>0 && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", marginBottom:12 }}>⏳ Pending ({pending.length})</div>
            {pending.map(r=>(
              <div key={r.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:16, padding:"16px 18px", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <AvatarBubble letter={r.user_name[0]} color="#7c3aed"/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:"#111", fontFamily:"'DM Sans', sans-serif" }}>{r.user_name}</div>
                    <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'DM Sans', sans-serif" }}>wants to join <b style={{color:"#374151"}}>{getGameTitle(r.game_id)}</b></div>
                  </div>
                </div>
                {r.note && <div style={{ background:"#f9fafb", borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:13, color:"#374151", fontFamily:"'DM Sans', sans-serif", fontStyle:"italic" }}>"{r.note}"</div>}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>onReject(r)} style={{ flex:1, background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>✕ Reject</button>
                  <button onClick={()=>onApprove(r)} style={{ flex:2, background:"#22c55e", color:"#fff", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>✓ Approve</button>
                </div>
              </div>
            ))}
          </>
        )}
        {handled.length>0 && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"#9ca3af", letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", margin:"16px 0 12px" }}>Past Requests</div>
            {handled.map(r=>(
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#f9fafb", borderRadius:12, marginBottom:8 }}>
                <AvatarBubble letter={r.user_name[0]} color={r.status==="approved"?"#22c55e":"#dc2626"}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:"'DM Sans', sans-serif" }}>{r.user_name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans', sans-serif" }}>{getGameTitle(r.game_id)}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:r.status==="approved"?"#16a34a":"#dc2626", fontFamily:"'DM Sans', sans-serif" }}>
                  {r.status==="approved"?"✅ Approved":"❌ Rejected"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:28, letterSpacing:1, color:"#111", margin:0 }}>Post a Game</h2>
            <p style={{ fontSize:12, color:"#9ca3af", margin:"4px 0 0", fontFamily:"'DM Sans', sans-serif" }}>Posting as <b style={{color:"#111"}}>{user.name}</b></p>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:34, height:34, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        {[
          { label:"Sport", el:<select value={form.sport} onChange={e=>set("sport",e.target.value)} style={inputStyle}>{SPORTS.map(s=><option key={s}>{s}</option>)}</select> },
          { label:"Game Title *", el:<input placeholder="e.g. Evening 5-a-side" value={form.title} onChange={e=>set("title",e.target.value)} style={inputStyle}/> },
          { label:"Venue Name *", el:<input placeholder="e.g. Green Turf Arena" value={form.venue} onChange={e=>set("venue",e.target.value)} style={inputStyle}/> },
          { label:"Area in Udaipur", el:<select value={form.area} onChange={e=>set("area",e.target.value)} style={inputStyle}>{UDAIPUR_AREAS.map(a=><option key={a}>{a}</option>)}</select> },
          { label:"Date *", el:<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inputStyle}/> },
          { label:"Time *", el:<input type="time" value={form.time} onChange={e=>set("time",e.target.value)} style={inputStyle}/> },
        ].map(({label,el})=>(
          <div key={label} style={{ marginBottom:16 }}>
            <label style={labelStyle}>{label}</label>{el}
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
          <div><label style={labelStyle}>Total Players</label><input type="number" value={form.totalSlots} min={2} max={30} onChange={e=>set("totalSlots",+e.target.value)} style={inputStyle}/></div>
          <div><label style={labelStyle}>Already Have</label><input type="number" value={form.filledSlots} min={1} onChange={e=>set("filledSlots",+e.target.value)} style={inputStyle}/></div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Cost Per Player (₹) — 0 = Free</label>
          <input type="number" value={form.costPerPlayer} min={0} onChange={e=>set("costPerPlayer",+e.target.value)} style={inputStyle}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Who Can Join?</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { val:"direct",  icon:"⚡", title:"Direct Join",   desc:"Anyone joins instantly" },
              { val:"request", icon:"🔒", title:"Host Approval", desc:"You approve each player" },
            ].map(opt=>(
              <div key={opt.val} onClick={()=>set("joinType",opt.val)} style={{
                border:`2px solid ${form.joinType===opt.val?(opt.val==="direct"?"#3b82f6":"#7c3aed"):"#e5e7eb"}`,
                borderRadius:14, padding:"14px 12px", cursor:"pointer",
                background:form.joinType===opt.val?(opt.val==="direct"?"#dbeafe":"#f3e8ff"):"#fff",
                transition:"all 0.2s",
              }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{opt.icon}</div>
                <div style={{ fontSize:13, fontWeight:800, color:"#111", fontFamily:"'DM Sans', sans-serif" }}>{opt.title}</div>
                <div style={{ fontSize:11, color:"#6b7280", fontFamily:"'DM Sans', sans-serif", marginTop:2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Skill Level</label>
          <div style={{ display:"flex", gap:8 }}>
            {["Beginner","Casual","Competitive"].map(lv=>(
              <button key={lv} onClick={()=>set("skillLevel",lv)} style={{
                flex:1, padding:"8px 0", borderRadius:12, border:"1.5px solid",
                borderColor:form.skillLevel===lv?"#111":"#e5e7eb",
                background:form.skillLevel===lv?"#111":"#fff",
                color:form.skillLevel===lv?"#fff":"#374151",
                fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
              }}>{lv}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input placeholder="e.g. Floodlit, Grass, Mixed" value={form.tags} onChange={e=>set("tags",e.target.value)} style={inputStyle}/>
        </div>
        <button onClick={handlePost} disabled={loading} style={{
          width:"100%", background:loading?"#e5e7eb":"#111", color:loading?"#9ca3af":"#fff",
          border:"none", borderRadius:14, padding:"14px 0", fontSize:16, fontWeight:800,
          cursor:loading?"not-allowed":"pointer", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:1.5,
        }}>{loading?"POSTING...":"🚀 POST GAME"}</button>
      </div>
    </div>
  );
}

function ProfileModal({ user, profile, onClose, onLogout, myGames }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(4px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:400, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:26, color:"#111", margin:0, letterSpacing:1 }}>My Profile</h2>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:10, width:34, height:34, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, background:"#f9fafb", borderRadius:16, padding:"16px 20px" }}>
          <AvatarBubble letter={profile?.avatar||user.email[0].toUpperCase()} color="#22c55e" size={52}/>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:"#111", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:0.5 }}>{profile?.name||user.email}</div>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>{user.email}</div>
            {profile?.phone && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <span style={{ fontSize:13, color:"#6b7280", fontFamily:"'DM Sans', sans-serif" }}>+91 {profile.phone}</span>
                {profile.phone_verified && <span style={{ fontSize:11, background:"#dcfce7", color:"#16a34a", borderRadius:6, padding:"1px 6px", fontWeight:700, fontFamily:"'DM Sans', sans-serif" }}>✓ Verified</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
          {[{ label:"Games Hosted", value:myGames.length, icon:"🏟️" },{ label:"Games Joined", value:"—", icon:"✅" }].map(s=>(
            <div key={s.label} style={{ background:"#f9fafb", borderRadius:14, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:24 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:"#111", letterSpacing:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {myGames.length>0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", marginBottom:10 }}>My Posted Games</div>
            {myGames.map(g=>(
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f9fafb", borderRadius:12, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{g.sport.split(" ")[0]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:"'DM Sans', sans-serif" }}>{g.title}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"'DM Sans', sans-serif" }}>{g.area} · {g.game_date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", fontFamily:"'DM Sans', sans-serif" }}>{g.total_slots-g.filled_slots} left</div>
                  {g.cost_per_player>0 && <div style={{ fontSize:11, color:"#92400e", fontFamily:"'DM Sans', sans-serif" }}>₹{g.cost_per_player}/player</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onLogout} style={{ width:"100%", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:14, padding:"13px 0", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>🚪 Log Out</button>
      </div>
    </div>
  );
}

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
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState({ msg:"", type:"" });

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast({ msg:"", type:"" }), 3000);
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

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id",userId).single();
    setProfile(data);
    setLoading(false);
  };

  useEffect(()=>{ if (!user) return; loadGames(); loadRequests(); },[user]);

  const loadGames = async () => {
    const { data, error } = await supabase.from("games").select("*").order("created_at",{ ascending:false });
    if (!error) setGames(data||[]);
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
    showToast("Game posted! 🎉"); setShowPost(false); loadGames();
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
    setJoining(null); loadGames(); loadRequests();
  };

  const handleApprove = async (req) => {
    await supabase.from("requests").update({ status:"approved" }).eq("id",req.id);
    const game = games.find(g=>g.id===req.game_id);
    if (game) await supabase.from("games").update({ filled_slots:game.filled_slots+1 }).eq("id",game.id);
    showToast(`${req.user_name} approved! ✅`); loadGames(); loadRequests();
  };

  const handleReject = async (req) => {
    await supabase.from("requests").update({ status:"rejected" }).eq("id",req.id);
    showToast("Request rejected."); loadRequests();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
  };

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
      <div style={{ fontSize:48, marginBottom:16 }}>🏟️</div>
      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:32, letterSpacing:4, color:"#fff" }}>SQUAD UP</div>
      <Spinner/>
    </div>
  );

  if (!user) return <AuthPage onAuth={u=>{ setUser(u); loadProfile(u.id); }}/>;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight:"100vh", background:"#f8f9fa", fontFamily:"'DM Sans', sans-serif" }}>

        <div style={{ background:"#fff", borderBottom:"1.5px solid #f0f0f0", padding:"0 20px", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>🏟️</span>
              <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:26, letterSpacing:2, color:"#111" }}>SQUAD UP</span>
              <span style={{ fontSize:11, background:"#fef3c7", borderRadius:8, padding:"2px 8px", color:"#92400e", fontWeight:700 }}>📍 Udaipur</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div onClick={()=>setShowRequests(true)} style={{ position:"relative", cursor:"pointer", background:"#f3f4f6", borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                🔔
                {pendingCount>0 && (
                  <div style={{ position:"absolute", top:-4, right:-4, background:"#dc2626", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif" }}>
                    {pendingCount}
                  </div>
                )}
              </div>
              <button onClick={()=>setShowPost(true)} style={{ background:"#111", color:"#fff", border:"none", borderRadius:12, padding:"9px 18px", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>+ Post Game</button>
              <div onClick={()=>setShowProfile(true)} style={{ cursor:"pointer" }}>
                <AvatarBubble letter={profile?.avatar||user.email[0].toUpperCase()} color="#22c55e" size={36}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:680, margin:"0 auto", padding:"24px 16px" }}>
          <div style={{ background:"linear-gradient(135deg,#111 60%,#333)", borderRadius:20, padding:"24px 26px", marginBottom:24, color:"#fff", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:-20, top:-20, fontSize:100, opacity:0.06 }}>🏆</div>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:1, marginBottom:4 }}>
              Welcome back, {(profile?.name||user.email).split(" ")[0]}! 👋
            </div>
            <div style={{ fontSize:13, color:"#9ca3af", lineHeight:1.6 }}>
              Find games near you — Ashok Nagar to Hiran Magri. Post a game and fill your squad today.
            </div>
          </div>

          <input placeholder="🔍  Search by sport, venue, area..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom:14, fontSize:14, background:"#fff", padding:"12px 16px" }}/>

          <div style={{ display:"flex", gap:8, marginBottom:10, overflowX:"auto", paddingBottom:4 }}>
            {sportFilters.map(f=>(
              <button key={f} onClick={()=>setSport(f)} style={{
                flexShrink:0, background:sportFilter===f?"#111":"#fff",
                color:sportFilter===f?"#fff":"#374151",
                border:"1.5px solid", borderColor:sportFilter===f?"#111":"#e5e7eb",
                borderRadius:99, padding:"6px 16px", fontSize:13,
                fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
              }}>{f}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
            {areaFilters.map(a=>(
              <button key={a} onClick={()=>setArea(a)} style={{
                flexShrink:0, background:areaFilter===a?"#f59e0b":"#fff",
                color:areaFilter===a?"#fff":"#374151",
                border:"1.5px solid", borderColor:areaFilter===a?"#f59e0b":"#e5e7eb",
                borderRadius:99, padding:"5px 14px", fontSize:12,
                fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
              }}>{a}</button>
            ))}
          </div>

          <div style={{ fontSize:13, color:"#9ca3af", marginBottom:16, fontWeight:600 }}>
            {filtered.length} game{filtered.length!==1?"s":""} near you
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {filtered.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏟️</div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:1 }}>No games found</div>
                <div style={{ fontSize:14, marginTop:6 }}>Be the first to post one!</div>
                <button onClick={()=>setShowPost(true)} style={{ marginTop:16, background:"#111", color:"#fff", border:"none", borderRadius:12, padding:"10px 24px", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>+ Post a Game</button>
              </div>
            ) : filtered.map(g=>(
              <GameCard key={g.id} game={g} onJoin={setJoining} currentUserId={user.id} myRequests={myRequests}/>
            ))}
          </div>
        </div>

        {showPost     && <PostGameModal onClose={()=>setShowPost(false)} onPost={handlePost} user={{ name:profile?.name||user.email }}/>}
        {joining      && <JoinModal game={joining} onClose={()=>setJoining(null)} onConfirm={handleJoinConfirm} user={{ name:profile?.name||user.email }}/>}
        {showProfile  && <ProfileModal user={user} profile={profile} onClose={()=>setShowProfile(false)} onLogout={handleLogout} myGames={myGames}/>}
        {showRequests && <RequestsModal onClose={()=>setShowRequests(false)} onApprove={handleApprove} onReject={handleReject} requests={hostRequests} games={games}/>}

        <Toast msg={toast.msg} type={toast.type}/>
      </div>
    </>
  );
}
