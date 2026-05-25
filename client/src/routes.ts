export type Role = "admin" | "ngo" | "provider" | "driver" | "citizen";

export type NgoSection = "dashboard" | "tasks" | "pipeline" | "verify" | "contracts" | "reports";

export const NGO_SECTIONS: NgoSection[] = [
  "dashboard", "tasks", "pipeline", "verify", "contracts", "reports",
];

export function isNgoSection(value: string | undefined): value is NgoSection {
  return NGO_SECTIONS.includes(value as NgoSection);
}

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  ngo: "/ngo/dashboard",
  provider: "/provider",
  driver: "/driver",
  citizen: "/citizen",
};

export type NavItem = { path: string; label: string; end?: boolean };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  admin: [
    { path: "/admin", label: "لوحة الإشراف", end: true },
    { path: "/admin/map", label: "الخريطة الحية" },
  ],
  ngo: [],
  provider: [
    { path: "/provider", label: "لوحة التحكم", end: true },
    { path: "/provider/contracts", label: "العقود" },
    { path: "/provider/tasks", label: "المهام" },
    { path: "/provider/fleet", label: "إدارة السائقين" },
    { path: "/provider/map", label: "الخريطة الحية" },
  ],
  driver: [
    { path: "/driver", label: "مهامي", end: true },
  ],
  citizen: [
    { path: "/citizen", label: "الرئيسية", end: true },
    { path: "/citizen/market", label: "طلب مياه" },
    { path: "/citizen/orders", label: "طلباتي" },
    { path: "/citizen/wallet", label: "المحفظة" },
  ],
};

export type NgoNavItem = {
  path: string;
  section: NgoSection;
  label: string;
  badgeKey?: "active" | "delivered";
};

export type NgoNavGroup = {
  id: string;
  label: string;
  defaultOpen: boolean;
  items: NgoNavItem[];
};

export const NGO_NAV_GROUPS: NgoNavGroup[] = [
  {
    id: "operations",
    label: "العمليات",
    defaultOpen: true,
    items: [
      { path: "/ngo/dashboard", section: "dashboard", label: "جدولة التوزيع" },
      { path: "/ngo/tasks", section: "tasks", label: "جميع المهام" },
      { path: "/ngo/pipeline", section: "pipeline", label: "المسار النشط", badgeKey: "active" },
      { path: "/ngo/verify", section: "verify", label: "التوثيق", badgeKey: "delivered" },
    ],
  },
  {
    id: "management",
    label: "الإدارة",
    defaultOpen: true,
    items: [
      { path: "/ngo/contracts", section: "contracts", label: "العقود" },
      { path: "/ngo/reports", section: "reports", label: "التقارير" },
    ],
  },
];

export const NGO_STANDALONE_NAV: NavItem[] = [
  { path: "/ngo/map", label: "الخريطة الحية" },
];

export const DEFAULT_NGO_PATH = "/ngo/dashboard";

export function ngoPath(section: NgoSection): string {
  return `/ngo/${section}`;
}

export function isMapRoute(pathname: string): boolean {
  return pathname.endsWith("/map");
}

export function pageLabel(pathname: string, role: Role): string {
  if (pathname.endsWith("/map")) {
    return "الخريطة الحية";
  }
  for (const group of NGO_NAV_GROUPS) {
    const item = group.items.find(i => pathname === i.path);
    if (item) return item.label;
  }
  for (const item of ROLE_NAV[role]) {
    if (pathname === item.path) return item.label;
  }
  if (role === "admin") return "لوحة الإشراف";
  if (role === "provider") {
    if (pathname === "/provider/contracts") return "العقود";
    if (pathname === "/provider/tasks") return "المهام";
    if (pathname === "/provider/fleet") return "إدارة السائقين";
    return "لوحة التحكم";
  }
  if (role === "driver") return "مهامي";
  if (role === "citizen") {
    if (pathname.startsWith("/citizen/orders/")) return "تتبع طلبي";
    if (pathname === "/citizen/market") return "مزودو المياه";
    if (pathname === "/citizen/orders") return "طلباتي";
    if (pathname === "/citizen/wallet") return "المحفظة";
    return "بوابة المواطن";
  }
  return "بوابة المنظمة";
}
