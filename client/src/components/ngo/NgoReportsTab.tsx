import { useCallback, useEffect, useState } from "react";
import type { NgoReport } from "../../api";

function formatPeriod(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${f.toLocaleDateString("ar-SY", opts)} — ${t.toLocaleDateString("ar-SY", opts)}`;
}

function providerInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("");
}

type Props = {
  onToast: (msg: string) => void;
  ngoId: string;
};

export default function NgoReportsTab({ onToast, ngoId }: Props) {
  const [report, setReport] = useState<NgoReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ngos/${ngoId}/reports`).then(r => r.json());
      setReport(res);
    } catch {
      onToast("تعذّر تحميل التقارير");
    } finally {
      setLoading(false);
    }
  }, [onToast, ngoId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !report) {
    return <div className="ngo-reports-tab empty-state" dir="rtl">جارٍ تحميل التقارير...</div>;
  }

  const { metrics, marketShare, weeklyTrend, distributionByRegion, supplierPerformance, period } = report;
  const maxWeek = Math.max(...weeklyTrend.map(w => Math.max(w.actual, w.target)), 1);
  const maxRegion = Math.max(...distributionByRegion.map(r => r.liters), 1);
  const totalShare = marketShare.reduce((s, m) => s + m.liters, 0) || 1;

  const donutSegments = marketShare.slice(0, 4);
  let cumulative = 0;
  const donutStops = donutSegments.map((seg, i) => {
    const pct = (seg.liters / totalShare) * 100;
    const start = cumulative;
    cumulative += pct;
    const colors = ["#0061a6", "#0284c7", "#67e8f9", "#bae6fd"];
    return `${colors[i % colors.length]} ${start}% ${cumulative}%`;
  }).join(", ");

  return (
    <div className="ngo-reports-tab" dir="rtl">
      <div className="ngo-reports-header">
        <div className="ngo-reports-header-text">
          <h3 className="ngo-reports-title">التقارير والتحليلات اللوجستية</h3>
          <p className="ngo-reports-subtitle">مراجعة أداء توزيع المياه عبر القطاعات — آخر 30 يوماً</p>
        </div>
        <div className="ngo-reports-controls">
          <div className="ngo-reports-period">
            <span aria-hidden="true">📅</span>
            {formatPeriod(period.from, period.to)}
          </div>
          <button type="button" className="ngo-reports-btn-outline" onClick={() => onToast("تصدير CSV — قريباً")}>
            تصدير CSV
          </button>
          <button type="button" className="ngo-reports-btn-primary" onClick={() => onToast("تقرير PDF — قريباً")}>
            تقرير PDF
          </button>
        </div>
      </div>

      <div className="ngo-reports-kpi-grid">
        <div className="ngo-reports-kpi-card">
          <span className="ngo-reports-kpi-label">إجمالي المياه الموزعة</span>
          <div className="ngo-reports-kpi-value-row">
            <span className="ngo-reports-kpi-value">{metrics.totalWaterDistributed.formatted}</span>
            <span className="ngo-reports-kpi-unit">{metrics.totalWaterDistributed.unit}</span>
          </div>
          <span className={`ngo-reports-kpi-trend ${metrics.totalWaterDistributed.trend >= 0 ? "trend-up" : "trend-down"}`}>
            {metrics.totalWaterDistributed.trend >= 0 ? "↑" : "↓"} {Math.abs(metrics.totalWaterDistributed.trend)}% عن الشهر الماضي
          </span>
        </div>

        <div className="ngo-reports-kpi-card">
          <span className="ngo-reports-kpi-label">كفاءة التوصيل</span>
          <div className="ngo-reports-kpi-value-row">
            <span className="ngo-reports-kpi-value">{metrics.deliveryEfficiency.value}%</span>
          </div>
          <span className="ngo-reports-kpi-badge">{metrics.deliveryEfficiency.label}</span>
        </div>

        <div className="ngo-reports-kpi-card">
          <span className="ngo-reports-kpi-label">المزودون النشطون</span>
          <div className="ngo-reports-kpi-value-row">
            <span className="ngo-reports-kpi-value">{metrics.activeSuppliers.value}</span>
          </div>
          <span className="ngo-reports-kpi-meta">من أصل {metrics.activeSuppliers.total} مسجّل</span>
        </div>

        <div className="ngo-reports-kpi-card ngo-reports-kpi-critical">
          <span className="ngo-reports-kpi-label">نقاط حرجة</span>
          <div className="ngo-reports-kpi-value-row">
            <span className="ngo-reports-kpi-value critical">{String(metrics.criticalPoints.value).padStart(2, "0")}</span>
          </div>
          <span className="ngo-reports-kpi-warn">{metrics.criticalPoints.label}</span>
        </div>
      </div>

      <div className="ngo-reports-charts-row">
        <div className="ngo-reports-panel">
          <div className="ngo-reports-panel-head">
            <h4>اتجاهات توزيع المياه</h4>
            <span className="ngo-reports-panel-sub">آخر 30 يوماً</span>
          </div>
          <div className="ngo-reports-bar-chart">
            {weeklyTrend.map(w => (
              <div key={w.week} className="ngo-reports-bar-group">
                <div className="ngo-reports-bar-pair">
                  <div
                    className="ngo-reports-bar bar-target"
                    style={{ height: `${(w.target / maxWeek) * 100}%` }}
                    title={`الهدف: ${w.target.toLocaleString()} لتر`}
                  />
                  <div
                    className="ngo-reports-bar bar-actual"
                    style={{ height: `${(w.actual / maxWeek) * 100}%` }}
                    title={`الفعلي: ${w.actual.toLocaleString()} لتر`}
                  />
                </div>
                <span className="ngo-reports-bar-label">{w.week}</span>
              </div>
            ))}
          </div>
          <div className="ngo-reports-legend">
            <span><i className="dot dot-actual" /> موزّع</span>
            <span><i className="dot dot-target" /> الهدف</span>
          </div>
        </div>

        <div className="ngo-reports-panel">
          <div className="ngo-reports-panel-head">
            <h4>حصة السوق للمزودين</h4>
          </div>
          <div className="ngo-reports-donut-wrap">
            <div
              className="ngo-reports-donut"
              style={{ background: donutStops ? `conic-gradient(${donutStops})` : "#d8eef8" }}
              role="img"
              aria-label="حصة السوق للمزودين"
            >
              <div className="ngo-reports-donut-hole">
                <span className="ngo-reports-donut-pct">{donutSegments[0]?.share ?? 0}%</span>
                <span className="ngo-reports-donut-name">{donutSegments[0]?.providerName?.split(" ")[0] ?? "—"}</span>
              </div>
            </div>
            <ul className="ngo-reports-donut-legend">
              {donutSegments.map((seg, i) => {
                const colors = ["#0061a6", "#0284c7", "#67e8f9", "#bae6fd"];
                return (
                  <li key={seg.providerId}>
                    <span className="dot" style={{ background: colors[i % colors.length] }} />
                    <span>{seg.providerName}</span>
                    <span className="ngo-reports-donut-liters">{(seg.liters / 1000).toFixed(0)}K L</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="ngo-reports-charts-row">
        <div className="ngo-reports-panel">
          <div className="ngo-reports-panel-head">
            <h4>التوزيع حسب المنطقة</h4>
          </div>
          <div className="ngo-reports-hbars">
            {(distributionByRegion.length ? distributionByRegion : [{ regionName: "لا بيانات", liters: 0, regionId: "x" }]).map(r => (
              <div key={r.regionId} className="ngo-reports-hbar-row">
                <span className="ngo-reports-hbar-label">{r.regionName}</span>
                <div className="ngo-reports-hbar-track">
                  <div
                    className="ngo-reports-hbar-fill"
                    style={{ width: `${(r.liters / maxRegion) * 100}%` }}
                  />
                </div>
                <span className="ngo-reports-hbar-val">{(r.liters / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ngo-reports-panel">
          <div className="ngo-reports-panel-head">
            <h4>أكثر المزودين كفاءة</h4>
          </div>
          <div className="ngo-reports-table-wrap">
            <table className="ngo-reports-table">
              <thead>
                <tr>
                  <th>المزود</th>
                  <th>الالتزام بالجدول</th>
                  <th>إجمالي التوريد</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: "center", color: "#8eb5c8" }}>لا بيانات بعد</td></tr>
                ) : supplierPerformance.map(s => (
                  <tr key={s.providerId}>
                    <td>
                      <div className="ngo-reports-supplier-cell">
                        <span className="ngo-reports-avatar">{providerInitials(s.providerName)}</span>
                        {s.providerName}
                      </div>
                    </td>
                    <td>
                      <div className="ngo-reports-adherence">
                        <div className="ngo-reports-adherence-bar">
                          <div style={{ width: `${s.adherence}%` }} />
                        </div>
                        <span>{s.adherence}%</span>
                      </div>
                    </td>
                    <td>{s.totalLiters.toLocaleString()} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
