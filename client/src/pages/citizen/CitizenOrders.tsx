import { Link } from "react-router-dom";
import { useCitizenContext } from "../../contexts/CitizenContext";
import { calcOrderPricing, paymentMethodLabel } from "../../constants/citizenOrder";

const STATUS: Record<string, { ar: string; cls: string }> = {
  pending: { ar: "قيد الانتظار", cls: "badge-yellow" },
  dispatched: { ar: "في الطريق", cls: "badge-blue" },
  delivered: { ar: "تم التوصيل", cls: "badge-green" },
  cancelled: { ar: "ملغى", cls: "badge-red" },
};

export default function CitizenOrders() {
  const { myOrders, providers, loading } = useCitizenContext();

  if (loading) {
    return (
      <div className="citizen-pwa-loading">
        <div className="spinner" />
        <p>جارٍ تحميل الطلبات...</p>
      </div>
    );
  }

  return (
    <div className="citizen-pwa-page">
      {myOrders.length > 0 && (
        <div className="citizen-pwa-section-head" style={{ marginBottom: 16 }}>
          <Link to="/citizen/market/request" className="btn btn-primary btn-sm">طلب جديد</Link>
          <h2 className="citizen-pwa-page-title">طلباتي</h2>
        </div>
      )}
      {myOrders.length === 0 ? (
        <div className="citizen-pwa-empty">
          <span className="citizen-pwa-empty-icon" aria-hidden>📦</span>
          <p>لم تقم بأي طلبات بعد</p>
          <Link to="/citizen/market/request" className="btn btn-primary">طلب مياه جديد</Link>
        </div>
      ) : (
        <div className="citizen-order-list">
          {myOrders.map(order => {
            const st = STATUS[order.status] ?? { ar: order.status, cls: "badge-gray" };
            const prov = providers.find(p => p.id === order.providerId);
            const pricing = calcOrderPricing(Number(order.quantityLiters));
            const scheduled = order.scheduledAt
              ? new Date(order.scheduledAt).toLocaleString("ar-SY", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;
            return (
              <Link
                key={order.id}
                to={`/citizen/orders/${order.id}`}
                className="citizen-order-card"
              >
                <div className="citizen-order-date">
                  <span>{new Date(order.createdAt).toLocaleDateString("ar-SY", { month: "short" })}</span>
                  <strong>{new Date(order.createdAt).getDate()}</strong>
                </div>
                <div className="citizen-order-info">
                  <strong>{Number(order.quantityLiters).toLocaleString()} لتر — {prov?.companyName ?? "مزود"}</strong>
                  <span>
                    {scheduled && <>🕐 {scheduled} · </>}
                    {paymentMethodLabel(order.paymentMethod)} · {pricing.total.toFixed(2)} ₪
                  </span>
                </div>
                <span className={`badge ${st.cls}`}>{st.ar}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
