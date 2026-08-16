import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Search,
  Users,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact } from "../../lib/format";
import { computeHealthScoreFromData } from "../../lib/score";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function BorrowerDirectory() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};
  const { user } = useAuth();
  const { sales, expenses, stock } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [borrowers, setBorrowers] = useState([]);

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
    }
    loadData();
  }, [user, sales, expenses, stock]);

  const filteredBorrowers = useMemo(() => {
    return borrowers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      return !q || (b.shop_name || "").toLowerCase().includes(q) || (b.name || "").toLowerCase().includes(q) || (b.phone || "").includes(q);
    });
  }, [borrowers, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-4 font-body text-ink">
      {/* Top Header */}
      <div className="flex items-center justify-between font-heading">
        <div>
          <h1 className="text-xl font-black text-ink tracking-tight">
            Borrower Directory
          </h1>
          <p className="text-xs text-muted">
            {filteredBorrowers.length} Registered Merchant Borrowers
          </p>
        </div>
      </div>

      {/* Search Input (Matching Stock.jsx) */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search merchant, shop name, phone..."
          className="w-full rounded-2xl border border-line bg-card py-2.5 pl-10 pr-4 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none font-body"
        />
      </div>

      {/* Borrower List Cards (Mobile-first responsive cards) */}
      <div className="space-y-2.5">
        {filteredBorrowers.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-line bg-card text-muted text-xs">
            No borrowers found.
          </div>
        ) : (
          filteredBorrowers.map((b) => {
            const score = b.health_score || 0;
            return (
              <div
                key={b.id}
                onClick={() => navigate(`/institution/assessment/${b.id}`)}
                className="p-4 rounded-2xl border border-line bg-card hover:border-primary/40 transition cursor-pointer shadow-card group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card-hover border border-line text-ink font-heading font-black text-sm group-hover:border-primary/40 transition">
                      {(b.shop_name || b.name || "SM").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 font-body">
                      <div className="flex items-center gap-2 font-heading">
                        <h3 className="text-sm font-black text-ink group-hover:text-primary transition truncate">
                          {b.shop_name || b.name}
                        </h3>
                        {b.ebm_verified && (
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                            EBM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {b.name} &bull; {b.district || "Kigali"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-heading">
                    <div className="text-right">
                      <span className="text-sm font-black text-primary tabnum block">{score}/100</span>
                      <span className="text-[10.5px] text-ink font-bold tabnum block">{rwf(b.pre_approved_limit || 0)} RWF</span>
                    </div>
                    <div className="p-2 rounded-xl bg-card-hover text-muted group-hover:text-ink">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
