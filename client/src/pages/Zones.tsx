import { useEffect, useState } from "react";
import { api, type Zone } from "../api";

const statusBadge = (s: string) =>
  `badge ${s === "active" ? "badge-green" : "badge-gray"}`;

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ngoId: "n1", status: "active", populationEstimate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Zone[] }>("/zones").then(r => { setZones(r.data); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? zones : zones.filter(z => z.status === filter);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const zone = await api.post<Zone>("/zones", {
      ...form,
      populationEstimate: Number(form.populationEstimate) || 0,
    });
    setZones(prev => [...prev, zone]);
    setShowModal(false);
    setForm({ name: "", description: "", ngoId: "n1", status: "active", populationEstimate: "" });
    setSaving(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading zones…</p></div>;

  return (
    <div className="page">
      <div className="filters">
        {["all", "active", "inactive"].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All Zones" : f.charAt(0).toUpperCase() + f.slice(1)} {f !== "all" && `(${zones.filter(z => z.status === f).length})`}
          </button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setShowModal(true)}>
          + New Zone
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Coverage Zones</div>
            <div className="card-subtitle">{filtered.length} zone{filtered.length !== 1 ? "s" : ""} shown</div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">🗺️</div><p>No zones found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Status</th>
                <th>Population</th>
                <th>Signal Count</th>
                <th>Signal Urgency</th>
                <th>Last Delivery</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(z => {
                const pct = Math.min(100, Math.round((z.signalCount / 70) * 100));
                return (
                  <tr key={z.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{z.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{z.description}</div>
                    </td>
                    <td><span className={statusBadge(z.status)}>{z.status}</span></td>
                    <td>{z.populationEstimate.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: z.signalCount > 50 ? "#dc2626" : z.signalCount > 25 ? "#d97706" : "#16a34a" }}>
                        {z.signalCount}
                      </span>
                    </td>
                    <td style={{ width: 160 }}>
                      <div style={{ display: "flex", align: "center", gap: 8 }}>
                        <div className="progress" style={{ flex: 1 }}>
                          <div className="progress-bar" style={{
                            width: `${pct}%`,
                            background: z.signalCount > 50 ? "#dc2626" : z.signalCount > 25 ? "#d97706" : "#16a34a"
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--gray)", minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--gray)", fontSize: 12 }}>
                      {z.lastDeliveryAt ? new Date(z.lastDeliveryAt).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🗺️ Create New Zone</h3>
            <div className="form-group">
              <label className="form-label">Zone Name *</label>
              <input className="form-control" placeholder="e.g. North Aleppo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" placeholder="Brief description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Population Estimate</label>
              <input className="form-control" type="number" placeholder="0" value={form.populationEstimate} onChange={e => setForm(f => ({ ...f, populationEstimate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
