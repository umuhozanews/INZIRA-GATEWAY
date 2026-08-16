import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Building2,
  Users,
  BadgeDollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Search,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  MapPin,
  Briefcase
} from "lucide-react";
import api from "../../lib/api";
import { rwf, rwfCompact, formatDate } from "../../lib/format";
import { computeHealthScoreFromData } from "../../lib/score";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function InstitutionOverview() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};
  const { user } = useAuth();
  const { sales, expenses, stock } = useData();

  const [loading, setLoading] = useState(false);
  const [borrowers, setBorrowers] = useState([]);
  const [loans, setLoans] = useState([]);

  // Load real registered SME merchants from database / data context
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get("/admin/smes");
        const list = res.data?.smes || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setBorrowers(list);
        } else if (user && (sales.length > 0 || stock.length > 0)) {
          const userScoreObj = computeHealthScoreFromData({ sales, expenses, stock });
          const userRev = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
          const userStockVal = stock.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unit_cost_rwf || i.cost_price_rwf || 0))), 0);
          
          setBorrowers([
            {
              id: user.id || "sme_current_user",
              name: user.name || "Store Owner",
              shop_name: user.shop_name || "Active Store",
              district: user.district || "Kigali",
              sector: user.sector || "General Retail",
              health_score: userScoreObj.score || 70,
              monthly_sales: userRev,
              pre_approved_limit: Math.round(userRev * 0.8),
              stock_valuation: userStockVal,
              ebm_verified: Boolean(user.tin_number),
              phone: user.phone || "N/A",
            }
          ]);
        } else {
          setBorrowers([]);
        }
      } catch (err) {
        if (user && (sales.length > 0 || stock.length > 0)) {
          const userScoreObj = computeHealthScoreFromData({ sales, expenses, stock });
          const userRev = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
          const userStockVal = stock.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.unit_cost_rwf || i.cost_price_rwf || 0))), 0);
          setBorrowers([
            {
              id: user.id || "sme_current_user",
              name: user.name || "Store Owner",
              shop_name: user.shop_name || "Active Store",
              district: user.district || "Kigali",
              sector: user.sector || "General Retail",
              health_score: userScoreObj.score || 70,
              monthly_sales: userRev,
              pre_approved_limit: Math.round(userRev * 0.8),
              stock_valuation: userStockVal,
              ebm_verified: Boolean(user.tin_number),
              phone: user.phone || "N/A",
            }
          ]);
        } else {
          setBorrowers([]);
        }
      } finally {
        setLoading(false);
      }

      // Load active loan facilities strictly from real records
      try {
        const savedLoans = localStorage.getItem("inzira_institutional_loans");
        if (savedLoans) {
          setLoans(JSON.parse(savedLoans));
        } else {
          setLoans([]);
        }
      } catch {
        setLoans([]);
      }
    }
    loadData();
  }, [user, sales, expenses, stock]);

  // Compute Real Institutional KPIs
  const kpis = useMemo(() => {
    const totalSmes = borrowers.length;
    const avgScore = borrowers.length > 0
      ? Math.round(borrowers.reduce((sum, b) => sum + (b.health_score || 0), 0) / borrowers.length)
      : 0;
    const gradeACount = borrowers.filter(b => (b.health_score || 0) >= 80).length;
    const totalPreApproved = borrowers.reduce((sum, b) => sum + (Number(b.pre_approved_limit) || 0), 0);
    const activeDeployed = loans.filter(l => l.status === "active").reduce((sum, l) => sum + (Number(l.principal) || 0), 0);
    const totalRepaid = loans.reduce((sum, l) => sum + (Number(l.repaid_amount) || 0), 0);

    return {
      totalSmes,
      avgScore,
      gradeACount,
      totalPreApproved,
      activeDeployed,
      totalRepaid,
    };
  }, [borrowers, loans]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-body text-ink">
      {/* Institutional Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 md:p-8 shadow-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-card-hover border border-line text-[11px] font-heading font-black text-primary uppercase tracking-wider">
              <Building2 size={14} />
              <span>{activeInstitution?.name || "Financial Institution"} &bull; Live Lending Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink tracking-tight">
              SME Portfolio Credit & Underwriting
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Real-time cashflow analytics, automated till scoring, and loan facility underwriting connected directly to live Rwandan merchant accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0 font-heading">
            <button
              onClick={() => navigate("/institution/borrowers")}
              className="btn-kinetic flex items-center gap-2 px-5 py-3 text-xs font-black cursor-pointer select-none"
            >
              <Users size={15} />
              <span>Underwriting Queue</span>
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={() => navigate("/institution/loans")}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-line bg-card hover:bg-card-hover text-ink text-xs font-bold transition cursor-pointer"
            >
              <BadgeDollarSign size={15} className="text-primary" />
              <span>Loan Facilities</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-heading">
        {/* Card 1: Eligible Borrowers */}
        <div className="p-4.5 rounded-2xl border border-line bg-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">SME Borrowers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-ink tabnum">{kpis.totalSmes}</div>
          <span className="text-[11px] text-primary font-bold block mt-0.5">
            {kpis.gradeACount} Grade A prime candidates
          </span>
        </div>

        {/* Card 2: Pre-Approved Pipeline */}
        <div className="p-4.5 rounded-2xl border border-line bg-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Pre-Approved Capital</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-ink border border-line">
              <BadgeDollarSign size={16} className="text-primary" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-ink tabnum">{rwfCompact(kpis.totalPreApproved)} RWF</div>
          <span className="text-[11px] text-muted font-medium block mt-0.5">
            Avg {rwfCompact(Math.round(kpis.totalPreApproved / Math.max(1, kpis.totalSmes)))} RWF / store
          </span>
        </div>

        {/* Card 3: Portfolio Health Rating */}
        <div className="p-4.5 rounded-2xl border border-line bg-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Portfolio Health Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-ink tabnum">{kpis.avgScore > 0 ? kpis.avgScore : "--"} <span className="text-xs text-muted">/ 100</span></div>
          <span className="text-[11px] text-primary font-black block mt-0.5">
            {kpis.avgScore >= 80 ? "Grade A Prime" : kpis.avgScore >= 60 ? "Grade B Standard" : "Active Portfolio"}
          </span>
        </div>

        {/* Card 4: Active Capital Deployed */}
        <div className="p-4.5 rounded-2xl border border-line bg-card shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Active Deployed Capital</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-ink border border-line">
              <Briefcase size={16} className="text-primary" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-ink tabnum">{rwfCompact(kpis.activeDeployed)} RWF</div>
          <span className="text-[11px] text-muted font-medium block mt-0.5">
            {loans.filter(l => l.status === "active").length} active facilities
          </span>
        </div>
      </div>

      {/* Main Grid: Priority Underwriting Queue & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Underwriting Queue Highlights) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between font-heading">
            <div>
              <h2 className="text-base font-black text-ink tracking-tight">
                Live SME Underwriting Queue
              </h2>
              <p className="text-xs text-muted">Verified merchant accounts with live till activity</p>
            </div>
            <button
              onClick={() => navigate("/institution/borrowers")}
              className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({borrowers.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {borrowers.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-line text-muted bg-card">
                <Users size={28} className="mx-auto text-muted mb-2 opacity-50" />
                <p className="font-heading font-bold text-ink text-sm">No SME Borrowers in Queue Yet</p>
                <p className="text-xs mt-1">When merchant stores record sales, their till analytics and credit scores will appear here automatically.</p>
              </div>
            ) : (
              borrowers.slice(0, 4).map((b) => {
                const score = b.health_score || 0;
                const isGradeA = score >= 80;
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/institution/assessment/${b.id}`)}
                    className="p-4 rounded-2xl border border-line bg-card shadow-card hover:border-primary/40 transition cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-hover text-ink font-heading font-black text-sm border border-line group-hover:border-primary/40 transition">
                          {(b.shop_name || b.name || "SM").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 font-body">
                          <div className="flex items-center gap-2 font-heading">
                            <h3 className="text-sm font-black text-ink group-hover:text-primary transition truncate">
                              {b.shop_name || b.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                              {isGradeA ? "Grade A" : "Grade B"}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {b.district || "Kigali"}</span>
                            <span>&bull;</span>
                            <span>{b.sector || "General Retail"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-line font-heading">
                        <div>
                          <span className="text-[10px] font-bold text-muted uppercase block">Monthly Sales</span>
                          <span className="text-xs font-black text-ink tabnum">{rwf(b.monthly_sales || 0)} RWF</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted uppercase block">Health Score</span>
                          <span className="text-xs font-black text-primary tabnum">{score}/100</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted uppercase block">Pre-Approved Offer</span>
                          <span className="text-xs font-black text-ink tabnum">{rwf(b.pre_approved_limit || 0)} RWF</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/institution/assessment/${b.id}`);
                          }}
                          className="p-2 rounded-xl bg-card-hover border border-line text-muted group-hover:text-primary transition cursor-pointer"
                          title="Underwrite Loan"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (Lending Risk Breakdown) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Institutional Credit Bands */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-4 font-heading">
            <h3 className="text-xs font-black text-ink uppercase tracking-wider">
              Portfolio Risk Tiers
            </h3>
            
            <div className="space-y-3 font-body">
              <div className="p-3 rounded-xl border border-line bg-card-hover flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Tier 1: Prime (Score 80–100)</span>
                  <span className="text-[11px] text-muted font-medium">Instant pre-approval up to 5M RWF</span>
                </div>
                <span className="text-xs font-heading font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {borrowers.filter(b => (b.health_score || 0) >= 80).length} SMEs
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-card-hover flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Tier 2: Standard (Score 60–79)</span>
                  <span className="text-[11px] text-muted font-medium">Pre-approval with stock collateral verification</span>
                </div>
                <span className="text-xs font-heading font-black text-muted px-2 py-0.5 rounded bg-card border border-line">
                  {borrowers.filter(b => (b.health_score || 0) >= 60 && (b.health_score || 0) < 80).length} SMEs
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-card-hover flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Tier 3: Watchlist (Score &lt; 60)</span>
                  <span className="text-[11px] text-muted font-medium">Requires business advisor recommendation</span>
                </div>
                <span className="text-xs font-heading font-black text-muted px-2 py-0.5 rounded bg-card border border-line">
                  {borrowers.filter(b => (b.health_score || 0) < 60).length} SMEs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
