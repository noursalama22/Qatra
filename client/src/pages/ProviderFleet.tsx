import { useState, useEffect } from "react";

type TruckStatus = "available" | "on_trip" | "maintenance";
type DriverStatus = "active" | "invited" | "suspended";

type Truck = {
  id: string;
  plateNumber: string;
  model: string;
  capacityLiters: number;
  year: number;
  status: TruckStatus;
  notes: string | null;
};

type DriverEntry = {
  id: string;
  fullName: string;
  phone: string;
  zone: string;
  status: DriverStatus;
  lastActivityAt: string | null;
  source: "driver" | "invite";
  token?: string;
  inviteStatus?: string;
  driverType?: string;
};

const DEMO_PROVIDER_ID = "seed-p1";
const DEMO_PROVIDER_NAME = "مياه الجنوب";

const TRUCK_STATUS: Record<TruckStatus, { label: string; bg: string; color: string; dot: string }> = {
  available:   { label: "متاحة",   bg: "#ecfeff", color: "#0891b2", dot: "#0891b2" },
  on_trip:     { label: "في رحلة", bg: "#dff4ff", color: "#0284c7", dot: "#0ea5e9" },
  maintenance: { label: "صيانة",   bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
};

const DRIVER_STATUS: Record<DriverStatus, { label: string; bg: string; color: string; dot: string }> = {
  active:    { label: "نشط",        bg: "#ecfeff", color: "#0891b2", dot: "#0891b2" },
  invited:   { label: "مدعو",       bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
  suspended: { label: "موقوف",      bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
};

type TruckModal = Truck & { _open: true };

type InviteResult = {
  fullName: string;
  phone: string;
  token: string;
  inviteLink: string;
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Truck Detail Modal ──────────────────────────────────────────────────────

function TruckDetail({ truck, onClose, onStatusChange }: {
  truck: TruckModal;
  onClose: () => void;
  onStatusChange: (id: string, status: TruckStatus) => void;
}) {
  const [saving, setSaving] = useState(false);
  const st = TRUCK_STATUS[truck.status];

  const changeStatus = async (next: TruckStatus) => {
    setSaving(true);
    await fetch(`/api/trucks/${truck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    onStatusChange(truck.id, next);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "22px 24px", color: "white", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚛</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{truck.plateNumber}</h3>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{truck.model}</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "الحالة", value: st.label, color: st.color },
              { label: "السعة", value: truck.capacityLiters >= 1000 ? `${truck.capacityLiters / 1000} ألف لتر` : `${truck.capacityLiters} لتر` },
              { label: "سنة الصنع", value: String(truck.year) },
            ].map(row => (
              <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (row as any).color ?? "#12384f" }}>{row.value}</div>
              </div>
            ))}
          </div>
          {truck.notes && <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#31576b", lineHeight: 1.6 }}>{truck.notes}</div>}
          <div>
            <div style={{ fontSize: 11, color: "#6b8aa0", fontWeight: 700, marginBottom: 8 }}>تغيير الحالة</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(["available", "on_trip", "maintenance"] as TruckStatus[]).map(s => {
                const cfg = TRUCK_STATUS[s];
                const active = truck.status === s;
                return (
                  <button key={s} onClick={() => !active && changeStatus(s)} disabled={saving || active}
                    style={{ padding: "9px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: active ? "default" : "pointer", border: `1px solid ${active ? cfg.dot : "#d8eef8"}`, background: active ? cfg.bg : "white", color: active ? cfg.color : "#6b8aa0" }}>{cfg.label}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Invite Driver Modal ─────────────────────────────────────────────────────

function InviteDriverModal({ onClose, onSent }: { onClose: () => void; onSent: (result: InviteResult) => void }) {
  const [form, setForm] = useState({ fullName: "", phone: "", zone: "", idNumber: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("الاسم الكامل مطلوب"); return; }
    if (!form.phone.trim()) { setError("رقم الهاتف مطلوب"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/provider-driver-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone, zone: form.zone || null, idNumber: form.idNumber || null, providerId: DEMO_PROVIDER_ID, providerName: DEMO_PROVIDER_NAME }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      onSent({ fullName: data.fullName, phone: data.phone, token: data.token, inviteLink: data.inviteLink });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ غير متوقع"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }} onClick={onClose}>
      <form style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 14 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#12384f", margin: "0 0 2px" }}>دعوة سائق جديد</h3>
            <p style={{ fontSize: 12, color: "#6b8aa0", margin: 0 }}>سيصله رابط لقبول الانضمام وتفعيل حسابه.</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "#f0f9ff", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b8aa0", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "الاسم الكامل *", key: "fullName", placeholder: "مثال: محمد أحمد", full: true },
            { label: "رقم الهاتف *", key: "phone", placeholder: "مثال: +970-599-000-000" },
            { label: "المنطقة", key: "zone", placeholder: "مثال: خان يونس" },
            { label: "رقم الهوية (اختياري)", key: "idNumber", placeholder: "رقم الهوية الوطنية" },
          ].map(f => (
            <div key={f.key} style={f.full ? { gridColumn: "1 / -1" } : {}}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b8aa0", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#fafcff" }}
              />
            </div>
          ))}
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "white", color: "#6b8aa0", border: "1px solid #d8eef8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
          <button type="submit" disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
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
          <p style={{ fontSize: 13, color: "#6b8aa0", margin: 0 }}>تمت دعوة <strong>{result.fullName}</strong> على الرقم <strong>{result.phone}</strong></p>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, marginBottom: 6, textAlign: "right" }}>رابط القبول</div>
          <div style={{ fontSize: 11, color: "#12384f", wordBreak: "break-all", direction: "ltr", textAlign: "left", lineHeight: 1.5, marginBottom: 10, background: "white", padding: "8px 10px", borderRadius: 7, border: "1px solid #d8eef8" }}>{result.inviteLink}</div>
          <button onClick={copy} style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: copied ? "#ecfeff" : "#0ea5e9", color: copied ? "#0891b2" : "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "✅ تم النسخ!" : "📋 نسخ الرابط"}
          </button>
        </div>
        <button onClick={onClose} style={{ padding: "11px 0", borderRadius: 10, background: "#f8fcff", color: "#0284c7", border: "1px solid #bae6fd", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إغلاق</button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ProviderFleet() {
  const [tab, setTab] = useState<"trucks" | "drivers">("trucks");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<DriverEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [detail, setDetail] = useState<TruckModal | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTrucks = () => fetch(`/api/trucks?providerId=${DEMO_PROVIDER_ID}`).then(r => r.json()).then(d => setTrucks(d.data ?? []));
  const loadDrivers = () => fetch(`/api/provider-drivers?providerId=${DEMO_PROVIDER_ID}`).then(r => r.json()).then(d => setDrivers(d.data ?? []));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTrucks(), loadDrivers()]).finally(() => setLoading(false));
  }, []);

  const handleTruckStatusChange = (id: string, status: TruckStatus) => setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

  const handleDriverAction = async (driver: DriverEntry, action: "resend" | "activate" | "suspend") => {
    if (action === "resend" && driver.source === "invite" && driver.token) {
      const link = `${window.location.origin}/driver-invite?token=${driver.token}`;
      setInviteResult({ fullName: driver.fullName, phone: driver.phone, token: driver.token!, inviteLink: link });
    } else if (action === "activate" && driver.source === "invite") {
      await fetch(`/api/provider-driver-invites/${driver.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "accepted" }) });
      await loadDrivers();
    } else if (action === "suspend" && driver.source === "invite") {
      await fetch(`/api/provider-driver-invites/${driver.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "expired" }) });
      await loadDrivers();
    }
  };

  const zones = [...new Set(drivers.map(d => d.zone).filter(z => z && z !== "غير محدد"))];

  const filteredTrucks = trucks.filter(t => {
    const q = search.toLowerCase();
    return !q || t.plateNumber.toLowerCase().includes(q) || t.model.toLowerCase().includes(q);
  });

  const filteredDrivers = drivers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.fullName.toLowerCase().includes(q) || d.phone.includes(q);
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchZone = zoneFilter === "all" || d.zone === zoneFilter;
    return matchSearch && matchStatus && matchZone;
  });

  const availableCount   = trucks.filter(t => t.status === "available").length;
  const onTripCount      = trucks.filter(t => t.status === "on_trip").length;
  const maintenanceCount = trucks.filter(t => t.status === "maintenance").length;
  const activeDrivers    = drivers.filter(d => d.status === "active").length;
  const invitedDrivers   = drivers.filter(d => d.status === "invited").length;

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh", padding: "28px 36px 48px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#12384f", marginBottom: 4 }}>الأسطول والكوادر</h2>
        <p style={{ fontSize: 13, color: "#6b8aa0" }}>سجّل الشاحنات، أدر حسابات السائقين، وتابع جاهزية الأسطول.</p>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        {[
          { label: "شاحنات متاحة",  value: availableCount,   icon: "✅", bg: "#ecfeff",  color: "#0891b2" },
          { label: "في رحلة",        value: onTripCount,      icon: "🚛", bg: "#dff4ff",  color: "#0284c7" },
          { label: "قيد الصيانة",   value: maintenanceCount, icon: "🔧", bg: "#fef3c7",  color: "#d97706" },
          { label: "سائقون نشطون",  value: activeDrivers,    icon: "👤", bg: "#f0f9ff",  color: "#0369a1" },
          { label: "دعوات معلقة",   value: invitedDrivers,   icon: "📤", bg: "#fef9ec",  color: "#b45309" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, overflow: "hidden" }}>

        {/* Tab Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #d8eef8" }}>
          <div style={{ display: "flex" }}>
            {([["trucks", `الشاحنات (${trucks.length})`], ["drivers", `السائقون (${drivers.length})`]] as const).map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); setSearch(""); setStatusFilter("all"); setZoneFilter("all"); }}
                style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: tab === id ? "#0284c7" : "#6b8aa0", borderBottom: tab === id ? "2px solid #0284c7" : "2px solid transparent", transition: "all 0.15s" }}>{label}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#8eb5c8", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tab === "trucks" ? "ابحث برقم اللوحة أو الموديل..." : "ابحث بالاسم أو الهاتف..."}
                style={{ padding: "8px 32px 8px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", width: 230, direction: "rtl" }} />
            </div>

            {tab === "drivers" && (
              <>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                  style={{ padding: "8px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#12384f", background: "white", direction: "rtl" }}>
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="invited">مدعو</option>
                  <option value="suspended">موقوف</option>
                </select>

                {zones.length > 0 && (
                  <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#12384f", background: "white", direction: "rtl" }}>
                    <option value="all">كل المناطق</option>
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                )}

                <button onClick={() => setInviteOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  ＋ دعوة سائق
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Trucks Grid ── */}
        {tab === "trucks" && (
          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} /><p>جارٍ التحميل...</p>
              </div>
            ) : filteredTrucks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8", border: "1px dashed #c7e3f2", borderRadius: 12 }}><div style={{ fontSize: 36, marginBottom: 12 }}>🚛</div><p style={{ fontWeight: 600, fontSize: 14 }}>لا توجد شاحنات مطابقة</p></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {filteredTrucks.map(truck => {
                  const st = TRUCK_STATUS[truck.status];
                  return (
                    <div key={truck.id}
                      style={{ border: "1px solid #d8eef8", borderRadius: 12, overflow: "hidden", background: "#fafcff", transition: "border-color 0.15s, transform 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #eef8fd" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dff4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚛</div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "#12384f" }}>{truck.plateNumber}</div>
                              <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 1 }}>{truck.model}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: st.bg, border: `1px solid ${st.dot}30`, borderRadius: 20, padding: "4px 10px" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { label: "السعة", value: truck.capacityLiters >= 1000 ? `${truck.capacityLiters / 1000} ألف لتر` : `${truck.capacityLiters} لتر` },
                          { label: "السنة", value: String(truck.year) },
                        ].map(row => (
                          <div key={row.label} style={{ background: "white", border: "1px solid #e8f5fd", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 600, marginBottom: 3 }}>{row.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "10px 18px 14px" }}>
                        <button onClick={() => setDetail({ ...truck, _open: true })}
                          style={{ width: "100%", padding: "8px 0", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          عرض التفاصيل <span>←</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Drivers Grid ── */}
        {tab === "drivers" && (
          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} /></div>
            ) : filteredDrivers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8", border: "1px dashed #c7e3f2", borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>لا يوجد سائقون مطابقون</p>
                <button onClick={() => setInviteOpen(true)} style={{ marginTop: 14, padding: "10px 20px", background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ دعوة أول سائق</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {filteredDrivers.map((driver, i) => {
                  const st = DRIVER_STATUS[driver.status] ?? DRIVER_STATUS.suspended;
                  const initials = driver.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || `S${i + 1}`;
                  return (
                    <div key={driver.id} style={{ border: "1px solid #d8eef8", borderRadius: 12, background: "#fafcff", overflow: "hidden", transition: "border-color 0.15s, transform 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>

                      {/* Card Header */}
                      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #eef8fd" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: "50%", background: driver.status === "active" ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : driver.status === "invited" ? "linear-gradient(135deg,#d97706,#f59e0b)" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initials}</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>{driver.fullName}</div>
                              <div style={{ fontSize: 11, color: "#8eb5c8", marginTop: 1 }}>📞 {driver.phone}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, background: st.bg, border: `1px solid ${st.dot}30`, borderRadius: 20, padding: "4px 10px" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "white", border: "1px solid #e8f5fd", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 600, marginBottom: 3 }}>المنطقة</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{driver.zone}</div>
                        </div>
                        <div style={{ background: "white", border: "1px solid #e8f5fd", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 600, marginBottom: 3 }}>آخر نشاط</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{fmtDate(driver.lastActivityAt)}</div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ padding: "10px 18px 14px", display: "flex", gap: 7 }}>
                        {driver.status === "invited" && (
                          <button onClick={() => handleDriverAction(driver, "resend")}
                            style={{ flex: 1, padding: "7px 0", background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            إعادة الإرسال
                          </button>
                        )}
                        {driver.status === "invited" && (
                          <button onClick={() => handleDriverAction(driver, "activate")}
                            style={{ flex: 1, padding: "7px 0", background: "#ecfeff", color: "#0891b2", border: "1px solid #67e8f9", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            تفعيل
                          </button>
                        )}
                        {driver.status === "active" && (
                          <button onClick={() => handleDriverAction(driver, "suspend")}
                            style={{ flex: 1, padding: "7px 0", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            إيقاف
                          </button>
                        )}
                        {driver.status === "suspended" && (
                          <button onClick={() => handleDriverAction(driver, "activate")}
                            style={{ flex: 1, padding: "7px 0", background: "#ecfeff", color: "#0891b2", border: "1px solid #67e8f9", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            إعادة تفعيل
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {detail && <TruckDetail truck={detail} onClose={() => setDetail(null)} onStatusChange={handleTruckStatusChange} />}
      {inviteOpen && <InviteDriverModal onClose={() => setInviteOpen(false)} onSent={r => { setInviteResult(r); loadDrivers(); }} />}
      {inviteResult && <InviteSuccessModal result={inviteResult} onClose={() => setInviteResult(null)} />}
    </div>
  );
}
