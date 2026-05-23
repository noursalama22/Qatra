import { useEffect, useState } from "react";
import { api, type Task, type Zone, type Ngo } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "badge-yellow", in_progress: "badge-blue",
    delivered: "badge-green", cancelled: "badge-red",
  };
  return `badge ${map[s] ?? "badge-gray"}`;
};

const statusDot: Record<string, string> = {
  pending: "🟡", in_progress: "🔵", delivered: "✅", cancelled: "🔴",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ngoId: "n1", zoneId: "z1", quantityLiters: "", scheduledAt: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Task[] }>("/tasks"),
      api.get<{ data: Zone[] }>("/zones"),
      api.get<{ data: Ngo[] }>("/ngos"),
    ]).then(([t, z, n]) => {
      setTasks(t.data);
      setZones(z.data);
      setNgos(n.data);
      setLoading(false);
    });
  }, []);

  const statuses = ["all", "pending", "in_progress", "delivered", "cancelled"];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const handleCreate = async () => {
    if (!form.quantityLiters || !form.scheduledAt) return;
    setSaving(true);
    const task = await api.post<Task>("/tasks", {
      ...form,
      quantityLiters: form.quantityLiters,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    });
    setTasks(prev => [task, ...prev]);
    setShowModal(false);
    setForm({ ngoId: "n1", zoneId: "z1", quantityLiters: "", scheduledAt: "", notes: "" });
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updated = await api.patch<Task>(`/tasks/${id}`, { status });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading tasks…</p></div>;

  return (
    <div className="page">
      <div className="filters">
        {statuses.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.replace("_", " ")}
            {f !== "all" && ` (${tasks.filter(t => t.status === f).length})`}
          </button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setShowModal(true)}>
          + New Task
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Distribution Tasks</div>
            <div className="card-subtitle">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">📋</div><p>No tasks found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>NGO</th>
                <th>Quantity</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const zone = zones.find(z => z.id === t.zoneId);
                const ngo = ngos.find(n => n.id === t.ngoId);
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{zone?.name ?? t.zoneId}</td>
                    <td style={{ fontSize: 12, color: "var(--gray)" }}>{ngo?.orgName ?? t.ngoId}</td>
                    <td className="liters">{Number(t.quantityLiters).toLocaleString()} L</td>
                    <td style={{ fontSize: 12, color: "var(--gray)" }}>{new Date(t.scheduledAt).toLocaleDateString()}</td>
                    <td><span className={statusBadge(t.status)}>{statusDot[t.status]} {t.status.replace("_", " ")}</span></td>
                    <td style={{ fontSize: 12, color: "var(--gray)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.notes ?? "—"}
                    </td>
                    <td>
                      {t.status === "pending" && (
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(t.id, "in_progress")}>
                          ▶ Start
                        </button>
                      )}
                      {t.status === "in_progress" && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(t.id, "delivered")}>
                          ✓ Deliver
                        </button>
                      )}
                      {(t.status === "pending" || t.status === "in_progress") && (
                        <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => handleStatusChange(t.id, "cancelled")}>
                          ✕
                        </button>
                      )}
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
            <h3>📋 New Distribution Task</h3>
            <div className="form-group">
              <label className="form-label">NGO</label>
              <select className="form-control" value={form.ngoId} onChange={e => setForm(f => ({ ...f, ngoId: e.target.value }))}>
                {ngos.filter(n => n.status === "approved").map(n => (
                  <option key={n.id} value={n.id}>{n.orgName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Zone</label>
              <select className="form-control" value={form.zoneId} onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))}>
                {zones.filter(z => z.status === "active").map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity (Liters) *</label>
              <input className="form-control" type="number" placeholder="e.g. 10000" value={form.quantityLiters} onChange={e => setForm(f => ({ ...f, quantityLiters: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date *</label>
              <input className="form-control" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
