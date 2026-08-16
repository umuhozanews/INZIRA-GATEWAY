import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  TrendingUp,
  Boxes,
  Send,
  Phone,
  MapPin,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact } from "../../lib/format";
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
  const [loanProduct, setLoanProduct] = useState("Working Capital Advance");
  const [principalAmount, setPrincipalAmount] = useState("1000000");
  const [termMonths, setTermMonths] = useState(3);
  const [interestRate, setInterestRate] = useState("13.5");
  const [disbursing, setDisbursing] = useState(false);

  useEffect(() => {
    async function loadSme() {
      try {
        const res = await api.get(`/admin/smes/${smeId}`);
        if (res.data?.sme || res.data) setDbSme(res.data.sme || res.data);
      } catch {
        try {
          const all = await api.get("/admin/smes");
          const list = all.data?.smes || all.data || [];
          const found = list.find((s) => s.id === smeId || s._id === smeId);
          if (found) setDbSme(found);
        } catch {}
      }
    }
    if (smeId && smeId !== "sme_current_user" && smeId !== user?.id) {
      loadSme();
    }
  }, [smeId, user?.id]);

  const userScoreObj = computeHealthScoreFromData({ sales, expenses, stock });
  const userRev = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const userExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount_rwf || e.amount) || 0), 0);
  const userStockVal = stock.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unit_cost_rwf || i.cost_price_rwf || 0))), 0);

  const sme = useMemo(() => {
    if (dbSme) {
      return {
        id: dbSme.id || smeId,
        name: dbSme.name || "SME Owner",
        shop_name: dbSme.shop_name || dbSme.name || "SME Store",
        district: dbSme.district || "Kigali",
        sector: dbSme.sector || "General Retail",
        phone: dbSme.phone || "N/A",
        health_score: dbSme.health_score || 70,
        monthly_sales: Number(dbSme.monthly_sales || dbSme.total_sales) || 0,
        monthly_expenses: Number(dbSme.monthly_expenses || dbSme.total_expenses) || 0,
        stock_valuation: Number(dbSme.stock_valuation) || 0,
        ebm_verified: Boolean(dbSme.ebm_verified || dbSme.tin_number),
      };
    }

    return {
      id: user?.id || "sme_current_user",
      name: user?.name || "Store Owner",
      shop_name: user?.shop_name || "My Store",
      district: user?.district || "Kigali",
      sector: user?.sector || "General Retail",
      phone: user?.phone || "N/A",
      health_score: userScoreObj.score || 0,
      monthly_sales: userRev,
      monthly_expenses: userExpensesTotal,
      stock_valuation: userStockVal,
      ebm_verified: Boolean(user?.tin_number),
    };
  }, [dbSme, smeId, user, userScoreObj.score, userRev, userExpensesTotal, userStockVal]);

  useEffect(() => {
    if (sme.monthly_sales > 0) {
      setPrincipalAmount(String(Math.round(sme.monthly_sales * 0.8)));
    }
  }, [sme.monthly_sales]);

  const loanCalculations = useMemo(() => {
    const p = Number(principalAmount) || 0;
    const r = (Number(interestRate) || 13.5) / 100;
    const totalInterest = Math.round(p * r * (termMonths / 12));
    const totalRepayable = p + totalInterest;
    const monthlyInstalment = Math.round(totalRepayable / Math.max(1, termMonths));

    return { principal: p, totalInterest, totalRepayable, monthlyInstalment };
  }, [principalAmount, interestRate, termMonths]);

  const handleDisburseLoan = async (e) => {
    e.preventDefault();
    if (loanCalculations.principal <= 0) return toast.error("Enter valid principal amount.");

    setDisbursing(true);
    try {
      const newFacility = {
        id: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        institution_id: activeInstitution?.id || "sacco_umwalimu",
        institution_name: activeInstitution?.name || "Institution",
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
      };

      const existing = JSON.parse(localStorage.getItem("inzira_institutional_loans") || "[]");
      localStorage.setItem("inzira_institutional_loans", JSON.stringify([newFacility, ...existing]));

      toast.success(`Disbursed ${rwf(loanCalculations.principal)} RWF to ${sme.shop_name}!`);
      setTimeout(() => navigate("/institution/loans"), 500);
    } catch {
      toast.error("Failed to disburse facility.");
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 font-body text-ink">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between font-heading">
        <button
          onClick={() => navigate("/institution/borrowers")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-line hover:bg-card-hover text-xs font-bold text-ink cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
          Health Score: {sme.health_score}/100
        </span>
      </div>

      {/* SME Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-line bg-card shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-heading font-black text-base shadow-orange-sm">
            {(sme.shop_name || "SM").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-heading font-black text-ink truncate leading-tight">
              {sme.shop_name}
            </h2>
            <p className="text-xs text-muted mt-0.5 truncate">
              {sme.name} &bull; {sme.district} &bull; {sme.phone}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Quick Underwriting KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-heading">
        <div className="p-3.5 rounded-2xl bg-card border border-line">
          <span className="text-[10px] text-muted font-bold uppercase block">Monthly Sales</span>
          <span className="text-sm font-black text-ink tabnum">{rwfCompact(sme.monthly_sales)} RWF</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-line">
          <span className="text-[10px] text-muted font-bold uppercase block">Expenses</span>
          <span className="text-sm font-black text-ink tabnum">{rwfCompact(sme.monthly_expenses)} RWF</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-line">
          <span className="text-[10px] text-muted font-bold uppercase block">Stock Value</span>
          <span className="text-sm font-black text-ink tabnum">{rwfCompact(sme.stock_valuation)} RWF</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-card border border-line">
          <span className="text-[10px] text-muted font-bold uppercase block">Limit Offer</span>
          <span className="text-sm font-black text-primary tabnum">{rwfCompact(Math.round(sme.monthly_sales * 0.8))} RWF</span>
        </div>
      </div>

      {/* Interactive Loan Underwriter Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-line bg-card shadow-card font-heading space-y-4">
        <h3 className="text-xs font-black text-ink uppercase tracking-wider">
          Issue Credit Line
        </h3>

        <form onSubmit={handleDisburseLoan} className="space-y-3.5 font-body">
          <div className="space-y-1 font-heading">
            <label className="text-[11px] font-bold text-muted uppercase">Product</label>
            <select
              value={loanProduct}
              onChange={(e) => setLoanProduct(e.target.value)}
              className="w-full bg-paper border border-line text-ink text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="Working Capital Advance">Working Capital Advance</option>
              <option value="Inventory Purchase Credit">Inventory Purchase Credit</option>
              <option value="Invoice Factoring">Invoice Factoring Line</option>
            </select>
          </div>

          <div className="space-y-1 font-heading">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted uppercase">Principal (RWF)</label>
              <span className="text-xs font-black text-primary tabnum">{rwf(loanCalculations.principal)} RWF</span>
            </div>
            <input
              type="number"
              step="50000"
              min="50000"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-sm font-black text-ink focus:outline-none focus:border-primary font-heading tabnum"
            />
          </div>

          <div className="space-y-1 font-heading">
            <label className="text-[11px] font-bold text-muted uppercase">Tenure</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTermMonths(m)}
                  className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                    termMonths === m
                      ? "bg-primary text-white border-primary shadow-orange-sm"
                      : "bg-paper border-line text-muted hover:text-ink"
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          {/* Repayment Summary */}
          <div className="p-3.5 rounded-xl bg-card-hover border border-line font-heading space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted">
              <span>Monthly Repayment:</span>
              <span className="font-black text-ink tabnum">{rwf(loanCalculations.monthlyInstalment)} RWF</span>
            </div>
            <div className="flex items-center justify-between font-black text-ink pt-1 border-t border-line">
              <span>Total Repayable:</span>
              <span className="text-primary tabnum">{rwf(loanCalculations.totalRepayable)} RWF</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={disbursing}
            className="btn-kinetic w-full py-3 text-xs font-black cursor-pointer shadow-orange-sm flex items-center justify-center gap-2 font-heading"
          >
            <Send size={15} />
            <span>{disbursing ? "Disbursing..." : `Disburse ${rwf(loanCalculations.principal)} RWF`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
