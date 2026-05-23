import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import Tasks from "./pages/Tasks";
import Drivers from "./pages/Drivers";
import Ngos from "./pages/Ngos";
import Providers from "./pages/Providers";
import Orders from "./pages/Orders";
import Citizen from "./pages/Citizen";
import MapView from "./pages/MapView";

type Page = "citizen" | "map" | "dashboard" | "zones" | "tasks" | "drivers" | "ngos" | "providers" | "orders";

const navItems: { id: Page; label: string; icon: string; section?: string }[] = [
  { id: "citizen",   label: "بوابة المواطن",  icon: "👤", section: "المواطن"  },
  { id: "map",       label: "الخريطة الحية",  icon: "🗺️", section: "الإدارة" },
  { id: "dashboard", label: "لوحة التحكم",    icon: "📊"                       },
  { id: "zones",     label: "مناطق التغطية",  icon: "📍"                       },
  { id: "tasks",     label: "مهام التوزيع",   icon: "📋"                       },
  { id: "orders",    label: "طلبات التوصيل",  icon: "📦"                       },
  { id: "drivers",   label: "السائقون",       icon: "👷", section: " "         },
  { id: "ngos",      label: "المنظمات",        icon: "🏢"                       },
  { id: "providers", label: "مزودو الخدمة",   icon: "🚚"                       },
];

const pageTitles: Record<Page, string> = {
  citizen:   "بوابة المواطن",
  map:       "الخريطة الحية",
  dashboard: "Dashboard",
  zones:     "Coverage Zones",
  tasks:     "Distribution Tasks",
  drivers:   "Drivers",
  ngos:      "NGO Partners",
  providers: "Service Providers",
  orders:    "Delivery Orders",
};

export default function App() {
  const [page, setPage] = useState<Page>("map");

  const renderPage = () => {
    switch (page) {
      case "citizen":   return <Citizen />;
      case "map":       return <MapView />;
      case "dashboard": return <Dashboard />;
      case "zones":     return <Zones />;
      case "tasks":     return <Tasks />;
      case "drivers":   return <Drivers />;
      case "ngos":      return <Ngos />;
      case "providers": return <Providers />;
      case "orders":    return <Orders />;
    }
  };

  const noHeader = page === "citizen" || page === "map";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>💧 Qatra v3</h1>
          <span>Water Delivery Platform</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.id}>
              {item.section && <div className="nav-section-label">{item.section}</div>}
              <button
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Demo Mode</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>PostgreSQL · No auth</div>
        </div>
      </aside>

      <div className="main" style={page === "map" ? { display: "flex", flexDirection: "column" } : {}}>
        {!noHeader && (
          <header className="topbar">
            <h2>{pageTitles[page]}</h2>
            <div className="topbar-right">
              <span className="badge-demo">🎯 Demo</span>
            </div>
          </header>
        )}
        {renderPage()}
      </div>
    </div>
  );
}
