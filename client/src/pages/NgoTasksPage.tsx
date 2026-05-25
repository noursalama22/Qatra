import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseProviderFromNotes, TASK_STATUS_UI } from "../lib/ngoTaskUtils";

type Zone = { id: string; name: string };
type Task = {
  id: string;
  ngoId: string;
  zoneId: string;
  status: string;
  quantityLiters: string;
  scheduledAt: string;
  notes: string | null;
};

type StatusFilter = "all" | "pending" | "in_progress" | "delivered" | "cancelled";

export default function NgoTasksPage({ ngoId }: { ngoId: string }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    const [zRes, tRes] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
    ]);
    setZones(zRes.data ?? []);
    setTasks((tRes.data ?? []).filter((t: Task) => t.ngoId === ngoId));
    setLoading(false);
  }, [ngoId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tasks
    .filter(t => filter === "all" || t.status === filter)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>جارٍ تحميل المهام…</p>
      </div>
    );
  }

  return (
    <div className="ngo-tasks-page" dir="rtl">
      <header className="ngo-tasks-page-header">
        <div>
          <Link to="/ngo/dashboard" className="btn btn-outline btn-sm">← العودة للوحة التوزيع</Link>
          <h2 className="ngo-tasks-page-title">جميع المهام</h2>
          <p className="ngo-tasks-page-sub">{tasks.length} مهمة · تتبع حالة المزود</p>
        </div>
        <div className="ngo-tasks-filters" role="tablist" aria-label="تصفية حسب الحالة">
          {([
            ["all", "الكل"],
            ["pending", "بانتظار"],
            ["in_progress", "جاري"],
            ["delivered", "مكتمل"],
            ["cancelled", "ملغي"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`ngo-tasks-filter-btn ${filter === key ? "ngo-tasks-filter-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>لا توجد مهام في هذا التصنيف.</p>
          <Link to="/ngo/dashboard" className="btn btn-primary" style={{ marginTop: 12 }}>
            جدولة مهمة جديدة
          </Link>
        </div>
      ) : (
        <div className="ngo-tasks-table-wrap">
          <table className="ngo-tasks-table">
            <thead>
              <tr>
                <th>المنطقة</th>
                <th>الكمية</th>
                <th>المزود</th>
                <th>الموعد</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const zone = zones.find(z => z.id === task.zoneId);
                const st = TASK_STATUS_UI[task.status] ?? { label: task.status, cls: "dash-status-todo" };
                const providerName = parseProviderFromNotes(task.notes);
                return (
                  <tr key={task.id}>
                    <td><strong>{zone?.name ?? task.zoneId}</strong></td>
                    <td>{Number(task.quantityLiters).toLocaleString()} لتر</td>
                    <td>{providerName ?? "—"}</td>
                    <td>{new Date(task.scheduledAt).toLocaleString("ar-SY")}</td>
                    <td><span className={`dash-status-pill ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <Link
                        to={`/ngo/dashboard?zone=${task.zoneId}`}
                        className="btn btn-outline btn-sm"
                      >
                        عرض المنطقة
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
