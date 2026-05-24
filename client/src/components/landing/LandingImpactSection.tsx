import CountUp from "../CountUp";

const stats = [
  { icon: "💧", value: 12.5, suffix: "M+", label: "لتر مياه تم توزيعه", decimals: 1 },
  { icon: "⏱️", value: 98.4, suffix: "%", label: "تسليم في الوقت ضمن السياج", decimals: 1 },
  { icon: "🤝", value: 45, suffix: "+", label: "شريك إنساني وتجاري" },
  { icon: "📉", value: 0.02, prefix: "<$", label: "متوسط التكلفة اللوجستية للتر", decimals: 2 },
];

export default function LandingImpactSection() {
  return (
    <section id="impact" className="landing-section landing-section-alt">
      <div className="landing-container">
        <div className="landing-section-head">
          <span className="landing-section-tag">أثر مباشر</span>
          <h2>تغيير قابل للقياس، قطرةً قطرةً.</h2>
        </div>

        <div className="landing-impact-grid">
          {stats.map(s => (
            <div key={s.label} className="landing-impact-card">
              <div className="icon">{s.icon}</div>
              <div className="value">
                <CountUp
                  end={s.value}
                  suffix={s.suffix ?? ""}
                  prefix={s.prefix ?? ""}
                  decimals={s.decimals ?? 0}
                />
              </div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
