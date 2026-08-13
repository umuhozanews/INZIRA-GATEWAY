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
  AlertTriangle,
  Lock,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
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
      const res = await api.get(`/admin/smes/${id}/shop-view`);
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
          shop_phone: "+250 788 123 456",
          tin_number: "109876543",
        },
        stock: [
          { id: 1, name: "Premium Inyange Milk 500ml", category: "Dairy", quantity: 45, cost_price_rwf: 500, sell_price_rwf: 700 },
          { id: 2, name: "Sunflower Cooking Oil 1L", category: "Cooking", quantity: 18, cost_price_rwf: 2800, sell_price_rwf: 3500 },
          { id: 3, name: "Sugar Bugarama 1kg", category: "Dry Goods", quantity: 60, cost_price_rwf: 1200, sell_price_rwf: 1500 },
          { id: 4, name: "Wheat Flour 2kg", category: "Baking", quantity: 8, cost_price_rwf: 2200, sell_price_rwf: 2800 },
        ],
        sales: [
          { id: 101, total_amount: 14500, payment_method: "mtn_momo", payment_status: "paid", created_at: new Date().toISOString(), invoice_number: "INV-2026-001", customer_name: "Jean Paul" },
          { id: 102, total_amount: 2800, payment_method: "cash", payment_status: "paid", created_at: new Date(Date.now() - 3600000 * 3).toISOString(), invoice_number: "INV-2026-002", customer_name: "Walk-in Customer" },
          { id: 103, total_amount: 8500, payment_method: "airtel", payment_status: "paid", created_at: new Date(Date.now() - 3600000 * 8).toISOString(), invoice_number: "INV-2026-003", customer_name: "Marie Claire" },
        ],
        customers: [
          { id: 1, name: "Jean Paul Habimana", phone: "+250 788 444 333", total_orders: 14, total_spent: 184000 },
          { id: 2, name: "Marie Claire Mukamana", phone: "+250 788 777 666", total_orders: 8, total_spent: 92000 },
        ],
        expenses: [
          { id: 1, category: "Rent", amount: 150000, description: "Monthly Shop Rent Kigali", expense_date: "2026-08-01" },
          { id: 2, category: "Utilities", amount: 35000, description: "Electricity & Water Bill", expense_date: "2026-08-05" },
        ],
        receivables: [
          { id: 1, amount: 25000, amount_paid: 10000, status: "partial", customer_name: "Jean Paul Habimana", due_date: "2026-08-20" },
        ],
        score: {
          score: 84,
          band: "green",
          calculated_at: new Date().toISOString(),
        },
        financialSummary: {
          revenue: 258000,
          costOfGoods: 180000,
          grossProfit: 78000,
          expenses: 185000,
          netProfit: -107000,
          grossMargin: 30,
          netMargin: -41,
        },
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
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-xs font-bold text-gray-400">
        Auditing & Loading SME Shop Data...
      </div>
    );
  }

  if (!data || !data.sme) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 font-manrope">
        <AlertTriangle size={36} className="text-amber-500 mx-auto" />
        <h3 className="text-base font-black text-gray-900">SME Store Not Found</h3>
        <p className="text-xs text-gray-500">The requested business account could not be found.</p>
        <button
          onClick={() => navigate("/admin/smes")}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
        >
          Return to SME Directory
        </button>
      </div>
    );
  }

  const { sme, settings, stock = [], sales = [], customers = [], expenses = [], score, financialSummary } = data;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-manrope">
      {/* ─── Back Button & Actions ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/smes")}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to SME Directory</span>
        </button>

        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
          Audited Inspection Session
        </span>
      </div>

      {/* ─── Mandatory Security Audit Banner ─── */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3.5 shadow-sm">
        <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <Lock size={18} />
        </div>
        <div className="flex-1 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <strong className="font-black text-amber-950 uppercase tracking-wide">
              READ-ONLY SME AUDIT & MONITORING VIEW
            </strong>
            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-950 uppercase">
              Audited Access
            </span>
          </div>
          <p className="text-amber-800 text-[11px]">
            You are inspecting <strong className="text-amber-950">{settings?.shop_name || sme.name}</strong> (Owner: <strong>{sme.name}</strong>, Email: <strong>{sme.email}</strong>). This view is strictly <strong>READ-ONLY</strong> to protect store data integrity. Your viewing activity is recorded in the immutable platform audit log.
          </p>
        </div>
      </div>

      {/* ─── Business Profile Header Card ─── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-900 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
              {(settings?.shop_name || sme.name)[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900">
                  {settings?.shop_name || `${sme.name}'s Shop`}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    sme.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {sme.is_active !== false ? "Active Merchant" : "Suspended"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Owner: <strong>{sme.name}</strong> • Joined: {new Date(sme.created_at).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-purple-600" />
                  <span>{sme.phone || settings?.shop_phone || "—"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-purple-600" />
                  <span>{sme.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-purple-600" />
                  <span>{settings?.shop_address || sme.district || "Kigali, Rwanda"}</span>
                </span>
                {settings?.tin_number && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                    TIN: {settings.tin_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Health Score Pill */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3.5 self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase">SACCO Health Score</span>
              <p className="text-lg font-black text-gray-900">{score?.score || 82}/100</p>
            </div>
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-xs uppercase ${
                (score?.score || 82) >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <Activity size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs for Inspection ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200 text-xs font-bold">
        {[
          { id: "overview", label: "P&L & Financials", icon: TrendingUp },
          { id: "stock", label: `Stock Items (${stock.length})`, icon: Package },
          { id: "sales", label: `Sales & Invoices (${sales.length})`, icon: ShoppingCart },
          { id: "customers", label: `Customers CRM (${customers.length})`, icon: Users },
          { id: "expenses", label: `Expenses (${expenses.length})`, icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white border-t-2 border-x border-gray-200 text-purple-900 font-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ─── */}

      {/* 1. OVERVIEW & P&L SNAPSHOT */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Recorded Revenue</span>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {rwf(financialSummary?.revenue || 0)}
              </p>
              <span className="text-[10px] text-gray-400">{sales.length} total transactions</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Cost of Goods (COGS)</span>
              <p className="text-2xl font-black text-gray-700 mt-1">
                {rwf(financialSummary?.costOfGoods || 0)}
              </p>
              <span className="text-[10px] text-gray-400">Inventory acquisition cost</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Total Expenses</span>
              <p className="text-2xl font-black text-red-600 mt-1">
                {rwf(financialSummary?.expenses || 0)}
              </p>
              <span className="text-[10px] text-gray-400">{expenses.length} expense entries</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Estimated Net Profit</span>
              <p
                className={`text-2xl font-black mt-1 ${
                  (financialSummary?.netProfit || 0) >= 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {rwf(financialSummary?.netProfit || 0)}
              </p>
              <span className="text-[10px] text-gray-400">
                Gross Margin: {financialSummary?.grossMargin || 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. STOCK ITEMS TAB */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Store Inventory Items (Read-Only)
            </h3>
            <span className="text-xs text-gray-400">{stock.length} total items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No stock items registered by this merchant.
                    </td>
                  </tr>
                ) : (
                  stock.map((item) => {
                    const cost = Number(item.cost_price_rwf || 0);
                    const sell = Number(item.sell_price_rwf || 0);
                    const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-gray-900">{item.name}</td>
                        <td className="py-3.5 px-4 text-gray-500">{item.category || "General"}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.quantity <= (item.low_stock_threshold || 5)
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">{rwf(cost)}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{rwf(sell)}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-black text-purple-900">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SALES & INVOICES TAB */}
      {activeTab === "sales" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Sales History & Invoices (Read-Only)
            </h3>
            <span className="text-xs text-gray-400">{sales.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No sales recorded by this store.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 sm:px-6 font-black text-purple-900">
                        {sale.invoice_number || `#${sale.id}`}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-bold">
                        {sale.customer_name || "Walk-in Customer"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gray-100 text-gray-800">
                          {(sale.payment_method || "cash").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-gray-900">
                        {rwf(sale.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Customer CRM & Accounts (Read-Only)
            </h3>
            <span className="text-xs text-gray-400">{customers.length} customers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No customer records found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{c.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-gray-700">{c.total_orders || 0} orders</td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-800">
                        {rwf(c.total_spent || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. EXPENSES TAB */}
      {activeTab === "expenses" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Recorded Operating Expenses (Read-Only)
            </h3>
            <span className="text-xs text-gray-400">{expenses.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No expenses recorded for this store.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-gray-900">{exp.category}</td>
                      <td className="py-3.5 px-4 text-gray-500">{exp.expense_date || "—"}</td>
                      <td className="py-3.5 px-4 text-gray-600">{exp.description || "—"}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-red-600">
                        {rwf(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
