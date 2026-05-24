export type Role = "admin" | "ngo" | "provider" | "driver" | "citizen";

export type NgoSection = "dashboard" | "pipeline" | "verify" | "contracts" | "reports";

export const NGO_SECTIONS: NgoSection[] = [
  "dashboard", "pipeline", "verify", "contracts", "reports",
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
    { path: "/provider", label: "بوابة المزود", end: true },
    { path: "/provider/map", label: "الخريطة الحية" },
  ],
  driver: [
    { path: "/driver", label: "مهامي", end: true },
    { path: "/driver/map", label: "خريطة الطريق" },
  ],
  citizen: [
    { path: "/citizen", label: "بوابة المواطن", end: true },
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
    if (role === "driver") return "خريطة الطريق";
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
  if (role === "provider") return "بوابة المزود";
  if (role === "driver") return "مهامي";
  if (role === "citizen") return "بوابة المواطن";
  return "بوابة المنظمة";
}
