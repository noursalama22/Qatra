import { useState, useEffect } from "react";

type Task = { id: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string; notes: string | null };
type Order = { id: string; citizenId: string; status: string; quantityLiters: string; totalAmount: string; createdAt: string };
type Driver = { id: string; vehicleType: string; status: string; driverType: string; phone: string };
type Zone = { id: string; name: string };

const DEMO_PROVIDER_ID = "seed-p1";
const STATUS_LABELS: Record<string, string> = { pending: "مجدولة", in_progress: "جارية", delivered: "مُنجزة", cancelled: "ملغاة" };
const ORDER_STATUS_LABELS: Record<string, string> = { pending: "معلق", dispatched: "جاري التوصيل", delivered: "مُسلَّم", cancelled: "ملغي" };
const STATUS_COLORS: Record<string, string> = { pending: "#f59e0b", in_progress: "#2563eb", delivered: "#10b981", cancelled: "#94a3b8", dispatched: "#8b5cf6" };

export default function ProviderPortal() {
  const [tab, setTab] = useState<"ngo" | "commercial" | "drivers">("ngo");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    const [t, o, d, z] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/drivers").then(r => r.json()),
      fetch("/api/zones").then(r => r.json()),
    ]);
    setTasks(t.data ?? []);
    setOrders(o.data ?? []);
    setDrivers((d.data ?? []).filter((dr: Driver & { providerId: string }) => dr.providerId === DEMO_PROVIDER_ID));
    setZones(z.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const advanceTask = async (id: string, nextStatus: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    showToast(nextStatus === "in_progress" ? "🚛 تم إرسال السائق" : "✅ تم تأكيد التسليم");
    load();
  };

  const advanceOrder = async (id: string, nextStatus: string) => {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    showToast(nextStatus === "dispatched" ? "🚛 تم إرسال السائق للطلب" : "✅ تم تأكيد التوصيل");
    load();
  };

  const toggleDriver = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await fetch(`/api/drivers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    showToast(newStatus === "active" ? "✅ تم تفعيل السائق" : "⏸ تم إيقاف السائق");
    load();
  };

  const ngoTasks = tasks.filter(t => t.status !== "cancelled");
  const commercialOrders = orders;
  const activeDrivers = drivers.filter(d => d.status === "active").length;

  return (
    <div className="portal provider-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      <div className="portal-header" style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)" }}>
        <div className="portal-header-inner">
          <div className="portal-role-badge">🏢 مزود الخدمة</div>
          <h2 className="portal-title">FastWater Co.</h2>
          <p className="portal-subtitle">إنساني · تجاري · إدارة الأسطول والعمليات</p>
        </div>
        <div className="portal-header-stats">
          <div className="ph-stat"><span className="ph-val">{ngoTasks.filter(t => t.status === "in_progress").length}</span><span className="ph-lbl">مهمة جارية</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{commercialOrders.filter(o => o.status === "pending").length}</span><span className="ph-lbl">طلب جديد</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{activeDrivers}</span><span className="ph-lbl">سائق نشط</span></div>
        </div>
      </div>

      <div className="portal-tabs">
        <button className={`ptab ${tab === "ngo" ? "ptab-active" : ""}`} onClick={() => setTab("ngo")}>
          🤝 وضع إنساني {ngoTasks.filter(t => t.status === "pending").length > 0 && <span className="ptab-badge">{ngoTasks.filter(t => t.status === "pending").length}</span>}
        </button>
        <button className={`ptab ${tab === "commercial" ? "ptab-active" : ""}`} onClick={() => setTab("commercial")}>
          💰 وضع تجاري {commercialOrders.filter(o => o.status === "pending").length > 0 && <span className="ptab-badge">{commercialOrders.filter(o => o.status === "pending").length}</span>}
        </button>
        <button className={`ptab ${tab === "drivers" ? "ptab-active" : ""}`} onClick={() => setTab("drivers")}>🚚 الأسطول ({drivers.length})</button>
      </div>

      <div className="portal-body">

        {/* ── NGO Tasks ── */}
        {tab === "ngo" && (
          <>
            <div className="mode-banner mode-banner-hum">
              <span>🤝</span>
              <div>
                <div style={{ fontWeight: 700 }}>وضع العمليات الإنسانية</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>المهام ممولة من المنظمة — المواطن لا يدفع شيئاً</div>
              </div>
            </div>
            <div className="tasks-list">
              {ngoTasks.map(t => {
                const zone = zones.find(z => z.id === t.zoneId);
                const color = STATUS_COLORS[t.status] ?? "#94a3b8";
                const canDispatch = t.status === "pending";
                const canDeliver = t.status === "in_progress";
                return (
                  <div key={t.id} className="task-row task-row-interactive">
                    <div className="task-row-status" style={{ background: color + "15", borderColor: color + "40" }}>
                      <div className="task-status-dot" style={{ background: color }} />
                      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{STATUS_LABELS[t.status]}</span>
                    </div>
                    <div className="task-row-info">
                      <div className="task-row-zone">🗺️ {zone?.name ?? t.zoneId}</div>
                      <div className="task-row-meta">
                        💧 {Number(t.quantityLiters).toLocaleString()} لتر
                        · 📅 {new Date(t.scheduledAt).toLocaleDateString("ar-SY")}
                        {t.notes && <span> · {t.notes}</span>}
                      </div>
                    </div>
                    <div className="task-row-actions">
                      {canDispatch && <button className="btn btn-dispatch" onClick={() => advanceTask(t.id, "in_progress")}>🚛 إرسال</button>}
                      {canDeliver && <button className="btn btn-delivered" onClick={() => advanceTask(t.id, "delivered")}>✅ تأكيد التسليم</button>}
                    </div>
                  </div>
                );
              })}
              {ngoTasks.length === 0 && <div className="empty-state">لا توجد مهام حالياً</div>}
            </div>
          </>
        )}

        {/* ── Commercial Orders ── */}
        {tab === "commercial" && (
          <>
            <div className="mode-banner mode-banner-com">
              <span>💰</span>
              <div>
                <div style={{ fontWeight: 700 }}>وضع العمليات التجارية</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>المواطن يدفع عبر Qatra — تستلم الدفع بعد خصم رسوم المنصة 5%</div>
              </div>
            </div>
            <div className="tasks-list">
              {commercialOrders.map(o => {
                const color = STATUS_COLORS[o.status] ?? "#94a3b8";
                const canDispatch = o.status === "pending";
                const canDeliver = o.status === "dispatched";
                return (
                  <div key={o.id} className="task-row task-row-interactive">
                    <div className="task-row-status" style={{ background: color + "15", borderColor: color + "40" }}>
                      <div className="task-status-dot" style={{ background: color }} />
                      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
                    </div>
                    <div className="task-row-info">
                      <div className="task-row-zone">📦 طلب مواطن</div>
                      <div className="task-row-meta">
                        💧 {Number(o.quantityLiters).toLocaleString()} لتر
                        · 💵 {Number(o.totalAmount).toFixed(2)}$
                        · 📅 {new Date(o.createdAt).toLocaleDateString("ar-SY")}
                      </div>
                    </div>
                    <div className="task-row-actions">
                      {canDispatch && <button className="btn btn-dispatch" onClick={() => advanceOrder(o.id, "dispatched")}>🚛 إرسال</button>}
                      {canDeliver && <button className="btn btn-delivered" onClick={() => advanceOrder(o.id, "delivered")}>✅ تأكيد</button>}
                    </div>
                  </div>
                );
              })}
              {commercialOrders.length === 0 && <div className="empty-state">لا توجد طلبات تجارية</div>}
            </div>
          </>
        )}

        {/* ── Driver Fleet ── */}
        {tab === "drivers" && (
          <>
            <div className="section-title">أسطول السائقين</div>
            {drivers.map(d => (
              <div key={d.id} className="driver-card">
                <div className="driver-card-avatar" style={{ background: d.status === "active" ? "#dcfce7" : "#f1f5f9", color: d.status === "active" ? "#16a34a" : "#64748b" }}>
                  {d.driverType === "owned" ? "👷" : "🧑"}
                </div>
                <div className="driver-card-info">
                  <div className="driver-card-name">{d.vehicleType}</div>
                  <div className="driver-card-meta">
                    <span className={`driver-type-badge ${d.driverType === "owned" ? "dt-owned" : "dt-indep"}`}>
                      {d.driverType === "owned" ? "🔒 تابع" : "🔓 مستقل"}
                    </span>
                    <span style={{ color: "#94a3b8" }}>·</span>
                    <span>{d.phone}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span className={`badge ${d.status === "active" ? "badge-green" : "badge-gray"}`}>{d.status === "active" ? "نشط" : "متوقف"}</span>
                  <button
                    className={`btn btn-sm ${d.status === "active" ? "btn-outline-red" : "btn-outline"}`}
                    onClick={() => toggleDriver(d.id, d.status)}
                  >
                    {d.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              </div>
            ))}
            <div className="invite-banner">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>➕ دعوة سائق مستقل</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>يمكن دعوة سائقين مستقلين لمهام محددة دون ربطهم بشكل دائم بالشركة</div>
              <button className="btn btn-outline" disabled>إرسال دعوة (قريباً)</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
