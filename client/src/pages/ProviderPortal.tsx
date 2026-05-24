import { useState, useEffect } from "react";

type Driver = { id: string; vehicleType: string; status: string; driverType: string; phone: string; providerId: string };
type Task = { id: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string };
type Order = { id: string; status: string; quantityLiters: string; totalAmount: string };

const DEMO_PROVIDER_ID = "seed-p1";

const CONTRACTS = [
  {
    id: "c1",
    client: "منتجع ينابيع الصحراء",
    status: "active" as const,
    volumeLiters: 120000,
    value: 176000,
    from: "15/4/2025",
    to: "15/10/2025",
    notes: "توريد أسبوعي بكميات كبيرة. تحرير الضمان بعد كل رحلة.",
  },
  {
    id: "c2",
    client: "مزارع الوادي الأخضر",
    status: "active" as const,
    volumeLiters: 80000,
    value: 117500,
    from: "1/3/2025",
    to: "1/9/2025",
    notes: "توريد كل أسبوعين. جدولة مرنة.",
  },
  {
    id: "c3",
    client: "مجموعة سيتي مول",
    status: "review" as const,
    volumeLiters: 200000,
    value: 275000,
    from: "1/7/2025",
    to: "31/12/2025",
    notes: "حسب الطلب خلال 4 ساعات (SLA). تعرفة مميزة.",
  },
];

const PENDING_ACTIONS = [
  { id: "pa1", name: "شركة أكوا العالمية", amount: 460000 },
  { id: "pa2", name: "مجموعة سيتي مول", amount: 275000 },
  { id: "pa3", name: "مستشفى الواحة التخصصي", amount: 92000 },
];

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

function fmtAED(n: number) {
  return n.toLocaleString("ar-AE") + " د.إ.";
}

function fmtVol(n: number) {
  if (n >= 1000) return (n / 1000).toLocaleString("ar-AE") + " ألف لتر";
  return n.toLocaleString("ar-AE") + " لتر";
}

type ReviewContract = {
  id: string;
  contractNumber: string;
  clientName: string;
  valueAed: string;
  priority: string;
};

export default function ProviderPortal({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
      fetch("/api/orders").then(r => r.json()),
      fetch(`/api/contracts?providerId=${DEMO_PROVIDER_ID}`).then(r => r.json()),
    ]).then(([d, t, o, c]) => {
      setDrivers((d.data ?? []).filter((dr: Driver) => dr.providerId === DEMO_PROVIDER_ID));
      setTasks(t.data ?? []);
      setOrders(o.data ?? []);
      setReviewContracts((c.data ?? []).filter((ct: any) => ct.status === "review"));
    });
  }, []);

  const totalDrivers = Math.max(drivers.length, 5);
  const activeDrivers = drivers.filter(d => d.status === "active").length || 3;
  const availableDrivers = Math.max(totalDrivers - activeDrivers, 2);
  const activeTrips = tasks.filter(t => t.status === "in_progress").length || ACTIVE_DELIVERIES.length;
  const fleetPct = Math.round((activeDrivers / totalDrivers) * 100) || 60;

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh", padding: "28px 32px 48px" }}>
      {toast && <div className="action-toast">{toast}</div>}

      {/* ── Page Title ── */}
      <div style={{ marginBottom: reviewContracts.length > 0 ? 16 : 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#12384f", marginBottom: 4 }}>لوحة العمليات</h2>
        <p style={{ fontSize: 13, color: "#6b8aa0" }}>نظرة فورية على العقود والأسطول وعمليات التوصيل النشطة.</p>
      </div>

      {/* ── New Contract Alert Banner ── */}
      {reviewContracts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fcd34d", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef3c7", border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              📋
            </div>
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0284c7" }}>{Number(c.valueAed).toLocaleString("ar-AE")} د.إ.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.("contracts")}
            style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            مراجعة العقود ←
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {/* Card 1 - Active Contracts */}
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>العقود النشطة</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dff4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>2</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>3 بانتظار المراجعة</div>
          <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 600, marginTop: 4 }}>+٢ هذا الشهر</div>
        </div>

        {/* Card 2 - Revenue */}
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>إيرادات الأسطول</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💰</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>293,500 د.إ.</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>القيمة التعاقدية السنوية</div>
          <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 600, marginTop: 4 }}>+١٢.٥٪</div>
        </div>

        {/* Card 3 - Volume */}
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>الحجم الإجمالي</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💧</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>200 ألف لتر</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>ضمن العقود النشطة</div>
          <div style={{ display: "inline-block", background: "#ecfeff", color: "#0891b2", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, marginTop: 6 }}>ضمن المسار</div>
        </div>

        {/* Card 4 - Fleet Utilization */}
        <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b8aa0", fontWeight: 600 }}>استخدام الأسطول</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚛</div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#12384f", lineHeight: 1 }}>{fleetPct}%</div>
          <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 6 }}>{activeDrivers} من {totalDrivers} شاحنات نشطة</div>
          <div style={{ display: "inline-block", background: "#ecfeff", color: "#0891b2", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, marginTop: 6 }}>طبيعي</div>
        </div>
      </div>

      {/* ── Middle Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

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

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Fleet Status */}
          <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #d8eef8" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>حالة الأسطول</span>
            </div>
            <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "السائقون المتاحون", val: `${availableDrivers} / ${totalDrivers}`, color: "#0891b2", bg: "#ecfeff" },
                { label: "الشاحنات المتاحة", val: `${availableDrivers} / ${totalDrivers}`, color: "#0284c7", bg: "#dff4ff" },
                { label: "الرحلات النشطة", val: `${activeTrips} / ${totalDrivers}`, color: "#0ea5e9", bg: "#e0f7ff" },
                { label: "قيد الصيانة", val: `1 / ${totalDrivers}`, color: "#d97706", bg: "#fffbeb" },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, lineHeight: 1.3 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Actions */}
          <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, flex: 1 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #d8eef8" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>إجراءات معلّقة</span>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {PENDING_ACTIONS.map(action => (
                <div key={action.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fcff", borderRadius: 10, border: "1px solid #e8f5fd" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{action.name}</div>
                    <div style={{ fontSize: 11, color: "#0284c7", fontWeight: 600 }}>{fmtAED(action.amount)}</div>
                  </div>
                  <button
                    style={{ background: "#0ea5e9", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    onClick={() => showToast(`مراجعة ${action.name}`)}
                  >
                    مراجعة
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Contracts ── */}
      <div style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #d8eef8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#12384f" }}>العقود الأخيرة</span>
          <button
            style={{ background: "none", border: "none", color: "#0284c7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            onClick={() => showToast("قريباً — صفحة جميع العقود")}
          >
            عرض الكل ←
          </button>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {CONTRACTS.map(contract => (
            <div
              key={contract.id}
              style={{ border: "1px solid #d8eef8", borderRadius: 12, padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>{contract.client}</span>
                <span style={{
                  background: contract.status === "active" ? "#ecfeff" : "#fef3c7",
                  color: contract.status === "active" ? "#0891b2" : "#d97706",
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20
                }}>
                  {contract.status === "active" ? "نشط" : "قيد المراجعة"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "#f8fcff", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>الحجم</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{fmtVol(contract.volumeLiters)}</div>
                </div>
                <div style={{ background: "#f8fcff", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>القيمة</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>{fmtAED(contract.value)}</div>
                </div>
              </div>

              <div style={{ background: "#f8fcff", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>الفترة</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#31576b" }}>{contract.from} - {contract.to}</div>
              </div>

              <div style={{ fontSize: 11, color: "#6b8aa0", lineHeight: 1.6, borderTop: "1px solid #e8f5fd", paddingTop: 8 }}>
                {contract.notes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
