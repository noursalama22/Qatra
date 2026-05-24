import { useCallback, useEffect, useState } from "react";
import type { NgoContract, Region, RegionProvider } from "../../api";

const MY_NGO_ID = "seed-n1";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: "نشط", cls: "badge-green" },
  pending: { label: "بانتظار الموافقة", cls: "badge-amber" },
  expired: { label: "منتهٍ", cls: "badge-gray" },
  cancelled: { label: "ملغي", cls: "badge-gray" },
};

type Props = {
  onToast: (msg: string) => void;
};

export default function NgoContractsTab({ onToast }: Props) {
  const [contracts, setContracts] = useState<NgoContract[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionProviders, setRegionProviders] = useState<RegionProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<RegionProvider | null>(null);
  const [dailyQty, setDailyQty] = useState("");

  const loadContracts = useCallback(async () => {
    const res = await fetch(`/api/ngos/${MY_NGO_ID}/contracts`).then(r => r.json());
    setContracts(res.data ?? []);
  }, []);

  const loadRegions = useCallback(async () => {
    const res = await fetch("/api/regions").then(r => r.json());
    setRegions(res.data ?? []);
  }, []);

  useEffect(() => {
    Promise.all([loadContracts(), loadRegions()]).finally(() => setLoading(false));
  }, [loadContracts, loadRegions]);

  useEffect(() => {
    if (!selectedRegion) {
      setRegionProviders([]);
      setSelectedProvider(null);
      return;
    }
    fetch(`/api/regions/${selectedRegion}/providers`)
      .then(r => r.json())
      .then(res => setRegionProviders(res.data ?? []));
    setSelectedProvider(null);
  }, [selectedRegion]);

  const qty = Number(dailyQty) || 0;
  const dailyCost = selectedProvider ? qty * parseFloat(selectedProvider.pricePerLiter) : 0;
  const monthlyCost = dailyCost * 30;

  const resetForm = () => {
    setShowForm(false);
    setSelectedRegion("");
    setSelectedProvider(null);
    setDailyQty("");
  };

  const submitContract = async () => {
    if (!selectedRegion || !selectedProvider || qty <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ngos/${MY_NGO_ID}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: selectedRegion,
          providerId: selectedProvider.id,
          dailyQuantityLiters: dailyQty,
          pricePerLiter: selectedProvider.pricePerLiter,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "فشل إنشاء العقد");
      }
      await loadContracts();
      onToast("تم إنشاء العقد بنجاح");
      resetForm();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = contracts.filter(c => c.status === "active").length;

  return (
    <div className="ngo-contracts-tab" dir="rtl">
      <div className="ngo-contracts-header">
        <div>
          <h3 className="section-title">العقود مع مزودي الخدمة</h3>
          <p className="ngo-section-sub">إدارة التعاقدات اليومية حسب المنطقة · {activeCount} عقد نشط</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + عقد جديد
        </button>
      </div>

      {loading ? (
        <div className="empty-state">جارٍ التحميل...</div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 15, fontWeight: 700, color: "#12384f", marginBottom: 6 }}>لا توجد عقود بعد</div>
          <div style={{ fontSize: 13, color: "#8eb5c8" }}>أنشئ عقداً جديداً لربط منظمتك بمزود مياه في منطقة محددة</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>إنشاء أول عقد</button>
        </div>
      ) : (
        <div className="ngo-contracts-grid">
          {contracts.map(c => {
            const st = STATUS_LABELS[c.status] ?? STATUS_LABELS.pending;
            const daily = parseFloat(c.dailyQuantityLiters);
            const price = parseFloat(c.pricePerLiter);
            return (
              <div key={c.id} className="ngo-contract-card">
                <div className="ngo-contract-card-top">
                  <div>
                    <div className="ngo-contract-provider">{c.providerName}</div>
                    <div className="ngo-contract-region">{c.regionName}</div>
                  </div>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                <div className="ngo-contract-stats">
                  <div className="ngo-contract-stat">
                    <span className="ngo-contract-stat-val">{daily.toLocaleString()}</span>
                    <span className="ngo-contract-stat-lbl">لتر / يوم</span>
                  </div>
                  <div className="ngo-contract-stat">
                    <span className="ngo-contract-stat-val">${price.toFixed(3)}</span>
                    <span className="ngo-contract-stat-lbl">/ لتر</span>
                  </div>
                  <div className="ngo-contract-stat">
                    <span className="ngo-contract-stat-val" style={{ color: "#0891b2" }}>
                      ${(daily * price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="ngo-contract-stat-lbl">تكلفة يومية</span>
                  </div>
                </div>
                <div className="ngo-contract-footer">
                  <span>بدء: {new Date(c.startDate).toLocaleDateString("ar-SY")}</span>
                  {c.notes && <span className="ngo-contract-note">{c.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <>
          <div className="ngo-drawer-overlay" onClick={resetForm} />
          <div className="ngo-contract-drawer" dir="rtl">
            <div className="ngo-drawer-head">
              <div>
                <div style={{ fontSize: 11, color: "#6b8aa0", marginBottom: 3 }}>عقد جديد</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#12384f" }}>ربط مزود بمنطقة</div>
              </div>
              <button className="drawer-close" onClick={resetForm} aria-label="إغلاق">✕</button>
            </div>

            <div className="ngo-drawer-section">
              <label className="ngo-drawer-label" htmlFor="contract-region">اختر المنطقة</label>
              <select
                id="contract-region"
                className="ngo-select"
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
              >
                <option value="">— اختر منطقة —</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {selectedRegion && (
                <p className="ngo-field-hint">
                  {regions.find(r => r.id === selectedRegion)?.description}
                </p>
              )}
            </div>

            {selectedRegion && (
              <div className="ngo-drawer-section">
                <div className="ngo-drawer-label">مزودو الخدمة في هذه المنطقة</div>
                {regionProviders.length === 0 ? (
                  <p className="ngo-field-hint">لا يوجد مزودون معتمدون لهذه المنطقة</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {regionProviders.map(p => {
                      const isSelected = selectedProvider?.id === p.id;
                      const unitLabel = p.measurementUnit === "liter" ? "لتر" : p.measurementUnit;
                      return (
                        <div
                          key={p.id}
                          className={`ngo-prov-card ${isSelected ? "ngo-prov-card-selected" : ""}`}
                          onClick={() => setSelectedProvider(isSelected ? null : p)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && setSelectedProvider(isSelected ? null : p)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#12384f" }}>{p.companyName}</div>
                              <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 2 }}>
                                {p.operatingModes.includes("humanitarian") ? "إنساني" : "تجاري"}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "#0891b2" }}>
                                ${parseFloat(p.pricePerLiter).toFixed(3)}
                              </div>
                              <div style={{ fontSize: 10, color: "#8eb5c8" }}>/ {unitLabel}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedProvider && (
              <div className="ngo-drawer-section">
                <label className="ngo-drawer-label" htmlFor="contract-qty">الكمية المطلوبة يومياً (لتر)</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="contract-qty"
                    type="number"
                    className="ngo-qty-input"
                    placeholder="مثال: 30000"
                    value={dailyQty}
                    onChange={e => setDailyQty(e.target.value)}
                    min="1000"
                  />
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#8eb5c8", fontWeight: 600 }}>لتر</span>
                </div>
                {qty > 0 && (
                  <div className="ngo-escrow-notice" style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span>تكلفة يومية</span>
                      <span style={{ fontWeight: 700, color: "#0891b2" }}>${dailyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span>تقدير شهري (30 يوم)</span>
                      <span style={{ fontWeight: 700 }}>${monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "13px", justifyContent: "center" }}
                disabled={!selectedProvider || qty <= 0 || submitting}
                onClick={submitContract}
              >
                {submitting ? "جارٍ الإنشاء..." : "تأكيد العقد"}
              </button>
              <button className="btn btn-outline" style={{ width: "100%", marginTop: 8 }} onClick={resetForm}>إلغاء</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
