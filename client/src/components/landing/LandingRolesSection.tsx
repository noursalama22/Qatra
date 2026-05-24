import { useState } from "react";
import { Link } from "react-router-dom";

type Role = "org" | "provider" | "driver" | "citizen";

const tabs: { id: Role; label: string; sub: string; icon: string }[] = [
  { id: "org", label: "المنظمات", sub: "لوحة ويب", icon: "🏛️" },
  { id: "provider", label: "مزودو الخدمة", sub: "لوحة ويب", icon: "🚛" },
  { id: "driver", label: "السائقون", sub: "تطبيق جوال", icon: "📱" },
  { id: "citizen", label: "المواطنون", sub: "تطبيق جوال", icon: "👤" },
];

export default function LandingRolesSection() {
  const [active, setActive] = useState<Role>("provider");

  return (
    <section id="solutions" className="landing-section landing-section-alt">
      <div className="landing-container">
        <div className="landing-section-head">
          <span className="landing-section-tag">منظومة واحدة، أربعة أدوار</span>
          <h2>
            مصمّمة لكل حلقة في <span className="landing-gradient-text">سلسلة المياه</span>
          </h2>
          <p>من المنظمات الإنسانية إلى المواطن عند الصنبور — قطرة تربطهم في الوقت الفعلي.</p>
        </div>

        <div className="landing-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`landing-tab ${active === t.id ? "active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              <span>{t.icon}</span>
              <span>
                {t.label}
                <small>{t.sub}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="landing-panel">
          {active === "org" && (
            <div className="landing-panel-grid cols-3">
              <div>
                <h3>📅 تقويم التوزيع — ديسمبر</h3>
                <p style={{ fontSize: 13, color: "var(--landing-muted)", marginBottom: 12 }}>
                  تخطيط الشحنات الإنسانية مع مؤشرات التوفر اليومي.
                </p>
                <div className="landing-mini-card">
                  <strong>خريطة حرارية GIS</strong>
                  <span>12 منطقة ساخنة</span>
                </div>
              </div>
              <div className="landing-mini-card">
                <strong>ميزانية الضمان</strong>
                <span>$284,500 مقفلة — 68% مستخدمة</span>
                <div className="landing-progress">
                  <div style={{ width: "68%" }} />
                </div>
              </div>
              <div>
                <h3>عقود نشطة</h3>
                {["إغاثة حي السلام — 240k لتر", "مخيم الشمال — 180k لتر", "مدارس الشرق — 95k لتر"].map(
                  name => (
                    <div key={name} className="landing-mini-card" style={{ marginBottom: 8 }}>
                      <strong>{name}</strong>
                      <span>نشط</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {active === "provider" && (
            <div className="landing-panel-grid cols-3">
              <div className="landing-navy-card">
                <span style={{ fontSize: 12, opacity: 0.8 }}>إدارة الأسطول</span>
                <div className="stat">14 / 18</div>
                <span style={{ fontSize: 13 }}>شاحنة في مهمة</span>
              </div>
              <div>
                <h3>سائقون نشطون</h3>
                {["أحمد ك. — المنطقة أ-3", "يوسف م. — المنطقة ب-1", "خالد ر. — المستودع"].map(d => (
                  <div key={d} className="landing-mini-card" style={{ marginBottom: 8 }}>
                    <strong>{d}</strong>
                    <span>🟢 متصل</span>
                  </div>
                ))}
              </div>
              <div className="landing-mini-card" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
                <strong>عقد وارد: مساعدات الأمم المتحدة</strong>
                <span>120,000 لتر — $4,820 ضمان</span>
                <div style={{ marginTop: 16 }}>
                  <Link to="/login/provider" className="landing-btn landing-btn-primary" style={{ width: "100%" }}>
                    دخول لوحة المزود
                  </Link>
                </div>
              </div>
            </div>
          )}

          {active === "driver" && (
            <div style={{ textAlign: "center", maxWidth: 320, margin: "0 auto" }}>
              <div
                style={{
                  background: "var(--navy-deep)",
                  borderRadius: 32,
                  padding: 12,
                  color: "#fff",
                }}
              >
                <div style={{ background: "#f8fcff", borderRadius: 24, padding: 24, color: "var(--navy-deep)" }}>
                  <span style={{ fontSize: 11, color: "var(--landing-muted)" }}>لوحة السائق</span>
                  <h3 style={{ margin: "12px 0" }}>حي النور</h3>
                  <p style={{ fontSize: 13 }}>15,000 لتر — الوصول خلال 42 دقيقة</p>
                  <div className="landing-progress" style={{ margin: "16px 0" }}>
                    <div style={{ width: "60%" }} />
                  </div>
                  <Link to="/login/driver" className="landing-btn landing-btn-primary" style={{ width: "100%" }}>
                    بدء الرحلة
                  </Link>
                </div>
              </div>
            </div>
          )}

          {active === "citizen" && (
            <div className="landing-panel-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <span className="landing-section-tag">مساعدات مدعومة</span>
                <h3 style={{ margin: "12px 0" }}>أرسل إشارة عندما تحتاج مياهاً.</h3>
                <p style={{ fontSize: 14, color: "var(--landing-muted)", lineHeight: 1.7 }}>
                  أنشئ حساباً بسيطاً برقم هاتفك — المزيد من خطوات الإعداد قادمة قريباً.
                </p>
                <Link to="/login/citizen?mode=register" className="landing-btn landing-btn-primary landing-btn-lg" style={{ marginTop: 16 }}>
                  إنشاء حساب مواطن
                </Link>
              </div>
              <div className="landing-mini-card">
                <h3>تقدّم الطلب</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
                  {["مؤكد", "في الطريق", "وصل"].map((s, i) => (
                    <div key={s} style={{ textAlign: "center", flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: i < 2 ? "var(--water)" : "#e0f2fe",
                          color: i < 2 ? "#fff" : "var(--landing-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 11 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
