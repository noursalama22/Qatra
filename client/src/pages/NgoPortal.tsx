import { useState, useEffect, useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import NgoContractsTab from "../components/ngo/NgoContractsTab";
import NgoReportsTab from "../components/ngo/NgoReportsTab";
import Dashboard from "./Dashboard";
import NgoTasksPage from "./NgoTasksPage";
import { isNgoSection } from "../routes";
import { useAppContext } from "../components/RequireRole";

type Zone = {
  id: string; name: string; status: string; populationEstimate: number;
  signalCount: number; lastDeliveryAt: string | null; description: string;
};
type Task = {
  id: string; ngoId: string; zoneId: string; status: string;
  quantityLiters: string; scheduledAt: string; notes: string | null;
  assignedProviderIds: string[];
};

const PIPELINE_STEPS = [
  { key: "pending", label: "بانتظار الموافقة", icon: "", color: "#f59e0b" },
  { key: "assigned", label: "تم التعيين", icon: "", color: "#0ea5e9" },
  { key: "in_progress", label: "جارٍ التوصيل", icon: "", color: "#0284c7" },
  { key: "arrived", label: "وصل الموقع", icon: "", color: "#0ea5e9" },
  { key: "delivered", label: "اكتمل التوزيع", icon: "", color: "#14b8a6" },
];
const MOCK_DRIVERS = ["أحمد — شاحنة 4022", "محمود — شاحنة 1887", "خالد — شاحنة 3301", "يوسف — شاحنة 2044"];

export default function NgoPortal() {
  const { user } = useAppContext();
  const ngoId = (user.profile?.id as string | undefined) ?? "";
  const orgName = (user.profile?.orgName as string | undefined) ?? "المنظمة الإنسانية";

  const { section } = useParams<{ section: string }>();
  const tab = isNgoSection(section) ? section : "dashboard";
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [wallet, setWallet] = useState({ available: 10000, escrow: 0 });
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    if (!ngoId) return;
    const [z, t, w] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch(`/api/ngos/${ngoId}/wallet`).then(r => r.json()),
    ]);
    setZones(z.data ?? []);
    setTasks(t.data ?? []);
    setWallet({ available: w.available ?? 0, escrow: w.escrow ?? 0 });
  }, [ngoId]);

  useEffect(() => { load(); }, [load]);

  const approveDelivery = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}/approve`, { method: "PATCH" });
    await load();
    showToast("تم الاعتماد — حُوِّل المبلغ لمحفظة المزود وصدر تقرير رسمي");
  };

  const totalSignals = zones.reduce((s, z) => s + (z.signalCount ?? 0), 0);
  const activeTasks = tasks.filter(t => t.status === "in_progress" || t.status === "pending");
  const deliveredTasks = tasks.filter(t => t.status === "delivered" && !/approvedAt:/.test(t.notes ?? ""));

  if (!isNgoSection(section)) {
    return <Navigate to="/ngo/dashboard" replace />;
  }

  return (
    <div className="portal ngo-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      <div className="ngo-header">
        <div className="ngo-header-left">
          <div className="portal-role-badge">المنظمة الإنسانية</div>
          <h2 className="portal-title">{orgName}</h2>
          <p className="portal-subtitle">جدولة التوزيع · منع التضارب · ضمان العدالة</p>
        </div>
        <div className="ngo-wallet">
          <div className="wallet-block">
            <span className="wallet-label">المحفظة المتاحة</span>
            <span className="wallet-amount">${wallet.available.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">حساب الضمان</span>
            <span className="wallet-amount" style={{ color: "#fcd34d" }}>${wallet.escrow.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">إشارات احتياج</span>
            <span className="wallet-amount" style={{ color: "#fca5a5" }}>{totalSignals.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {tab === "dashboard" && (
        <Dashboard onToast={showToast} wallet={wallet} setWallet={setWallet} ngoId={ngoId} />
      )}

      {tab === "tasks" && <NgoTasksPage ngoId={ngoId} />}

      {tab === "pipeline" && (
        <div style={{ padding: "20px 24px" }}>
          <div className="section-title">المسار النشط — تتبع المهام لحظياً</div>
          {activeTasks.length === 0
            ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 8 }}></div><div>لا توجد مهام نشطة حالياً</div><div style={{ fontSize: 12, color: "#8eb5c8", marginTop: 4 }}>ابدأ بالجدولة من تبويب &quot;جدولة التوزيع&quot;</div></div>
            : activeTasks.map((task, ti) => {
              const zone = zones.find(z => z.id === task.zoneId);
              const stepIdx = Math.max(0, PIPELINE_STEPS.findIndex(s => s.key === task.status));
              const driver = MOCK_DRIVERS[ti % MOCK_DRIVERS.length];
              const cost = Number(task.quantityLiters) * 0.045;
              return (
                <div key={task.id} className="pipeline-card">
                  <div className="pipeline-card-header">
                    <div>
                      <div className="pipeline-zone">{zone?.name ?? task.zoneId}</div>
                      <div className="pipeline-meta">
                        {Number(task.quantityLiters).toLocaleString()} لتر
                        · {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                        {stepIdx >= 1 && <span style={{ color: "#0ea5e9" }}> · {driver}</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#0891b2" }}>${cost.toLocaleString()}</div>
                  </div>
                  <div className="pipeline-stepper">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const done = idx < stepIdx; const cur = idx === stepIdx;
                      return (
                        <div key={step.key} className="stepper-step">
                          <div className={`stepper-dot ${done ? "dot-done" : cur ? "dot-current" : "dot-future"}`}
                            style={cur ? { background: step.color, borderColor: step.color } : done ? { background: "#14b8a6", borderColor: "#14b8a6" } : {}}>
                            {done ? "✓" : cur ? step.icon : <span style={{ fontSize: 10 }}>{idx + 1}</span>}
                          </div>
                          <div className="stepper-label" style={cur ? { color: step.color, fontWeight: 700 } : done ? { color: "#14b8a6" } : {}}>
                            {step.label}
                          </div>
                          {idx < PIPELINE_STEPS.length - 1 && <div className={`stepper-line ${done ? "line-done" : ""}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pipeline-status-msg" style={{ borderColor: PIPELINE_STEPS[stepIdx].color + "44", background: PIPELINE_STEPS[stepIdx].color + "0d" }}>
                    <span style={{ color: PIPELINE_STEPS[stepIdx].color }}>
                      {stepIdx === 0 && "بانتظار قبول شركة المياه للعقد..."}
                      {stepIdx === 1 && `تم القبول — تم تعيين السائق: ${driver}`}
                      {stepIdx === 2 && `السائق ${driver} في الطريق إلى ${zone?.name}...`}
                      {stepIdx === 3 && "الشاحنة وصلت — جارٍ توزيع المياه على الأهالي..."}
                      {stepIdx === 4 && "اكتمل التوزيع — انتقل لتبويب التوثيق للإغلاق"}
                    </span>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {tab === "verify" && (
        <div style={{ padding: "20px 24px" }}>
          <div className="section-title">التوثيق والإغلاق المالي</div>
          {deliveredTasks.length === 0
            ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 8 }}></div><div>لا توجد مهام مكتملة بعد</div></div>
            : deliveredTasks.map(task => {
              const zone = zones.find(z => z.id === task.zoneId);
              const cost = Number(task.quantityLiters) * 0.045;
              return (
                <div key={task.id} className="verify-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#12384f" }}>{zone?.name ?? task.zoneId}</div>
                      <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 3 }}>
                        {Number(task.quantityLiters).toLocaleString()} لتر · {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                      </div>
                    </div>
                    <span style={{ background: "#ecfeff", color: "#0891b2", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>مكتمل</span>
                  </div>
                  <div className="verify-proof-row">
                    {([["", "صورة التوثيق", "مرفوعة من الميدان", "#12384f"], ["", "الطابع الزمني", new Date(task.scheduledAt).toLocaleString("ar-SY"), "#12384f"], ["", "مطابقة الموقع", "✓ داخل حدود المنطقة", "#14b8a6"]] as const).map(([icon, lbl, val, col]) => (
                      <div key={lbl} className="proof-item">
                        <div className="proof-icon">{icon}</div>
                        <div><div style={{ fontWeight: 600, fontSize: 12 }}>{lbl}</div><div style={{ fontSize: 11, color: col }}>{val}</div></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #eef8fd" }}>
                    <div><span style={{ fontSize: 12, color: "#6b8aa0" }}>التكلفة الإجمالية: </span><span style={{ fontWeight: 700, color: "#12384f" }}>${cost.toFixed(0)}</span></div>
                    <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => approveDelivery(task)}>
                      اعتماد وإغلاق نهائي
                    </button>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {tab === "contracts" && <NgoContractsTab onToast={showToast} ngoId={ngoId} />}

      {tab === "reports" && <NgoReportsTab onToast={showToast} ngoId={ngoId} />}
    </div>
  );
}
