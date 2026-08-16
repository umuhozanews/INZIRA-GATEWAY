import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  AlertTriangle,
  PieChart,
  Layers,
  CheckCircle2
} from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import { useData } from "../context/DataContext";

export default function ProfitLoss() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { sales, expenses, stock } = useData();

  const [period, setPeriod] = useState("this_month");

  const grossRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

  const stockCostMap = useMemo(() => {
    const map = {};
    (stock || []).forEach((s) => {
      if (s.id) map[String(s.id)] = Number(s.cost_price_rwf) || 0;
    });
    return map;
  }, [stock]);

  const cogs = useMemo(() => {
    let totalCost = 0;
    (sales || []).forEach((s) => {
      const items = s.items || [];
      items.forEach((item) => {
        const qty = Number(item.quantity || item.qty) || 1;
        const knownCost = Number(item.cost_price_rwf) || (item.stock_item_id ? stockCostMap[String(item.stock_item_id)] : 0);
        const unitCost = knownCost > 0 ? knownCost : Math.round((Number(item.unit_price || item.price) || 0) * 0.60);
        totalCost += unitCost * qty;
      });
    });
    return Math.round(totalCost);
  }, [sales, stockCostMap]);

  const grossProfit = grossRevenue - cogs;
  const operatingExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount_rwf || e.amount) || 0), 0);
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
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader title={t("nav_pnl")} />

      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Period Selector Tabs */}
        <div className="flex items-center justify-between gap-2 bg-card p-1.5 rounded-xl border border-line shadow-sm font-heading">
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-muted">
            <Calendar size={15} className="text-primary" /> Period:
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            {[
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "ytd", label: "Year to Date" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  period === item.id
                    ? "bg-primary text-white shadow-orange-sm font-extrabold"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Executive P&L Hero Card */}
        <div className="rounded-2xl p-6 md:p-7 border border-line bg-card shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4 font-heading">
            <div>
              <span className="text-[11px] font-black tracking-widest text-primary uppercase">
                Net Statement Outcome
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-ink flex items-center gap-2">
                {isNetPositive ? "Net Income" : "Net Loss"}
              </h2>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-card-hover text-primary"
            >
              {isNetPositive ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            </div>
          </div>

          <div className="flex items-end justify-between font-heading">
            <div>
              <span className="text-xs text-muted font-bold uppercase tracking-wider">Net Amount:</span>
              <div className="text-3xl md:text-4xl font-black tabnum mt-1 text-ink">
                {rwf(p.netProfit)} RWF
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted font-bold uppercase tracking-wider">Margin:</span>
              <div className="text-xl font-black tabnum mt-1 text-ink">
                {p.marginPct}%
              </div>
            </div>
          </div>

          {/* Visual Profit Ratio Bar */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between text-xs font-heading font-semibold text-muted">
              <span>Gross Sales ({rwf(p.grossRevenue)} RWF)</span>
              <span>Costs & COGS ({rwf((p.cogs || 0) + (p.operatingExpenses || 0))} RWF)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-card-hover border border-line overflow-hidden flex p-0.5">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (p.grossProfit / (p.grossRevenue || 1)) * 100))}%` }}
              />
              <div
                className="bg-muted h-full rounded-full transition-all duration-500 ml-0.5"
                style={{ width: `${Math.min(100, Math.max(10, (p.operatingExpenses / (p.grossRevenue || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Income Statement Breakdown Table Card */}
        <div className="rounded-2xl border border-line bg-card p-6 shadow-card space-y-4">
          <h3 className="font-heading text-base font-black text-ink tracking-tight">
            Income Statement Breakdown
          </h3>

          <div className="space-y-3 text-xs font-body">
            {/* Revenue */}
            <div className="flex items-center justify-between py-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="font-heading font-extrabold text-ink">Gross Sales Revenue</span>
              </div>
              <span className="font-heading font-black text-ink tabnum text-sm">{rwf(p.grossRevenue)} RWF</span>
            </div>

            {/* COGS */}
            <div className="flex items-center justify-between py-2.5 border-b border-line pl-4">
              <span className="font-medium text-muted">• Less: Cost of Goods Sold (COGS)</span>
              <span className="font-heading font-bold text-muted tabnum">- {rwf(p.cogs)} RWF</span>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="flex items-center justify-between py-3.5 bg-card-hover px-4 rounded-xl border border-line">
              <span className="font-heading font-extrabold text-ink uppercase tracking-wider text-[11px]">Gross Profit</span>
              <span className="font-heading font-black text-ink tabnum text-sm">{rwf(p.grossProfit)} RWF</span>
            </div>

            {/* Operating Expenses */}
            <div className="flex items-center justify-between py-2.5 border-b border-line pl-4">
              <span className="font-medium text-muted">• Less: Operating Expenses</span>
              <span className="font-heading font-bold text-muted tabnum">- {rwf(p.operatingExpenses)} RWF</span>
            </div>

            {/* Net Income Final */}
            <div className="flex items-center justify-between pt-4 pb-1">
              <span className="font-heading text-sm font-black text-ink uppercase">Net Profit / (Loss)</span>
              <span className="font-heading text-lg font-black tabnum text-ink">
                {rwf(p.netProfit)} RWF
              </span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-3 font-heading">
          <button
            onClick={() => navigate("/sell")}
            className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card hover:border-primary/40 transition cursor-pointer text-left group"
          >
            <div>
              <span className="text-xs font-black text-ink group-hover:text-primary transition">Sales Transactions</span>
              <p className="text-[11px] text-muted font-body mt-0.5">{p.salesCount || 0} sales recorded</p>
            </div>
            <ArrowUpRight size={18} className="text-muted group-hover:text-primary transition" />
          </button>

          <button
            onClick={() => navigate("/expenses")}
            className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card hover:border-primary/40 transition cursor-pointer text-left group"
          >
            <div>
              <span className="text-xs font-black text-ink group-hover:text-primary transition">Expenses Entries</span>
              <p className="text-[11px] text-muted font-body mt-0.5">{p.expenseCount || 0} expenses recorded</p>
            </div>
            <ArrowUpRight size={18} className="text-muted group-hover:text-primary transition" />
          </button>
        </div>

      </div>
    </div>
  );
}
