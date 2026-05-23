import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import Tasks from "./pages/Tasks";
import Drivers from "./pages/Drivers";
import Ngos from "./pages/Ngos";
import Providers from "./pages/Providers";
import Orders from "./pages/Orders";

type Page = "dashboard" | "zones" | "tasks" | "drivers" | "ngos" | "providers" | "orders";

const navItems: { id: Page; label: string; icon: string; section?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", section: "Overview" },
  { id: "zones", label: "Zones", icon: "🗺️", section: "Operations" },
  { id: "tasks", label: "Distribution Tasks", icon: "📋" },
  { id: "orders", label: "Delivery Orders", icon: "📦" },
  { id: "drivers", label: "Drivers", icon: "👷", section: "People" },
  { id: "ngos", label: "NGOs", icon: "🏢" },
  { id: "providers", label: "Providers", icon: "🚚" },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  zones: "Coverage Zones",
  tasks: "Distribution Tasks",
  drivers: "Drivers",
  ngos: "NGO Partners",
  providers: "Service Providers",
  orders: "Delivery Orders",
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "zones": return <Zones />;
      case "tasks": return <Tasks />;
      case "drivers": return <Drivers />;
      case "ngos": return <Ngos />;
      case "providers": return <Providers />;
      case "orders": return <Orders />;
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>💧 Qatra v3</h1>
          <span>Water Delivery Platform</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) => (
            <div key={item.id}>
              {item.section && (
                <div className="nav-section-label">{item.section}</div>
              )}
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
          <div style={{ fontSize: 12, color: "#64748b" }}>Mock data · No auth</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>{pageTitles[page]}</h2>
          <div className="topbar-right">
            <span className="badge-demo">🎯 Demo</span>
          </div>
        </header>
        {renderPage()}
      </div>
    </div>
  );
}
