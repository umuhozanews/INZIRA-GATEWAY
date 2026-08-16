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

  // Load registered SME merchants for underwriting
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get("/admin/smes");
        const list = res.data?.smes || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setBorrowers(list);
        } else {
          // Fallback realistic borrower dataset for Rwandan financial institutions
          setBorrowers(getMockBorrowers(user, sales, expenses, stock));
        }
      } catch (err) {
        setBorrowers(getMockBorrowers(user, sales, expenses, stock));
      } finally {
        setLoading(false);
      }

      // Load active loan facilities
      try {
        const savedLoans = localStorage.getItem("inzira_institutional_loans");
        if (savedLoans) {
          setLoans(JSON.parse(savedLoans));
        } else {
          setLoans(getMockLoans());
        }
      } catch {}
    }
    loadData();
  }, [user, sales, expenses, stock]);

  // Compute Institutional KPIs
  const kpis = useMemo(() => {
    const totalSmes = borrowers.length;
    const avgScore = borrowers.length > 0
      ? Math.round(borrowers.reduce((sum, b) => sum + (b.health_score || 75), 0) / borrowers.length)
      : 78;
    const gradeACount = borrowers.filter(b => (b.health_score || 75) >= 80).length;
    const totalPreApproved = borrowers.reduce((sum, b) => sum + (Number(b.pre_approved_limit) || 2500000), 0);
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
              <span>{activeInstitution?.name || "Financial Institution"} &bull; Lending Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink tracking-tight">
              SME Portfolio Credit & Underwriting
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Automated credit evaluation, verifiable sales turnover analytics, and instant working capital loan pre-approvals for Rwandan micro & small retail enterprises.
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
          <div className="mt-2 text-2xl font-black text-ink tabnum">{kpis.avgScore} <span className="text-xs text-muted">/ 100</span></div>
          <span className="text-[11px] text-primary font-black block mt-0.5">
            High Quality (SACCO Grade A)
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
            {loans.filter(l => l.status === "active").length} active loan facilities
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
                Prime SME Underwriting Queue
              </h2>
              <p className="text-xs text-muted">SME stores with verified till turnover and active SACCO data sharing consent</p>
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
            {borrowers.slice(0, 4).map((b) => {
              const score = b.health_score || 78;
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
                        {(b.shop_name || b.name || "SME").slice(0, 2).toUpperCase()}
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
                        <span className="text-xs font-black text-ink tabnum">{rwf(b.monthly_sales || 1850000)} RWF</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted uppercase block">Health Score</span>
                        <span className="text-xs font-black text-primary tabnum">{score}/100</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted uppercase block">Max Loan Offer</span>
                        <span className="text-xs font-black text-ink tabnum">{rwf(b.pre_approved_limit || 2500000)} RWF</span>
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
            })}
          </div>
        </div>

        {/* Right Column (Lending Risk Breakdown & Institutional Policies) */}
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
                  {borrowers.filter(b => (b.health_score || 75) >= 80).length} SMEs
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-card-hover flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Tier 2: Standard (Score 60–79)</span>
                  <span className="text-[11px] text-muted font-medium">Pre-approval with stock collateral verification</span>
                </div>
                <span className="text-xs font-heading font-black text-muted px-2 py-0.5 rounded bg-card border border-line">
                  {borrowers.filter(b => (b.health_score || 75) >= 60 && (b.health_score || 75) < 80).length} SMEs
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-card-hover flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Tier 3: Watchlist (Score &lt; 60)</span>
                  <span className="text-[11px] text-muted font-medium">Requires business advisor recommendation</span>
                </div>
                <span className="text-xs font-heading font-black text-muted px-2 py-0.5 rounded bg-card border border-line">
                  {borrowers.filter(b => (b.health_score || 75) < 60).length} SMEs
                </span>
              </div>
            </div>
          </div>

          {/* District Exposure Distribution */}
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-heading">
            <h3 className="text-xs font-black text-ink uppercase tracking-wider">
              District Allocation
            </h3>
            <div className="space-y-2 text-xs font-body">
              {[
                { district: "Gasabo (Kigali)", percent: "42%", count: "8 Stores" },
                { district: "Nyarugenge (CBD / Market)", percent: "31%", count: "6 Stores" },
                { district: "Kicukiro (Kigali)", percent: "18%", count: "3 Stores" },
                { district: "Musanze & Huye", percent: "9%", count: "2 Stores" },
              ].map((d) => (
                <div key={d.district} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                  <span className="font-medium text-ink">{d.district}</span>
                  <div className="flex items-center gap-2 font-heading">
                    <span className="text-muted text-[11px]">{d.count}</span>
                    <span className="font-black text-primary">{d.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock dataset generator for Rwandan SMEs when server is offline
function getMockBorrowers(user, sales = [], expenses = [], stock = []) {
  const userScore = computeHealthScoreFromData({ sales, expenses, stock })?.score || 82;
  const userRev = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

  return [
    {
      id: user?.id || "sme_current_user",
      name: user?.name || "Merchant Owner",
      shop_name: user?.shop_name || "Active Inzira Store",
      district: user?.district || "Nyarugenge",
      sector: user?.sector || "Retail & Wholesale",
      health_score: userScore,
      monthly_sales: Math.max(1200000, userRev || 2400000),
      pre_approved_limit: Math.max(1500000, Math.round((userRev || 2400000) * 0.8)),
      stock_valuation: 4200000,
      ebm_verified: true,
      phone: user?.phone || "+250 788 123 456",
    },
    {
      id: "sme_kgl_02",
      name: "Emmanuel Habimana",
      shop_name: "Kigali Provisions & FMCG Ltd",
      district: "Gasabo",
      sector: "Groceries & FMCG",
      health_score: 88,
      monthly_sales: 3800000,
      pre_approved_limit: 4500000,
      stock_valuation: 8500000,
      ebm_verified: true,
      phone: "+250 788 345 678",
    },
    {
      id: "sme_kgl_03",
      name: "Jeanne Mukamana",
      shop_name: "Mukamana Hardware & Tools",
      district: "Nyarugenge",
      sector: "Hardware & Construction",
      health_score: 79,
      monthly_sales: 2900000,
      pre_approved_limit: 3000000,
      stock_valuation: 6200000,
      ebm_verified: true,
      phone: "+250 788 901 234",
    },
    {
      id: "sme_kgl_04",
      name: "Patrick Ndayisaba",
      shop_name: "Ndayisaba Pharmacy & Cosmetics",
      district: "Kicukiro",
      sector: "Pharmacy & Health",
      health_score: 91,
      monthly_sales: 5200000,
      pre_approved_limit: 6500000,
      stock_valuation: 11000000,
      ebm_verified: true,
      phone: "+250 788 567 890",
    },
    {
      id: "sme_kgl_05",
      name: "Alice Uwamahoro",
      shop_name: "Uwamahoro Fashion & Textiles",
      district: "Musanze",
      sector: "Apparel & Textiles",
      health_score: 68,
      monthly_sales: 1450000,
      pre_approved_limit: 1500000,
      stock_valuation: 3100000,
      ebm_verified: false,
      phone: "+250 788 234 567",
    }
  ];
}

function getMockLoans() {
  return [
    {
      id: "LN-2024-001",
      borrower_name: "Emmanuel Habimana",
      shop_name: "Kigali Provisions & FMCG Ltd",
      product: "Working Capital Advance",
      principal: 3000000,
      repaid_amount: 1500000,
      balance: 1500000,
      interest_rate: "14%",
      term_months: 3,
      disbursed_date: "2024-07-15",
      due_date: "2024-10-15",
      status: "active",
    },
    {
      id: "LN-2024-002",
      borrower_name: "Patrick Ndayisaba",
      shop_name: "Ndayisaba Pharmacy & Cosmetics",
      product: "Inventory Purchase Credit",
      principal: 5000000,
      repaid_amount: 5000000,
      balance: 0,
      interest_rate: "13.5%",
      term_months: 6,
      disbursed_date: "2024-02-01",
      due_date: "2024-08-01",
      status: "settled",
    }
  ];
}
