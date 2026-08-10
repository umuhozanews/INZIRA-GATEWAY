import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Package, Wallet, FileText, Users } from "lucide-react";
import { useLang } from "../lib/i18n.jsx";

const ITEMS = [
  { to: "/", key: "nav_home", label: "Home", icon: Home, end: true },
  { to: "/sell", key: "nav_sell", label: "Sales", icon: ShoppingCart },
  { to: "/stock", key: "nav_stock", label: "Stock", icon: Package },
  { to: "/invoices", key: "nav_invoices", label: "Invoices", icon: FileText },
  { to: "/expenses", key: "nav_expenses", label: "Expenses", icon: Wallet },
  { to: "/suppliers", key: "nav_suppliers", label: "Suppliers", icon: Users },
];

export default function BottomNav() {
  const { t } = useLang();
  return (
    <nav
      className="sticky bottom-0 z-20 flex items-stretch border-t border-line bg-card shadow-nav"
      style={{ height: 66, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {ITEMS.map(({ to, key, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex flex-1 flex-col items-center justify-center gap-0.5"
        >
          {({ isActive }) => (
            <>
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.8}
                className={isActive ? "text-primary" : "text-muted"}
              />
              <span
                className={`text-[9px] font-bold ${
                  isActive ? "text-primary" : "text-muted"
                }`}
              >
                {t(key) !== key ? t(key) : label}
              </span>
              {isActive && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
