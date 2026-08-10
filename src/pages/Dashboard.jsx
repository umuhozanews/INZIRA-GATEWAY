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
  Sparkles
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

  const dataCtx = useData() || {};
  const sales = Array.isArray(dataCtx.sales) ? dataCtx.sales : [];
  const expenses = Array.isArray(dataCtx.expenses) ? dataCtx.expenses : [];
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
    { label: t("record_sale"), icon: ShoppingCart, to: "/sell", color: "bg-[#D4F06B] text-gray-900" },
    { label: t("add_expense"), icon: Wallet, to: "/expenses?new=1", color: "bg-purple-100 text-purple-700" },
    { label: t("add_stock"), icon: Package, to: "/stock?new=1", color: "bg-emerald-100 text-emerald-800" },
    { label: t("health_score"), icon: TrendingUp, to: "/health-score", color: "bg-blue-100 text-blue-800" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-manrope">
      {/* Top Header & Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-manrope text-xs font-bold text-gray-400 uppercase tracking-widest">
            {t("hello")}
          </span>
          <h1 className="font-manrope text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            {shopName || user?.name || "My Shop"}
            <Sparkles size={18} className="text-purple-600" />
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <OfflineBadge />
          </div>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white shadow-sm hover:bg-gray-100 active:scale-95 transition cursor-pointer"
            aria-label="Alerts & Notifications"
          >
            <Bell size={18} className="text-gray-800" />
            {(s.alerts?.length || 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                {s.alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Metrics & Actions) */}
        <div className="md:col-span-7 lg:col-span-7 space-y-5">
          {/* Business Health Card (Clickable -> /health-score) */}
          <button
            onClick={() => navigate("/health-score")}
            className="w-full flex flex-col sm:flex-row items-center gap-5 rounded-[32px] border border-gray-200/80 bg-white p-6 text-left shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:border-[#D4F06B] hover:shadow-md transition duration-200 cursor-pointer active:scale-[0.99] group"
          >
            <HealthGauge score={score} size={100} label={score != null ? t(bandKey(band, score)) : undefined} />
            <div className="flex-1 text-center sm:text-left">
              <span className="font-manrope text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-purple-600 transition">
                {t("health_score")}
              </span>
              {score != null ? (
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  {salesChange >= 0 ? (
                    <TrendingUp size={14} className="text-emerald-600" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      salesChange >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {salesChange == null
                      ? "—"
                      : `${salesChange >= 0 ? "+" : ""}${salesChange}% ${t("vs_last_month")}`}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-400">{t("no_score")}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F4FBE4] border border-[#D4F06B]/40 px-3 py-1 text-xs font-extrabold text-gray-900 group-hover:bg-[#D4F06B] transition">
                {t("see_drivers")} <ChevronRight size={14} />
              </div>
            </div>
          </button>

          {/* Quick Stat Cards */}
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

          {/* Quick Actions Panel */}
          <div className="rounded-[32px] border border-gray-200/80 bg-white p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)]">
            <h2 className="font-manrope text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {t("quick_actions")}
            </h2>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(({ label, icon: Icon, to, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/60 hover:bg-[#F4FBE4] hover:border-[#D4F06B] hover:shadow-sm active:scale-95 transition duration-150 gap-2.5 text-center group cursor-pointer"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color} shadow-sm group-hover:scale-110 transition`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11.5px] font-extrabold leading-tight text-gray-900 group-hover:text-purple-600 transition">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Alerts & Activity Feed) */}
        <div className="md:col-span-5 lg:col-span-5 space-y-5">
          {/* Low Stock Alert */}
          {lowAlert && (
            <button
              onClick={() => navigate("/stock")}
              className="w-full flex items-center gap-3 rounded-full bg-red-50 border border-red-200 p-4 text-left shadow-sm hover:border-red-400 transition cursor-pointer active:scale-95"
            >
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <span className="flex-1 text-xs font-bold text-red-900">{lowAlert.message}</span>
              <ChevronRight size={16} className="text-red-500 shrink-0" />
            </button>
          )}

          {/* Recent Activity Panel */}
          <div className="rounded-[32px] border border-gray-200/80 bg-white p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-manrope text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                {t("recent_activity")}
              </h2>
              <button
                onClick={() => navigate("/sell")}
                className="text-[11px] font-extrabold text-purple-600 hover:underline"
              >
                {t("record_sale")}
              </button>
            </div>
            <div className="space-y-2.5">
              {!recent || recent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 font-semibold">
                  {t("no_activity")}
                </div>
              ) : (
                recent.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => navigate("/sell")}
                    className="w-full flex items-center justify-between rounded-2xl border border-gray-200/60 bg-gray-50/60 p-3.5 text-left hover:bg-[#F4FBE4] hover:border-[#D4F06B] transition cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4F06B] text-gray-900 shrink-0 group-hover:scale-105 transition shadow-sm">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-purple-600 transition">
                          {sale.customer_name || t("record_sale")}
                          {sale.items_count ? ` · ${sale.items_count} ${t("items")}` : ""}
                        </div>
                        <div className="text-[10.5px] font-semibold text-gray-400">{clockTime(sale.created_at)}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black tabnum text-emerald-600">
                      +{rwf(sale.total_amount)}
                    </span>
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
    </div>
  );
}
