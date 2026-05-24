import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getRoleMeta, ROLE_DESCRIPTIONS, roleStatusLabel } from "../constants/roles";
import { AuthUser } from "./RequireRole";
import { NGO_NAV_GROUPS, NGO_STANDALONE_NAV, ROLE_NAV } from "../routes";

function navClass(isActive: boolean, extra = "") {
  return `${extra} nav-item${isActive ? " active" : ""}`.trim();
}

type Props = { user: AuthUser };

export default function Sidebar({ user }: Props) {
  const location = useLocation();
  const role = user.role;
  const currentRole = getRoleMeta(role);
  const statusClass = `role-status role-status-${user.roleStatus}`;

  const [collapsedNavGroups, setCollapsedNavGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NGO_NAV_GROUPS.map(g => [g.id, !g.defaultOpen])),
  );
  const [ngoBadges, setNgoBadges] = useState({ active: 0, delivered: 0 });

  useEffect(() => {
    if (role !== "ngo") return;
    fetch("/api/tasks")
      .then(r => r.json())
      .then(res => {
        const tasks = res.data ?? [];
        setNgoBadges({
          active: tasks.filter((t: { status: string }) => t.status === "pending" || t.status === "in_progress").length,
          delivered: tasks.filter((t: { status: string }) => t.status === "delivered").length,
        });
      })
      .catch(() => undefined);
  }, [role, location.pathname]);

  const toggleNavGroup = (groupId: string) => {
    setCollapsedNavGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const ngoBadgeFor = (key?: "active" | "delivered") => {
    if (!key) return null;
    const value = ngoBadges[key];
    return value > 0 ? value : null;
  };

  return (
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
        {role === "ngo" ? (
          <>
            {NGO_NAV_GROUPS.map(group => {
              const collapsed = collapsedNavGroups[group.id];
              return (
                <div key={group.id} className="nav-group">
                  <button
                    type="button"
                    className="nav-group-toggle"
                    onClick={() => toggleNavGroup(group.id)}
                    aria-expanded={!collapsed}
                  >
                    <span>{group.label}</span>
                    <span className={`nav-group-chevron ${collapsed ? "nav-group-chevron-collapsed" : ""}`} aria-hidden>▾</span>
                  </button>
                  {!collapsed && group.items.map(item => {
                    const badge = ngoBadgeFor(item.badgeKey);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => navClass(isActive, "nav-sub-item")}
                      >
                        <span>{item.label}</span>
                        {badge != null && (
                          <span className={`nav-item-badge ${item.badgeKey === "delivered" ? "nav-item-badge-green" : ""}`}>
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
            {NGO_STANDALONE_NAV.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => navClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </>
        ) : (
          ROLE_NAV[role].map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => navClass(isActive)}
            >
              {item.label}
            </NavLink>
          ))
        )}
      </nav>

      <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #d8eef8" }}>
        <div style={{ fontSize: 11, color: "#6b8aa0", marginBottom: 2 }}>جلسة نشطة</div>
        <div style={{ fontSize: 11, color: "#8eb5c8" }}>{user.email}</div>
      </div>
    </aside>
  );
}
