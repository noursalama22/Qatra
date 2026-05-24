import { useEffect, useState } from "react";
import { api, type Stats, type Task, type Zone } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    active: "badge-green", inactive: "badge-gray",
    pending: "badge-yellow", in_progress: "badge-blue",
    delivered: "badge-green", cancelled: "badge-red",
    approved: "badge-green", rejected: "badge-red",
  };
  return `badge ${map[s] ?? "badge-gray"}`;
};

const statusDot: Record<string, string> = {
  active: "", inactive: "", pending: "",
  in_progress: "", delivered: "", cancelled: "",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/stats"),
      api.get<{ data: Task[] }>("/tasks"),
      api.get<{ data: Zone[] }>("/zones"),
    ]).then(([s, t, z]) => {
      setStats(s);
      setTasks(t.data.slice(0, 5));
      setZones(z.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading dashboard…</p></div>;

  const totalLiters = (stats!.totalLitersDispatched / 1000).toFixed(1);

  return (
    <div className="page">
      <div className="alert alert-info">
         <strong>Qatra v3 Demo</strong> — This is a live demo with sample data. All actions are simulated.
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">Coverage Zones</div>
          <div className="stat-value">{stats!.totalZones}</div>
          <div className="stat-sub">{stats!.activeZones} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">NGOs</div>
          <div className="stat-value">{stats!.totalNgos}</div>
          <div className="stat-sub">{stats!.approvedNgos} approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">Providers</div>
          <div className="stat-value">{stats!.totalProviders}</div>
          <div className="stat-sub">{stats!.approvedProviders} approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">Drivers</div>
          <div className="stat-value">{stats!.totalDrivers}</div>
          <div className="stat-sub">{stats!.activeDrivers} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">Tasks</div>
          <div className="stat-value">{stats!.totalTasks}</div>
          <div className="stat-sub">{stats!.pendingTasks} pending · {stats!.inProgressTasks} in progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-label">Water Delivered</div>
          <div className="stat-value">{totalLiters}k L</div>
          <div className="stat-sub">{stats!.deliveredTasks} completed tasks</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Tasks</div>
              <div className="card-subtitle">Latest distribution assignments</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const zone = zones.find(z => z.id === t.zoneId);
                return (
                  <tr key={t.id}>
                    <td>{zone?.name ?? t.zoneId}</td>
                    <td className="liters">{Number(t.quantityLiters).toLocaleString()} L</td>
                    <td><span className={statusBadge(t.status)}>{statusDot[t.status]} {t.status.replace("_", " ")}</span></td>
                    <td style={{ color: "var(--gray)", fontSize: 12 }}>{new Date(t.scheduledAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Zone Signal Levels</div>
              <div className="card-subtitle">Water need signals by zone</div>
            </div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {zones.map(z => {
              const pct = Math.min(100, Math.round((z.signalCount / 70) * 100));
              const color = z.signalCount > 50 ? "progress-red" : z.signalCount > 30 ? "progress-yellow" : "progress-green";
              return (
                <div key={z.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{z.name}</span>
                    <span style={{ color: "var(--gray)" }}>{z.signalCount} signals · {z.populationEstimate.toLocaleString()} people</span>
                  </div>
                  <div className="progress">
                    <div className={`progress-bar ${color === "progress-red" ? "" : ""}`}
                      style={{
                        width: `${pct}%`,
                        background: z.signalCount > 50 ? "#dc2626" : z.signalCount > 30 ? "#d97706" : "#0891b2"
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
