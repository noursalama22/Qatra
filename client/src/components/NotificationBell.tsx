import { useState, useEffect, useRef } from "react";

type Notification = {
  id: string;
  type: "new_contract" | "driver_accepted";
  title: string;
  message: string;
  entityId: string;
  entityPage: string;
  priority: string;
  createdAt: string;
};

const DEMO_PROVIDER_ID = "seed-p1";
const SEEN_KEY = "qatra_seen_notifications";

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]")); }
  catch { return new Set(); }
}

function markSeen(ids: string[]) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

const PRIORITY_COLOR: Record<string, string> = {
  vip: "#0ea5e9", high: "#f59e0b", normal: "#6b8aa0",
};

const TYPE_ICON: Record<string, string> = {
  new_contract: "📋",
  driver_accepted: "✅",
};

export default function NotificationBell({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);
  const ref = useRef<HTMLDivElement>(null);

  const load = () =>
    fetch(`/api/provider-notifications?providerId=${DEMO_PROVIDER_ID}`)
      .then(r => r.json())
      .then(d => setNotifications(d.data ?? []))
      .catch(() => {});

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  const unread = notifications.filter(n => !seenIds.has(n.id)).length;

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    markSeen(ids);
    setSeenIds(new Set(ids));
  };

  const handleClick = (n: Notification) => {
    markSeen([n.id]);
    setSeenIds(prev => new Set([...prev, n.id]));
    setOpen(false);
    onNavigate(n.entityPage);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        style={{ position: "relative", background: "none", border: "1px solid #d8eef8", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", background: open ? "#f0f9ff" : "white" } as any}
        title="الإشعارات"
      >
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          style={{ position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)", width: 360, background: "white", border: "1px solid #d8eef8", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,60,100,0.14)", zIndex: 300, overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f9ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#12384f" }}>الإشعارات</span>
              {unread > 0 && <span style={{ marginRight: 8, background: "#fee2e2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{unread} جديد</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#0284c7", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#8eb5c8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = !seenIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "flex-start", gap: 12, border: "none", borderBottom: "1px solid #f8fbff", background: isUnread ? "#f0f9ff" : "white", cursor: "pointer", textAlign: "right" }}
                  >
                    {/* Icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: n.type === "new_contract" ? "#fef3c7" : "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {TYPE_ICON[n.type]}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#12384f" }}>{n.title}</span>
                        {n.type === "new_contract" && n.priority !== "normal" && (
                          <span style={{ background: PRIORITY_COLOR[n.priority], color: "white", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                            {n.priority === "vip" ? "VIP" : "عالية"}
                          </span>
                        )}
                        {isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", marginRight: "auto" }} />}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b8aa0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: "#aac6d8", marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f9ff", textAlign: "center" }}>
              <button
                onClick={() => { setOpen(false); onNavigate("contracts"); }}
                style={{ background: "none", border: "none", color: "#0284c7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                عرض كل العقود المعلّقة ←
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
