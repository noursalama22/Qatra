import { useState, useEffect } from "react";

type Ngo = { id: string; orgName: string; contactEmail: string; country: string; status: string; description: string; createdAt: string };
type Provider = { id: string; companyName: string; contactEmail: string; status: string; operatingModes: string[]; description: string; createdAt: string };
type Stats = { totalZones: number; activeZones: number; approvedNgos: number; approvedProviders: number; totalDrivers: number; totalTasks: number; totalLitersDispatched: number };

export default function AdminPortal() {
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"overview" | "ngos" | "providers">("overview");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = async () => {
    const [n, p, s] = await Promise.all([
      fetch("/api/ngos").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
      fetch("/api/stats").then(r => r.json()),
    ]);
    setNgos(n.data ?? []);
    setProviders(p.data ?? []);
    setStats(s);
  };

  useEffect(() => { load(); }, []);

  const updateNgo = async (id: string, status: string) => {
    await fetch(`/api/ngos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setActionMsg(status === "approved" ? " تمت الموافقة على المنظمة" : " تم رفض المنظمة");
    load();
    setTimeout(() => setActionMsg(null), 3000);
  };

  const updateProvider = async (id: string, status: string) => {
    await fetch(`/api/providers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setActionMsg(status === "approved" ? " تمت الموافقة على المزود" : " تم رفض المزود");
    load();
    setTimeout(() => setActionMsg(null), 3000);
  };

  const pendingNgos = ngos.filter(n => n.status === "pending");
  const pendingProviders = providers.filter(p => p.status === "pending");
  const totalPending = pendingNgos.length + pendingProviders.length;

  return (
    <div className="portal admin-portal" dir="rtl">
      {/* Header */}
      <div className="portal-header" style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)" }}>
        <div className="portal-header-inner">
          <div className="portal-role-badge"> المشرف العام</div>
          <h2 className="portal-title">لوحة تحكم المشرف</h2>
          <p className="portal-subtitle">مراجعة الطلبات، إدارة الأطراف، ومراقبة النظام</p>
        </div>
        {totalPending > 0 && (
          <div className="admin-alert">
            <span className="alert-dot" />
            <span>{totalPending} طلب معلق يحتاج مراجعتك</span>
          </div>
        )}
      </div>

      {/* Toast */}
      {actionMsg && <div className="action-toast">{actionMsg}</div>}

      {/* Tabs */}
      <div className="portal-tabs">
        <button className={`ptab ${tab === "overview" ? "ptab-active" : ""}`} onClick={() => setTab("overview")}> نظرة عامة</button>
        <button className={`ptab ${tab === "ngos" ? "ptab-active" : ""}`} onClick={() => setTab("ngos")}>
           المنظمات {pendingNgos.length > 0 && <span className="ptab-badge">{pendingNgos.length}</span>}
        </button>
        <button className={`ptab ${tab === "providers" ? "ptab-active" : ""}`} onClick={() => setTab("providers")}>
           مزودو الخدمة {pendingProviders.length > 0 && <span className="ptab-badge">{pendingProviders.length}</span>}
        </button>
      </div>

      <div className="portal-body">

        {/* ── Overview ── */}
        {tab === "overview" && stats && (
          <>
            <div className="stat-grid">
              {[
                { label: "مناطق نشطة", val: stats.activeZones, icon: "", color: "#0ea5e9" },
                { label: "منظمات معتمدة", val: stats.approvedNgos, icon: "", color: "#14b8a6" },
                { label: "مزودون معتمدون", val: stats.approvedProviders, icon: "", color: "#38bdf8" },
                { label: "سائقون مسجلون", val: stats.totalDrivers, icon: "", color: "#f59e0b" },
                { label: "مهام التوزيع", val: stats.totalTasks, icon: "", color: "#ef4444" },
                { label: "لترات موزعة", val: `${(stats.totalLitersDispatched / 1000).toFixed(1)}k`, icon: "", color: "#0ea5e9" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {totalPending > 0 && (
              <div className="pending-banner">
                <div className="pending-banner-icon"></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>طلبات تحتاج مراجعة</div>
                  <div style={{ fontSize: 13, color: "#0f5f8d", marginTop: 2 }}>
                    {pendingNgos.length > 0 && `${pendingNgos.length} منظمة`}{pendingNgos.length > 0 && pendingProviders.length > 0 && " · "}{pendingProviders.length > 0 && `${pendingProviders.length} مزود`} في انتظار الموافقة
                  </div>
                </div>
                <button className="btn btn-amber" onClick={() => setTab(pendingNgos.length > 0 ? "ngos" : "providers")}>مراجعة الطلبات ←</button>
              </div>
            )}

            <div className="config-section">
              <div className="section-title"> إعدادات النظام</div>
              <div className="config-grid">
                {[
                  { key: "وزن الإشارات", val: "0.4", desc: "نسبة وزن إشارات الاحتياج في حساب الأولوية" },
                  { key: "وزن أيام التوزيع", val: "0.4", desc: "نسبة وزن أيام الانتظار منذ آخر توزيع" },
                  { key: "وزن السكان", val: "0.2", desc: "نسبة وزن كثافة السكان في المنطقة" },
                  { key: "حد التصعيد التلقائي", val: "50", desc: "عدد الإشارات الذي يؤدي إلى تصعيد تلقائي" },
                  { key: "رسوم المنصة", val: "5%", desc: "نسبة خصم Qatra من المدفوعات التجارية" },
                  { key: "دقة GPS", val: "10 ث", desc: "فترة تحديث موقع السائق أثناء التوصيل" },
                ].map(c => (
                  <div key={c.key} className="config-card">
                    <div className="config-key">{c.key}</div>
                    <div className="config-val">{c.val}</div>
                    <div className="config-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#8eb5c8", marginTop: 12 }}>* التعديل على الإعدادات متاح في الإصدارات القادمة</div>
            </div>
          </>
        )}

        {/* ── NGOs ── */}
        {tab === "ngos" && (
          <>
            {pendingNgos.length > 0 && (
              <div className="approval-section">
                <div className="section-title"> بانتظار الموافقة ({pendingNgos.length})</div>
                {pendingNgos.map(n => (
                  <div key={n.id} className="approval-card">
                    <div className="approval-info">
                      <div className="approval-name"> {n.orgName}</div>
                      <div className="approval-meta">{n.contactEmail} · {n.country}</div>
                      {n.description && <div className="approval-desc">{n.description}</div>}
                      <div className="approval-date">تاريخ التقديم: {new Date(n.createdAt).toLocaleDateString("ar-SY")}</div>
                    </div>
                    <div className="approval-actions">
                      <button className="btn btn-approve" onClick={() => updateNgo(n.id, "approved")}> موافقة</button>
                      <button className="btn btn-reject" onClick={() => updateNgo(n.id, "rejected")}> رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="approval-section">
              <div className="section-title"> المنظمات المعتمدة ({ngos.filter(n => n.status === "approved").length})</div>
              {ngos.filter(n => n.status === "approved").map(n => (
                <div key={n.id} className="actor-card">
                  <div className="actor-icon" style={{ background: "#ecfeff", color: "#0891b2" }}></div>
                  <div className="actor-info">
                    <div className="actor-name">{n.orgName}</div>
                    <div className="actor-meta">{n.contactEmail} · {n.country}</div>
                  </div>
                  <span className="badge badge-green">معتمدة</span>
                </div>
              ))}
              {ngos.filter(n => n.status === "rejected").map(n => (
                <div key={n.id} className="actor-card" style={{ opacity: 0.6 }}>
                  <div className="actor-icon" style={{ background: "#fee2e2", color: "#dc2626" }}></div>
                  <div className="actor-info">
                    <div className="actor-name">{n.orgName}</div>
                    <div className="actor-meta">{n.contactEmail}</div>
                  </div>
                  <span className="badge badge-red">مرفوضة</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Providers ── */}
        {tab === "providers" && (
          <>
            {pendingProviders.length > 0 && (
              <div className="approval-section">
                <div className="section-title"> بانتظار الموافقة ({pendingProviders.length})</div>
                {pendingProviders.map(p => (
                  <div key={p.id} className="approval-card">
                    <div className="approval-info">
                      <div className="approval-name"> {p.companyName}</div>
                      <div className="approval-meta">{p.contactEmail}</div>
                      <div className="approval-modes">
                        {(p.operatingModes ?? []).map((m: string) => (
                          <span key={m} className={`mode-badge ${m === "humanitarian" ? "mode-hum" : "mode-com"}`}>
                            {m === "humanitarian" ? " إنساني" : " تجاري"}
                          </span>
                        ))}
                      </div>
                      {p.description && <div className="approval-desc">{p.description}</div>}
                    </div>
                    <div className="approval-actions">
                      <button className="btn btn-approve" onClick={() => updateProvider(p.id, "approved")}> موافقة</button>
                      <button className="btn btn-reject" onClick={() => updateProvider(p.id, "rejected")}> رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="approval-section">
              <div className="section-title"> المزودون المعتمدون ({providers.filter(p => p.status === "approved").length})</div>
              {providers.filter(p => p.status === "approved").map(p => (
                <div key={p.id} className="actor-card">
                  <div className="actor-icon" style={{ background: "#e0f7ff", color: "#0284c7" }}></div>
                  <div className="actor-info">
                    <div className="actor-name">{p.companyName}</div>
                    <div className="actor-meta">{p.contactEmail}</div>
                    <div className="approval-modes" style={{ marginTop: 4 }}>
                      {(p.operatingModes ?? []).map((m: string) => (
                        <span key={m} className={`mode-badge ${m === "humanitarian" ? "mode-hum" : "mode-com"}`}>
                          {m === "humanitarian" ? " إنساني" : " تجاري"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="badge badge-green">معتمد</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
