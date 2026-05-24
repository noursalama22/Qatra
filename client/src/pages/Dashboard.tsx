import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { NgoContract, RegionProvider } from "../api";
import { parseProviderFromNotes, TASK_STATUS_UI } from "../lib/ngoTaskUtils";

const MY_NGO_ID = "seed-n1";

const ZONE_REGION: Record<string, string> = {
  "seed-z1": "seed-rg1", "seed-z6": "seed-rg1", "seed-z7": "seed-rg1", "seed-z8": "seed-rg1",
  "seed-z2": "seed-rg2", "seed-z9": "seed-rg2", "seed-z10": "seed-rg2", "seed-z11": "seed-rg2",
  "seed-z12": "seed-rg2", "seed-z13": "seed-rg2",
  "seed-z3": "seed-rg3", "seed-z14": "seed-rg3", "seed-z15": "seed-rg3", "seed-z16": "seed-rg3", "seed-z17": "seed-rg3",
  "seed-z4": "seed-rg4", "seed-z18": "seed-rg4", "seed-z19": "seed-rg4", "seed-z20": "seed-rg4",
  "seed-z5": "seed-rg5", "seed-z21": "seed-rg5", "seed-z22": "seed-rg5",
};

type Zone = {
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

type Task = {
  id: string;
  ngoId: string;
  zoneId: string;
  status: string;
  quantityLiters: string;
  scheduledAt: string;
  notes: string | null;
  assignedProviderIds: string[];
};

const TIME_SLOTS = [
  { h: 6, label: "06:00 – 08:00" },
  { h: 8, label: "08:00 – 10:00" },
  { h: 10, label: "10:00 – 12:00" },
  { h: 12, label: "12:00 – 14:00" },
  { h: 14, label: "14:00 – 16:00" },
  { h: 16, label: "16:00 – 18:00" },
];

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type MapZone = Zone & { center?: [number, number] };

type NeedLevel = "low" | "medium" | "high";

function needLevel(signalCount: number): NeedLevel {
  if (signalCount > 50) return "high";
  if (signalCount > 25) return "medium";
  return "low";
}

const NEED_COLORS: Record<NeedLevel, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

function isZoneCovered(zone: Zone, tasks: Task[]): boolean {
  const active = tasks.some(
    t => t.zoneId === zone.id && (t.status === "in_progress" || t.status === "pending"),
  );
  if (active) return true;
  if (!zone.lastDeliveryAt) return false;
  const days = (Date.now() - new Date(zone.lastDeliveryAt).getTime()) / 86400000;
  return days <= 3;
}

function zoneStyle(zone: Zone, tasks: Task[], selected: boolean) {
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

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getNextDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function regionForZone(zone: Zone): string | null {
  return zone.regionId ?? ZONE_REGION[zone.id] ?? null;
}

type Wallet = { available: number; escrow: number };

type Props = {
  onToast: (msg: string) => void;
  wallet: Wallet;
  setWallet: Dispatch<SetStateAction<Wallet>>;
};

export default function Dashboard({ onToast, wallet, setWallet }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleZoneId = searchParams.get("zone");

  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const myTasks = tasks.filter(t => t.ngoId === MY_NGO_ID);
  const activeContracts = contracts.filter(c => c.status === "active");
  const dailyCapacity = activeContracts.reduce(
    (sum, c) => sum + parseFloat(c.dailyQuantityLiters || "0"),
    0,
  );

  const load = useCallback(async () => {
    const [mapRes, tRes, cRes] = await Promise.all([
      fetch("/api/map").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch(`/api/ngos/${MY_NGO_ID}/contracts`).then(r => r.json()),
    ]);
    const mapZones: MapZone[] = mapRes.zones ?? [];
    setZones(mapZones.map(z => ({
      id: z.id,
      name: z.name,
      status: z.status,
      regionId: null,
      populationEstimate: z.populationEstimate ?? 0,
      signalCount: z.signalCount ?? 0,
      lastDeliveryAt: z.lastDeliveryAt ?? null,
      description: "",
      boundary: z.boundary ?? null,
    })));
    setTasks(tRes.data ?? []);
    setContracts(cRes.data ?? []);
    setLoading(false);
  }, []);

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

  // Map init — runs after loading finishes so the container exists
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

  // Draw zones when map is ready
  useEffect(() => {
    if (!mapReady || scheduleZoneId || !zones.length || !mapRef.current || !layerRef.current) return;

    import("leaflet").then(L => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const allPoints: [number, number][] = [];

      zones.forEach(zone => {
        if (!zone.boundary || zone.boundary.length < 3) return;
        const style = zoneStyle(zone, myTasks, false);
        const poly = L.polygon(zone.boundary, {
          ...style,
          smoothFactor: 2,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(layer);

        allPoints.push(...zone.boundary);

        const covered = isZoneCovered(zone, myTasks);
        const need = needLevel(zone.signalCount);
        const statusLabel = covered ? "مغطى حالياً" : need === "high" ? "احتياج عالٍ" : need === "medium" ? "احتياج متوسط" : "احتياج منخفض";

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

  const openSchedule = (zoneId: string) => {
    setSearchParams({ zone: zoneId });
  };

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
        ngoId: MY_NGO_ID,
        zoneId: scheduleZone.id,
        quantityLiters: String(liters),
        scheduledAt: dt.toISOString(),
        notes: `مزود: ${selectedProvider.companyName}`,
      }),
    });

    setWallet((w: Wallet) => ({
      available: w.available - missionCost,
      escrow: w.escrow + missionCost,
    }));
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
        <p>جارٍ تحميل لوحة التوزيع…</p>
      </div>
    );
  }

  if (scheduleZone) {
    const days = getNextDays(7);
    return (
      <div className="dash-schedule-view" dir="rtl">
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

        <div className="dash-legend">
          <div className="dash-legend-title">دليل الخريطة</div>
          <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#ef4444" }} />احتياج عالٍ — غير مغطى</div>
          <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#f59e0b" }} />احتياج متوسط — غير مغطى</div>
          <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#22c55e" }} />احتياج منخفض — غير مغطى</div>
          <div className="dash-legend-item"><span className="dash-dot" style={{ background: "#86efac", border: "1px solid #16a34a" }} />مغطى (توزيع حديث أو نشط)</div>
        </div>

        <p className="dash-sidebar-hint">انقر على أي منطقة في الخريطة لجدولة توزيع مياه.</p>
      </aside>

      <div className="dash-map-wrap">
        <div ref={mapDivRef} className="dash-map" role="application" aria-label="خريطة احتياج المياه" />
      </div>

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
                    onClick={() => openSchedule(task.zoneId)}
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
