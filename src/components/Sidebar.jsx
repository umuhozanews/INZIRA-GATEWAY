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
  ShieldCheck,
  Globe,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { useTheme } from "../context/ThemeContext";
import Logomark from "./Logomark";
import OfflineBadge from "./OfflineBadge";

const MERCHANT_NAV_ITEMS = [
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

const ADMIN_NAV_ITEMS = [
  { to: "/", label: "Platform Overview", icon: ShieldCheck, end: true },
  { to: "/admin", label: "All SME Merchants", icon: Users },
  { to: "/pnl", label: "Platform Financials", icon: TrendingUp },
  { to: "/books", label: "Financial Books & Ledger", icon: BookOpen },
  { to: "/reports", label: "Reports & Tax Compliance", icon: BarChart3 },
  { to: "/health-score", label: "SACCO Readiness", icon: Activity },
  { to: "/settings", label: "Platform Settings & Backup", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useLang();
  const { isDark, toggleTheme } = useTheme();

  const isAdmin =
    user?.role === "Admin" ||
    user?.role === "pulse_admin" ||
    user?.role === "admin" ||
    (user?.email && user.email.toLowerCase().includes("creator"));

  const navItems = isAdmin ? ADMIN_NAV_ITEMS : MERCHANT_NAV_ITEMS;

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-line bg-card p-5 shrink-0 select-none shadow-card h-screen overflow-y-auto font-body transition-colors duration-200">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <Logomark size={36} className="shadow-sm border border-line rounded-xl" />
            <div>
              <h1 className="font-heading text-lg font-black text-ink leading-tight tracking-tight">
                DataBridge
              </h1>
              <p className="text-[10px] font-heading font-extrabold text-primary tracking-wider uppercase">
                {isAdmin ? "Admin Control" : "Kinetic POS"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <span className="px-3 text-[10px] font-heading font-extrabold tracking-wider text-muted uppercase">
            {isAdmin ? "Admin Navigation" : "Navigation"}
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const label = item.key ? t(item.key) : item.label;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-white shadow-orange-sm font-extrabold"
                      : "text-muted hover:bg-card-hover hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-white"
                            : "text-muted group-hover:text-ink"
                        }
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                      <span>{label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight
                        size={14}
                        className="text-white/90"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-line mt-4">
        {/* Language & Theme & Network Status */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-card-hover px-2.5 py-1.5 text-[11px] font-heading font-bold text-ink hover:border-primary/40 transition cursor-pointer"
            >
              <Globe size={13} className="text-primary" />
              <span>{lang.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-7 w-7 rounded-xl border border-line bg-card-hover text-muted hover:text-primary hover:border-primary/40 transition cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun size={13} className="text-amber-400" />
              ) : (
                <Moon size={13} className="text-charcoal-700" />
              )}
            </button>
          </div>

          <OfflineBadge />
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between rounded-xl bg-card-hover border border-line p-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-heading text-xs font-black">
              {(user?.name || "S")[0].toUpperCase()}
            </div>
            <div className="truncate">
              <div className="truncate text-xs font-heading font-bold text-ink">{user?.name || "My Store"}</div>
              <div className="truncate text-[10.5px] text-muted">{user?.email || "Staff"}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title={t("logout")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
