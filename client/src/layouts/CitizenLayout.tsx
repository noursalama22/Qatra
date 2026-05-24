import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../components/RequireRole";
import { CitizenProvider } from "../contexts/CitizenContext";
import Logo from "../components/Logo";
import CitizenNavIcon, { type CitizenNavIconName } from "../components/citizen/CitizenNavIcon";
import { getRoleMeta } from "../constants/roles";
import { api } from "../api";

type NavItem = {
  to: string;
  label: string;
  icon: CitizenNavIconName;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/citizen", label: "الرئيسية", icon: "home", end: true },
  { to: "/citizen/market", label: "طلب مياه", icon: "request" },
  { to: "/citizen/orders", label: "طلباتي", icon: "orders" },
  { to: "/citizen/wallet", label: "المحفظة", icon: "wallet" },
];

function navLinkClass(isActive: boolean, base: string, activeClass: string) {
  return `${base}${isActive ? ` ${activeClass}` : ""}`;
}

function CitizenShell() {
  const { user, setUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const citizenColor = getRoleMeta("citizen").color;

  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "مواطن";
  const initials = `${user.firstName?.trim().charAt(0) ?? "ق"}${user.lastName?.trim().charAt(0) ?? ""}`;
  const hideBottomNav =
    location.pathname.startsWith("/citizen/orders/") ||
    location.pathname.startsWith("/citizen/market/request");

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/citizen/market/request")) return "طلب مياه تجارية";
    if (location.pathname.startsWith("/citizen/orders/")) return "تتبع طلبي";
    if (location.pathname === "/citizen/market") return "مزودو المياه";
    if (location.pathname === "/citizen/orders") return "طلباتي";
    if (location.pathname === "/citizen/wallet") return "المحفظة";
    return null;
  }, [location.pathname]);

  const logout = async () => {
    await api.post("/auth/logout", {});
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="citizen-app" dir="rtl">
      <header className="citizen-pwa-header">
        {pageTitle ? (
          <div className="citizen-pwa-header-track">
            <button type="button" className="citizen-pwa-back" onClick={() => navigate(-1)} aria-label="رجوع">
              →
            </button>
            <h1>{pageTitle}</h1>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="citizen-pwa-offline-btn"
              onClick={() => document.querySelector(".citizen-app")?.classList.toggle("citizen-simulate-offline")}
            >
              <span aria-hidden>📶</span>
              محاكاة عدم الاتصال
            </button>
            <Link to="/citizen" className="citizen-pwa-brand">
              <Logo showWordmark={false} />
              <span className="citizen-pwa-brand-text">قطرة</span>
            </Link>
          </>
        )}

        <button
          type="button"
          className="citizen-pwa-avatar-btn"
          onClick={() => setMenuOpen(open => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="القائمة"
        >
          <span className="avatar" style={{ background: citizenColor }}>{initials}</span>
        </button>

        {menuOpen && (
          <>
            <div className="citizen-pwa-menu-backdrop" onClick={() => setMenuOpen(false)} />
            <nav className="citizen-pwa-menu" role="menu">
              <div className="citizen-pwa-menu-user">
                <span className="avatar avatar-lg" style={{ background: citizenColor }}>{initials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <span>مواطن · {getRoleMeta("citizen").label}</span>
                </div>
              </div>
              <Link to="/citizen/wallet" role="menuitem" onClick={() => setMenuOpen(false)}>المحفظة</Link>
              <Link to="/citizen/orders" role="menuitem" onClick={() => setMenuOpen(false)}>طلباتي</Link>
              <button type="button" role="menuitem" className="citizen-pwa-menu-danger" onClick={logout}>
                تسجيل الخروج
              </button>
            </nav>
          </>
        )}
      </header>

      <div className="citizen-app-body">
        <nav className="citizen-side-nav" aria-label="التنقل الجانبي">
          <span className="citizen-side-nav-label">بوابة المواطن</span>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navLinkClass(isActive, "citizen-side-link", "citizen-side-link-active")}
            >
              <span className="citizen-side-link-icon" aria-hidden>
                <CitizenNavIcon name={item.icon} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className={`citizen-pwa-main${hideBottomNav ? " citizen-pwa-main-full" : ""}`}>
          <div className="citizen-pwa-main-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {!hideBottomNav && (
        <nav className="citizen-pwa-bottom-nav" aria-label="التنقل الرئيسي">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navLinkClass(isActive, "citizen-pwa-nav-item", "citizen-pwa-nav-active")}
            >
              <span className="citizen-pwa-nav-icon" aria-hidden>
                <CitizenNavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function CitizenLayout() {
  return (
    <CitizenProvider>
      <CitizenShell />
    </CitizenProvider>
  );
}
