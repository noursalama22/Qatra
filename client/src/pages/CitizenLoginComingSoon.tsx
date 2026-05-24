import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function CitizenLoginComingSoon() {
  return (
    <main className="citizen-soon-page" dir="rtl">
      <div className="citizen-soon-card">
        <Link to="/" className="auth-back">
          ← العودة للرئيسية
        </Link>
        <Logo />
        <h1>تجربة المواطن قريباً</h1>
        <p>
          نعمل على تطبيق المواطن الكامل — إشارات الحاجة، الطلب التجاري، وتتبع التسليم لحظة بلحظة.
          سيتوفر قريباً على الويب والجوال.
        </p>
        <div className="citizen-soon-actions">
          <Link to="/login/provider" className="landing-btn landing-btn-primary" style={{ width: "100%" }}>
            دخول كمزود خدمة
          </Link>
          <Link to="/" className="landing-btn landing-btn-outline" style={{ width: "100%" }}>
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
