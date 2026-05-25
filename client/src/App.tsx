import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import AdminPortal from "./pages/AdminPortal";
import NgoPortal from "./pages/NgoPortal";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderContracts from "./pages/ProviderContracts";
import ProviderFleet from "./pages/ProviderFleet";
import ProviderTasks from "./pages/ProviderTasks";
import DriverInvite from "./pages/DriverInvite";
import NotificationBell from "./components/NotificationBell";
import DriverPortal from "./pages/DriverPortal";
import CitizenLayout from "./layouts/CitizenLayout";
import CitizenHome from "./pages/citizen/CitizenHome";
import CitizenMarket from "./pages/citizen/CitizenMarket";
import CitizenOrders from "./pages/citizen/CitizenOrders";
import CitizenOrderTrack from "./pages/citizen/CitizenOrderTrack";
import CitizenWallet from "./pages/citizen/CitizenWallet";
import CitizenRequestWater from "./pages/citizen/CitizenRequestWater";
import MapView from "./pages/MapView";
import LandingPage from "./pages/LandingPage";
import CitizenAuth from "./pages/CitizenAuth";
import AppLayout from "./layouts/AppLayout";
import RequireRole, { AuthUser } from "./components/RequireRole";
import Logo from "./components/Logo";
import { api, Provider, Zone } from "./api";
import { DEFAULT_NGO_PATH, ROLE_HOME, Role } from "./routes";

export type AuthIntent = "provider" | "driver" | "default";

type AuthMode = "login" | "register";

type AuthForm = {
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  adminAccessCode: string;
  orgName: string;
  country: string;
  companyName: string;
  contactEmail: string;
  description: string;
  operatingModes: string[];
  driverType: "owned" | "independent";
  providerId: string;
  phone: string;
  vehicleType: string;
  zoneId: string;
  lat: string;
  lng: string;
};

const ROLES: { id: Role; label: string; color: string }[] = [
  { id: "admin", label: "المشرف", color: "#0f5f8d" },
  { id: "ngo", label: "المنظمة", color: "#0891b2" },
  { id: "provider", label: "المزود", color: "#0284c7" },
  { id: "driver", label: "السائق", color: "#0ea5e9" },
  { id: "citizen", label: "المواطن", color: "#0369a1" },
];

const REGISTER_ROLES = ROLES.filter(role => role.id === "ngo" || role.id === "provider");

const emptyAuthForm = (): AuthForm => ({
  role: "ngo",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  adminAccessCode: "",
  orgName: "",
  country: "فلسطين",
  companyName: "",
  contactEmail: "",
  description: "",
  operatingModes: ["commercial"],
  driverType: "independent",
  providerId: "",
  phone: "",
  vehicleType: "",
  zoneId: "",
  lat: "",
  lng: "",
});

function AuthScreen({
  onAuth,
  intent = "default",
}: {
  onAuth: (user: AuthUser) => void;
  intent?: AuthIntent;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthForm>(() => ({
    ...emptyAuthForm(),
    role: intent === "provider" ? "provider" : intent === "driver" ? "driver" : "ngo",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "register" && !REGISTER_ROLES.some(role => role.id === form.role)) {
      setForm(draft => ({ ...draft, role: "ngo" }));
    }
  }, [mode, form.role]);

  const roleColor = ROLES.find(role => role.id === form.role)?.color ?? "#0ea5e9";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = mode === "login"
        ? await api.post<AuthUser>("/auth/login", { email: form.email, password: form.password })
        : await api.post<AuthUser>("/auth/register", form);
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إتمام العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-panel">
        <Link to="/" className="auth-back">
          ← العودة للرئيسية
        </Link>
        <div className="auth-brand">
          <Logo />
          <p style={{ marginTop: 8 }}>منصة توزيع المياه</p>
        </div>
        {intent === "provider" && (
          <div className="auth-intent-label">دخول مزود الخدمة — لوحة العمليات</div>
        )}
        {intent === "driver" && (
          <div className="auth-intent-label">دخول السائق — تطبيق التوزيع</div>
        )}

        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "auth-tab-active" : ""} onClick={() => setMode("login")}>تسجيل الدخول</button>
          {intent !== "driver" && (
            <button type="button" className={mode === "register" ? "auth-tab-active" : ""} onClick={() => setMode("register")}>إنشاء حساب</button>
          )}
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <div className="auth-role-grid">
                {REGISTER_ROLES.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    className={`auth-role-btn ${form.role === role.id ? "auth-role-active" : ""}`}
                    style={form.role === role.id ? { borderColor: role.color, color: role.color, background: role.color + "10" } : {}}
                    onClick={() => setForm(draft => ({ ...draft, role: role.id }))}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <div className="auth-grid">
                <label className="form-label">الاسم الأول<input className="form-control" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></label>
                <label className="form-label">اسم العائلة<input className="form-control" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></label>
              </div>
            </>
          )}

          <label className="form-label">البريد الإلكتروني<input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></label>
          <label className="form-label">كلمة المرور<input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} /></label>

          {mode === "register" && <RoleFields form={form} setForm={setForm} zones={[]} providers={[]} />}
          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary auth-submit" style={{ background: roleColor }} disabled={loading}>
            {loading ? "جارٍ المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function RoleFields({
  form,
  setForm,
  zones,
  providers,
  showAdminCode = false,
}: {
  form: AuthForm | (AuthForm & { currentPassword: string; newPassword: string });
  setForm: Dispatch<SetStateAction<any>>;
  zones: Zone[];
  providers: Provider[];
  showAdminCode?: boolean;
}) {
  if (form.role === "admin") {
    if (!showAdminCode) return null;
    return <label className="form-label">رمز المشرف<input className="form-control" value={form.adminAccessCode} onChange={e => setForm((f: AuthForm) => ({ ...f, adminAccessCode: e.target.value }))} placeholder="QATRA-ADMIN" /></label>;
  }

  if (form.role === "ngo") {
    return (
      <>
        <label className="form-label">اسم المنظمة<input className="form-control" value={form.orgName} onChange={e => setForm((f: AuthForm) => ({ ...f, orgName: e.target.value }))} required /></label>
        <div className="auth-grid">
          <label className="form-label">دولة العمل<input className="form-control" value={form.country} onChange={e => setForm((f: AuthForm) => ({ ...f, country: e.target.value }))} /></label>
          <label className="form-label">بريد التواصل<input className="form-control" type="email" value={form.contactEmail} onChange={e => setForm((f: AuthForm) => ({ ...f, contactEmail: e.target.value }))} /></label>
        </div>
        <label className="form-label">وصف مختصر<textarea className="form-control" value={form.description} onChange={e => setForm((f: AuthForm) => ({ ...f, description: e.target.value }))} /></label>
      </>
    );
  }

  if (form.role === "provider") {
    return (
      <>
        <label className="form-label">اسم الشركة<input className="form-control" value={form.companyName} onChange={e => setForm((f: AuthForm) => ({ ...f, companyName: e.target.value }))} required /></label>
        <label className="form-label">بريد التواصل<input className="form-control" type="email" value={form.contactEmail} onChange={e => setForm((f: AuthForm) => ({ ...f, contactEmail: e.target.value }))} /></label>
        <div className="auth-checks">
          {(["humanitarian", "commercial"] as const).map(mode => (
            <label key={mode}>
              <input
                type="checkbox"
                checked={form.operatingModes.includes(mode)}
                onChange={e => setForm((f: AuthForm) => ({
                  ...f,
                  operatingModes: e.target.checked ? [...f.operatingModes, mode] : f.operatingModes.filter(m => m !== mode),
                }))}
              />
              {mode === "humanitarian" ? "إنساني" : "تجاري"}
            </label>
          ))}
        </div>
        <label className="form-label">وصف الخدمة<textarea className="form-control" value={form.description} onChange={e => setForm((f: AuthForm) => ({ ...f, description: e.target.value }))} /></label>
      </>
    );
  }

  if (form.role === "driver") {
    return (
      <>
        <div className="auth-grid">
          <label className="form-label">نوع السائق<select className="form-control" value={form.driverType} onChange={e => setForm((f: AuthForm) => ({ ...f, driverType: e.target.value as AuthForm["driverType"] }))}><option value="independent">مستقل</option><option value="owned">تابع لمزود</option></select></label>
          <label className="form-label">رقم الهاتف<input className="form-control" value={form.phone} onChange={e => setForm((f: AuthForm) => ({ ...f, phone: e.target.value }))} /></label>
        </div>
        {form.driverType === "owned" && (
          <label className="form-label">المزود<select className="form-control" value={form.providerId} onChange={e => setForm((f: AuthForm) => ({ ...f, providerId: e.target.value }))}><option value="">اختر المزود</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.companyName}</option>)}</select></label>
        )}
        <label className="form-label">نوع المركبة<input className="form-control" value={form.vehicleType} onChange={e => setForm((f: AuthForm) => ({ ...f, vehicleType: e.target.value }))} /></label>
      </>
    );
  }

  return (
    <>
      <label className="form-label">المنطقة<select className="form-control" value={form.zoneId} onChange={e => setForm((f: AuthForm) => ({ ...f, zoneId: e.target.value }))} required>{zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
      <div className="auth-grid">
        <label className="form-label">خط العرض<input className="form-control" value={form.lat} onChange={e => setForm((f: AuthForm) => ({ ...f, lat: e.target.value }))} /></label>
        <label className="form-label">خط الطول<input className="form-control" value={form.lng} onChange={e => setForm((f: AuthForm) => ({ ...f, lng: e.target.value }))} /></label>
      </div>
    </>
  );
}

function UserContextOutlet({
  user,
  setUser,
}: {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
}) {
  const outletContext = useMemo(() => ({ user, setUser }), [user, setUser]);
  return <Outlet context={outletContext} />;
}

function AuthenticatedApp({
  user,
  setUser,
}: {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
}) {
  const logout = async () => {
    await api.post("/auth/logout", {});
    setUser(null);
  };

  return (
    <Routes>
      <Route element={<UserContextOutlet user={user} setUser={setUser} />}>
        <Route index element={<Navigate to={ROLE_HOME[user.role]} replace />} />

        <Route element={<RequireRole role="citizen" />}>
          <Route element={<CitizenLayout />}>
            <Route path="/citizen" element={<CitizenHome />} />
            <Route path="/citizen/market" element={<CitizenMarket />} />
            <Route path="/citizen/market/request" element={<CitizenRequestWater />} />
            <Route path="/citizen/market/request/:providerId" element={<CitizenRequestWater />} />
            <Route path="/citizen/orders" element={<CitizenOrders />} />
            <Route path="/citizen/orders/:orderId" element={<CitizenOrderTrack />} />
            <Route path="/citizen/wallet" element={<CitizenWallet />} />
          </Route>
        </Route>

        <Route element={<AppLayout user={user} setUser={setUser} onLogout={logout} />}>
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/admin/map" element={<MapView />} />
          </Route>

          <Route element={<RequireRole role="ngo" />}>
            <Route path="/ngo" element={<Navigate to={DEFAULT_NGO_PATH} replace />} />
            <Route path="/ngo/map" element={<MapView />} />
            <Route path="/ngo/:section" element={<NgoPortal />} />
          </Route>

          <Route element={<RequireRole role="provider" />}>
            <Route path="/provider" element={<ProviderPortal />} />
            <Route path="/provider/contracts" element={<ProviderContracts />} />
            <Route path="/provider/tasks" element={<ProviderTasks />} />
            <Route path="/provider/fleet" element={<ProviderFleet />} />
            <Route path="/provider/map" element={<MapView />} />
          </Route>

          <Route element={<RequireRole role="driver" />}>
            <Route path="/driver" element={<DriverPortal />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROLE_HOME[user.role]} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  if (window.location.pathname.startsWith("/driver-invite")) {
    return <DriverInvite />;
  }


  if (authLoading) {
    return (
      <div className="loading auth-loading">
        <div className="spinner" />
        <p>جارٍ تحميل الجلسة...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login/provider"
          element={
            <AuthScreen
              intent="provider"
              onAuth={nextUser => {
                setUser(nextUser);
                navigate(ROLE_HOME[nextUser.role], { replace: true });
              }}
            />
          }
        />
        <Route
          path="/login/driver"
          element={
            <AuthScreen
              intent="driver"
              onAuth={nextUser => {
                setUser(nextUser);
                navigate(ROLE_HOME[nextUser.role], { replace: true });
              }}
            />
          }
        />
        <Route
          path="/login/citizen"
          element={
            <CitizenAuth
              onAuth={nextUser => {
                setUser(nextUser);
                navigate(ROLE_HOME[nextUser.role], { replace: true });
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp user={user} setUser={setUser} />;
}
