import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import OfflineBadge from "./OfflineBadge";
import NotificationDrawer from "./NotificationDrawer";

// Compact per-screen header with smart back navigation and right-side slot.
export default function ScreenHeader({ title, back, right }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  // Show back arrow automatically if on sub-pages (not home) or explicitly passed
  const showBack = back !== undefined ? back : location.pathname !== "/";

  const handleBack = () => {
    // If user opened page directly or refreshed, window.history.state.idx is 0
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-paper/95 px-4 pb-3 pt-3 backdrop-blur border-b border-line/40 select-none"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Back"
              className="-ml-1 p-1.5 hover:bg-line/50 rounded-xl transition text-ink active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="font-heading text-[18px] font-bold text-ink">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={() => setNotifOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card shadow-sm hover:bg-paper active:scale-95 transition cursor-pointer"
            aria-label="Alerts & Notifications"
          >
            <Bell size={17} className="text-ink" />
          </button>
          <OfflineBadge />
        </div>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
