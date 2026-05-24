import CitizenNavIcon from "../../components/citizen/CitizenNavIcon";

const TRANSACTIONS = [
  { id: "1", title: "شراء مياه صالحة للشرب", date: "22 مايو 2026", time: "10:30 ص", amount: -45, status: "مكتمل" },
  { id: "2", title: "شحن المحفظة", date: "20 مايو 2026", time: "04:15 م", amount: 100, status: "مكتمل" },
  { id: "3", title: "استرداد طلب ملغى", date: "18 مايو 2026", time: "09:00 ص", amount: 15, status: "مسترد" },
  { id: "4", title: "دفع سريع — محطة الهدى", date: "15 مايو 2026", time: "02:20 م", amount: -70, status: "مكتمل" },
];

export default function CitizenWallet() {
  return (
    <div className="citizen-pwa-page citizen-wallet-layout">
      <div className="citizen-wallet-top">
      <div className="citizen-wallet-card">
        <span className="citizen-wallet-label">الرصيد الحالي</span>
        <strong className="citizen-wallet-balance">₪ 150</strong>
        <span className="citizen-wallet-updated">آخر تحديث: منذ دقيقتين</span>
        <button type="button" className="citizen-wallet-topup">+ شحن المحفظة</button>
      </div>

      <div className="citizen-wallet-quick">
        <button type="button" className="citizen-wallet-quick-btn">
          <span className="citizen-wallet-quick-icon" aria-hidden>
            <CitizenNavIcon name="wallet" />
          </span>
          <span>دفع سريع</span>
        </button>
        <button type="button" className="citizen-wallet-quick-btn citizen-wallet-quick-teal">
          <span className="citizen-wallet-quick-icon" aria-hidden>
            <CitizenNavIcon name="transfer" />
          </span>
          <span>تحويل رصيد</span>
        </button>
      </div>
      </div>

      <section className="citizen-pwa-section">
        <div className="citizen-pwa-section-head">
          <button type="button" className="citizen-pwa-link">عرض الكل</button>
          <h3>سجل العمليات</h3>
        </div>

        <div className="citizen-tx-list">
          {TRANSACTIONS.map(tx => (
            <article key={tx.id} className="citizen-tx-row">
              <span className="citizen-tx-icon" aria-hidden>
                {tx.amount > 0 ? "💰" : "💧"}
              </span>
              <div className="citizen-tx-copy">
                <strong>{tx.title}</strong>
                <span>{tx.date} · {tx.time}</span>
              </div>
              <div className="citizen-tx-amount">
                <strong className={tx.amount > 0 ? "citizen-tx-credit" : "citizen-tx-debit"}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)} ₪
                </strong>
                <small>{tx.status}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="citizen-wallet-security">
        <span aria-hidden>ℹ️</span>
        <p>أمان معاملاتك: جميع المدفوعات مشفّرة ومحمية وفق معايير المنصة.</p>
      </div>
    </div>
  );
}
