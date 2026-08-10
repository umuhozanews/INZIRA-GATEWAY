import { NavLink } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  Activity,
  FileText,
  TrendingUp,
  BookOpen,
  BarChart3,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import Logomark from "./Logomark";
import OfflineBadge from "./OfflineBadge";

const NAV_ITEMS = [
  { to: "/", key: "nav_home", icon: Home, end: true },
  { to: "/sell", key: "nav_sell", icon: ShoppingCart },
  { to: "/stock", key: "nav_stock", icon: Package },
  { to: "/expenses", key: "nav_expenses", icon: Wallet },
  { to: "/invoices", key: "nav_invoices", icon: FileText },
  { to: "/pnl", key: "nav_pnl", icon: TrendingUp },
  { to: "/books", key: "nav_books", icon: BookOpen },
  { to: "/reports", key: "nav_reports", icon: BarChart3 },
  { to: "/suppliers", key: "nav_suppliers", icon: Users },
  { to: "/health-score", key: "health_score", icon: Activity },
  { to: "/settings", key: "nav_settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useLang();

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-line bg-card p-5 shrink-0 select-none shadow-sm h-screen overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line/60">
          <div className="flex items-center gap-3">
            <Logomark size={36} />
            <div>
              <h1 className="font-heading text-lg font-extrabold text-ink leading-tight">
                DataBridge
              </h1>
              <p className="text-[10.5px] font-semibold text-muted tracking-wide">
                INZIRA INSIGHTS
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <span className="px-3 text-[10.5px] font-bold tracking-wider text-muted uppercase">
            Menu
          </span>
          {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink hover:bg-paper hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      className={isActive ? "text-white" : "text-muted group-hover:text-primary"}
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    <span>{t(key)}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-white/80" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-line mt-4">
        {/* Language & Network Status */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[11px] font-bold text-ink hover:bg-line/40 transition"
          >
            <Globe size={13} className="text-primary" />
            <span>{lang.toUpperCase()}</span>
          </button>
          <OfflineBadge />
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between rounded-xl bg-paper p-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-xlt font-heading text-xs font-extrabold text-primary">
              {(user?.name || "Shop")[0].toUpperCase()}
            </div>
            <div className="truncate">
              <div className="truncate text-xs font-bold text-ink">{user?.name || "My Shop"}</div>
              <div className="truncate text-[10.5px] text-muted">{user?.email || "Shopkeeper"}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title={t("logout")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-lt hover:text-danger transition"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
