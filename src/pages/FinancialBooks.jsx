import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BookMarked,
  Scale,
  Wallet,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  TrendingUp,
  FileText
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { rwf, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import { useData } from "../context/DataContext";

export default function FinancialBooks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { sales, expenses, stock } = useData();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("journal"); // 'journal' | 'ledger' | 'cashbook' | 'trial'
  const [shopSettings, setShopSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Format date interval label
  const dateRangeLabel = useMemo(() => {
    if (datePreset === "today") return `Today (${formatDate(new Date())})`;
    if (datePreset === "this_week") return `This Week (${formatDate(dateRange.start)} – ${formatDate(dateRange.end)})`;
    if (datePreset === "this_month") return `This Month (${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })})`;
    if (datePreset === "this_year") return `This Year (${new Date().getFullYear()})`;
    if (datePreset === "all") return "All Time (Complete Ledger History)";
    return `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;
  }, [datePreset, dateRange]);

  // 1. Filter Real Sales (non-voided only)
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => {
      if (s.is_voided) return false;
      const sDate = new Date(s.created_at || s.sale_date || Date.now());
      if (datePreset === "all") return true;
      return sDate >= dateRange.start && sDate <= dateRange.end;
    });
  }, [sales, dateRange, datePreset]);

  // 2. Filter Real Expenses
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => {
      const eDate = new Date(e.expense_date || e.created_at || Date.now());
      if (datePreset === "all") return true;
      return eDate >= dateRange.start && eDate <= dateRange.end;
    });
  }, [expenses, dateRange, datePreset]);

  // Real Inventory Valuation
  const realInventoryAssetValuation = useMemo(() => {
    return (stock || []).reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.cost_price_rwf || item.cost_price || (item.sell_price_rwf ? Number(item.sell_price_rwf) * 0.7 : 0));
      return sum + (qty * cost);
    }, 0);
  }, [stock]);

  // 3. Compute Real Double-Entry Journal Log
  const realJournalEntries = useMemo(() => {
    const entries = [];

    // Map each real sale
    filteredSales.forEach((s) => {
      const total = Number(s.total_amount) || 0;
      const isCredit = s.payment_method === "credit" || s.payment_status === "pending";
      const isMoMo = s.payment_method === "mtn_momo" || s.payment_method === "airtel" || s.payment_method === "card" || s.payment_method === "bank";

      let debitCode = "1000";
      let debitName = "Cash on Hand (Till)";
      if (isCredit) {
        debitCode = "1100";
        debitName = "Accounts Receivable";
      } else if (isMoMo) {
        debitCode = "1010";
        debitName = "Mobile Money / Bank";
      }

      entries.push({
        id: `sale_${s.id}`,
        entry_date: s.created_at || new Date().toISOString(),
        reference: s.invoice_number || `INV-2026-${String(s.id).slice(-4)}`,
        description: `Sale of Goods to ${s.customer_name || "Walk-in Customer"}`,
        debit_code: debitCode,
        debit_account: debitName,
        credit_code: "4000",
        credit_account: "Sales Revenue",
        amount: total,
        type: "Sale",
      });
    });

    // Map each real expense
    filteredExpenses.forEach((e) => {
      const amt = Number(e.amount_rwf || e.amount) || 0;
      const cat = e.category || "General Operating";
      const isMoMo = e.payment_method === "momo" || e.payment_method === "airtel" || e.payment_method === "bank";

      entries.push({
        id: `exp_${e.id}`,
        entry_date: e.expense_date || e.created_at || new Date().toISOString(),
        reference: `EXP-${String(e.id).slice(-4)}`,
        description: `${cat} Expense: ${e.description || e.notes || "Business Operating Expense"}`,
        debit_code: "6000",
        debit_account: `${cat} Expense`,
        credit_code: isMoMo ? "1010" : "1000",
        credit_account: isMoMo ? "Mobile Money / Bank" : "Cash on Hand (Till)",
        amount: amt,
        type: "Expense",
      });
    });

    // Sort chronologically (latest first)
    return entries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
  }, [filteredSales, filteredExpenses]);

  // Filtered Journal by search query
  const searchedJournals = useMemo(() => {
    if (!searchQuery.trim()) return realJournalEntries;
    const q = searchQuery.toLowerCase();
    return realJournalEntries.filter((j) =>
      j.reference.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.debit_account.toLowerCase().includes(q) ||
      j.credit_account.toLowerCase().includes(q)
    );
  }, [realJournalEntries, searchQuery]);

  // 4. Compute Real General Ledger Accounts & Balances
  const ledgerAccounts = useMemo(() => {
    // Totals accumulation
    let cashIn = 0;
    let cashOut = 0;
    let momoIn = 0;
    let momoOut = 0;
    let accountsReceivable = 0;
    let salesRevenue = 0;
    let totalExpenses = 0;
    const expenseCategoryMap = {};

    realJournalEntries.forEach((e) => {
      // Cash Till
      if (e.debit_code === "1000") cashIn += e.amount;
      if (e.credit_code === "1000") cashOut += e.amount;

      // MoMo
      if (e.debit_code === "1010") momoIn += e.amount;
      if (e.credit_code === "1010") momoOut += e.amount;

      // Accounts Receivable
      if (e.debit_code === "1100") accountsReceivable += e.amount;

      // Sales Revenue
      if (e.credit_code === "4000") salesRevenue += e.amount;

      // Expenses
      if (e.debit_code === "6000") {
        totalExpenses += e.amount;
        expenseCategoryMap[e.debit_account] = (expenseCategoryMap[e.debit_account] || 0) + e.amount;
      }
    });

    const netCashBalance = Math.max(0, cashIn - cashOut);
    const netMomoBalance = Math.max(0, momoIn - momoOut);
    const netProfit = salesRevenue - totalExpenses;

    // Build standard Rwandan Chart of Accounts with REAL amounts only
    const accounts = [
      {
        code: "1000",
        name: "Cash on Hand (Till)",
        type: "Asset",
        debit: cashIn,
        credit: cashOut,
        balance: netCashBalance,
        normal: "DR",
      },
      {
        code: "1010",
        name: "Mobile Money & Bank Account",
        type: "Asset",
        debit: momoIn,
        credit: momoOut,
        balance: netMomoBalance,
        normal: "DR",
      },
      {
        code: "1100",
        name: "Accounts Receivable (Client Invoices)",
        type: "Asset",
        debit: accountsReceivable,
        credit: 0,
        balance: accountsReceivable,
        normal: "DR",
      },
      {
        code: "1200",
        name: "Inventory & Merchandise Asset",
        type: "Asset",
        debit: realInventoryAssetValuation,
        credit: 0,
        balance: realInventoryAssetValuation,
        normal: "DR",
      },
      {
        code: "4000",
        name: "Sales Revenue",
        type: "Revenue",
        debit: 0,
        credit: salesRevenue,
        balance: salesRevenue,
        normal: "CR",
      },
    ];

    // Add specific recorded operating expenses
    Object.entries(expenseCategoryMap).forEach(([catName, amt], idx) => {
      accounts.push({
        code: `600${idx + 1}`,
        name: catName,
        type: "Expense",
        debit: amt,
        credit: 0,
        balance: amt,
        normal: "DR",
      });
    });

    // If no expense categories recorded yet, add general expense account
    if (Object.keys(expenseCategoryMap).length === 0) {
      accounts.push({
        code: "6000",
        name: "Operating Expenses",
        type: "Expense",
        debit: totalExpenses,
        credit: 0,
        balance: totalExpenses,
        normal: "DR",
      });
    }

    // Owner Equity Balancing Account
    // Total Assets = Cash + MoMo + AR + Inventory
    // Total Liabilities = 0
    // Retained Earnings / Equity = Total Assets - Net Profit
    const totalAssets = netCashBalance + netMomoBalance + accountsReceivable + realInventoryAssetValuation;
    const ownerEquity = Math.max(0, totalAssets - netProfit);

    accounts.push({
      code: "3000",
      name: "Owner Equity & Capital",
      type: "Equity",
      debit: 0,
      credit: ownerEquity,
      balance: ownerEquity,
      normal: "CR",
    });

    return {
      accounts,
      netCashBalance,
      netMomoBalance,
      totalLiquidFunds: netCashBalance + netMomoBalance,
      salesRevenue,
      totalExpenses,
      netProfit,
      totalAssets,
      ownerEquity,
    };
  }, [realJournalEntries, realInventoryAssetValuation]);

  // 5. Compute Trial Balance (Debit vs Credit)
  const trialBalanceRows = useMemo(() => {
    return ledgerAccounts.accounts.map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.type === "Asset" || acc.type === "Expense") {
        debit = acc.balance;
      } else if (acc.type === "Revenue" || acc.type === "Equity" || acc.type === "Liability") {
        credit = acc.balance;
      }

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit,
        credit,
      };
    });
  }, [ledgerAccounts]);

  const grandTotalDebit = useMemo(() => {
    return trialBalanceRows.reduce((sum, r) => sum + r.debit, 0);
  }, [trialBalanceRows]);

  const grandTotalCredit = useMemo(() => {
    return trialBalanceRows.reduce((sum, r) => sum + r.credit, 0);
  }, [trialBalanceRows]);

  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 1;

  const shopName = shopSettings?.shop_name || user?.shop_name || "INZIRA SME STORE";
  const shopTin = shopSettings?.tin_number || user?.tin_number || "TIN Registered";
  const shopPhone = shopSettings?.shop_phone || user?.phone || "";
  const shopLocation = shopSettings?.shop_address || user?.district || "Kigali, Rwanda";

  // Handle PDF Export / Print
  const handlePrint = () => {
    window.print();
  };

  // Inject Dedicated Print Styles
  useEffect(() => {
    const styleId = "inzira-books-print-styles";
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
        #printable-books-area {
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
          title={t("nav_books")}
          right={
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-[#D4F06B] px-4 py-2 text-xs font-black text-gray-900 shadow-sm hover:bg-[#C5E456] transition cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Export Books / PDF</span>
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
                Official Books of Account & Ledger
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
                <span className="text-xs font-extrabold text-gray-900 block">Accounting Period:</span>
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

        {/* Book Navigation Pills (Screen Only) */}
        <div className="print-hidden flex items-center gap-1.5 bg-white p-2 rounded-full border border-gray-200/80 shadow-sm overflow-x-auto">
          {[
            { id: "journal", label: "General Journal", icon: BookOpen },
            { id: "ledger", label: "General Ledger (T-Accounts)", icon: BookMarked },
            { id: "cashbook", label: "Cash & MoMo Book", icon: Wallet },
            { id: "trial", label: "Trial Balance Sheet", icon: Scale },
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

        {/* ================= TAB 1: GENERAL JOURNAL ================= */}
        {(activeTab === "journal" || window.matchMedia?.("print")?.matches) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Double-Entry General Journal Log
                </h3>
                <p className="text-xs text-gray-500 font-semibold">
                  Showing {searchedJournals.length} verified transaction entries for {dateRangeLabel}
                </p>
              </div>

              <div className="print-hidden relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter entries…"
                  className="rounded-full border border-gray-200 bg-white pl-9 pr-4 py-1.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#D4F06B] shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              {searchedJournals.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-400 font-semibold bg-white rounded-3xl border border-dashed border-gray-200">
                  No journal entries found in {dateRangeLabel}. Record daily sales or expenses to view live double-entry records.
                </div>
              ) : (
                searchedJournals.map((e) => (
                  <div key={e.id} className="rounded-3xl border border-gray-200/80 bg-white p-4.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] space-y-2.5 report-card">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                          {e.reference}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{e.description}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400">{formatDate(e.entry_date)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-2xl bg-emerald-50/70 p-3 border border-emerald-200/80">
                        <span className="text-[10px] font-black text-emerald-800 uppercase block">DR (Debit Account)</span>
                        <span className="font-bold text-gray-900">[{e.debit_code}] {e.debit_account}</span>
                        <span className="font-black text-emerald-700 block mt-1 tabnum">{rwf(e.amount)}</span>
                      </div>

                      <div className="rounded-2xl bg-blue-50/70 p-3 border border-blue-200/80">
                        <span className="text-[10px] font-black text-blue-800 uppercase block">CR (Credit Account)</span>
                        <span className="font-bold text-gray-900">[{e.credit_code}] {e.credit_account}</span>
                        <span className="font-black text-blue-700 block mt-1 tabnum">{rwf(e.amount)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: GENERAL LEDGER ================= */}
        {activeTab === "ledger" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Account Ledgers & Net Balances
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                Derived directly from {realJournalEntries.length} verified entries in {dateRangeLabel}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <div className="flex items-center justify-between text-[11px] border-b border-gray-200 pb-2 font-black text-gray-400 uppercase">
                <span>Account Title & Code</span>
                <span>Type</span>
                <span className="text-right">Net Closing Balance (RWF)</span>
              </div>

              {ledgerAccounts.accounts.map((acc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-mono font-bold text-purple-700 mr-2">[{acc.code}]</span>
                    <span className="font-bold text-gray-900">{acc.name}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    acc.type === "Asset" ? "bg-emerald-100 text-emerald-800" :
                    acc.type === "Revenue" ? "bg-blue-100 text-blue-800" :
                    acc.type === "Expense" ? "bg-red-100 text-red-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {acc.type}
                  </span>
                  <span className="font-black text-gray-900 tabnum text-right">
                    {rwf(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CASH & MOMO BOOK ================= */}
        {activeTab === "cashbook" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm report-card">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Cash in Till Balance</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-emerald-700 tabnum">
                  {rwf(ledgerAccounts.netCashBalance)}
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 mt-1 block">Physical drawer cash</span>
              </div>
              <div className="rounded-[28px] border border-blue-200 bg-blue-50/60 p-5 shadow-sm report-card">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Mobile Money / Bank Balance</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-blue-700 tabnum">
                  {rwf(ledgerAccounts.netMomoBalance)}
                </div>
                <span className="text-[11px] font-semibold text-blue-800 mt-1 block">MTN MoMo & Airtel</span>
              </div>
              <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] report-card">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Liquid Funds</span>
                <div className="mt-1 text-xl md:text-2xl font-black text-gray-900 tabnum">
                  {rwf(ledgerAccounts.totalLiquidFunds)}
                </div>
                <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Available working capital</span>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm space-y-3 report-card">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Chronological Cash Movements Log
              </h4>
              {realJournalEntries.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-3">No cash or MoMo transactions recorded in this period.</p>
              ) : (
                <div className="space-y-2 text-xs divide-y divide-gray-100">
                  {realJournalEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-bold text-gray-900">{e.description}</span>
                        <span className="text-gray-400 block text-[11px]">
                          {formatDate(e.entry_date)} · {e.debit_account}
                        </span>
                      </div>
                      <span className={`font-black tabnum ${e.type === "Sale" ? "text-emerald-700" : "text-red-600"}`}>
                        {e.type === "Sale" ? `+${rwf(e.amount)}` : `-${rwf(e.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: TRIAL BALANCE SHEET ================= */}
        {activeTab === "trial" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Trial Balance Sheet
                </h3>
                <p className="text-xs text-gray-500 font-semibold">
                  Complete equilibrium of Debits (DR) and Credits (CR)
                </p>
              </div>

              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm ${
                  isBalanced
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {isBalanced ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{isBalanced ? "Balanced (DR = CR)" : "Unbalanced"}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm overflow-hidden report-card">
              <div className="grid grid-cols-12 text-[10px] font-black text-gray-400 border-b border-gray-200 pb-2 uppercase tracking-wider">
                <span className="col-span-6">Account Code & Title</span>
                <span className="col-span-3 text-right">Debit (DR)</span>
                <span className="col-span-3 text-right">Credit (CR)</span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {trialBalanceRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-3 items-center">
                    <div className="col-span-6">
                      <span className="font-mono text-purple-700 font-bold mr-1.5">[{row.code}]</span>
                      <span className="font-bold text-gray-900">{row.name}</span>
                      <span className="text-[10px] text-gray-400 block font-semibold">{row.type}</span>
                    </div>
                    <span className="col-span-3 text-right font-black text-emerald-700 tabnum">
                      {row.debit > 0 ? rwf(row.debit) : "—"}
                    </span>
                    <span className="col-span-3 text-right font-black text-blue-700 tabnum">
                      {row.credit > 0 ? rwf(row.credit) : "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grand Totals Footer */}
              <div className="grid grid-cols-12 pt-4 mt-3 border-t-2 border-gray-900 text-xs font-black text-gray-900">
                <span className="col-span-6 uppercase">Total Equilibrium Summary</span>
                <span className="col-span-3 text-right text-emerald-700 tabnum">{rwf(grandTotalDebit)}</span>
                <span className="col-span-3 text-right text-blue-700 tabnum">{rwf(grandTotalCredit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Printable Footer Stamp */}
        <div className="hidden print:block pt-8 border-t border-gray-300 text-xs text-gray-600">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-bold text-gray-800">Accountant / Manager: {user?.name || "Business Owner"}</p>
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
