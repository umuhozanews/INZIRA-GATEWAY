import { useState, useMemo, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BadgeDollarSign,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  ArrowUpRight,
  MessageSquare,
  DollarSign,
  Download,
  Plus,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { rwf, rwfCompact, formatDate } from "../../lib/format";
import Sheet from "../../components/Sheet";

const DEFAULT_LOANS = [
  {
    id: "LN-2024-814",
    institution_id: "sacco_umwalimu",
    institution_name: "Umwalimu SACCO",
    sme_id: "sme_current_user",
    borrower_name: "Merchant Owner",
    shop_name: "Active Inzira Store",
    product: "Working Capital Advance",
    principal: 2500000,
    interest_rate: "13.5%",
    term_months: 3,
    monthly_instalment: 861458,
    total_repayable: 2584375,
    repaid_amount: 861458,
    balance: 1722917,
    disbursed_date: "2024-07-20",
    due_date: "2024-10-20",
    status: "active",
    notes: "Approved based on automated till turnover.",
  },
  {
    id: "LN-2024-001",
    institution_id: "sacco_umwalimu",
    institution_name: "Umwalimu SACCO",
    sme_id: "sme_kgl_02",
    borrower_name: "Emmanuel Habimana",
    shop_name: "Kigali Provisions & FMCG Ltd",
    product: "Working Capital Advance",
    principal: 3000000,
    interest_rate: "14%",
    term_months: 3,
    monthly_instalment: 1035000,
    total_repayable: 3105000,
    repaid_amount: 2070000,
    balance: 1035000,
    disbursed_date: "2024-06-15",
    due_date: "2024-09-15",
    status: "active",
    notes: "Regular weekly turnover repayments.",
  },
  {
    id: "LN-2024-002",
    institution_id: "sacco_umwalimu",
    institution_name: "Umwalimu SACCO",
    sme_id: "sme_kgl_04",
    borrower_name: "Patrick Ndayisaba",
    shop_name: "Ndayisaba Pharmacy & Cosmetics",
    product: "Inventory Purchase Credit",
    principal: 5000000,
    interest_rate: "13.5%",
    term_months: 6,
    monthly_instalment: 889583,
    total_repayable: 5337500,
    repaid_amount: 5337500,
    balance: 0,
    disbursed_date: "2024-02-01",
    due_date: "2024-08-01",
    status: "settled",
    notes: "Fully paid in full ahead of schedule.",
  }
];

export default function LoanFacilities() {
  const navigate = useNavigate();
  const { activeInstitution } = useOutletContext() || {};

  const [loans, setLoans] = useState(() => {
    try {
      const saved = localStorage.getItem("inzira_institutional_loans");
      return saved ? JSON.parse(saved) : DEFAULT_LOANS;
    } catch {
      return DEFAULT_LOANS;
    }
  });

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'settled'
  const [searchQuery, setSearchQuery] = useState("");

  // Repayment Modal
  const [repayModalLoan, setRepayModalLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("momo");

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("inzira_institutional_loans", JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  // Compute Portfolio KPIs
  const stats = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, l) => sum + (Number(l.principal) || 0), 0);
    const totalRepaid = loans.reduce((sum, l) => sum + (Number(l.repaid_amount) || 0), 0);
    const totalOutstanding = loans.filter(l => l.status === "active").reduce((sum, l) => sum + (Number(l.balance) || 0), 0);
    const activeCount = loans.filter(l => l.status === "active").length;
    const settledCount = loans.filter(l => l.status === "settled").length;

    return {
      totalPrincipal,
      totalRepaid,
      totalOutstanding,
      activeCount,
      settledCount,
    };
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
    if (isNaN(amt) || amt <= 0) return toast.error("Please enter a valid repayment amount.");

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

    toast.success(`Recorded repayment of ${rwf(amt)} RWF for ${repayModalLoan.id}!`);
    setRepayModalLoan(null);
    setRepayAmount("");
  };

  const handleSendReminder = (l) => {
    toast.success(`WhatsApp reminder sent to ${l.borrower_name} (${l.shop_name}) for due balance of ${rwf(l.balance)} RWF!`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-body text-ink">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-ink tracking-tight">
              Active Loan Facilities & Repayments
            </h1>
            <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-heading font-black text-primary">
              {loans.length} facilities
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Track active loan balances, scheduled monthly instalments, and mobile money collections for {activeInstitution?.name || "Institution"}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-heading">
          <button
            onClick={() => navigate("/institution/borrowers")}
            className="btn-kinetic flex items-center gap-2 px-4 py-2.5 text-xs font-black cursor-pointer"
          >
            <Plus size={15} />
            <span>New Facility</span>
          </button>
          <button
            onClick={() => toast.success("Exporting Loan Ledger CSV...")}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-card hover:bg-card-hover text-xs font-bold text-ink transition cursor-pointer"
          >
            <Download size={15} className="text-primary" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-heading">
        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Capital Deployed</span>
          <div className="mt-1 text-2xl font-black text-ink tabnum">{rwfCompact(stats.totalPrincipal)} RWF</div>
          <span className="text-[10.5px] text-muted font-medium block mt-0.5">{loans.length} total loans</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Repaid Collections</span>
          <div className="mt-1 text-2xl font-black text-primary tabnum">{rwfCompact(stats.totalRepaid)} RWF</div>
          <span className="text-[10.5px] text-primary font-bold block mt-0.5">100% on-time rate</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Outstanding Principal</span>
          <div className="mt-1 text-2xl font-black text-ink tabnum">{rwfCompact(stats.totalOutstanding)} RWF</div>
          <span className="text-[10.5px] text-muted font-medium block mt-0.5">{stats.activeCount} active facilities</span>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card shadow-card">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Portfolio Status</span>
          <div className="mt-1 text-2xl font-black text-primary tabnum">{stats.settledCount} Settled</div>
          <span className="text-[10.5px] text-primary font-bold block mt-0.5">0 Overdue &bull; 0 Defaults</span>
        </div>
      </div>

      {/* Search & Tabs Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-line shadow-card font-heading">
        <div className="flex items-center gap-1.5 bg-paper p-1 rounded-xl border border-line text-xs font-bold overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Facilities", count: loans.length },
            { id: "active", label: "Active Loans", count: stats.activeCount },
            { id: "settled", label: "Settled / Paid", count: stats.settledCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-orange-sm font-black"
                  : "text-muted hover:text-ink hover:bg-card-hover"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility ID or merchant..."
            className="w-full bg-paper border border-line rounded-xl pl-8 pr-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary font-body"
          />
        </div>
      </div>

      {/* Facilities Table */}
      <div className="rounded-2xl border border-line bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="border-b border-line bg-card-hover text-[11px] font-heading font-black text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Facility ID</th>
                <th className="py-3.5 px-4">Borrower & Shop</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4 text-right">Principal</th>
                <th className="py-3.5 px-4 text-right">Repaid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted font-medium">
                    No loan facilities found.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((l) => {
                  const isSettled = l.status === "settled";
                  return (
                    <tr key={l.id} className="hover:bg-card-hover transition">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-ink">
                        {l.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-heading font-black text-ink block text-xs">
                          {l.shop_name}
                        </span>
                        <span className="text-[11px] text-muted">{l.borrower_name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-ink block">{l.product}</span>
                        <span className="text-[10px] text-muted">{l.term_months} mos @ {l.interest_rate}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-black text-ink tabnum">{rwf(l.principal)}</span>
                        <span className="text-[10px] text-muted block">RWF</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-bold text-primary tabnum">{rwf(l.repaid_amount)}</span>
                        <span className="text-[10px] text-muted block">RWF</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <span className="font-black text-ink tabnum">{rwf(l.balance)}</span>
                        <span className="text-[10px] text-muted block">RWF due</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-heading">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            <CheckCircle2 size={11} /> Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-primary px-2 py-0.5 rounded shadow-orange-sm">
                            <Clock size={11} /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-heading">
                        <div className="flex items-center justify-end gap-2">
                          {!isSettled && (
                            <>
                              <button
                                onClick={() => {
                                  setRepayModalLoan(l);
                                  setRepayAmount(String(l.monthly_instalment || Math.min(l.balance, 500000)));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-black transition cursor-pointer shadow-orange-sm active:scale-95"
                                title="Record Repayment"
                              >
                                Repay
                              </button>
                              <button
                                onClick={() => handleSendReminder(l)}
                                className="p-1.5 rounded-lg bg-card-hover border border-line text-muted hover:text-primary transition cursor-pointer"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageSquare size={14} />
                              </button>
                            </>
                          )}
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

      {/* Record Repayment Modal Sheet */}
      <Sheet
        open={Boolean(repayModalLoan)}
        onClose={() => setRepayModalLoan(null)}
        title={repayModalLoan ? `Record Loan Repayment: ${repayModalLoan.id}` : "Loan Repayment"}
      >
        {repayModalLoan && (
          <form onSubmit={handleRecordRepayment} className="space-y-4 pt-2 font-body pb-6 text-ink">
            <div className="p-4 rounded-2xl bg-card-hover border border-line font-heading space-y-1">
              <span className="text-[10.5px] font-bold text-muted uppercase block">Borrower</span>
              <h4 className="text-sm font-black text-ink">{repayModalLoan.shop_name} ({repayModalLoan.borrower_name})</h4>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
                <span className="text-muted">Outstanding Balance:</span>
                <span className="font-black text-primary tabnum">{rwf(repayModalLoan.balance)} RWF</span>
              </div>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Repayment Amount (RWF)</label>
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

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Payment Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {["momo", "bank", "cash"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setRepayMethod(method)}
                    className={`py-2 text-xs font-black rounded-xl border uppercase transition cursor-pointer ${
                      repayMethod === method
                        ? "bg-primary text-white border-primary shadow-orange-sm"
                        : "bg-paper border-line text-muted hover:text-ink hover:bg-card-hover"
                    }`}
                  >
                    {method === "momo" ? "MTN MoMo" : method === "bank" ? "Bank Wire" : "Cash / Till"}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 font-heading">
              <button
                type="submit"
                className="btn-kinetic w-full py-3 text-xs font-black cursor-pointer shadow-orange-sm"
              >
                Confirm Repayment of {rwf(repayAmount || 0)} RWF
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
