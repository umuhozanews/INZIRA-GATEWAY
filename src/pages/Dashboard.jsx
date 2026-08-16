import { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  ChevronRight,
  ShoppingCart,
  Wallet,
  Package,
  Activity,
  Globe,
  Sun,
  Moon,
  ArrowUpRight,
  Plus,
  LogOut,
} from "lucide-react";
import api from "../lib/api";
import { useAuth, checkIsAdmin } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { useTheme } from "../context/ThemeContext";
import { rwfCompact, rwf, clockTime } from "../lib/format";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import NotificationDrawer from "../components/NotificationDrawer";
import { useData } from "../context/DataContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, toggle: toggleLang } = useLang();
  const { isDark, toggleTheme } = useTheme();

  if (isAdmin || checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  const dataCtx = useData() || {};
  const sales = Array.isArray(dataCtx.sales) ? dataCtx.sales : [];
  const expenses = Array.isArray(dataCtx.expenses) ? dataCtx.expenses : [];
  const recent = sales.slice(0, 5);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [shopName, setShopName] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, settingsRes, actRes] = await Promise.allSettled([
        api.get("/dashboard/stats"),
        api.get("/settings"),
        api.get("/dashboard/activity-feed"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (settingsRes.status === "fulfilled")
        setShopName(settingsRes.value.data?.settings?.shop_name || "");
      if (actRes.status === "fulfilled" && Array.isArray(actRes.value.data)) {
        setActivities(actRes.value.data);
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleActivityClick = (act) => {
    const type = act.entity_type || (
      act.action?.includes("SALE") ? "sales" :
      act.action?.includes("EXPENSE") ? "expenses" :
      act.action?.includes("STOCK") ? "stock_items" :
      act.action?.includes("INVOICE") ? "invoices" :
      act.action?.includes("WORKER") || act.action?.includes("USER") ? "users" : "sales"
    );

    switch (type) {
      case "sales":
      case "sale":
        navigate("/invoices");
        break;
      case "expenses":
      case "expense":
        navigate("/expenses");
        break;
      case "stock_items":
      case "stock":
        navigate("/stock");
        break;
      case "invoices":
      case "invoice":
        navigate("/invoices");
        break;
      case "users":
      case "team":
        navigate("/settings");
        break;
      default:
        navigate("/sell");
        break;
    }
  };

  if (loading) return <Loading label={t("loading")} />;

  const s = stats || {};
  const todayRevenue = sales.reduce((sum, sa) => sum + (Number(sa.total_amount) || 0), 0);
  const todayExpensesSum = expenses.reduce((sum, ex) => sum + (Number(ex.amount_rwf) || 0), 0);
  const todayExpenses = todayExpensesSum;
  const cash = todayRevenue - todayExpenses;

  const hasData = sales.length > 0;
  const lowAlert = (s.alerts || []).find((a) => a.type === "low_stock");
  const salesChange = hasData ? (s.salesChangePct ?? null) : null;

  const quickActions = [
    { label: t("record_sale"), icon: ShoppingCart, to: "/sell", primary: true },
    { label: t("add_stock"), icon: Package, to: "/stock?new=1", primary: false },
    { label: t("add_expense"), icon: Wallet, to: "/expenses?new=1", primary: false },
  ];

  return (
    <div className="p-3.5 sm:p-5 md:p-8 space-y-4 max-w-5xl mx-auto font-body pb-24 md:pb-8 kinetic-fade-in">
      {/* Top Header: Shop Title & Fast Utility Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <span className="font-heading text-[10.5px] font-bold text-muted uppercase tracking-widest block">
            {t("hello")} &bull; POS Terminal
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-black text-ink leading-tight tracking-tight truncate">
            {user?.shop_name || shopName || user?.name || "My Store"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 active:scale-95 transition-all duration-150 cursor-pointer text-xs font-heading font-extrabold text-ink shadow-sm"
            title="Switch Language (EN / RW)"
          >
            <Globe size={14} className="text-primary shrink-0" />
            <span>{lang === "en" ? "EN" : "RW"}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 active:scale-95 transition-all duration-150 cursor-pointer shadow-sm text-muted hover:text-primary"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun size={16} className="text-primary" />
            ) : (
              <Moon size={16} className="text-charcoal-700" />
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 active:scale-95 transition-all duration-150 cursor-pointer shadow-sm text-ink"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={16} />
            {(s.alerts?.length || 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow-orange-sm">
                {s.alerts.length}
              </span>
            )}
          </button>

          {/* Logout Button with Confirmation Guard */}
          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 hover:text-primary text-muted active:scale-95 transition-all duration-150 cursor-pointer shadow-sm"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Main Kinetic Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Column (Key Financial Metrics & Actions) */}
        <div className="md:col-span-7 space-y-4">
          {/* Financial Performance Stat Cards (High Contrast, Bold, Authoritative) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <StatCard
              label={t("todays_sales")}
              value={rwfCompact(todayRevenue)}
              sub={hasData && salesChange != null ? `+${salesChange}%` : undefined}
              tone={hasData ? "up" : undefined}
              icon={ShoppingCart}
              onClick={() => navigate("/sell")}
            />
            <StatCard
              label={t("todays_expenses")}
              value={rwfCompact(todayExpenses)}
              icon={Wallet}
              onClick={() => navigate("/expenses")}
            />
            <StatCard
              label={t("cash_in_till")}
              value={rwfCompact(cash)}
              icon={Activity}
              onClick={() => navigate("/sell")}
            />
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <h2 className="font-heading text-[10.5px] font-extrabold text-muted uppercase tracking-wider mb-2.5">
              {t("quick_actions")}
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {quickActions.map(({ label, icon: Icon, to, primary }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.97] group ${
                    primary
                      ? "bg-primary text-white border-primary shadow-orange-sm hover:bg-primary-hover"
                      : "bg-card-hover border-line hover:border-primary/40 text-ink"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-1.5 transition ${
                    primary ? "bg-white/20 text-white" : "bg-card border border-line text-muted group-hover:text-primary group-hover:border-primary/40"
                  }`}>
                    <Icon size={17} strokeWidth={2.2} />
                  </div>
                  <span className={`text-[11px] font-heading font-extrabold leading-snug truncate w-full ${
                    primary ? "text-white" : "text-ink group-hover:text-primary"
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Alerts & Activity Stream) */}
        <div className="md:col-span-5 space-y-4">
          {/* Low Stock Alert Pill */}
          {lowAlert && (
            <button
              onClick={() => navigate("/stock")}
              className="w-full flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-3.5 text-left hover:border-primary/40 transition cursor-pointer active:scale-[0.98]"
            >
              <AlertTriangle size={18} className="text-primary shrink-0" />
              <span className="flex-1 text-xs font-heading font-bold text-ink truncate">{lowAlert.message}</span>
              <ChevronRight size={15} className="text-primary shrink-0" />
            </button>
          )}

          {/* Real-time Activity Feed */}
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-[10.5px] font-extrabold text-muted uppercase tracking-wider">
                {t("recent_activity")}
              </h2>
              <button
                onClick={() => navigate("/invoices")}
                className="text-[11px] font-heading font-extrabold text-primary hover:underline cursor-pointer"
              >
                View History
              </button>
            </div>

            <div className="space-y-2">
              {(!activities || activities.length === 0) && (!recent || recent.length === 0) ? (
                <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted font-medium">
                  No activity recorded yet. Tap <span className="text-primary font-bold">Record Sale</span> to start.
                </div>
              ) : activities && activities.length > 0 ? (
                activities.slice(0, 6).map((act) => {
                  const isSale = act.entity_type === "sales" || act.action?.includes("SALE");
                  const isExp = act.entity_type === "expenses" || act.action?.includes("EXPENSE");
                  const isStock = act.entity_type === "stock_items" || act.action?.includes("STOCK");
                  const isInv = act.entity_type === "invoices" || act.action?.includes("INVOICE");

                  let label = act.action?.replace(/_/g, " ") || "Activity";
                  let amountStr = null;

                  if (isSale) {
                    label = act.details?.invoice_number || (act.details?.total_amount ? `Sale ${rwf(act.details.total_amount)} RWF` : "Sale Processed");
                    if (act.details?.total_amount) {
                      amountStr = `+${rwf(act.details.total_amount)} RWF`;
                    }
                  } else if (isExp) {
                    label = act.details?.category || act.details?.description || "Expense Logged";
                    if (act.details?.amount) {
                      amountStr = `-${rwf(act.details.amount)} RWF`;
                    }
                  } else if (isStock) {
                    label = act.details?.name || act.details?.item_name ? `Stock: ${act.details.name || act.details.item_name}` : "Stock Adjusted";
                  } else if (isInv) {
                    label = act.details?.invoice_number ? `Invoice: ${act.details.invoice_number}` : "Invoice Generated";
                  }

                  return (
                    <button
                      key={act.id}
                      onClick={() => handleActivityClick(act)}
                      className="w-full flex items-center justify-between rounded-xl border border-line bg-card-hover/60 p-2.5 sm:p-3 text-left hover:border-primary/40 hover:bg-card-hover transition cursor-pointer active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 border border-line bg-card-hover text-primary transition"
                        >
                          {isSale ? (
                            <ShoppingCart size={14} />
                          ) : isExp ? (
                            <Wallet size={14} />
                          ) : isStock ? (
                            <Package size={14} />
                          ) : (
                            <Activity size={14} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-heading font-bold text-ink group-hover:text-primary transition truncate capitalize">
                            {label}
                          </div>
                          <div className="text-[10px] font-semibold text-muted flex items-center gap-1.5 mt-0.5">
                            <span>{clockTime(act.created_at)}</span>
                            {act.user_name && (
                              <span className="text-muted font-bold truncate">
                                &bull; {act.user_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {amountStr && (
                          <span className="text-xs font-heading font-black tabnum text-ink">
                            {amountStr}
                          </span>
                        )}
                        <ChevronRight size={14} className="text-muted group-hover:text-primary transition group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })
              ) : (
                recent.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => navigate("/invoices")}
                    className="w-full flex items-center justify-between rounded-xl border border-line bg-card-hover/60 p-2.5 text-left hover:border-primary/40 hover:bg-card-hover transition cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <ShoppingCart size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-heading font-bold text-ink group-hover:text-primary transition">
                          {sale.customer_name || t("record_sale")}
                          {sale.items_count ? ` · ${sale.items_count} ${t("items")}` : ""}
                        </div>
                        <div className="text-[10px] font-semibold text-muted">{clockTime(sale.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-heading font-black tabnum text-ink">
                        {rwf(sale.total_amount)} RWF
                      </span>
                      <ChevronRight size={14} className="text-muted group-hover:text-primary transition" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        stats={stats}
      />

      {/* Logout Confirmation Prompt Modal */}
      {confirmLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setConfirmLogoutOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-card p-5 shadow-2xl space-y-4 kinetic-fade-in font-body">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <LogOut size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-heading text-base font-black text-ink tracking-tight">Log out?</h3>
                <p className="text-xs text-muted mt-0.5">Are you sure you want to sign out of your account?</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 font-heading">
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-card-hover text-xs font-bold text-ink hover:border-primary/40 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmLogoutOpen(false);
                  await logout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-xs font-black text-white hover:bg-primary-hover transition active:scale-95 shadow-orange-sm cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
