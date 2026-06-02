import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { auth } from "./firebase";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";

// ── Shared input style (light theme) ──────────────────────────────────────────
const lightInput = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 14,
  border: "2px solid #e0f2fe",
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  color: "#111",
  background: "#f0f9ff",
  transition: "all .2s ease",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#0284c7",
  marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
  textTransform: "uppercase",
  letterSpacing: 0.8,
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

  // ── Focus/Blur handlers ───────────────────────────────────────────────────
  const onFocus = e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#fff"; };
  const onBlur  = e => { e.target.style.borderColor = "#e0f2fe"; e.target.style.background = "#f0f9ff"; };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setError("");
    if (!phone.match(/^[6-9]\d{9}$/))
      return setError("Enter a valid 10-digit Indian mobile number.");

    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { recaptchaVerifier.clear(); },
      });

      globalConfirmation = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier);
      setStep(2);
      setCountdown(30);
    } catch (err) {
      console.error("OTP error:", err);
      let msg = "Failed to send OTP. Please try again.";
      if (err.code === "auth/billing-not-enabled")   msg = "Firebase billing not enabled.";
      else if (err.code === "auth/too-many-requests") msg = "Too many attempts. Wait a few minutes.";
      else if (err.code === "auth/invalid-phone-number") msg = "Invalid phone number.";
      else if (err.message) msg = err.message;
      setError(msg);
    }
    setLoading(false);
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (otp.length < 6) return setError("Enter the full 6-digit OTP.");
    setError("");
    setLoading(true);
    try {
      await globalConfirmation.confirm(otp);

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, phone } },
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

  // ── Email Login ───────────────────────────────────────────────────────────
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
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0f9ff 0%, #ffffff 50%, #e0f2fe 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href={FONTS} rel="stylesheet"/>

      {/* Decorative blobs */}
      <div style={{ position:"absolute", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(14,165,233,0.12),transparent 70%)", top:-140, right:-120, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.1),transparent 70%)", bottom:-100, left:-80, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(14,165,233,0.08),transparent 70%)", top:"40%", left:"5%", pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>

        {/* ── Logo / Brand ── */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{
            width:80, height:80, borderRadius:24, margin:"0 auto 16px",
            boxShadow:"0 12px 36px rgba(14,165,233,0.35)",
            overflow:"hidden",
          }}>
            <img src="/icon-192.png" style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="SquadUp"/>
          </div>

          <div style={{
            fontFamily:"'Bebas Neue', sans-serif",
            fontSize:44, letterSpacing:3,
            background:"linear-gradient(90deg,#0284c7,#0ea5e9,#38bdf8)",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            lineHeight:1,
          }}>SquadUp</div>

          <div style={{ fontSize:12, color:"#7dd3fc", marginTop:8, letterSpacing:3, fontWeight:700 }}>
            FIND • JOIN • PLAY
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          background:"#fff",
          borderRadius:28,
          padding:32,
          border:"1px solid #bae6fd",
          boxShadow:"0 20px 60px rgba(14,165,233,0.12), 0 4px 16px rgba(0,0,0,0.04)",
        }}>

          {/* ── OTP Step ── */}
          {step === 2 ? (
            <div>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{
                  width:64, height:64, borderRadius:20, margin:"0 auto 14px",
                  background:"#e0f2fe", border:"2px solid #bae6fd",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:30,
                }}>📱</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:"#111", letterSpacing:1 }}>CHECK YOUR PHONE</div>
                <div style={{ fontSize:13, color:"#6b7280", marginTop:8, lineHeight:1.8 }}>
                  OTP sent to<br/>
                  <b style={{ color:"#0ea5e9", fontSize:18 }}>+91 {phone}</b>
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
                    ...lightInput,
                    fontSize:30, letterSpacing:14,
                    textAlign:"center", padding:"18px 14px", fontWeight:800,
                    borderColor: otp.length===6 ? "#0ea5e9" : "#e0f2fe", borderWidth:2,
                  }}
                  onKeyDown={e=>e.key==="Enter"&&verifyOtp()}
                />
              </div>

              {/* OTP progress dots */}
              <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
                {[0,1,2,3,4,5].map(i=>(
                  <div key={i} style={{
                    width:10, height:10, borderRadius:"50%",
                    background: i < otp.length ? "#0ea5e9" : "#e0f2fe",
                    transition:"background 0.15s",
                  }}/>
                ))}
              </div>

              {error && (
                <div style={{ marginBottom:16, background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={verifyOtp} disabled={loading||otp.length<6} style={{
                width:"100%",
                background: otp.length<6||loading
                  ? "#e0f2fe"
                  : "linear-gradient(135deg,#0ea5e9,#0284c7)",
                color: otp.length<6||loading ? "#94a3b8" : "#fff",
                border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:800,
                cursor: otp.length<6||loading ? "not-allowed" : "pointer",
                fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
                boxShadow: otp.length===6&&!loading ? "0 6px 20px rgba(14,165,233,0.35)" : "none",
                transition:"all 0.2s",
              }}>{loading ? "VERIFYING..." : "VERIFY & JOIN ✓"}</button>

              <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#6b7280" }}>
                Didn't receive it?{" "}
                {countdown > 0
                  ? <span style={{ color:"#94a3b8" }}>Resend in {countdown}s</span>
                  : <span onClick={sendOtp} style={{ color:"#0ea5e9", fontWeight:700, cursor:"pointer" }}>Resend OTP</span>
                }
              </p>
              <p style={{ textAlign:"center", marginTop:6, fontSize:12 }}>
                <span onClick={()=>{ setStep(1); setOtp(""); setError(""); }} style={{ color:"#0ea5e9", cursor:"pointer", fontWeight:600 }}>← Change number</span>
              </p>
            </div>

          ) : (
            <>
              {/* ── Tab toggle ── */}
              <div style={{ display:"flex", background:"#f0f9ff", borderRadius:14, padding:4, marginBottom:28, border:"1px solid #e0f2fe" }}>
                {["login","signup"].map(m=>(
                  <button key={m} onClick={()=>{ setMode(m); setError(""); }} style={{
                    flex:1, padding:"10px 0", borderRadius:11, border:"none",
                    background: mode===m ? "linear-gradient(135deg,#0ea5e9,#38bdf8)" : "transparent",
                    color: mode===m ? "#fff" : "#64748b",
                    fontWeight:800, fontSize:14, cursor:"pointer",
                    fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s",
                    boxShadow: mode===m ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
                  }}>{m==="login" ? "Log In" : "Sign Up"}</button>
                ))}
              </div>

              {/* ── Sign Up form ── */}
              {mode === "signup" ? (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Rahul Meena"
                      style={lightInput} onFocus={onFocus} onBlur={onBlur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                      type="email" style={lightInput} onFocus={onFocus} onBlur={onBlur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
                      type="password" style={lightInput} onFocus={onFocus} onBlur={onBlur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Mobile Number
                      <span style={{ color:"#0ea5e9", marginLeft:6, fontSize:10, fontWeight:800 }}>OTP WILL BE SENT</span>
                    </label>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ ...lightInput, width:"auto", padding:"13px 14px", color:"#64748b", flexShrink:0, display:"flex", alignItems:"center" }}>🇮🇳 +91</div>
                      <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                        placeholder="9876543210" type="tel" style={lightInput}
                        onFocus={onFocus} onBlur={onBlur}
                        onKeyDown={e=>e.key==="Enter"&&handleSignupStep1()}/>
                    </div>
                  </div>

                  {error && (
                    <div style={{ background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button onClick={handleSignupStep1} disabled={loading} style={{
                    width:"100%",
                    background: loading ? "#e0f2fe" : "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color: loading ? "#94a3b8" : "#fff",
                    border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:800,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
                    boxShadow: loading ? "none" : "0 6px 20px rgba(14,165,233,0.35)",
                    transition:"all 0.2s",
                  }}>{loading ? "SENDING OTP..." : "SEND OTP →"}</button>

                  <p style={{ textAlign:"center", fontSize:13, color:"#6b7280", margin:0 }}>
                    Already have an account?{" "}
                    <span onClick={()=>{ setMode("login"); setError(""); }} style={{ color:"#0ea5e9", fontWeight:700, cursor:"pointer" }}>Log In</span>
                  </p>
                </div>

              ) : (
              /* ── Login form ── */
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                      type="email" style={lightInput} onFocus={onFocus} onBlur={onBlur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
                      type="password" style={lightInput} onFocus={onFocus} onBlur={onBlur}
                      onKeyDown={e=>e.key==="Enter"&&handleEmailLogin()}/>
                  </div>

                  {error && (
                    <div style={{ background:"#fee2e2", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", fontWeight:600 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button onClick={handleEmailLogin} disabled={loading} style={{
                    width:"100%",
                    background: loading ? "#e0f2fe" : "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color: loading ? "#94a3b8" : "#fff",
                    border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:800,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily:"'Bebas Neue', sans-serif", letterSpacing:2,
                    boxShadow: loading ? "none" : "0 6px 20px rgba(14,165,233,0.35)",
                    transition:"all 0.2s",
                  }}>{loading ? "PLEASE WAIT..." : "LET'S PLAY →"}</button>

                  <p style={{ textAlign:"center", fontSize:13, color:"#6b7280", margin:0 }}>
                    Don't have an account?{" "}
                    <span onClick={()=>{ setMode("signup"); setError(""); }} style={{ color:"#0ea5e9", fontWeight:700, cursor:"pointer" }}>Sign Up</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
          SquadUp • Find players. Complete your squad.
        </p>

        {/* Required for Firebase RecaptchaVerifier */}
        <div id="recaptcha-container"/>
      </div>
    </div>
  );
}