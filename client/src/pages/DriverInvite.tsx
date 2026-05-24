import { useState, useEffect } from "react";

type InviteData = {
  id: string;
  fullName: string;
  phone: string;
  zone: string | null;
  providerName: string | null;
  status: string;
  token: string;
};

export default function DriverInvite() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("رابط الدعوة غير صالح."); setLoading(false); return; }
    fetch(`/api/provider-driver-invites/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(data => { setInvite(data); setLoading(false); })
      .catch(e => { setError(typeof e === "string" ? e : "رابط الدعوة غير صالح أو منتهي الصلاحية."); setLoading(false); });
  }, [token]);

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) { setSubmitError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (password !== confirm) { setSubmitError("كلمتا المرور غير متطابقتين"); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/provider-driver-invites/${token}/accept`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (done) return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a2e44 0%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", maxWidth: 440, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#12384f", marginBottom: 8 }}>مرحباً بك في الفريق!</h2>
        <p style={{ color: "#6b8aa0", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول إلى تطبيق قطرة باستخدام رقم هاتفك.
        </p>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#0284c7", fontWeight: 600 }}>
          📱 {invite?.phone}
        </div>
      </div>
    </div>
  );

  const alreadyAccepted = invite?.status === "accepted";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a2e44 0%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 460, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f3d5c, #0284c7)", padding: "28px 32px", color: "white" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚛</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>دعوة انضمام لأسطول مياه</h1>
          {invite?.providerName && (
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>من: {invite.providerName}</p>
          )}
        </div>

        {/* Invite Details */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #f0f9ff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "الاسم الكامل", value: invite?.fullName },
              { label: "رقم الهاتف", value: invite?.phone },
              ...(invite?.zone ? [{ label: "المنطقة", value: invite.zone }] : []),
            ].map(row => (
              <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 700, marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {alreadyAccepted ? (
          <div style={{ padding: "24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0284c7" }}>تم قبول هذه الدعوة مسبقاً. يمكنك تسجيل الدخول مباشرةً.</p>
          </div>
        ) : (
          <form onSubmit={accept} style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#6b8aa0", margin: "0 0 4px", lineHeight: 1.5 }}>
              أنشئ كلمة مرور لتفعيل حسابك والانضمام إلى أسطول التوصيل.
            </p>

            {[
              { label: "كلمة المرور", val: password, set: setPassword, ph: "٦ أحرف على الأقل" },
              { label: "تأكيد كلمة المرور", val: confirm, set: setConfirm, ph: "أعد إدخال كلمة المرور" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b8aa0", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</label>
                <input
                  type="password"
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #d8eef8", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#fafcff" }}
                />
              </div>
            ))}

            {submitError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "13px 0", borderRadius: 12, background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "white", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
            >
              {submitting ? "جارٍ التفعيل..." : "قبول الدعوة والانضمام 🚀"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
