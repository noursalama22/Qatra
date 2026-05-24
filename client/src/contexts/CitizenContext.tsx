import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppContext } from "../components/RequireRole";
import { api, type CitizenProfile, type Order, type Provider, type Task, type Zone } from "../api";
import { calcOrderPricing, type PlaceOrderPayload } from "../constants/citizenOrder";

export type ZoneStatus = "safe" | "critical";

type CitizenContextValue = {
  citizen: CitizenProfile | null;
  zones: Zone[];
  selectedZone: Zone | null;
  setSelectedZone: (zone: Zone | null) => void;
  providers: Provider[];
  schedule: Task[];
  myOrders: Order[];
  loading: boolean;
  offlineMode: boolean;
  setOfflineMode: (value: boolean) => void;
  isOnline: boolean;
  signalCount: number;
  refreshOrders: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  sendSignal: () => Promise<void>;
  zoneStatus: ZoneStatus;
  nextDelivery: Task | undefined;
  placeOrder: (payload: PlaceOrderPayload) => Promise<Order>;
};

const CitizenContext = createContext<CitizenContextValue | null>(null);

export function useCitizenContext() {
  const ctx = useContext(CitizenContext);
  if (!ctx) throw new Error("useCitizenContext must be used within CitizenProvider");
  return ctx;
}

function computeZoneStatus(schedule: Task[]): ZoneStatus {
  const now = Date.now();
  const horizon = now + 48 * 60 * 60 * 1000;
  const upcoming = schedule.filter(t => {
    const at = new Date(t.scheduledAt).getTime();
    return at >= now && at <= horizon && (t.status === "pending" || t.status === "in_progress");
  });
  return upcoming.length > 0 ? "safe" : "critical";
}

export function CitizenProvider({ children }: { children: ReactNode }) {
  const { user } = useAppContext();
  const [citizen, setCitizen] = useState<CitizenProfile | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [schedule, setSchedule] = useState<Task[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [signalCount, setSignalCount] = useState(0);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profile = await api.get<CitizenProfile>("/citizen/me");
        if (cancelled) return;
        setCitizen(profile);

        const [z, p, o] = await Promise.all([
          api.get<{ data: Zone[] }>("/citizen/zones"),
          api.get<{ data: Provider[] }>("/citizen/providers"),
          api.get<{ data: Order[] }>(`/citizen/${profile.id}/orders`),
        ]);
        if (cancelled) return;

        setZones(z.data);
        setProviders(p.data);
        setMyOrders(o.data);

        const homeZone = z.data.find(zone => zone.id === profile.zoneId) ?? z.data[0] ?? null;
        if (homeZone) {
          setSelectedZone(homeZone);
          setSignalCount(homeZone.signalCount);
        }
      } catch {
        if (!cancelled) setCitizen(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  const refreshSchedule = async () => {
    if (!selectedZone) return;
    const r = await api.get<{ data: Task[] }>(`/citizen/zones/${selectedZone.id}/schedule`);
    setSchedule(r.data);
    setSignalCount(selectedZone.signalCount);
  };

  useEffect(() => {
    if (!selectedZone) return;
    refreshSchedule().catch(() => undefined);
  }, [selectedZone?.id]);

  const refreshOrders = async () => {
    if (!citizen) return;
    const o = await api.get<{ data: Order[] }>(`/citizen/${citizen.id}/orders`);
    setMyOrders(o.data);
  };

  const sendSignal = async () => {
    if (!selectedZone || !citizen) return;
    await api.post("/citizen/signals", { citizenId: citizen.id, zoneId: selectedZone.id });
    setSignalCount(c => c + 1);
  };

  const placeOrder = async (payload: PlaceOrderPayload) => {
    if (!citizen) throw new Error("لا يوجد حساب مواطن");
    const { total } = calcOrderPricing(payload.quantityLiters);
    const order = await api.post<Order>("/citizen/orders", {
      citizenId: citizen.id,
      providerId: payload.providerId,
      quantityLiters: payload.quantityLiters,
      totalAmount: total.toFixed(2),
      scheduledAt: payload.scheduledAt,
      paymentMethod: payload.paymentMethod,
      deliveryNote: payload.deliveryNote,
    });
    setMyOrders(prev => [order, ...prev]);
    return order;
  };

  const zoneStatus = useMemo(() => computeZoneStatus(schedule), [schedule]);
  const nextDelivery = useMemo(
    () => schedule.find(t => t.status === "pending" || t.status === "in_progress"),
    [schedule],
  );

  const value = useMemo(
    () => ({
      citizen,
      zones,
      selectedZone,
      setSelectedZone,
      providers,
      schedule,
      myOrders,
      loading,
      offlineMode,
      setOfflineMode,
      isOnline: isOnline && !offlineMode,
      signalCount,
      refreshOrders,
      refreshSchedule,
      sendSignal,
      zoneStatus,
      nextDelivery,
      placeOrder,
    }),
    [
      citizen, zones, selectedZone, providers, schedule, myOrders, loading,
      offlineMode, isOnline, signalCount, zoneStatus, nextDelivery,
    ],
  );

  return <CitizenContext.Provider value={value}>{children}</CitizenContext.Provider>;
}
