import { useState, useEffect } from "react";

type DriverStatus = "active" | "invited" | "suspended";

type DriverEntry = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  zone: string | null;
  plateNumber: string | null;
  vehicleModel: string | null;
  capacityLiters: number | null;
  status: DriverStatus;
  lastActivityAt: string | null;
  source: "driver" | "invite";
  token?: string;
  inviteStatus?: string;
  driverType?: string;
};

const DEMO_PROVIDER_ID = "seed-p1";
const DEMO_PROVIDER_NAME = "مياه الجنوب";

const DRIVER_STATUS: Record<DriverStatus, { label: string; bg: string; color: string; dot: string }> = {
  active:    { label: "نشط",   bg: "#ecfeff", color: "#0891b2", dot: "#0891b2" },
  invited:   { label: "مدعو",  bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
  suspended: { label: "موقوف", bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
};

type InviteResult = {
  fullName: string;
  email: string;
  token: string;
  inviteLink: string;
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtCapacity(liters: number | null) {
  if (!liters) return "—";
  if (liters >= 1000) return `${(liters / 1000).toFixed(0)}K لتر`;
  return `${liters} لتر`;
}

// ── Invite Driver Modal ─────────────────────────────────────────────────────

function InviteDriverModal({ onClose, onSent }: { onClose: () => void; onSent: (result: InviteResult) => void }) {
  const GAZA_ZONES = [
    "شمال غزة", "بيت لاهيا", "بيت حانون", "جباليا",
    "مدينة غزة", "الشجاعية", "الزيتون", "التفاح", "الرمال", "الشيخ رضوان",
    "دير البلح", "النصيرات", "البريج", "المغازي",
    "خان يونس", "عبسان", "خزاعة", "بني سهيلا",
    "رفح", "تل السلطان", "البرازيل",
  ];

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", idNumber: "", zone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("الاسم الكامل مطلوب"); return; }
    if (!form.email.trim()) { setError("البريد الإلكتروني مطلوب"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("البريد الإلكتروني غير صالح"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/provider-driver-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          idNumber: form.idNumber.trim() || null,
          zone: form.zone || null,
          providerId: DEMO_PROVIDER_ID,
          providerName: DEMO_PROVIDER_NAME,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      onSent({ fullName: data.fullName, email: data.email, token: data.token, inviteLink: data.inviteLink });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ غير متوقع"); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #d8eef8",
    borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none",
    direction: "rtl" as const, background: "#fafcff", boxSizing: "border-box" as const,
  };
  const labelStyle = {
    display: "block" as const, fontSize: 11, fontWeight: 700, color: "#6b8aa0",
    marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: 0.4,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)", padding: "20px" }} onClick={onClose}>
      <form style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 14 }} onClick={e => e.stopPropagation()} onSubmit={submit}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#12384f", margin: "0 0 3px" }}>دعوة سائق جديد</h3>
            <p style={{ fontSize: 12, color: "#6b8aa0", margin: 0 }}>سيصله رابط الدعوة على بريده الإلكتروني ليكمل إنشاء حسابه وإدخال بيانات شاحنته.</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "#f0f9ff", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b8aa0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8 }}>×</button>
        </div>

        {/* Two-phase notice */}
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: "#0369a1", lineHeight: 1.6 }}>
            <strong>خطوتان:</strong> أنت تُرسل الدعوة فقط. السائق هو من يُدخل بيانات شاحنته بعد قبول الدعوة.
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>الاسم الكامل *</label>
            <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="مثال: محمد أحمد الشريف" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>البريد الإلكتروني * — لإرسال رابط الدعوة</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="driver@example.com" style={{ ...inputStyle, direction: "ltr" }} />
          </div>
          <div>
            <label style={labelStyle}>رقم الهاتف (اختياري)</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+970-599-000-000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>رقم الهوية (اختياري)</label>
            <input value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="رقم الهوية الوطنية" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>المنطقة (اختياري)</label>
            <select value={form.zone} onChange={e => set("zone", e.target.value)} style={{ ...inputStyle, color: form.zone ? "#12384f" : "#8eb5c8" }}>
              <option value="">اختر المنطقة...</option>
              {GAZA_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "white", color: "#6b8aa0", border: "1px solid #d8eef8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
          <button type="submit" disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "جارٍ الإرسال..." : "إرسال الدعوة 📤"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Invite Success Modal ────────────────────────────────────────────────────

function InviteSuccessModal({ result, onClose }: { result: InviteResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(result.inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 26 }}>✅</div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#12384f", margin: "0 0 4px" }}>تم إرسال الدعوة بنجاح!</h3>
          <p style={{ fontSize: 13, color: "#6b8aa0", margin: 0 }}>
            تمت دعوة <strong>{result.fullName}</strong> على البريد الإلكتروني{" "}
            <strong style={{ direction: "ltr", display: "inline-block" }}>{result.email}</strong>
          </p>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, marginBottom: 6, textAlign: "right" }}>رابط قبول الدعوة</div>
          <div style={{ fontSize: 11, color: "#12384f", wordBreak: "break-all", direction: "ltr", textAlign: "left", lineHeight: 1.5, marginBottom: 10, background: "white", padding: "8px 10px", borderRadius: 7, border: "1px solid #d8eef8" }}>{result.inviteLink}</div>
          <button onClick={copy} style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: copied ? "#ecfeff" : "#0ea5e9", color: copied ? "#0891b2" : "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "✅ تم النسخ!" : "📋 نسخ الرابط"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#8eb5c8", margin: 0 }}>سيقوم السائق بإدخال بيانات شاحنته بنفسه بعد قبول الدعوة.</p>
        <button onClick={onClose} style={{ padding: "11px 0", borderRadius: 10, background: "#f8fcff", color: "#0284c7", border: "1px solid #bae6fd", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إغلاق</button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ProviderFleet() {
  const [drivers, setDrivers] = useState<DriverEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDrivers = () =>
    fetch(`/api/provider-drivers?providerId=${DEMO_PROVIDER_ID}`)
      .then(r => r.json())
      .then(d => setDrivers(d.data ?? []));

  useEffect(() => {
    setLoading(true);
    loadDrivers().finally(() => setLoading(false));
  }, []);

  const handleDriverAction = async (driver: DriverEntry, action: "resend" | "activate" | "suspend") => {
    if (action === "resend" && driver.token) {
      const link = `${window.location.origin}/driver-invite?token=${driver.token}`;
      setInviteResult({ fullName: driver.fullName, email: driver.email, token: driver.token, inviteLink: link });
      return;
    }
    const newStatus = action === "activate" ? "accepted" : "expired";
    await fetch(`/api/provider-driver-invites/${driver.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await loadDrivers();
  };

  const zones = [...new Set(drivers.map(d => d.zone).filter((z): z is string => !!z && z !== "غير محدد"))];

  const activeCount    = drivers.filter(d => d.status === "active").length;
  const invitedCount   = drivers.filter(d => d.status === "invited").length;
  const suspendedCount = drivers.filter(d => d.status === "suspended").length;

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.fullName.toLowerCase().includes(q) || (d.email ?? "").toLowerCase().includes(q) || (d.phone ?? "").includes(q);
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchZone   = zoneFilter === "all" || d.zone === zoneFilter;
    return matchSearch && matchStatus && matchZone;
  });

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh", padding: "28px 36px 48px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#12384f", marginBottom: 4 }}>إدارة السائقين</h2>
          <p style={{ fontSize: 13, color: "#6b8aa0" }}>أرسل دعوات للسائقين — كل سائق يُدخل بيانات شاحنته بنفسه عند قبول الدعوة.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          ＋ دعوة سائق جديد
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "سائقون نشطون",  value: activeCount,    icon: "✅", bg: "#ecfeff", color: "#0891b2" },
          { label: "دعوات معلقة",   value: invitedCount,   icon: "📤", bg: "#fef3c7", color: "#d97706" },
          { label: "موقوفون",        value: suspendedCount, icon: "🚫", bg: "#fee2e2", color: "#dc2626" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "#8eb5c8", fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            style={{ width: "100%", padding: "9px 34px 9px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#fafcff" }}
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: "9px 14px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#12384f", background: "white", direction: "rtl" }}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="invited">مدعو</option>
          <option value="suspended">موقوف</option>
        </select>

        {zones.length > 0 && (
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
            style={{ padding: "9px 14px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#12384f", background: "white", direction: "rtl" }}>
            <option value="all">كل المناطق</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        )}

        <span style={{ fontSize: 12, color: "#8eb5c8", marginRight: "auto" }}>عرض {filtered.length} من {drivers.length}</span>
      </div>

      {/* ── Driver Cards ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "72px", color: "#8eb5c8" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>جارٍ تحميل السائقين...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 20px", color: "#8eb5c8", background: "white", borderRadius: 14, border: "1px dashed #c7e3f2" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>لا يوجد سائقون مطابقون</p>
          <p style={{ fontSize: 13 }}>جرّب تعديل عوامل التصفية، أو ادعُ سائقاً جديداً.</p>
          <button onClick={() => setInviteOpen(true)} style={{ marginTop: 16, padding: "11px 24px", background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ＋ دعوة سائق جديد
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {filtered.map((driver, i) => {
            const st = DRIVER_STATUS[driver.status] ?? DRIVER_STATUS.suspended;
            const initials = driver.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || `S${i + 1}`;
            const avatarBg =
              driver.status === "active"    ? "linear-gradient(135deg,#0284c7,#0ea5e9)" :
              driver.status === "invited"   ? "linear-gradient(135deg,#d97706,#f59e0b)" :
                                              "linear-gradient(135deg,#dc2626,#f87171)";
            const hasTruck = !!(driver.plateNumber || driver.vehicleModel);

            return (
              <div key={driver.id}
                style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.15s, transform 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
              >
                {/* Card Header */}
                <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #f0f9ff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#12384f" }}>{driver.fullName}</div>
                        <div style={{ fontSize: 11, color: "#8eb5c8", marginTop: 2, direction: "ltr", textAlign: "right" }}>✉️ {driver.email || "—"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: st.bg, border: `1px solid ${st.dot}30`, borderRadius: 20, padding: "5px 11px", flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
                  <div style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 700, marginBottom: 4 }}>🚛 الشاحنة</div>
                    {hasTruck ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{driver.plateNumber || "—"}</div>
                        {driver.vehicleModel && <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 2 }}>{driver.vehicleModel}</div>}
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>في انتظار السائق</div>
                    )}
                  </div>
                  <div style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 700, marginBottom: 4 }}>💧 السعة</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: hasTruck ? "#12384f" : "#d97706" }}>
                      {hasTruck ? fmtCapacity(driver.capacityLiters) : "في انتظار السائق"}
                    </div>
                  </div>
                  <div style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 700, marginBottom: 4 }}>📍 المنطقة</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{driver.zone || "—"}</div>
                  </div>
                  <div style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 700, marginBottom: 4 }}>🕐 آخر نشاط</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{fmtDate(driver.lastActivityAt)}</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ padding: "12px 18px 16px", display: "flex", gap: 8 }}>
                  {driver.status === "invited" && <>
                    <button onClick={() => handleDriverAction(driver, "resend")}
                      style={{ flex: 1, padding: "8px 0", background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      إعادة إرسال الرابط
                    </button>
                    <button onClick={() => handleDriverAction(driver, "activate")}
                      style={{ flex: 1, padding: "8px 0", background: "#ecfeff", color: "#0891b2", border: "1px solid #67e8f9", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      تفعيل
                    </button>
                  </>}
                  {driver.status === "active" && (
                    <button onClick={() => handleDriverAction(driver, "suspend")}
                      style={{ flex: 1, padding: "8px 0", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      إيقاف مؤقت
                    </button>
                  )}
                  {driver.status === "suspended" && (
                    <button onClick={() => handleDriverAction(driver, "activate")}
                      style={{ flex: 1, padding: "8px 0", background: "#ecfeff", color: "#0891b2", border: "1px solid #67e8f9", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      إعادة تفعيل
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inviteOpen && (
        <InviteDriverModal
          onClose={() => setInviteOpen(false)}
          onSent={r => { setInviteResult(r); loadDrivers(); }}
        />
      )}
      {inviteResult && (
        <InviteSuccessModal result={inviteResult} onClose={() => setInviteResult(null)} />
      )}
    </div>
  );
}
