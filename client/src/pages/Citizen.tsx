import { useEffect, useState } from "react";
import { api, type Zone, type Provider, type Task, type Order } from "../api";

type SignalState = "idle" | "sending" | "sent";
type OrderStep = "idle" | "form" | "confirming" | "done";

const taskStatusLabel: Record<string, { ar: string; cls: string; icon: string }> = {
  pending:     { ar: "مجدول",    cls: "badge-yellow", icon: "" },
  in_progress: { ar: "جارٍ الآن", cls: "badge-blue",   icon: "" },
  delivered:   { ar: "تم التوصيل", cls: "badge-green",  icon: "" },
  cancelled:   { ar: "ملغى",     cls: "badge-red",    icon: "" },
};

const orderStatusLabel: Record<string, { ar: string; cls: string; icon: string }> = {
  pending:    { ar: "قيد الانتظار", cls: "badge-yellow", icon: "" },
  dispatched: { ar: "في الطريق",   cls: "badge-blue",   icon: "" },
  delivered:  { ar: "تم التوصيل", cls: "badge-green",  icon: "" },
  cancelled:  { ar: "ملغى",        cls: "badge-red",    icon: "" },
};

const DEMO_CITIZEN_ID = "seed-c1";

export default function Citizen() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [schedule, setSchedule] = useState<Task[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [signalState, setSignalState] = useState<SignalState>("idle");
  const [signalCount, setSignalCount] = useState(0);
  const [orderStep, setOrderStep] = useState<OrderStep>("idle");
  const [orderForm, setOrderForm] = useState({ providerId: "", quantityLiters: "500", note: "" });
  const [tab, setTab] = useState<"schedule" | "orders">("schedule");

  useEffect(() => {
    Promise.all([
      api.get<{ data: Zone[] }>("/citizen/zones"),
      api.get<{ data: Provider[] }>("/citizen/providers"),
      api.get<{ data: Order[] }>(`/citizen/${DEMO_CITIZEN_ID}/orders`),
    ]).then(([z, p, o]) => {
      setZones(z.data);
      setProviders(p.data);
      setMyOrders(o.data);
      if (z.data.length > 0) {
        setSelectedZone(z.data[0]);
        setSignalCount(z.data[0].signalCount);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedZone) return;
    setLoadingSchedule(true);
    setSignalCount(selectedZone.signalCount);
    api.get<{ data: Task[] }>(`/citizen/zones/${selectedZone.id}/schedule`).then(r => {
      setSchedule(r.data);
      setLoadingSchedule(false);
    });
  }, [selectedZone]);

  const handleSendSignal = async () => {
    if (!selectedZone || signalState !== "idle") return;
    setSignalState("sending");
    await api.post("/citizen/signals", { citizenId: DEMO_CITIZEN_ID, zoneId: selectedZone.id });
    setSignalCount(c => c + 1);
    setSignalState("sent");
    setTimeout(() => setSignalState("idle"), 4000);
  };

  const pricePerLiter = (pId: string) => {
    const p = providers.find(x => x.id === pId);
    return p ? 0.05 : 0.05;
  };

  const calcTotal = () => (Number(orderForm.quantityLiters) * pricePerLiter(orderForm.providerId)).toFixed(2);

  const handlePlaceOrder = async () => {
    setOrderStep("confirming");
    const order = await api.post<Order>("/citizen/orders", {
      citizenId: DEMO_CITIZEN_ID,
      providerId: orderForm.providerId,
      quantityLiters: Number(orderForm.quantityLiters),
      totalAmount: calcTotal(),
    });
    setMyOrders(prev => [order, ...prev]);
    setOrderStep("done");
    setTab("orders");
    setTimeout(() => setOrderStep("idle"), 500);
  };

  const nextDelivery = schedule.find(t => t.status === "pending" || t.status === "in_progress");

  return (
    <div className="citizen-page" dir="rtl">

      {/* ── Zone Selector Hero ─────────────────────────── */}
      <div className="citizen-hero">
        <div className="citizen-hero-inner">
          <div className="citizen-hero-label"> منطقتك</div>
          <div className="zone-selector-wrap">
            <select
              className="zone-selector"
              value={selectedZone?.id ?? ""}
              onChange={e => {
                const z = zones.find(z => z.id === e.target.value);
                if (z) { setSelectedZone(z); setSignalState("idle"); }
              }}
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          {selectedZone && (
            <div className="citizen-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-val">{selectedZone.populationEstimate?.toLocaleString() ?? "—"}</span>
                <span className="hero-stat-label">ساكن في المنطقة</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val" style={{ color: signalCount > 50 ? "#ef4444" : signalCount > 25 ? "#f59e0b" : "#14b8a6" }}>
                  {signalCount}
                </span>
                <span className="hero-stat-label">إشارة احتياج نشطة</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">
                  {selectedZone.lastDeliveryAt
                    ? new Date(selectedZone.lastDeliveryAt).toLocaleDateString("ar-SY")
                    : "لم يتم بعد"}
                </span>
                <span className="hero-stat-label">آخر توزيع</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="citizen-body">

        {/* ── Next Delivery Banner ───────────────────────── */}
        {nextDelivery && (
          <div className={`next-delivery-banner ${nextDelivery.status === "in_progress" ? "banner-live" : "banner-upcoming"}`}>
            <div className="banner-icon">{nextDelivery.status === "in_progress" ? "" : ""}</div>
            <div className="banner-text">
              <div className="banner-title">
                {nextDelivery.status === "in_progress" ? "التوزيع جارٍ الآن!" : "التوزيع القادم"}
              </div>
              <div className="banner-sub">
                {Number(nextDelivery.quantityLiters).toLocaleString()} لتر ·{" "}
                {new Date(nextDelivery.scheduledAt).toLocaleDateString("ar-SY", { weekday: "long", day: "numeric", month: "long" })}
                {" الساعة "}
                {new Date(nextDelivery.scheduledAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            {nextDelivery.status === "in_progress" && (
              <span className="live-pill"> مباشر</span>
            )}
          </div>
        )}

        {/* ── Action Cards ───────────────────────────────── */}
        <div className="action-cards">
          {/* Signal Card */}
          <div className="action-card action-card-signal">
            <div className="action-card-icon"></div>
            <div className="action-card-content">
              <h3>إشارة احتياج مياه</h3>
              <p>اضغط لتُعلم منظمة الإغاثة بحاجتك العاجلة للمياه. كلما زادت الإشارات، زادت أولوية منطقتك.</p>
              {signalState === "sent" && (
                <div className="signal-success"> تم إرسال إشارتك! شكراً لك.</div>
              )}
            </div>
            <button
              className={`action-btn ${signalState === "sent" ? "btn-sent" : "btn-signal"}`}
              onClick={handleSendSignal}
              disabled={signalState !== "idle"}
            >
              {signalState === "sending" ? "جارٍ الإرسال…" : signalState === "sent" ? " أُرسلت" : " أرسل إشارة"}
            </button>
          </div>

          {/* Order Card */}
          <div className="action-card action-card-order">
            <div className="action-card-icon"></div>
            <div className="action-card-content">
              <h3>طلب شراء مياه</h3>
              <p>اطلب توصيل مياه مباشرة من أحد مزودي الخدمة المعتمدين في منطقتك.</p>
            </div>
            <button
              className="action-btn btn-order"
              onClick={() => { setOrderStep("form"); setOrderForm(f => ({ ...f, providerId: providers[0]?.id ?? "" })); }}
            >
               اطلب الآن
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="citizen-tabs">
          <button className={`ctab ${tab === "schedule" ? "ctab-active" : ""}`} onClick={() => setTab("schedule")}>
             جدول التوزيع
          </button>
          <button className={`ctab ${tab === "orders" ? "ctab-active" : ""}`} onClick={() => setTab("orders")}>
             طلباتي
            {myOrders.filter(o => o.status === "pending" || o.status === "dispatched").length > 0 && (
              <span className="tab-badge">{myOrders.filter(o => o.status === "pending" || o.status === "dispatched").length}</span>
            )}
          </button>
        </div>

        {/* ── Schedule Tab ───────────────────────────────── */}
        {tab === "schedule" && (
          <div className="citizen-card">
            <div className="citizen-card-header">
              <span> جدول توزيع المياه</span>
              <span style={{ fontSize: 12, color: "#8eb5c8" }}>{selectedZone?.name}</span>
            </div>
            {loadingSchedule ? (
              <div className="loading"><div className="spinner" /></div>
            ) : schedule.length === 0 ? (
              <div className="empty" style={{ direction: "rtl" }}>
                <div className="empty-icon"></div>
                <p>لا توجد مهام توزيع مجدولة لهذه المنطقة حالياً</p>
              </div>
            ) : (
              <div className="schedule-list">
                {schedule.map(t => {
                  const st = taskStatusLabel[t.status] ?? { ar: t.status, cls: "badge-gray", icon: "" };
                  const date = new Date(t.scheduledAt);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={t.id} className={`schedule-item ${t.status === "in_progress" ? "schedule-item-live" : ""}`}>
                      <div className="schedule-date-col">
                        <div className="schedule-month">{date.toLocaleDateString("ar-SY", { month: "short" })}</div>
                        <div className="schedule-day">{date.getDate()}</div>
                        {isToday && <div className="schedule-today">اليوم</div>}
                      </div>
                      <div className="schedule-info">
                        <div className="schedule-title">
                          {st.icon} توزيع مياه — {Number(t.quantityLiters).toLocaleString()} لتر
                        </div>
                        <div className="schedule-time">
                          {date.toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                          {t.notes && <span className="schedule-note"> · {t.notes}</span>}
                        </div>
                      </div>
                      <span className={`badge ${st.cls}`}>{st.ar}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ─────────────────────────────────── */}
        {tab === "orders" && (
          <div className="citizen-card">
            <div className="citizen-card-header">
              <span> طلباتي</span>
              <span style={{ fontSize: 12, color: "#8eb5c8" }}>{myOrders.length} طلب</span>
            </div>
            {myOrders.length === 0 ? (
              <div className="empty" style={{ direction: "rtl" }}>
                <div className="empty-icon"></div>
                <p>لم تقم بأي طلبات بعد</p>
              </div>
            ) : (
              <div className="schedule-list">
                {myOrders.map(o => {
                  const st = orderStatusLabel[o.status] ?? { ar: o.status, cls: "badge-gray", icon: "" };
                  const prov = providers.find(p => p.id === o.providerId);
                  return (
                    <div key={o.id} className="schedule-item">
                      <div className="schedule-date-col">
                        <div className="schedule-month">{new Date(o.createdAt).toLocaleDateString("ar-SY", { month: "short" })}</div>
                        <div className="schedule-day">{new Date(o.createdAt).getDate()}</div>
                      </div>
                      <div className="schedule-info">
                        <div className="schedule-title">
                           {Number(o.quantityLiters).toLocaleString()} لتر من {prov?.companyName ?? "مزود"}
                        </div>
                        <div className="schedule-time">
                          المبلغ: <strong style={{ color: "#14b8a6" }}>${o.totalAmount}</strong>
                        </div>
                      </div>
                      <span className={`badge ${st.cls}`}>{st.ar}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Order Modal ─────────────────────────────────── */}
      {(orderStep === "form" || orderStep === "confirming") && (
        <div className="modal-backdrop" onClick={() => orderStep === "form" && setOrderStep("idle")}>
          <div className="modal citizen-modal" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3> طلب توصيل مياه</h3>

            <div className="form-group">
              <label className="form-label">المزود</label>
              <select className="form-control" value={orderForm.providerId}
                onChange={e => setOrderForm(f => ({ ...f, providerId: e.target.value }))}>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">الكمية (لتر)</label>
              <div className="qty-buttons">
                {[250, 500, 1000, 2000].map(q => (
                  <button key={q}
                    className={`qty-btn ${orderForm.quantityLiters === String(q) ? "qty-btn-active" : ""}`}
                    onClick={() => setOrderForm(f => ({ ...f, quantityLiters: String(q) }))}>
                    {q.toLocaleString()} L
                  </button>
                ))}
              </div>
              <input className="form-control" type="number" style={{ marginTop: 8 }}
                value={orderForm.quantityLiters}
                onChange={e => setOrderForm(f => ({ ...f, quantityLiters: e.target.value }))}
                placeholder="أو أدخل كمية مخصصة" />
            </div>

            <div className="order-summary">
              <div className="order-summary-row">
                <span>الكمية</span>
                <span>{Number(orderForm.quantityLiters).toLocaleString()} لتر</span>
              </div>
              <div className="order-summary-row">
                <span>السعر</span>
                <span>$0.05 / لتر</span>
              </div>
              <div className="order-summary-row order-summary-total">
                <span>المجموع</span>
                <span style={{ color: "#14b8a6", fontSize: 20, fontWeight: 700 }}>${calcTotal()}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setOrderStep("idle")}>إلغاء</button>
              <button className="btn btn-primary" onClick={handlePlaceOrder}
                disabled={!orderForm.providerId || !orderForm.quantityLiters || orderStep === "confirming"}>
                {orderStep === "confirming" ? "جارٍ التأكيد…" : " تأكيد الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
