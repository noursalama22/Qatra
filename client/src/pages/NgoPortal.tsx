import { useState, useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

type Zone = {
  id: string; name: string; status: string; populationEstimate: number;
  signalCount: number; lastDeliveryAt: string | null; description: string;
  boundary: [number, number][] | null;
};
type Task = {
  id: string; zoneId: string; status: string; quantityLiters: string;
  scheduledAt: string; notes: string | null; assignedProviderIds: string[];
};
type Provider = { id: string; companyName: string; operatingModes: string[]; status: string };

const MOCK_PROVIDER_INFO = [
  { pricePerLiter: 0.45, dailyCapacityK: 80,  source: "محطة تحلية الشفاء"    },
  { pricePerLiter: 0.38, dailyCapacityK: 120, source: "محطة رفح المركزية"   },
  { pricePerLiter: 0.52, dailyCapacityK: 50,  source: "محطة خان يونس"       },
  { pricePerLiter: 0.41, dailyCapacityK: 95,  source: "محطة دير البلح"      },
];

const PIPELINE_STEPS = [
  { key: "pending",     label: "بانتظار الموافقة", icon: "⏳", color: "#f59e0b" },
  { key: "assigned",    label: "تم التعيين",        icon: "📋", color: "#2563eb" },
  { key: "in_progress", label: "جارٍ التوصيل",     icon: "🚛", color: "#7c3aed" },
  { key: "arrived",     label: "وصل الموقع",        icon: "📍", color: "#0ea5e9" },
  { key: "delivered",   label: "اكتمل التوزيع",     icon: "✅", color: "#10b981" },
];

const MOCK_DRIVERS = ["أحمد — شاحنة 4022", "محمود — شاحنة 1887", "خالد — شاحنة 3301", "يوسف — شاحنة 2044"];

const priorityScore = (z: Zone) => {
  const signals = Math.min(z.signalCount / 100, 1) * 40;
  const days = z.lastDeliveryAt
    ? Math.min((Date.now() - new Date(z.lastDeliveryAt).getTime()) / 86400000 / 30, 1) * 40 : 40;
  const pop = Math.min((z.populationEstimate ?? 0) / 20000, 1) * 20;
  return Math.round(signals + days + pop);
};

const priorityColor = (score: number) =>
  score > 70 ? "#dc2626" : score > 50 ? "#ea580c" : score > 30 ? "#f59e0b" : "#10b981";

const centroid = (pts: [number, number][]): [number, number] => {
  if (!pts?.length) return [31.42, 34.37];
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
};

export default function NgoPortal() {
  const [tab, setTab] = useState<"dashboard" | "pipeline" | "verify">("dashboard");
  const [zones,     setZones]     = useState<Zone[]>([]);
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [toast,     setToast]     = useState<string | null>(null);

  const [wallet, setWallet] = useState({ available: 10000, escrow: 0 });

  // Zone + marketplace flow
  const [selectedZone,     setSelectedZone]     = useState<Zone | null>(null);
  const [drawerStep,       setDrawerStep]       = useState<"marketplace" | "form" | "success" | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [contractQty,      setContractQty]      = useState("");
  const [contractDate,     setContractDate]     = useState("");
  const [submitting,       setSubmitting]       = useState(false);


  // Proof of delivery
  const [proofTask,  setProofTask]  = useState<Task | null>(null);
  const [proofOpen,  setProofOpen]  = useState(false);

  // Map
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<LeafletMap | null>(null);
  const layerRef  = useRef<LayerGroup | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    const [z, t, p] = await Promise.all([
      fetch("/api/zones").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/providers").then(r => r.json()),
    ]);
    setZones(z.data ?? []);
    setTasks(t.data ?? []);
    setProviders((p.data ?? []).filter((pr: Provider) =>
      (pr.operatingModes ?? []).includes("humanitarian") && pr.status === "approved"));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Map init ──────────────────────────────────────────────────────────────
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
          iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        const map = L.map(mapDivRef.current!, { center: [31.42, 34.37], zoom: 11 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap", maxZoom: 19,
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      });
    }, 120);
    return () => { cancelled = true; clearTimeout(t); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [tab]);

  // ── Draw zones ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!zones.length || !mapRef.current || !layerRef.current) return;
    import("leaflet").then(L => {
      if (!layerRef.current) return;
      layerRef.current.clearLayers();
      [...zones].sort((a, b) => priorityScore(b) - priorityScore(a)).forEach(zone => {
        const score = priorityScore(zone);
        const color = priorityColor(score);
        const center = zone.boundary ? centroid(zone.boundary) : [31.42, 34.37] as [number, number];
        if (zone.boundary && zone.boundary.length > 2) {
          const poly = L.polygon(zone.boundary, { color, weight: 2.5, fillColor: color, fillOpacity: 0.22 }).addTo(layerRef.current!);
          poly.on("click", () => openZone(zone));
          poly.bindTooltip(`<b>${zone.name}</b><br/>أولوية: ${score}`, { sticky: true });
        }
        const icon = L.divIcon({
          html: `<div style="background:${color};color:#fff;border-radius:50%;width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;font-weight:800;box-shadow:0 2px 10px ${color}88;border:2px solid #fff;cursor:pointer"><span>${score}</span><span style="font-size:8px;opacity:.9">أولوية</span></div>`,
          className: "", iconSize: [42, 42], iconAnchor: [21, 21],
        });
        L.marker(center as [number, number], { icon }).addTo(layerRef.current!).on("click", () => openZone(zone));
      });
    });
  }, [zones]);

  const openZone = (zone: Zone) => {
    setSelectedZone(zone);
    setDrawerStep("marketplace");
    setSelectedProvider(null);
    setContractQty("");
    setContractDate("");
  };

  const closeDrawer = () => { setSelectedZone(null); setDrawerStep(null); };

  const providerMock = (idx: number) => MOCK_PROVIDER_INFO[idx % MOCK_PROVIDER_INFO.length];

  const calcCost = () => {
    if (!selectedProvider || !contractQty) return 0;
    return Number(contractQty) * providerMock(providers.indexOf(selectedProvider)).pricePerLiter;
  };

  const submitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !selectedProvider) return;
    const cost = calcCost();
    if (cost > wallet.available) { showToast("❌ الرصيد غير كافٍ"); return; }
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ngoId: "seed-n1", zoneId: selectedZone.id, quantityLiters: contractQty, scheduledAt: contractDate, notes: `مزود: ${selectedProvider.companyName}` }),
    });
    setWallet(w => ({ available: w.available - cost, escrow: w.escrow + cost }));
    await load();
    setSubmitting(false);
    setDrawerStep("success");
  };


  const approveDelivery = (task: Task) => {
    const cost = Number(task.quantityLiters) * 0.45;
    setWallet(w => ({ ...w, escrow: Math.max(0, w.escrow - cost) }));
    setProofOpen(false); setProofTask(null);
    showToast("✅ تم الاعتماد — حُوِّل المبلغ لمحفظة المزود وصدر تقرير رسمي");
  };

  const sortedZones  = [...zones].sort((a, b) => priorityScore(b) - priorityScore(a));
  const activeTasks  = tasks.filter(t => t.status === "in_progress" || t.status === "pending");
  const deliveredTasks = tasks.filter(t => t.status === "delivered");
  const totalSignals = zones.reduce((s, z) => s + (z.signalCount ?? 0), 0);

  return (
    <div className="portal ngo-portal" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}

      {/* ── Wallet Header ─────────────────────────────────────── */}
      <div className="ngo-header">
        <div className="ngo-header-left">
          <div className="portal-role-badge">❤️ المنظمة الإنسانية</div>
          <h2 className="portal-title">WaterAid Syria</h2>
          <p className="portal-subtitle">منصة توزيع المياه الإنسانية</p>
        </div>
        <div className="ngo-wallet">
          <div className="wallet-block">
            <span className="wallet-label">المحفظة المتاحة</span>
            <span className="wallet-amount">${wallet.available.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">محجوز للضمان</span>
            <span className="wallet-amount" style={{ color: "#f59e0b" }}>${wallet.escrow.toLocaleString()}</span>
          </div>
          <div className="wallet-divider" />
          <div className="wallet-block">
            <span className="wallet-label">إشارات احتياج</span>
            <span className="wallet-amount" style={{ color: "#ef4444" }}>{totalSignals}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="portal-tabs">
        <button className={`ptab ${tab === "dashboard" ? "ptab-active" : ""}`} onClick={() => setTab("dashboard")}>🗺️ لوحة التحكم</button>
        <button className={`ptab ${tab === "pipeline"  ? "ptab-active" : ""}`} onClick={() => setTab("pipeline")}>
          🔄 المسار النشط {activeTasks.length > 0 && <span className="tab-badge">{activeTasks.length}</span>}
        </button>
        <button className={`ptab ${tab === "verify"    ? "ptab-active" : ""}`} onClick={() => setTab("verify")}>
          ✅ التوثيق {deliveredTasks.length > 0 && <span className="tab-badge tab-badge-green">{deliveredTasks.length}</span>}
        </button>
      </div>

      <div className="portal-body" style={{ padding: tab === "dashboard" ? 0 : undefined }}>

        {/* ════════════════════════════════════════
            TAB 1 · DASHBOARD — MAP + PRIORITY TABLE
        ════════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div className="ngo-dashboard">
            {/* Map */}
            <div className="ngo-map-wrap">
              <div ref={mapDivRef} className="ngo-map" />
              <div className="ngo-map-legend">
                <div style={{ fontWeight: 700, fontSize: 11, color: "#1e293b", marginBottom: 6 }}>خريطة الأولوية</div>
                {([["#dc2626","عالية جداً (70+)"],["#ea580c","عالية (50-70)"],["#f59e0b","متوسطة (30-50)"],["#10b981","منخفضة (−30)"]] as const).map(([c,l])=>(
                  <div key={l} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#374151",marginBottom:3 }}>
                    <span style={{ width:11,height:11,borderRadius:3,background:c,flexShrink:0 }} />{l}
                  </div>
                ))}
                <div style={{ fontSize:10,color:"#94a3b8",marginTop:6,lineHeight:1.4 }}>انقر على المنطقة أو الصف للتعاقد</div>
              </div>
            </div>

            {/* Priority table */}
            <div className="ngo-zone-table">
              <div className="ngo-zone-table-header">
                <span style={{ fontWeight:700,fontSize:14 }}>المناطق مرتبة حسب الأولوية</span>
                <span style={{ fontSize:12,color:"#64748b" }}>{zones.length} منطقة</span>
              </div>
              {sortedZones.map((z, i) => {
                const score = priorityScore(z);
                const color = priorityColor(score);
                const zt = tasks.filter(t => t.zoneId === z.id);
                return (
                  <div key={z.id} className="ngo-zone-row" onClick={() => openZone(z)} style={{ borderRight: `4px solid ${color}` }}>
                    <div className="ngo-zone-rank" style={{ color }}>{i + 1}</div>
                    <div className="ngo-zone-info">
                      <div className="ngo-zone-name">{z.name}</div>
                      <div className="ngo-zone-meta">
                        🆘 {z.signalCount} إشارة · 👥 {(z.populationEstimate??0).toLocaleString()} ساكن
                        {z.lastDeliveryAt && ` · 📅 ${new Date(z.lastDeliveryAt).toLocaleDateString("ar-SY")}`}
                      </div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",background:color+"18",color,padding:"6px 10px",borderRadius:10,minWidth:48 }}>
                      <span style={{ fontWeight:800,fontSize:18 }}>{score}</span>
                      <span style={{ fontSize:9 }}>أولوية</span>
                    </div>
                    <div style={{ display:"flex",gap:5,flexShrink:0 }}>
                      {zt.filter(t=>t.status==="pending").length>0 && <span className="zone-task-chip chip-pending">{zt.filter(t=>t.status==="pending").length} مجدولة</span>}
                      {zt.filter(t=>t.status==="in_progress").length>0 && <span className="zone-task-chip chip-active">{zt.filter(t=>t.status==="in_progress").length} جارية</span>}
                    </div>
                    <button className="ngo-zone-cta" onClick={e=>{e.stopPropagation();openZone(z);}}>تعاقد →</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 · ACTIVE PIPELINE — STEPPER
        ════════════════════════════════════════ */}
        {tab === "pipeline" && (
          <div style={{ padding:"20px 24px" }}>
            <div className="section-title">🔄 المسار النشط — تتبع المهام لحظياً</div>
            {activeTasks.length === 0
              ? <div className="empty-state"><div style={{fontSize:36,marginBottom:8}}>📋</div><div>لا توجد مهام نشطة حالياً</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>ابدأ بالتعاقد من لوحة التحكم</div></div>
              : activeTasks.map((task, ti) => {
                const zone     = zones.find(z => z.id === task.zoneId);
                const curStep  = task.status;
                const stepIdx  = PIPELINE_STEPS.findIndex(s => s.key === curStep);
                const safeIdx  = Math.max(0, stepIdx);
                const driver   = MOCK_DRIVERS[ti % MOCK_DRIVERS.length];
                const cost     = Number(task.quantityLiters) * 0.45;
                return (
                  <div key={task.id} className="pipeline-card">
                    <div className="pipeline-card-header">
                      <div>
                        <div className="pipeline-zone">🗺️ {zone?.name ?? task.zoneId}</div>
                        <div className="pipeline-meta">
                          💧 {Number(task.quantityLiters).toLocaleString()} لتر
                          · 📅 {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                          {safeIdx >= 1 && <span style={{color:"#2563eb"}}> · 🚛 {driver}</span>}
                        </div>
                      </div>
                      <div style={{fontWeight:800,fontSize:16,color:"#059669"}}>${cost.toLocaleString()}</div>
                    </div>

                    {/* Stepper */}
                    <div className="pipeline-stepper">
                      {PIPELINE_STEPS.map((step, idx) => {
                        const done = idx < safeIdx;
                        const cur  = idx === safeIdx;
                        return (
                          <div key={step.key} className="stepper-step">
                            <div className={`stepper-dot ${done?"dot-done":cur?"dot-current":"dot-future"}`}
                              style={cur?{background:step.color,borderColor:step.color}:done?{background:"#10b981",borderColor:"#10b981"}:{}}>
                              {done ? "✓" : cur ? step.icon : <span style={{fontSize:10}}>{idx+1}</span>}
                            </div>
                            <div className="stepper-label" style={cur?{color:step.color,fontWeight:700}:done?{color:"#10b981"}:{}}>
                              {step.label}
                            </div>
                            {idx < PIPELINE_STEPS.length-1 && <div className={`stepper-line ${done?"line-done":""}`} />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Status message */}
                    <div className="pipeline-status-msg" style={{borderColor:PIPELINE_STEPS[safeIdx].color+"44",background:PIPELINE_STEPS[safeIdx].color+"0d"}}>
                      <span style={{color:PIPELINE_STEPS[safeIdx].color}}>
                        {safeIdx===0 && "⏳ بانتظار قبول شركة المياه للعقد..."}
                        {safeIdx===1 && `📋 تم القبول — تم تعيين السائق: ${driver}`}
                        {safeIdx===2 && `🚛 السائق ${driver} في الطريق إلى ${zone?.name}...`}
                        {safeIdx===3 && `📍 الشاحنة وصلت — جارٍ توزيع المياه على الأهالي...`}
                        {safeIdx===4 && "✅ اكتمل التوزيع — انتقل لتبويب التوثيق للإغلاق"}
                      </span>
                    </div>

                  </div>
                );
              })
            }
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 3 · VERIFICATION & SETTLEMENT
        ════════════════════════════════════════ */}
        {tab === "verify" && (
          <div style={{padding:"20px 24px"}}>
            <div className="section-title">✅ التوثيق والإغلاق المالي</div>
            {deliveredTasks.length === 0
              ? <div className="empty-state"><div style={{fontSize:36,marginBottom:8}}>📦</div><div>لا توجد مهام مكتملة بعد</div></div>
              : deliveredTasks.map(task => {
                const zone = zones.find(z => z.id === task.zoneId);
                const cost = Number(task.quantityLiters) * 0.45;
                return (
                  <div key={task.id} className="verify-card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>🗺️ {zone?.name ?? task.zoneId}</div>
                        <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                          💧 {Number(task.quantityLiters).toLocaleString()} لتر · 📅 {new Date(task.scheduledAt).toLocaleDateString("ar-SY")}
                        </div>
                      </div>
                      <span style={{background:"#dcfce7",color:"#16a34a",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>✅ مكتمل</span>
                    </div>
                    <div className="verify-proof-row">
                      {[["📸","صورة التوثيق","مرفوعة من الميدان","#1e293b"],["🕐","الطابع الزمني",new Date(task.scheduledAt).toLocaleString("ar-SY"),"#1e293b"],["📍","مطابقة الموقع","✓ داخل حدود المنطقة","#10b981"]].map(([icon,lbl,val,col])=>(
                        <div key={lbl as string} className="proof-item">
                          <div className="proof-icon">{icon}</div>
                          <div><div style={{fontWeight:600,fontSize:12}}>{lbl}</div><div style={{fontSize:11,color:col as string}}>{val}</div></div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:12,borderTop:"1px solid #f1f5f9"}}>
                      <div><span style={{fontSize:12,color:"#64748b"}}>التكلفة الإجمالية: </span><span style={{fontWeight:700,color:"#1e293b"}}>${cost.toLocaleString()}</span></div>
                      <button className="btn btn-primary" style={{fontSize:13}} onClick={()=>{setProofTask(task);setProofOpen(true);}}>
                        📋 اعتماد وإغلاق نهائي
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MARKETPLACE DRAWER
      ════════════════════════════════════════ */}
      {selectedZone && drawerStep && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="marketplace-drawer" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>منطقة محددة</div>
                <div style={{fontWeight:800,fontSize:18,color:"#1e293b"}}>🗺️ {selectedZone.name}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                  🆘 {selectedZone.signalCount} إشارة · 👥 {(selectedZone.populationEstimate??0).toLocaleString()} ساكن
                </div>
              </div>
              <button className="drawer-close" onClick={closeDrawer}>✕</button>
            </div>

            {/* Priority bar */}
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0",padding:"10px 14px",background:"#f8fafc",borderRadius:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"#64748b",marginBottom:5}}>درجة الأولوية</div>
                <div style={{height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${priorityScore(selectedZone)}%`,background:priorityColor(priorityScore(selectedZone)),borderRadius:4,transition:"width .6s"}} />
                </div>
              </div>
              <div style={{fontWeight:800,fontSize:22,color:priorityColor(priorityScore(selectedZone)),background:priorityColor(priorityScore(selectedZone))+"18",padding:"6px 14px",borderRadius:10}}>
                {priorityScore(selectedZone)}
              </div>
            </div>

            {/* ── MARKETPLACE ── */}
            {drawerStep === "marketplace" && <>
              <div className="drawer-section-title">🏪 مزودو الخدمة المعتمدون</div>
              {providers.length === 0
                ? <div style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:"20px 0"}}>لا يوجد مزودون معتمدون</div>
                : providers.map((p, idx) => {
                  const mock = providerMock(idx);
                  const sel  = selectedProvider?.id === p.id;
                  return (
                    <div key={p.id} className={`market-card ${sel?"market-card-selected":""}`} onClick={()=>setSelectedProvider(sel?null:p)}>
                      <div className="market-card-top">
                        <div className="market-logo">🏢</div>
                        <div style={{flex:1}}>
                          <div className="market-name">{p.companyName}</div>
                          <div style={{fontSize:12,color:"#64748b"}}>⚡ {mock.source}</div>
                        </div>
                        <div style={{textAlign:"left"}}>
                          <span style={{fontWeight:800,fontSize:22,color:"#059669"}}>${mock.pricePerLiter.toFixed(2)}</span>
                          <span style={{fontSize:11,color:"#64748b"}}>/لتر</span>
                        </div>
                      </div>
                      <div className="market-card-stats">
                        {[["💧",`${mock.dailyCapacityK}K لتر/يوم`],["✅","معتمد"],["⭐","4.8 تقييم"]].map(([ic,lb])=>(
                          <div key={lb as string} style={{textAlign:"center",fontSize:11,color:"#475569"}}>
                            <div style={{fontSize:16}}>{ic}</div>{lb}
                          </div>
                        ))}
                      </div>
                      {sel && <div style={{marginTop:10,background:"#dcfce7",color:"#16a34a",borderRadius:8,padding:"6px",textAlign:"center",fontWeight:700,fontSize:12}}>✓ تم الاختيار</div>}
                    </div>
                  );
                })
              }
              <button className="btn btn-primary" style={{width:"100%",marginTop:16,padding:"13px",fontSize:15}}
                disabled={!selectedProvider} onClick={()=>setDrawerStep("form")}>
                تعاقد وإسناد ←
              </button>
            </>}

            {/* ── FORM ── */}
            {drawerStep === "form" && selectedProvider && (()=>{
              const idx  = providers.indexOf(selectedProvider);
              const mock = providerMock(idx);
              const qty  = Number(contractQty)||0;
              const cost = qty * mock.pricePerLiter;
              const ok   = cost>0 && cost<=wallet.available && !!contractDate;
              return <>
                <div className="drawer-section-title">📋 تفاصيل العقد</div>
                <div style={{display:"flex",justifyContent:"space-between",background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13}}>
                  <span style={{fontWeight:600}}>🏢 {selectedProvider.companyName}</span>
                  <span style={{color:"#059669",fontWeight:700}}>${mock.pricePerLiter.toFixed(2)}/لتر</span>
                </div>
                <form onSubmit={submitContract}>
                  <div className="form-group">
                    <label className="form-label">الكمية المطلوبة (لتر)</label>
                    <input className="form-input" type="number" placeholder="مثال: 10000" min="1000" step="500"
                      value={contractQty} onChange={e=>setContractQty(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">التاريخ والوقت</label>
                    <input className="form-input" type="datetime-local" value={contractDate} onChange={e=>setContractDate(e.target.value)} required />
                  </div>
                  {qty>0 && (
                    <div className="cost-preview">
                      <div className="cost-row"><span>{qty.toLocaleString()} لتر × ${mock.pricePerLiter.toFixed(2)}</span><span style={{fontWeight:700}}>${cost.toLocaleString()}</span></div>
                      <div className="cost-row" style={{paddingTop:8,borderTop:"1px solid #e2e8f0",marginTop:8}}>
                        <span style={{fontWeight:700}}>إجمالي التكلفة</span>
                        <span style={{fontWeight:800,fontSize:20,color:cost<=wallet.available?"#059669":"#dc2626"}}>${cost.toLocaleString()}</span>
                      </div>
                      <div className="cost-row" style={{fontSize:11,color:"#64748b"}}>
                        <span>الرصيد المتاح بعد العملية</span>
                        <span style={{color:cost<=wallet.available?"#10b981":"#dc2626"}}>${(wallet.available-cost).toLocaleString()}</span>
                      </div>
                      {cost>wallet.available && <div style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",marginTop:8,fontSize:12}}>❌ الرصيد غير كافٍ</div>}
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginTop:14}}>
                    <button type="button" className="btn btn-outline" style={{flex:1}} onClick={()=>setDrawerStep("marketplace")}>← رجوع</button>
                    <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={!ok||submitting}>
                      {submitting?"جارٍ الإرسال...":"✅ تأكيد العقد وتثبيت التمويل"}
                    </button>
                  </div>
                </form>
              </>;
            })()}

            {/* ── SUCCESS ── */}
            {drawerStep === "success" && (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:52}}>🎉</div>
                <div style={{fontWeight:800,fontSize:18,color:"#059669",margin:"12px 0 6px"}}>تم إنشاء العقد بنجاح!</div>
                <div style={{fontSize:13,color:"#374151",lineHeight:1.7,marginBottom:18}}>
                  تم تحويل التمويل للضمان وبانتظار قبول المزود.<br/>
                  تابع الحالة من تبويب <strong>المسار النشط</strong>.
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 18px",marginBottom:18,textAlign:"right"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                    <span style={{color:"#64748b"}}>💰 المتاح الجديد</span>
                    <span style={{fontWeight:700}}>${wallet.available.toLocaleString()}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                    <span style={{color:"#64748b"}}>🔒 محجوز للضمان</span>
                    <span style={{fontWeight:700,color:"#f59e0b"}}>${wallet.escrow.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-outline" style={{flex:1}} onClick={closeDrawer}>إغلاق</button>
                  <button className="btn btn-primary" style={{flex:2}} onClick={()=>{closeDrawer();setTab("pipeline");}}>🔄 المسار النشط →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          PROOF OF DELIVERY MODAL
      ════════════════════════════════════════ */}
      {proofTask && proofOpen && (
        <div className="modal-overlay" onClick={()=>{setProofOpen(false);setProofTask(null);}}>
          <div className="proof-modal" dir="rtl" style={{width:430,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,marginBottom:4}}>📋</div>
            <div style={{fontWeight:800,fontSize:18,color:"#1e293b",marginBottom:2}}>مستند التوثيق الميداني</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>{zones.find(z=>z.id===proofTask.zoneId)?.name}</div>

            {/* Mock field photo */}
            <div style={{background:"#0f172a",borderRadius:14,padding:"32px 24px",marginBottom:14,textAlign:"center",position:"relative"}}>
              <div style={{fontSize:48}}>🚛💧</div>
              <div style={{color:"#60a5fa",fontSize:13,fontWeight:600,marginTop:8}}>صورة ميدانية مرفوعة</div>
              <div style={{color:"#475569",fontSize:11,marginTop:3}}>IMG_{proofTask.id.slice(-6).toUpperCase()}.jpg</div>
              {[["top:10px","right:10px","borderTop","borderRight"],["top:10px","left:10px","borderTop","borderLeft"],["bottom:10px","right:10px","borderBottom","borderRight"],["bottom:10px","left:10px","borderBottom","borderLeft"]].map(([t,s])=>(
                <div key={t+s} style={{position:"absolute",...Object.fromEntries([[t.split(":")[0],t.split(":")[1]],[s.split(":")[0],s.split(":")[1]]]),width:18,height:18,borderColor:"#60a5fa",borderStyle:"solid",borderWidth:0,[s.split(":")[0]==="right"?"borderRight":"borderLeft"]:"2px solid #60a5fa",[t.split(":")[0]==="top"?"borderTop":"borderBottom"]:"2px solid #60a5fa"}} />
              ))}
            </div>

            <div className="proof-details-grid">
              {[["🕐","الطابع الزمني",new Date(proofTask.scheduledAt).toLocaleString("ar-SY"),"#1e293b"],["📍","مطابقة الموقع","✓ داخل حدود المنطقة","#10b981"],["💧","الكمية الموزعة",`${Number(proofTask.quantityLiters).toLocaleString()} لتر`,"#1e293b"],["💰","إجمالي التكلفة",`$${(Number(proofTask.quantityLiters)*0.45).toLocaleString()}`,"#059669"]].map(([icon,lbl,val,col])=>(
                <div key={lbl as string} className="proof-detail-item">
                  <span style={{fontSize:20}}>{icon}</span>
                  <div><div style={{fontWeight:600,fontSize:12}}>{lbl}</div><div style={{fontSize:11,color:col as string}}>{val}</div></div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:8,marginTop:18}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>{setProofOpen(false);setProofTask(null);}}>إلغاء</button>
              <button className="btn btn-primary" style={{flex:2,background:"#059669",borderColor:"#059669"}} onClick={()=>approveDelivery(proofTask)}>
                ✅ اعتماد وإغلاق نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
