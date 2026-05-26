import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { auth } from "./firebase";
import { signInWithPhoneNumber } from "firebase/auth";

const darkInput = {
  width:"100%", padding:"11px 14px", borderRadius:12,
  border:"1.5px solid #2a2a2a", fontSize:14,
  fontFamily:"'DM Sans', sans-serif", outline:"none",
  boxSizing:"border-box", color:"#fff", background:"#111",
};
const labelStyle = {
  display:"block", fontSize:11, fontWeight:700, color:"#9ca3af",
  marginBottom:6, fontFamily:"'DM Sans', sans-serif",
  textTransform:"uppercase", letterSpacing:0.8,
};

let globalConfirmation = null;

export default function AuthPage({ onAuth }) {
  const [mode, setMode]           = useState("login");
  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPass]       = useState("");
  const [otp, setOtp]             = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Send OTP — no reCAPTCHA needed when testing disabled ──
  const sendOtp = async () => {
    setError("");
    if (!phone.match(/^[6-9]\d{9}$/))
      return setError("Enter a valid 10-digit Indian mobile number.");

    setLoading(true);
    try {
      // With appVerificationDisabledForTesting = true,
      // we pass null instead of a recaptcha verifier
      globalConfirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        null  // null works when testing is disabled
      );
      setStep(2);
      setCountdown(30);
    } catch (err) {
      console.error("OTP error:", err);
      let msg = "Failed to send OTP. Please try again.";
      if (err.code === "auth/billing-not-enabled")
        msg = "Firebase billing not enabled.";
      else if (err.code === "auth/too-many-requests")
        msg = "Too many attempts. Wait a few minutes.";
      else if (err.code === "auth/invalid-phone-number")
        msg = "Invalid phone number.";
      else if (err.message)
        msg = err.message;
      setError(msg);
    }
    setLoading(false);
  };

  // ── Verify OTP ──
  const verifyOtp = async () => {
    if (otp.length < 6) return setError("Enter the full 6-digit OTP.");
    setError("");
    setLoading(true);
    try {
      await globalConfirmation.confirm(otp);

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, phone } }
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            name, phone,
            avatar: name[0].toUpperCase(),
            phone_verified: true,
          });
          onAuth(data.user);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await supabase.from("profiles").update({ phone_verified: true }).eq("id", data.user.id);
        onAuth(data.user);
      }
    } catch (err) {
      console.error("Verify error:", err);
      if (err.code === "auth/invalid-verification-code")
        setError("Wrong OTP. Please try again.");
      else if (err.code === "auth/code-expired")
        setError("OTP expired. Go back and request a new one.");
      else
        setError(err.message || "Verification failed.");
    }
    setLoading(false);
  };

  // ── Email Login ──
  const handleEmailLogin = async () => {
    setError("");
    if (!email.includes("@")) return setError("Enter a valid email.");
    if (password.length < 6)  return setError("Password must be 6+ characters.");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Wrong email or password.");
    onAuth(data.user);
  };

  const handleSignupStep1 = async () => {
    setError("");
    if (!name.trim())                  return setError("Enter your full name.");
    if (!email.includes("@"))          return setError("Enter a valid email.");
    if (password.length < 6)           return setError("Password must be 6+ characters.");
    if (!phone.match(/^[6-9]\d{9}$/)) return setError("Enter a valid 10-digit number.");
    await sendOtp();
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0f0f0f",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, fontFamily:"'DM Sans', sans-serif",
      position:"relative", overflow:"hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>

      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#22c55e18,transparent 70%)", top:-100, right:-100, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#f59e0b12,transparent 70%)", bottom:-80, left:-80, pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>

        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🏟️</div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:42, letterSpacing:4, color:"#fff", lineHeight:1 }}>SQUAD UP</div>
          <div style={{ fontSize:13, color:"#6b7280", marginTop:6 }}>📍 Udaipur, Rajasthan</div>
        </div>

        <div style={{ background:"#1a1a1a", borderRadius:24, padding:32, border:"1px solid #2a2a2a", boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>

          {step === 2 ? (
            <div>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ fontSize:48, marginBottom:10 }}>📱</div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:26, color:"#fff", letterSpacing:1 }}>CHECK YOUR PHONE</div>
                <div style={{ fontSize:13, color:"#6b7280", marginTop:8, lineHeight:1.8 }}>
                  OTP sent to<br/>
                  <b style={{ color:"#22c55e", fontSize:18 }}>+91 {phone}</b>
                </div>
              </div>

              <div style={{ marginBottom:8 }}>
                <label style={{ ...labelStyle, textAlign:"center", display:"block", marginBottom:12 }}>Enter 6-digit OTP</label>
                <input
                  value={otp}
                  onChange={e=>{ setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                  placeholder="• • • • • •"
                  type="tel" maxLength={6} autoFocus
                  style={{
                    ...darkInput, fontSize:30, letterSpacing:14,
                    textAlign:"center", padding:"18px 14px", fontWeight:800,
                    borderColor: otp.length===6 ? "#22c55e" : "#2a2a2a", borderWidth:2,
                  }}
                  onKeyDown={e=>e.key==="Enter"&&verifyOtp()}
                />
              </div>

              <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
                {[0,1,2,3,4,5].map(i=>(
                  <div key={i} style={{ width:10, height:10, borderRadius:"50%", background: i < otp.length ? "#22c55e" : "#2a2a2a", transition:"background 0.15s" }}/>
                ))}
              </div>

              {error && <div style={{ marginBottom:16, background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>⚠️ {error}</div>}

              <button onClick={verifyOtp} disabled={loading||otp.length<6} style={{
                width:"100%",
                background: otp.length<6||loading ? "#2a2a2a" : "linear-gradient(135deg,#22c55e,#16a34a)",
                color: otp.length<6||loading ? "#6b7280" : "#fff",
                border:"none", borderRadius:14, padding:"15px 0", fontSize:16, fontWeight:800,
                cursor: otp.length<6||loading ? "not-allowed" : "pointer",
                fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
              }}>{loading ? "VERIFYING..." : "VERIFY & JOIN ✓"}</button>

              <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#6b7280" }}>
                Didn't receive it?{" "}
                {countdown > 0
                  ? <span style={{ color:"#4b5563" }}>Resend in {countdown}s</span>
                  : <span onClick={sendOtp} style={{ color:"#22c55e", fontWeight:700, cursor:"pointer" }}>Resend OTP</span>
                }
              </p>
              <p style={{ textAlign:"center", marginTop:6, fontSize:12 }}>
                <span onClick={()=>{ setStep(1); setOtp(""); setError(""); }} style={{ color:"#6b7280", cursor:"pointer" }}>← Change number</span>
              </p>
            </div>

          ) : (
            <>
              <div style={{ display:"flex", background:"#111", borderRadius:14, padding:4, marginBottom:28 }}>
                {["login","signup"].map(m=>(
                  <button key={m} onClick={()=>{ setMode(m); setError(""); }} style={{
                    flex:1, padding:"10px 0", borderRadius:11, border:"none",
                    background:mode===m?"#22c55e":"transparent",
                    color:mode===m?"#fff":"#6b7280",
                    fontWeight:800, fontSize:14, cursor:"pointer",
                    fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s",
                  }}>{m==="login" ? "Log In" : "Sign Up"}</button>
                ))}
              </div>

              {mode === "signup" ? (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Rahul Meena" style={darkInput}
                      onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" style={darkInput}
                      onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" style={darkInput}
                      onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Mobile Number
                      <span style={{ color:"#22c55e", marginLeft:6, fontSize:10 }}>OTP WILL BE SENT HERE</span>
                    </label>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ ...darkInput, width:"auto", padding:"11px 14px", color:"#6b7280", flexShrink:0 }}>🇮🇳 +91</div>
                      <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                        placeholder="9876543210" type="tel" style={darkInput}
                        onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}
                        onKeyDown={e=>e.key==="Enter"&&handleSignupStep1()}/>
                    </div>
                  </div>

                  {error && <div style={{ background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>⚠️ {error}</div>}

                  <button onClick={handleSignupStep1} disabled={loading} style={{
                    width:"100%",
                    background: loading ? "#2a2a2a" : "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: loading ? "#6b7280" : "#fff",
                    border:"none", borderRadius:14, padding:"14px 0", fontSize:16, fontWeight:800,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
                  }}>{loading ? "SENDING OTP..." : "SEND OTP →"}</button>

                  <p style={{ textAlign:"center", fontSize:13, color:"#6b7280", margin:0 }}>
                    Already have an account?{" "}
                    <span onClick={()=>{ setMode("login"); setError(""); }} style={{ color:"#22c55e", fontWeight:700, cursor:"pointer" }}>Log In</span>
                  </p>
                </div>

              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" style={darkInput}
                      onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" style={darkInput}
                      onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}
                      onKeyDown={e=>e.key==="Enter"&&handleEmailLogin()}/>
                  </div>

                  {error && <div style={{ background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>⚠️ {error}</div>}

                  <button onClick={handleEmailLogin} disabled={loading} style={{
                    width:"100%",
                    background: loading ? "#2a2a2a" : "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: loading ? "#6b7280" : "#fff",
                    border:"none", borderRadius:14, padding:"14px 0", fontSize:16, fontWeight:800,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
                  }}>{loading ? "PLEASE WAIT..." : "LET'S PLAY →"}</button>

                  <p style={{ textAlign:"center", fontSize:13, color:"#6b7280", margin:0 }}>
                    Don't have an account?{" "}
                    <span onClick={()=>{ setMode("signup"); setError(""); }} style={{ color:"#22c55e", fontWeight:700, cursor:"pointer" }}>Sign Up</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:11, color:"#374151", lineHeight:1.6 }}>
          Squad Up — Udaipur's Pickup Game Network 🏟️
        </p>
      </div>
    </div>
  );
}
