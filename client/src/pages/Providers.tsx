import { useEffect, useState } from "react";
import { api, type Provider } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = { approved: "badge-green", pending: "badge-yellow", rejected: "badge-red" };
  return `badge ${map[s] ?? "badge-gray"}`;
};

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Provider[] }>("/providers").then(r => { setProviders(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading providers…</p></div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Service Providers</div>
            <div className="card-subtitle">{providers.length} registered providers</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Operating Modes</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}> {p.companyName}</td>
                <td style={{ fontSize: 12, color: "var(--gray)" }}>{p.contactEmail}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.operatingModes.map(m => (
                      <span key={m} className={`badge ${m === "humanitarian" ? "badge-blue" : "badge-green"}`}>{m}</span>
                    ))}
                  </div>
                </td>
                <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                <td style={{ fontSize: 12, color: "var(--gray)" }}>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
