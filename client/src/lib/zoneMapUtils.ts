export const MY_NGO_ID = "seed-n1";

export const ZONE_REGION: Record<string, string> = {
  "seed-z1": "seed-rg1", "seed-z6": "seed-rg1", "seed-z7": "seed-rg1", "seed-z8": "seed-rg1",
  "seed-z2": "seed-rg2", "seed-z9": "seed-rg2", "seed-z10": "seed-rg2", "seed-z11": "seed-rg2",
  "seed-z12": "seed-rg2", "seed-z13": "seed-rg2",
  "seed-z3": "seed-rg3", "seed-z14": "seed-rg3", "seed-z15": "seed-rg3", "seed-z16": "seed-rg3", "seed-z17": "seed-rg3",
  "seed-z4": "seed-rg4", "seed-z18": "seed-rg4", "seed-z19": "seed-rg4", "seed-z20": "seed-rg4",
  "seed-z5": "seed-rg5", "seed-z21": "seed-rg5", "seed-z22": "seed-rg5",
};

export type MapZone = {
  id: string;
  name: string;
  status: string;
  regionId?: string | null;
  populationEstimate: number;
  signalCount: number;
  lastDeliveryAt: string | null;
  description: string;
  boundary: [number, number][] | null;
};

export type MapTask = {
  id: string;
  ngoId: string;
  zoneId: string;
  status: string;
  quantityLiters: string;
  scheduledAt: string;
  notes: string | null;
  assignedProviderIds: string[];
};

export type Wallet = { available: number; escrow: number };

export type NeedLevel = "low" | "medium" | "high";

export const TIME_SLOTS = [
  { h: 6, label: "06:00 – 08:00" },
  { h: 8, label: "08:00 – 10:00" },
  { h: 10, label: "10:00 – 12:00" },
  { h: 12, label: "12:00 – 14:00" },
  { h: 14, label: "14:00 – 16:00" },
  { h: 16, label: "16:00 – 18:00" },
];

export const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const NEED_COLORS: Record<NeedLevel, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export function needLevel(signalCount: number): NeedLevel {
  if (signalCount > 50) return "high";
  if (signalCount > 25) return "medium";
  return "low";
}

export function isZoneCovered(zone: MapZone, tasks: MapTask[]): boolean {
  const active = tasks.some(
    t => t.zoneId === zone.id && (t.status === "in_progress" || t.status === "pending"),
  );
  if (active) return true;
  if (!zone.lastDeliveryAt) return false;
  const days = (Date.now() - new Date(zone.lastDeliveryAt).getTime()) / 86400000;
  return days <= 3;
}

export function zoneStyle(zone: MapZone, tasks: MapTask[], selected: boolean) {
  const covered = isZoneCovered(zone, tasks);
  const need = needLevel(zone.signalCount);
  if (covered) {
    return {
      color: "#16a34a",
      fillColor: "#86efac",
      fillOpacity: selected ? 0.45 : 0.32,
      weight: selected ? 3.5 : 2.5,
    };
  }
  const base = NEED_COLORS[need];
  return {
    color: base,
    fillColor: base,
    fillOpacity: selected ? 0.42 : 0.28,
    weight: selected ? 3.5 : 2.5,
  };
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getNextDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export function regionForZone(zone: MapZone): string | null {
  return zone.regionId ?? ZONE_REGION[zone.id] ?? null;
}
