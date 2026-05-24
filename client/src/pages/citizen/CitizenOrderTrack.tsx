import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Order } from "../../api";
import { useCitizenContext } from "../../contexts/CitizenContext";
import { calcOrderPricing, paymentMethodLabel } from "../../constants/citizenOrder";

type Step = {
  id: string;
  title: string;
  sub?: string;
  time?: string;
  state: "done" | "active" | "pending";
  icon: string;
};

export default function CitizenOrderTrack() {
  const { orderId } = useParams<{ orderId: string }>();
  const { myOrders, providers, refreshOrders } = useCitizenContext();
  const [order, setOrder] = useState<Order | null>(() => myOrders.find(o => o.id === orderId) ?? null);

  useEffect(() => {
    const cached = myOrders.find(o => o.id === orderId);
    if (cached) setOrder(cached);
    if (!orderId) return;
    api.get<Order>(`/citizen/orders/${orderId}`)
      .then(setOrder)
      .catch(() => undefined);
  }, [orderId, myOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders().catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  const provider = providers.find(p => p.id === order?.providerId);

  const steps: Step[] = useMemo(() => {
    if (!order) return [];
    const created = new Date(order.createdAt);
    const base = [
      { id: "placed", title: "تم تقديم الطلب", icon: "✓", state: "done" as const },
      { id: "confirmed", title: "تم التأكيد", icon: "✓", state: "done" as const },
      { id: "dispatch", title: "خرج للتوصيل", icon: "🚚", state: "pending" as const, sub: "يتحرك الآن" },
      { id: "delivered", title: "تم التوصيل", icon: "📦", state: "pending" as const, sub: "متوقع قريباً" },
    ];

    if (order.status === "dispatched") {
      base[2].state = "active";
      base[2].time = "الآن";
    } else if (order.status === "delivered") {
      base.forEach(s => { s.state = "done"; });
      base[3].sub = undefined;
    } else if (order.status === "pending") {
      base[1].state = "active";
    }

    base[0].time = created.toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" });
    const confirmed = new Date(created.getTime() + 15 * 60 * 1000);
    base[1].time = confirmed.toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" });

    return base;
  }, [order]);

  if (!order) {
    return (
      <div className="citizen-pwa-page">
        <div className="citizen-pwa-empty">
          <p>الطلب غير موجود</p>
          <Link to="/citizen/orders" className="btn btn-outline">العودة للطلبات</Link>
        </div>
      </div>
    );
  }

  const qty = Number(order.quantityLiters);
  const pricing = calcOrderPricing(qty);
  const scheduledLabel = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString("ar-SY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="citizen-pwa-page">
      <div className="citizen-track-grid">
      <div className="citizen-map-card citizen-track-map">
        <div className="citizen-map-placeholder" aria-hidden>
          <svg viewBox="0 0 348 195" className="citizen-map-svg">
            <path d="M40 160 Q120 40 200 100 T320 60" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="8 6" opacity="0.5" />
            <circle cx="280" cy="50" r="8" fill="#0891b2" />
            <circle cx="60" cy="150" r="6" fill="#0369a1" />
          </svg>
          <span className="citizen-map-pin citizen-map-pin-a">محطة {provider?.companyName?.split(" ")[0] ?? "تل الهوا"}</span>
          <span className="citizen-map-pin citizen-map-pin-b">موقعك</span>
        </div>
        <div className="citizen-map-eta">
          <div>
            <span className="citizen-pwa-muted">الوقت المقدر</span>
            <strong>14 دقيقة</strong>
          </div>
          <span className="citizen-map-eta-icon" aria-hidden>🕐</span>
        </div>
      </div>

      <div className="citizen-timeline-card citizen-track-timeline">
        {steps.map(step => (
          <div key={step.id} className={`citizen-timeline-step citizen-timeline-${step.state}`}>
            <div className="citizen-timeline-copy">
              <strong>{step.title}</strong>
              {step.sub && <span className={step.state === "active" ? "citizen-timeline-live" : ""}>{step.sub}</span>}
              {step.time && <small>{step.time}</small>}
            </div>
            <span className="citizen-timeline-icon" aria-hidden>{step.icon}</span>
          </div>
        ))}
      </div>

      <div className="citizen-provider-card citizen-track-provider">
        <span className="citizen-provider-icon" aria-hidden>💧</span>
        <div>
          <strong>{provider?.companyName ?? "المزود المعتمد"}</strong>
          <span>المزود المعتمد · ⭐ 4.9</span>
          {scheduledLabel && <span className="citizen-track-meta">🕐 التوصيل المطلوب: {scheduledLabel}</span>}
          <span className="citizen-track-meta">💳 الدفع: {paymentMethodLabel(order.paymentMethod)}</span>
          {order.deliveryNote && <span className="citizen-track-meta">📝 {order.deliveryNote}</span>}
        </div>
      </div>

      <div className="citizen-invoice-card citizen-track-invoice">
        <div className="citizen-invoice-head">
          <button type="button" className="citizen-pwa-link">⬇ تحميل PDF</button>
          <div>
            <h3>تفاصيل الفاتورة</h3>
            <span className="citizen-pwa-muted">رقم الطلب: #{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
        <div className="citizen-invoice-rows">
          <div className="citizen-invoice-row">
            <span>صهريج مياه ({qty.toLocaleString()} لتر)</span>
            <strong>{pricing.subtotal.toFixed(2)} ₪</strong>
          </div>
          <div className="citizen-invoice-row">
            <span>رسوم التوصيل السريع</span>
            <strong>{pricing.deliveryFee.toFixed(2)} ₪</strong>
          </div>
          <div className="citizen-invoice-row citizen-invoice-total">
            <span>الإجمالي</span>
            <strong>{pricing.total.toFixed(2)} ₪</strong>
          </div>
        </div>
      </div>

      <div className="citizen-track-actions">
        <a href="tel:+970599000000" className="citizen-pwa-cta">📞 الاتصال بالسائق</a>
        <button type="button" className="citizen-pwa-cta citizen-pwa-cta-outline">💬 محادثة الدعم</button>
      </div>
      </div>
    </div>
  );
}
