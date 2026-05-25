import { useState, useEffect, useRef, useCallback } from "react";
import type { Map as LeafletMap, Marker, Polygon } from "leaflet";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
import "leaflet/dist/leaflet.css";
import { useAppContext, type AuthUser } from "../components/RequireRole";

type Stage = "list" | "accept" | "route" | "navigate" | "proof" | "complete";

type Task = {
  id: string;
  zoneId: string;
  status: string;
  quantityLiters: string;
  scheduledAt: string;
  notes: string | null;
};

type Zone = {
  id: string;
  name: string;
  populationEstimate: number | null;
  boundary: [number, number][] | null;
};

type DriverProfile = {
  id: string;
  driverType?: string;
  providerId?: string | null;
  providerCompanyName?: string | null;
  vehicleType?: string | null;
  phone?: string | null;
  status?: string;
};

const OFFLINE_KEY = "qatra_driver_proof_queue";

function getDriverProfile(user: AuthUser): DriverProfile | null {
  if (!user.profile || typeof user.profile !== "object") return null;
  const p = user.profile as Record<string, unknown>;
  if (typeof p.id !== "string") return null;
  return {
    id: p.id,
    driverType: typeof p.driverType === "string" ? p.driverType : undefined,
    providerId: typeof p.providerId === "string" ? p.providerId : null,
    providerCompanyName: typeof p.providerCompanyName === "string" ? p.providerCompanyName : null,
    vehicleType: typeof p.vehicleType === "string" ? p.vehicleType : null,
    phone: typeof p.phone === "string" ? p.phone : null,
    status: typeof p.status === "string" ? p.status : undefined,
  };
}

function centroid(pts: [number, number][]): [number, number] {
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function DriverPortal() {
  const { user } = useAppContext();
  const profile = getDriverProfile(user);
  const [stage, setStage] = useState<Stage>("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "in_progress" | "delivered">("all");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletMap | null>(null);
  const dashMapDivRef = useRef<HTMLDivElement>(null);
  const dashLeafletRef = useRef<LeafletMap | null>(null);
  const driverMarkerRef = useRef<Marker | null>(null);
  const zonePolyRef = useRef<Polygon | null>(null);
  const gpsPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const userRef = useRef<AuthUser | null>(null);
  const activeTaskRef = useRef<Task | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadTasks = useCallback(async () => {
    const r = await fetch("/api/driver/tasks").then(r => r.json());
    setTasks(r.data ?? []);
    if (Array.isArray(r.zones) && r.zones.length) {
      setZones(r.zones);
    } else {
      const z = await fetch("/api/zones").then(r => r.json());
      setZones(z.data ?? []);
    }
  }, []);

  const loadOfflineCount = useCallback(() => {
    const q = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
    setOfflineCount(q.length);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    const queue: Array<{ taskId: string }> = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
    if (!queue.length) return;
    const synced: string[] = [];
    for (const item of queue) {
      try {
        await fetch(`/api/driver/tasks/${item.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "delivered" }),
        });
        synced.push(item.taskId);
      } catch {}
    }
    const remaining = queue.filter(q => !synced.includes(q.taskId));
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    if (synced.length) {
      showToast(`✓ تمت مزامنة ${synced.length} مهمة محلية`);
      loadTasks();
    }
    loadOfflineCount();
  }, [loadTasks, loadOfflineCount]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    loadTasks();
    loadOfflineCount();

    const goOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const goOffline = () => setIsOnline(false);
    const onInstallPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBtn(true); };
    const onAppInstalled = () => setShowInstallBtn(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      stopGps();
    };
  }, [loadTasks, loadOfflineCount, syncOfflineQueue]);

  useEffect(() => { gpsPosRef.current = gpsPos; }, [gpsPos]);
  useEffect(() => { activeTaskRef.current = activeTask; }, [activeTask]);

  // ── Dashboard overview map (list stage) ────────────────────────
  useEffect(() => {
    if (stage !== "list") {
      if (dashLeafletRef.current) { dashLeafletRef.current.remove(); dashLeafletRef.current = null; }
      return;
    }
    const timer = setTimeout(async () => {
      if (!dashMapDivRef.current) return;
      if (dashLeafletRef.current) { dashLeafletRef.current.remove(); dashLeafletRef.current = null; }
      const L = (await import("leaflet")).default;
      const map = L.map(dashMapDivRef.current, { zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      const markerPoints: [number, number][] = [];
      tasks.forEach(task => {
        const zone = zones.find(z => z.id === task.zoneId);
        if (!zone?.boundary?.length) return;
        const pt = centroid(zone.boundary);
        markerPoints.push(pt);
        const color = task.status === "delivered" ? "#22c55e"
          : task.status === "in_progress" ? "#0891b2"
          : "#f59e0b";
        const statusLabel = task.status === "delivered" ? "مُسلَّم" : task.status === "in_progress" ? "جارية" : "معلقة";
        L.circleMarker(pt, {
          radius: 14,
          color: "#fff",
          weight: 2.5,
          fillColor: color,
          fillOpacity: 0.92,
        })
          .bindTooltip(`${zone.name} · ${statusLabel}`, { sticky: true, direction: "top" })
          .addTo(map);
      });

      if (markerPoints.length) {
        map.fitBounds(L.latLngBounds(markerPoints), { padding: [48, 48] });
      } else {
        map.setView([31.5, 34.45], 12);
      }

      if (gpsPosRef.current) {
        const icon = L.divIcon({ html: `<div class="dpwa-driver-dot"></div>`, iconSize: [18, 18], className: "" });
        L.marker([gpsPosRef.current.lat, gpsPosRef.current.lng], { icon }).addTo(map);
      }

      dashLeafletRef.current = map;
    }, 200);
    return () => clearTimeout(timer);
  }, [stage, tasks, zones]);

  useEffect(() => {
    if (stage !== "navigate") {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
      driverMarkerRef.current = null;
      zonePolyRef.current = null;
      return;
    }
    const timer = setTimeout(async () => {
      if (!mapDivRef.current || leafletRef.current) return;
      const L = (await import("leaflet")).default;
      const task = activeTaskRef.current;
      const taskZones = zones;
      const zone = task ? taskZones.find(z => z.id === task.zoneId) : null;
      const boundary = zone?.boundary ?? null;
      const center: [number, number] = boundary ? centroid(boundary) : [31.5, 34.45];

      const map = L.map(mapDivRef.current, { center, zoom: 14, zoomControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      if (boundary) {
        zonePolyRef.current = L.polygon(boundary, {
          color: "#f59e0b", weight: 2.5, fillColor: "#f59e0b", fillOpacity: 0.15,
        }).addTo(map) as unknown as Polygon;
      }

      L.control.zoom({ position: "bottomleft" }).addTo(map);
      leafletRef.current = map;
    }, 150);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (!leafletRef.current || !gpsPos) return;
    import("leaflet").then(({ default: L }) => {
      const { lat, lng } = gpsPos;
      const icon = L.divIcon({ html: `<div class="dpwa-driver-dot"></div>`, iconSize: [18, 18], className: "" });
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([lat, lng]);
      } else if (leafletRef.current) {
        driverMarkerRef.current = L.marker([lat, lng], { icon }).addTo(leafletRef.current) as unknown as Marker;
      }
    });
  }, [gpsPos]);

  function startGps() {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsPos(p);
        gpsPosRef.current = p;
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    gpsIntervalRef.current = setInterval(() => {
      const pos = gpsPosRef.current;
      const u = userRef.current;
      const driverId = u ? getDriverProfile(u)?.id : null;
      const task = activeTaskRef.current;
      if (!pos || !driverId) return;
      fetch("/api/gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, lat: pos.lat, lng: pos.lng, taskId: task?.id ?? null }),
      }).catch(() => {});
    }, 10000);
  }

  function stopGps() {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (gpsIntervalRef.current) { clearInterval(gpsIntervalRef.current); gpsIntervalRef.current = null; }
  }

  function acceptTask(task: Task) { setActiveTask(task); activeTaskRef.current = task; setStage("accept"); }

  async function startRoute() {
    if (!activeTask) return;
    await fetch(`/api/driver/tasks/${activeTask.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    setActiveTask(t => t ? { ...t, status: "in_progress" } : t);
    startGps();
    setStage("navigate");
    showToast("📡 GPS نشط — يتم إرسال موقعك كل 10 ثوانٍ");
  }

  function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function submitProof() {
    if (!activeTask || !proofFile) return;

    const gps = gpsPosRef.current;
    const zoneBoundary = activeZone?.boundary ?? null;
    if (gps && zoneBoundary && zoneBoundary.length > 0) {
      const [cLat, cLng] = centroid(zoneBoundary);
      const dist = haversineMeters(gps.lat, gps.lng, cLat, cLng);
      if (dist > 200) {
        showToast(`📍 الموقع غير مطابق — أنت على بُعد ${dist} متر من نقطة التسليم. لا يمكن إتمام العملية.`);
        setLocationError(true);
        return;
      }
    }

    setCompleting(true);
    try {
      const proofDataUrl = await fileToBase64(proofFile);
      if (navigator.onLine) {
        await fetch(`/api/driver/tasks/${activeTask.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "delivered",
            proofPhotoDataUrl: proofDataUrl,
            lat: gps?.lat ?? null,
            lng: gps?.lng ?? null,
          }),
        });
      } else {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
        queue.push({ taskId: activeTask.id, timestamp: new Date().toISOString(), lat: gpsPosRef.current?.lat, lng: gpsPosRef.current?.lng });
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
        loadOfflineCount();
      }
      stopGps();
      setStage("complete");
    } catch {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
      queue.push({ taskId: activeTask.id, timestamp: new Date().toISOString(), lat: gpsPosRef.current?.lat, lng: gpsPosRef.current?.lng });
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
      loadOfflineCount();
      stopGps();
      setStage("complete");
    } finally {
      setCompleting(false);
    }
  }

  function backToList() {
    stopGps();
    setActiveTask(null);
    activeTaskRef.current = null;
    setProofFile(null);
    setProofPreview(null);
    setStage("list");
    loadTasks();
    loadOfflineCount();
  }

  const activeZone = activeTask ? zones.find(z => z.id === activeTask.zoneId) : null;
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTask = tasks.find(t => t.status === "in_progress");
  const deliveredLiters = tasks.filter(t => t.status === "delivered").reduce((s, t) => s + Number(t.quantityLiters), 0);

  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "السائق";
  const providerLabel = profile?.driverType === "independent"
    ? "مستقل"
    : (profile?.providerCompanyName ?? "مزود الخدمة");

  return (
    <div className="driver-portal">
      {toast && <div className="dpwa-toast">{toast}</div>}

      {/* ── LIST STAGE ─────────────────────────────────────────── */}
      {stage === "list" && (
        <div className="driver-pwa-list" dir="rtl" style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 64px)", overflow: "hidden" }}>

          {/* ── Header (full width) ── */}
          <div className="dpwa-list-header">
            <div className="dpwa-list-header-top">
              <div>
                <div className="dpwa-greeting">مرحباً، {displayName}</div>
                <div className="dpwa-greeting-sub">
                  {profile?.vehicleType ?? "شاحنة مياه"} · {providerLabel}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div className={`dpwa-gps-badge ${gpsPos ? "dpwa-gps-on" : "dpwa-gps-off"}`}>
                  {gpsPos ? "● GPS نشط" : "○ GPS مُعطَّل"}
                </div>
                {showInstallBtn && (
                  <button
                    onClick={async () => {
                      if (!installPrompt) return;
                      const prompt = installPrompt as BeforeInstallPromptEvent;
                      await prompt.prompt();
                      const { outcome } = await prompt.userChoice;
                      if (outcome === "accepted") setShowInstallBtn(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.5)",
                      borderRadius: 20, padding: "5px 12px", color: "#fff",
                      fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📲</span> تثبيت التطبيق
                  </button>
                )}
              </div>
            </div>
            <div className="dpwa-list-stats">
              <div className="dpwa-stat"><span className="dpwa-stat-val">{pendingTasks.length}</span><span className="dpwa-stat-lbl">معلقة</span></div>
              <div className="dpwa-stat-divider" />
              <div className="dpwa-stat"><span className="dpwa-stat-val">{tasks.filter(t => t.status === "in_progress").length}</span><span className="dpwa-stat-lbl">جارية</span></div>
              <div className="dpwa-stat-divider" />
              <div className="dpwa-stat"><span className="dpwa-stat-val">{(deliveredLiters / 1000).toFixed(0)}K</span><span className="dpwa-stat-lbl">لتر سُلِّم</span></div>
              {offlineCount > 0 && (
                <><div className="dpwa-stat-divider" />
                <div className="dpwa-stat"><span className="dpwa-stat-val dpwa-stat-warn">{offlineCount}</span><span className="dpwa-stat-lbl">مزامنة</span></div></>
              )}
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden", direction: "rtl" }}>

            {/* RIGHT column — cards list (RTL start) */}
            <div style={{ flex: "0 0 50%", display: "flex", flexDirection: "column", borderLeft: "1.5px solid #e0f2fe", background: "#f8faff", overflow: "hidden" }}>

              {/* Filter tabs */}
              {(() => {
                const filters: { key: "all" | "pending" | "in_progress" | "delivered"; label: string; icon: string; count: number }[] = [
                  { key: "all",         label: "الكل",     icon: "☰",  count: tasks.length },
                  { key: "pending",     label: "معلقة",    icon: "⏳", count: tasks.filter(t => t.status === "pending").length },
                  { key: "in_progress", label: "جارية",    icon: "🚛", count: tasks.filter(t => t.status === "in_progress").length },
                  { key: "delivered",   label: "مُسلَّمة", icon: "✅", count: tasks.filter(t => t.status === "delivered").length },
                ];
                return (
                  <div style={{ display: "flex", gap: 6, padding: "10px 12px 8px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
                    {filters.map(f => {
                      const active = taskFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setTaskFilter(f.key)}
                          style={{
                            flexShrink: 0,
                            padding: "6px 12px",
                            borderRadius: 22,
                            border: active ? "none" : "1.5px solid #e0f2fe",
                            background: active ? "linear-gradient(135deg,#0891b2,#0369a1)" : "#fff",
                            color: active ? "#fff" : "#0369a1",
                            fontWeight: 700,
                            fontSize: 12,
                            fontFamily: "inherit",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: active ? "0 2px 8px rgba(8,145,178,0.35)" : "0 1px 3px rgba(0,0,0,0.06)",
                            transition: "all 0.15s",
                          }}
                        >
                          <span>{f.icon}</span>
                          {f.label}
                          <span style={{
                            background: active ? "rgba(255,255,255,0.22)" : "#e0f2fe",
                            color: active ? "#fff" : "#0369a1",
                            borderRadius: 12,
                            padding: "1px 6px",
                            fontSize: 11,
                            fontWeight: 800,
                          }}>{f.count}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Scrollable cards area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* In-progress resume card */}
                {inProgressTask && (taskFilter === "all" || taskFilter === "in_progress") && (
                  <button
                    className="dpwa-resume-card"
                    style={{ borderRadius: 14, overflow: "hidden", flexShrink: 0 }}
                    onClick={() => { setActiveTask(inProgressTask); activeTaskRef.current = inProgressTask; setStage("navigate"); startGps(); }}
                  >
                    <div className="dpwa-resume-pulse-ring" />
                    <div className="dpwa-resume-info">
                      <div className="dpwa-resume-title">⚡ مهمة جارية — اضغط للاستكمال</div>
                      <div className="dpwa-resume-sub">
                        {zones.find(z => z.id === inProgressTask.zoneId)?.name} · {Number(inProgressTask.quantityLiters).toLocaleString()} لتر
                      </div>
                    </div>
                    <div className="dpwa-resume-arrow">←</div>
                  </button>
                )}

                {/* Task cards */}
                {(() => {
                  const filtered = tasks.filter(t => taskFilter === "all" ? true : t.status === taskFilter);
                  const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
                    pending:     { label: "معلقة",    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
                    in_progress: { label: "جارية",    color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
                    delivered:   { label: "مُسلَّمة", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
                    rejected:    { label: "مرفوضة",   color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
                  };
                  if (filtered.length === 0) return (
                    <div className="dpwa-empty-state" style={{ margin: "24px 0" }}>
                      <div className="dpwa-empty-icon">🚛</div>
                      <div className="dpwa-empty-title">لا توجد مهام</div>
                      <div className="dpwa-empty-sub">لا توجد مهام بهذه الحالة حالياً</div>
                    </div>
                  );
                  return filtered.map(task => {
                    const z = zones.find(zn => zn.id === task.zoneId);
                    const meta = STATUS_META[task.status] ?? { label: task.status, color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
                    const isDelivered = task.status === "delivered";
                    const isInProgress = task.status === "in_progress";
                    const isPending = task.status === "pending";
                    const clickable = isPending || isInProgress;
                    return (
                      <button
                        key={task.id}
                        dir="rtl"
                        disabled={!clickable}
                        onClick={() => {
                          if (isPending) acceptTask(task);
                          else if (isInProgress) { setActiveTask(task); activeTaskRef.current = task; setStage("navigate"); startGps(); }
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          background: "#fff",
                          border: `1.5px solid ${clickable ? "#e0f2fe" : "#f1f5f9"}`,
                          borderRadius: 14,
                          padding: "12px 14px",
                          textAlign: "right",
                          cursor: clickable ? "pointer" : "default",
                          opacity: isDelivered ? 0.75 : 1,
                          boxShadow: clickable ? "0 1px 6px rgba(8,145,178,0.08)" : "none",
                          fontFamily: "inherit",
                          width: "100%",
                          flexShrink: 0,
                          transition: "box-shadow 0.15s, border-color 0.15s",
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18,
                        }}>
                          {isDelivered ? "✅" : isInProgress ? "🚛" : "📦"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {z?.name ?? task.zoneId}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: meta.color,
                              background: meta.bg, border: `1px solid ${meta.border}`,
                              borderRadius: 10, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0,
                            }}>{meta.label}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                              🚰 {Number(task.quantityLiters).toLocaleString()} لتر
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              📅 {new Date(task.scheduledAt).toLocaleDateString("ar-SY", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            {z?.populationEstimate ? (
                              <span style={{ fontSize: 11, color: "#64748b" }}>👥 {z.populationEstimate.toLocaleString()}</span>
                            ) : null}
                          </div>
                        </div>
                        {clickable && (
                          <div style={{ color: "#0891b2", fontSize: 16, flexShrink: 0, fontWeight: 700 }}>←</div>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* LEFT column — map (RTL end, fills remaining width) */}
            <div style={{ flex: 1, position: "relative", background: "#e0f2fe" }}>
              {/* Legend */}
              <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, background: "rgba(255,255,255,0.92)", borderRadius: 10, padding: "6px 12px", display: "flex", gap: 12, fontSize: 11, fontWeight: 600, color: "#475569", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", backdropFilter: "blur(4px)" }}>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", marginLeft: 4 }} />معلقة</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#0891b2", marginLeft: 4 }} />جارية</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e", marginLeft: 4 }} />مُسلَّمة</span>
              </div>
              <div ref={dashMapDivRef} style={{ position: "absolute", inset: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE STAGES — FULL SCREEN OVERLAY ─────────────────── */}
      {stage !== "list" && (
        <div className="dpwa-overlay" dir="rtl">

          {/* ── ACCEPT STAGE ─────────────────────────────────────── */}
          {stage === "accept" && activeTask && (
            <div className="dpwa-screen">
              <div className="dpwa-top-bar">
                <button className="dpwa-back-btn" onClick={backToList}>✕</button>
                <span className="dpwa-top-label">مهمة جديدة</span>
                <div style={{ width: 36 }} />
              </div>

              <div className="dpwa-accept-body">
                <div className="dpwa-alert-glyph">🚛</div>
                <div className="dpwa-alert-title">مهمة توزيع جديدة!</div>
                <div className="dpwa-alert-sub">
                  تم تعيين هذه المهمة من قِبل {profile?.providerCompanyName ?? "المزود المسؤول"}
                </div>

                <div className="dpwa-details-card">
                  <div className="dpwa-detail-row">
                    <span className="dpwa-detail-icon">📍</span>
                    <div><div className="dpwa-detail-lbl">المنطقة</div><div className="dpwa-detail-val">{activeZone?.name ?? activeTask.zoneId}</div></div>
                  </div>
                  <div className="dpwa-detail-row">
                    <span className="dpwa-detail-icon">🚰</span>
                    <div><div className="dpwa-detail-lbl">الحصة المطلوبة</div><div className="dpwa-detail-val">{Number(activeTask.quantityLiters).toLocaleString()} لتر للتفريغ في نقطة التوزيع العامة</div></div>
                  </div>
                  <div className="dpwa-detail-row">
                    <span className="dpwa-detail-icon">📅</span>
                    <div><div className="dpwa-detail-lbl">الموعد</div><div className="dpwa-detail-val">{new Date(activeTask.scheduledAt).toLocaleDateString("ar-SY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div></div>
                  </div>
                  {activeZone && (
                    <div className="dpwa-detail-row">
                      <span className="dpwa-detail-icon">👥</span>
                      <div><div className="dpwa-detail-lbl">السكان المستفيدون</div><div className="dpwa-detail-val">{(activeZone.populationEstimate ?? 0).toLocaleString()} شخص</div></div>
                    </div>
                  )}
                  {activeTask.notes && (
                    <div className="dpwa-detail-row">
                      <span className="dpwa-detail-icon">📝</span>
                      <div><div className="dpwa-detail-lbl">ملاحظات</div><div className="dpwa-detail-val">{activeTask.notes}</div></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="dpwa-action-zone">
                <button className="dpwa-btn dpwa-btn-accept" onClick={() => setStage("route")}>
                  ✓ قبول المهمة والبدء
                </button>
              </div>
            </div>
          )}

          {/* ── ROUTE STAGE ──────────────────────────────────────── */}
          {stage === "route" && activeTask && (
            <div className="dpwa-screen">
              <div className="dpwa-top-bar">
                <button className="dpwa-back-btn" onClick={() => setStage("accept")}>←</button>
                <span className="dpwa-top-label">المرحلة 2 من 5</span>
                <div style={{ width: 36 }} />
              </div>

              <div className="dpwa-route-body">
                <div className="dpwa-route-glyph">🏭</div>
                <div className="dpwa-route-title">تعبئة الشاحنة والانطلاق</div>
                <div className="dpwa-route-sub">عند انطلاقك من المستودع، اضغط الزر أدناه لتفعيل تتبع موقعك حياً</div>

                <div className="dpwa-route-summary">
                  <div className="dpwa-route-summary-item"><span>📍</span><span>{activeZone?.name ?? activeTask.zoneId}</span></div>
                  <div className="dpwa-route-summary-item"><span>🚰</span><span>{Number(activeTask.quantityLiters).toLocaleString()} لتر</span></div>
                </div>

                <div className="dpwa-gps-note">
                  <div className="dpwa-gps-note-icon">📡</div>
                  <div>
                    <div className="dpwa-gps-note-title">تتبع حي مستمر</div>
                    <div className="dpwa-gps-note-sub">سيتم إرسال إحداثياتك كل 10 ثوانٍ تلقائياً لتحديث خريطة المنظمة والمزود في الوقت الحقيقي</div>
                  </div>
                </div>
              </div>

              <div className="dpwa-action-zone">
                <button className="dpwa-btn dpwa-btn-start" onClick={startRoute}>
                  🚛 بدء التحرك للشحن والتوزيع
                </button>
              </div>
            </div>
          )}

          {/* ── NAVIGATE STAGE ───────────────────────────────────── */}
          {stage === "navigate" && activeTask && (
            <div className="dpwa-screen dpwa-screen-map">
              <div className="dpwa-map-topbar">
                <div>
                  <div className="dpwa-map-zone">{activeZone?.name ?? activeTask.zoneId}</div>
                  <div className="dpwa-map-qty">🚰 {Number(activeTask.quantityLiters).toLocaleString()} لتر للتفريغ</div>
                </div>
                <div className={`dpwa-gps-badge ${gpsPos ? "dpwa-gps-on" : "dpwa-gps-off"}`}>
                  {gpsPos ? "● GPS نشط" : "⟳ تحديد الموقع..."}
                </div>
              </div>

              <div ref={mapDivRef} className="dpwa-map-canvas" />

              <div className="dpwa-map-footer">
                <button className="dpwa-btn dpwa-btn-arrive" onClick={() => setStage("proof")}>
                  📍 وصلنا الموقع — بدء التفريغ
                </button>
              </div>
            </div>
          )}

          {/* ── PROOF STAGE ──────────────────────────────────────── */}
          {stage === "proof" && activeTask && (
            <div className="dpwa-screen">
              <div className="dpwa-top-bar">
                <div style={{ width: 36 }} />
                <span className="dpwa-top-label">توثيق التسليم — مطلوب</span>
                <div style={{ width: 36 }} />
              </div>

              <div className="dpwa-proof-body">
                <div className="dpwa-proof-title">إثبات التسليم إلزامي</div>
                <div className="dpwa-proof-subtitle">التقط صورة لعداد الشاحنة أو نقطة التوزيع السكنية</div>

                {!proofPreview ? (
                  <label className="dpwa-camera-label">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofFile}
                      style={{ display: "none" }}
                    />
                    <div className="dpwa-camera-frame">
                      <div className="dpwa-cam-corner dpwa-c-tl" />
                      <div className="dpwa-cam-corner dpwa-c-tr" />
                      <div className="dpwa-cam-corner dpwa-c-bl" />
                      <div className="dpwa-cam-corner dpwa-c-br" />
                      <div className="dpwa-camera-inner">
                        <div className="dpwa-camera-glyph">📷</div>
                        <div className="dpwa-camera-hint">اضغط لفتح الكاميرا</div>
                        {gpsPos && (
                          <div className="dpwa-gps-pill">
                            📡 {gpsPos.lat.toFixed(4)}°N · {gpsPos.lng.toFixed(4)}°E
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="dpwa-proof-preview">
                    <img src={proofPreview} alt="دليل التسليم" />
                    <div className="dpwa-proof-geo-tag">
                      <div>🕐 {new Date().toLocaleTimeString("ar-SY")}</div>
                      {gpsPos && <div>📡 {gpsPos.lat.toFixed(4)}°N · {gpsPos.lng.toFixed(4)}°E</div>}
                      <div>✅ موثَّق جغرافياً</div>
                    </div>
                    <button className="dpwa-retake-btn" onClick={() => { setProofFile(null); setProofPreview(null); }}>
                      ↺ إعادة الالتقاط
                    </button>
                  </div>
                )}

                <div className="dpwa-security-note">
                  🔒 تُدمج الصورة مع الطابع الزمني والإحداثيات الجغرافية تلقائياً لمنع التلاعب
                </div>
              </div>

              <div className="dpwa-action-zone">
                <button
                  className={`dpwa-btn dpwa-btn-complete ${!proofFile ? "dpwa-btn-dim" : ""}`}
                  onClick={submitProof}
                  disabled={!proofFile || completing}
                >
                  {completing ? "⟳ جارٍ الحفظ والرفع..." : "✓ إغلاق المهمة بنجاح"}
                </button>
                {!proofFile && <div className="dpwa-proof-required-note">الصورة مطلوبة قبل إغلاق المهمة</div>}
                {locationError && (
                  <button
                    className="dpwa-btn"
                    style={{ marginTop: 10, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: 14 }}
                    onClick={() => { setLocationError(false); backToList(); }}
                  >
                    ← العودة لقائمة المهام
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── COMPLETE STAGE ───────────────────────────────────── */}
          {stage === "complete" && activeTask && (
            <div className="dpwa-screen dpwa-screen-done">
              <div className="dpwa-done-body">
                <div className="dpwa-done-icon">✅</div>
                <div className="dpwa-done-title">تم إغلاق المهمة بنجاح!</div>
                <div className="dpwa-done-sub">
                  {activeZone?.name ?? activeTask.zoneId} · {Number(activeTask.quantityLiters).toLocaleString()} لتر
                </div>

                {isOnline ? (
                  <div className="dpwa-sync-pill dpwa-sync-online">
                    <span>✓</span>
                    <span>تمت مزامنة البيانات فوراً مع السيرفر</span>
                  </div>
                ) : (
                  <div className="dpwa-sync-pill dpwa-sync-offline">
                    <span>💾</span>
                    <div>
                      <div>تم حفظ الإثبات محلياً بأمان</div>
                      <div className="dpwa-sync-sub">سيتم الرفع تلقائياً فور توفر التغطية</div>
                    </div>
                  </div>
                )}

                {offlineCount > 0 && (
                  <div className="dpwa-offline-count">
                    📶 {offlineCount} مهمة بانتظار المزامنة عند توفر الإنترنت
                  </div>
                )}
              </div>

              <div className="dpwa-action-zone">
                <button className="dpwa-btn dpwa-btn-next" onClick={backToList}>
                  → الانتقال للمهمة التالية
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
