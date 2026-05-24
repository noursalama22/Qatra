import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { api, Provider, Zone } from "../api";
import { RoleFields } from "../App";
import NotificationBell from "../components/NotificationBell";
import DriverBottomNav from "../components/DriverBottomNav";
import Sidebar from "../components/Sidebar";
import { getRoleMeta, ROLE_DESCRIPTIONS, roleStatusLabel } from "../constants/roles";
import { isMapRoute, pageLabel } from "../routes";
import { AppOutletContext, AuthUser } from "../components/RequireRole";

type AuthForm = {
  role: AuthUser["role"];
  firstName: string;
  lastName: string;
  email: string;
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

function getProfileDraft(user: AuthUser): ProfileDraft {
  const profile = user.profile ?? {};
  return {
    role: user.role,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    orgName: (profile.orgName as string) ?? "",
    country: (profile.country as string) ?? "فلسطين",
    companyName: (profile.companyName as string) ?? "",
    contactEmail: (profile.contactEmail as string) ?? "",
    description: (profile.description as string) ?? "",
    operatingModes: Array.isArray(profile.operatingModes) ? profile.operatingModes as string[] : ["commercial"],
    driverType: (profile.driverType as ProfileDraft["driverType"]) ?? "independent",
    providerId: (profile.providerId as string) ?? "",
    phone: (profile.phone as string) ?? "",
    vehicleType: (profile.vehicleType as string) ?? "",
    zoneId: (profile.zoneId as string) ?? "",
    lat: (profile.lat as string) ?? "",
    lng: (profile.lng as string) ?? "",
    currentPassword: "",
    newPassword: "",
  };
}

type Props = {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  onLogout: () => Promise<void>;
};

export default function AppLayout({ user, setUser, onLogout }: Props) {
  const location = useLocation();
  const role = user.role;
  const currentRole = getRoleMeta(role);
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const initials = `${user.firstName?.trim().charAt(0) ?? "Q"}${user.lastName?.trim().charAt(0) ?? ""}`;

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => getProfileDraft(user));
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Zone[] }>("/zones").then(res => setZones(res.data)).catch(() => undefined),
      api.get<{ data: Provider[] }>("/providers").then(res => setProviders(res.data.filter(p => p.status === "approved"))).catch(() => undefined),
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
  const outletContext: AppOutletContext = useMemo(() => ({ user, setUser }), [user, setUser]);

  const openProfile = () => {
    setMenuOpen(false);
    setProfileError(null);
    setProfileDraft(getProfileDraft(user));
    setProfileOpen(true);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    setProfileOpen(false);
    await onLogout();
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  return (
    <div className={`layout${role === "driver" ? " layout--driver" : ""}`} dir="rtl">
      <Sidebar user={user} />

      <div className="main" style={isMapRoute(location.pathname) ? { display: "flex", flexDirection: "column" } : {}}>
        <header className="app-header">
          <div>
            <h2>{pageLabel(location.pathname, role)}</h2>
            <span>{ROLE_DESCRIPTIONS[role]}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {role === "provider" && <NotificationBell />}

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
                <button onClick={handleLogout} role="menuitem">تسجيل الخروج</button>
              </div>
            )}
            </div>
          </div>
        </header>

        <Outlet context={outletContext} />
        {role === "driver" && <DriverBottomNav />}
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
