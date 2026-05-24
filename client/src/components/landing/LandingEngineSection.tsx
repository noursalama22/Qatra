const steps = [
  {
    icon: "📝",
    title: "العقد والقفل",
    desc: "تُحدّد المنظمة عقداً رئيسياً — تُقفل الأموال فوراً في حساب ضمان آمن.",
    tone: "water",
  },
  {
    icon: "📍",
    title: "إرسال بسياج جغرافي",
    desc: "يُعيّن المزود سائقاً. إحداثيات GPS تتدفق مباشرة إلى غرفة العمليات.",
    tone: "water",
  },
  {
    icon: "✅",
    title: "تسليم موثّق",
    desc: "يؤكد السياج الوصول. يرفع السائق إثباتاً بالصورة — يتحقق النظام من الموقع والحجم.",
    tone: "teal",
  },
  {
    icon: "💸",
    title: "دفع مقسّم تلقائياً",
    desc: "يُفرج الضمان فوراً بين المزود والسائق ورسوم المنصة.",
    tone: "amber",
  },
];

export default function LandingEngineSection() {
  return (
    <section id="engine" className="landing-section">
      <div className="landing-container">
        <div className="landing-section-head">
          <span className="landing-section-tag">المحرك</span>
          <h2>
            الضمان واللوجستيات، <span className="landing-gradient-text">منسّقة بدقة.</span>
          </h2>
          <p>من توقيع العقد إلى الدفع الفوري — كل قطرة مُتتبّعة، وكل مبلغ محسوب.</p>
        </div>

        <div className="landing-steps">
          {steps.map((s, i) => (
            <article key={s.title} className="landing-step-card">
              <div className={`landing-step-icon ${s.tone}`}>{s.icon}</div>
              <div className="landing-step-num">الخطوة {String(i + 1).padStart(2, "0")}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
