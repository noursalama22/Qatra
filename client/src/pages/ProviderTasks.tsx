import { useState, useEffect, useRef } from "react";

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
    deliveryPhotos: [], parentContractId: "CTR-0041", deliveryApproved: true,
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
      <button
        className="btn btn-outline"
        style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
        onClick={e => { e.stopPropagation(); onAction("view-driver"); }}
      >عرض السائق</button>
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
        >اعتماد التسليم</button>
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
      <div style={{ fontSize: 11, color: s.labelColor, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
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
            >اعتماد التسليم</button>
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
            >اعتماد التسليم</button>
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
  const [tab, setTab] = useState<"ngo" | "citizen">("ngo");

  const [ngoStatus, setNgoStatus] = useState("all");
  const [ngoRegion, setNgoRegion] = useState("all");
  const [ngoDateFrom, setNgoDateFrom] = useState("");
  const [ngoDateTo, setNgoDateTo] = useState("");
  const [ngoSearch, setNgoSearch] = useState("");
  const [selectedNgoTask, setSelectedNgoTask] = useState<NgoTask | null>(null);
  const [ngoTasks, setNgoTasks] = useState<NgoTask[]>(NGO_TASKS_MOCK);

  const [citStatus, setCitStatus] = useState("all");
  const [citRegion, setCitRegion] = useState("all");
  const [citDateFrom, setCitDateFrom] = useState("");
  const [citDateTo, setCitDateTo] = useState("");
  const [citSearch, setCitSearch] = useState("");
  const [selectedCitTask, setSelectedCitTask] = useState<CitizenTask | null>(null);
  const [citTasks, setCitTasks] = useState<CitizenTask[]>(CITIZEN_TASKS_MOCK);

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

  const handleNgoApprove = (id: string) => {
    setNgoTasks(prev => prev.map(t => t.id === id ? { ...t, deliveryApproved: true } : t));
    if (selectedNgoTask?.id === id) setSelectedNgoTask(prev => prev ? { ...prev, deliveryApproved: true } : null);
  };

  const handleCitApprove = (id: string) => {
    setCitTasks(prev => prev.map(t => t.id === id ? { ...t, deliveryApproved: true } : t));
    if (selectedCitTask?.id === id) setSelectedCitTask(prev => prev ? { ...prev, deliveryApproved: true } : null);
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
                  {filteredNgo.length === 0 ? (
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
                              if (action === "approve") handleNgoApprove(task.id);
                              else setSelectedNgoTask(task);
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
                              if (action === "approve") handleCitApprove(task.id);
                              else setSelectedCitTask(task);
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
          onApprove={id => { handleNgoApprove(id); setSelectedNgoTask(null); }}
        />
      )}

      {selectedCitTask && (
        <CitizenSidePanel
          task={selectedCitTask}
          onClose={() => setSelectedCitTask(null)}
          onApprove={id => { handleCitApprove(id); setSelectedCitTask(null); }}
        />
      )}
    </div>
  );
}
