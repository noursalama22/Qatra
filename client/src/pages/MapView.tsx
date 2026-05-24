import { useState } from "react";
import { useLocation } from "react-router-dom";
import NgoDistributionMap from "../components/ngo/NgoDistributionMap";
import OperationalMapView from "./OperationalMapView";

export default function MapView() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/ngo/map")) {
    return <NgoMapPage />;
  }

  return <OperationalMapView />;
}

function NgoMapPage() {
  const [wallet, setWallet] = useState({ available: 10000, escrow: 0 });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="map-page map-page--ngo" dir="rtl">
      {toast && <div className="action-toast">{toast}</div>}
      <NgoDistributionMap
        onToast={showToast}
        wallet={wallet}
        setWallet={setWallet}
        layout="fullscreen"
      />
    </div>
  );
}
