import { Role } from "../routes";

export const ROLES: { id: Role; label: string; color: string }[] = [
  { id: "admin", label: "المشرف", color: "#0f5f8d" },
  { id: "ngo", label: "المنظمة", color: "#0891b2" },
  { id: "provider", label: "المزود", color: "#0284c7" },
  { id: "driver", label: "السائق", color: "#0ea5e9" },
  { id: "citizen", label: "المواطن", color: "#0369a1" },
];

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "موافقة على الأطراف · إعدادات النظام",
  ngo: "مناطق التغطية · مهام التوزيع",
  provider: "وضع إنساني + تجاري · إدارة الأسطول",
  driver: "تنفيذ التوصيل · دليل الاستلام",
  citizen: "إشارة الاحتياج · الطلبات التجارية",
};

export type RoleStatus = "pending" | "approved" | "rejected";

export const roleStatusLabel = (status: RoleStatus) => ({
  approved: "معتمد",
  pending: "بانتظار الموافقة",
  rejected: "مرفوض",
})[status];

export function getRoleMeta(role: Role) {
  return ROLES.find(r => r.id === role)!;
}
