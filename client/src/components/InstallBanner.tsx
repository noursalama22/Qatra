import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "qatra_install_dismissed_until";

function isDismissed() {
  const until = localStorage.getItem(DISMISSED_KEY);
  return until ? Date.now() < Number(until) : false;
}

function dismiss(days = 7) {
  localStorage.setItem(DISMISSED_KEY, String(Date.now() + days * 86400000));
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setShowAndroid(false); setShowIOS(false); });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setShowAndroid(false); setDeferredPrompt(null); }
  };

  const handleDismiss = () => {
    dismiss(7);
    setShowAndroid(false);
    setShowIOS(false);
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        bottom: 72,
        right: 12,
        left: 12,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0369a1, #0891b2)",
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(3,105,161,0.35)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        color: "#fff",
        fontFamily: "Tajawal, sans-serif",
        animation: "dpwa-slide-up 0.3s ease",
      }}
    >
      <div style={{ fontSize: 32, flexShrink: 0, lineHeight: 1 }}>💧</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
          ثبّت تطبيق قطرة
        </div>

        {showAndroid && (
          <>
            <div style={{ fontSize: 12, opacity: 0.88, marginBottom: 10, lineHeight: 1.5 }}>
              أضف التطبيق لشاشتك الرئيسية للوصول السريع دون متصفح
            </div>
            <button
              onClick={handleInstall}
              style={{
                background: "#fff",
                color: "#0369a1",
                border: "none",
                borderRadius: 20,
                padding: "7px 20px",
                fontWeight: 800,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              📲 تثبيت الآن
            </button>
          </>
        )}

        {showIOS && (
          <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.6 }}>
            اضغط على{" "}
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>
              ⬆️ مشاركة
            </span>
            {" "}ثم اختر{" "}
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>
              إضافة للشاشة الرئيسية
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: "rgba(255,255,255,0.18)",
          border: "none",
          color: "#fff",
          borderRadius: 20,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          fontSize: 16,
          fontWeight: 700,
        }}
        aria-label="إغلاق"
      >
        ✕
      </button>
    </div>
  );
}
