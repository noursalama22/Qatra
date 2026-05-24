import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { ROLE_HOME, Role } from "../routes";

export type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  roleStatus: "pending" | "approved" | "rejected";
  profile: Record<string, unknown> | null;
};

export type AppOutletContext = {
  user: AuthUser;
  setUser: (user: AuthUser | null) => void;
};

export function useAppContext() {
  return useOutletContext<AppOutletContext>();
}

export default function RequireRole({ role }: { role: Role | Role[] }) {
  const ctx = useAppContext();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(ctx.user.role)) {
    return <Navigate to={ROLE_HOME[ctx.user.role]} replace />;
  }
  return <Outlet context={ctx} />;
}
