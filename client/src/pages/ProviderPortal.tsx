import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Driver = { id: string; vehicleType: string; status: string; driverType: string; phone: string; providerId: string };
type Task = { id: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string };

const DEMO_PROVIDER_ID = "seed-p1";

const ACTIVE_DELIVERIES = [
  {
    id: "trp-001",
    volumeK: 12,
    from: "مركز توزيع القوز",
    to: "منتجع ينابيع الصحراء، نخلة جميرا",
    driver: "أحمد حسن",
    truck: "د-44291",
    progress: 46,
  },
  {
    id: "trp-002",
    volumeK: 10,
    from: "محطة خزان العين",
    to: "مزارع الوادي الأخضر، العين",
    driver: "خالد الرشيد",
    truck: "د-11283",
    progress: 39,
  },
];

function fmtILS(n: number) {
  return n.toLocaleString("ar-AE") + " ₪";
}

type ReviewContract = {
  id: string;
  contractNumber: string;
  clientName: string;
  valueAed: string;
  priority: string;
};

export default function ProviderPortal() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [reviewContracts, setReviewContracts] = useState<ReviewContract[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/drivers").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch(`/api/contracts?providerId=${DEMO_PROVIDER_ID}`).then(r => r.json()),
    ]).then(([d, t, c]) => {
      setDrivers((d.data ?? []).filter((dr: Driver) => dr.providerId === DEMO_PROVIDER_ID));
      setTasks(t.data ?? []);
      setReviewContracts((c.data ?? []).filter((ct: any) => ct.status === "review"));
    });
  }, []);

  const totalDrivers = Math.max(drivers.length, 5);
  const activeDrivers = drivers.filter(d => d.status === "active").length || 3;
  const activeTrips = tasks.filter(t => t.status === "in_progress").length || ACTIVE_DELIVERIES.length;

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh", padding: "28px 32px 48px" }}>
      {toast && <div className="action-toast">{toast}</div>}

      {/* ── Page Title ── */}
      <div style={{ marginBottom: reviewContracts.length > 0 ? 16 : 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#12384f", marginBottom: 4 }}>لوحة العمليات</h2>
        <p style={{ fontSize: 13, color: "#6b8aa0" }}>نظرة فورية على العقود وعمليات التوصيل النشطة.</p>
      </div>

      {/* ── New Contract Alert Banner ── */}
      {reviewContracts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fcd34d", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#92400e" }}>
                  {reviewContracts.length === 1 ? "عقد جديد بانتظار موافقتك" : `${reviewContracts.length} عقود بانتظار موافقتك`}
                </span>
                <span style={{ background: "#f59e0b", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                  {reviewContracts.length} جديد
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {reviewContracts.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #fcd34d", borderRadius: 8, padding: "5px 11px" }}>
                    {c.priority === "vip" && <span style={{ background: "#0ea5e9", color: "white", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>VIP</span>}
                    {c.priority === "high" && <span style={{ background: "#f59e0b", color: "white", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>أولوية</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{c.clientName}</span>
                    <span style={{ fontSize: 11, color: "#6b8aa0" }}>—</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0284c7" }}>{fmtILS(Number(c.valueAed))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/provider/contracts")}
            style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            مراجعة العقود ←
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>العقود النشطة</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>2</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>3 بانتظار المراجعة</div>
          <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 600, marginTop: 4 }}>+٢ هذا الشهر</div>
        </div>

        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>الإيرادات</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>{fmtILS(293500)}</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>القيمة التعاقدية السنوية</div>
          <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 600, marginTop: 4 }}>+١٢.٥٪</div>
        </div>

        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>الحجم الإجمالي</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>200 ألف لتر</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>ضمن العقود النشطة</div>
          <div style={{ display: "inline-block", background: "#ecfeff", color: "#0891b2", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, marginTop: 6 }}>ضمن المسار</div>
        </div>

        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>السائقون النشطون</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>{activeDrivers}</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>من أصل {totalDrivers} سائقين</div>
          <div style={{ display: "inline-block", background: "#ecfeff", color: "#0891b2", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, marginTop: 6 }}>{activeTrips} توصيلات نشطة</div>
        </div>
      </div>

      {/* ── Middle Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>

        {/* Left - Active Deliveries */}
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #d8eef8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#12384f" }}>التوصيلات النشطة</span>
            <button
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#dff4ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              onClick={() => showToast("افتح تبويب الخريطة الحية من القائمة")}
            >
              🗺️ الخريطة الحية
            </button>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {ACTIVE_DELIVERIES.map(trip => (
              <div key={trip.id} style={{ border: "1px solid #e8f5fd", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: "#0ea5e9", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>قيد النقل</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{trip.id}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>{trip.volumeK} ألف لتر</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#6b8aa0", marginBottom: 2 }}>من</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#12384f" }}>{trip.from}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", color: "#bae6fd", fontSize: 16 }}>←</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#6b8aa0", marginBottom: 2 }}>إلى</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#12384f" }}>{trip.to}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, marginBottom: 12, fontSize: 12, color: "#6b8aa0" }}>
                  <span>السائق: <strong style={{ color: "#12384f" }}>{trip.driver}</strong></span>
                  <span>الشاحنة: <strong style={{ color: "#12384f" }}>{trip.truck}</strong></span>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b8aa0", marginBottom: 5 }}>
                    <span>تقدّم المسار</span>
                    <span style={{ fontWeight: 700, color: "#0284c7" }}>{trip.progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#e0f7ff", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${trip.progress}%`, background: "linear-gradient(90deg, #0284c7, #0ea5e9)", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
