import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function LandingCTAFooter() {
  return (
    <>
      <section className="landing-cta">
        <div className="landing-container">
          <h2>
            جاهز لتحسين <span className="landing-gradient-text">لوجستيات المياه</span> لديك؟
          </h2>
          <p>
            انضم إلى المنظمات ومزودي الخدمة والسائقين والمواطنين الذين يحرّكون المياه بذكاء وسرعة
            وشفافية.
          </p>
          <div className="landing-cta-actions">
            <Link to="/login/provider" className="landing-btn landing-btn-white landing-btn-lg">
              دخول مزود الخدمة
            </Link>
            <Link to="/login/citizen" className="landing-btn landing-btn-ghost landing-btn-lg">
              تجربة المواطن
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <Logo variant="light" />
            <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7 }}>
              توزيع مياه ذكي للمنظومات الإنسانية والتجارية.
            </p>
          </div>
          {[
            {
              title: "المنصة",
              links: ["المنظمات", "مزودو الخدمة", "السائقون", "المواطنون"],
            },
            {
              title: "الشركة",
              links: ["من نحن", "الأثر", "الشركاء", "الوظائف"],
            },
            {
              title: "الموارد",
              links: ["التوثيق", "واجهة API", "الحالة", "تواصل"],
            },
          ].map(col => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#top">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="landing-container landing-footer-bottom">
          <span>© 2026 قطرة. جميع الحقوق محفوظة.</span>
          <span>العربية</span>
        </div>
      </footer>
    </>
  );
}
