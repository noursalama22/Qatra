import { useState } from "react";
import AdminPortal from "./pages/AdminPortal";
import NgoPortal from "./pages/NgoPortal";
import ProviderPortal from "./pages/ProviderPortal";
import DriverPortal from "./pages/DriverPortal";
import Citizen from "./pages/Citizen";
import MapView from "./pages/MapView";

type Role = "admin" | "ngo" | "provider" | "driver" | "citizen";

const ROLES: { id: Role; icon: string; label: string; color: string }[] = [
  { id: "admin",    icon: "🛡",  label: "المشرف",  color: "#1e40af" },
  { id: "ngo",      icon: "❤️", label: "المنظمة",  color: "#059669" },
  { id: "provider", icon: "🏢", label: "المزود",   color: "#7c3aed" },
  { id: "driver",   icon: "🚚", label: "السائق",   color: "#92400e" },
  { id: "citizen",  icon: "👤", label: "المواطن",  color: "#0369a1" },
];

const ROLE_NAV: Record<Role, { id: string; label: string; icon: string }[]> = {
  admin:    [
    { id: "main", label: "لوحة الإشراف", icon: "🛡" },
    { id: "map",  label: "الخريطة الحية", icon: "🗺️" },
  ],
  ngo:      [
    { id: "main", label: "بوابة المنظمة", icon: "❤️" },
    { id: "map",  label: "الخريطة الحية", icon: "🗺️" },
  ],
  provider: [
    { id: "main", label: "بوابة المزود",   icon: "🏢" },
    { id: "map",  label: "الخريطة الحية", icon: "🗺️" },
  ],
  driver:   [
    { id: "main", label: "مهامي",          icon: "🚚" },
    { id: "map",  label: "خريطة الطريق",  icon: "🗺️" },
  ],
  citizen:  [
    { id: "main", label: "بوابة المواطن", icon: "👤" },
  ],
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin:    "موافقة على الأطراف · إعدادات النظام",
  ngo:      "مناطق التغطية · مهام التوزيع",
  provider: "وضع إنساني + تجاري · إدارة الأسطول",
  driver:   "تنفيذ التوصيل · دليل الاستلام",
  citizen:  "إشارة الاحتياج · الطلبات التجارية",
};

export default function App() {
  const [role, setRole] = useState<Role>("citizen");
  const [page, setPage] = useState<"main" | "map">("main");

  const currentRole = ROLES.find(r => r.id === role)!;

  const renderPage = () => {
    if (page === "map") return <MapView />;
    switch (role) {
      case "admin":    return <AdminPortal />;
      case "ngo":      return <NgoPortal />;
      case "provider": return <ProviderPortal />;
      case "driver":   return <DriverPortal />;
      case "citizen":  return <Citizen />;
    }
  };

  return (
    <div className="layout" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>💧 Qatra v3</h1>
          <span>منصة توزيع المياه</span>
        </div>

        {/* Role Switcher */}
        <div className="role-switcher">
          <div className="role-switcher-label">اختر دورك</div>
          <div className="role-grid">
            {ROLES.map(r => (
              <button
                key={r.id}
                className={`role-btn ${role === r.id ? "role-btn-active" : ""}`}
                style={role === r.id ? { background: r.color, color: "white", borderColor: r.color } : {}}
                onClick={() => { setRole(r.id); setPage("main"); }}
                title={r.label}
              >
                <span className="role-btn-icon">{r.icon}</span>
                <span className="role-btn-label">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Role Info */}
        <div className="current-role-info" style={{ borderColor: currentRole.color + "44" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{currentRole.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: "white" }}>{currentRole.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{ROLE_DESCRIPTIONS[role]}</div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ marginTop: 8 }}>
          {ROLE_NAV[role].map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id as "main" | "map")}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>وضع Demo · لا يوجد تسجيل دخول</div>
          <div style={{ fontSize: 11, color: "#334155" }}>PostgreSQL · Qatra v3 MVP</div>
        </div>
      </aside>

      <div className="main" style={page === "map" ? { display: "flex", flexDirection: "column" } : {}}>
        {renderPage()}
      </div>
    </div>
  );
}
