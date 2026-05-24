import { useState, useEffect } from "react";

type TruckStatus = "available" | "on_trip" | "maintenance";
type DriverStatus = "active" | "inactive" | "pending" | "rejected";

type Truck = {
  id: string;
  plateNumber: string;
  model: string;
  capacityLiters: number;
  year: number;
  status: TruckStatus;
  notes: string | null;
};

type Driver = {
  id: string;
  phone: string | null;
  vehicleType: string | null;
  status: DriverStatus;
  driverType: "owned" | "independent";
};

const DEMO_PROVIDER_ID = "seed-p1";

const TRUCK_STATUS: Record<TruckStatus, { label: string; bg: string; color: string; dot: string }> = {
  available:   { label: "متاحة",   bg: "#ecfeff", color: "#0891b2", dot: "#0891b2" },
  on_trip:     { label: "في رحلة", bg: "#dff4ff", color: "#0284c7", dot: "#0ea5e9" },
  maintenance: { label: "صيانة",   bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
};

const DRIVER_STATUS: Record<DriverStatus, { label: string; bg: string; color: string }> = {
  active:   { label: "نشط",              bg: "#ecfeff", color: "#0891b2" },
  inactive: { label: "غير نشط",          bg: "#f1f5f9", color: "#6b8aa0" },
  pending:  { label: "بانتظار الموافقة", bg: "#fef3c7", color: "#d97706" },
  rejected: { label: "مرفوض",           bg: "#fee2e2", color: "#dc2626" },
};

type TruckModal = Truck & { _open: true };

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
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "22px 24px", color: "white", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚛</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{truck.plateNumber}</h3>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{truck.model}</p>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
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
          {truck.notes && (
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#31576b", lineHeight: 1.6 }}>
              {truck.notes}
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: "#6b8aa0", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>تغيير الحالة</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(["available", "on_trip", "maintenance"] as TruckStatus[]).map(s => {
                const cfg = TRUCK_STATUS[s];
                const active = truck.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => !active && changeStatus(s)}
                    disabled={saving || active}
                    style={{ padding: "9px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: active ? "default" : "pointer", border: `1px solid ${active ? cfg.dot : "#d8eef8"}`, background: active ? cfg.bg : "white", color: active ? cfg.color : "#6b8aa0", transition: "all 0.15s" }}
                  >{cfg.label}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type RegisterModal = { open: true };

function RegisterTruckModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ plateNumber: "", model: "", capacityLiters: "", year: new Date().getFullYear().toString(), notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber || !form.model || !form.capacityLiters) { setError("رقم اللوحة والموديل والسعة مطلوبة"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: DEMO_PROVIDER_ID,
          plateNumber: form.plateNumber,
          model: form.model,
          capacityLiters: parseInt(form.capacityLiters) * 1000,
          year: parseInt(form.year),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("فشل التسجيل");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }} onClick={onClose}>
      <form style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 14 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#12384f", margin: 0 }}>تسجيل شاحنة جديدة</h3>
          <button type="button" onClick={onClose} style={{ background: "#f0f9ff", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b8aa0", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {[
          { label: "رقم اللوحة", key: "plateNumber", placeholder: "مثال: د-44291" },
          { label: "الموديل", key: "model", placeholder: "مثال: فولفو FM 420" },
          { label: "السعة (ألف لتر)", key: "capacityLiters", placeholder: "مثال: 12", type: "number" },
          { label: "سنة الصنع", key: "year", placeholder: "مثال: 2023", type: "number" },
        ].map(field => (
          <div key={field.key}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b8aa0", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{field.label}</label>
            <input
              type={field.type ?? "text"}
              value={(form as any)[field.key]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#fafcff" }}
            />
          </div>
        ))}

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b8aa0", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>ملاحظات (اختياري)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="أي ملاحظات إضافية عن الشاحنة..."
            rows={2}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", direction: "rtl", background: "#fafcff" }}
          />
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "white", color: "#6b8aa0", border: "1px solid #d8eef8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
          <button type="submit" disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "جارٍ التسجيل..." : "تسجيل الشاحنة"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProviderFleet() {
  const [tab, setTab] = useState<"trucks" | "drivers">("trucks");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<TruckModal | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTrucks = () =>
    fetch(`/api/trucks?providerId=${DEMO_PROVIDER_ID}`).then(r => r.json()).then(d => setTrucks(d.data ?? []));

  const loadDrivers = () =>
    fetch("/api/drivers").then(r => r.json()).then(d =>
      setDrivers((d.data ?? []).filter((dr: Driver & { providerId: string }) => dr.providerId === DEMO_PROVIDER_ID))
    );

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTrucks(), loadDrivers()]).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (id: string, status: TruckStatus) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const filteredTrucks = trucks.filter(t => {
    const q = search.toLowerCase();
    return !q || t.plateNumber.toLowerCase().includes(q) || t.model.toLowerCase().includes(q);
  });

  const filteredDrivers = drivers.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.phone ?? "").includes(q) || (d.vehicleType ?? "").toLowerCase().includes(q);
  });

  const availableCount   = trucks.filter(t => t.status === "available").length;
  const onTripCount      = trucks.filter(t => t.status === "on_trip").length;
  const maintenanceCount = trucks.filter(t => t.status === "maintenance").length;
  const activeDrivers    = drivers.filter(d => d.status === "active").length;

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh", padding: "28px 36px 48px" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#12384f", marginBottom: 4 }}>الأسطول والكوادر</h2>
        <p style={{ fontSize: 13, color: "#6b8aa0" }}>سجّل الشاحنات، أدر حسابات السائقين، وتابع جاهزية الأسطول.</p>
      </div>

      {/* ── Summary Bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "شاحنات متاحة",   value: availableCount,   icon: "✅", bg: "#ecfeff",  color: "#0891b2" },
          { label: "في رحلة",         value: onTripCount,      icon: "🚛", bg: "#dff4ff",  color: "#0284c7" },
          { label: "قيد الصيانة",    value: maintenanceCount, icon: "🔧", bg: "#fef3c7",  color: "#d97706" },
          { label: "سائقون نشطون",   value: activeDrivers,    icon: "👤", bg: "#f0f9ff",  color: "#0369a1" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar + Controls ── */}
      <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #d8eef8" }}>
          <div style={{ display: "flex" }}>
            {([["trucks", `الشاحنات (${trucks.length})`], ["drivers", `السائقون (${drivers.length})`]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSearch(""); }}
                style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: tab === id ? "#0284c7" : "#6b8aa0", borderBottom: tab === id ? "2px solid #0284c7" : "2px solid transparent", transition: "all 0.15s" }}
              >{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#8eb5c8", fontSize: 14 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث برقم اللوحة أو المعرّف..."
                style={{ padding: "8px 32px 8px 12px", border: "1px solid #d8eef8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", width: 240, direction: "rtl" }}
              />
            </div>
            {tab === "trucks" && (
              <button
                onClick={() => setRegisterOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ＋ تسجيل شاحنة
              </button>
            )}
          </div>
        </div>

        {/* ── Trucks Grid ── */}
        {tab === "trucks" && (
          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
                <p>جارٍ التحميل...</p>
              </div>
            ) : filteredTrucks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8", border: "1px dashed #c7e3f2", borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🚛</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>لا توجد شاحنات مطابقة</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {filteredTrucks.map(truck => {
                  const st = TRUCK_STATUS[truck.status];
                  return (
                    <div
                      key={truck.id}
                      style={{ border: "1px solid #d8eef8", borderRadius: 12, overflow: "hidden", background: "#fafcff", transition: "border-color 0.15s, transform 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                    >
                      {/* Card Top */}
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

                      {/* Card Stats */}
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

                      {/* Card Footer */}
                      <div style={{ padding: "10px 18px 14px" }}>
                        <button
                          onClick={() => setDetail({ ...truck, _open: true })}
                          style={{ width: "100%", padding: "8px 0", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
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

        {/* ── Drivers Tab ── */}
        {tab === "drivers" && (
          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8eb5c8", border: "1px dashed #c7e3f2", borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>لا يوجد سائقون مسجلون</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {filteredDrivers.map((driver, i) => {
                  const st = DRIVER_STATUS[driver.status] ?? DRIVER_STATUS.inactive;
                  const initials = `S${i + 1}`;
                  return (
                    <div
                      key={driver.id}
                      style={{ border: "1px solid #d8eef8", borderRadius: 12, background: "#fafcff", overflow: "hidden", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"}
                    >
                      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #eef8fd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#0284c7,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initials}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>
                              {driver.driverType === "owned" ? "سائق تابع" : "سائق مستقل"}
                            </div>
                            <div style={{ fontSize: 11, color: "#8eb5c8", marginTop: 1 }}>{driver.phone ?? "لا يوجد رقم"}</div>
                          </div>
                        </div>
                        <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{st.label}</span>
                      </div>

                      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "white", border: "1px solid #e8f5fd", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 600, marginBottom: 3 }}>نوع المركبة</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{driver.vehicleType ?? "غير محدد"}</div>
                        </div>
                        <div style={{ background: "white", border: "1px solid #e8f5fd", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#8eb5c8", fontWeight: 600, marginBottom: 3 }}>نوع التعاقد</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{driver.driverType === "owned" ? "دائم" : "مستقل"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {detail && (
        <TruckDetail
          truck={detail}
          onClose={() => setDetail(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {registerOpen && (
        <RegisterTruckModal
          onClose={() => setRegisterOpen(false)}
          onSaved={() => { loadTrucks(); }}
        />
      )}
    </div>
  );
}
