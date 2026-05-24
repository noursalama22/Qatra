import { useState, useEffect } from "react";

type ContractStatus = "review" | "active" | "rejected";
type ContractPriority = "normal" | "high" | "vip";

type Contract = {
  id: string;
  contractNumber: string;
  clientName: string;
  priority: ContractPriority;
  status: ContractStatus;
  volumeLiters: number;
  valueAed: string;
  location: string | null;
  slaHours: number | null;
  notes: string | null;
  startDate: string | null;
  endDate: string | null;
};

type DetailModal = Contract & { tab: "overview" | "deliveries" | "financials" };

const DEMO_PROVIDER_ID = "seed-p1";

const STATUS_CONFIG: Record<ContractStatus, { label: string; bg: string; color: string }> = {
  review:   { label: "قيد المراجعة", bg: "#fef3c7", color: "#d97706" },
  active:   { label: "نشط",          bg: "#ecfeff",  color: "#0891b2" },
  rejected: { label: "مرفوض",        bg: "#fee2e2",  color: "#dc2626" },
};

const PRIORITY_CONFIG: Record<ContractPriority, { label: string; bg: string; color: string }> = {
  vip:    { label: "VIP",          bg: "#0ea5e9", color: "#fff" },
  high:   { label: "أولوية عالية", bg: "#f59e0b", color: "#fff" },
  normal: { label: "عادي",         bg: "#e0f2fe", color: "#0284c7" },
};

function fmtAED(n: number | string) {
  return Number(n).toLocaleString("ar-AE") + " د.إ.";
}

function fmtVol(n: number) {
  if (n >= 1000) return (n / 1000).toLocaleString("ar-AE") + " ألف لتر";
  return n.toLocaleString("ar-AE") + " لتر";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", { day: "2-digit", month: "long", year: "numeric" });
}

function ContractDetail({ contract, onClose, onStatusChange }: {
  contract: DetailModal;
  onClose: () => void;
  onStatusChange: (id: string, status: ContractStatus) => void;
}) {
  const [tab, setTab] = useState<"overview" | "deliveries" | "financials">(contract.tab);
  const [saving, setSaving] = useState(false);
  const st = STATUS_CONFIG[contract.status];
  const pr = PRIORITY_CONFIG[contract.priority];

  const accept = async () => {
    setSaving(true);
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    onStatusChange(contract.id, "active");
    setSaving(false);
    onClose();
  };

  const reject = async () => {
    setSaving(true);
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    onStatusChange(contract.id, "rejected");
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "22px 24px", color: "white", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ background: pr.bg, color: pr.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{pr.label}</span>
            <span style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{contract.contractNumber}</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{contract.clientName}</h3>
          {contract.location && <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>📍 {contract.location}</p>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #d8eef8", background: "#f8fcff" }}>
          {([["overview", "نظرة عامة"], ["deliveries", "التوصيلات"], ["financials", "الماليات"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: tab === id ? "#0284c7" : "#6b8aa0", borderBottom: tab === id ? "2px solid #0284c7" : "2px solid transparent", transition: "all 0.15s" }}
            >{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
          {tab === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "الحجم", value: fmtVol(contract.volumeLiters) },
                  { label: "القيمة الإجمالية", value: fmtAED(contract.valueAed) },
                  { label: "تاريخ البدء", value: fmtDate(contract.startDate) },
                  { label: "تاريخ الانتهاء", value: fmtDate(contract.endDate) },
                  ...(contract.slaHours ? [{ label: "مستوى الخدمة (SLA)", value: `${contract.slaHours} ساعات` }] : []),
                ].map(row => (
                  <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
                  </div>
                ))}
              </div>
              {contract.notes && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, marginBottom: 6 }}>ملاحظات العقد</div>
                  <p style={{ fontSize: 13, color: "#31576b", lineHeight: 1.6, margin: 0 }}>{contract.notes}</p>
                </div>
              )}
            </>
          )}

          {tab === "deliveries" && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#8eb5c8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚛</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                {contract.status === "active" ? "لا توجد توصيلات مسجلة لهذا العقد حتى الآن" : "يبدأ تتبع التوصيلات بعد تفعيل العقد"}
              </p>
            </div>
          )}

          {tab === "financials" && (
            <>
              <div style={{ background: "linear-gradient(135deg, #0f3d5c, #0284c7)", borderRadius: 12, padding: "18px 20px", color: "white", marginBottom: 16 }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>القيمة التعاقدية الإجمالية</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtAED(contract.valueAed)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "الإيراد المحتجز", value: fmtAED(Number(contract.valueAed) * 0.3), color: "#d97706" },
                  { label: "المُحرَّر", value: fmtAED(Number(contract.valueAed) * 0.7), color: "#0891b2" },
                  { label: "رسوم المنصة (5%)", value: fmtAED(Number(contract.valueAed) * 0.05), color: "#dc2626" },
                  { label: "صافي المتوقع", value: fmtAED(Number(contract.valueAed) * 0.95), color: "#12384f" },
                ].map(row => (
                  <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {contract.status === "review" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #d8eef8", display: "flex", gap: 10 }}>
            <button
              onClick={reject}
              disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >رفض العقد</button>
            <button
              onClick={accept}
              disabled={saving}
              style={{ flex: 2, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >{saving ? "جارٍ الحفظ..." : "قبول وتفعيل العقد"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"review" | "active" | "rejected">("review");
  const [detail, setDetail] = useState<DetailModal | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/contracts?providerId=${DEMO_PROVIDER_ID}`)
      .then(r => r.json())
      .then(d => { setContracts(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = (id: string, status: ContractStatus) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const reviewCount   = contracts.filter(c => c.status === "review").length;
  const activeCount   = contracts.filter(c => c.status === "active").length;
  const rejectedCount = contracts.filter(c => c.status === "rejected").length;
  const totalValue    = contracts.filter(c => c.status === "active").reduce((s, c) => s + Number(c.valueAed), 0);
  const totalVolume   = contracts.filter(c => c.status === "active").reduce((s, c) => s + c.volumeLiters, 0);
  const escrowValue   = contracts.filter(c => c.status === "active").reduce((s, c) => s + Number(c.valueAed) * 0.3, 0);

  const filtered = contracts.filter(c => {
    const matchTab = c.status === filterTab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.clientName.includes(q) ||
      c.contractNumber.toLowerCase().includes(q) ||
      (c.location ?? "").includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div dir="rtl" style={{ background: "#f3fbff", minHeight: "100vh" }}>

      {/* ── Hero Banner ── */}
      <div style={{ background: "linear-gradient(135deg, #0a2e44 0%, #0c4a6e 50%, #0284c7 100%)", padding: "32px 36px 28px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              دورة حياة العقود
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 10px" }}>إدارة العقود التجارية</h2>
            <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>
              راجع عروض المؤسسات، اقبل عقود الطلب الفوري عالية الحجم، وتابع أداء العقود النشطة وإيرادات الضمان في الوقت الفعلي.
            </p>
          </div>
          <button
            onClick={() => { setFilterTab("review"); }}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "10px 18px", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            📋 مراجعة العروض ({reviewCount})
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 28 }}>
          {[
            { label: "عقود نشطة",    value: activeCount.toString(),       sub: "جارية الآن",     icon: "✅" },
            { label: "بانتظار الرد", value: reviewCount.toString(),        sub: "عرض جديد",       icon: "⏳" },
            { label: "إيراد محتجز",  value: fmtAED(escrowValue),           sub: "ضمان مغلق",      icon: "🔒" },
            { label: "حجم تعاقدي",   value: fmtVol(totalVolume),           sub: "إجمالي مياه",    icon: "💧" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{stat.icon}</span><span>{stat.sub}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ padding: "20px 36px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#6b8aa0", fontWeight: 500 }}>
          عرض {filtered.length} من {contracts.length} عقد
        </span>
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#8eb5c8" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المؤسسة أو رقم العقد أو المنطقة..."
            style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1px solid #d8eef8", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: "white", direction: "rtl" }}
          />
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ padding: "14px 36px 0", display: "flex", gap: 8 }}>
        {([
          ["review",   `قيد المراجعة (${reviewCount})`],
          ["active",   `النشطة (${activeCount})`],
          ["rejected", `المرفوضة (${rejectedCount})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilterTab(id)}
            style={{
              padding: "8px 18px", borderRadius: 22, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
              background: filterTab === id ? (id === "active" ? "#0ea5e9" : id === "rejected" ? "#dc2626" : "#d97706") : "white",
              color: filterTab === id ? "white" : "#6b8aa0",
              borderColor: filterTab === id ? "transparent" : "#d8eef8",
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Cards Grid ── */}
      <div style={{ padding: "20px 36px 48px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8eb5c8" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #d8eef8", borderTopColor: "#0ea5e9", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
            <p>جارٍ تحميل العقود...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8eb5c8", background: "white", borderRadius: 14, border: "1px dashed #c7e3f2" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>لا توجد عقود في هذه الفئة</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {filtered.map(contract => {
              const st = STATUS_CONFIG[contract.status];
              const pr = PRIORITY_CONFIG[contract.priority];
              return (
                <div
                  key={contract.id}
                  style={{ background: "white", border: "1px solid #d8eef8", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.15s, transform 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7dd3fc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d8eef8"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                >
                  {/* Card Header */}
                  <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #f0f9ff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dff4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#12384f" }}>{contract.clientName}</div>
                          <div style={{ fontSize: 11, color: "#8eb5c8", fontWeight: 500 }}>{contract.contractNumber}</div>
                        </div>
                      </div>
                      <span style={{ background: pr.bg, color: pr.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{pr.label}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "14px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#f8fcff", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>الحجم</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{fmtVol(contract.volumeLiters)}</div>
                      </div>
                      <div style={{ background: "#f8fcff", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>القيمة</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>{fmtAED(contract.valueAed)}</div>
                      </div>
                    </div>

                    {contract.location && (
                      <div style={{ fontSize: 12, color: "#6b8aa0", display: "flex", alignItems: "center", gap: 5 }}>
                        <span>📍</span><span>{contract.location}</span>
                      </div>
                    )}

                    {contract.startDate && (
                      <div style={{ fontSize: 12, color: "#6b8aa0", display: "flex", alignItems: "center", gap: 5 }}>
                        <span>📅</span>
                        <span>{fmtDate(contract.startDate)}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{st.label}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ padding: "12px 18px", borderTop: "1px solid #f0f9ff" }}>
                    <button
                      onClick={() => setDetail({ ...contract, tab: "overview" })}
                      style={{ width: "100%", padding: "9px 0", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      عرض التفاصيل <span style={{ fontSize: 16 }}>←</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <ContractDetail
          contract={detail}
          onClose={() => setDetail(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
