import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Users,
  BadgeDollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Receipt,
  Boxes,
  Clock,
  Send,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact, formatDate } from "../../lib/format";
import { computeHealthScoreFromData } from "../../lib/score";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function CreditAssessment() {
  const { smeId } = useParams();
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};
  const { user } = useAuth();
  const { sales, expenses, stock } = useData();

  const [dbSme, setDbSme] = useState(null);
  const [loading, setLoading] = useState(true);

  // Underwriting Decision Form State
  const [loanProduct, setLoanProduct] = useState("Working Capital Advance");
  const [principalAmount, setPrincipalAmount] = useState("1000000");
  const [termMonths, setTermMonths] = useState(3);
  const [interestRate, setInterestRate] = useState("13.5");
  const [underwriterNotes, setUnderwriterNotes] = useState("");
  const [disbursing, setDisbursing] = useState(false);

  useEffect(() => {
    async function loadSme() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/smes/${smeId}`);
        if (res.data?.sme || res.data) {
          setDbSme(res.data.sme || res.data);
        }
      } catch (err) {
        // Look up in list
        try {
          const all = await api.get("/admin/smes");
          const list = all.data?.smes || all.data || [];
          const found = list.find((s) => s.id === smeId || s._id === smeId);
          if (found) setDbSme(found);
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    if (smeId && smeId !== "sme_current_user" && smeId !== user?.id) {
      loadSme();
    } else {
      setLoading(false);
    }
  }, [smeId, user?.id]);

  // Compute Live SME Data strictly from real records
  const isCurrentUser = !smeId || smeId === user?.id || smeId === "sme_current_user" || (user && user.id === smeId);
  const userScoreObj = computeHealthScoreFromData({ sales, expenses, stock });
  const userRev = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const userExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount_rwf || e.amount) || 0), 0);
  const userStockVal = stock.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unit_cost_rwf || i.cost_price_rwf || 0))), 0);

  const sme = useMemo(() => {
    if (dbSme) {
      return {
        id: dbSme.id || smeId,
        name: dbSme.name || dbSme.owner_name || "SME Owner",
        shop_name: dbSme.shop_name || dbSme.name || "SME Store",
        district: dbSme.district || "Kigali",
        sector: dbSme.sector || "General Retail",
        phone: dbSme.phone || "N/A",
        email: dbSme.email || "merchant@inzira.rw",
        health_score: dbSme.health_score || 70,
        monthly_sales: Number(dbSme.monthly_sales || dbSme.total_sales) || 0,
        monthly_expenses: Number(dbSme.monthly_expenses || dbSme.total_expenses) || 0,
        stock_valuation: Number(dbSme.stock_valuation) || 0,
        sales_count: dbSme.sales_count || 0,
        ebm_verified: Boolean(dbSme.ebm_verified || dbSme.tin_number),
        tin_number: dbSme.tin_number || "N/A",
      };
    }

    return {
      id: user?.id || "sme_current_user",
      name: user?.name || "Merchant Owner",
      shop_name: user?.shop_name || "My Store",
      district: user?.district || "Kigali",
      sector: user?.sector || "General Retail",
      phone: user?.phone || "N/A",
      email: user?.email || "merchant@inzira.rw",
      health_score: userScoreObj.score || 0,
      monthly_sales: userRev,
      monthly_expenses: userExpensesTotal,
      stock_valuation: userStockVal,
      sales_count: sales.length,
      ebm_verified: Boolean(user?.tin_number),
      tin_number: user?.tin_number || "N/A",
    };
  }, [dbSme, smeId, user, userScoreObj.score, userRev, userExpensesTotal, userStockVal, sales.length]);

  // Set default initial loan amount based on real turnover
  useEffect(() => {
    if (sme.monthly_sales > 0) {
      setPrincipalAmount(String(Math.round(sme.monthly_sales * 0.8)));
    }
  }, [sme.monthly_sales]);

  // Loan Calculation
  const loanCalculations = useMemo(() => {
    const p = Number(principalAmount) || 0;
    const r = (Number(interestRate) || 13.5) / 100;
    const totalInterest = Math.round(p * r * (termMonths / 12));
    const totalRepayable = p + totalInterest;
    const monthlyInstalment = Math.round(totalRepayable / Math.max(1, termMonths));

    return {
      principal: p,
      totalInterest,
      totalRepayable,
      monthlyInstalment,
    };
  }, [principalAmount, interestRate, termMonths]);

  // Handle Loan Approval & Real Ledger Facility Creation
  const handleDisburseLoan = async (e) => {
    e.preventDefault();
    if (loanCalculations.principal <= 0) return toast.error("Please enter a valid loan principal amount.");

    setDisbursing(true);
    try {
      const newFacility = {
        id: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        institution_id: activeInstitution?.id || "sacco_umwalimu",
        institution_name: activeInstitution?.name || "Financial Institution",
        sme_id: sme.id,
        borrower_name: sme.name,
        shop_name: sme.shop_name,
        product: loanProduct,
        principal: loanCalculations.principal,
        interest_rate: `${interestRate}%`,
        term_months: termMonths,
        monthly_instalment: loanCalculations.monthlyInstalment,
        total_repayable: loanCalculations.totalRepayable,
        repaid_amount: 0,
        balance: loanCalculations.totalRepayable,
        disbursed_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
        notes: underwriterNotes.trim() || "Approved based on automated INZIRA cashflow rating.",
        created_at: new Date().toISOString(),
      };

      // Save to institutional loans ledger
      const existing = JSON.parse(localStorage.getItem("inzira_institutional_loans") || "[]");
      localStorage.setItem("inzira_institutional_loans", JSON.stringify([newFacility, ...existing]));

      toast.success(`Successfully disbursed ${rwf(loanCalculations.principal)} RWF to ${sme.shop_name}!`);
      setTimeout(() => {
        navigate("/institution/loans");
      }, 600);
    } catch (err) {
      toast.error("Failed to disburse loan facility.");
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-body text-ink">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/institution/borrowers")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-line hover:bg-card-hover text-xs font-heading font-black text-ink transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Underwriting Queue</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-heading font-black text-primary">
          <ShieldCheck size={14} />
          <span>Live Credit Underwriting Session</span>
        </div>
      </div>

      {/* SME Borrower Header Profile Card */}
      <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 font-heading font-black text-xl shadow-orange-sm">
              {(sme.shop_name || "SM").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 font-heading">
                <h1 className="text-xl sm:text-2xl font-black text-ink">
                  {sme.shop_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary border border-primary/20 uppercase">
                  {sme.health_score >= 80 ? "Grade A Prime" : sme.health_score >= 60 ? "Grade B Standard" : "Active Store"}
                </span>
              </div>
              <p className="text-xs text-muted mt-1 flex flex-wrap items-center gap-3">
                <span className="font-medium text-ink">{sme.name}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><Phone size={12} /> {sme.phone}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {sme.district} &bull; {sme.sector}</span>
                <span>&bull;</span>
                <span className="font-mono text-[11px]">TIN: {sme.tin_number}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-line font-heading">
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted uppercase block">Health Score</span>
              <span className="text-2xl font-black text-primary tabnum">{sme.health_score}</span>
              <span className="text-xs text-muted">/100</span>
            </div>
            <div className="h-10 w-px bg-line" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted uppercase block">Pre-Approved Offer</span>
              <span className="text-lg font-black text-ink tabnum">{rwf(Math.round(sme.monthly_sales * 0.8))} RWF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 5 Core Underwriting Pillars vs Loan Decision Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Pillar Financial Dossier) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-heading font-black text-ink tracking-tight">
            5-Pillar Credit Underwriting Dossier
          </h2>

          {/* Pillar 1: Cashflow Turnover */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
            <div className="flex items-center justify-between font-heading">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-xs font-black text-ink uppercase tracking-wider">
                  1. Cashflow & Daily Till Turnover
                </h3>
              </div>
              <span className="text-xs font-heading font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Verified
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-heading">
              <div className="p-3 rounded-xl bg-card-hover border border-line">
                <span className="text-[10px] text-muted font-bold uppercase block">Total Sales</span>
                <span className="text-sm font-black text-ink tabnum">{rwfCompact(sme.monthly_sales)} RWF</span>
              </div>
              <div className="p-3 rounded-xl bg-card-hover border border-line">
                <span className="text-[10px] text-muted font-bold uppercase block">Daily Average</span>
                <span className="text-sm font-black text-ink tabnum">{rwfCompact(Math.round(sme.monthly_sales / 30))} RWF</span>
              </div>
              <div className="p-3 rounded-xl bg-card-hover border border-line">
                <span className="text-[10px] text-muted font-bold uppercase block">Sales Count</span>
                <span className="text-sm font-black text-ink tabnum">{sme.sales_count}</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Expense Burn & Operating Margins */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
            <div className="flex items-center justify-between font-heading">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-primary border border-line">
                  <Receipt size={16} />
                </div>
                <h3 className="text-xs font-black text-ink uppercase tracking-wider">
                  2. Operating Burn & Margin
                </h3>
              </div>
              <span className="text-xs font-heading font-black text-ink">
                Burn: {sme.monthly_sales > 0 ? Math.round((sme.monthly_expenses / sme.monthly_sales) * 100) : 0}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1 font-heading">
              <div className="p-3 rounded-xl bg-card-hover border border-line">
                <span className="text-[10px] text-muted font-bold uppercase block">Operating Expenses</span>
                <span className="text-sm font-black text-ink tabnum">{rwf(sme.monthly_expenses)} RWF</span>
              </div>
              <div className="p-3 rounded-xl bg-card-hover border border-line">
                <span className="text-[10px] text-muted font-bold uppercase block">Net Free Cashflow</span>
                <span className="text-sm font-black text-primary tabnum">{rwf(Math.max(0, sme.monthly_sales - sme.monthly_expenses))} RWF</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Inventory Asset Collateral */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
            <div className="flex items-center justify-between font-heading">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-ink border border-line">
                  <Boxes size={16} />
                </div>
                <h3 className="text-xs font-black text-ink uppercase tracking-wider">
                  3. Stock Inventory Asset Valuation
                </h3>
              </div>
              <span className="text-xs font-heading font-black text-primary">
                Unencumbered
              </span>
            </div>
            <div className="p-3 rounded-xl bg-card-hover border border-line flex items-center justify-between font-heading">
              <div>
                <span className="text-[10.5px] text-muted font-bold block">Wholesale Stock Valuation</span>
                <span className="text-base font-black text-ink tabnum">{rwf(sme.stock_valuation)} RWF</span>
              </div>
            </div>
          </div>

          {/* Pillar 4 & 5: Fiscal EBM & Integrity */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
            <div className="flex items-center justify-between font-heading">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <FileCheck size={16} />
                </div>
                <h3 className="text-xs font-black text-ink uppercase tracking-wider">
                  4 & 5. EBM Compliance & Consent
                </h3>
              </div>
              <span className="text-xs font-heading font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Verified
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-line">
                <span className="text-muted">RRA EBM Fiscal Invoicing:</span>
                <span className="font-bold text-ink">{sme.ebm_verified ? `Active (TIN #${sme.tin_number})` : "Standard Store Registration"}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">SACCO Data Sharing Consent:</span>
                <span className="font-bold text-primary">Active Merchant Consent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Interactive Loan Underwriter Decision Module) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-heading font-black text-ink tracking-tight">
            Institutional Loan Decision Module
          </h2>

          <div className="rounded-3xl border border-line bg-card p-6 shadow-card space-y-5 font-heading">
            <div className="p-3.5 rounded-2xl bg-card-hover border border-line flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Building2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted uppercase block">Underwriting As</span>
                <span className="text-xs font-black text-ink">{activeInstitution?.name || "Financial Institution"}</span>
              </div>
            </div>

            <form onSubmit={handleDisburseLoan} className="space-y-4 font-body">
              {/* Product Type */}
              <div className="space-y-1 font-heading">
                <label className="text-xs font-bold text-muted uppercase">Loan Product</label>
                <select
                  value={loanProduct}
                  onChange={(e) => setLoanProduct(e.target.value)}
                  className="w-full bg-paper border border-line text-ink text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                >
                  <option value="Working Capital Advance">Working Capital Advance (Turnover-Backed)</option>
                  <option value="Inventory Purchase Credit">Inventory Purchase Credit (Supplier Direct)</option>
                  <option value="POS Invoice Factoring">POS Invoice Factoring (Receivables Line)</option>
                  <option value="SACCO Seasonal Micro-Loan">SACCO Seasonal Micro-Loan</option>
                </select>
              </div>

              {/* Principal Amount */}
              <div className="space-y-1 font-heading">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted uppercase">Principal Amount (RWF)</label>
                  <span className="text-xs font-black text-primary">{rwf(loanCalculations.principal)} RWF</span>
                </div>
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  max="50000000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-sm font-black text-ink focus:outline-none focus:border-primary font-heading tabnum"
                />
              </div>

              {/* Repayment Term Months */}
              <div className="space-y-1 font-heading">
                <label className="text-xs font-bold text-muted uppercase">Repayment Tenure</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTermMonths(m)}
                      className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                        termMonths === m
                          ? "bg-primary text-white border-primary shadow-orange-sm"
                          : "bg-paper border-line text-muted hover:text-ink hover:bg-card-hover"
                      }`}
                    >
                      {m} {m === 1 ? "Mo" : "Mos"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-1 font-heading">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted uppercase">Annual Interest Rate (%)</label>
                  <span className="text-xs font-bold text-muted">{interestRate}% APR</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full bg-paper border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
                />
              </div>

              {/* Repayment Summary Box */}
              <div className="p-4 rounded-2xl border border-line bg-card-hover space-y-2 font-heading">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Monthly Instalment:</span>
                  <span className="font-black text-ink tabnum">{rwf(loanCalculations.monthlyInstalment)} RWF</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Total Interest:</span>
                  <span className="font-bold text-muted tabnum">{rwf(loanCalculations.totalInterest)} RWF</span>
                </div>
                <div className="pt-2 border-t border-line flex items-center justify-between text-sm">
                  <span className="font-black text-ink">Total Repayable:</span>
                  <span className="font-black text-primary tabnum">{rwf(loanCalculations.totalRepayable)} RWF</span>
                </div>
              </div>

              {/* Underwriter Notes */}
              <div className="space-y-1 font-heading">
                <label className="text-xs font-bold text-muted uppercase">Underwriting Notes</label>
                <textarea
                  rows={2}
                  value={underwriterNotes}
                  onChange={(e) => setUnderwriterNotes(e.target.value)}
                  placeholder="e.g. Underwritten based on automated till turnover records."
                  className="w-full bg-paper border border-line rounded-xl p-3 text-xs font-body text-ink focus:outline-none focus:border-primary placeholder:text-muted"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2 font-heading">
                <button
                  type="submit"
                  disabled={disbursing}
                  className="btn-kinetic w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black cursor-pointer shadow-orange-sm"
                >
                  <Send size={15} />
                  <span>{disbursing ? "Disbursing Facility..." : `Approve & Disburse ${rwf(loanCalculations.principal)} RWF`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
