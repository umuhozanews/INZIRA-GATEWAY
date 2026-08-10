import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings as SettingsIcon, Menu } from "lucide-react";
import OfflineBadge from "./OfflineBadge";
import SystemDrawer from "./SystemDrawer";

// Compact per-screen header with back button, right-side slot, offline badge, and responsive settings drawer menu.
export default function ScreenHeader({ title, back, right }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-paper/95 px-4 pb-3 pt-3 backdrop-blur shadow-xs"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          {back && (
            <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-1 p-1 text-ink hover:text-primary">
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="font-heading text-[18px] font-bold text-ink">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {right}
          <OfflineBadge />

          {/* Settings & System Menu Button right next to WiFi / Offline Badge */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-card border border-line text-muted hover:text-primary hover:border-primary shadow-xs transition-all active:scale-95"
            aria-label="Settings & Reports Menu"
            title="Settings & Reports Menu"
          >
            <SettingsIcon size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Interactive Responsive Slide-Over System Menu Drawer */}
      <SystemDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
