import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import { api } from "../api";
import type { AuthUser } from "../components/RequireRole";

const CITIZEN_COLOR = "#0369a1";

type AuthMode = "login" | "register";

type CitizenAuthForm = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

const emptyForm = (): CitizenAuthForm => ({
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
});

export default function CitizenAuth({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState<CitizenAuthForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    if (next === "login") {
      setForm(draft => ({ ...draft, firstName: "", lastName: "" }));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = mode === "login"
        ? await api.post<AuthUser>("/auth/citizen/login", {
            phone: form.phone,
            password: form.password,
          })
        : await api.post<AuthUser>("/auth/citizen/register", form);
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إتمام العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page citizen-auth-page" dir="rtl">
      <section className="auth-panel citizen-auth-panel">
        <Link to="/" className="auth-back">
          ← العودة للرئيسية
        </Link>

        <div className="auth-brand">
          <Logo />
          <p style={{ marginTop: 8 }}>حساب المواطن</p>
        </div>

        <div className="auth-intent-label">تسجيل الدخول أو إنشاء حساب جديد</div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab-active" : ""}
            style={mode === "login" ? { background: CITIZEN_COLOR } : undefined}
            onClick={() => switchMode("login")}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab-active" : ""}
            style={mode === "register" ? { background: CITIZEN_COLOR } : undefined}
            onClick={() => switchMode("register")}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <div className="auth-grid">
              <label className="form-label">
                الاسم الأول
                <input
                  className="form-control"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="form-label">
                اسم العائلة
                <input
                  className="form-control"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>
          )}

          <label className="form-label">
            رقم الهاتف
            <input
              className="form-control"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="05X XXX XXXX"
              autoComplete="tel"
              required
            />
          </label>

          <label className="form-label">
            كلمة المرور
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
            />
          </label>

          {mode === "register" && (
            <p className="citizen-auth-hint">كلمة المرور 8 أحرف على الأقل</p>
          )}

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            style={{ background: CITIZEN_COLOR }}
            disabled={loading}
          >
            {loading ? "جارٍ المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
      </section>
    </main>
  );
}
