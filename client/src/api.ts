const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = { get, post, patch };

export type Zone = { id: string; name: string; status: string; ngoId: string; populationEstimate: number; signalCount: number; lastDeliveryAt: string | null; description: string };
export type Ngo = { id: string; orgName: string; contactEmail: string; country: string; status: string; description: string };
export type Provider = { id: string; companyName: string; contactEmail: string; status: string; operatingModes: string[]; description: string };
export type Driver = { id: string; driverType: string; providerId: string | null; status: string; phone: string; vehicleType: string };
export type Task = { id: string; ngoId: string; zoneId: string; status: string; quantityLiters: string; scheduledAt: string; notes: string | null };
export type Order = { id: string; citizenId: string; providerId: string; status: string; quantityLiters: string; totalAmount: string; createdAt: string };
export type Stats = {
  totalZones: number; activeZones: number;
  totalNgos: number; approvedNgos: number;
  totalProviders: number; approvedProviders: number;
  totalDrivers: number; activeDrivers: number;
  totalTasks: number; pendingTasks: number; inProgressTasks: number; deliveredTasks: number;
  totalOrders: number; totalLitersDispatched: number;
};
