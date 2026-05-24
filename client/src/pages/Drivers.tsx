import { useEffect, useState } from "react";
import { api, type Driver, type Provider } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    active: "badge-green", pending: "badge-yellow",
    inactive: "badge-gray", rejected: "badge-red",
  };
  return `badge ${map[s] ?? "badge-gray"}`;
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Driver[] }>("/drivers"),
      api.get<{ data: Provider[] }>("/providers"),
    ]).then(([d, p]) => {
      setDrivers(d.data);
      setProviders(p.data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? drivers : drivers.filter(d => d.status === filter);

  const handleActivate = async (id: string, status: string) => {
    const updated = await api.patch<Driver>(`/drivers/${id}`, { status });
    setDrivers(prev => prev.map(d => d.id === id ? updated : d));
  };

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading drivers…</p></div>;

  return (
    <div className="page">
      <div className="filters">
        {["all", "active", "pending", "inactive"].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && ` (${drivers.filter(d => d.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Drivers</div>
            <div className="card-subtitle">{filtered.length} driver{filtered.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon"></div><p>No drivers found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver ID</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Phone</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const provider = providers.find(p => p.id === d.providerId);
                return (
                  <tr key={d.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--gray)" }}>{d.id}</td>
                    <td>
                      <span className={`badge ${d.driverType === "owned" ? "badge-blue" : "badge-gray"}`}>
                        {d.driverType}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}> {d.vehicleType}</td>
                    <td style={{ fontSize: 12, color: "var(--gray)" }}>{d.phone}</td>
                    <td style={{ fontSize: 12 }}>{provider?.companyName ?? "Independent"}</td>
                    <td><span className={statusBadge(d.status)}>{d.status}</span></td>
                    <td>
                      {d.status === "pending" && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleActivate(d.id, "active")}>Approve</button>
                          <button className="btn btn-sm btn-danger" style={{ marginInlineStart: 4 }} onClick={() => handleActivate(d.id, "rejected")}>Reject</button>
                        </>
                      )}
                      {d.status === "active" && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleActivate(d.id, "inactive")}>Deactivate</button>
                      )}
                      {d.status === "inactive" && (
                        <button className="btn btn-sm btn-success" onClick={() => handleActivate(d.id, "active")}>Reactivate</button>
                      )}
                    </td>
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
