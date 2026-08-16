import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BadgeDollarSign,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import { rwf, rwfCompact } from "../../lib/format";
import Sheet from "../../components/Sheet";

export default function LoanFacilities() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};

  const [loans, setLoans] = useState(() => {
    try {
      const saved = localStorage.getItem("inzira_institutional_loans");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [repayModalLoan, setRepayModalLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("inzira_institutional_loans", JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (l.shop_name || "").toLowerCase().includes(q) || (l.borrower_name || "").toLowerCase().includes(q) || (l.id || "").toLowerCase().includes(q);
      const matchTab = activeTab === "all" || l.status === activeTab;
      return matchQuery && matchTab;
    });
  }, [loans, searchQuery, activeTab]);

  const handleRecordRepayment = (e) => {
    e.preventDefault();
    if (!repayModalLoan) return;
    const amt = Number(repayAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid repayment amount.");

    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === repayModalLoan.id) {
          const newRepaid = (Number(l.repaid_amount) || 0) + amt;
          const newBalance = Math.max(0, (Number(l.total_repayable || l.principal) || 0) - newRepaid);
          const newStatus = newBalance <= 0 ? "settled" : "active";
          return {
            ...l,
            repaid_amount: newRepaid,
            balance: newBalance,
            status: newStatus,
          };
        }
        return l;
      })
    );

    toast.success(`Repayment of ${rwf(amt)} RWF recorded!`);
    setRepayModalLoan(null);
    setRepayAmount("");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 font-body text-ink">
      {/* Top Bar */}
      <div className="flex items-center justify-between font-heading">
        <div>
          <h1 className="text-xl font-black text-ink tracking-tight">
            Loan Facilities
          </h1>
          <p className="text-xs text-muted">
            {loans.filter(l => l.status === "active").length} Active Credit Lines
          </p>
        </div>

        <button
          onClick={() => navigate("/institution/borrowers")}
          className="btn-kinetic flex items-center gap-1.5 px-3 py-2 text-xs font-black cursor-pointer"
        >
          <Plus size={14} />
          <span>New Facility</span>
        </button>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-2 font-heading">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility or shop..."
            className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none font-body"
          />
        </div>

        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-line text-xs font-bold w-full sm:w-auto">
          {["all", "active", "settled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-white shadow-orange-sm font-black"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Cards (Mobile-first) */}
      <div className="space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-line bg-card text-muted text-xs font-medium">
            No loan facilities found. Disburse from borrower directory to track here.
          </div>
        ) : (
          filteredLoans.map((l) => {
            const isSettled = l.status === "settled";
            return (
              <div
                key={l.id}
                className="p-4 rounded-2xl border border-line bg-card shadow-card space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-heading">
                      <span className="font-mono text-[10.5px] font-bold text-muted">{l.id}</span>
                      <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded uppercase ${
                        isSettled ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary text-white"
                      }`}>
                        {isSettled ? "Settled" : "Active"}
                      </span>
                    </div>
                    <h3 className="text-sm font-heading font-black text-ink mt-0.5">
                      {l.shop_name}
                    </h3>
                    <p className="text-[11px] text-muted">{l.borrower_name} &bull; {l.product}</p>
                  </div>

                  <div className="text-right font-heading">
                    <span className="text-sm font-black text-ink tabnum block">{rwf(l.principal)} RWF</span>
                    <span className="text-[10px] text-muted block">{l.term_months}M @ {l.interest_rate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between font-heading">
                  <div className="text-xs">
                    <span className="text-muted block text-[10px]">Due Balance:</span>
                    <span className="font-black text-primary tabnum">{rwf(l.balance)} RWF</span>
                  </div>

                  {!isSettled && (
                    <button
                      onClick={() => {
                        setRepayModalLoan(l);
                        setRepayAmount(String(l.monthly_instalment || Math.min(l.balance, 500000)));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm active:scale-95"
                    >
                      Record Repay
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Repayment Modal */}
      <Sheet
        open={Boolean(repayModalLoan)}
        onClose={() => setRepayModalLoan(null)}
        title={repayModalLoan ? `Repayment: ${repayModalLoan.id}` : "Loan Repayment"}
      >
        {repayModalLoan && (
          <form onSubmit={handleRecordRepayment} className="space-y-4 pt-2 font-body pb-6 text-ink">
            <div className="p-3.5 rounded-xl bg-card-hover border border-line font-heading">
              <span className="text-xs font-bold text-muted block">{repayModalLoan.shop_name}</span>
              <span className="text-sm font-black text-primary tabnum block mt-0.5">Balance: {rwf(repayModalLoan.balance)} RWF</span>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Amount (RWF)</label>
              <input
                type="number"
                min="1000"
                max={repayModalLoan.balance}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-sm font-black text-ink focus:outline-none focus:border-primary font-heading tabnum"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-kinetic w-full py-3 text-xs font-black cursor-pointer shadow-orange-sm font-heading"
            >
              Confirm Repayment
            </button>
          </form>
        )}
      </Sheet>
    </div>
  );
}
