import { useEffect, useState } from "react";
import { api, type Order, type Provider } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "badge-yellow", dispatched: "badge-blue",
    delivered: "badge-green", cancelled: "badge-red",
  };
  return `badge ${map[s] ?? "badge-gray"}`;
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Order[] }>("/orders"),
      api.get<{ data: Provider[] }>("/providers"),
    ]).then(([o, p]) => {
      setOrders(o.data);
      setProviders(p.data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + parseFloat(o.totalAmount), 0);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading orders…</p></div>;

  return (
    <div className="page">
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{orders.filter(o => o.status === "delivered").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Transit</div>
          <div className="stat-value" style={{ color: "var(--blue)" }}>{orders.filter(o => o.status === "dispatched").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">${totalRevenue.toFixed(0)}</div>
        </div>
      </div>

      <div className="filters">
        {["all", "pending", "dispatched", "delivered", "cancelled"].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && ` (${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Delivery Orders</div>
            <div className="card-subtitle">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon"></div><p>No orders found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Provider</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const provider = providers.find(p => p.id === o.providerId);
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--gray)" }}>{o.id}</td>
                    <td style={{ fontSize: 13 }}>{provider?.companyName ?? o.providerId}</td>
                    <td className="liters">{Number(o.quantityLiters).toLocaleString()} L</td>
                    <td style={{ fontWeight: 600, color: "#0891b2" }}>${o.totalAmount}</td>
                    <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--gray)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
