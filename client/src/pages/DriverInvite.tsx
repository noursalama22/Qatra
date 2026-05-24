import { useState, useEffect } from "react";

type InviteData = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  zone: string | null;
  providerName: string | null;
  status: string;
  token: string;
};

type Step = "password" | "vehicle" | "done";

export default function DriverInvite() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("password");

  // Step 1 — set password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptingPassword, setAcceptingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Step 2 — vehicle data
  const [vehicle, setVehicle] = useState({ plateNumber: "", vehicleModel: "", vehicleYear: "", capacityLiters: "", vehicleNotes: "" });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("رابط الدعوة غير صالح."); setLoading(false); return; }
    fetch(`/api/provider-driver-invites/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(data => {
        setInvite(data);
        setLoading(false);
        if (data.status === "accepted") setStep("vehicle");
      })
      .catch(e => { setError(typeof e === "string" ? e : "رابط الدعوة غير صالح أو منتهي الصلاحية."); setLoading(false); });
  }, [token]);

  const setV = (key: string, value: string) => setVehicle(p => ({ ...p, [key]: value }));

  const acceptPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) { setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (password !== confirm) { setPasswordError("كلمتا المرور غير متطابقتين"); return; }
    setAcceptingPassword(true); setPasswordError(null);
    try {
      const res = await fetch(`/api/provider-driver-invites/${token}/accept`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setStep("vehicle");
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally { setAcceptingPassword(false); }
  };

  const submitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle.plateNumber.trim()) { setVehicleError("رقم اللوحة مطلوب"); return; }
    if (!vehicle.vehicleModel.trim()) { setVehicleError("موديل الشاحنة مطلوب"); return; }
    if (!vehicle.vehicleYear) { setVehicleError("سنة الصنع مطلوبة"); return; }
    if (!vehicle.capacityLiters) { setVehicleError("سعة الخزان مطلوبة"); return; }
    setSavingVehicle(true); setVehicleError(null);
    try {
      const res = await fetch(`/api/provider-driver-invites/${token}/vehicle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: vehicle.plateNumber.trim(),
          vehicleModel: vehicle.vehicleModel.trim(),
          vehicleYear: Number(vehicle.vehicleYear),
          capacityLiters: Number(vehicle.capacityLiters),
          vehicleNotes: vehicle.vehicleNotes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setStep("done");
    } catch (e) {
      setVehicleError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally { setSavingVehicle(false); }
  };

  // ── Loading / Error screens ────────────────────────────────────────────

  if (loading) return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f3fbff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#6b8aa0" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>جارٍ التحقق من رابط الدعوة...</p>
      </div>
    </div>
  );

  if (error) return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f3fbff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 16, padding: "40px 36px", maxWidth: 420, textAlign: "center", border: "1px solid #fca5a5" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", marginBottom: 8 }}>رابط غير صالح</h2>
        <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>{error}</p>
      </div>
    </div>
  );

  // ── Done screen ────────────────────────────────────────────────────────

  if (step === "done") return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a2e44 0%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", maxWidth: 440, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#12384f", marginBottom: 8 }}>مرحباً بك في الفريق!</h2>
        <p style={{ color: "#6b8aa0", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          تم تفعيل حسابك وتسجيل بيانات شاحنتك بنجاح. يمكنك الآن تسجيل الدخول إلى تطبيق قطرة.
        </p>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#0284c7", fontWeight: 600, direction: "ltr" }}>
          ✉️ {invite?.email}
        </div>
      </div>
    </div>
  );

  // ── Shared layout wrapper ──────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", border: "1px solid #d8eef8", borderRadius: 10,
    fontSize: 14, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#fafcff",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#6b8aa0",
    marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4,
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a2e44 0%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f3d5c, #0284c7)", padding: "28px 32px", color: "white" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{step === "password" ? "🚛" : "📋"}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
            {step === "password" ? "دعوة انضمام لأسطول مياه" : "أدخل بيانات شاحنتك"}
          </h1>
          {invite?.providerName && (
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>من: {invite.providerName}</p>
          )}
        </div>

        {/* Progress Steps */}
        <div style={{ padding: "16px 32px 0", display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { num: 1, label: "تفعيل الحساب", done: step !== "password" },
            { num: 2, label: "بيانات الشاحنة", done: step === "done" },
          ].map((s, idx) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, flexShrink: 0,
                background: s.done ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : (step === (idx === 0 ? "password" : "vehicle") ? "#0284c7" : "#e8f5fd"),
                color: (s.done || step === (idx === 0 ? "password" : "vehicle")) ? "white" : "#8eb5c8",
              }}>
                {s.done ? "✓" : s.num}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === (idx === 0 ? "password" : "vehicle") ? "#12384f" : "#8eb5c8" }}>{s.label}</span>
              {idx < 1 && <div style={{ flex: 1, height: 2, background: step !== "password" ? "#0ea5e9" : "#e8f5fd", borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Password ── */}
        {step === "password" && (
          <>
            {/* Invite Details */}
            <div style={{ padding: "20px 32px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "الاسم الكامل", value: invite?.fullName, ltr: false },
                  { label: "البريد الإلكتروني", value: invite?.email, ltr: true },
                  ...(invite?.zone ? [{ label: "المنطقة", value: invite.zone, ltr: false }] : []),
                ].map(row => (
                  <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 700, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f", direction: row.ltr ? "ltr" : "rtl" }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={acceptPassword} style={{ padding: "20px 32px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#6b8aa0", margin: 0, lineHeight: 1.5 }}>
                أنشئ كلمة مرور لتفعيل حسابك، ثم ستُدخل بيانات شاحنتك في الخطوة التالية.
              </p>
              <div>
                <label style={labelStyle}>كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="٦ أحرف على الأقل" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>تأكيد كلمة المرور</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="أعد إدخال كلمة المرور" style={inputStyle} />
              </div>
              {passwordError && (
                <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{passwordError}</div>
              )}
              <button type="submit" disabled={acceptingPassword} style={{ padding: "13px 0", borderRadius: 12, background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "white", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: acceptingPassword ? 0.7 : 1 }}>
                {acceptingPassword ? "جارٍ التفعيل..." : "تفعيل الحساب والمتابعة ←"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Vehicle Data ── */}
        {step === "vehicle" && (
          <form onSubmit={submitVehicle} style={{ padding: "20px 32px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#6b8aa0", margin: 0, lineHeight: 1.5 }}>
              هذه البيانات تخصك أنت كسائق. أدخل معلومات شاحنتك لإتمام انضمامك للأسطول.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>رقم اللوحة *</label>
                <input value={vehicle.plateNumber} onChange={e => setV("plateNumber", e.target.value)} placeholder="مثال: د-44291" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>موديل الشاحنة *</label>
                <input value={vehicle.vehicleModel} onChange={e => setV("vehicleModel", e.target.value)} placeholder="مثال: ميتسوبيشي كانتر 2020" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>سنة الصنع *</label>
                <input type="number" min="1990" max="2030" value={vehicle.vehicleYear} onChange={e => setV("vehicleYear", e.target.value)} placeholder="مثال: 2019" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>سعة الخزان (لتر) *</label>
                <input type="number" min="100" value={vehicle.capacityLiters} onChange={e => setV("capacityLiters", e.target.value)} placeholder="مثال: 10000" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>ملاحظات (اختياري)</label>
                <input value={vehicle.vehicleNotes} onChange={e => setV("vehicleNotes", e.target.value)} placeholder="أي تفاصيل إضافية عن الشاحنة..." style={inputStyle} />
              </div>
            </div>

            {vehicleError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{vehicleError}</div>
            )}

            <button type="submit" disabled={savingVehicle} style={{ padding: "13px 0", borderRadius: 12, background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "white", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: savingVehicle ? 0.7 : 1 }}>
              {savingVehicle ? "جارٍ الحفظ..." : "حفظ بيانات الشاحنة والانضمام 🚀"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
