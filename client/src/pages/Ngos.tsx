import { useEffect, useState } from "react";
import { api, type Ngo } from "../api";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    approved: "badge-green", pending: "badge-yellow", rejected: "badge-red",
  };
  return `badge ${map[s] ?? "badge-gray"}`;
};

export default function Ngos() {
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Ngo[] }>("/ngos").then(r => { setNgos(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading NGOs…</p></div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">NGO Partners</div>
            <div className="card-subtitle">{ngos.length} registered organisations</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Country</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ngos.map(n => (
              <tr key={n.id}>
                <td style={{ fontWeight: 500 }}>🏢 {n.orgName}</td>
                <td>
                  <span className="badge badge-gray">🌍 {n.country}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--gray)" }}>{n.contactEmail}</td>
                <td><span className={statusBadge(n.status)}>{n.status}</span></td>
                <td style={{ fontSize: 12, color: "var(--gray)" }}>{n.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
