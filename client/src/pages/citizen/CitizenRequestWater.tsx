import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCitizenContext } from "../../contexts/CitizenContext";
import {
  PAYMENT_METHODS,
  QUANTITY_PRESETS,
  calcOrderPricing,
  paymentMethodLabel,
  type PaymentMethod,
  type PlaceOrderPayload,
} from "../../constants/citizenOrder";

type Step = "details" | "summary";

function defaultScheduledValue() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CitizenRequestWater() {
  const { providerId: providerIdParam } = useParams<{ providerId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { providers, placeOrder, isOnline } = useCitizenContext();

  const initialProvider =
    providerIdParam ?? searchParams.get("provider") ?? providers[0]?.id ?? "";

  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    providerId: initialProvider,
    quantityLiters: "500",
    scheduledAt: defaultScheduledValue(),
    paymentMethod: "wallet" as PaymentMethod,
    deliveryNote: "",
  });

  const provider = providers.find(p => p.id === form.providerId);
  const liters = Number(form.quantityLiters);
  const pricing = useMemo(
    () => (liters > 0 ? calcOrderPricing(liters) : null),
    [liters],
  );

  const canContinue =
    Boolean(form.providerId) &&
    liters > 0 &&
    Boolean(form.scheduledAt) &&
    Boolean(form.paymentMethod);

  const goToSummary = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canContinue) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    const scheduled = new Date(form.scheduledAt);
    if (scheduled.getTime() < Date.now() - 60_000) {
      setError("وقت التوصيل يجب أن يكون في المستقبل");
      return;
    }
    setStep("summary");
  };

  const confirmOrder = async () => {
    if (!pricing || !canContinue) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: PlaceOrderPayload = {
        providerId: form.providerId,
        quantityLiters: liters,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        paymentMethod: form.paymentMethod,
        deliveryNote: form.deliveryNote.trim() || undefined,
      };
      const order = await placeOrder(payload);
      navigate(`/citizen/orders/${order.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إتمام الطلب");
      setSubmitting(false);
    }
  };

  if (providers.length === 0) {
    return (
      <div className="citizen-pwa-page">
        <div className="citizen-pwa-empty">
          <p>لا يوجد مزودون متاحون حالياً</p>
          <Link to="/citizen/market" className="btn btn-outline">العودة للسوق</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-pwa-page citizen-request-page">
      <div className="citizen-request-steps" aria-label="خطوات الطلب">
        <div className={`citizen-request-step${step === "details" ? " citizen-request-step-active" : " citizen-request-step-done"}`}>
          <span>1</span> التفاصيل
        </div>
        <div className={`citizen-request-step${step === "summary" ? " citizen-request-step-active" : ""}`}>
          <span>2</span> المراجعة والتأكيد
        </div>
      </div>

      {!isOnline && (
        <div className="citizen-pwa-offline-banner" role="status">
          أنت غير متصل — أكمل الطلب عند عودة الاتصال
        </div>
      )}

      {step === "details" && (
        <form onSubmit={goToSummary} className="citizen-request-form">
          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">مزود الخدمة</h2>
            <label className="form-label">
              اختر المزود
              <select
                className="form-control"
                value={form.providerId}
                onChange={e => setForm(f => ({ ...f, providerId: e.target.value }))}
                required
              >
                <option value="">— اختر مزوداً —</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </label>
            {provider?.description && (
              <p className="citizen-request-hint">{provider.description}</p>
            )}
          </section>

          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">كمية المياه</h2>
            <div className="qty-buttons">
              {QUANTITY_PRESETS.map(q => (
                <button
                  key={q}
                  type="button"
                  className={`qty-btn ${form.quantityLiters === String(q) ? "qty-btn-active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, quantityLiters: String(q) }))}
                >
                  {q.toLocaleString()} لتر
                </button>
              ))}
            </div>
            <label className="form-label" style={{ marginTop: 12 }}>
              أو أدخل كمية مخصصة (لتر)
              <input
                className="form-control"
                type="number"
                min={100}
                step={50}
                value={form.quantityLiters}
                onChange={e => setForm(f => ({ ...f, quantityLiters: e.target.value }))}
                required
              />
            </label>
          </section>

          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">وقت التوصيل المطلوب</h2>
            <label className="form-label">
              التاريخ والوقت
              <input
                className="form-control"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                required
              />
            </label>
            <p className="citizen-request-hint">سيحاول المزود الوصول في النافذة الزمنية المحددة</p>
          </section>

          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">طريقة الدفع</h2>
            <div className="citizen-payment-options">
              {PAYMENT_METHODS.map(method => (
                <label
                  key={method.id}
                  className={`citizen-payment-option${form.paymentMethod === method.id ? " citizen-payment-option-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={form.paymentMethod === method.id}
                    onChange={() => setForm(f => ({ ...f, paymentMethod: method.id }))}
                  />
                  <div>
                    <strong>{method.label}</strong>
                    <span>{method.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">ملاحظات إضافية (اختياري)</h2>
            <label className="form-label">
              تعليمات للسائق
              <textarea
                className="form-control"
                rows={3}
                placeholder="مثال: باب المبنى الخلفي، اتصل عند الوصول..."
                value={form.deliveryNote}
                onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))}
              />
            </label>
          </section>

          {pricing && (
            <div className="citizen-request-estimate">
              <span>التقدير الأولي</span>
              <strong>{pricing.total.toFixed(2)} ₪</strong>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="citizen-request-actions">
            <Link to="/citizen/market" className="btn btn-outline">إلغاء</Link>
            <button type="submit" className="btn btn-primary citizen-pwa-cta-inline" disabled={!canContinue}>
              متابعة للمراجعة
            </button>
          </div>
        </form>
      )}

      {step === "summary" && pricing && (
        <div className="citizen-request-summary">
          <section className="citizen-request-section card">
            <h2 className="citizen-request-section-title">ملخص الطلب</h2>

            <dl className="citizen-summary-dl">
              <div>
                <dt>المزود</dt>
                <dd>{provider?.companyName ?? "—"}</dd>
              </div>
              <div>
                <dt>الكمية</dt>
                <dd>{liters.toLocaleString()} لتر</dd>
              </div>
              <div>
                <dt>وقت التوصيل</dt>
                <dd>
                  {new Date(form.scheduledAt).toLocaleString("ar-SY", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt>طريقة الدفع</dt>
                <dd>{paymentMethodLabel(form.paymentMethod)}</dd>
              </div>
              {form.deliveryNote.trim() && (
                <div>
                  <dt>ملاحظات</dt>
                  <dd>{form.deliveryNote.trim()}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="citizen-invoice-card">
            <h3>تفاصيل الفاتورة</h3>
            <div className="citizen-invoice-rows">
              <div className="citizen-invoice-row">
                <span>المياه ({liters.toLocaleString()} لتر)</span>
                <strong>{pricing.subtotal.toFixed(2)} ₪</strong>
              </div>
              <div className="citizen-invoice-row">
                <span>رسوم التوصيل</span>
                <strong>{pricing.deliveryFee.toFixed(2)} ₪</strong>
              </div>
              <div className="citizen-invoice-row citizen-invoice-total">
                <span>الإجمالي</span>
                <strong>{pricing.total.toFixed(2)} ₪</strong>
              </div>
            </div>
          </section>

          <p className="citizen-request-legal">
            بالضغط على «تأكيد الطلب» فإنك توافق على شروط الخدمة التجارية وعلى خصم المبلغ حسب طريقة الدفع المختارة.
          </p>

          {error && <div className="form-error">{error}</div>}

          <div className="citizen-request-actions">
            <button type="button" className="btn btn-outline" onClick={() => setStep("details")} disabled={submitting}>
              تعديل التفاصيل
            </button>
            <button
              type="button"
              className="btn btn-primary citizen-pwa-cta-inline"
              onClick={confirmOrder}
              disabled={submitting || !isOnline}
            >
              {submitting ? "جارٍ تأكيد الطلب…" : "تأكيد الطلب"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
