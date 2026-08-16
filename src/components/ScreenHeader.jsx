import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Sun, Moon } from "lucide-react";
import OfflineBadge from "./OfflineBadge";
import NotificationDrawer from "./NotificationDrawer";
import { useLang } from "../lib/i18n.jsx";
import { useTheme } from "../context/ThemeContext";
import Logomark from "./Logomark";

export default function ScreenHeader({ title, back, right }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);

  const showBack = back !== undefined ? back : location.pathname !== "/";

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-paper/90 px-4 pb-3 pt-3 backdrop-blur-xl select-none font-body transition-colors duration-200"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label={t("back")}
              title={t("back")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-line text-ink hover:border-primary/50 hover:bg-card-hover transition-all duration-150 active:scale-90 cursor-pointer shadow-sm shrink-0"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
          ) : (
            <div className="shrink-0">
              <Logomark size={32} className="shadow-sm border border-line rounded-xl" />
            </div>
          )}
          <span className="font-heading text-[18px] font-black text-ink tracking-tight truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {right}

          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted hover:text-primary hover:border-primary/40 active:scale-90 transition-all duration-150 cursor-pointer shadow-sm"
            aria-label="Toggle Theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun size={17} className="text-amber-400" strokeWidth={2.2} />
            ) : (
              <Moon size={17} className="text-charcoal-700" strokeWidth={2.2} />
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink hover:text-primary hover:border-primary/40 active:scale-90 transition-all duration-150 cursor-pointer shadow-sm relative"
            aria-label={t("notifications")}
            title={t("notifications")}
          >
            <Bell size={17} strokeWidth={2} />
          </button>

          <OfflineBadge />
        </div>
      </header>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
