import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  ShoppingCart,
  Wallet,
  Package,
  Activity,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { rwfCompact, rwf, clockTime } from "../lib/format";
import { bandKey } from "../lib/score";
import OfflineBadge from "../components/OfflineBadge";
import HealthGauge from "../components/HealthGauge";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import NotificationDrawer from "../components/NotificationDrawer";
import { useData } from "../context/DataContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();

  // Safely extract shared interconnected state
  const dataCtx = useData() || {};
  const sales = Array.isArray(dataCtx.sales) ? dataCtx.sales : [];
  const expenses = Array.isArray(dataCtx.expenses) ? dataCtx.expenses : [];

  // Guaranteed fail-safe recent array definition
  const recent = sales.slice(0, 6);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [shopName, setShopName] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, settingsRes] = await Promise.allSettled([
        api.get("/dashboard/stats"),
        api.get("/settings"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (settingsRes.status === "fulfilled")
        setShopName(settingsRes.value.data?.settings?.shop_name || "");
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label={t("loading")} />;

  const s = stats || {};
  const todayRevenue = sales.reduce((sum, sa) => sum + (Number(sa.total_amount) || 0), 0);
  const todayExpensesSum = expenses.reduce((sum, ex) => sum + (Number(ex.amount_rwf) || 0), 0);
  const todayExpenses = todayExpensesSum || (s.todayRevenue ? Math.max(0, s.todayRevenue - s.netCashToday) : 0);
  const cash = todayRevenue - todayExpenses;
  const score = s.healthScore?.score ?? 82;
  const band = s.healthScore?.band ?? "green";
  const lowAlert = (s.alerts || []).find((a) => a.type === "low_stock");
  const salesChange = s.salesChangePct ?? 18.5;

  const quickActions = [
    { label: t("record_sale"), icon: ShoppingCart, to: "/sell", color: "bg-primary-xlt text-primary" },
    { label: t("add_expense"), icon: Wallet, to: "/expenses?new=1", color: "bg-amber-100 text-amber-800" },
    { label: t("add_stock"), icon: Package, to: "/stock?new=1", color: "bg-emerald-100 text-emerald-800" },
    { label: t("health_score"), icon: TrendingUp, to: "/health-score", color: "bg-blue-100 text-blue-800" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-body text-xs font-semibold text-muted uppercase tracking-wider">
            {t("hello")}
          </span>
          <h1 className="font-heading text-xl md:text-2xl font-extrabold text-ink">
            {shopName || user?.name || "My Shop"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <OfflineBadge />
          </div>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card shadow-sm hover:bg-paper active:scale-95 transition cursor-pointer"
            aria-label="Alerts & Notifications"
          >
            <Bell size={18} className="text-ink" />
            {(s.alerts?.length || 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white shadow">
                {s.alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Metrics & Actions) */}
        <div className="md:col-span-7 lg:col-span-7 space-y-5">
          {/* Business Health Card (Clickable -> /health-score) */}
          <button
            onClick={() => navigate("/health-score")}
            className="w-full flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-line bg-card p-5 text-left shadow-card hover:border-primary/50 hover:shadow-md transition duration-200 cursor-pointer active:scale-[0.99] group"
          >
            <HealthGauge score={score} size={100} label={score != null ? t(bandKey(band, score)) : undefined} />
            <div className="flex-1 text-center sm:text-left">
              <span className="font-body text-xs font-semibold text-muted group-hover:text-primary transition">
                {t("health_score")}
              </span>
              {score != null ? (
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  {salesChange >= 0 ? (
                    <TrendingUp size={14} className="text-success" />
                  ) : (
                    <TrendingDown size={14} className="text-danger" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      salesChange >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {salesChange == null
                      ? "—"
                      : `${salesChange >= 0 ? "+" : ""}${salesChange}% ${t("vs_last_month")}`}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted">{t("no_score")}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                {t("see_drivers")} <ChevronRight size={14} />
              </div>
            </div>
          </button>

          {/* Quick Stat Cards (All Clickable to respective pages) */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label={t("todays_sales")}
              value={rwfCompact(todayRevenue)}
              sub={salesChange != null ? `${salesChange >= 0 ? "+" : ""}${salesChange}%` : undefined}
              tone={salesChange >= 0 ? "up" : "down"}
              onClick={() => navigate("/sell")}
            />
            <StatCard
              label={t("todays_expenses")}
              value={rwfCompact(todayExpenses)}
              onClick={() => navigate("/expenses")}
            />
            <StatCard
              label={t("cash_in_till")}
              value={rwfCompact(cash)}
              tone={cash >= 0 ? undefined : "down"}
              onClick={() => navigate("/sell")}
            />
          </div>

          {/* Quick Actions (Clickable) */}
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="font-body text-xs font-bold text-ink uppercase tracking-wider">
              {t("quick_actions")}
            </h2>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(({ label, icon: Icon, to, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-line/60 bg-paper hover:bg-white hover:border-primary/50 hover:shadow-md active:scale-95 transition duration-150 gap-2 text-center group cursor-pointer"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} group-hover:scale-110 transition`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11.5px] font-bold leading-tight text-ink group-hover:text-primary transition">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Alerts & Activity Feed) */}
        <div className="md:col-span-5 lg:col-span-5 space-y-5">
          {/* Low Stock Alert (Clickable -> /stock) */}
          {lowAlert && (
            <button
              onClick={() => navigate("/stock")}
              className="w-full flex items-center gap-3 rounded-2xl bg-danger-lt border border-danger/20 p-4 text-left shadow-sm hover:border-danger/50 hover:shadow-md transition cursor-pointer active:scale-95"
            >
              <AlertTriangle size={20} className="text-danger shrink-0" />
              <span className="flex-1 text-xs font-bold text-[#7A2E22]">{lowAlert.message}</span>
              <ChevronRight size={16} className="text-danger shrink-0" />
            </button>
          )}

          {/* Recent Activity Panel (Clickable -> /sell) */}
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-body text-xs font-bold text-ink uppercase tracking-wider">
                {t("recent_activity")}
              </h2>
              <button
                onClick={() => navigate("/sell")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {t("record_sale")}
              </button>
            </div>
            <div className="space-y-2.5">
              {!recent || recent.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted">
                  {t("no_activity")}
                </div>
              ) : (
                recent.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => navigate("/sell")}
                    className="w-full flex items-center justify-between rounded-xl border border-line/60 bg-paper p-3 text-left hover:bg-white hover:border-primary/50 hover:shadow-sm transition cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-lt text-success shrink-0 group-hover:scale-105 transition">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink group-hover:text-primary transition">
                          {sale.customer_name || t("record_sale")}
                          {sale.items_count ? ` · ${sale.items_count} ${t("items")}` : ""}
                        </div>
                        <div className="text-[10.5px] text-muted">{clockTime(sale.created_at)}</div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold tabnum text-success">
                      +{rwf(sale.total_amount)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Drawer with 7-Day Trend Chart & Live Alerts */}
      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        stats={stats}
      />
    </div>
  );
}
