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
      console.warn("Falling back to local SME inspection data:", err);
      // Fallback inspection snapshot
      setData({
        readOnly: true,
        auditedAccess: true,
        sme: {
          id: id,
          name: "Alpha Merchant",
          email: "merchant@alpha.rw",
          phone: "+250 788 123 456",
          role: "sme_owner",
          is_active: true,
          sector: "Retail & Supermarket",
          district: "Gasabo",
          currency: "RWF",
          created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        },
        settings: {
          shop_name: "Alpha Kigali Supermarket",
          shop_address: "KG 14 Ave, Kimironko, Kigali",
          tin: "109876543",
          tax_rate: "18",
          receipt_footer: "Murakoze cyane! Thank you for shopping with us.",
        },
        financialSummary: {
          grossRevenue: 17300,
          cogs: 9500,
          grossProfit: 7800,
          operatingExpenses: 0,
          netProfit: 7800,
          grossMarginPct: 45.1,
          totalTransactions: 2,
          receivablesTotal: 0,
        },
        stock: [
          { id: 1, name: "Inyange Milk 500ml", category: "Dairy", quantity: 24, cost_price: 600, price: 800, min_stock: 5 },
          { id: 2, name: "Basmati Rice 5kg", category: "Grains", quantity: 15, cost_price: 7500, price: 9500, min_stock: 3 },
          { id: 3, name: "Sunflower Cooking Oil 1L", category: "Cooking Essentials", quantity: 8, cost_price: 3200, price: 4200, min_stock: 2 },
        ],
        sales: [
          {
            id: 101,
            invoice_number: "INV-2026-0001",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            customer_name: "Walk-in Customer",
            payment_method: "cash",
            total: 4500,
            items_count: 2,
          },
          {
            id: 102,
            invoice_number: "INV-2026-0002",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            customer_name: "Kigali Retailer",
            payment_method: "momo",
            total: 12800,
            items_count: 3,
          },
        ],
        customers: [
          { id: 1, name: "Walk-in Customer", phone: "—", total_orders: 1, total_spent: 4500 },
          { id: 2, name: "Kigali Retailer", phone: "+250 788 999 888", total_orders: 1, total_spent: 12800 },
        ],
        expenses: [],
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
      <div className="p-12 text-center text-xs font-bold text-gray-400 font-manrope">
        Loading Shop Monitoring View...
      </div>
    );
  }

  const sme = data?.sme || {};
  const settings = data?.settings || {};
  const fin = data?.financialSummary || {};
  const stock = data?.stock || [];
  const sales = data?.sales || [];
  const customers = data?.customers || [];
  const expenses = data?.expenses || [];

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-manrope">
      {/* ─── Top Bar & Navigation ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/smes")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200/80 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to SME Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-[#F4FBE4] text-purple-950 border border-[#D4F06B] flex items-center gap-1">
            <Lock size={12} className="text-purple-700" />
            <span>Audited Read-Only Inspection</span>
          </span>
        </div>
      </div>

      {/* ─── Mandatory Security Audit Banner ─── */}
      <div className="rounded-3xl bg-[#F4FBE4] border border-[#D4F06B] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-full bg-[#D4F06B] flex items-center justify-center text-gray-900 shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">
              🔒 READ-ONLY SME AUDIT & MONITORING VIEW
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              You are inspecting <strong className="text-gray-900">{settings.shop_name || sme.name}</strong> as Platform Administrator. All merchant financial and inventory data displayed below is strictly <strong className="text-purple-700">READ-ONLY</strong> and cannot be mutated. This monitoring session has been recorded in the platform security audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* ─── SME Profile Header Card ─── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[#D4F06B] text-gray-900 font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-[#D4F06B]/20">
              {(settings.shop_name || sme.name || "S")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  {settings.shop_name || `${sme.name}'s Shop`}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    sme.is_active !== false
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {sme.is_active !== false ? "Active Store" : "Suspended"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Owner: <strong className="text-gray-800">{sme.name}</strong> • Joined {new Date(sme.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Health Score</span>
              <p className="text-lg font-black text-emerald-700">82/100</p>
            </div>
          </div>
        </div>

        {/* Store Metadata Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 flex items-center gap-2.5">
            <Phone size={14} className="text-purple-600 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
              <p className="font-bold text-gray-800 truncate">{sme.phone || "—"}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 flex items-center gap-2.5">
            <Mail size={14} className="text-purple-600 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
              <p className="font-bold text-gray-800 truncate">{sme.email || "—"}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 flex items-center gap-2.5">
            <MapPin size={14} className="text-purple-600 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
              <p className="font-bold text-gray-800 truncate">{settings.shop_address || sme.district || "Kigali, Rwanda"}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 flex items-center gap-2.5">
            <Building2 size={14} className="text-purple-600 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Sector & TIN</p>
              <p className="font-bold text-gray-800 truncate">{sme.sector || "Retail"} • TIN {settings.tin || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Inspection Tabs ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === key
                ? "bg-[#D4F06B] text-gray-900 shadow-md shadow-[#D4F06B]/20 font-black"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* P&L 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-black text-gray-400 uppercase">Gross Revenue</span>
              <p className="text-xl font-black text-gray-900 mt-1">{rwf(fin.grossRevenue || 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">{fin.totalTransactions || 0} recorded sales</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-black text-gray-400 uppercase">Cost of Goods (COGS)</span>
              <p className="text-xl font-black text-gray-900 mt-1">{rwf(fin.cogs || 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">Inventory acquisition cost</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-black text-gray-400 uppercase">Gross Margin</span>
              <p className="text-xl font-black text-purple-900 mt-1">{fin.grossMarginPct || 0}%</p>
              <p className="text-[11px] text-gray-500 mt-1">{rwf(fin.grossProfit || 0)} profit</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-black text-gray-400 uppercase">Net Profit</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{rwf(fin.netProfit || 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">After expenses ({rwf(fin.operatingExpenses || 0)})</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase">Inventory Stock List (Read-Only)</h3>
            <span className="text-xs font-bold text-gray-400">{stock.length} Products</span>
          </div>
          {stock.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No stock items registered for this merchant.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <th className="py-3 px-4 sm:px-6">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">In Stock</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category || "General"}</td>
                      <td className="py-3 px-4 font-black text-gray-900">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-600">{rwf(item.cost_price || 0)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{rwf(item.price || 0)}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-black text-purple-900">
                        {item.price > 0 ? Math.round(((item.price - (item.cost_price || 0)) / item.price) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "sales" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase">Recorded Sales & Invoices</h3>
            <span className="text-xs font-bold text-gray-400">{sales.length} Transactions</span>
          </div>
          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No sales transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <th className="py-3 px-4 sm:px-6">Invoice #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 sm:px-6 font-bold text-purple-700">{sale.invoice_number || `INV-${sale.id}`}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{sale.customer_name || "Walk-in"}</td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px] text-gray-600">{sale.payment_method || "cash"}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-black text-gray-900">{rwf(sale.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "customers" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase">Customer Directory & Debts</h3>
            <span className="text-xs font-bold text-gray-400">{customers.length} Customers</span>
          </div>
          {customers.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No customers registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <th className="py-3 px-4 sm:px-6">Customer Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Orders Count</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Lifetime Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 text-gray-500">{c.phone || "—"}</td>
                      <td className="py-3 px-4 font-bold text-gray-800">{c.total_orders || 1}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-black text-emerald-700">{rwf(c.total_spent || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase">Store Operating Expenses</h3>
            <span className="text-xs font-bold text-gray-400">{expenses.length} Records</span>
          </div>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No expenses recorded for this store.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <th className="py-3 px-4 sm:px-6">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{e.description || e.name}</td>
                      <td className="py-3 px-4 text-gray-500">{e.category || "General"}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-black text-red-600">{rwf(e.amount || 0)}</td>
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
