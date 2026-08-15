import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Package,
  Receipt,
  Sparkles,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  PieChart,
  FileText,
  Filter,
  ArrowUpRight
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { rwf, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import { useData } from "../context/DataContext";

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { sales, stock, expenses } = useData();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'expenses' | 'stock' | 'tax' | 'intelligence'
  const [shopSettings, setShopSettings] = useState(null);

  // Date Range Filtering State
  const [datePreset, setDatePreset] = useState("this_month"); // 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

  // Load shop settings (TIN, address, shop_name)
  useEffect(() => {
    api.get("/settings")
      .then((res) => {
        if (res.data?.settings) setShopSettings(res.data.settings);
      })
      .catch(() => {});
  }, []);

  // Compute active date boundaries
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (datePreset === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (datePreset === "this_week") {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
    } else if (datePreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (datePreset === "this_year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else if (datePreset === "custom") {
      if (customStart) start = new Date(customStart + "T00:00:00");
      if (customEnd) end = new Date(customEnd + "T23:59:59");
    }

    return { start, end };
  }, [datePreset, customStart, customEnd]);

  // Format human-readable date interval string for print / display
  const dateRangeLabel = useMemo(() => {
    if (datePreset === "today") return `Today (${formatDate(new Date())})`;
    if (datePreset === "this_week") return `This Week (from ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)})`;
    if (datePreset === "this_month") return `This Month (${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })})`;
    if (datePreset === "this_year") return `This Year (${new Date().getFullYear()})`;
    if (datePreset === "all") return "All Time (Complete History)";
    return `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;
  }, [datePreset, dateRange]);

  // Filter real sales by date range (exclude voided)
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => {
      if (s.is_voided) return false;
      const sDate = new Date(s.created_at || s.sale_date || Date.now());
      if (datePreset === "all") return true;
      return sDate >= dateRange.start && sDate <= dateRange.end;
    });
  }, [sales, dateRange, datePreset]);

  // Filter real expenses by date range
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => {
      const eDate = new Date(e.expense_date || e.created_at || Date.now());
      if (datePreset === "all") return true;
      return eDate >= dateRange.start && eDate <= dateRange.end;
    });
  }, [expenses, dateRange, datePreset]);

  // 1. Sales Report Calculations
  const salesReport = useMemo(() => {
    const totalRev = filteredSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const count = filteredSales.length;
    const avgTicket = count > 0 ? Math.round(totalRev / count) : 0;

    const methodTotals = {};
    filteredSales.forEach((s) => {
      const m = s.payment_method || "cash";
      methodTotals[m] = (methodTotals[m] || 0) + (Number(s.total_amount) || 0);
    });

    const paymentMethods = Object.entries(methodTotals).map(([mKey, amt]) => {
      const labelMap = { cash: "Cash", mtn_momo: "MTN MoMo", airtel: "Airtel Money", credit: "Credit (Owed)" };
      return {
        method: labelMap[mKey] || mKey.toUpperCase(),
        total: amt,
        pct: totalRev > 0 ? Number(((amt / totalRev) * 100).toFixed(1)) : 0,
      };
    });

    const prodMap = {};
    filteredSales.forEach((s) => {
      (s.items || []).forEach((i) => {
        const name = i.item_name || i.name || "Product Item";
        const qty = Number(i.quantity || i.qty) || 1;
        const rev = Number(i.subtotal || i.total || ((i.unit_price || 0) * qty)) || 0;
        if (!prodMap[name]) prodMap[name] = { name, qty: 0, revenue: 0 };
        prodMap[name].qty += qty;
        prodMap[name].revenue += rev;
      });
    });

    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    return {
      totalRevenue: totalRev,
      totalSalesCount: count,
      avgTicket,
      paymentMethods: paymentMethods.length > 0 ? paymentMethods : [{ method: "Cash", total: totalRev, pct: 100 }],
      topProducts,
    };
  }, [filteredSales]);

  // 2. Expenses Report Calculations
  const expensesReport = useMemo(() => {
    const totalExp = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount_rwf || e.amount) || 0), 0);
    const count = filteredExpenses.length;

    const catTotals = {};
    filteredExpenses.forEach((e) => {
      const c = e.category || "General";
      catTotals[c] = (catTotals[c] || 0) + (Number(e.amount_rwf || e.amount) || 0);
    });

    const categories = Object.entries(catTotals).map(([cat, amt]) => ({
      category: cat,
      total: amt,
      pct: totalExp > 0 ? Number(((amt / totalExp) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total);

    return {
      totalExpenses: totalExp,
      count,
      categories,
    };
  }, [filteredExpenses]);

  // 3. Stock Report Calculations
  const stockReport = useMemo(() => {
    const totalSellValuation = (stock || []).reduce(
      (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.sell_price_rwf) || 0),
      0
    );
    const totalCostValuation = (stock || []).reduce(
      (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.cost_price_rwf || i.cost_price || 0)),
      0
    );
    const lowCount = (stock || []).filter((i) => (Number(i.quantity) || 0) <= (Number(i.low_stock_threshold) || 5) && Number(i.quantity) > 0).length;
    const outCount = (stock || []).filter((i) => Number(i.quantity) === 0).length;

    const catVal = {};
    const catCount = {};
    (stock || []).forEach((i) => {
      const c = i.category || "General";
      const val = (Number(i.quantity) || 0) * (Number(i.sell_price_rwf) || 0);
      catVal[c] = (catVal[c] || 0) + val;
      catCount[c] = (catCount[c] || 0) + 1;
    });

    const categories = Object.keys(catVal).map((c) => ({
      category: c,
      count: catCount[c],
      value: catVal[c],
    })).sort((a, b) => b.value - a.value);

    return {
      totalItems: (stock || []).length,
      totalSellValuation,
      totalCostValuation,
      potentialProfit: Math.max(0, totalSellValuation - totalCostValuation),
      lowCount,
      outCount,
      categories,
    };
  }, [stock]);

  // 4. Tax & EBM (VAT 18%) Report Calculations
  const taxReport = useMemo(() => {
    const totalRev = salesReport.totalRevenue;
    const taxableSales = Math.round(totalRev / 1.18);
    const vat18 = totalRev - taxableSales;
    return {
      totalRevenue: totalRev,
      taxableSales,
      vat18,
      exemptSales: 0,
      ebmReceiptsIssued: salesReport.totalSalesCount,
    };
  }, [salesReport]);

  const shopName = shopSettings?.shop_name || user?.shop_name || "INZIRA SME STORE";
  const shopTin = shopSettings?.tin_number || user?.tin_number || "TIN Registered";
  const shopPhone = shopSettings?.shop_phone || user?.phone || "";
  const shopLocation = shopSettings?.shop_address || user?.district || "Kigali, Rwanda";

  // Handle Clean PDF Export / Print
  const handlePrintReport = () => {
    window.print();
  };

  // Inject Dedicated Print Styles
  useEffect(() => {
    const styleId = "inzira-reports-print-styles";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          font-size: 11px !important;
        }
        nav, header, button, .print-hidden {
          display: none !important;
        }
        #printable-report-area {
          display: block !important;
          visibility: visible !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .report-card {
          border: 1px solid #e5e7eb !important;
          break-inside: avoid !important;
          box-shadow: none !important;
        }
      }
    `;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#F1F5E9] font-manrope text-gray-900 pb-24">
      <div className="print-hidden">
        <ScreenHeader
          title={t("nav_reports")}
          right={
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 rounded-full bg-[#D4F06B] px-4 py-2 text-xs font-black text-gray-900 shadow-sm hover:bg-[#C5E456] transition cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Export PDF / Print</span>
            </button>
          }
        />
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Printable Official Header (Visible on print or PDF export) */}
        <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase text-gray-900">{shopName}</h1>
              <p className="text-xs text-gray-600 font-semibold">{shopLocation} {shopPhone && `· Tel: ${shopPhone}`}</p>
              {shopTin && <p className="text-xs font-bold text-gray-900">RRA TIN: {shopTin}</p>}
            </div>
            <div className="text-right">
              <span className="text-xs font-black bg-gray-100 px-3 py-1 rounded-full uppercase">
                Official Business Report
              </span>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">
                Period: {dateRangeLabel}
              </p>
              <p className="text-[10px] text-gray-400">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector Bar (Screen Only) */}
        <div className="print-hidden rounded-3xl bg-white p-4.5 border border-gray-200/80 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4F06B] text-gray-900 font-black">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-xs font-extrabold text-gray-900 block">Report Period:</span>
                <span className="text-[11px] font-bold text-emerald-800">{dateRangeLabel}</span>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "today", label: "Today" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "this_year", label: "This Year" },
                { id: "all", label: "All Time" },
                { id: "custom", label: "Custom Dates" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    datePreset === p.id
                      ? "bg-[#D4F06B] text-gray-900 shadow-sm font-black"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {datePreset === "custom" && (
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs (Screen Only) */}
        <div className="print-hidden flex items-center gap-1.5 bg-white p-2 rounded-full border border-gray-200/80 shadow-sm overflow-x-auto">
          {[
            { id: "sales", label: "Sales Report", icon: TrendingUp },
            { id: "expenses", label: "Expenses Report", icon: DollarSign },
            { id: "stock", label: "Stock Valuation", icon: Package },
            { id: "tax", label: "Tax & EBM (18%)", icon: Receipt },
            { id: "intelligence", label: "Intelligence", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#D4F06B] text-gray-900 shadow-sm font-black"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: SALES REPORT ================= */}
        {(activeTab === "sales" || window.matchMedia?.("print")?.matches) && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Sales Revenue</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-gray-900 tabnum">{rwf(salesReport.totalRevenue)}</div>
                <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">In {dateRangeLabel}</span>
              </div>
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed Transactions</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-purple-700 tabnum">{salesReport.totalSalesCount} sales</div>
                <span className="text-[11px] font-semibold text-gray-400 mt-1 block">Avg ticket: {rwf(salesReport.avgTicket)}</span>
              </div>
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Cash Flow (Sales - Expenses)</span>
                <div className={`mt-1 text-xl md:text-2xl font-black tabnum ${salesReport.totalRevenue - expensesReport.totalExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {rwf(salesReport.totalRevenue - expensesReport.totalExpenses)}
                </div>
                <span className="text-[11px] font-semibold text-gray-500 mt-1 block">Period Operating Margin</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Sales by Payment Channel
              </h3>
              <div className="space-y-2 text-xs">
                {salesReport.paymentMethods.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-800">{m.method}</span>
                      <span className="text-gray-900 tabnum">{rwf(m.total)} ({m.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Top Selling Products in Period
              </h3>
              {salesReport.topProducts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No product sales recorded in this period.</p>
              ) : (
                <div className="space-y-2 text-xs divide-y divide-gray-100">
                  {salesReport.topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <span className="text-[11px] text-gray-500 block">{item.qty} units sold</span>
                      </div>
                      <span className="font-black text-emerald-700 tabnum">{rwf(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Sales History Table */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Transactions Log ({filteredSales.length})
              </h3>
              {filteredSales.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No sales recorded in this date period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase">
                        <th className="pb-2">Date & Time</th>
                        <th className="pb-2">Invoice / Ref</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Payment</th>
                        <th className="pb-2 text-right">Amount (RWF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {filteredSales.slice(0, 50).map((s) => (
                        <tr key={s.id} className="py-2">
                          <td className="py-2.5 text-gray-500">{formatDate(s.created_at)}</td>
                          <td className="py-2.5 font-bold text-purple-600">{s.invoice_number || `SALE-${s.id}`}</td>
                          <td className="py-2.5">{s.customer_name || "Walk-in Customer"}</td>
                          <td className="py-2.5 capitalize">{s.payment_method?.replace("_", " ") || "Cash"}</td>
                          <td className="py-2.5 text-right font-black text-gray-900 tabnum">{rwf(s.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: EXPENSES REPORT ================= */}
        {activeTab === "expenses" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Expenses</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-red-600 tabnum">{rwf(expensesReport.totalExpenses)}</div>
                <span className="text-[11px] font-semibold text-gray-500 mt-1 block">{expensesReport.count} recorded entries in {dateRangeLabel}</span>
              </div>
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top Expense Category</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-gray-900">
                  {expensesReport.categories[0]?.category || "None"}
                </div>
                <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                  {expensesReport.categories[0] ? `${rwf(expensesReport.categories[0].total)} (${expensesReport.categories[0].pct}%)` : "No expenses"}
                </span>
              </div>
            </div>

            {/* Expense Categories Breakdown */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Expenses by Category
              </h3>
              {expensesReport.categories.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No expenses recorded in this period.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {expensesReport.categories.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-gray-800">{c.category}</span>
                        <span className="text-red-700 tabnum">{rwf(c.total)} ({c.pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Expenses Log */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Recorded Expenses Log ({filteredExpenses.length})
              </h3>
              {filteredExpenses.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No expenses found for this date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Description / Note</th>
                        <th className="pb-2 text-right">Amount (RWF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {filteredExpenses.map((e) => (
                        <tr key={e.id} className="py-2">
                          <td className="py-2.5 text-gray-500">{formatDate(e.expense_date || e.created_at)}</td>
                          <td className="py-2.5 font-bold text-gray-900">{e.category}</td>
                          <td className="py-2.5 text-gray-600">{e.description || "—"}</td>
                          <td className="py-2.5 text-right font-black text-red-600 tabnum">{rwf(e.amount_rwf || e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: STOCK VALUATION REPORT ================= */}
        {activeTab === "stock" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inventory Value (Selling Price)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-emerald-700 tabnum">{rwf(stockReport.totalSellValuation)}</div>
                <span className="text-[11px] font-semibold text-gray-400 mt-1 block">{stockReport.totalItems} active products</span>
              </div>
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inventory Value (Cost Price)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-gray-900 tabnum">{rwf(stockReport.totalCostValuation)}</div>
                <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Est. Profit: +{rwf(stockReport.potentialProfit)}</span>
              </div>
              <div className="rounded-[28px] border border-amber-200 bg-amber-50/60 p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Stock Alerts</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-amber-900 tabnum">
                  {stockReport.lowCount} Low · {stockReport.outCount} Out
                </div>
                <span className="text-[11px] font-semibold text-amber-700 mt-1 block">Requires replenishment</span>
              </div>
            </div>

            {/* Inventory Valuation by Category */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Valuation by Category
              </h3>
              <div className="space-y-2 text-xs divide-y divide-gray-100">
                {stockReport.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="font-bold text-gray-900">{cat.category}</span>
                      <span className="text-[11px] text-gray-400 block">{cat.count} stock items</span>
                    </div>
                    <span className="font-black text-gray-900 tabnum">{rwf(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Stock Inventory Listing */}
            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Full Stock Valuation Register ({(stock || []).length} items)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">In Stock</th>
                      <th className="pb-2 text-right">Cost Price</th>
                      <th className="pb-2 text-right">Sell Price</th>
                      <th className="pb-2 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {(stock || []).map((i) => {
                      const totalVal = (Number(i.quantity) || 0) * (Number(i.sell_price_rwf) || 0);
                      return (
                        <tr key={i.id} className="py-2">
                          <td className="py-2.5 font-bold text-gray-900">{i.name}</td>
                          <td className="py-2.5 text-gray-500">{i.category || "General"}</td>
                          <td className={`py-2.5 text-right font-black ${Number(i.quantity) === 0 ? "text-red-600" : Number(i.quantity) <= (i.low_stock_threshold || 5) ? "text-amber-600" : "text-emerald-700"}`}>
                            {i.quantity} {i.unit || "pcs"}
                          </td>
                          <td className="py-2.5 text-right text-gray-500 tabnum">{rwf(i.cost_price_rwf || i.cost_price || 0)}</td>
                          <td className="py-2.5 text-right font-bold text-gray-900 tabnum">{rwf(i.sell_price_rwf)}</td>
                          <td className="py-2.5 text-right font-black text-emerald-800 tabnum">{rwf(totalVal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TAX & EBM (VAT 18%) REPORT ================= */}
        {activeTab === "tax" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-6 text-white shadow-2xl space-y-4 report-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={22} className="text-blue-400" />
                  <span className="text-sm font-black uppercase tracking-wider">
                    RRA EBM v2 Tax Summary (Rwanda 18% VAT)
                  </span>
                </div>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30">
                  {shopTin ? `TIN: ${shopTin}` : "RRA Verified"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <span className="text-xs text-white/60">Gross Turnover (VAT Inc.):</span>
                  <div className="text-xl font-black tabnum mt-0.5">{rwf(taxReport.totalRevenue)}</div>
                </div>
                <div>
                  <span className="text-xs text-white/60">Net Taxable Amount (Excl. VAT):</span>
                  <div className="text-xl font-black tabnum mt-0.5">{rwf(taxReport.taxableSales)}</div>
                </div>
                <div>
                  <span className="text-xs text-white/60">VAT Payable (18%):</span>
                  <div className="text-xl font-black text-blue-400 tabnum mt-0.5">{rwf(taxReport.vat18)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                EBM Receipts Counter
              </h3>
              <div className="flex items-center justify-between text-xs p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                <span className="font-bold text-gray-800">Total Fiscal Receipts Generated in {dateRangeLabel}:</span>
                <span className="font-black text-purple-700 tabnum">{taxReport.ebmReceiptsIssued} receipts</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: INTELLIGENCE & HEALTH ================= */}
        {activeTab === "intelligence" && (
          <div className="space-y-5">
            <div
              onClick={() => navigate("/health-score")}
              className="flex items-center justify-between p-6 rounded-[28px] border border-gray-200/80 bg-white hover:border-[#D4F06B] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] transition cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  <h3 className="text-base font-black text-gray-900 group-hover:text-purple-600 transition">
                    Business Health Score & AI Diagnostics
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  View full credit readiness report, working capital drivers, and SACCO loan eligibility metrics.
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-600" />
            </div>
          </div>
        )}

        {/* Printable Footer Stamp */}
        <div className="hidden print:block pt-8 border-t border-gray-300 text-xs text-gray-600">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-bold text-gray-800">Prepared by: {user?.name || "Business Owner"}</p>
              <p className="text-[10px] text-gray-400">Official INZIRA Business Records · Kigali, Rwanda</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-gray-400 mb-1"></div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Authorized Signature & Stamp</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
