import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  Grid,
  FileText,
  TrendingUp,
  BookOpen,
  BarChart3,
  Settings,
  Activity,
  X
} from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import Sheet from "./Sheet";

const PRIMARY_ITEMS = [
  { to: "/", key: "nav_home", icon: Home, end: true },
  { to: "/sell", key: "nav_sell", icon: ShoppingCart },
  { to: "/stock", key: "nav_stock", icon: Package },
  { to: "/expenses", key: "nav_expenses", icon: Wallet },
];

const MORE_ITEMS = [
  { to: "/invoices", label: "Invoices", icon: FileText, desc: "Customer factures & billing" },
  { to: "/pnl", label: "Profit & Loss", icon: TrendingUp, desc: "Executive financial P&L" },
  { to: "/books", label: "Financial Books", icon: BookOpen, desc: "Journal, Ledger & Trial balance" },
  { to: "/reports", label: "Reports & Tax", icon: BarChart3, desc: "Sales, stock & EBM tax reports" },
  { to: "/suppliers", label: "Suppliers", icon: Users, desc: "Supplier contacts & orders" },
  { to: "/health-score", label: "Business Health", icon: Activity, desc: "SACCO credit score readiness" },
  { to: "/settings", label: "Settings", icon: Settings, desc: "Profile & exchange rates" },
];

export default function BottomNav() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky bottom-0 z-20 flex items-stretch border-t border-line bg-card shadow-nav"
        style={{ height: 66, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY_ITEMS.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={isActive ? "text-primary" : "text-muted"}
                />
                <span
                  className={`text-[9.5px] font-semibold ${
                    isActive ? "text-primary" : "text-muted"
                  }`}
                >
                  {t(key)}
                </span>
                {isActive && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
              </>
            )}
          </NavLink>
        ))}

        {/* More Apps Quick Button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted hover:text-primary transition cursor-pointer"
        >
          <Grid size={20} strokeWidth={1.8} />
          <span className="text-[9.5px] font-semibold">More</span>
        </button>
      </nav>

      {/* More Modules Sheet */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Platform Modules & Financials">
        <div className="grid grid-cols-1 gap-2.5 pt-2 pb-4">
          {MORE_ITEMS.map(({ to, label, icon: Icon, desc }) => (
            <button
              key={to}
              onClick={() => {
                setMoreOpen(false);
                navigate(to);
              }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-line bg-paper hover:bg-card hover:border-primary/50 hover:shadow-sm active:scale-95 transition cursor-pointer text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-xlt text-primary group-hover:scale-105 transition">
                <Icon size={20} />
              </div>
              <div className="flex-1 truncate">
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition">{label}</h4>
                <p className="text-[11px] text-muted truncate">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
