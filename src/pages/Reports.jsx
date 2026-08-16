import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Package,
  Receipt,
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
  ArrowUpRight,
  BarChart2,
  Wallet
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { rwf, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import { useData } from "../context/DataContext";
import { generatePdfReport } from "../lib/pdfReportGenerator";
import toast from "react-hot-toast";

function parseSafeDate(dInput) {
  if (!dInput) return null;
  if (dInput instanceof Date) return isNaN(dInput.getTime()) ? null : dInput;
  if (typeof dInput === "number") return new Date(dInput);
  if (typeof dInput === "string") {
    const trimmed = dInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0); // local noon to safely stay inside the day
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { sales, stock, expenses, loading: dataLoading } = useData();

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

  // Compute active date boundaries in local time
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (datePreset === "this_week") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0, 0);
    } else if (datePreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (datePreset === "this_year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (datePreset === "custom") {
      if (customStart) {
        const [sy, sm, sd] = customStart.split("-").map(Number);
        start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      }
      if (customEnd) {
        const [ey, em, ed] = customEnd.split("-").map(Number);
        end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    } else if (datePreset === "all") {
      start = new Date(0);
      end = new Date(3000, 0, 1);
    }

    return { start, end };
  }, [datePreset, customStart, customEnd]);

  // Format human-readable date interval string for print / display
  const dateRangeLabel = useMemo(() => {
    if (datePreset === "today") return `Today (${formatDate(new Date())})`;
    if (datePreset === "this_week") return `This Week (${formatDate(dateRange.start)} – ${formatDate(dateRange.end)})`;
    if (datePreset === "this_month") return `This Month (${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })})`;
    if (datePreset === "this_year") return `This Year (${new Date().getFullYear()})`;
    if (datePreset === "all") return "All Time (Complete History)";
    return `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;
  }, [datePreset, dateRange]);

  // Filter real sales by date range (exclude voided)
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => {
      if (!s || s.is_voided) return false;
      if (datePreset === "all") return true;
      const sDate = parseSafeDate(s.created_at || s.sale_date || s.date) || new Date();
      return sDate.getTime() >= dateRange.start.getTime() && sDate.getTime() <= dateRange.end.getTime();
    });
  }, [sales, dateRange, datePreset]);

  // Filter real expenses by date range
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => {
      if (!e) return false;
      const amt = Number(e.amount_rwf || e.amount || 0);
      if (amt <= 0) return false;
      if (datePreset === "all") return true;
      const eDate = parseSafeDate(e.expense_date || e.created_at || e.date) || new Date();
      return eDate.getTime() >= dateRange.start.getTime() && eDate.getTime() <= dateRange.end.getTime();
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
      (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.sell_price_rwf || i.unit_price) || 0),
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
      const val = (Number(i.quantity) || 0) * (Number(i.sell_price_rwf || i.unit_price) || 0);
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

  // Handle Clean PDF Download
  const handleDownloadPdf = (tabToExport = activeTab) => {
    try {
      const filename = generatePdfReport({
        activeTab: tabToExport,
        dateRangeLabel,
        shopSettings,
        user,
        salesReport,
        expensesReport,
        stockReport,
        taxReport,
        filteredSales,
        filteredExpenses,
        stock: stock || [],
      });
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF. Using Print export fallback.");
      window.print();
    }
  };

  // Handle Clean Browser Print
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
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <div className="print-hidden">
        <ScreenHeader
          title={t("nav_reports") || "Reports & Books"}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadPdf(activeTab)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-heading font-black text-white shadow-orange-sm hover:bg-primary-hover transition cursor-pointer active:scale-95"
                title="Download Official PDF Report"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-card-hover px-3 py-1.5 text-xs font-heading font-bold text-ink transition cursor-pointer active:scale-95"
                title="Print Report"
              >
                <Printer size={14} className="text-primary" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
        
        {/* Printable Official Header */}
        <div className="hidden print:block border-b-2 border-line pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-heading font-black uppercase text-ink">{shopName}</h1>
              <p className="text-xs text-muted font-medium">{shopLocation} {shopPhone && `· Tel: ${shopPhone}`}</p>
              {shopTin && <p className="text-xs font-bold text-ink">RRA TIN: {shopTin}</p>}
            </div>
            <div className="text-right">
              <span className="text-xs font-heading font-black bg-card px-3 py-1 rounded-lg uppercase border border-line">
                Official Business Report
              </span>
              <p className="text-[11px] text-muted font-medium mt-1">
                Period: {dateRangeLabel}
              </p>
              <p className="text-[10px] text-muted">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector Bar */}
        <div className="print-hidden rounded-2xl bg-card p-4 border border-line shadow-card space-y-3 font-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-xs font-heading font-black text-ink block">Report Period:</span>
                <span className="text-[11px] font-heading font-bold text-primary">{dateRangeLabel}</span>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-heading">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    datePreset === p.id
                      ? "bg-primary text-white shadow-orange-sm font-black"
                      : "bg-card-hover text-muted hover:text-ink border border-line"
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <button
                onClick={() => handleDownloadPdf("all")}
                className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center gap-1 shrink-0 ml-1"
                title="Download Full Multi-Section Audit PDF"
              >
                <Download size={13} />
                <span>Full Audit PDF</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {datePreset === "custom" && (
            <div className="pt-2 border-t border-line flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="print-hidden flex items-center gap-1.5 bg-card p-1.5 rounded-2xl border border-line shadow-sm overflow-x-auto font-heading">
          {[
            { id: "sales", label: "Sales & Cashflow", icon: TrendingUp },
            { id: "expenses", label: `Expenses (${expensesReport.count})`, icon: DollarSign },
            { id: "stock", label: "Stock Valuation", icon: Package },
            { id: "tax", label: "Tax & EBM (18%)", icon: Receipt },
            { id: "intelligence", label: "P&L Analytics", icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: SALES & CASHFLOW ================= */}
        {activeTab === "sales" && (
          <div className="space-y-5 font-body">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-heading">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Sales Revenue</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(salesReport.totalRevenue)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">{salesReport.totalSalesCount} completed sales</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Recorded Expenses</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(expensesReport.totalExpenses)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">{expensesReport.count} expense entries in period</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Net Cash Position</span>
                <div className="mt-1 text-xl md:text-2xl font-black tabnum text-ink">
                  {rwf(salesReport.totalRevenue - expensesReport.totalExpenses)} RWF
                </div>
                <span className="text-[11px] font-medium text-primary mt-1 block font-body">Gross Receipts &minus; Operating Costs</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Sales by Payment Channel
              </h3>
              <div className="space-y-2 text-xs font-body">
                {salesReport.paymentMethods.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-bold font-heading">
                      <span className="text-ink">{m.method}</span>
                      <span className="text-ink tabnum">{rwf(m.total)} RWF ({m.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-card-hover border border-line overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Top Selling Products in Period
              </h3>
              {salesReport.topProducts.length === 0 ? (
                <p className="text-xs text-muted italic py-2">No product sales recorded in this period.</p>
              ) : (
                <div className="space-y-2 text-xs divide-y divide-line font-body">
                  {salesReport.topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-bold text-ink">{item.name}</span>
                        <span className="text-[11px] text-muted block">{item.qty} units sold</span>
                      </div>
                      <span className="font-heading font-black text-ink tabnum">{rwf(item.revenue)} RWF</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Sales History Table */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Transactions Log ({filteredSales.length})
              </h3>
              {filteredSales.length === 0 ? (
                <p className="text-xs text-muted italic py-2">No sales recorded in this date period.</p>
              ) : (
                <div className="overflow-x-auto font-body">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Invoice / Ref</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3 text-right">Amount (RWF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink">
                      {filteredSales.slice(0, 50).map((s) => (
                        <tr key={s.id} className="hover:bg-card-hover transition">
                          <td className="py-2.5 px-3 text-muted">{formatDate(s.created_at || s.sale_date)}</td>
                          <td className="py-2.5 px-3 font-heading font-bold text-primary">{s.invoice_number || `SALE-${s.id}`}</td>
                          <td className="py-2.5 px-3">{s.customer_name || "Walk-in Customer"}</td>
                          <td className="py-2.5 px-3 capitalize text-muted">{s.payment_method?.replace("_", " ") || "Cash"}</td>
                          <td className="py-2.5 px-3 text-right font-heading font-black text-ink tabnum">{rwf(s.total_amount)}</td>
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
          <div className="space-y-5 font-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-heading">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Expenses in Period</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(expensesReport.totalExpenses)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">{expensesReport.count} recorded entries in {dateRangeLabel}</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Top Expense Category</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink">
                  {expensesReport.categories[0]?.category || "None"}
                </div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">
                  {expensesReport.categories[0] ? `${rwf(expensesReport.categories[0].total)} RWF (${expensesReport.categories[0].pct}%)` : "No expenses recorded"}
                </span>
              </div>
            </div>

            {/* Expense Categories Breakdown */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Expenses by Category
              </h3>
              {expensesReport.categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  No expenses recorded in this period. Use the <button onClick={() => navigate("/expenses?new=1")} className="text-primary font-bold hover:underline">Record Expense</button> screen to log business expenses.
                </div>
              ) : (
                <div className="space-y-2.5 text-xs font-body">
                  {expensesReport.categories.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between font-bold font-heading">
                        <span className="text-ink">{c.category}</span>
                        <span className="text-ink tabnum">{rwf(c.total)} RWF ({c.pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-card-hover border border-line overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Expenses Log */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                  Recorded Expenses Log ({filteredExpenses.length})
                </h3>
                <button
                  onClick={() => navigate("/expenses?new=1")}
                  className="text-xs font-heading font-extrabold text-primary hover:underline"
                >
                  + Add Expense
                </button>
              </div>

              {filteredExpenses.length === 0 ? (
                <p className="text-xs text-muted italic py-4 text-center">No expenses found for this date range.</p>
              ) : (
                <div className="overflow-x-auto font-body">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description / Note</th>
                        <th className="py-2.5 px-3 text-right">Amount (RWF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink">
                      {filteredExpenses.map((e) => (
                        <tr key={e.id} className="hover:bg-card-hover transition">
                          <td className="py-2.5 px-3 text-muted">{formatDate(e.expense_date || e.created_at)}</td>
                          <td className="py-2.5 px-3 font-bold text-ink">{e.category}</td>
                          <td className="py-2.5 px-3 text-muted">{e.description || e.notes || "—"}</td>
                          <td className="py-2.5 px-3 text-right font-heading font-black text-ink tabnum">{rwf(e.amount_rwf || e.amount)}</td>
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
          <div className="space-y-5 font-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-heading">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Inventory Value (Selling Price)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(stockReport.totalSellValuation)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">{stockReport.totalItems} active products</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Inventory Value (Cost Price)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(stockReport.totalCostValuation)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">Est. Profit: +{rwf(stockReport.potentialProfit)} RWF</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Stock Alerts</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">
                  {stockReport.lowCount} Low · {stockReport.outCount} Out
                </div>
                <span className="text-[11px] font-medium text-primary mt-1 block font-body">Requires replenishment</span>
              </div>
            </div>

            {/* Inventory Valuation by Category */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Valuation by Category
              </h3>
              <div className="space-y-2 text-xs divide-y divide-line font-body">
                {stockReport.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="font-bold text-ink">{cat.category}</span>
                      <span className="text-[11px] text-muted block">{cat.count} stock items</span>
                    </div>
                    <span className="font-heading font-black text-ink tabnum">{rwf(cat.value)} RWF</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Stock Inventory Listing */}
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-3 report-card">
              <h3 className="text-xs font-heading font-black text-ink uppercase tracking-wider">
                Full Stock Valuation Register ({(stock || []).length} items)
              </h3>
              <div className="overflow-x-auto font-body">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">In Stock</th>
                      <th className="py-2.5 px-3 text-right">Cost Price</th>
                      <th className="py-2.5 px-3 text-right">Sell Price</th>
                      <th className="py-2.5 px-3 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {(stock || []).map((item) => (
                      <tr key={item.id} className="hover:bg-card-hover transition">
                        <td className="py-2.5 px-3 font-bold text-ink">{item.name}</td>
                        <td className="py-2.5 px-3 text-muted">{item.category || "General"}</td>
                        <td className="py-2.5 px-3 text-right font-heading font-bold text-ink tabnum">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-muted tabnum">{rwf(item.cost_price_rwf || item.cost_price || 0)}</td>
                        <td className="py-2.5 px-3 text-right text-ink tabnum">{rwf(item.sell_price_rwf || item.unit_price || 0)}</td>
                        <td className="py-2.5 px-3 text-right font-heading font-black text-primary tabnum">
                          {rwf((Number(item.quantity) || 0) * (Number(item.sell_price_rwf || item.unit_price) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TAX & EBM ================= */}
        {activeTab === "tax" && (
          <div className="space-y-5 font-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-heading">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Sales (VAT Inclusive)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(taxReport.totalRevenue)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">In {dateRangeLabel}</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Taxable Sales (Net of VAT)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(taxReport.taxableSales)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">Base taxable amount</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Estimated VAT (18%)</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-primary tabnum">{rwf(taxReport.vat18)} RWF</div>
                <span className="text-[11px] font-medium text-primary mt-1 block font-body">Calculated output tax</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: P&L ANALYTICS ================= */}
        {activeTab === "intelligence" && (
          <div className="space-y-5 font-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-heading">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Revenue</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(salesReport.totalRevenue)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">100% Topline</span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Operating Expenses</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-ink tabnum">{rwf(expensesReport.totalExpenses)} RWF</div>
                <span className="text-[11px] font-medium text-muted mt-1 block font-body">
                  {salesReport.totalRevenue > 0 ? `${((expensesReport.totalExpenses / salesReport.totalRevenue) * 100).toFixed(0)}% of revenue` : "0%"}
                </span>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5 shadow-card report-card">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Operating Profit</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-primary tabnum">
                  {rwf(salesReport.totalRevenue - expensesReport.totalExpenses)} RWF
                </div>
                <span className="text-[11px] font-medium text-primary mt-1 block font-body">Net cash position</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
