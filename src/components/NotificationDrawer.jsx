import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import { rwf, rwfCompact } from "../lib/format";
import HealthGauge from "./HealthGauge";

export default function NotificationDrawer({ open, onClose, stats }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'alerts' | 'analytics'
  const [readIds, setReadIds] = useState(new Set());

  // Generate dynamic notification items based on live stats or fallback smart data
  const rawAlerts = stats?.alerts || [];
  const todayRevenue = stats?.todayRevenue ?? 35000;
  const healthScore = stats?.healthScore?.score ?? 78;
  const salesChange = stats?.salesChangePct ?? 14.5;

  const mockWeeklySales = [
    { day: "Mon", rev: 18000, height: "45%" },
    { day: "Tue", rev: 24000, height: "60%" },
    { day: "Wed", rev: 15000, height: "38%" },
    { day: "Thu", rev: 32000, height: "80%" },
    { day: "Fri", rev: 28000, height: "70%" },
    { day: "Sat", rev: 42000, height: "100%" },
    { day: "Sun", rev: todayRevenue, height: `${Math.min(100, Math.max(25, (todayRevenue / 42000) * 100))}%` },
  ];

  const notifications = useMemo(() => {
    const list = [
      {
        id: "alert-low-stock-1",
        type: "alert",
        icon: AlertTriangle,
        iconBg: "bg-amber-100 text-amber-700 border-amber-200",
        title: "Low Stock Alert: Sugar 1kg",
        desc: "Only 8 units left in store (below threshold of 10).",
        time: "10m ago",
        actionLabel: "Restock Now",
        actionTo: "/stock",
      },
      {
        id: "milestone-sales-1",
        type: "analytics",
        icon: TrendingUp,
        iconBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        title: `Sales Surge (+${salesChange}% Growth)`,
        desc: `Today's revenue reached ${rwf(todayRevenue)}. Great performance!`,
        time: "1h ago",
        actionLabel: "View Sales",
        actionTo: "/sell",
      },
      {
        id: "health-insight-1",
        type: "analytics",
        icon: Sparkles,
        iconBg: "bg-blue-100 text-blue-700 border-blue-200",
        title: `Business Health Score: ${healthScore}/100`,
        desc: "Your stock efficiency is strong. Check recommendations to boost SACCO credit.",
        time: "3h ago",
        actionLabel: "View Health Score",
        actionTo: "/health-score",
      },
      {
        id: "supplier-notice-1",
        type: "alert",
        icon: Package,
        iconBg: "bg-purple-100 text-purple-700 border-purple-200",
        title: "Supplier Restock Reminder",
        desc: "Inyange Industries catalog updated. Check low stock items.",
        time: "Yesterday",
        actionLabel: "Suppliers",
        actionTo: "/suppliers",
      },
    ];

    // Append any extra live alerts from props
    rawAlerts.forEach((a, i) => {
      if (!list.some((item) => item.id === `live-${i}`)) {
        list.unshift({
          id: `live-${i}`,
          type: "alert",
          icon: AlertTriangle,
          iconBg: "bg-red-100 text-red-700 border-red-200",
          title: "Critical Alert",
          desc: a.message,
          time: "Just now",
          actionLabel: "View",
          actionTo: "/stock",
        });
      }
    });

    return list;
  }, [rawAlerts, todayRevenue, healthScore, salesChange]);

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content Container */}
      <div className="relative w-full max-w-lg rounded-t-[28px] sm:rounded-3xl bg-card border border-line shadow-2xl overflow-hidden db-rise max-h-[90vh] flex flex-col">
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-xlt text-primary">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-extrabold text-ink">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">Insights, alerts & performance graphs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-muted hover:text-ink hover:bg-line/50 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Visual Analytics & Sales Performance Graphs Card */}
          <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-primary" />
                <span className="font-heading text-sm font-bold text-ink">
                  7-Day Sales Trend
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> +{salesChange}%
              </span>
            </div>

            {/* Interactive Bar Graph */}
            <div className="flex items-end justify-between gap-2 pt-4 pb-1 px-1 h-32 border-b border-line/60">
              {mockWeeklySales.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 hidden group-hover:flex items-center justify-center bg-ink text-white text-[10px] font-bold py-1 px-1.5 rounded shadow z-20 whitespace-nowrap">
                    {rwfCompact(item.rev)}
                  </div>
                  <div className="w-full bg-line/40 rounded-t-lg overflow-hidden h-24 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                        idx === mockWeeklySales.length - 1
                          ? "bg-gradient-to-t from-primary to-emerald-400 shadow-md"
                          : "bg-gradient-to-t from-primary/70 to-primary/90"
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted group-hover:text-primary transition">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted font-medium">Total 7-Day Revenue:</span>
              <span className="font-heading font-extrabold text-primary tabnum">
                {rwf(159000 + todayRevenue)}
              </span>
            </div>
          </div>

          {/* Quick Business Health Metric Bar */}
          <div
            onClick={() => {
              onClose();
              navigate("/health-score");
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-line bg-card hover:border-primary/50 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <HealthGauge score={healthScore} size={48} showLabel={false} />
              <div>
                <span className="text-xs font-bold text-ink group-hover:text-primary transition flex items-center gap-1">
                  Business Health Gauge <ChevronRight size={14} />
                </span>
                <span className="text-[11px] text-muted block">
                  Score: {healthScore}/100 · Strong Credit Status
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-primary underline group-hover:no-underline">
              Analyze
            </span>
          </div>

          {/* Tabs Filter & Mark All Read */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-line text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "all"
                    ? "bg-card text-ink shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "alerts"
                    ? "bg-card text-ink shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "analytics"
                    ? "bg-card text-ink shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                Analytics
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-line text-xs text-muted">
                No notifications in this category.
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const Icon = item.icon;
                const isRead = readIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-2xl border transition duration-200 ${
                      isRead
                        ? "bg-card/60 border-line/60 opacity-80"
                        : "bg-card border-line shadow-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.iconBg}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-ink">{item.title}</h4>
                          <span className="text-[10px] font-medium text-muted">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{item.desc}</p>

                        {/* Action Link Button */}
                        {item.actionLabel && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setReadIds((prev) => new Set(prev).add(item.id));
                                onClose();
                                navigate(item.actionTo);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:underline cursor-pointer"
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
        <div className="border-t border-line bg-card p-4 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-paper hover:bg-line/40 text-xs font-bold text-ink transition"
          >
            Close Notification Center
          </button>
        </div>
      </div>
    </div>
  );
}
