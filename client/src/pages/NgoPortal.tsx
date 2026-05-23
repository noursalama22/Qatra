import { useState, useEffect } from "react";

type Zone = { id: string; name: string; status: string; populationEstimate: number; signalCount: number; lastDeliveryAt: string | null; description: string };
type Task = { id: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string; notes: string | null };
type Provider = { id: string; companyName: string; operatingModes: string[] };

const DEMO_NGO_ID = "seed-n1";
const STATUS_COLORS: Record<string, string> = { pending: "#f59e0b", in_progress: "#2563eb", delivered: "#10b981", cancelled: "#94a3b8" };
const STATUS_LABELS: Record<string, string> = { pending: "مجدولة", in_progress: "جارية", delivered: "مُنجزة", cancelled: "ملغاة" };

export default function NgoPortal() {
  const [tab, setTab] = useState<"zones" | "tasks" | "ops">("zones");
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [zoneForm, setZoneForm] = useState({ name: "", description: "", populationEstimate: "" });
  const [taskForm, setTaskForm] = useState({ zoneId: "", providerId: "", quantityLiters: "", scheduledAt: "", notes: "" });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    const [z, t, p] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
    ]);
    setZones(z.data ?? []);
    setTasks(t.data ?? []);
    setProviders((p.data ?? []).filter((p: Provider) => (p.operatingModes ?? []).includes("humanitarian")));
  };

  useEffect(() => { load(); }, []);

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/zones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...zoneForm, ngoId: DEMO_NGO_ID, status: "active" }),
    });
    setZoneForm({ name: "", description: "", populationEstimate: "" });
    setShowZoneForm(false);
    showToast("✅ تمت إضافة المنطقة");
    load();
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, ngoId: DEMO_NGO_ID }),
    });
    setTaskForm({ zoneId: "", providerId: "", quantityLiters: "", scheduledAt: "", notes: "" });
    setShowTaskForm(false);
    showToast("✅ تم إنشاء مهمة التوزيع");
    load();
  };

  const myZones = zones.filter(z => tasks.find(t => t.zoneId === z.id) || true);
  const myTasks = tasks;
  const totalSignals = zones.reduce((s, z) => s + (z.signalCount ?? 0), 0);
  const activeTasks = tasks.filter(t => t.status === "in_progress");
  const deliveredTasks = tasks.filter(t => t.status === "delivered");

  const priorityScore = (z: Zone) => {
    const signals = Math.min(z.signalCount / 100, 1) * 40;
    const days = z.lastDeliveryAt ? Math.min((Date.now() - new Date(z.lastDeliveryAt).getTime()) / 86400000 / 30, 1) * 40 : 40;
    const pop = Math.min((z.populationEstimate ?? 0) / 20000, 1) * 20;
    return Math.round(signals + days + pop);
  };

  return (
    <div className="portal ngo-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      <div className="portal-header" style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
        <div className="portal-header-inner">
          <div className="portal-role-badge">❤️ المنظمة الإنسانية</div>
          <h2 className="portal-title">WaterAid Syria</h2>
          <p className="portal-subtitle">إدارة مناطق التغطية ومهام التوزيع</p>
        </div>
        <div className="portal-header-stats">
          <div className="ph-stat"><span className="ph-val">{zones.length}</span><span className="ph-lbl">منطقة</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{activeTasks.length}</span><span className="ph-lbl">مهمة جارية</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{totalSignals}</span><span className="ph-lbl">إشارة احتياج</span></div>
        </div>
      </div>

      <div className="portal-tabs">
        <button className={`ptab ${tab === "zones" ? "ptab-active" : ""}`} onClick={() => setTab("zones")}>🗺️ مناطق التغطية</button>
        <button className={`ptab ${tab === "tasks" ? "ptab-active" : ""}`} onClick={() => setTab("tasks")}>📋 مهام التوزيع</button>
        <button className={`ptab ${tab === "ops" ? "ptab-active" : ""}`} onClick={() => setTab("ops")}>📈 تقرير العمليات</button>
      </div>

      <div className="portal-body">

        {/* ── Zones ── */}
        {tab === "zones" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>مناطق التغطية</div>
              <button className="btn btn-primary" onClick={() => setShowZoneForm(v => !v)}>
                {showZoneForm ? "إلغاء ✕" : "+ إضافة منطقة"}
              </button>
            </div>

            {showZoneForm && (
              <form className="inline-form" onSubmit={createZone}>
                <div className="form-title">➕ منطقة جديدة</div>
                <div className="form-row">
                  <input required className="form-input" placeholder="اسم المنطقة" value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="form-input" placeholder="تعداد السكان" type="number" value={zoneForm.populationEstimate} onChange={e => setZoneForm(f => ({ ...f, populationEstimate: e.target.value }))} />
                </div>
                <input className="form-input" placeholder="وصف المنطقة (اختياري)" value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary">حفظ المنطقة</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowZoneForm(false)}>إلغاء</button>
                </div>
              </form>
            )}

            <div className="zone-cards">
              {myZones.map(z => {
                const score = priorityScore(z);
                const scoreColor = score > 70 ? "#ef4444" : score > 40 ? "#f59e0b" : "#10b981";
                const zoneTasks = myTasks.filter(t => t.zoneId === z.id);
                return (
                  <div key={z.id} className="zone-card">
                    <div className="zone-card-top">
                      <div>
                        <div className="zone-card-name">{z.name}</div>
                        <div className="zone-card-meta">{(z.populationEstimate ?? 0).toLocaleString()} ساكن</div>
                      </div>
                      <div className="priority-badge" style={{ background: scoreColor + "18", color: scoreColor, borderColor: scoreColor + "40" }}>
                        <span style={{ fontSize: 18, fontWeight: 800 }}>{score}</span>
                        <span style={{ fontSize: 10 }}>أولوية</span>
                      </div>
                    </div>
                    <div className="zone-card-row">
                      <span>🆘 إشارات</span><span style={{ fontWeight: 700, color: "#ef4444" }}>{z.signalCount}</span>
                    </div>
                    <div className="zone-card-row">
                      <span>📅 آخر توزيع</span>
                      <span>{z.lastDeliveryAt ? new Date(z.lastDeliveryAt).toLocaleDateString("ar-SY") : "لا يوجد"}</span>
                    </div>
                    <div className="zone-card-row">
                      <span>📋 مهام</span>
                      <span>{zoneTasks.filter(t => t.status === "pending").length} مجدولة · {zoneTasks.filter(t => t.status === "in_progress").length} جارية</span>
                    </div>
                    <div className={`zone-status-bar ${z.status === "active" ? "zone-active" : "zone-inactive"}`}>
                      {z.status === "active" ? "🟢 نشطة" : "⚫ غير نشطة"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Tasks ── */}
        {tab === "tasks" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>مهام التوزيع</div>
              <button className="btn btn-primary" onClick={() => setShowTaskForm(v => !v)}>
                {showTaskForm ? "إلغاء ✕" : "+ مهمة جديدة"}
              </button>
            </div>

            {showTaskForm && (
              <form className="inline-form" onSubmit={createTask}>
                <div className="form-title">📋 إنشاء مهمة توزيع</div>
                <div className="form-row">
                  <select required className="form-input" value={taskForm.zoneId} onChange={e => setTaskForm(f => ({ ...f, zoneId: e.target.value }))}>
                    <option value="">اختر المنطقة</option>
                    {zones.filter(z => z.status === "active").map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <select className="form-input" value={taskForm.providerId} onChange={e => setTaskForm(f => ({ ...f, providerId: e.target.value }))}>
                    <option value="">اختر مزود الخدمة (اختياري)</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <input required className="form-input" type="number" placeholder="الكمية (لتر)" value={taskForm.quantityLiters} onChange={e => setTaskForm(f => ({ ...f, quantityLiters: e.target.value }))} />
                  <input required className="form-input" type="datetime-local" value={taskForm.scheduledAt} onChange={e => setTaskForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <input className="form-input" placeholder="ملاحظات (اختياري)" value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary">إنشاء المهمة</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowTaskForm(false)}>إلغاء</button>
                </div>
              </form>
            )}

            <div className="tasks-list">
              {myTasks.map(t => {
                const zone = zones.find(z => z.id === t.zoneId);
                const color = STATUS_COLORS[t.status] ?? "#94a3b8";
                return (
                  <div key={t.id} className="task-row">
                    <div className="task-row-status" style={{ background: color + "18", borderColor: color + "40" }}>
                      <div className="task-status-dot" style={{ background: color }} />
                      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{STATUS_LABELS[t.status] ?? t.status}</span>
                    </div>
                    <div className="task-row-info">
                      <div className="task-row-zone">🗺️ {zone?.name ?? t.zoneId}</div>
                      <div className="task-row-meta">
                        💧 {Number(t.quantityLiters).toLocaleString()} لتر
                        · 📅 {new Date(t.scheduledAt).toLocaleDateString("ar-SY")}
                        {t.notes && <span> · {t.notes}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Operations ── */}
        {tab === "ops" && (
          <>
            <div className="stat-grid">
              {[
                { label: "مهام مجدولة", val: tasks.filter(t => t.status === "pending").length, icon: "⏳", color: "#f59e0b" },
                { label: "مهام جارية", val: activeTasks.length, icon: "🔄", color: "#2563eb" },
                { label: "مهام مُنجزة", val: deliveredTasks.length, icon: "✅", color: "#10b981" },
                { label: "لترات موزعة", val: deliveredTasks.reduce((s, t) => s + Number(t.quantityLiters), 0).toLocaleString(), icon: "💧", color: "#0ea5e9" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="section-title">أداء المزودين</div>
            {providers.map(p => {
              const done = deliveredTasks.length;
              return (
                <div key={p.id} className="actor-card">
                  <div className="actor-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>🏢</div>
                  <div className="actor-info">
                    <div className="actor-name">{p.companyName}</div>
                    <div className="actor-meta">{done} توصيل مُنجز</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${Math.min(done * 30, 100)}%` }} /></div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>معدل الأداء</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
