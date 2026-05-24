import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CitizenProviderIcon from "../../components/citizen/CitizenProviderIcon";
import { useCitizenContext } from "../../contexts/CitizenContext";
import { PRICE_PER_LITER, QUANTITY_PRESETS } from "../../constants/citizenOrder";

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "drinking", label: "مياه شرب" },
  { id: "tanks", label: "خزانات" },
  { id: "desal", label: "مياه تحلية" },
];

const ETA_MINUTES = [45, 60, 30];

export default function CitizenMarket() {
  const { providers, isOnline } = useCitizenContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers.filter(p => !q || p.companyName.toLowerCase().includes(q));
  }, [providers, query]);

  const startRequest = (providerId?: string) => {
    if (providerId) {
      navigate(`/citizen/market/request/${providerId}`);
    } else {
      navigate("/citizen/market/request");
    }
  };

  return (
    <div className="citizen-pwa-page citizen-market-layout">
      {!isOnline && (
        <div className="citizen-pwa-offline-banner" role="status">
          أنت غير متصل — قد لا تتمكن من إتمام الطلب
        </div>
      )}

      <section className="citizen-pwa-section">
        <div className="citizen-pwa-section-head">
          <Link to="/citizen/market/request" className="btn btn-primary btn-sm">
            طلب جديد
          </Link>
          <h2 className="citizen-pwa-page-title">مزودو المياه</h2>
        </div>
        <div className="citizen-search-wrap">
          <input
            type="search"
            className="form-control citizen-search"
            placeholder="ابحث عن مورد مياه..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="بحث عن مورد"
          />
          <span className="citizen-search-icon" aria-hidden>🔍</span>
        </div>
      </section>

      <div className="citizen-chips" role="tablist" aria-label="فئات المنتجات">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`citizen-chip${category === cat.id ? " citizen-chip-active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="citizen-feature-banner">
        <div className="citizen-feature-copy">
          <h3>توصيل طارئ؟</h3>
          <p>نوفر لك مياه نظيفة تصل لباب منزلك في غزة والوسطى خلال ساعة.</p>
          <button type="button" className="citizen-feature-btn" onClick={() => filtered[0] && startRequest(filtered[0].id)}>
            اطلب الآن
          </button>
        </div>
      </div>

      <section className="citizen-pwa-section">
        <h3 className="citizen-pwa-section-label">الموردون المتاحون</h3>

        {filtered.length === 0 ? (
          <p className="citizen-pwa-empty">لا يوجد موردون متاحون حالياً</p>
        ) : (
          <div className="citizen-supplier-list">
            {filtered.map((provider, index) => {
              const liters = QUANTITY_PRESETS[index % QUANTITY_PRESETS.length];
              const price = (liters * PRICE_PER_LITER).toFixed(0);
              const eta = ETA_MINUTES[index % ETA_MINUTES.length];
              const iconVariant = (["plant", "truck", "droplet"] as const)[index % 3];
              return (
                <article key={provider.id} className="citizen-supplier-card">
                  <div className="citizen-supplier-thumb" aria-hidden>
                    <CitizenProviderIcon variant={iconVariant} />
                  </div>
                  <div className="citizen-supplier-body">
                    <div className="citizen-supplier-top">
                      <span className="citizen-rating">⭐ {4.9 - index * 0.1}</span>
                      <h4>{provider.companyName}</h4>
                    </div>
                    <p className="citizen-supplier-eta">🕐 توصيل خلال {eta} دقيقة · من {price} ₪</p>
                    <div className="citizen-supplier-foot">
                      <button
                        type="button"
                        className="citizen-supplier-order"
                        onClick={() => startRequest(provider.id)}
                      >
                        ابدأ الطلب ({liters.toLocaleString()} لتر)
                      </button>
                      <span aria-hidden>‹</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
