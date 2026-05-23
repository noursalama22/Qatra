import { useState, useEffect } from "react";

type Task = { id: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string; notes: string | null };
type Zone = { id: string; name: string; populationEstimate: number; lastDeliveryAt: string | null };

const DEMO_DRIVER_ID = "seed-d1";
const STATUS_LABELS: Record<string, string> = { pending: "مجدولة", in_progress: "جارية الآن", delivered: "مُنجزة", cancelled: "ملغاة" };
const STATUS_COLORS: Record<string, string> = { pending: "#f59e0b", in_progress: "#2563eb", delivered: "#10b981", cancelled: "#94a3b8" };

type ProofState = { taskId: string; step: "idle" | "photo" | "done" };

export default function DriverPortal() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofState>({ taskId: "", step: "idle" });
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "delivered">("all");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    const [t, z] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/zones").then(r => r.json()),
    ]);
    setTasks(t.data ?? []);
    setZones(z.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const startTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress" }) });
    showToast("🚛 بدأت رحلة التوصيل — GPS نشط");
    load();
  };

  const startProof = (taskId: string) => setProof({ taskId, step: "photo" });

  const submitProof = async () => {
    setProof(p => ({ ...p, step: "done" }));
    await new Promise(r => setTimeout(r, 1500));
    await fetch(`/api/tasks/${proof.taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "delivered" }) });
    setProof({ taskId: "", step: "idle" });
    showToast("✅ تم تسليم المياه بنجاح وإغلاق المهمة");
    load();
  };

  const filtered = tasks.filter(t => filter === "all" ? t.status !== "cancelled" : t.status === filter);
  const inProgressTask = tasks.find(t => t.status === "in_progress");
  const totalDelivered = tasks.filter(t => t.status === "delivered").reduce((s, t) => s + Number(t.quantityLiters), 0);

  return (
    <div className="portal driver-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      {/* Proof Modal */}
      {proof.step !== "idle" && (
        <div className="modal-overlay">
          <div className="modal proof-modal" dir="rtl">
            <div className="proof-modal-icon">📸</div>
            {proof.step === "photo" && (
              <>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>التقاط دليل التسليم</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>الصورة مطلوبة قبل إغلاق المهمة</div>
                <div className="proof-camera-preview">
                  <div className="camera-frame">
                    <div className="camera-corner tl" /><div className="camera-corner tr" />
                    <div className="camera-corner bl" /><div className="camera-corner br" />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>موقع GPS مؤكد</div>
                      <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>36.244°N · 37.175°E</div>
                    </div>
                  </div>
                </div>
                <div className="proof-buttons">
                  <button className="btn btn-primary proof-capture-btn" onClick={submitProof}>📸 التقاط الصورة وإغلاق المهمة</button>
                  <button className="btn btn-outline" onClick={() => setProof({ taskId: "", step: "idle" })}>إلغاء</button>
                </div>
              </>
            )}
            {proof.step === "done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>جارٍ رفع الدليل...</div>
                <div className="uploading-bar"><div className="uploading-fill" /></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="portal-header" style={{ background: "linear-gradient(135deg,#1c1917,#44403c)" }}>
        <div className="portal-header-inner">
          <div className="portal-role-badge">🚚 السائق</div>
          <h2 className="portal-title">Bilal Yusuf</h2>
          <p className="portal-subtitle">Water Tanker 5000L · سائق تابع</p>
        </div>
        <div className="portal-header-stats">
          <div className="ph-stat"><span className="ph-val">{tasks.filter(t => t.status === "pending").length}</span><span className="ph-lbl">مهام معلقة</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{tasks.filter(t => t.status === "in_progress").length}</span><span className="ph-lbl">جارية</span></div>
          <div className="ph-divider" />
          <div className="ph-stat"><span className="ph-val">{(totalDelivered / 1000).toFixed(1)}k</span><span className="ph-lbl">لتر سُلِّم</span></div>
        </div>
      </div>

      <div className="portal-body">

        {/* Active Task Alert */}
        {inProgressTask && (
          <div className="active-task-alert">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 32 }}>🚛</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>مهمة جارية الآن</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {zones.find(z => z.id === inProgressTask.zoneId)?.name} · {Number(inProgressTask.quantityLiters).toLocaleString()} لتر
                </div>
                <div style={{ fontSize: 12, color: "#2563eb", marginTop: 2 }}>🛰 GPS نشط · يتم تتبع موقعك في الوقت الحقيقي</div>
              </div>
            </div>
            <button className="btn btn-proof" onClick={() => startProof(inProgressTask.id)}>
              📸 تسليم + دليل
            </button>
          </div>
        )}

        {/* Task lifecycle explanation */}
        <div className="lifecycle-bar">
          {[{ s: "pending", l: "مجدولة" }, { s: "in_progress", l: "جارية" }, { s: "delivered", l: "مُنجزة" }].map((step, i, arr) => (
            <div key={step.s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div className={`lc-step ${inProgressTask?.status === step.s || (!inProgressTask && step.s === "delivered") ? "lc-active" : ""}`}>
                <div className="lc-dot" style={{ background: STATUS_COLORS[step.s] }} />
                <span>{step.l}</span>
              </div>
              {i < arr.length - 1 && <div className="lc-arrow">←</div>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="task-filters">
          {(["all", "pending", "in_progress", "delivered"] as const).map(f => (
            <button key={f} className={`filter-pill ${filter === f ? "filter-pill-active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "الكل" : STATUS_LABELS[f]}
              <span className="filter-count">{f === "all" ? tasks.filter(t => t.status !== "cancelled").length : tasks.filter(t => t.status === f).length}</span>
            </button>
          ))}
        </div>

        {/* Tasks */}
        <div className="driver-tasks">
          {filtered.map(t => {
            const zone = zones.find(z => z.id === t.zoneId);
            const color = STATUS_COLORS[t.status] ?? "#94a3b8";
            const isActive = t.status === "in_progress";
            const isPending = t.status === "pending";
            return (
              <div key={t.id} className={`driver-task-card ${isActive ? "driver-task-active" : ""}`}>
                <div className="driver-task-header">
                  <div className="driver-task-zone">🗺️ {zone?.name ?? t.zoneId}</div>
                  <div className="driver-task-status" style={{ background: color + "18", color }}>
                    {STATUS_LABELS[t.status]}
                  </div>
                </div>
                <div className="driver-task-details">
                  <div className="driver-task-detail"><span>💧 الكمية</span><strong>{Number(t.quantityLiters).toLocaleString()} لتر</strong></div>
                  <div className="driver-task-detail"><span>📅 الموعد</span><strong>{new Date(t.scheduledAt).toLocaleDateString("ar-SY")}</strong></div>
                  {zone && <div className="driver-task-detail"><span>👥 السكان</span><strong>{(zone.populationEstimate ?? 0).toLocaleString()}</strong></div>}
                  {t.notes && <div className="driver-task-detail"><span>📝 ملاحظات</span><strong>{t.notes}</strong></div>}
                </div>
                <div className="driver-task-footer">
                  {isPending && <button className="btn btn-start" onClick={() => startTask(t.id)}>🚛 بدء التوصيل</button>}
                  {isActive && <button className="btn btn-proof" onClick={() => startProof(t.id)}>📸 تسليم + التقاط دليل</button>}
                  {t.status === "delivered" && <div className="delivered-badge">✅ مُنجزة — الدليل مرفوع</div>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty-state">لا توجد مهام في هذه الفئة</div>}
        </div>
      </div>
    </div>
  );
}
