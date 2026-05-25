import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { NgoContract, RegionProvider } from "../../api";
import { parseProviderFromNotes, TASK_STATUS_UI } from "../../lib/ngoTaskUtils";
import {
  AR_DAYS,
  dayKey,
  getNextDays,
  isZoneCovered,
  MapTask,
  MapZone,
  needLevel,
  regionForZone,
  TIME_SLOTS,
  Wallet,
  zoneStyle,
} from "../../lib/zoneMapUtils";

type LatLng = [number, number];

type ApiMapZone = Omit<MapZone, "boundary" | "center"> & {
  boundary?: unknown;
  center?: unknown;
  regionId?: string | null;
  description?: string | null;
};

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeLatLng(value: unknown): LatLng | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lat = Number(value[0]);
  const lng = Number(value[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

function normalizeGeoJsonLngLat(value: unknown): LatLng | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

function normalizeBoundary(rawValue: unknown): LatLng[] | null {
  const value = parseJsonLike(rawValue);

  if (Array.isArray(value)) {
    const direct = value
      .map(normalizeLatLng)
      .filter((point): point is LatLng => Boolean(point));
    if (direct.length >= 3) return direct;

    const firstRing = value.find(Array.isArray);
    return firstRing ? normalizeBoundary(firstRing) : null;
  }

  if (value && typeof value === "object" && "coordinates" in value) {
    const geo = value as { type?: string; coordinates?: unknown };
    if (geo.type === "Polygon" && Array.isArray(geo.coordinates)) {
      const ring = geo.coordinates[0];
      if (Array.isArray(ring)) {
        const points = ring
          .map(normalizeGeoJsonLngLat)
          .filter((point): point is LatLng => Boolean(point));
        return points.length >= 3 ? points : null;
      }
    }
    if (geo.type === "MultiPolygon" && Array.isArray(geo.coordinates)) {
      return normalizeBoundary({ type: "Polygon", coordinates: geo.coordinates[0] });
    }
  }

  return null;
}

function normalizeCenter(rawValue: unknown, boundary: LatLng[] | null): LatLng | null {
  const value = parseJsonLike(rawValue);
  const direct = normalizeLatLng(value);
  if (direct) return direct;

  if (value && typeof value === "object" && "coordinates" in value) {
    const geo = value as { type?: string; coordinates?: unknown };
    if (geo.type === "Point") return normalizeGeoJsonLngLat(geo.coordinates);
  }

  if (!boundary?.length) return null;
  const lat = boundary.reduce((sum, point) => sum + point[0], 0) / boundary.length;
  const lng = boundary.reduce((sum, point) => sum + point[1], 0) / boundary.length;
  return [lat, lng];
}

function zoneStatusLabel(zone: MapZone, tasks: MapTask[]) {
  const covered = isZoneCovered(zone, tasks);
  const need = needLevel(zone.signalCount);
  return covered ? "مغطى حالياً" : need === "high" ? "احتياج عالٍ" : need === "medium" ? "احتياج متوسط" : "احتياج منخفض";
}

type Props = {
  onToast: (msg: string) => void;
  wallet: Wallet;
  setWallet: Dispatch<SetStateAction<Wallet>>;
  layout?: "dashboard" | "fullscreen";
  ngoId: string;
};

function MapLegend({ className }: { className?: string }) {
  return (
    <div className={`dash-legend ${className ?? ""}`}>
      <div className="dash-legend-title">دليل الخريطة</div>
      <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#ef4444" }} />احتياج عالٍ — غير مغطى</div>
      <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#f59e0b" }} />احتياج متوسط — غير مغطى</div>
      <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#22c55e" }} />احتياج منخفض — غير مغطى</div>
      <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#86efac", border: "1px solid #16a34a" }} />مغطى (توزيع حديث أو نشط)</div>
    </div>
  );
}

export default function NgoDistributionMap({
  onToast,
  wallet,
  setWallet,
  layout = "dashboard",
  ngoId,
}: Props) {
  const isFullscreen = layout === "fullscreen";
  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleZoneId = searchParams.get("zone");

  const [zones, setZones] = useState<MapZone[]>([]);
  const [tasks, setTasks] = useState<MapTask[]>([]);
  const [contracts, setContracts] = useState<NgoContract[]>([]);
  const [regionProviders, setRegionProviders] = useState<RegionProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [qty, setQty] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<RegionProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const scheduleZone = scheduleZoneId ? zones.find(z => z.id === scheduleZoneId) ?? null : null;
  const myTasks = tasks.filter(t => t.ngoId === ngoId);
  const activeContracts = contracts.filter(c => c.status === "active");
  const dailyCapacity = activeContracts.reduce(
    (sum, c) => sum + parseFloat(c.dailyQuantityLiters || "0"),
    0,
  );

  const load = useCallback(async () => {
    const [zRes, tRes, cRes] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch(`/api/ngos/${ngoId}/contracts`).then(r => r.json()),
    ]);
    const mapZones: ApiMapZone[] = zRes.data ?? [];
    setZones(mapZones.map(z => {
      const boundary = normalizeBoundary(z.boundary);
      const center = normalizeCenter(z.center, boundary);
      return {
        id: z.id,
        name: z.name,
        status: z.status,
        regionId: z.regionId ?? null,
        populationEstimate: z.populationEstimate ?? 0,
        signalCount: z.signalCount ?? 0,
        lastDeliveryAt: z.lastDeliveryAt ?? null,
        description: z.description ?? "",
        boundary,
        center,
      };
    }));
    setTasks(tRes.data ?? []);
    setContracts(cRes.data ?? []);
    setLoading(false);
  }, [ngoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!scheduleZone) {
      setRegionProviders([]);
      setSelectedProvider(null);
      return;
    }
    const regionId = regionForZone(scheduleZone);
    if (!regionId) {
      setRegionProviders([]);
      return;
    }
    fetch(`/api/regions/${regionId}/providers`)
      .then(r => r.json())
      .then(res => setRegionProviders(res.data ?? []));
    setSelectedProvider(null);
    setSelectedSlot(null);
    setQty("");
  }, [scheduleZone?.id]);

  useEffect(() => {
    if (loading || scheduleZoneId) return;
    let cancelled = false;

    import("leaflet").then(L => {
      if (cancelled || !mapDivRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, { center: [31.42, 34.37], zoom: 11, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, [loading, scheduleZoneId]);

  useEffect(() => {
    if (!mapReady || scheduleZoneId || !zones.length || !mapRef.current || !layerRef.current) return;

    import("leaflet").then(L => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const allPoints: [number, number][] = [];

      zones.forEach(zone => {
        const style = zoneStyle(zone, myTasks, false);
        const statusLabel = zoneStatusLabel(zone, myTasks);

        if (!zone.boundary || zone.boundary.length < 3) {
          if (!zone.center) return;
          const marker = L.circleMarker(zone.center, {
            ...style,
            radius: 13,
            fillOpacity: Math.max(style.fillOpacity, 0.62),
          }).addTo(layer);
          allPoints.push(zone.center);
          marker.bindTooltip(
            `<b>${zone.name}</b><br/>${statusLabel}<br/>${zone.signalCount} إشارة`,
            { sticky: true, className: "dash-map-tooltip" },
          );
          marker.on("click", () => {
            setSearchParams({ zone: zone.id });
          });
          return;
        }

        const poly = L.polygon(zone.boundary, {
          ...style,
          smoothFactor: 2,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(layer);

        allPoints.push(...zone.boundary);

        poly.bindTooltip(
          `<b>${zone.name}</b><br/>${statusLabel}<br/>${zone.signalCount} إشارة`,
          { sticky: true, className: "dash-map-tooltip" },
        );
        poly.on("click", () => {
          setSearchParams({ zone: zone.id });
        });
      });

      if (allPoints.length > 0) {
        map.fitBounds(allPoints, { padding: [28, 28] });
      }
      map.invalidateSize();
    });
  }, [mapReady, zones, myTasks, scheduleZoneId, setSearchParams]);

  const closeSchedule = () => {
    setSearchParams({});
    setSelectedSlot(null);
    setQty("");
    setSelectedProvider(null);
  };

  const liters = Number(qty) || 0;
  const unitPrice = selectedProvider ? parseFloat(selectedProvider.pricePerLiter) : 0;
  const missionCost = liters * unitPrice;

  const submitTask = async () => {
    if (!scheduleZone || selectedSlot === null || !selectedProvider || liters <= 0) return;
    if (missionCost > wallet.available) {
      onToast("الرصيد غير كافٍ لهذه المهمة");
      return;
    }
    setSubmitting(true);
    const dt = new Date(selectedDay);
    dt.setHours(selectedSlot, 0, 0, 0);

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ngoId: ngoId,
        zoneId: scheduleZone.id,
        quantityLiters: String(liters),
        scheduledAt: dt.toISOString(),
        estimatedCost: missionCost,
        notes: `مزود: ${selectedProvider.companyName}`,
      }),
    });

    const walletRes = await fetch(`/api/ngos/${ngoId}/wallet`).then(r => r.json());
    setWallet({ available: walletRes.available ?? 0, escrow: walletRes.escrow ?? 0 });
    await load();
    setSubmitting(false);
    onToast("تم إرسال المهمة للمزود");
    closeSchedule();
  };

  const recentTasks = [...myTasks]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>جارٍ تحميل الخريطة…</p>
      </div>
    );
  }

  if (scheduleZone) {
    const days = getNextDays(7);
    return (
      <div className={`dash-schedule-view ${isFullscreen ? "dash-schedule-view--fullscreen" : ""}`} dir="rtl">
        <header className="dash-schedule-header">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeSchedule}>
            ← العودة للخريطة
          </button>
          <div>
            <h2 className="dash-schedule-title">{scheduleZone.name}</h2>
            <p className="dash-schedule-sub">
              {scheduleZone.signalCount} إشارة احتياج ·{" "}
              {isZoneCovered(scheduleZone, myTasks) ? "منطقة مغطى بتوزيع نشط" : "تحتاج تغطية"}
            </p>
          </div>
        </header>

        <div className="dash-schedule-body">
          <section className="dash-schedule-panel">
            <h3 className="dash-panel-heading">اختر التاريخ</h3>
            <div className="dash-day-strip">
              {days.map(d => {
                const dk = dayKey(d);
                const isToday = dk === dayKey(new Date());
                return (
                  <button
                    key={dk}
                    type="button"
                    className={`dash-day-chip ${selectedDay === dk ? "dash-day-chip-active" : ""} ${isToday ? "dash-day-today" : ""}`}
                    onClick={() => setSelectedDay(dk)}
                  >
                    <span className="dash-day-name">{AR_DAYS[d.getDay()]}</span>
                    <span className="dash-day-num">{d.getDate()}/{d.getMonth() + 1}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="dash-panel-heading">الفترة الزمنية</h3>
            <div className="dash-slot-list">
              {TIME_SLOTS.map(slot => {
                const slotDate = new Date(selectedDay);
                slotDate.setHours(slot.h + 2, 0, 0, 0);
                const isPast = slotDate < new Date();
                const taken = myTasks.some(t => {
                  if (t.zoneId !== scheduleZone.id || t.status === "cancelled" || t.status === "delivered") return false;
                  const dt = new Date(t.scheduledAt);
                  return dayKey(dt) === selectedDay && dt.getHours() >= slot.h && dt.getHours() < slot.h + 2;
                });

                return (
                  <button
                    key={slot.h}
                    type="button"
                    disabled={isPast || taken}
                    className={`dash-slot-btn ${selectedSlot === slot.h ? "dash-slot-btn-active" : ""} ${taken ? "dash-slot-taken" : ""}`}
                    onClick={() => setSelectedSlot(slot.h)}
                  >
                    <span>{slot.label}</span>
                    {taken && <span className="dash-slot-badge">محجوز</span>}
                    {!taken && !isPast && selectedSlot === slot.h && <span className="dash-slot-badge dash-slot-badge-ok">محدد</span>}
                  </button>
                );
              })}
            </div>

            <h3 className="dash-panel-heading">كمية المياه (لتر)</h3>
            <input
              type="number"
              className="form-control dash-qty-input"
              min={100}
              step={100}
              placeholder="مثال: 10000"
              value={qty}
              onChange={e => {
                setQty(e.target.value);
                setSelectedProvider(null);
              }}
            />
          </section>

          <section className="dash-schedule-panel dash-provider-panel">
            <h3 className="dash-panel-heading">مزود الخدمة والتكلفة</h3>
            {selectedSlot === null || liters <= 0 ? (
              <p className="dash-hint">اختر الوقت وأدخل الكمية لعرض المزودين والأسعار.</p>
            ) : regionProviders.length === 0 ? (
              <p className="dash-hint">لا يوجد مزودون معتمدون لهذه المنطقة.</p>
            ) : (
              <div className="dash-provider-list">
                {regionProviders.map(p => {
                  const price = parseFloat(p.pricePerLiter);
                  const total = liters * price;
                  const selected = selectedProvider?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`dash-provider-card ${selected ? "dash-provider-card-selected" : ""}`}
                      onClick={() => setSelectedProvider(selected ? null : p)}
                    >
                      <div className="dash-provider-card-top">
                        <span className="dash-provider-name">{p.companyName}</span>
                        <span className="dash-provider-total">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="dash-provider-meta">
                        <span>${price.toFixed(3)} / لتر</span>
                        <span>{p.operatingModes.includes("humanitarian") ? "إنساني" : "تجاري"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedProvider && liters > 0 && (
              <div className="dash-cost-summary">
                <div className="dash-cost-row">
                  <span>الكمية</span>
                  <strong>{liters.toLocaleString()} لتر</strong>
                </div>
                <div className="dash-cost-row">
                  <span>سعر اللتر</span>
                  <strong>${unitPrice.toFixed(3)}</strong>
                </div>
                <div className="dash-cost-row dash-cost-total">
                  <span>تكلفة المهمة</span>
                  <strong>${missionCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary dash-send-btn"
              disabled={!selectedProvider || selectedSlot === null || liters <= 0 || submitting}
              onClick={submitTask}
            >
              {submitting ? "جارٍ الإرسال…" : "إرسال المهمة للمزود"}
            </button>
          </section>
        </div>
      </div>
    );
  }

  const mapBlock = (
    <div className={isFullscreen ? "ngo-map-full" : "dash-map-wrap"}>
      <div
        ref={mapDivRef}
        className={isFullscreen ? "ngo-map-canvas dash-map" : "dash-map"}
        role="application"
        aria-label="خريطة احتياج المياه"
      />
      {isFullscreen && (
        <div className="ngo-map-legend-overlay" aria-label="دليل الخريطة">
          <MapLegend />
          <p className="dash-sidebar-hint ngo-map-hint">انقر على أي منطقة لجدولة توزيع مياه.</p>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="ngo-map-page" dir="rtl">
        {mapBlock}
      </div>
    );
  }

  return (
    <div className="dash-layout" dir="rtl">
      <aside className="dash-sidebar">
        <div className="dash-stat-cards">
          <div className="dash-stat-card">
            <span className="dash-stat-label">سعة التوزيع اليومية (عقود)</span>
            <span className="dash-stat-value">
              {dailyCapacity > 0 ? `${(dailyCapacity / 1000).toFixed(1)}K` : "—"} لتر
            </span>
            <span className="dash-stat-sub">{activeContracts.length} عقد نشط</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">المحفظة المتاحة</span>
            <span className="dash-stat-value">${wallet.available.toLocaleString()}</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">مهام قيد التنفيذ</span>
            <span className="dash-stat-value">
              {myTasks.filter(t => t.status === "pending" || t.status === "in_progress").length}
            </span>
          </div>
        </div>

        <MapLegend />
        <p className="dash-sidebar-hint">انقر على أي منطقة في الخريطة لجدولة توزيع مياه.</p>
      </aside>

      {mapBlock}

      <section className="dash-tasks-bar" aria-label="حالة المهام">
        <div className="dash-tasks-bar-head">
          <h3 className="dash-tasks-heading">مهامي الأخيرة — حالة المزود</h3>
          <Link to="/ngo/tasks" className="btn btn-outline btn-sm dash-tasks-see-all">
            عرض الكل ({myTasks.length})
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <p className="dash-tasks-empty">لا توجد مهام بعد. اختر منطقة من الخريطة لبدء جدولة توزيع.</p>
        ) : (
          <div className="dash-tasks-scroll">
            {recentTasks.map(task => {
              const zone = zones.find(z => z.id === task.zoneId);
              const st = TASK_STATUS_UI[task.status] ?? { label: task.status, cls: "dash-status-todo" };
              const providerName = parseProviderFromNotes(task.notes);
              return (
                <article key={task.id} className="dash-task-card">
                  <div className="dash-task-card-top">
                    <strong>{zone?.name ?? task.zoneId}</strong>
                    <span className={`dash-status-pill ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="dash-task-card-meta">
                    <span>{Number(task.quantityLiters).toLocaleString()} لتر</span>
                    <span>{new Date(task.scheduledAt).toLocaleDateString("ar-SY")}</span>
                    {providerName && <span>{providerName}</span>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSearchParams({ zone: task.zoneId })}
                  >
                    عرض المنطقة
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
