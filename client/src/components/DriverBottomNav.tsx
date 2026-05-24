import { NavLink } from "react-router-dom";

export default function DriverBottomNav() {
  return (
    <nav className="dpwa-bottom-nav" aria-label="تنقل السائق">
      <NavLink to="/driver" end className={({ isActive }) => `dpwa-nav-item${isActive ? " dpwa-nav-active" : ""}`}>
        <span aria-hidden>📋</span>
        <span>مهامي</span>
      </NavLink>
      <NavLink to="/driver/map" className={({ isActive }) => `dpwa-nav-item${isActive ? " dpwa-nav-active" : ""}`}>
        <span aria-hidden>🗺️</span>
        <span>الخريطة</span>
      </NavLink>
    </nav>
  );
}
