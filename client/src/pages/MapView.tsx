import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

type ZoneFeature = {
  id: string; name: string; status: string;
  populationEstimate: number; signalCount: number;
  lastDeliveryAt: string | null;
  boundary: [number, number][] | null;
  center: [number, number];
  tasks: { id: string; status: string; quantityLiters: string; scheduledAt: string }[];
};

type DriverFeature = {
  id: string; vehicleType: string; status: string; driverType: string;
  providerId: string | null; providerName: string | null;
  lat: number; lng: number; recordedAt: string;
  activeTask: { zoneId: string; status: string; quantityLiters: string } | null;
};

type MapData = { zones: ZoneFeature[]; drivers: DriverFeature[] };

const SIGNAL_COLOR = (count: number) =>
  count > 50 ? "#ef4444" : count > 25 ? "#f59e0b" : "#10b981";

const TASK_STATUS_COLOR: Record<string, string> = {
  in_progress: "#2563eb", pending: "#f59e0b",
  delivered: "#10b981", cancelled: "#94a3b8",
};

export default function MapView() {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [data, setData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<ZoneFeature | DriverFeature | null>(null);
  const [selectedType, setSelectedType] = useState<"zone" | "driver" | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "drivers">("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    const r = await fetch("/api/map");
    if (r.ok) { setData(await r.json()); setLastRefresh(new Date()); }
  };

  // Init map
  useEffect(() => {
    if (!mapDivRef.current) return;
    let cancelled = false;

    import("leaflet").then(L => {
      if (cancelled || !mapDivRef.current) return;
      // If a stale map exists on the container, remove it first
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, {
        center: [35.5, 37.5],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      if (layerRef.current) { layerRef.current = null; }
    };
  }, []);

  // Fetch data on mount and auto-refresh
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 15000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  // Draw layers when data or filter changes
  useEffect(() => {
    if (!data || !layerRef.current) return;
    import("leaflet").then(L => {
      layerRef.current!.clearLayers();

      const zones = filter === "drivers" ? [] :
        filter === "active" ? data.zones.filter(z => z.status === "active") : data.zones;

      // Draw zones
      zones.forEach(zone => {
        const color = SIGNAL_COLOR(zone.signalCount);
        if (zone.boundary && zone.boundary.length > 2) {
          const poly = L.polygon(zone.boundary, {
            color, weight: 2.5, fillColor: color, fillOpacity: 0.18,
          }).addTo(layerRef.current!);
          poly.on("click", () => { setSelected(zone); setSelectedType("zone"); });
          poly.bindTooltip(`<b>${zone.name}</b><br/>${zone.signalCount} signals`, { sticky: true });
        }

        // Zone center marker
        const icon = L.divIcon({
          html: `<div class="zone-pin" style="background:${color}">
            <span>${zone.signalCount}</span>
          </div>`,
          className: "",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        const marker = L.marker(zone.center, { icon }).addTo(layerRef.current!);
        marker.on("click", () => { setSelected(zone); setSelectedType("zone"); });

        // Active task indicator
        const activeTasks = zone.tasks.filter(t => t.status === "in_progress");
        if (activeTasks.length > 0) {
          const pulseIcon = L.divIcon({
            html: `<div class="pulse-ring" style="border-color:#2563eb"><div class="pulse-dot" style="background:#2563eb"></div></div>`,
            className: "",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          const offset: [number, number] = [zone.center[0] + 0.03, zone.center[1] + 0.03];
          L.marker(offset, { icon: pulseIcon }).addTo(layerRef.current!);
        }
      });

      // Draw drivers
      const drivers = filter === "active" ? data.drivers : data.drivers;
      if (filter !== "all" || true) {
        drivers.forEach(driver => {
          const isActive = driver.status === "active";
          const hasTask = !!driver.activeTask;
          const dColor = hasTask ? "#2563eb" : isActive ? "#10b981" : "#94a3b8";
          const icon = L.divIcon({
            html: `<div class="driver-pin" style="background:${dColor};${hasTask ? "animation:pulse-glow 2s infinite" : ""}">
              <span>${hasTask ? "🚛" : "👷"}</span>
            </div>`,
            className: "",
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          const marker = L.marker([driver.lat, driver.lng], { icon }).addTo(layerRef.current!);
          marker.on("click", () => { setSelected(driver as any); setSelectedType("driver"); });
          marker.bindTooltip(`<b>${driver.vehicleType}</b><br/>${hasTask ? "🚛 جارٍ التوصيل" : "متوقف"}`, { sticky: true });
        });
      }
    });
  }, [data, filter]);

  const isDriver = (s: any): s is DriverFeature => "lat" in s;
  const isZone = (s: any): s is ZoneFeature => "boundary" in s;

  return (
    <div className="map-page">
      {/* Toolbar */}
      <div className="map-toolbar">
        <div className="map-filters">
          {(["all", "active", "drivers"] as const).map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "🗺️ الكل" : f === "active" ? "🟢 المناطق النشطة" : "🚛 السائقون فقط"}
            </button>
          ))}
        </div>
        <div className="map-meta">
          <span style={{ fontSize: 12, color: "#64748b" }}>
            آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SY")}
          </span>
          <button
            className={`filter-btn ${autoRefresh ? "active" : ""}`}
            onClick={() => setAutoRefresh(v => !v)}
            style={{ fontSize: 12 }}
          >
            {autoRefresh ? "🔄 تلقائي" : "⏸ موقوف"}
          </button>
          <button className="btn btn-outline btn-sm" onClick={fetchData}>↻ تحديث</button>
        </div>
      </div>

      <div className="map-body">
        {/* Map container */}
        <div ref={mapDivRef} className="map-container" />

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-title">الدليل</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#10b981" }} />إشارات منخفضة</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#f59e0b" }} />إشارات متوسطة</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#ef4444" }} />إشارات عالية</div>
          <div style={{ borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />
          <div className="legend-item"><span className="legend-dot" style={{ background: "#2563eb" }} />🚛 سائق نشط</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#10b981" }} />👷 سائق متوقف</div>
        </div>

        {/* Info Panel */}
        {selected && selectedType && (
          <div className="map-panel" dir="rtl">
            <button className="panel-close" onClick={() => { setSelected(null); setSelectedType(null); }}>✕</button>
            {selectedType === "zone" && isZone(selected) && (
              <>
                <div className="panel-title">🗺️ {selected.name}</div>
                <div className="panel-badge" style={{ background: SIGNAL_COLOR(selected.signalCount) + "22", color: SIGNAL_COLOR(selected.signalCount) }}>
                  {selected.signalCount} إشارة احتياج
                </div>
                <div className="panel-stats">
                  <div className="panel-stat">
                    <div className="panel-stat-val">{(selected.populationEstimate ?? 0).toLocaleString()}</div>
                    <div className="panel-stat-label">ساكن</div>
                  </div>
                  <div className="panel-stat">
                    <div className="panel-stat-val">{selected.tasks.filter(t => t.status === "in_progress").length}</div>
                    <div className="panel-stat-label">مهام جارية</div>
                  </div>
                  <div className="panel-stat">
                    <div className="panel-stat-val">{selected.tasks.filter(t => t.status === "pending").length}</div>
                    <div className="panel-stat-label">مجدولة</div>
                  </div>
                </div>
                {selected.lastDeliveryAt && (
                  <div className="panel-row">
                    <span>آخر توزيع</span>
                    <span>{new Date(selected.lastDeliveryAt).toLocaleDateString("ar-SY")}</span>
                  </div>
                )}
                <div className="panel-section">مهام التوزيع</div>
                {selected.tasks.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>لا توجد مهام</div>
                ) : selected.tasks.slice(0, 4).map(t => (
                  <div key={t.id} className="panel-task">
                    <span className={`badge badge-sm ${TASK_STATUS_COLOR[t.status] ? "" : "badge-gray"}`}
                      style={{ background: (TASK_STATUS_COLOR[t.status] ?? "#94a3b8") + "22", color: TASK_STATUS_COLOR[t.status] ?? "#94a3b8", fontSize: 11 }}>
                      {t.status.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(t.quantityLiters).toLocaleString()} L</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(t.scheduledAt).toLocaleDateString("ar-SY")}</span>
                  </div>
                ))}
              </>
            )}
            {selectedType === "driver" && isDriver(selected) && (
              <>
                <div className="panel-title">🚛 {selected.vehicleType}</div>
                <div className="panel-badge" style={{
                  background: selected.status === "active" ? "#dcfce7" : "#f1f5f9",
                  color: selected.status === "active" ? "#16a34a" : "#64748b"
                }}>
                  {selected.status === "active" ? "نشط" : selected.status}
                </div>
                <div className="panel-stats">
                  <div className="panel-stat">
                    <div className="panel-stat-val" style={{ fontSize: 18 }}>{selected.driverType === "owned" ? "🏢" : "🧑"}</div>
                    <div className="panel-stat-label">{selected.driverType === "owned" ? "تابع" : "مستقل"}</div>
                  </div>
                </div>
                {selected.providerName && (
                  <div className="panel-row"><span>المزود</span><span>{selected.providerName}</span></div>
                )}
                <div className="panel-row">
                  <span>الموقع</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{selected.lat.toFixed(4)}°N, {selected.lng.toFixed(4)}°E</span>
                </div>
                <div className="panel-row">
                  <span>آخر تحديث</span>
                  <span>{new Date(selected.recordedAt).toLocaleTimeString("ar-SY")}</span>
                </div>
                {selected.activeTask && (
                  <>
                    <div className="panel-section">المهمة الحالية</div>
                    <div className="panel-task">
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>جارٍ التوصيل</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(selected.activeTask.quantityLiters).toLocaleString()} L</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Summary bar */}
        {data && (
          <div className="map-summary">
            <div className="summary-item">
              <span className="summary-dot" style={{ background: "#10b981" }} />
              <span>{data.zones.filter(z => z.status === "active").length} مناطق نشطة</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-dot" style={{ background: "#2563eb" }} />
              <span>{data.drivers.length} سائق على الخريطة</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-dot" style={{ background: "#f59e0b" }} />
              <span>{data.zones.reduce((s, z) => s + z.tasks.filter(t => t.status === "in_progress").length, 0)} توزيع جارٍ</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span>🆘</span>
              <span>{data.zones.reduce((s, z) => s + z.signalCount, 0)} إشارة احتياج</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
