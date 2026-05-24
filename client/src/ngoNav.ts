export type NgoSection = "dashboard" | "pipeline" | "verify" | "contracts" | "reports";

export type NgoNavItem = {
  id: string;
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
      { id: "ngo-dashboard", section: "dashboard", label: "جدولة التوزيع" },
      { id: "ngo-pipeline", section: "pipeline", label: "المسار النشط", badgeKey: "active" },
      { id: "ngo-verify", section: "verify", label: "التوثيق", badgeKey: "delivered" },
    ],
  },
  {
    id: "management",
    label: "الإدارة",
    defaultOpen: true,
    items: [
      { id: "ngo-contracts", section: "contracts", label: "العقود" },
      { id: "ngo-reports", section: "reports", label: "التقارير" },
    ],
  },
];

export const NGO_STANDALONE_NAV = [
  { id: "map", label: "الخريطة الحية" },
] as const;

export type AppPageId =
  | "main"
  | "map"
  | "ngo-dashboard"
  | "ngo-pipeline"
  | "ngo-verify"
  | "ngo-contracts"
  | "ngo-reports";

export function ngoSectionFromPage(page: string): NgoSection | null {
  if (!page.startsWith("ngo-")) return null;
  return page.slice(4) as NgoSection;
}

export function pageLabel(page: AppPageId, role: string): string {
  if (page === "map") return "الخريطة الحية";
  for (const group of NGO_NAV_GROUPS) {
    const item = group.items.find(i => i.id === page);
    if (item) return item.label;
  }
  if (role === "admin") return "لوحة الإشراف";
  if (role === "provider") return "بوابة المزود";
  if (role === "driver") return "مهامي";
  if (role === "citizen") return "بوابة المواطن";
  return "بوابة المنظمة";
}

export const DEFAULT_NGO_PAGE: AppPageId = "ngo-dashboard";
