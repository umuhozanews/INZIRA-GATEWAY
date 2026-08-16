import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  CheckCircle,
  Activity,
} from "lucide-react";
import { rwf, rwfCompact } from "../lib/format";
import HealthGauge from "./HealthGauge";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";

export default function NotificationDrawer({ open, onClose, stats }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const dataCtx = useData() || {};
  const stock = Array.isArray(dataCtx.stock) ? dataCtx.stock : [];
  const sales = Array.isArray(dataCtx.sales) ? dataCtx.sales : [];
  const expenses = Array.isArray(dataCtx.expenses) ? dataCtx.expenses : [];

  const [activeTab, setActiveTab] = useState("all");
  const [readIds, setReadIds] = useState(new Set());

  const s = stats || {};
  const todayRev = Number(s.today_revenue) || sales.reduce((sum, x) => sum + (Number(x.total_amount) || 0), 0);
  const lowStockItems = stock.filter((x) => Number(x.quantity) <= (Number(x.low_stock_threshold) || 5));
  const lowCount = Number(s.low_stock_count) || lowStockItems.length;
  const healthScore = s.health_score !== undefined ? s.health_score : null;
  const hasData = sales.length > 0 || stock.length > 0 || expenses.length > 0;

  // Build notifications dynamically based purely on the active logged-in user's own data
  const notifications = useMemo(() => {
    const list = [];

    // 1. Stock alerts
    if (lowCount > 0) {
      list.push({
        id: "user-stock-low",
        type: "alert",
        icon: AlertTriangle,
        iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        title: `${lowCount} item${lowCount > 1 ? "s" : ""} low in stock`,
        desc: "Items in your store are reaching minimum thresholds. Restock soon to prevent missed sales.",
        time: "Action needed",
        actionLabel: "View Stock",
        actionTo: "/stock",
      });
    }

    // 2. Sales Summary / Welcome for Logged-in Merchant
    if (todayRev > 0) {
      list.push({
        id: "user-today-sales",
        type: "analytics",
        icon: TrendingUp,
        iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: `Today's Revenue: ${rwf(todayRev)} RWF`,
        desc: `Your store has completed ${sales.length} sale${sales.length === 1 ? "" : "s"} today. Great progress!`,
        time: "Today",
        actionLabel: "View Sales",
        actionTo: "/sell",
      });
    } else {
      list.push({
        id: "user-welcome-start",
        type: "analytics",
        icon: Activity,
        iconBg: "bg-primary/10 text-primary border-primary/20",
        title: `Welcome, ${user?.name || "Merchant"}!`,
        desc: `Your account for "${user?.shop_name || "My Shop"}" is settled. Record your first sale to see live revenue insights.`,
        time: "Just now",
        actionLabel: "Record Sale",
        actionTo: "/sell",
      });
    }

    // 3. Dynamic Health Score Status for Logged-In User
    if (hasData && healthScore !== null) {
      list.push({
        id: "user-health-score",
        type: "analytics",
        icon: TrendingUp,
        iconBg: "bg-primary/10 text-primary border-primary/20",
        title: `Business Health Score: ${healthScore}/100`,
        desc: "Your transaction credit health status is active. Check factors to boost SACCO credit.",
        time: "Today",
        actionLabel: "View Health Score",
        actionTo: "/health-score",
      });
    }

    return list;
  }, [lowCount, todayRev, sales.length, user, hasData, healthScore]);

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "alerts") return n.type === "alert";
    if (activeTab === "analytics") return n.type === "analytics";
    return true;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-body">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content Container */}
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-card border border-line shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-ink">
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-5 py-4 backdrop-blur font-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-orange-sm">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-ink">
                  {t("notifications")}
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow-orange-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-medium font-body">{user?.shop_name || "My Shop"} Alerts & Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-hover border border-line text-muted hover:text-ink transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Quick Business Health Metric Bar */}
          <div
            onClick={() => {
              onClose();
              navigate("/health-score");
            }}
            className="flex items-center justify-between p-4 rounded-xl border border-line bg-card-hover hover:border-primary/40 transition cursor-pointer group shadow-card"
          >
            <div className="flex items-center gap-3 font-heading">
              <HealthGauge score={healthScore} size={48} showLabel={false} />
              <div>
                <span className="text-xs font-black text-ink group-hover:text-primary transition flex items-center gap-1">
                  Business Health Gauge <ChevronRight size={14} />
                </span>
                <span className="text-[11px] text-muted font-medium block font-body">
                  {hasData ? `Score: ${healthScore}/100` : "Tap to calculate health score"}
                </span>
              </div>
            </div>
            <span className="text-xs font-heading font-black text-primary underline group-hover:no-underline">
              Analyze
            </span>
          </div>

          {/* Tabs Filter & Mark All Read */}
          <div className="flex items-center justify-between gap-2 pt-1 font-heading">
            <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-line text-xs font-bold">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === "all"
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === "alerts"
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                Alerts ({lowCount})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                Analytics
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-heading font-black text-primary hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3 font-body">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-line text-xs font-medium text-muted space-y-2 bg-card-hover">
                <CheckCircle size={28} className="mx-auto text-emerald-400 mb-1" />
                <p className="font-heading font-bold text-ink">All clear!</p>
                <p>No active notifications or low stock alerts for this account.</p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const Icon = item.icon;
                const isRead = readIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-xl border transition duration-200 ${
                      isRead
                        ? "bg-card-hover/40 border-line opacity-75"
                        : "bg-card border-line shadow-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.iconBg}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 space-y-1 font-body">
                        <div className="flex items-center justify-between font-heading">
                          <h4 className="text-xs font-black text-ink">{item.title}</h4>
                          <span className="text-[10px] font-medium text-muted">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{item.desc}</p>

                        {/* Action Link Button */}
                        {item.actionLabel && (
                          <div className="pt-2 font-heading">
                            <button
                              onClick={() => {
                                setReadIds((prev) => new Set(prev).add(item.id));
                                onClose();
                                navigate(item.actionTo);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline cursor-pointer"
                            >
                              {item.actionLabel} <ArrowUpRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-card p-4 text-center font-heading">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-card-hover border border-line hover:border-primary/40 text-xs font-bold text-ink transition cursor-pointer"
          >
            Close Notification Center
          </button>
        </div>
      </div>
    </div>
  );
}
