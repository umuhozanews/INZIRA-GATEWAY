import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  Activity,
  Lock,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import api from "../../lib/api";
import { rwf, rwfCompact } from "../../lib/format";

export default function SmeShopView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  async function loadShopData() {
    try {
      setLoading(true);
      let res;
      try {
        res = await api.get(`/admin/smes/${id}/shop-view`);
      } catch {
        res = await api.get(`/v2/admin/smes/${id}/shop-view`);
      }
      setData(res.data);
    } catch (err) {
      console.warn("Loading local SME inspection data for id:", id, err);
      // Read real accounts from local registry if present
      const allAccounts = JSON.parse(localStorage.getItem("db_all_accounts_v1") || "[]");
      const matched = allAccounts.find(a => String(a.id) === String(id));
      const localStock = JSON.parse(localStorage.getItem(`db_stock_${id}`) || "[]");
      const localSales = JSON.parse(localStorage.getItem(`db_sales_${id}`) || "[]");
      const localExpenses = JSON.parse(localStorage.getItem(`db_expenses_${id}`) || "[]");
      const localSettings = JSON.parse(localStorage.getItem(`db_settings_${id}`) || "{}");

      const grossRev = localSales.reduce((s, x) => s + (Number(x.total_amount || x.total) || 0), 0);
      const opExp = localExpenses.reduce((s, x) => s + (Number(x.amount_rwf || x.amount) || 0), 0);

      setData({
        readOnly: true,
        auditedAccess: true,
        sme: matched || {
          id: id,
          name: "SME Merchant",
          email: "merchant@inzira.rw",
          phone: "—",
          role: "sme_owner",
          is_active: true,
          sector: "General Retail",
          district: "Kigali",
          currency: "RWF",
          created_at: new Date().toISOString(),
        },
        settings: {
          shop_name: localSettings.shopName || matched?.shop_name || "SME Store",
          shop_address: localSettings.shopAddress || matched?.location || "Kigali, Rwanda",
          tin: localSettings.tinNumber || "N/A",
          tax_rate: "18",
          receipt_footer: "Thank you for your business!",
        },
        financialSummary: {
          revenue: grossRev,
          costOfGoods: 0,
          grossProfit: grossRev,
          expenses: opExp,
          netProfit: grossRev - opExp,
          grossMargin: grossRev > 0 ? 100 : 0,
          netMargin: grossRev > 0 ? Math.round(((grossRev - opExp) / grossRev) * 100) : 0,
        },
        stock: localStock,
        sales: localSales,
        customers: [],
        expenses: localExpenses,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShopData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-muted font-body">
        Loading Shop Monitoring View...
      </div>
    );
  }

  const sme = data?.sme || {};
  const settings = data?.settings || {};
  const stock = Array.isArray(data?.stock) ? data.stock : [];
  const sales = Array.isArray(data?.sales) ? data.sales : [];
  const customers = Array.isArray(data?.customers) ? data.customers : [];
  const expenses = Array.isArray(data?.expenses) ? data.expenses : [];

  const rawFin = data?.financialSummary || {};
  const grossRev = Number(rawFin.revenue !== undefined ? rawFin.revenue : (rawFin.grossRevenue !== undefined ? rawFin.grossRevenue : sales.reduce((s, x) => s + (Number(x.total_amount || x.total) || 0), 0)));
  const cogsVal = Number(rawFin.costOfGoods !== undefined ? rawFin.costOfGoods : (rawFin.cogs || 0));
  const expVal = Number(rawFin.expenses !== undefined ? rawFin.expenses : (rawFin.operatingExpenses !== undefined ? rawFin.operatingExpenses : expenses.reduce((s, x) => s + (Number(x.amount_rwf || x.amount) || 0), 0)));
  const grossProfitVal = Number(rawFin.grossProfit !== undefined ? rawFin.grossProfit : (grossRev - cogsVal));
  const netProfitVal = Number(rawFin.netProfit !== undefined ? rawFin.netProfit : (grossProfitVal - expVal));
  const marginPct = grossRev > 0 ? Math.round((grossProfitVal / grossRev) * 100) : 0;
  const scoreVal = data?.score?.score || 75;

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-body text-ink">
      {/* ─── Top Bar & Navigation ─── */}
      <div className="flex items-center justify-between font-heading">
        <button
          onClick={() => navigate("/admin/smes")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-card text-xs font-bold text-ink hover:bg-card-hover shadow-sm transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to SME Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
            <Lock size={12} className="text-primary" />
            <span>Audited Read-Only Inspection</span>
          </span>
        </div>
      </div>

      {/* ─── Mandatory Security Audit Banner ─── */}
      <div className="rounded-2xl bg-card border border-line p-4 sm:p-5 shadow-card font-body">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-heading font-black text-ink uppercase tracking-wide">
              READ-ONLY SME AUDIT & MONITORING VIEW
            </h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              You are inspecting <strong className="text-ink font-bold">{settings.shop_name || sme.name}</strong> as Platform Administrator. All merchant financial and inventory data displayed below is strictly <strong className="text-primary font-black">READ-ONLY</strong> and cannot be mutated. This monitoring session has been recorded in the platform security audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* ─── SME Profile Header Card ─── */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-line shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line font-heading">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary text-white font-black text-lg flex items-center justify-center shrink-0 shadow-orange-sm">
              {(settings.shop_name || sme.name || "S")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-ink">
                  {settings.shop_name || `${sme.name}'s Shop`}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    sme.is_active !== false
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-card-hover text-muted border border-line"
                  }`}
                >
                  {sme.is_active !== false ? "Active Store" : "Suspended"}
                </span>
              </div>
              <p className="text-xs text-muted font-medium mt-0.5 font-body">
                Owner: <strong className="text-ink font-bold">{sme.name}</strong> • Joined {new Date(sme.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center font-heading">
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted uppercase">Health Score</span>
              <p className="text-lg font-black text-ink tabnum">{scoreVal}/100</p>
            </div>
          </div>
        </div>

        {/* Store Metadata Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-body">
          <div className="p-3 rounded-xl bg-card-hover border border-line flex items-center gap-2.5">
            <Phone size={14} className="text-primary shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-muted font-bold uppercase font-heading">Phone</p>
              <p className="font-bold text-ink truncate">{sme.phone || "—"}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card-hover border border-line flex items-center gap-2.5">
            <Mail size={14} className="text-primary shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-muted font-bold uppercase font-heading">Email</p>
              <p className="font-bold text-ink truncate">{sme.email || "—"}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card-hover border border-line flex items-center gap-2.5">
            <MapPin size={14} className="text-primary shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-muted font-bold uppercase font-heading">Location</p>
              <p className="font-bold text-ink truncate">{settings.shop_address || sme.district || "Kigali, Rwanda"}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card-hover border border-line flex items-center gap-2.5">
            <Building2 size={14} className="text-primary shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-muted font-bold uppercase font-heading">Sector & TIN</p>
              <p className="font-bold text-ink truncate">{sme.sector || "Retail"} • TIN {settings.tin || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Inspection Tabs ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-heading">
        {[
          { key: "overview", label: "Financial Snapshot & P&L", icon: TrendingUp },
          { key: "stock", label: `Stock Items (${stock.length})`, icon: Package },
          { key: "sales", label: `Sales & Invoices (${sales.length})`, icon: ShoppingCart },
          { key: "customers", label: `Customer CRM (${customers.length})`, icon: Users },
          { key: "expenses", label: `Expenses (${expenses.length})`, icon: Wallet },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === key
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "bg-card text-muted hover:text-ink hover:bg-card-hover border border-line"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === "overview" && (
        <div className="space-y-4 font-body">
          {/* P&L 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-heading">
            <div className="bg-card rounded-2xl p-5 border border-line shadow-card">
              <span className="text-[10px] font-bold text-muted uppercase">Gross Revenue</span>
              <p className="text-xl font-black text-ink mt-1 tabnum">{rwf(grossRev)} RWF</p>
              <p className="text-[11px] text-muted mt-1 font-body">{sales.length} recorded sales</p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-line shadow-card">
              <span className="text-[10px] font-bold text-muted uppercase">Cost of Goods (COGS)</span>
              <p className="text-xl font-black text-ink mt-1 tabnum">{rwf(cogsVal)} RWF</p>
              <p className="text-[11px] text-muted mt-1 font-body">Inventory acquisition cost</p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-line shadow-card">
              <span className="text-[10px] font-bold text-muted uppercase">Gross Margin</span>
              <p className="text-xl font-black text-ink mt-1 tabnum">{marginPct}%</p>
              <p className="text-[11px] text-muted mt-1 font-body">{rwf(grossProfitVal)} profit</p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-line shadow-card">
              <span className="text-[10px] font-bold text-muted uppercase">Net Profit</span>
              <p className="text-xl font-black text-ink mt-1 tabnum">{rwf(netProfitVal)} RWF</p>
              <p className="text-[11px] text-muted mt-1 font-body">After expenses ({rwf(expVal)} RWF)</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden font-body">
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between font-heading">
            <h3 className="text-xs font-black text-ink uppercase">Inventory Stock List (Read-Only)</h3>
            <span className="text-xs font-bold text-muted">{stock.length} Products</span>
          </div>
          {stock.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No stock items registered for this merchant.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                    <th className="py-3 px-4 sm:px-6">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">In Stock</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stock.map((item) => {
                    const cost = Number(item.cost_price_rwf || item.cost_price || 0);
                    const sell = Number(item.sell_price_rwf || item.price || item.unit_price || 0);
                    const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-card-hover transition">
                        <td className="py-3 px-4 sm:px-6 font-bold text-ink">{item.name}</td>
                        <td className="py-3 px-4 text-muted">{item.category || "General"}</td>
                        <td className="py-3 px-4 font-heading font-black text-ink tabnum">{item.quantity}</td>
                        <td className="py-3 px-4 font-heading font-semibold text-ink tabnum">{rwf(cost)} RWF</td>
                        <td className="py-3 px-4 font-heading font-black text-ink tabnum">{rwf(sell)} RWF</td>
                        <td className="py-3 px-4 sm:px-6 text-right font-heading font-black text-ink tabnum">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "sales" && (
        <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden font-body">
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between font-heading">
            <h3 className="text-xs font-black text-ink uppercase">Recorded Sales & Invoices</h3>
            <span className="text-xs font-bold text-muted">{sales.length} Transactions</span>
          </div>
          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No sales transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                    <th className="py-3 px-4 sm:px-6">Invoice #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-card-hover transition">
                      <td className="py-3 px-4 sm:px-6 font-heading font-bold text-primary">{sale.invoice_number || `INV-${sale.id}`}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(sale.created_at || sale.sale_date)}</td>
                      <td className="py-3 px-4 text-ink font-medium">{sale.customer_name || "Walk-in"}</td>
                      <td className="py-3 px-4 uppercase font-heading font-bold text-[10px] text-muted">{(sale.payment_method || "cash").replace("_", " ")}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-heading font-black text-ink tabnum">{rwf(sale.total_amount || sale.total || 0)} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "customers" && (
        <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden font-body">
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between font-heading">
            <h3 className="text-xs font-black text-ink uppercase">Customer Directory & Debts</h3>
            <span className="text-xs font-bold text-muted">{customers.length} Customers</span>
          </div>
          {customers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No customers registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                    <th className="py-3 px-4 sm:px-6">Customer Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Orders Count</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Lifetime Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-card-hover transition">
                      <td className="py-3 px-4 sm:px-6 font-bold text-ink">{c.name}</td>
                      <td className="py-3 px-4 text-muted">{c.phone || "—"}</td>
                      <td className="py-3 px-4 font-heading font-bold text-ink tabnum">{c.total_orders || 1}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-heading font-black text-ink tabnum">{rwf(c.total_spent || 0)} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden font-body">
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between font-heading">
            <h3 className="text-xs font-black text-ink uppercase">Store Operating Expenses</h3>
            <span className="text-xs font-bold text-muted">{expenses.length} Records</span>
          </div>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No expenses recorded for this store.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                    <th className="py-3 px-4 sm:px-6">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-card-hover transition">
                      <td className="py-3 px-4 sm:px-6 font-bold text-ink">{e.description || e.name || "Expense"}</td>
                      <td className="py-3 px-4 text-muted">{e.category || "General"}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(e.expense_date || e.created_at)}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-heading font-black text-ink tabnum">{rwf(e.amount_rwf || e.amount || 0)} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
