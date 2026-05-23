import { useState, useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

const MY_NGO_ID = "seed-n1";

type Zone = {
  id: string; name: string; status: string; populationEstimate: number;
  signalCount: number; lastDeliveryAt: string | null; description: string;
  boundary: [number, number][] | null;
};
type Task = {
  id: string; ngoId: string; zoneId: string; status: string;
  quantityLiters: string; scheduledAt: string; notes: string | null;
  assignedProviderIds: string[];
};
type Provider = { id: string; companyName: string; operatingModes: string[]; status: string };

const PROVIDER_EXT: Record<string, {
  trustScore: number; completedJobs: number; freeFleet: number;
  pricePerLiter: number; source: string;
}> = {
  "seed-p1": { trustScore: 4.9, completedJobs: 60, freeFleet: 3, pricePerLiter: 0.045, source: "محطة تحلية الشفاء" },
  "seed-p2": { trustScore: 4.6, completedJobs: 38, freeFleet: 2, pricePerLiter: 0.038, source: "محطة رفح المركزية" },
};

const TIME_SLOTS = [
  { h: 6,  label: "6–8 صباحاً"  },
  { h: 8,  label: "8–10 صباحاً" },
  { h: 10, label: "10–12 ظهراً" },
  { h: 12, label: "12–2 ظهراً"  },
  { h: 14, label: "2–4 مساءً"   },
  { h: 16, label: "4–6 مساءً"   },
];
const AR_DAYS = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

const PIPELINE_STEPS = [
  { key: "pending",     label: "بانتظار الموافقة", icon: "⏳", color: "#f59e0b" },
  { key: "assigned",    label: "تم التعيين",        icon: "📋", color: "#2563eb" },
  { key: "in_progress", label: "جارٍ التوصيل",     icon: "🚛", color: "#7c3aed" },
  { key: "arrived",     label: "وصل الموقع",        icon: "📍", color: "#0ea5e9" },
  { key: "delivered",   label: "اكتمل التوزيع",     icon: "✅", color: "#10b981" },
];
const MOCK_DRIVERS = ["أحمد — شاحنة 4022", "محمود — شاحنة 1887", "خالد — شاحنة 3301", "يوسف — شاحنة 2044"];

function dayKey(d: Date): string { return d.toISOString().slice(0, 10); }
function getNextDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d;
  });
}

function priorityScore(z: Zone) {
  const signals = Math.min(z.signalCount / 100, 1) * 40;
  const days = z.lastDeliveryAt
    ? Math.min((Date.now() - new Date(z.lastDeliveryAt).getTime()) / 86400000 / 30, 1) * 40 : 40;
  const pop = Math.min((z.populationEstimate ?? 0) / 20000, 1) * 20;
  return Math.round(signals + days + pop);
}
function priorityColor(score: number) {
  return score > 70 ? "#dc2626" : score > 50 ? "#ea580c" : score > 30 ? "#f59e0b" : "#10b981";
}
const centroid = (pts: [number, number][]): [number, number] => {
  if (!pts?.length) return [31.42, 34.37];
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
};

type SlotState = "available" | "locked" | "mine";
function getSlotState(tasks: Task[], zoneId: string, dayStr: string, slotH: number): SlotState {
  const active = tasks.filter(t => {
    if (t.zoneId !== zoneId) return false;
    if (t.status === "cancelled" || t.status === "delivered") return false;
    const dt = new Date(t.scheduledAt);
    return dayKey(dt) === dayStr && dt.getHours() >= slotH && dt.getHours() < slotH + 2;
  });
  if (!active.length) return "available";
  if (active.some(t => t.ngoId !== MY_NGO_ID)) return "locked";
  return "mine";
}
function getSlotTask(tasks: Task[], zoneId: string, dayStr: string, slotH: number): Task | undefined {
  return tasks.find(t => {
    if (t.zoneId !== zoneId || t.status === "cancelled") return false;
    const dt = new Date(t.scheduledAt);
    return dayKey(dt) === dayStr && dt.getHours() >= slotH && dt.getHours() < slotH + 2;
  });
}

export default function NgoPortal() {
  const [tab, setTab] = useState<"dashboard" | "pipeline" | "verify">("dashboard");
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [wallet, setWallet] = useState({ available: 10000, escrow: 0 });

  // Calendar / Scheduling
  const [calZone, setCalZone] = useState<Zone | null>(null);
  const [drawerSlot, setDrawerSlot] = useState<{ day: Date; slotH: number } | null>(null);
  const [drawerQty, setDrawerQty] = useState("");
  const [drawerProvider, setDrawerProvider] = useState<Provider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Proof/Verify
  const [proofTask, setProofTask] = useState<Task | null>(null);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    const [z, t, p] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
    ]);
    setZones(z.data ?? []);
    setTasks(t.data ?? []);
    setProviders((p.data ?? []).filter((pr: Provider) => pr.status === "approved"));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Map init (dashboard tab)
  useEffect(() => {
    if (tab !== "dashboard" || !mapDivRef.current || mapRef.current) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || !mapDivRef.current) return;
      import("leaflet").then(L => {
        if (cancelled || !mapDivRef.current || mapRef.current) return;
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        const map = L.map(mapDivRef.current!, { center: [31.42, 34.37], zoom: 11 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap", maxZoom: 19,
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      });
    }, 120);
    return () => {
      cancelled = true; clearTimeout(t);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [tab]);

  // Draw zones on map
  useEffect(() => {
    if (!zones.length || !mapRef.current || !layerRef.current) return;
    import("leaflet").then(L => {
      if (!layerRef.current) return;
      layerRef.current.clearLayers();
      zones.forEach(zone => {
        const score = priorityScore(zone);
        const color = priorityColor(score);
        const isSelected = calZone?.id === zone.id;
        const center = zone.boundary ? centroid(zone.boundary) : [31.42, 34.37] as [number, number];
        if (zone.boundary && zone.boundary.length > 2) {
          const poly = L.polygon(zone.boundary, {
            color: isSelected ? "#2563eb" : color,
            weight: isSelected ? 3.5 : 2,
            fillColor: isSelected ? "#2563eb" : color,
            fillOpacity: isSelected ? 0.35 : 0.18,
          }).addTo(layerRef.current!);
          poly.on("click", () => selectZone(zone));
          poly.bindTooltip(`<b>${zone.name}</b><br/>انقر لعرض التقويم`, { sticky: true });
        }
        const icon = L.divIcon({
          html: `<div style="
            background:${isSelected ? "#2563eb" : color};
            color:#fff;border-radius:50%;width:44px;height:44px;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            font-size:11px;font-weight:800;
            box-shadow:0 2px 10px ${isSelected ? "#2563eb88" : color + "88"};
            border:${isSelected ? "3px solid #fff" : "2px solid #fff"};
            cursor:pointer;transition:all .2s;
          "><span>${score}</span><span style="font-size:8px;opacity:.9">أولوية</span></div>`,
          className: "", iconSize: [44, 44], iconAnchor: [22, 22],
        });
        L.marker(center as [number, number], { icon }).addTo(layerRef.current!).on("click", () => selectZone(zone));
      });
    });
  }, [zones, calZone]);

  const selectZone = (zone: Zone) => {
    setCalZone(zone);
    setDrawerSlot(null);
    setDrawerQty("");
    setDrawerProvider(null);
    setSubmitted(false);
  };

  const openSlot = (day: Date, slotH: number) => {
    setDrawerSlot({ day, slotH });
    setDrawerQty("");
    setDrawerProvider(null);
    setSubmitted(false);
  };

  const closeDrawer = () => {
    setDrawerSlot(null);
    setDrawerQty("");
    setDrawerProvider(null);
    setSubmitted(false);
  };

  const days = getNextDays(7);

  // Compute provider cards sorted: cheapest + highest rated
  const provExt = providers.map(p => ({ ...p, ext: PROVIDER_EXT[p.id] })).filter(p => p.ext);
  const minPrice = Math.min(...provExt.map(p => p.ext.pricePerLiter));
  const maxScore = Math.max(...provExt.map(p => p.ext.trustScore));
  const qty = Number(drawerQty) || 0;

  const confirmSchedule = async () => {
    if (!calZone || !drawerSlot || !drawerProvider || !drawerQty) return;
    const ext = PROVIDER_EXT[drawerProvider.id];
    const cost = qty * (ext?.pricePerLiter ?? 0.04);
    if (cost > wallet.available) { showToast("❌ الرصيد غير كافٍ"); return; }
    setSubmitting(true);
    const dt = new Date(drawerSlot.day);
    dt.setHours(drawerSlot.slotH, 0, 0, 0);
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ngoId: MY_NGO_ID, zoneId: calZone.id,
        quantityLiters: drawerQty,
        scheduledAt: dt.toISOString(),
        notes: `مزود: ${drawerProvider.companyName}`,
      }),
    });
    setWallet(w => ({ available: w.available - cost, escrow: w.escrow + cost }));
    await load();
    setSubmitting(false);
    setSubmitted(true);
    showToast("✅ تم تأكيد الجدول — المبلغ في حساب الضمان");
    setTimeout(closeDrawer, 1800);
  };

  const approveDelivery = (task: Task) => {
    const cost = Number(task.quantityLiters) * 0.045;
    setWallet(w => ({ ...w, escrow: Math.max(0, w.escrow - cost) }));
    setProofTask(null);
    showToast("✅ تم الاعتماد — حُوِّل المبلغ لمحفظة المزود وصدر تقرير رسمي");
  };

  const totalSignals = zones.reduce((s, z) => s + (z.signalCount ?? 0), 0);
  const activeTasks = tasks.filter(t => t.status === "in_progress" || t.status === "pending");
  const deliveredTasks = tasks.filter(t => t.status === "delivered");

  return (
    <div className="portal ngo-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="ngo-header">
        <div className="ngo-header-left">
          <div className="portal-role-badge">❤️ المنظمة الإنسانية</div>
          <h2 className="portal-title">برنامج WASH غزة</h2>
          <p className="portal-subtitle">جدولة التوزيع · منع التضارب · ضمان العدالة</p>
        </div>
        <div className="ngo-wallet">
          <div className="wallet-block">
            <span className="wallet-label">المحفظة المتاحة</span>
            <span className="wallet-amount">${wallet.available.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">حساب الضمان</span>
            <span className="wallet-amount" style={{ color: "#fcd34d" }}>${wallet.escrow.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">إشارات احتياج</span>
            <span className="wallet-amount" style={{ color: "#fca5a5" }}>{totalSignals.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="portal-tabs">
        <button className={`ptab ${tab === "dashboard" ? "ptab-active" : ""}`} onClick={() => setTab("dashboard")}>
          🗺️ جدولة التوزيع
        </button>
        <button className={`ptab ${tab === "pipeline" ? "ptab-active" : ""}`} onClick={() => setTab("pipeline")}>
          🔄 المسار النشط {activeTasks.length > 0 && <span className="tab-badge">{activeTasks.length}</span>}
        </button>
        <button className={`ptab ${tab === "verify" ? "ptab-active" : ""}`} onClick={() => setTab("verify")}>
          ✅ التوثيق {deliveredTasks.length > 0 && <span className="tab-badge tab-badge-green">{deliveredTasks.length}</span>}
        </button>
      </div>

      {/* ════════════════════════════════════════
          TAB 1 · SCHEDULE DASHBOARD
          Left: weekly calendar  |  Right: map
      ════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="ngo-sched-split">

          {/* ── LEFT: Calendar panel ──────────────────────────── */}
          <div className="ngo-cal-panel">
            {!calZone ? (
              <div className="ngo-cal-empty">
                <div style={{ fontSize: 52, marginBottom: 14 }}>🗺️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                  اختر حياً من الخريطة
                </div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, maxWidth: 280, textAlign: "center" }}>
                  انقر على أي حي أو منطقة على الخريطة لعرض جدول التوزيع الأسبوعي والحجوزات المتاحة
                </div>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 300, maxHeight: 340, overflowY: "auto" }}>
                  {[...zones].sort((a, b) => priorityScore(b) - priorityScore(a)).map(z => (
                    <button key={z.id} className="ngo-zone-quick-btn" onClick={() => selectZone(z)}>
                      <span style={{ fontSize: 10, background: priorityColor(priorityScore(z)), color: "#fff", borderRadius: 6, padding: "2px 6px", fontWeight: 700, flexShrink: 0 }}>
                        {priorityScore(z)}
                      </span>
                      <span style={{ flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Zone header bar */}
                <div className="ngo-cal-zone-bar">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>🗺️ {calZone.name}</span>
                      <span className={`badge ${calZone.status === "active" ? "badge-green" : "badge-gray"}`}>
                        {calZone.status === "active" ? "نشطة" : "غير نشطة"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                      🆘 {calZone.signalCount} إشارة · 👥 {(calZone.populationEstimate ?? 0).toLocaleString()} ساكن
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div className="ngo-lock-legend">
                      <span className="ngo-lock-pill ngo-pill-available">متاح</span>
                      <span className="ngo-lock-pill ngo-pill-mine">محجوزتي</span>
                      <span className="ngo-lock-pill ngo-pill-locked">🔒 محجوز</span>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => setCalZone(null)}>تغيير</button>
                  </div>
                </div>

                {/* Weekly grid */}
                <div className="ngo-cal-grid-wrap">
                  <div className="ngo-cal-grid">
                    {/* Header row: time label + 7 days */}
                    <div className="ngo-cal-head-row">
                      <div className="ngo-cal-time-col" />
                      {days.map(d => {
                        const isToday = dayKey(d) === dayKey(new Date());
                        return (
                          <div key={dayKey(d)} className={`ngo-cal-day-head ${isToday ? "ngo-cal-day-today" : ""}`}>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>{AR_DAYS[d.getDay()]}</div>
                            <div style={{ fontSize: 11, opacity: 0.75 }}>{d.getDate()}/{d.getMonth() + 1}</div>
                            {isToday && <div style={{ fontSize: 9, color: "#2563eb", fontWeight: 700, marginTop: 2 }}>اليوم</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Slot rows */}
                    {TIME_SLOTS.map(slot => (
                      <div key={slot.h} className="ngo-cal-slot-row">
                        <div className="ngo-cal-time-label">{slot.label}</div>
                        {days.map(d => {
                          const dk = dayKey(d);
                          const state = getSlotState(tasks, calZone.id, dk, slot.h);
                          const task = getSlotTask(tasks, calZone.id, dk, slot.h);
                          const isPast = d < new Date(new Date().setHours(slot.h + 2, 0, 0, 0));

                          if (state === "locked") {
                            return (
                              <div key={dk} className="ngo-cal-cell ngo-cell-locked"
                                title="هذا النطاق محجوز حالياً بواسطة منظمة زميلة - منعاً لتضارب التوزيع وضمان عدالة الحصص">
                                <div className="ngo-lock-icon">🔒</div>
                                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>محجوز</div>
                              </div>
                            );
                          }

                          if (state === "mine" && task) {
                            const col = priorityColor(priorityScore(calZone));
                            return (
                              <div key={dk} className="ngo-cal-cell ngo-cell-mine" style={{ background: col + "18", borderColor: col + "55" }}>
                                <div style={{ color: col, fontWeight: 800, fontSize: 10, marginBottom: 2 }}>✓ مجدول</div>
                                <div style={{ fontSize: 9, color: "#374151", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {Number(task.quantityLiters) / 1000}K لتر
                                </div>
                              </div>
                            );
                          }

                          // Available
                          if (isPast) {
                            return (
                              <div key={dk} className="ngo-cal-cell ngo-cell-past">
                                <div style={{ fontSize: 9, color: "#cbd5e1" }}>—</div>
                              </div>
                            );
                          }

                          return (
                            <div key={dk} className="ngo-cal-cell ngo-cell-available"
                              onClick={() => openSlot(d, slot.h)}>
                              <div className="ngo-avail-text">+ جدول</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: Map panel ─────────────────────────────── */}
          <div className="ngo-map-panel-new">
            <div ref={mapDivRef} className="ngo-map-full" />
            <div className="ngo-map-legend">
              <div style={{ fontWeight: 700, fontSize: 11, color: "#1e293b", marginBottom: 6 }}>خريطة الأولوية</div>
              {([ ["#dc2626","عالية جداً"], ["#ea580c","عالية"], ["#f59e0b","متوسطة"], ["#10b981","منخفضة"] ] as const).map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#374151", marginBottom: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />{l}
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, lineHeight: 1.4 }}>انقر على الحي لعرض التقويم</div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 · ACTIVE PIPELINE
      ════════════════════════════════════════ */}
      {tab === "pipeline" && (
        <div style={{ padding: "20px 24px" }}>
          <div className="section-title">🔄 المسار النشط — تتبع المهام لحظياً</div>
          {activeTasks.length === 0
            ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 8 }}>📋</div><div>لا توجد مهام نشطة حالياً</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>ابدأ بالجدولة من تبويب "جدولة التوزيع"</div></div>
            : activeTasks.map((task, ti) => {
              const zone = zones.find(z => z.id === task.zoneId);
              const stepIdx = Math.max(0, PIPELINE_STEPS.findIndex(s => s.key === task.status));
              const driver = MOCK_DRIVERS[ti % MOCK_DRIVERS.length];
              const cost = Number(task.quantityLiters) * 0.045;
              return (
                <div key={task.id} className="pipeline-card">
                  <div className="pipeline-card-header">
                    <div>
                      <div className="pipeline-zone">🗺️ {zone?.name ?? task.zoneId}</div>
                      <div className="pipeline-meta">
                        💧 {Number(task.quantityLiters).toLocaleString()} لتر
                        · 📅 {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                        {stepIdx >= 1 && <span style={{ color: "#2563eb" }}> · 🚛 {driver}</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#059669" }}>${cost.toLocaleString()}</div>
                  </div>
                  <div className="pipeline-stepper">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const done = idx < stepIdx; const cur = idx === stepIdx;
                      return (
                        <div key={step.key} className="stepper-step">
                          <div className={`stepper-dot ${done ? "dot-done" : cur ? "dot-current" : "dot-future"}`}
                            style={cur ? { background: step.color, borderColor: step.color } : done ? { background: "#10b981", borderColor: "#10b981" } : {}}>
                            {done ? "✓" : cur ? step.icon : <span style={{ fontSize: 10 }}>{idx + 1}</span>}
                          </div>
                          <div className="stepper-label" style={cur ? { color: step.color, fontWeight: 700 } : done ? { color: "#10b981" } : {}}>
                            {step.label}
                          </div>
                          {idx < PIPELINE_STEPS.length - 1 && <div className={`stepper-line ${done ? "line-done" : ""}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pipeline-status-msg" style={{ borderColor: PIPELINE_STEPS[stepIdx].color + "44", background: PIPELINE_STEPS[stepIdx].color + "0d" }}>
                    <span style={{ color: PIPELINE_STEPS[stepIdx].color }}>
                      {stepIdx === 0 && "⏳ بانتظار قبول شركة المياه للعقد..."}
                      {stepIdx === 1 && `📋 تم القبول — تم تعيين السائق: ${driver}`}
                      {stepIdx === 2 && `🚛 السائق ${driver} في الطريق إلى ${zone?.name}...`}
                      {stepIdx === 3 && "📍 الشاحنة وصلت — جارٍ توزيع المياه على الأهالي..."}
                      {stepIdx === 4 && "✅ اكتمل التوزيع — انتقل لتبويب التوثيق للإغلاق"}
                    </span>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 · VERIFICATION
      ════════════════════════════════════════ */}
      {tab === "verify" && (
        <div style={{ padding: "20px 24px" }}>
          <div className="section-title">✅ التوثيق والإغلاق المالي</div>
          {deliveredTasks.length === 0
            ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 8 }}>📦</div><div>لا توجد مهام مكتملة بعد</div></div>
            : deliveredTasks.map(task => {
              const zone = zones.find(z => z.id === task.zoneId);
              const cost = Number(task.quantityLiters) * 0.045;
              return (
                <div key={task.id} className="verify-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>🗺️ {zone?.name ?? task.zoneId}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                        💧 {Number(task.quantityLiters).toLocaleString()} لتر · 📅 {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                      </div>
                    </div>
                    <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ مكتمل</span>
                  </div>
                  <div className="verify-proof-row">
                    {([["📸", "صورة التوثيق", "مرفوعة من الميدان", "#1e293b"], ["🕐", "الطابع الزمني", new Date(task.scheduledAt).toLocaleString("ar-SY"), "#1e293b"], ["📍", "مطابقة الموقع", "✓ داخل حدود المنطقة", "#10b981"]] as const).map(([icon, lbl, val, col]) => (
                      <div key={lbl} className="proof-item">
                        <div className="proof-icon">{icon}</div>
                        <div><div style={{ fontWeight: 600, fontSize: 12 }}>{lbl}</div><div style={{ fontSize: 11, color: col }}>{val}</div></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                    <div><span style={{ fontSize: 12, color: "#64748b" }}>التكلفة الإجمالية: </span><span style={{ fontWeight: 700, color: "#1e293b" }}>${cost.toFixed(0)}</span></div>
                    <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => approveDelivery(task)}>
                      📋 اعتماد وإغلاق نهائي
                    </button>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* ════════════════════════════════════════
          SCHEDULING DRAWER
      ════════════════════════════════════════ */}
      {drawerSlot && calZone && (
        <>
          <div className="ngo-drawer-overlay" onClick={closeDrawer} />
          <div className="ngo-sched-drawer" dir="rtl">

            {submitted ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#059669", marginBottom: 8 }}>تم تأكيد الجدول!</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>المبلغ محجوز في حساب الضمان ريثما يُثبَت التسليم</div>
              </div>
            ) : (
              <>
                {/* Drawer header */}
                <div className="ngo-drawer-head">
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>جدولة توزيع</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b" }}>🗺️ {calZone.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                      📅 {AR_DAYS[drawerSlot.day.getDay()]} {drawerSlot.day.getDate()}/{drawerSlot.day.getMonth() + 1}
                      · ⏰ {TIME_SLOTS.find(s => s.h === drawerSlot.slotH)?.label}
                    </div>
                  </div>
                  <button className="drawer-close" onClick={closeDrawer}>✕</button>
                </div>

                {/* Liters input */}
                <div className="ngo-drawer-section">
                  <label className="ngo-drawer-label">الكمية المطلوبة (باللتر)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      className="ngo-qty-input"
                      placeholder="مثال: 10000"
                      value={drawerQty}
                      onChange={e => { setDrawerQty(e.target.value); setDrawerProvider(null); }}
                      min="100"
                    />
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>لتر</span>
                  </div>
                  {qty > 0 && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, display: "flex", gap: 12 }}>
                      <span>💧 {qty.toLocaleString()} لتر</span>
                      <span style={{ color: "#94a3b8" }}>≈ {(qty / 1000).toFixed(1)} طن</span>
                    </div>
                  )}
                </div>

                {/* Provider marketplace cards — appear when qty entered */}
                {qty > 0 && (
                  <div className="ngo-drawer-section">
                    <div className="ngo-drawer-label">اختر المزود</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {provExt.sort((a, b) => b.ext.trustScore - a.ext.trustScore).map(p => {
                        const total = qty * p.ext.pricePerLiter;
                        const isCheapest = p.ext.pricePerLiter === minPrice;
                        const isTopRated = p.ext.trustScore === maxScore;
                        const isSelected = drawerProvider?.id === p.id;
                        return (
                          <div key={p.id}
                            className={`ngo-prov-card ${isSelected ? "ngo-prov-card-selected" : ""}`}
                            onClick={() => setDrawerProvider(isSelected ? null : p)}>

                            {/* Badges */}
                            {(isCheapest || isTopRated) && (
                              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                {isTopRated && <span className="ngo-prov-badge ngo-badge-top">⚡ الأعلى تقييماً</span>}
                                {isCheapest && <span className="ngo-prov-badge ngo-badge-cheap">💰 الأوفر سعراً</span>}
                              </div>
                            )}

                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <div style={{ width: 44, height: 44, background: isSelected ? "#dbeafe" : "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏭</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{p.companyName}</div>
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.ext.source}</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? "#1d4ed8" : "#059669" }}>
                                  ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>إجمالي العقد</div>
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${isSelected ? "#bfdbfe" : "#f1f5f9"}` }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
                                  {"⭐".repeat(Math.floor(p.ext.trustScore))} {p.ext.trustScore}
                                </div>
                                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{p.ext.completedJobs} مهمة ناجحة</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{p.ext.freeFleet}</div>
                                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>شاحنات متفرغة</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>${p.ext.pricePerLiter}</div>
                                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>/ لتر</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Escrow notice */}
                {drawerProvider && qty > 0 && (
                  <div className="ngo-escrow-notice">
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>📋 ملخص العقد</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", padding: "4px 0" }}>
                      <span>الكمية</span><span style={{ fontWeight: 600 }}>{Number(drawerQty).toLocaleString()} لتر</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", padding: "4px 0" }}>
                      <span>المزود</span><span style={{ fontWeight: 600 }}>{drawerProvider.companyName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", padding: "4px 0", borderTop: "1px solid #e2e8f0", marginTop: 4, paddingTop: 8 }}>
                      <span style={{ fontWeight: 700 }}>إجمالي العقد</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "#059669" }}>
                        ${(qty * (PROVIDER_EXT[drawerProvider.id]?.pricePerLiter ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
                      🔒 سيُحوَّل المبلغ إلى حساب الضمان فور التأكيد ولن يُصرف للمزود إلا بعد إثبات التسليم
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: "auto", padding: "16px 0 0" }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", fontSize: 15, padding: "13px", justifyContent: "center" }}
                    disabled={!drawerProvider || !drawerQty || qty <= 0 || submitting}
                    onClick={confirmSchedule}>
                    {submitting ? "⏳ جارٍ الحجز..." : "✅ تأكيد وتثبيت الجدول"}
                  </button>
                  <button className="btn btn-outline" style={{ width: "100%", marginTop: 8, fontSize: 13 }} onClick={closeDrawer}>إلغاء</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
