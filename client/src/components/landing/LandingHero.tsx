import { Link } from "react-router-dom";

export default function LandingHero() {
  return (
    <section id="top" className="landing-hero">
      <div className="landing-container landing-hero-grid">
        <div>
          <div className="landing-badge">💧 منصة لوجستيات المياه الذكية</div>
          <h1>
            توزيع مياه ذكي.
            <br />
            <span className="landing-gradient-text">في كل مكان، بشفافية.</span>
          </h1>
          <p className="landing-hero-lead">
            قطرة هي المنظومة التي تنسّق توزيع المياه — تتبع لحظي، تمويل ضمان آمن، وخرائط جغرافية
            للإغاثة الإنسانية والطلب التجاري.
          </p>
          <div className="landing-hero-cta">
            <a href="#solutions" className="landing-btn landing-btn-primary landing-btn-lg">
              استكشف لوحات التحكم ←
            </a>
            <Link to="/login/provider" className="landing-btn landing-btn-outline landing-btn-lg">
              دخول مزود الخدمة
            </Link>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <strong>+12.5M</strong>
              <span>لتر تم توصيله</span>
            </div>
            <div className="landing-hero-stat">
              <strong>98.4%</strong>
              <span>التزام بالمواعيد</span>
            </div>
            <div className="landing-hero-stat">
              <strong>+45</strong>
              <span>شريك</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-droplet-wrap" aria-hidden>
            <svg viewBox="0 0 200 240">
              <defs>
                <linearGradient id="hero-droplet" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <filter id="hero-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="100" cy="200" rx="60" ry="12" fill="rgba(56,189,248,0.2)" />
              <path
                d="M100 20 C 55 90, 35 120, 35 155 a65 65 0 0 0 130 0 C 165 120, 145 90, 100 20 Z"
                fill="url(#hero-droplet)"
                filter="url(#hero-glow)"
              />
              <circle cx="100" cy="158" r="14" fill="white" opacity="0.9" />
              <circle cx="100" cy="158" r="6" fill="#2563eb" />
            </svg>
          </div>

          <div className="landing-float-card top">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--landing-muted)" }}>شحنة #4821</span>
              <span className="landing-status-dot" />
            </div>
            <h4>الحالة: في الطريق</h4>
            <div className="row">
              <span>الحجم</span>
              <strong>15,000 لتر</strong>
            </div>
            <div className="row">
              <span>الضمان</span>
              <strong style={{ color: "var(--landing-success)" }}>🔒 مقفل</strong>
            </div>
          </div>

          <div className="landing-float-card bottom">
            <div className="muted">سياج جغرافي مباشر</div>
            <h4>حي النور، المنطقة أ-3</h4>
            <div className="row">
              <span className="landing-status-dot" /> دخل السائق نطاق التسليم
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
