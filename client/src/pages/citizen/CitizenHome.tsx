import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CitizenNavIcon from "../../components/citizen/CitizenNavIcon";
import { useCitizenContext } from "../../contexts/CitizenContext";
import type { Task } from "../../api";

const AR_DAY_LETTERS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "قريباً";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `متبقي ${hours} ساعة و ${mins} دقيقة للموعد القادم`;
  return `متبقي ${mins} دقيقة للموعد القادم`;
}

function weekDays(base = new Date()) {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function scheduleIcon(task: Task) {
  if (task.notes?.includes("هلال")) return "❤️";
  if (task.notes?.includes("بلدية")) return "🚛";
  return "💧";
}

function taskPartiesLabel(task: Task): string {
  if (task.providerNames?.length) return task.providerNames.join(" · ");
  if (task.ngoName) return task.ngoName;
  return "مزود غير محدد بعد";
}

const TASK_STATUS: Record<string, { ar: string; cls: string }> = {
  pending: { ar: "مجدول", cls: "badge-green" },
  in_progress: { ar: "جارٍ الآن", cls: "badge-blue" },
  delivered: { ar: "تم التوزيع", cls: "badge-gray" },
  cancelled: { ar: "ملغى", cls: "badge-red" },
};

export default function CitizenHome() {
  const {
    citizen, selectedZone, zones, setSelectedZone, schedule, loading,
    zoneStatus, nextDelivery, sendSignal, signalCount, isOnline,
  } = useCitizenContext();
  const [signalState, setSignalState] = useState<"idle" | "sending" | "sent">("idle");
  const todayKey = new Date().toDateString();
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);

  const days = useMemo(() => weekDays(), []);

  const scheduleByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of schedule) {
      const key = new Date(t.scheduledAt).toDateString();
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    for (const [, list] of map) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [schedule]);

  useEffect(() => {
    setSelectedDayKey(todayKey);
  }, [selectedZone?.id, todayKey]);

  const selectedDayTasks = useMemo(
    () => scheduleByDay.get(selectedDayKey) ?? [],
    [scheduleByDay, selectedDayKey],
  );

  const selectedDayLabel = useMemo(() => {
    const d = new Date(selectedDayKey);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ar-SY", { weekday: "long", day: "numeric", month: "long" });
  }, [selectedDayKey]);

  const handleSignal = async () => {
    if (signalState !== "idle") return;
    setSignalState("sending");
    try {
      await sendSignal();
      setSignalState("sent");
      setTimeout(() => setSignalState("idle"), 4000);
    } catch {
      setSignalState("idle");
    }
  };

  if (loading || !citizen) {
    return (
      <div className="citizen-pwa-loading">
        <div className="spinner" />
        <p>جارٍ تحميل حسابك...</p>
      </div>
    );
  }

  const zoneName = selectedZone?.name ?? citizen.zoneName ?? "منطقتك";

  return (
    <div className="citizen-pwa-page">
      {!isOnline && (
        <div className="citizen-pwa-offline-banner" role="status">
          أنت غير متصل — يتم عرض آخر البيانات المحفوظة
        </div>
      )}

      {zones.length > 1 && (
        <label className="citizen-pwa-zone-select">
          <span>منطقتك</span>
          <select
            value={selectedZone?.id ?? ""}
            onChange={e => {
              const z = zones.find(x => x.id === e.target.value);
              if (z) setSelectedZone(z);
            }}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="citizen-home-grid">
        <div className="citizen-home-status">
      {zoneStatus === "critical" ? (
        <div className="citizen-home-critical-stack">
          <div className="citizen-status-card citizen-status-critical">
            <div className="citizen-status-body">
              <div className="citizen-status-copy">
                <h2>منطقتكم بحاجة ماسة للمياه حالياً</h2>
                <p>
                  لا توجد عمليات توزيع مجدولة خلال الـ 48 ساعة القادمة.
                  فرقنا تعمل على تأمين المصادر.
                </p>
              </div>
              <span className="citizen-status-icon citizen-status-icon-warn" aria-hidden>⚠️</span>
            </div>
            <div className="citizen-status-footer">
              <span>🕐</span>
              <span>آخر تحديث: منذ 10 دقائق · {signalCount} إشارة نشطة</span>
            </div>
          </div>

          <button
            type="button"
            className="citizen-pwa-cta citizen-pwa-cta-lg"
            onClick={handleSignal}
            disabled={signalState !== "idle"}
          >
            {signalState === "sending" ? "جارٍ الإرسال…" : signalState === "sent" ? "✓ أُرسلت رسالة الاحتياج" : "✈️ إرسال رسالة احتياج"}
          </button>
        </div>
      ) : (
        <>
          <header className="citizen-pwa-section-head citizen-pwa-section-head-center">
            <h1>حالة الحي الحالية</h1>
            <p>{zoneName} مؤمنة بالكامل</p>
          </header>

          <div className="citizen-status-card citizen-status-safe">
            <span className="citizen-status-icon citizen-status-icon-safe" aria-hidden>✓</span>
            <h2>منطقتكم مغطاة حالياً بأمان</h2>
            <p>{nextDelivery ? formatCountdown(new Date(nextDelivery.scheduledAt)) : "لا توزيع قريب مجدول"}</p>
            <hr />
            <div className="citizen-status-meta">
              <span className="citizen-status-percent">100%</span>
              <span>
                🕐 {selectedZone?.lastDeliveryAt
                  ? `تم توفير مياه ${new Date(selectedZone.lastDeliveryAt).toLocaleDateString("ar-SY")}`
                  : "لم يتم التوزيع بعد"}
              </span>
            </div>
          </div>
        </>
      )}
        </div>

      <section className="citizen-pwa-section citizen-home-schedule">
        <div className="citizen-pwa-section-head">
          <span className="citizen-pwa-muted">الأسبوع الحالي</span>
          <h3>جدول التوزيع الأسبوعي</h3>
        </div>

        <div className="citizen-week-card">
          <div className="citizen-week-grid" role="tablist" aria-label="أيام الأسبوع">
            {days.map((day, i) => {
              const dayKey = day.toDateString();
              const isToday = dayKey === todayKey;
              const isSelected = dayKey === selectedDayKey;
              const hasSchedule = scheduleByDay.has(dayKey);
              const taskCount = scheduleByDay.get(dayKey)?.length ?? 0;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${AR_DAY_LETTERS[i]} ${day.getDate()}${taskCount ? `، ${taskCount} توزيع` : ""}`}
                  className={`citizen-week-day${isToday ? " citizen-week-today" : ""}${isSelected ? " citizen-week-selected" : ""}`}
                  onClick={() => setSelectedDayKey(dayKey)}
                >
                  <span className="citizen-week-letter">{AR_DAY_LETTERS[i]}</span>
                  <span className="citizen-week-num">{day.getDate()}</span>
                  {hasSchedule && <span className={`citizen-week-dot${isSelected ? " citizen-week-dot-selected" : ""}`} />}
                </button>
              );
            })}
          </div>

          <p className="citizen-schedule-day-heading">{selectedDayLabel}</p>

          <div className="citizen-schedule-list" role="tabpanel">
            {selectedDayTasks.length === 0 ? (
              <p className="citizen-pwa-empty-inline">لا توجد عمليات توزيع مجدولة في هذا اليوم</p>
            ) : (
              selectedDayTasks.map(task => {
                const date = new Date(task.scheduledAt);
                const isLive = task.status === "in_progress";
                const st = TASK_STATUS[task.status] ?? { ar: task.status, cls: "badge-gray" };
                return (
                  <div key={task.id} className={`citizen-schedule-row${isLive ? " citizen-schedule-live" : ""}`}>
                    <span className="citizen-schedule-row-icon" aria-hidden>{scheduleIcon(task)}</span>
                    <div className="citizen-schedule-row-copy">
                      <strong>{taskPartiesLabel(task)}</strong>
                      <span>
                        {Number(task.quantityLiters).toLocaleString()} لتر
                        {" · "}
                        {date.toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                        {task.notes ? ` · ${task.notes}` : ""}
                      </span>
                    </div>
                    <span className={`badge ${st.cls}`}>{st.ar}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="citizen-week-legend">
            <span><i className="dot dot-green" /> يوم فيه توزيع</span>
            <span><i className="dot dot-blue" /> اليوم المحدد</span>
            <span><i className="dot dot-gray" /> اضغط يوماً لعرض المزودين</span>
          </div>
        </div>
      </section>

      <section className="citizen-pwa-section citizen-home-market">
        <div className="citizen-pwa-section-head">
          <Link to="/citizen/market" className="citizen-pwa-link">عرض الكل</Link>
          <h3>طلب مياه تجاري (مدفوع عاجل)</h3>
        </div>

        <div className="citizen-market-preview">
          <div className="citizen-market-preview-visual" aria-hidden>
            <CitizenNavIcon name="request" />
          </div>
          <div className="citizen-market-preview-copy">
            <strong>محطة مياه غزة المركزية</strong>
            <span>سعة: 5000 لتر</span>
          </div>
          <div className="citizen-market-preview-action">
            <span className="citizen-market-price">$5.00</span>
            <Link to="/citizen/market/request" className="btn btn-primary btn-sm">ابدأ الطلب</Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
