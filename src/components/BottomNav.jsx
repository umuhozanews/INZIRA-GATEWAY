import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Wallet,
  Grid,
  FileText,
  TrendingUp,
  BookOpen,
  BarChart3,
  Users,
  Activity,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import { useAuth } from "../context/AuthContext";
import Sheet from "./Sheet";

const MERCHANT_PRIMARY_ITEMS = [
  { to: "/", key: "nav_home", icon: Home, end: true },
  { to: "/sell", key: "nav_sell", icon: ShoppingCart },
  { to: "/stock", key: "nav_stock", icon: Package },
  { to: "/expenses", key: "nav_expenses", icon: Wallet },
];

const ADMIN_PRIMARY_ITEMS = [
  { to: "/", label: "Overview", icon: ShieldCheck, end: true },
  { to: "/admin", label: "All SMEs", icon: Users },
  { to: "/pnl", label: "Financials", icon: TrendingUp },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const BASE_MORE_ITEMS = [
  { to: "/invoices", key: "nav_invoices", label: "Invoices", icon: FileText, descKey: "invoices_desc", desc: "Customer invoices & billing" },
  { to: "/pnl", key: "nav_pnl", label: "Profit & Loss", icon: TrendingUp, descKey: "pnl_desc", desc: "Executive financial P&L" },
  { to: "/books", key: "nav_books", label: "Financial Books", icon: BookOpen, descKey: "books_desc", desc: "Journal, Ledger & Trial balance" },
  { to: "/reports", key: "nav_reports", label: "Reports & Tax", icon: BarChart3, descKey: "reports_desc", desc: "Sales, stock & EBM tax reports" },
  { to: "/suppliers", key: "nav_suppliers", label: "Suppliers", icon: Users, descKey: "suppliers_desc", desc: "Supplier contacts & orders" },
  { to: "/health-score", key: "health_score", label: "Business Health", icon: Activity, descKey: "health_desc", desc: "SACCO credit score readiness" },
  { to: "/settings", key: "nav_settings", label: "Settings", icon: Settings, descKey: "settings_desc", desc: "Profile, theme & preferences" },
];

const ADMIN_MORE_ITEMS = [
  { to: "/books", label: "Financial Books & Ledger", icon: BookOpen, desc: "General Ledger & Trial balance" },
  { to: "/health-score", label: "SACCO & Scoring Readiness", icon: Activity, desc: "Credit scoring & portfolio health" },
  { to: "/settings", label: "Platform Settings & Backup", icon: Settings, desc: "Database backup & global settings" },
];

export default function BottomNav() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isAdmin =
    user?.role === "Admin" ||
    user?.role === "pulse_admin" ||
    user?.role === "admin" ||
    (user?.email && user.email.toLowerCase().includes("creator"));

  const primaryItems = isAdmin ? ADMIN_PRIMARY_ITEMS : MERCHANT_PRIMARY_ITEMS;
  const moreItems = isAdmin ? ADMIN_MORE_ITEMS : BASE_MORE_ITEMS;

  return (
    <>
      <nav
        className="sticky bottom-0 z-30 flex items-center justify-around border-t border-line bg-card/95 backdrop-blur-xl shadow-nav select-none w-full font-body transition-colors duration-200"
        style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const label = item.key ? t(item.key) : item.label;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-1 flex-col items-center justify-center py-1 transition"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white shadow-orange-sm scale-105"
                        : "text-muted hover:text-ink hover:bg-card-hover"
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span
                    className={`text-[10px] font-heading font-extrabold tracking-tight transition-colors ${
                      isActive ? "text-primary font-black" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}

        {/* More Modules Button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center py-1 text-muted hover:text-ink transition cursor-pointer"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex h-8 w-12 items-center justify-center rounded-xl text-muted hover:bg-card-hover hover:text-ink transition">
              <Grid size={19} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-heading font-bold text-muted">{t("more")}</span>
          </div>
        </button>
      </nav>

      {/* More Modules Sheet */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t("modules_title")}>
        <div className="grid grid-cols-1 gap-2.5 pt-2 pb-6 font-body">
          {moreItems.map(({ to, key, label, icon: Icon, descKey, desc }) => {
            const itemLabel = key ? t(key) : label;
            const itemDesc = descKey ? t(descKey) : desc;

            return (
              <button
                key={to}
                onClick={() => {
                  setMoreOpen(false);
                  navigate(to);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 active:scale-[0.98] transition cursor-pointer text-left group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition shadow-sm">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="flex-1 truncate">
                  <h4 className="text-xs font-heading font-bold text-ink group-hover:text-primary transition">{itemLabel}</h4>
                  <p className="text-[11px] text-muted truncate mt-0.5">{itemDesc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
