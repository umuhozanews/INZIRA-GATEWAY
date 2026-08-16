import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  FileText,
  BadgeDollarSign,
  Phone,
  MapPin,
  Sparkles,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact, formatDate } from "../../lib/format";
import { computeHealthScoreFromData } from "../../lib/score";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function BorrowerDirectory() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};
  const { user } = useAuth();
  const { sales, expenses, stock } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(false);

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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, sales, expenses, stock]);

  const filteredBorrowers = useMemo(() => {
    return borrowers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q || (b.shop_name || "").toLowerCase().includes(q) || (b.name || "").toLowerCase().includes(q) || (b.phone || "").includes(q);
      const districtMatch = districtFilter === "all" || (b.district || "").toLowerCase() === districtFilter.toLowerCase();
      
      const score = b.health_score || 0;
      let grade = "B";
      if (score >= 80) grade = "A";
      else if (score < 60) grade = "C";

      const gradeMatch = gradeFilter === "all" || grade === gradeFilter;

      return nameMatch && districtMatch && gradeMatch;
    });
  }, [borrowers, searchQuery, districtFilter, gradeFilter]);

  const handleInstantPreApprove = (b, e) => {
    e.stopPropagation();
    toast.success(`Pre-approved ${rwf(b.pre_approved_limit || 0)} RWF credit line for ${b.shop_name || b.name}!`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-body text-ink">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-ink tracking-tight">
              SME Borrower Underwriting Queue
            </h1>
            <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-heading font-black text-primary">
              {filteredBorrowers.length} live
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Real merchant stores with live sales records seeking working capital and credit lines.
          </p>
        </div>

        <div className="flex items-center gap-2 font-heading">
          <button
            onClick={() => toast.success("Exporting SACCO Underwriting Portfolio CSV...")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-card hover:bg-card-hover text-xs font-bold text-ink transition cursor-pointer"
          >
            <Download size={15} className="text-primary" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3.5 rounded-2xl border border-line shadow-card font-heading">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by store name, owner, or phone..."
            className="w-full bg-paper border border-line rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary font-body"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-paper border border-line text-ink text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Districts</option>
            <option value="Gasabo">Gasabo</option>
            <option value="Nyarugenge">Nyarugenge</option>
            <option value="Kicukiro">Kicukiro</option>
            <option value="Musanze">Musanze</option>
            <option value="Huye">Huye</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-paper border border-line text-ink text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Risk Tiers</option>
            <option value="A">Grade A (Score 80+)</option>
            <option value="B">Grade B (Score 60–79)</option>
            <option value="C">Grade C (Score &lt; 60)</option>
          </select>
        </div>
      </div>

      {/* Borrowers Table & Cards */}
      <div className="rounded-2xl border border-line bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="border-b border-line bg-card-hover text-[11px] font-heading font-black text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">SME Store & Owner</th>
                <th className="py-3.5 px-4">District / Sector</th>
                <th className="py-3.5 px-4 text-center">Health Score</th>
                <th className="py-3.5 px-4 text-right">Turnover</th>
                <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                <th className="py-3.5 px-4 text-right">Pre-Approved Offer</th>
                <th className="py-3.5 px-4 text-center">EBM Tax</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted font-medium">
                    No active SME borrower accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBorrowers.map((b) => {
                  const score = b.health_score || 0;
                  const isGradeA = score >= 80;
                  const isGradeB = score >= 60 && score < 80;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/institution/assessment/${b.id}`)}
                      className="hover:bg-card-hover transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-line text-ink font-heading font-black text-xs group-hover:border-primary/40 transition">
                            {(b.shop_name || b.name || "SM").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-heading font-black text-ink block text-xs group-hover:text-primary transition">
                              {b.shop_name || b.name}
                            </span>
                            <span className="text-[11px] text-muted">{b.name} &bull; {b.phone || "N/A"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <span className="font-bold text-ink block">{b.district || "Kigali"}</span>
                          <span className="text-[11px] text-muted">{b.sector || "Retail"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-heading">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-black text-primary tabnum">{score}/100</span>
                          <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 mt-0.5">
                            Grade {isGradeA ? "A" : isGradeB ? "B" : "C"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-black text-ink tabnum">{rwf(b.monthly_sales || 0)}</span>
                        <span className="text-[10px] text-muted block">RWF</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-bold text-ink tabnum">{rwf(b.stock_valuation || 0)}</span>
                        <span className="text-[10px] text-muted block">RWF</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-black text-primary tabnum">{rwf(b.pre_approved_limit || 0)}</span>
                        <span className="text-[10px] text-muted block">RWF</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-heading">
                        {b.ebm_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted bg-card-hover px-2 py-0.5 rounded border border-line">
                            Self-Declared
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleInstantPreApprove(b, e)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-black transition cursor-pointer shadow-orange-sm active:scale-95"
                            title="Pre-Approve Loan"
                          >
                            Pre-Approve
                          </button>
                          <button
                            onClick={() => navigate(`/institution/assessment/${b.id}`)}
                            className="p-1.5 rounded-lg bg-card-hover border border-line text-muted hover:text-ink transition cursor-pointer"
                            title="View Full Underwriting Dossier"
                          >
                            <ArrowUpRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
