import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Users,
  BadgeDollarSign,
  TrendingUp,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Sparkles,
  Plus
} from "lucide-react";
import api from "../../lib/api";
import { rwf, rwfCompact } from "../../lib/format";
import { computeHealthScoreFromData } from "../../lib/score";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function InstitutionOverview() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};
  const { user } = useAuth();
  const { sales, expenses, stock } = useData();

  const [borrowers, setBorrowers] = useState([]);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    async function loadData() {
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
      } catch {
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
      }

      try {
        const savedLoans = localStorage.getItem("inzira_institutional_loans");
        if (savedLoans) setLoans(JSON.parse(savedLoans));
        else setLoans([]);
      } catch {
        setLoans([]);
      }
    }
    loadData();
  }, [user, sales, expenses, stock]);

  const kpis = useMemo(() => {
    const totalSmes = borrowers.length;
    const avgScore = borrowers.length > 0
      ? Math.round(borrowers.reduce((sum, b) => sum + (b.health_score || 0), 0) / borrowers.length)
      : 0;
    const totalPreApproved = borrowers.reduce((sum, b) => sum + (Number(b.pre_approved_limit) || 0), 0);
    const activeDeployed = loans.filter(l => l.status === "active").reduce((sum, l) => sum + (Number(l.principal) || 0), 0);

    return { totalSmes, avgScore, totalPreApproved, activeDeployed };
  }, [borrowers, loans]);

  return (
    <div className="p-4 sm:p-6 space-y-4 font-body text-ink">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between font-heading">
        <div>
          <h1 className="text-xl font-black text-ink tracking-tight">
            Portfolio Credit
          </h1>
          <p className="text-xs text-muted">
            {activeInstitution?.name || "Institution"} Underwriting Desk
          </p>
        </div>

        <button
          onClick={() => navigate("/institution/borrowers")}
          className="btn-kinetic flex items-center gap-1.5 px-3.5 py-2 text-xs font-black cursor-pointer"
        >
          <Users size={14} />
          <span>Underwrite</span>
        </button>
      </div>

      {/* KPI Cards Strip (Matching Dashboard.jsx 2x2 grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-heading">
        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Borrowers</span>
          <div className="mt-1 text-2xl font-black text-ink tabnum">{kpis.totalSmes}</div>
          <span className="text-[10px] text-primary font-black block mt-0.5">Live Merchants</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Pre-Approved</span>
          <div className="mt-1 text-2xl font-black text-ink tabnum">{rwfCompact(kpis.totalPreApproved)} RWF</div>
          <span className="text-[10px] text-muted font-bold block mt-0.5">Ready Limit</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Avg Health Score</span>
          <div className="mt-1 text-2xl font-black text-primary tabnum">{kpis.avgScore > 0 ? kpis.avgScore : "--"}/100</div>
          <span className="text-[10px] text-muted font-bold block mt-0.5">Turnover Rating</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider block">Active Capital</span>
          <div className="mt-1 text-2xl font-black text-ink tabnum">{rwfCompact(kpis.activeDeployed)} RWF</div>
          <span className="text-[10px] text-muted font-bold block mt-0.5">{loans.filter(l => l.status === "active").length} Active Facilities</span>
        </div>
      </div>

      {/* Underwriting Queue */}
      <div className="rounded-2xl border border-line bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line font-heading">
          <span className="text-xs font-black text-ink uppercase tracking-wider">
            SME Borrowers ({borrowers.length})
          </span>
          <button
            onClick={() => navigate("/institution/borrowers")}
            className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-line">
          {borrowers.length === 0 ? (
            <div className="p-8 text-center text-muted font-medium text-xs">
              No live SME merchant records found.
            </div>
          ) : (
            borrowers.slice(0, 5).map((b) => {
              const score = b.health_score || 0;
              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/institution/assessment/${b.id}`)}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-card-hover transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-line text-ink font-heading font-black text-xs group-hover:border-primary/40 transition">
                      {(b.shop_name || b.name || "SM").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 font-body">
                      <h4 className="text-xs font-heading font-black text-ink group-hover:text-primary transition truncate">
                        {b.shop_name || b.name}
                      </h4>
                      <p className="text-[11px] text-muted truncate">
                        {b.district || "Kigali"} &bull; {rwfCompact(b.monthly_sales || 0)} RWF sales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-heading">
                    <div className="text-right">
                      <span className="text-xs font-black text-primary tabnum block">{score}/100</span>
                      <span className="text-[10px] text-muted tabnum">{rwfCompact(b.pre_approved_limit || 0)} RWF</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-card-hover text-muted group-hover:text-ink">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
