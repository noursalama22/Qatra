import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import AdminPortal from "./pages/AdminPortal";
import NgoPortal from "./pages/NgoPortal";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderContracts from "./pages/ProviderContracts";
import ProviderFleet from "./pages/ProviderFleet";
import DriverPortal from "./pages/DriverPortal";
import Citizen from "./pages/Citizen";
import MapView from "./pages/MapView";
import { api, Provider, Zone } from "./api";

type Role = "admin" | "ngo" | "provider" | "driver" | "citizen";
type AuthMode = "login" | "register";

type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  roleStatus: "pending" | "approved" | "rejected";
  profile: Record<string, any> | null;
};

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

type ProfileDraft = AuthForm & {
  currentPassword: string;
  newPassword: string;
};

const ROLES: { id: Role; label: string; color: string }[] = [
  { id: "admin", label: "المشرف", color: "#0f5f8d" },
  { id: "ngo", label: "المنظمة", color: "#0891b2" },
  { id: "provider", label: "المزود", color: "#0284c7" },
  { id: "driver", label: "السائق", color: "#0ea5e9" },
  { id: "citizen", label: "المواطن", color: "#0369a1" },
];

const REGISTER_ROLES = ROLES.filter(role => role.id === "ngo" || role.id === "provider");

const ROLE_NAV: Record<Role, { id: string; label: string }[]> = {
  admin: [
    { id: "main", label: "لوحة الإشراف" },
    { id: "map", label: "الخريطة الحية" },
  ],
  ngo: [
    { id: "main", label: "بوابة المنظمة" },
    { id: "map", label: "الخريطة الحية" },
  ],
  provider: [
    { id: "main", label: "لوحة التحكم" },
    { id: "contracts", label: "العقود" },
    { id: "fleet", label: "الأسطول" },
    { id: "map", label: "الخريطة الحية" },
  ],
  driver: [
    { id: "main", label: "مهامي" },
    { id: "map", label: "خريطة الطريق" },
  ],
  citizen: [
    { id: "main", label: "بوابة المواطن" },
  ],
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "موافقة على الأطراف · إعدادات النظام",
  ngo: "مناطق التغطية · مهام التوزيع",
  provider: "وضع إنساني + تجاري · إدارة الأسطول",
  driver: "تنفيذ التوصيل · دليل الاستلام",
  citizen: "إشارة الاحتياج · الطلبات التجارية",
};

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

const roleStatusLabel = (status: AuthUser["roleStatus"]) => ({
  approved: "معتمد",
  pending: "بانتظار الموافقة",
  rejected: "مرفوض",
})[status];

function getProfileDraft(user: AuthUser): ProfileDraft {
  const base = emptyAuthForm();
  const profile = user.profile ?? {};
  return {
    ...base,
    role: user.role,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    orgName: profile.orgName ?? "",
    country: profile.country ?? "فلسطين",
    companyName: profile.companyName ?? "",
    contactEmail: profile.contactEmail ?? "",
    description: profile.description ?? "",
    operatingModes: Array.isArray(profile.operatingModes) ? profile.operatingModes : ["commercial"],
    driverType: profile.driverType ?? "independent",
    providerId: profile.providerId ?? "",
    phone: profile.phone ?? "",
    vehicleType: profile.vehicleType ?? "",
    zoneId: profile.zoneId ?? "",
    lat: profile.lat ?? "",
    lng: profile.lng ?? "",
    currentPassword: "",
    newPassword: "",
  };
}

function AuthScreen({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthForm>(emptyAuthForm);
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
        <div className="auth-brand">
          <h1>Qatra v3</h1>
          <p>منصة توزيع المياه</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "auth-tab-active" : ""} onClick={() => setMode("login")}>تسجيل الدخول</button>
          <button className={mode === "register" ? "auth-tab-active" : ""} onClick={() => setMode("register")}>إنشاء حساب</button>
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

function RoleFields({
  form,
  setForm,
  zones,
  providers,
  showAdminCode = false,
}: {
  form: AuthForm | ProfileDraft;
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

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<"main" | "map">("main");
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => ({ ...emptyAuthForm(), currentPassword: "", newPassword: "" }));
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "citizen";
  const currentRole = ROLES.find(r => r.id === role)!;
  const displayName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "مستخدم Qatra";
  const initials = `${user?.firstName?.trim().charAt(0) ?? "Q"}${user?.lastName?.trim().charAt(0) ?? ""}`;
  const statusClass = `role-status role-status-${user?.roleStatus ?? "approved"}`;

  useEffect(() => {
    api.get<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Zone[] }>("/zones").then(res => setZones(res.data)).catch(() => undefined),
      api.get<{ data: Provider[] }>("/providers").then(res => setProviders(res.data.filter(provider => provider.status === "approved"))).catch(() => undefined),
    ]);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const roleFieldsOptions = useMemo(() => ({ zones, providers }), [zones, providers]);

  const renderPage = () => {
    if (page === "map") return <MapView />;
    if (role === "provider" && page === "contracts") return <ProviderContracts />;
    if (role === "provider" && page === "fleet") return <ProviderFleet />;
    switch (role) {
      case "admin": return <AdminPortal />;
      case "ngo": return <NgoPortal />;
      case "provider": return <ProviderPortal />;
      case "driver": return <DriverPortal />;
      case "citizen": return <Citizen />;
    }
  };

  const openProfile = () => {
    if (!user) return;
    setMenuOpen(false);
    setProfileError(null);
    setProfileDraft(getProfileDraft(user));
    setProfileOpen(true);
  };

  const logout = async () => {
    setMenuOpen(false);
    setProfileOpen(false);
    await api.post("/auth/logout", {});
    setUser(null);
    setPage("main");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await api.patch<AuthUser>("/auth/me", profileDraft);
      setUser(updated);
      setProfileOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "تعذر حفظ التغييرات");
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading) return <div className="loading auth-loading"><div className="spinner" /><p>جارٍ تحميل الجلسة...</p></div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <div className="layout" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Qatra v3</h1>
          <span>منصة توزيع المياه</span>
        </div>

        <div className="current-role-info role-info-fixed" style={{ borderColor: currentRole.color + "22" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: currentRole.color }}>{currentRole.label}</span>
            <span className={statusClass}>{roleStatusLabel(user.roleStatus)}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b8aa0", lineHeight: 1.4 }}>{ROLE_DESCRIPTIONS[role]}</div>
        </div>

        <nav className="sidebar-nav" style={{ marginTop: 8 }}>
          {ROLE_NAV[role].map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id as "main" | "map" | "contracts" | "fleet")}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #d8eef8" }}>
          <div style={{ fontSize: 11, color: "#6b8aa0", marginBottom: 2 }}>جلسة نشطة</div>
          <div style={{ fontSize: 11, color: "#8eb5c8" }}>{user.email}</div>
        </div>
      </aside>

      <div className="main" style={page === "map" ? { display: "flex", flexDirection: "column" } : {}}>
        <header className="app-header">
          <div>
            <h2>{page === "map" ? "الخريطة الحية" : currentRole.label}</h2>
            <span>{ROLE_DESCRIPTIONS[role]}</span>
          </div>

          <div className="user-menu" ref={menuRef}>
            <button className="user-menu-trigger" onClick={() => setMenuOpen(open => !open)} aria-haspopup="menu" aria-expanded={menuOpen}>
              <span className="avatar" style={{ background: currentRole.color }}>{initials}</span>
              <span className="user-menu-copy">
                <strong>{displayName}</strong>
                <small>{currentRole.label} · {roleStatusLabel(user.roleStatus)}</small>
              </span>
              <span className="user-menu-chevron">⌄</span>
            </button>

            {menuOpen && (
              <div className="user-dropdown" role="menu">
                <button onClick={openProfile} role="menuitem">إعدادات الملف الشخصي</button>
                <button onClick={logout} role="menuitem">تسجيل الخروج</button>
              </div>
            )}
          </div>
        </header>

        {renderPage()}
      </div>

      {profileOpen && (
        <div className="modal-backdrop" onClick={() => setProfileOpen(false)}>
          <form className="modal profile-modal" onSubmit={saveProfile} onClick={event => event.stopPropagation()}>
            <h3>إعدادات الملف الشخصي</h3>
            <div className="profile-modal-user">
              <span className="avatar avatar-lg" style={{ background: currentRole.color }}>{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <span>{currentRole.label} · {roleStatusLabel(user.roleStatus)}</span>
              </div>
            </div>

            <div className="auth-grid">
              <label className="form-label">الاسم الأول<input value={profileDraft.firstName} onChange={event => setProfileDraft(draft => ({ ...draft, firstName: event.target.value }))} required /></label>
              <label className="form-label">اسم العائلة<input value={profileDraft.lastName} onChange={event => setProfileDraft(draft => ({ ...draft, lastName: event.target.value }))} required /></label>
            </div>
            <label className="form-label">البريد الإلكتروني<input type="email" value={profileDraft.email} onChange={event => setProfileDraft(draft => ({ ...draft, email: event.target.value }))} required /></label>
            <RoleFields form={profileDraft} setForm={setProfileDraft} {...roleFieldsOptions} />
            <div className="auth-grid">
              <label className="form-label">كلمة المرور الحالية<input type="password" value={profileDraft.currentPassword} onChange={event => setProfileDraft(draft => ({ ...draft, currentPassword: event.target.value }))} /></label>
              <label className="form-label">كلمة مرور جديدة<input type="password" value={profileDraft.newPassword} onChange={event => setProfileDraft(draft => ({ ...draft, newPassword: event.target.value }))} minLength={8} /></label>
            </div>

            {profileError && <div className="form-error">{profileError}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setProfileOpen(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
