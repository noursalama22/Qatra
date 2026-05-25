import { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../components/RequireRole";

type TaskStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

type NgoTask = {
  id: string;
  tripNumber: string;
  contractNumber: string;
  orgName: string;
  region: string;
  date: string;
  quantityLiters: number;
  driver: { name: string; plate: string; region: string } | null;
  status: TaskStatus;
  notes: string | null;
  timeline: { label: string; date: string; note?: string }[];
  deliveryPhotos: string[];
  parentContractId: string;
  deliveryApproved?: boolean;
};

type CitizenTask = {
  id: string;
  orderNumber: string;
  citizenName: string;
  region: string;
  date: string;
  quantityLiters: number;
  paymentMethod: string;
  escrowStatus: string;
  driver: { name: string; plate: string; region: string } | null;
  status: TaskStatus;
  notes: string | null;
  timeline: { label: string; date: string; note?: string }[];
  deliveryPhotos: string[];
  deliveryApproved?: boolean;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: "معلقة",   bg: "#fef3c7", color: "#d97706" },
  accepted:    { label: "مقبولة",  bg: "#dbeafe", color: "#2563eb" },
  in_progress: { label: "جارية",   bg: "#ccfbf1", color: "#0f766e" },
  completed:   { label: "مكتملة",  bg: "#dcfce7", color: "#16a34a" },
  cancelled:   { label: "ملغية",   bg: "#fee2e2", color: "#dc2626" },
};

const NGO_TASKS_MOCK: NgoTask[] = [
  {
    id: "nt1", tripNumber: "TRP-2024-001", contractNumber: "CTR-0041", orgName: "برنامج WASH غزة",
    region: "شمال غزة", date: "2026-05-20", quantityLiters: 35000,
    driver: { name: "يوسف البطران", plate: "GZ-4821", region: "شمال غزة" },
    status: "completed", notes: "تسليم صباحي — أولوية عالية",
    timeline: [
      { label: "إنشاء المهمة", date: "2026-05-19 09:00" },
      { label: "قبول المهمة", date: "2026-05-19 11:30" },
      { label: "في الطريق", date: "2026-05-20 07:15" },
      { label: "تم التسليم", date: "2026-05-20 09:45" },
    ],
    deliveryPhotos: [], parentContractId: "CTR-0041", deliveryApproved: false,
  },
  {
    id: "nt2", tripNumber: "TRP-2024-002", contractNumber: "CTR-0041", orgName: "برنامج WASH غزة",
    region: "مدينة غزة", date: "2026-05-23", quantityLiters: 50000,
    driver: { name: "نادر أبو عوض", plate: "GZ-7711", region: "مدينة غزة" },
    status: "in_progress", notes: "مدينة غزة — مرحلة أولى",
    timeline: [
      { label: "إنشاء المهمة", date: "2026-05-22 08:00" },
      { label: "قبول المهمة", date: "2026-05-22 10:00" },
      { label: "في الطريق", date: "2026-05-23 06:30" },
    ],
    deliveryPhotos: [], parentContractId: "CTR-0041",
  },
  {
    id: "nt3", tripNumber: "TRP-2024-003", contractNumber: "CTR-0058", orgName: "خدمات مياه الأونروا",
    region: "خان يونس", date: "2026-05-24", quantityLiters: 28000,
    driver: null, status: "pending", notes: null,
    timeline: [{ label: "إنشاء المهمة", date: "2026-05-23 14:00" }],
    deliveryPhotos: [], parentContractId: "CTR-0058",
  },
  {
    id: "nt4", tripNumber: "TRP-2024-004", contractNumber: "CTR-0058", orgName: "خدمات مياه الأونروا",
    region: "الوسطى", date: "2026-05-22", quantityLiters: 20000,
    driver: { name: "يوسف البطران", plate: "GZ-4821", region: "الوسطى" },
    status: "accepted", notes: "مُنجز — الوسطى",
    timeline: [
      { label: "إنشاء المهمة", date: "2026-05-21 10:00" },
      { label: "قبول المهمة", date: "2026-05-21 13:45" },
    ],
    deliveryPhotos: [], parentContractId: "CTR-0058",
  },
  {
    id: "nt5", tripNumber: "TRP-2024-005", contractNumber: "CTR-0041", orgName: "برنامج WASH غزة",
    region: "رفح", date: "2026-05-21", quantityLiters: 15000,
    driver: { name: "نادر أبو عوض", plate: "GZ-7711", region: "رفح" },
    status: "cancelled", notes: "ملغي — مناطق غير آمنة",
    timeline: [
      { label: "إنشاء المهمة", date: "2026-05-20 09:00" },
      { label: "إلغاء المهمة", date: "2026-05-20 16:00", note: "مناطق غير آمنة" },
    ],
    deliveryPhotos: [], parentContractId: "CTR-0041",
  },
];

const CITIZEN_TASKS_MOCK: CitizenTask[] = [
  {
    id: "ct1", orderNumber: "ORD-8821", citizenName: "فاطمة الغلبان",
    region: "شمال غزة", date: "2026-05-23", quantityLiters: 500,
    paymentMethod: "كاش", escrowStatus: "محتجز",
    driver: { name: "يوسف البطران", plate: "GZ-4821", region: "شمال غزة" },
    status: "completed", notes: null,
    timeline: [
      { label: "إنشاء الطلب", date: "2026-05-22 18:00" },
      { label: "قبول الطلب", date: "2026-05-22 19:30" },
      { label: "في الطريق", date: "2026-05-23 08:00" },
      { label: "تم التسليم", date: "2026-05-23 09:20" },
    ],
    deliveryPhotos: [], deliveryApproved: false,
  },
  {
    id: "ct2", orderNumber: "ORD-8822", citizenName: "خالد الرفاعي",
    region: "مدينة غزة", date: "2026-05-24", quantityLiters: 1000,
    paymentMethod: "تحويل بنكي", escrowStatus: "محتجز",
    driver: { name: "نادر أبو عوض", plate: "GZ-7711", region: "مدينة غزة" },
    status: "in_progress", notes: "طلب عاجل",
    timeline: [
      { label: "إنشاء الطلب", date: "2026-05-23 20:00" },
      { label: "قبول الطلب", date: "2026-05-23 21:00" },
      { label: "في الطريق", date: "2026-05-24 07:45" },
    ],
    deliveryPhotos: [],
  },
  {
    id: "ct3", orderNumber: "ORD-8823", citizenName: "سمر أبو حمد",
    region: "الوسطى", date: "2026-05-24", quantityLiters: 750,
    paymentMethod: "كاش", escrowStatus: "لا يوجد",
    driver: null, status: "pending", notes: null,
    timeline: [{ label: "إنشاء الطلب", date: "2026-05-24 09:00" }],
    deliveryPhotos: [],
  },
  {
    id: "ct4", orderNumber: "ORD-8824", citizenName: "محمود عياد",
    region: "خان يونس", date: "2026-05-22", quantityLiters: 500,
    paymentMethod: "تطبيق محفظة", escrowStatus: "مُحرَّر",
    driver: { name: "يوسف البطران", plate: "GZ-4821", region: "خان يونس" },
    status: "accepted", notes: null,
    timeline: [
      { label: "إنشاء الطلب", date: "2026-05-21 16:00" },
      { label: "قبول الطلب", date: "2026-05-21 17:30" },
    ],
    deliveryPhotos: [],
  },
  {
    id: "ct5", orderNumber: "ORD-8825", citizenName: "رنا الأسطل",
    region: "رفح", date: "2026-05-20", quantityLiters: 250,
    paymentMethod: "كاش", escrowStatus: "مُعاد",
    driver: { name: "نادر أبو عوض", plate: "GZ-7711", region: "رفح" },
    status: "cancelled", notes: "إلغاء بطلب العميل",
    timeline: [
      { label: "إنشاء الطلب", date: "2026-05-20 10:00" },
      { label: "إلغاء الطلب", date: "2026-05-20 12:30", note: "بطلب العميل" },
    ],
    deliveryPhotos: [],
  },
];

const REGIONS = ["الكل", "شمال غزة", "مدينة غزة", "الوسطى", "خان يونس", "رفح"];

type DriverOption = {
  id: string;
  name: string;
  plate: string;
  capacityLiters: number;
  region: string;
  vehicleType: string;
  status: "active";
};


const REGION_COORDS: Record<string, { lat: number; lng: number; eta: string; km: string }> = {
  "شمال غزة": { lat: 31.547, lng: 34.471, eta: "١٢ دقيقة", km: "٦.٢ كم" },
  "مدينة غزة": { lat: 31.500, lng: 34.465, eta: "١٨ دقيقة", km: "٩.٤ كم" },
  "الوسطى":    { lat: 31.399, lng: 34.428, eta: "٢٥ دقيقة", km: "١٤.٨ كم" },
  "خان يونس":  { lat: 31.345, lng: 34.305, eta: "٣١ دقيقة", km: "٢٢.١ كم" },
  "رفح":       { lat: 31.296, lng: 34.259, eta: "٤٢ دقيقة", km: "٣١.٥ كم" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ar-AE", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtVol(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + " ألف لتر";
  return n.toLocaleString("ar-AE") + " لتر";
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
}

function DriverCell({ driver }: { driver: NgoTask["driver"] }) {
  if (!driver) return <span style={{ color: "#94a3b8", fontSize: 12 }}>لم يُعيَّن بعد</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{driver.name}</span>
      <span style={{ fontSize: 11, color: "#0284c7", fontWeight: 600 }}>{driver.plate}</span>
      <span style={{ fontSize: 11, color: "#6b8aa0" }}>{driver.region}</span>
    </div>
  );
}

type ActionButtonProps = {
  status: TaskStatus;
  approved?: boolean;
  onAction: (action: string) => void;
};

function ActionButton({ status, approved, onAction }: ActionButtonProps) {
  if (status === "pending") {
    return (
      <button
        className="btn btn-primary"
        style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
        onClick={e => { e.stopPropagation(); onAction("assign"); }}
      >تعيين سائق</button>
    );
  }
  if (status === "accepted") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", background: "#fff7ed", color: "#b45309", border: "1.5px solid #fbbf24", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
          onClick={e => { e.stopPropagation(); onAction("reassign"); }}
        >إعادة تعيين سائق</button>
        <button
          className="btn btn-outline"
          style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
          onClick={e => { e.stopPropagation(); onAction("view-driver"); }}
        >عرض السائق</button>
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
        onClick={e => { e.stopPropagation(); onAction("track"); }}
      >تتبع على الخريطة</button>
    );
  }
  if (status === "completed") {
    if (!approved) {
      return (
        <button
          style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
          onClick={e => { e.stopPropagation(); onAction("approve"); }}
        >تأكيد الاستلام</button>
      );
    }
    return (
      <button
        className="btn btn-outline"
        style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", color: "#6b8aa0", borderColor: "#d8eef8" }}
        onClick={e => { e.stopPropagation(); onAction("details"); }}
      >عرض التفاصيل</button>
    );
  }
  if (status === "cancelled") {
    return (
      <button
        className="btn btn-outline"
        style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", color: "#6b8aa0", borderColor: "#d8eef8" }}
        onClick={e => { e.stopPropagation(); onAction("reason"); }}
      >عرض السبب</button>
    );
  }
  return null;
}

type CounterCardVariant = "neutral" | "warning" | "teal" | "green";

const COUNTER_CARD_STYLES: Record<CounterCardVariant, {
  background: string;
  borderLeft: string;
  labelColor: string;
  valueColor: string;
}> = {
  neutral: {
    background: "#fff",
    borderLeft: "1px solid #d8eef8",
    labelColor: "#6b8aa0",
    valueColor: "#12384f",
  },
  warning: {
    background: "#FAEEDA",
    borderLeft: "3px solid #EF9F27",
    labelColor: "#633806",
    valueColor: "#633806",
  },
  teal: {
    background: "#E1F5EE",
    borderLeft: "3px solid #1D9E75",
    labelColor: "#085041",
    valueColor: "#085041",
  },
  green: {
    background: "#EAF3DE",
    borderLeft: "3px solid #639922",
    labelColor: "#27500A",
    valueColor: "#27500A",
  },
};

const COUNTER_ICONS: Record<CounterCardVariant, React.ReactNode> = {
  neutral: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b8aa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  teal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  green: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

function CounterCard({ label, value, variant = "neutral" }: { label: string; value: number; variant?: CounterCardVariant }) {
  const s = COUNTER_CARD_STYLES[variant];
  return (
    <div style={{
      background: s.background,
      border: "1px solid transparent",
      borderLeft: s.borderLeft,
      borderRadius: 12,
      padding: "18px 22px",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        {COUNTER_ICONS[variant]}
        <div style={{ fontSize: 11, color: s.labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color: s.valueColor }}>{value}</div>
    </div>
  );
}

type SidePanelNgoProps = { task: NgoTask; onClose: () => void; onApprove: (id: string) => void };
type SidePanelCitizenProps = { task: CitizenTask; onClose: () => void; onApprove: (id: string) => void };

function NgoSidePanel({ task, onClose, onApprove }: SidePanelNgoProps) {
  const cfg = STATUS_CONFIG[task.status];
  return (
    <div style={{
      position: "fixed", top: 0, bottom: 0, left: 0, width: "100%", zIndex: 200,
      display: "flex", justifyContent: "flex-start",
    }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <div style={{
        width: 420, background: "#fff", height: "100%", overflow: "auto",
        display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      }}>
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "22px 24px", color: "#fff", position: "relative", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{cfg.label}</span>
            <span style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{task.tripNumber}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{task.orgName}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>📋 عقد: {task.contractNumber}</div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="تفاصيل المهمة">
            <InfoGrid rows={[
              { label: "المنطقة", value: task.region },
              { label: "التاريخ", value: fmtDate(task.date) },
              { label: "الكمية", value: fmtVol(task.quantityLiters) },
              { label: "العقد", value: task.contractNumber },
              ...(task.notes ? [{ label: "ملاحظات", value: task.notes }] : []),
            ]} />
          </Section>

          <Section title="معلومات السائق">
            {task.driver ? (
              <InfoGrid rows={[
                { label: "الاسم", value: task.driver.name },
                { label: "اللوحة", value: task.driver.plate },
                { label: "المنطقة", value: task.driver.region },
              ]} />
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "8px 0" }}>لم يُعيَّن سائق بعد</div>
            )}
          </Section>

          <Section title="سجل الحالة">
            <Timeline items={task.timeline} />
          </Section>

          {task.status === "completed" && (
            <Section title="صور التسليم">
              {task.deliveryPhotos.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {task.deliveryPhotos.map((src, i) => (
                    <img key={i} src={src} alt="صورة تسليم" style={{ width: 90, height: 90, borderRadius: 8, objectFit: "cover", border: "1px solid #d8eef8" }} />
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>لم يتم رفع صور بعد</div>
              )}
            </Section>
          )}

          {task.status === "completed" && !task.deliveryApproved && (
            <button
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}
              onClick={() => onApprove(task.id)}
            >تأكيد الاستلام</button>
          )}
        </div>
      </div>
    </div>
  );
}

function CitizenSidePanel({ task, onClose, onApprove }: SidePanelCitizenProps) {
  const cfg = STATUS_CONFIG[task.status];
  return (
    <div style={{
      position: "fixed", top: 0, bottom: 0, left: 0, width: "100%", zIndex: 200,
      display: "flex", justifyContent: "flex-start",
    }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <div style={{
        width: 420, background: "#fff", height: "100%", overflow: "auto",
        display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      }}>
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "22px 24px", color: "#fff", position: "relative", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{cfg.label}</span>
            <span style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{task.orderNumber}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{task.citizenName}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>📍 {task.region}</div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="تفاصيل الطلب">
            <InfoGrid rows={[
              { label: "المنطقة", value: task.region },
              { label: "التاريخ", value: fmtDate(task.date) },
              { label: "الكمية", value: fmtVol(task.quantityLiters) },
              { label: "طريقة الدفع", value: task.paymentMethod },
              { label: "حالة الضمان", value: task.escrowStatus },
              ...(task.notes ? [{ label: "ملاحظات", value: task.notes }] : []),
            ]} />
          </Section>

          <Section title="معلومات السائق">
            {task.driver ? (
              <InfoGrid rows={[
                { label: "الاسم", value: task.driver.name },
                { label: "اللوحة", value: task.driver.plate },
                { label: "المنطقة", value: task.driver.region },
              ]} />
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "8px 0" }}>لم يُعيَّن سائق بعد</div>
            )}
          </Section>

          <Section title="سجل الحالة">
            <Timeline items={task.timeline} />
          </Section>

          {task.status === "completed" && (
            <Section title="صور التسليم">
              {task.deliveryPhotos.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {task.deliveryPhotos.map((src, i) => (
                    <img key={i} src={src} alt="صورة تسليم" style={{ width: 90, height: 90, borderRadius: 8, objectFit: "cover", border: "1px solid #d8eef8" }} />
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>لم يتم رفع صور بعد</div>
              )}
            </Section>
          )}

          {task.status === "completed" && !task.deliveryApproved && (
            <button
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}
              onClick={() => onApprove(task.id)}
            >تأكيد الاستلام</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {rows.map(row => (
        <div key={row.label} style={{ background: "#f8fcff", border: "1px solid #e8f5fd", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 3 }}>{row.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ items }: { items: { label: string; date: string; note?: string }[] }) {
  return (
    <div style={{ position: "relative", paddingRight: 20 }}>
      <div style={{ position: "absolute", right: 6, top: 6, bottom: 6, width: 2, background: "#d8eef8", borderRadius: 2 }} />
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < items.length - 1 ? 16 : 0, position: "relative" }}>
          <div style={{ position: "absolute", right: -20, top: 4, width: 10, height: 10, borderRadius: "50%", background: i === items.length - 1 ? "#0284c7" : "#d8eef8", border: "2px solid #0284c7", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{item.label}</div>
            <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 2 }}>{item.date}</div>
            {item.note && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>{item.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

type TrackTarget = {
  label: string;
  region: string;
  quantity: number;
  driver: { name: string; plate: string; region: string };
  timeline: { label: string; date: string; note?: string }[];
};

function TrackingModal({ target, onClose }: { target: TrackTarget; onClose: () => void }) {
  const coords = REGION_COORDS[target.region] ?? { lat: 31.5, lng: 34.47, eta: "—", km: "—" };
  const delta = 0.025;
  const bbox = `${coords.lng - delta},${coords.lat - delta},${coords.lng + delta},${coords.lat + delta}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "stretch", justifyContent: "center", zIndex: 300, backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", margin: "24px auto", borderRadius: 16, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #065073 100%)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 0 3px rgba(52,211,153,0.35)", animation: "pulse 1.5s infinite" }} />
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>تتبع مباشر — في الطريق</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{target.label} · {target.region}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left sidebar */}
          <div style={{ width: 280, flexShrink: 0, borderLeft: "1px solid #e8f5fd", overflowY: "auto", padding: "18px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* ETA cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>الوصول المتوقع</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{coords.eta}</div>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#1d4ed8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>المسافة</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{coords.km}</div>
              </div>
            </div>

            {/* Driver card */}
            <div style={{ background: "#f8fcff", border: "1px solid #d8eef8", borderRadius: 12, padding: "14px 14px" }}>
              <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>السائق</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {target.driver.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f3d5c" }}>{target.driver.name}</div>
                  <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 2 }}>{target.driver.plate}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "منطقة التغطية", value: target.driver.region },
                  { label: "الكمية", value: fmtVol(target.quantity) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #e8f5fd" }}>
                    <span style={{ fontSize: 11, color: "#6b8aa0" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>سجل الرحلة</div>
              <div style={{ position: "relative", paddingRight: 18 }}>
                <div style={{ position: "absolute", right: 5, top: 5, bottom: 5, width: 2, background: "#d8eef8", borderRadius: 2 }} />
                {target.timeline.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < target.timeline.length - 1 ? 14 : 0, position: "relative" }}>
                    <div style={{ position: "absolute", right: -18, top: 4, width: 10, height: 10, borderRadius: "50%", background: i === target.timeline.length - 1 ? "#0284c7" : "#d8eef8", border: "2px solid #0284c7", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 1 }}>{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div style={{ flex: 1, position: "relative", minHeight: 420, background: "#e8f4f8" }}>
            <iframe
              title="خريطة التتبع"
              src={mapUrl}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              sandbox="allow-scripts allow-same-origin"
            />
            {/* Live overlay badge */}
            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(15,61,92,0.9)", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 7, backdropFilter: "blur(4px)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
              بث مباشر
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(52,211,153,0.35); }
          50% { box-shadow: 0 0 0 7px rgba(52,211,153,0.1); }
        }
      `}</style>
    </div>
  );
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}


type ApproveTarget = {
  taskId: string;
  type: "ngo" | "citizen";
  contractType: "citizen" | "organization";
  label: string;
  region: string;
  quantity: number;
  date: string;
  driver: { name: string; plate: string } | null;
  partyName: string;
  driverGps: [number, number];
  destGps: [number, number];
  deliveryPhotos: string[];
};

function ApproveModal({
  target,
  onClose,
  onApprove,
  onReject,
}: {
  target: ApproveTarget;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const driverPhotos = target.deliveryPhotos;
  const distance = haversineMeters(target.driverGps[0], target.driverGps[1], target.destGps[0], target.destGps[1]);
  const locationOk = distance <= 200;
  const canApprove = locationOk;

  const sectionLabel: React.CSSProperties = { fontSize: 10, color: "#0284c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 };
  const card: React.CSSProperties = { background: "#f8fcff", border: "0.5px solid #d8eef8", borderRadius: 10, padding: "14px 14px" };

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      >
        <div
          style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0f3f5c 0%, #0891b2 100%)", padding: "18px 22px", color: "#fff", position: "relative", flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ position: "absolute", top: 13, left: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
            >×</button>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 3 }}>تأكيد الاستلام</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{target.label} · {target.partyName} · {target.region}</div>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Task summary */}
            <div style={card}>
              <div style={sectionLabel}>ملخص المهمة</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "المنطقة",  value: target.region },
                  { label: "التاريخ",  value: fmtDate(target.date) },
                  { label: "الكمية",   value: fmtVol(target.quantity) },
                  { label: "السائق",   value: target.driver ? `${target.driver.name} · ${target.driver.plate}` : "—" },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location verification */}
            <div style={card}>
              <div style={sectionLabel}>
                التحقق من الموقع
                <span style={{ fontWeight: 400, fontSize: 9, color: "#94a3b8", marginRight: 6, textTransform: "none" }}>(تلقائي)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "#6b8aa0", lineHeight: 1.7 }}>
                  <div>موقع السائق: {target.driverGps[0].toFixed(4)}, {target.driverGps[1].toFixed(4)}</div>
                  <div>الوجهة المطلوبة: {target.destGps[0].toFixed(4)}, {target.destGps[1].toFixed(4)}</div>
                </div>
                {locationOk ? (
                  <span style={{ background: "#dcfce7", color: "#166534", border: "0.5px solid #86efac", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    الموقع مطابق ✓
                  </span>
                ) : (
                  <span style={{ background: "#fee2e2", color: "#991b1b", border: "0.5px solid #fca5a5", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    الموقع غير مطابق ✗ — بُعد {distance}م
                  </span>
                )}
              </div>
              {!locationOk && (
                <div style={{ marginTop: 10, background: "#fef2f2", border: "0.5px solid #fca5a5", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#991b1b", fontWeight: 600 }}>
                  لا يمكن تأكيد الاستلام — الموقع خارج نطاق 200 متر من الوجهة المحددة.
                </div>
              )}
            </div>

            {/* Driver photos — read-only */}
            <div>
              <div style={sectionLabel}>صور التسليم — مُرفوعة من السائق</div>
              {driverPhotos.length === 0 ? (
                <div style={{ background: "#f8fcff", border: "0.5px solid #d8eef8", borderRadius: 10, padding: "18px 14px", textAlign: "center", color: "#8eb5c8", fontSize: 12, fontWeight: 600 }}>
                  لم يرفع السائق صوراً بعد
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {driverPhotos.map((url, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 170, border: "0.5px solid #d8eef8", borderRadius: 10, overflow: "hidden", background: "#f8fcff" }}>
                      <img
                        src={url}
                        alt={`صورة التسليم ${i + 1}`}
                        style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
                      />
                      <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#12384f" }}>صورة {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setLightboxSrc(url)}
                          style={{ fontSize: 10, padding: "3px 8px", border: "0.5px solid #0284c7", borderRadius: 6, color: "#0284c7", background: "#f0f9ff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" }}
                        >عرض كامل</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection reason panel */}
            {rejectMode && (
              <div style={{ background: "#fff5f5", border: "0.5px solid #fca5a5", borderRadius: 10, padding: "14px 14px" }}>
                <div style={{ ...sectionLabel, color: "#dc2626" }}>سبب الرفض</div>
                <textarea
                  autoFocus
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="اكتب سبب رفض التسليم بوضوح..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #fca5a5", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            )}

            {/* Escrow warning */}
            {!rejectMode && (
              <div style={{ background: "#fffbeb", border: "0.5px solid #fbbf24", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600, lineHeight: 1.5 }}>
                  بعد تأكيد الاستلام سيتم الإفراج عن مبلغ الضمان للمزود. هذا الإجراء لا يمكن التراجع عنه.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 22px", borderTop: "0.5px solid #d8eef8", display: "flex", gap: 8, flexShrink: 0 }}>
            {!rejectMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  style={{ flex: 1, padding: "11px 0", border: "1.5px solid #dc2626", borderRadius: 8, background: "#fff", color: "#dc2626", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >رفض التسليم</button>
                <button
                  type="button"
                  disabled={!canApprove}
                  onClick={onApprove}
                  title={!locationOk ? "لا يمكن التأكيد: الموقع غير مطابق" : ""}
                  style={{ flex: 2, padding: "11px 0", border: "none", borderRadius: 8, background: canApprove ? "#0891b2" : "#e2e8f0", color: canApprove ? "#fff" : "#94a3b8", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: canApprove ? "pointer" : "not-allowed", transition: "all 0.15s" }}
                >✓ تأكيد الاستلام</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  style={{ flex: 1, padding: "11px 0", border: "0.5px solid #d8eef8", borderRadius: 8, background: "#fff", color: "#6b8aa0", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >← رجوع</button>
                <button
                  type="button"
                  disabled={!rejectReason.trim()}
                  onClick={() => onReject(rejectReason.trim())}
                  style={{ flex: 2, padding: "11px 0", border: "none", borderRadius: 8, background: rejectReason.trim() ? "#dc2626" : "#e2e8f0", color: rejectReason.trim() ? "#fff" : "#94a3b8", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: rejectReason.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}
                >تأكيد الرفض</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="عرض كامل" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{ position: "fixed", top: 20, left: 20, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
          >×</button>
        </div>
      )}
    </>
  );
}

type AssignTarget = { taskId: string; taskLabel: string; region: string; quantity: number; type: "ngo" | "citizen"; isReassign?: boolean; currentDriverName?: string };

function AssignDriverModal({
  target,
  onClose,
  onConfirm,
  drivers,
}: {
  target: AssignTarget;
  onClose: () => void;
  onConfirm: (driver: DriverOption) => void;
  drivers: DriverOption[];
}) {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selected, setSelected] = useState<DriverOption | null>(null);

  const now = new Date().toLocaleString("ar-AE", { dateStyle: "short", timeStyle: "short" });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f3d5c 0%, #0284c7 100%)", padding: "20px 24px", color: "#fff", position: "relative", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
          >×</button>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
            {step === "select" ? "الخطوة 1 من 2 — اختر السائق" : "الخطوة 2 من 2 — تأكيد التعيين"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {target.isReassign ? "إعادة تعيين سائق" : "تعيين سائق"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{target.taskLabel} · {target.region} · {fmtVol(target.quantity)}</div>
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[1, 2].map(n => (
              <div key={n} style={{ height: 3, flex: 1, borderRadius: 2, background: (step === "select" ? n <= 1 : n <= 2) ? "#fff" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {step === "select" && (
            <>
              <p style={{ fontSize: 13, color: "#6b8aa0", marginBottom: 16 }}>
                {target.isReassign
                  ? "اختر السائق الجديد. السائق الحالي سيتم إلغاء تعيينه فور التأكيد."
                  : "اختر أحد السائقين النشطين أدناه لتعيينه على هذه المهمة."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {drivers.map(driver => {
                  const isSelected = selected?.id === driver.id;
                  const isCurrent = target.isReassign && target.currentDriverName === driver.name;
                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelected(driver)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                        border: isSelected ? "2px solid #0284c7" : isCurrent ? "2px solid #f59e0b" : "2px solid #d8eef8",
                        background: isSelected ? "#f0f9ff" : isCurrent ? "#fffbeb" : "#fafcff",
                        textAlign: "right", fontFamily: "inherit", width: "100%",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: isSelected ? "#0284c7" : isCurrent ? "#f59e0b" : "#d8eef8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isSelected || isCurrent ? "#fff" : "#6b8aa0", fontWeight: 800, fontSize: 14,
                      }}>
                        {driver.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#0f3d5c" : "#12384f" }}>{driver.name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#b45309", border: "1px solid #fbbf24", borderRadius: 10, padding: "2px 8px" }}>معيّن حالياً</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>🚗 {driver.plate}</span>
                          <span>💧 {driver.capacityLiters.toLocaleString("ar-AE")} لتر</span>
                          <span>📍 {driver.region}</span>
                          <span>🚛 {driver.vehicleType}</span>
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: isSelected ? "none" : "2px solid #d8eef8",
                        background: isSelected ? "#0284c7" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isSelected && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "confirm" && selected && (
            <>
              <p style={{ fontSize: 13, color: "#6b8aa0", marginBottom: 16 }}>
                راجع التفاصيل أدناه قبل تأكيد التعيين. لا يمكن التراجع عن هذا الإجراء.
              </p>

              {/* Task summary */}
              <div style={{ background: "#f8fcff", border: "1px solid #d8eef8", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>المهمة</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "الرقم المرجعي", value: target.taskLabel },
                    { label: "المنطقة", value: target.region },
                    { label: "الكمية", value: fmtVol(target.quantity) },
                    { label: "وقت التعيين", value: now },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: 10, color: "#6b8aa0", fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#12384f" }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver summary */}
              <div style={{ background: "#f0f9ff", border: "2px solid #0284c7", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>السائق المُعيَّن</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#0f3d5c" }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: "#6b8aa0", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>🚗 {selected.plate}</span>
                      <span>💧 {selected.capacityLiters.toLocaleString("ar-AE")} لتر</span>
                      <span>📍 {selected.region}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #d8eef8", display: "flex", gap: 10, flexShrink: 0 }}>
          {step === "select" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: "11px 0", border: "1px solid #d8eef8", borderRadius: 8, background: "#fff", color: "#6b8aa0", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >إلغاء</button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => setStep("confirm")}
                style={{ flex: 2, padding: "11px 0", border: "none", borderRadius: 8, background: selected ? "#0284c7" : "#d8eef8", color: selected ? "#fff" : "#94a3b8", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: selected ? "pointer" : "not-allowed", transition: "all 0.15s" }}
              >التالي — تأكيد السائق</button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("select")}
                style={{ flex: 1, padding: "11px 0", border: "1px solid #d8eef8", borderRadius: 8, background: "#fff", color: "#6b8aa0", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >← رجوع</button>
              <button
                type="button"
                onClick={() => selected && onConfirm(selected)}
                style={{ flex: 2, padding: "11px 0", border: "none", borderRadius: 8, background: "#0284c7", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >✓ تأكيد التعيين</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterBarProps = {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  regionFilter: string;
  setRegionFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  searchPlaceholder: string;
};

function FilterBar({
  statusFilter, setStatusFilter,
  regionFilter, setRegionFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  search, setSearch,
  searchPlaceholder,
}: FilterBarProps) {
  return (
    <div style={{
      background: "#f8fcff", border: "1px solid #d8eef8", borderRadius: 10,
      padding: "14px 16px", marginBottom: 20,
      display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
    }}>
      <select
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        style={{ padding: "7px 12px", border: "1px solid #d8eef8", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff", cursor: "pointer", minWidth: 120 }}
      >
        <option value="all">كل الحالات</option>
        <option value="pending">معلقة</option>
        <option value="accepted">مقبولة</option>
        <option value="in_progress">جارية</option>
        <option value="completed">مكتملة</option>
        <option value="cancelled">ملغية</option>
      </select>

      <select
        value={regionFilter}
        onChange={e => setRegionFilter(e.target.value)}
        style={{ padding: "7px 12px", border: "1px solid #d8eef8", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff", cursor: "pointer", minWidth: 130 }}
      >
        {REGIONS.map(r => (
          <option key={r} value={r === "الكل" ? "all" : r}>{r}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          style={{ padding: "7px 10px", border: "1px solid #d8eef8", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff" }}
        />
        <span style={{ fontSize: 12, color: "#6b8aa0" }}>–</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          style={{ padding: "7px 10px", border: "1px solid #d8eef8", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff" }}
        />
      </div>

      <input
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: "7px 12px", border: "1px solid #d8eef8", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#12384f", background: "#fff", flex: 1, minWidth: 180 }}
      />
    </div>
  );
}

export default function ProviderTasks() {
  const { user } = useAppContext();
  const providerId = typeof (user.profile as Record<string, unknown> | null)?.id === "string"
    ? (user.profile as Record<string, unknown>).id as string
    : "";

  const [tab, setTab] = useState<"ngo" | "citizen">("ngo");
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeDrivers, setActiveDrivers] = useState<DriverOption[]>([]);

  const [ngoStatus, setNgoStatus] = useState("all");
  const [ngoRegion, setNgoRegion] = useState("all");
  const [ngoDateFrom, setNgoDateFrom] = useState("");
  const [ngoDateTo, setNgoDateTo] = useState("");
  const [ngoSearch, setNgoSearch] = useState("");
  const [selectedNgoTask, setSelectedNgoTask] = useState<NgoTask | null>(null);
  const [ngoTasks, setNgoTasks] = useState<NgoTask[]>([]);

  const [citStatus, setCitStatus] = useState("all");
  const [citRegion, setCitRegion] = useState("all");
  const [citDateFrom, setCitDateFrom] = useState("");
  const [citDateTo, setCitDateTo] = useState("");
  const [citSearch, setCitSearch] = useState("");
  const [selectedCitTask, setSelectedCitTask] = useState<CitizenTask | null>(null);
  const [citTasks, setCitTasks] = useState<CitizenTask[]>(CITIZEN_TASKS_MOCK);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [trackTarget, setTrackTarget] = useState<TrackTarget | null>(null);
  const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTasks = useCallback(async () => {
    if (!providerId) return;
    setLoadingTasks(true);
    try {
      const [tasksRes, driversRes] = await Promise.all([
        fetch("/api/provider/tasks").then(r => r.json()),
        fetch(`/api/provider-drivers?providerId=${providerId}`).then(r => r.json()),
      ]);
      setNgoTasks(tasksRes.data ?? []);
      const mapped: DriverOption[] = (driversRes.data ?? [])
        .filter((d: Record<string, unknown>) => d.status === "active")
        .map((d: Record<string, unknown>) => ({
          id: String(d.id ?? ""),
          name: String(d.fullName ?? "سائق"),
          plate: String(d.plateNumber ?? "—"),
          capacityLiters: Number(d.capacityLiters ?? 0),
          region: String(d.zone ?? "غير محدد"),
          vehicleType: String(d.vehicleModel ?? d.vehicleType ?? "مركبة"),
          status: "active" as const,
        }));
      setActiveDrivers(mapped);
    } finally {
      setLoadingTasks(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredNgo = ngoTasks.filter(t => {
    if (ngoStatus !== "all" && t.status !== ngoStatus) return false;
    if (ngoRegion !== "all" && t.region !== ngoRegion) return false;
    if (ngoDateFrom && t.date < ngoDateFrom) return false;
    if (ngoDateTo && t.date > ngoDateTo) return false;
    if (ngoSearch) {
      const q = ngoSearch.toLowerCase();
      if (!t.tripNumber.toLowerCase().includes(q) && !t.orgName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredCit = citTasks.filter(t => {
    if (citStatus !== "all" && t.status !== citStatus) return false;
    if (citRegion !== "all" && t.region !== citRegion) return false;
    if (citDateFrom && t.date < citDateFrom) return false;
    if (citDateTo && t.date > citDateTo) return false;
    if (citSearch) {
      const q = citSearch.toLowerCase();
      if (!t.orderNumber.toLowerCase().includes(q) && !t.citizenName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const ngoCounters = {
    total: ngoTasks.length,
    pending: ngoTasks.filter(t => t.status === "pending").length,
    inProgress: ngoTasks.filter(t => t.status === "in_progress").length,
    completed: ngoTasks.filter(t => t.status === "completed").length,
  };

  const citCounters = {
    total: citTasks.length,
    pending: citTasks.filter(t => t.status === "pending").length,
    inProgress: citTasks.filter(t => t.status === "in_progress").length,
    completed: citTasks.filter(t => t.status === "completed").length,
  };

  const handleCitApprove = (id: string) => {
    setCitTasks(prev => prev.map(t => t.id === id ? { ...t, deliveryApproved: true } : t));
    if (selectedCitTask?.id === id) setSelectedCitTask(prev => prev ? { ...prev, deliveryApproved: true } : null);
  };

  const nowLabel = () => new Date().toLocaleString("ar-AE", { dateStyle: "short", timeStyle: "short" });

  const handleAssignConfirm = async (driver: DriverOption) => {
    if (!assignTarget) return;
    const driverData = { name: driver.name, plate: driver.plate, region: driver.region };
    const timeEntry = assignTarget.isReassign
      ? { label: `إعادة تعيين السائق — السابق: ${assignTarget.currentDriverName ?? "—"}`, date: nowLabel() }
      : { label: "تعيين السائق", date: nowLabel() };

    if (assignTarget.type === "ngo") {
      try {
        const res = await fetch(`/api/provider/tasks/${assignTarget.taskId}/assign-driver`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId: driver.id }),
        });
        if (!res.ok) throw new Error();
        setNgoTasks(prev => prev.map(t =>
          t.id === assignTarget.taskId
            ? { ...t, status: "accepted" as const, driver: driverData, timeline: [...t.timeline, timeEntry] }
            : t
        ));
        showToast("تم تعيين السائق بنجاح", true);
      } catch {
        showToast("حدث خطأ أثناء تعيين السائق", false);
      }
    } else {
      setCitTasks(prev => prev.map(t =>
        t.id === assignTarget.taskId
          ? { ...t, status: assignTarget.isReassign ? t.status : "accepted" as const, driver: driverData, timeline: [...t.timeline, timeEntry] }
          : t
      ));
    }
    setAssignTarget(null);
  };

  const handleApproveApprove = () => {
    if (!approveTarget) return;
    const timeEntry = { label: "تم تأكيد الاستلام", date: nowLabel() };
    console.log(`[Escrow] Released for task ${approveTarget.taskId} — party: ${approveTarget.partyName}`);
    if (approveTarget.type === "ngo") {
      setNgoTasks(prev => prev.map(t =>
        t.id === approveTarget.taskId
          ? { ...t, deliveryApproved: true, timeline: [...t.timeline, timeEntry] }
          : t
      ));
      if (selectedNgoTask?.id === approveTarget.taskId)
        setSelectedNgoTask(prev => prev ? { ...prev, deliveryApproved: true } : null);
    } else {
      setCitTasks(prev => prev.map(t =>
        t.id === approveTarget.taskId
          ? { ...t, deliveryApproved: true, timeline: [...t.timeline, timeEntry] }
          : t
      ));
      if (selectedCitTask?.id === approveTarget.taskId)
        setSelectedCitTask(prev => prev ? { ...prev, deliveryApproved: true } : null);
    }
    setApproveTarget(null);
    showToast("تم تأكيد الاستلام بنجاح وإطلاق الضمان", true);
  };

  const handleApproveReject = (reason: string) => {
    if (!approveTarget) return;
    const timeEntry = { label: "تم رفض التسليم", date: nowLabel(), note: reason };
    if (approveTarget.type === "ngo") {
      setNgoTasks(prev => prev.map(t =>
        t.id === approveTarget.taskId
          ? { ...t, timeline: [...t.timeline, timeEntry] }
          : t
      ));
    } else {
      setCitTasks(prev => prev.map(t =>
        t.id === approveTarget.taskId
          ? { ...t, timeline: [...t.timeline, timeEntry] }
          : t
      ));
    }
    setApproveTarget(null);
    showToast("تم رفض التسليم وإخطار السائق", false);
  };

  const thStyle: React.CSSProperties = {
    textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600,
    color: "#6b8aa0", textTransform: "uppercase", letterSpacing: "0.5px",
    background: "#f8fcff", borderBottom: "1px solid #d8eef8", whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", fontSize: 13, color: "#12384f",
    borderBottom: "1px solid #f0f9ff", verticalAlign: "middle",
  };

  const rowStyle: React.CSSProperties = {
    cursor: "pointer", transition: "background 0.12s",
  };

  return (
    <div className="page" style={{ padding: "28px" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #d8eef8", marginBottom: 24 }}>
        {([["ngo", "مهام المنظمات"], ["citizen", "مهام المواطنين"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "11px 28px", fontSize: 14, fontWeight: 700,
              border: "none", background: "none", cursor: "pointer",
              color: tab === id ? "#0284c7" : "#6b8aa0",
              borderBottom: tab === id ? "3px solid #0284c7" : "3px solid transparent",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
          >{label}</button>
        ))}
      </div>

      {tab === "ngo" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <CounterCard label="إجمالي المهام" value={ngoCounters.total} variant="neutral" />
            <CounterCard label="معلقة" value={ngoCounters.pending} variant="warning" />
            <CounterCard label="جارية" value={ngoCounters.inProgress} variant="teal" />
            <CounterCard label="مكتملة" value={ngoCounters.completed} variant="green" />
          </div>

          <FilterBar
            statusFilter={ngoStatus} setStatusFilter={setNgoStatus}
            regionFilter={ngoRegion} setRegionFilter={setNgoRegion}
            dateFrom={ngoDateFrom} setDateFrom={setNgoDateFrom}
            dateTo={ngoDateTo} setDateTo={setNgoDateTo}
            search={ngoSearch} setSearch={setNgoSearch}
            searchPlaceholder="بحث برقم الرحلة أو اسم المنظمة..."
          />

          <div className="card">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>رقم الرحلة</th>
                    <th style={thStyle}>رقم العقد / المنظمة</th>
                    <th style={thStyle}>المنطقة</th>
                    <th style={thStyle}>التاريخ</th>
                    <th style={thStyle}>الكمية (لتر)</th>
                    <th style={thStyle}>السائق</th>
                    <th style={thStyle}>الحالة</th>
                    <th style={thStyle}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTasks ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "#8eb5c8" }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>جارٍ تحميل المهام…</div>
                      </td>
                    </tr>
                  ) : filteredNgo.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "#8eb5c8" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>لا توجد مهام من منظمات بعد — ابدأ بقبول عقد</div>
                      </td>
                    </tr>
                  ) : (
                    filteredNgo.map(task => (
                      <tr
                        key={task.id}
                        style={rowStyle}
                        onClick={() => setSelectedNgoTask(task)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fcff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: "#0284c7" }}>{task.tripNumber}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{task.contractNumber}</div>
                          <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 2 }}>{task.orgName}</div>
                        </td>
                        <td style={tdStyle}>{task.region}</td>
                        <td style={tdStyle} dir="ltr">{fmtDate(task.date)}</td>
                        <td style={tdStyle}>{fmtVol(task.quantityLiters)}</td>
                        <td style={tdStyle}><DriverCell driver={task.driver} /></td>
                        <td style={tdStyle}><StatusBadge status={task.status} /></td>
                        <td style={tdStyle}>
                          <ActionButton
                            status={task.status}
                            approved={task.deliveryApproved}
                            onAction={action => {
                              if (action === "assign") {
                                setAssignTarget({ taskId: task.id, taskLabel: task.tripNumber, region: task.region, quantity: task.quantityLiters, type: "ngo" });
                              } else if (action === "reassign") {
                                setAssignTarget({ taskId: task.id, taskLabel: task.tripNumber, region: task.region, quantity: task.quantityLiters, type: "ngo", isReassign: true, currentDriverName: task.driver?.name });
                              } else if (action === "track" && task.driver) {
                                setTrackTarget({ label: task.tripNumber, region: task.region, quantity: task.quantityLiters, driver: task.driver, timeline: task.timeline });
                              } else if (action === "approve") {
                                setApproveTarget({ taskId: task.id, type: "ngo", contractType: "organization", label: task.tripNumber, region: task.region, quantity: task.quantityLiters, date: task.date, driver: task.driver, partyName: task.orgName, driverGps: [31.502, 34.471], destGps: [31.501, 34.470], deliveryPhotos: task.deliveryPhotos });
                              } else {
                                setSelectedNgoTask(task);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "citizen" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <CounterCard label="إجمالي المهام" value={citCounters.total} variant="neutral" />
            <CounterCard label="معلقة" value={citCounters.pending} variant="warning" />
            <CounterCard label="جارية" value={citCounters.inProgress} variant="teal" />
            <CounterCard label="مكتملة" value={citCounters.completed} variant="green" />
          </div>

          <FilterBar
            statusFilter={citStatus} setStatusFilter={setCitStatus}
            regionFilter={citRegion} setRegionFilter={setCitRegion}
            dateFrom={citDateFrom} setDateFrom={setCitDateFrom}
            dateTo={citDateTo} setDateTo={setCitDateTo}
            search={citSearch} setSearch={setCitSearch}
            searchPlaceholder="بحث برقم الطلب أو اسم المواطن..."
          />

          <div className="card">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>رقم الطلب</th>
                    <th style={thStyle}>اسم المواطن</th>
                    <th style={thStyle}>المنطقة</th>
                    <th style={thStyle}>التاريخ</th>
                    <th style={thStyle}>الكمية (لتر)</th>
                    <th style={thStyle}>طريقة الدفع</th>
                    <th style={thStyle}>السائق</th>
                    <th style={thStyle}>الحالة</th>
                    <th style={thStyle}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCit.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "48px 24px", textAlign: "center", color: "#8eb5c8" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>لا توجد طلبات من مواطنين بعد</div>
                      </td>
                    </tr>
                  ) : (
                    filteredCit.map(task => (
                      <tr
                        key={task.id}
                        style={rowStyle}
                        onClick={() => setSelectedCitTask(task)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fcff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: "#0284c7" }}>{task.orderNumber}</span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{task.citizenName}</td>
                        <td style={tdStyle}>{task.region}</td>
                        <td style={tdStyle} dir="ltr">{fmtDate(task.date)}</td>
                        <td style={tdStyle}>{fmtVol(task.quantityLiters)}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{task.paymentMethod}</div>
                          <div style={{ fontSize: 11, color: "#6b8aa0", marginTop: 2 }}>{task.escrowStatus}</div>
                        </td>
                        <td style={tdStyle}><DriverCell driver={task.driver} /></td>
                        <td style={tdStyle}><StatusBadge status={task.status} /></td>
                        <td style={tdStyle}>
                          <ActionButton
                            status={task.status}
                            approved={task.deliveryApproved}
                            onAction={action => {
                              if (action === "assign") {
                                setAssignTarget({ taskId: task.id, taskLabel: task.orderNumber, region: task.region, quantity: task.quantityLiters, type: "citizen" });
                              } else if (action === "reassign") {
                                setAssignTarget({ taskId: task.id, taskLabel: task.orderNumber, region: task.region, quantity: task.quantityLiters, type: "citizen", isReassign: true, currentDriverName: task.driver?.name });
                              } else if (action === "track" && task.driver) {
                                setTrackTarget({ label: task.orderNumber, region: task.region, quantity: task.quantityLiters, driver: task.driver, timeline: task.timeline });
                              } else if (action === "approve") {
                                setApproveTarget({ taskId: task.id, type: "citizen", contractType: "citizen", label: task.orderNumber, region: task.region, quantity: task.quantityLiters, date: task.date, driver: task.driver, partyName: task.citizenName, driverGps: [31.502, 34.471], destGps: [31.501, 34.470], deliveryPhotos: task.deliveryPhotos });
                              } else {
                                setSelectedCitTask(task);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedNgoTask && (
        <NgoSidePanel
          task={selectedNgoTask}
          onClose={() => setSelectedNgoTask(null)}
          onApprove={() => {
            setApproveTarget({
              taskId: selectedNgoTask.id,
              type: "ngo",
              contractType: "organization",
              label: selectedNgoTask.tripNumber,
              region: selectedNgoTask.region,
              quantity: selectedNgoTask.quantityLiters,
              date: selectedNgoTask.date,
              driver: selectedNgoTask.driver,
              partyName: selectedNgoTask.orgName,
              driverGps: [31.502, 34.471],
              destGps: [31.501, 34.470],
              deliveryPhotos: selectedNgoTask.deliveryPhotos,
            });
          }}
        />
      )}

      {selectedCitTask && (
        <CitizenSidePanel
          task={selectedCitTask}
          onClose={() => setSelectedCitTask(null)}
          onApprove={id => { handleCitApprove(id); setSelectedCitTask(null); }}
        />
      )}

      {assignTarget && (
        <AssignDriverModal
          target={assignTarget}
          onClose={() => setAssignTarget(null)}
          onConfirm={handleAssignConfirm}
          drivers={activeDrivers}
        />
      )}

      {trackTarget && (
        <TrackingModal
          target={trackTarget}
          onClose={() => setTrackTarget(null)}
        />
      )}

      {approveTarget && (
        <ApproveModal
          target={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApprove={handleApproveApprove}
          onReject={handleApproveReject}
        />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 500,
          background: toast.ok ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "13px 20px",
          fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)", minWidth: 240,
          animation: "slideInToast 0.25s ease",
        }}>
          <span style={{ fontSize: 16 }}>{toast.ok ? "✓" : "✗"}</span>
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            style={{ marginRight: "auto", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
          >×</button>
        </div>
      )}
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
