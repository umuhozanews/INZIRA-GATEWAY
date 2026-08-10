import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileText
} from "lucide-react";
import api from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import { useData } from "../context/DataContext";

export default function ProfitLoss() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { sales, expenses } = useData();

  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("this_month");

  const grossRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const cogs = Math.round(grossRevenue * 0.45);
  const grossProfit = grossRevenue - cogs;
  const operatingExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount_rwf) || 0), 0);
  const netProfit = grossProfit - operatingExpenses;
  const marginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

  const p = {
    grossRevenue,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    marginPct: Number(marginPct),
    salesCount: sales.length,
    expenseCount: expenses.length
  };

  const isNetPositive = p.netProfit >= 0;

  return (
    <div className="min-h-screen bg-paper pb-20">
      <ScreenHeader title={t("nav_pnl")} />

      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Date Filter Bar */}
        <div className="flex items-center justify-between gap-2 bg-card p-1.5 rounded-2xl border border-line shadow-sm">
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-muted">
            <Calendar size={15} /> Period:
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            {[
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "ytd", label: "Year to Date" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  period === item.id
                    ? "bg-primary text-white shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Executive P&L Summary Hero Card */}
        <div
          className={`rounded-3xl border p-6 shadow-2xl space-y-5 transition duration-300 ${
            isNetPositive
              ? "bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 border-emerald-500/30 text-white"
              : "bg-gradient-to-br from-red-950 via-slate-900 to-black border-red-500/30 text-white"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-white/70 uppercase">
                Net Statement Outcome
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-black tracking-tight mt-0.5">
                {isNetPositive ? "Net Profit 🎉" : "Net Loss ⚠️"}
              </h2>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isNetPositive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {isNetPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-white/60 font-medium">Net Income:</span>
              <div className="font-heading text-3xl md:text-4xl font-extrabold tabnum mt-1">
                {rwf(p.netProfit)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/60 font-medium">Profit Margin:</span>
              <div className="text-xl font-bold text-emerald-400 tabnum mt-1">
                {p.marginPct}%
              </div>
            </div>
          </div>

          {/* Visual Profit Ratio Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Gross Sales ({rwf(p.grossRevenue)})</span>
              <span>Expenses & COGS ({rwf((p.cogs || 0) + (p.operatingExpenses || 0))})</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (p.grossProfit / (p.grossRevenue || 1)) * 100))}%` }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (p.operatingExpenses / (p.grossRevenue || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Financial Breakdown Table */}
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-4">
          <h3 className="font-heading text-base font-extrabold text-ink">
            Income Statement Breakdown
          </h3>

          <div className="space-y-2 text-xs divide-y divide-line/60">
            {/* Revenue */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-ink">Gross Sales Revenue</span>
              </div>
              <span className="font-extrabold text-ink tabnum">{rwf(p.grossRevenue)}</span>
            </div>

            {/* COGS */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 pl-4">
                <span className="text-muted">• Less: Cost of Goods Sold (COGS)</span>
              </div>
              <span className="font-bold text-muted tabnum">- {rwf(p.cogs)}</span>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="flex items-center justify-between py-3 bg-paper px-3 rounded-xl">
              <span className="font-bold text-ink uppercase tracking-wider">Gross Profit</span>
              <span className="font-extrabold text-emerald-700 tabnum">{rwf(p.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 pl-4">
                <span className="text-muted">• Less: Operating Expenses</span>
              </div>
              <span className="font-bold text-muted tabnum">- {rwf(p.operatingExpenses)}</span>
            </div>

            {/* Net Income Final */}
            <div className="flex items-center justify-between pt-3 pb-1 border-t-2 border-line">
              <span className="font-heading text-sm font-black text-ink uppercase">Net Profit / (Loss)</span>
              <span className={`font-heading text-base font-black tabnum ${isNetPositive ? "text-emerald-600" : "text-danger"}`}>
                {rwf(p.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/sell")}
            className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card hover:border-primary/50 transition cursor-pointer shadow-card group"
          >
            <div>
              <span className="text-xs font-bold text-ink group-hover:text-primary transition">Sales Transactions</span>
              <p className="text-[11px] text-muted">{p.salesCount || 0} sales recorded</p>
            </div>
            <ArrowUpRight size={18} className="text-muted group-hover:text-primary" />
          </button>

          <button
            onClick={() => navigate("/expenses")}
            className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card hover:border-primary/50 transition cursor-pointer shadow-card group"
          >
            <div>
              <span className="text-xs font-bold text-ink group-hover:text-primary transition">Expenses Entries</span>
              <p className="text-[11px] text-muted">{p.expenseCount || 0} expenses recorded</p>
            </div>
            <ArrowUpRight size={18} className="text-muted group-hover:text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}
