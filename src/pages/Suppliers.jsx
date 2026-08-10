import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  CreditCard,
  Phone,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
  UserPlus,
  Truck,
  FileText,
  AlertCircle
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf, initials, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import Loading from "../components/Loading";
import { Button, Field, TextInput } from "../components/ui";
import { useData } from "../context/DataContext";

const DB_CUSTOMERS_KEY = "db_local_customers_v1";
const DB_SUPPLIERS_KEY = "db_local_suppliers_v1";

const DEFAULT_CUSTOMERS = [
  {
    id: 1,
    name: "Jean Paul Bizimana",
    phone: "0788123456",
    email: "jp.bizimana@gmail.com",
    credit_limit_rwf: 200000,
    owed_to_us_rwf: 4800,
    total_spent_rwf: 12800,
  },
  {
    id: 2,
    name: "Amani Boutique",
    phone: "0788111222",
    email: "amani@boutique.rw",
    credit_limit_rwf: 300000,
    owed_to_us_rwf: 45000,
    total_spent_rwf: 145000,
  },
  {
    id: 3,
    name: "Grace Fashion Huye",
    phone: "0789333444",
    email: "grace.huye@gmail.com",
    credit_limit_rwf: 150000,
    owed_to_us_rwf: 85000,
    total_spent_rwf: 85000,
  },
  {
    id: 4,
    name: "Kigali Retailer Ltd",
    phone: "0782555666",
    email: "info@kigaliretailer.rw",
    credit_limit_rwf: 500000,
    owed_to_us_rwf: 0,
    total_spent_rwf: 220000,
  }
];

const DEFAULT_SUPPLIERS = [
  {
    id: 1,
    name: "Inyange Industries Ltd",
    phone: "0788900100",
    products_supplied: "Milk, Juices, Bottled Water",
    amount_we_owe_rwf: 120000,
  },
  {
    id: 2,
    name: "Bakhresa Grain Milling",
    phone: "0788400500",
    products_supplied: "Azam Wheat Flour, Sugar 50kg",
    amount_we_owe_rwf: 45000,
  },
  {
    id: 3,
    name: "Kigali Textile Wholesalers",
    phone: "0789700800",
    products_supplied: "T-Shirts, Jeans, Fabrics",
    amount_we_owe_rwf: 0,
  }
];

export default function Suppliers() {
  const { t } = useLang();
  const { sales, recordDebtPayment } = useData();
  const [params, setParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("customers"); // 'customers' | 'owed' | 'payables'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Local Customers State
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_CUSTOMERS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  // Local Suppliers State
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_SUPPLIERS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
    } catch {
      return DEFAULT_SUPPLIERS;
    }
  });

  // Modal States
  const [addCustOpen, setAddCustOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custLimit, setCustLimit] = useState("200000");

  const [addSupOpen, setAddSupOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supProducts, setSupProducts] = useState("");
  const [supOwed, setSupOwed] = useState("");

  const [payModalSale, setPayModalSale] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(DB_CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_SUPPLIERS_KEY, JSON.stringify(suppliers));
    } catch (e) {
      console.error(e);
    }
  }, [suppliers]);

  // Derived Owed to Us (Receivables) from live sales
  const receivables = useMemo(() => {
    return (sales || []).filter((s) => (Number(s.amount_owed) || 0) > 0 || s.payment_status === "pending" || s.payment_status === "partial");
  }, [sales]);

  const totalOwedToUs = useMemo(() => {
    const saleOwed = receivables.reduce((sum, s) => sum + (Number(s.amount_owed) || 0), 0);
    const custOwed = customers.reduce((sum, c) => sum + (Number(c.owed_to_us_rwf) || 0), 0);
    return Math.max(saleOwed, custOwed);
  }, [receivables, customers]);

  const totalPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.amount_we_owe_rwf) || 0), 0);
  }, [suppliers]);

  // Handlers
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!custName.trim()) return toast.error("Please enter customer name.");

    const created = {
      id: Date.now(),
      name: custName.trim(),
      phone: custPhone.trim() || "N/A",
      email: custEmail.trim() || "",
      credit_limit_rwf: Number(custLimit) || 200000,
      owed_to_us_rwf: 0,
      total_spent_rwf: 0,
    };

    setCustomers((prev) => [created, ...prev]);
    toast.success(`Added customer "${custName.trim()}"`);

    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustLimit("200000");
    setAddCustOpen(false);
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    if (!supName.trim()) return toast.error("Please enter supplier name.");

    const created = {
      id: Date.now(),
      name: supName.trim(),
      phone: supPhone.trim() || "N/A",
      products_supplied: supProducts.trim() || "General Goods",
      amount_we_owe_rwf: Number(supOwed) || 0,
    };

    setSuppliers((prev) => [created, ...prev]);
    toast.success(`Added supplier "${supName.trim()}"`);

    setSupName("");
    setSupPhone("");
    setSupProducts("");
    setSupOwed("");
    setAddSupOpen(false);
  };

  const handleRecordDebtPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payModalSale) return;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Please enter valid payment amount.");

    await recordDebtPayment(payModalSale.id, {
      amount: amt,
      payment_method: payMethod,
      note: payNote,
    });

    toast.success(`Recorded payment of ${rwf(amt)} RWF!`);
    setPayModalSale(null);
    setPayAmount("");
    setPayNote("");
  };

  const handlePaySupplier = (id, currentOwed) => {
    if (currentOwed <= 0) return toast.success("All supplier invoices are paid!");
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, amount_we_owe_rwf: 0 } : s))
    );
    toast.success("Marked supplier invoice as fully paid!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#F1F5E9] font-manrope text-gray-900 pb-24">
      <ScreenHeader
        title="Suppliers & Debtors"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddCustOpen(true)}
              className="flex items-center gap-1 rounded-full bg-[#D4F06B] px-3.5 py-1.5 text-xs font-black text-gray-900 shadow-sm hover:bg-[#C5E456] transition"
            >
              <UserPlus size={14} />
              <span>Customer</span>
            </button>
            <button
              onClick={() => setAddSupOpen(true)}
              className="flex items-center gap-1 rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:bg-gray-800 transition"
            >
              <Plus size={14} />
              <span>Supplier</span>
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Strip: Customers, Owed to Us, Payables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Customers */}
          <div
            onClick={() => setActiveTab("customers")}
            className={`p-5 rounded-3xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "customers" ? "border-primary ring-2 ring-primary/20" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Customers</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-xlt text-primary">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-ink tabnum">{customers.length} Listed</div>
            <span className="text-[11px] font-semibold text-muted block mt-0.5">Active Client Accounts</span>
          </div>

          {/* Card 2: Owed to Us (Receivables) */}
          <div
            onClick={() => setActiveTab("owed")}
            className={`p-5 rounded-3xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "owed" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Owed to Us</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-700 tabnum">{rwf(totalOwedToUs)} RWF</div>
            <span className="text-[11px] font-semibold text-amber-800 block mt-0.5">Customer Credit Sales Owed</span>
          </div>

          {/* Card 3: Payables (Owed to Suppliers) */}
          <div
            onClick={() => setActiveTab("payables")}
            className={`p-5 rounded-3xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "payables" ? "border-red-500 ring-2 ring-red-500/20" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Payables</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-800">
                <Truck size={20} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-red-700 tabnum">{rwf(totalPayables)} RWF</div>
            <span className="text-[11px] font-semibold text-red-800 block mt-0.5">Owed to Stock Suppliers</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card p-1.5 rounded-2xl border border-line shadow-sm overflow-x-auto">
            {[
              { id: "customers", label: "Customers", count: customers.length },
              { id: "owed", label: "Owed to Us (Receivables)", count: receivables.length },
              { id: "payables", label: "Payables (Suppliers)", count: suppliers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-ink hover:bg-paper"
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-extrabold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, invoice…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-3 py-2 text-xs font-semibold text-ink placeholder:text-muted focus:border-primary focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Tab 1: Customers Directory */}
        {activeTab === "customers" && (
          <div className="space-y-3">
            {customers.filter((c) => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="p-10 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-line">
                No customer accounts found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers
                  .filter((c) => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card hover:border-primary/40 transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-xlt text-primary font-heading font-extrabold text-base shrink-0">
                          {initials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-extrabold text-ink truncate">{c.name}</h3>
                          <p className="text-xs text-muted mt-0.5">{c.phone || "No phone"}</p>

                          <div className="mt-3 pt-3 border-t border-line/60 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted font-medium">Total Spent:</span>
                              <span className="font-bold text-ink tabnum">{rwf(c.total_spent_rwf)} RWF</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted font-medium">Owed to Us:</span>
                              <span className={`font-extrabold tabnum ${c.owed_to_us_rwf > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                                {c.owed_to_us_rwf > 0 ? `${rwf(c.owed_to_us_rwf)} RWF` : "Clean 0 RWF"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {c.phone && c.phone !== "N/A" && (
                        <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted">{c.phone}</span>
                          <a
                            href={`tel:${c.phone}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-success-lt text-success text-xs font-bold hover:bg-success hover:text-white transition"
                          >
                            <Phone size={13} /> Call Client
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Owed to Us (Receivables / Customer Credit Sales) */}
        {activeTab === "owed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-extrabold text-ink uppercase tracking-wider">
                Unpaid Customer Credit Invoices
              </h3>
              <span className="text-xs text-muted">{receivables.length} active credit records</span>
            </div>

            <div className="space-y-3">
              {receivables.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-line">
                  🎉 All customer sales are fully paid! No outstanding receivables.
                </div>
              ) : (
                receivables.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-card hover:border-amber-400 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-sm font-extrabold text-ink">
                            {s.invoice_number || `INV-${s.id}`}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                            {s.payment_status === "partial" ? "Partially Paid" : "Unpaid Credit"}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {s.customer_name || "Walk-in Customer"} {s.customer_phone ? `(${s.customer_phone})` : ""} &bull; Issued: {formatDate(s.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">Amount Owed</span>
                        <div className="font-heading text-base font-extrabold text-amber-700 tabnum">
                          {rwf(s.amount_owed || s.total_amount)} RWF
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPayModalSale(s);
                          setPayAmount(String(s.amount_owed || s.total_amount));
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-sm transition cursor-pointer"
                      >
                        <DollarSign size={14} /> Record Payment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Payables (Owed to Suppliers) */}
        {activeTab === "payables" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-extrabold text-ink uppercase tracking-wider">
                Accounts Payable (Owed to Stock Suppliers)
              </h3>
              <span className="text-xs text-muted">{suppliers.length} suppliers listed</span>
            </div>

            <div className="space-y-3">
              {suppliers.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-line">
                  No suppliers listed yet. Click "+ Supplier" to add suppliers.
                </div>
              ) : (
                suppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card shadow-card hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-xlt text-primary font-heading font-extrabold text-sm shrink-0">
                        {initials(sup.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-sm font-extrabold text-ink">{sup.name}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              sup.amount_we_owe_rwf > 0
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {sup.amount_we_owe_rwf > 0 ? "Owed" : "Fully Paid"}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {sup.phone || "No phone"} &bull; {sup.products_supplied}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-muted uppercase block">Balance Owed</span>
                        <div
                          className={`font-heading text-base font-extrabold tabnum ${
                            sup.amount_we_owe_rwf > 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {rwf(sup.amount_we_owe_rwf)} RWF
                        </div>
                      </div>

                      {sup.amount_we_owe_rwf > 0 ? (
                        <button
                          onClick={() => handlePaySupplier(sup.id, sup.amount_we_owe_rwf)}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> Pay Supplier
                        </button>
                      ) : sup.phone && sup.phone !== "N/A" ? (
                        <a
                          href={`tel:${sup.phone}`}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-success-lt text-success text-xs font-bold hover:bg-success hover:text-white transition"
                        >
                          <Phone size={14} /> Call
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal Sheet */}
      <Sheet open={addCustOpen} onClose={() => setAddCustOpen(false)} title="Add New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-4 pt-2 pb-6">
          <Field label="Customer / Business Name">
            <TextInput
              required
              placeholder="e.g. Jean Paul Bizimana or Amani Store"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone Number">
              <TextInput
                placeholder="0788 123 456"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
            </Field>

            <Field label="Credit Limit (RWF)">
              <TextInput
                type="number"
                placeholder="200000"
                value={custLimit}
                onChange={(e) => setCustLimit(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Email Address (optional)">
            <TextInput
              type="email"
              placeholder="customer@gmail.com"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
            />
          </Field>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="paper"
              onClick={() => setAddCustOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="green"
              className="flex-1 font-bold shadow-sm"
            >
              Add Customer
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Add Supplier Modal Sheet */}
      <Sheet open={addSupOpen} onClose={() => setAddSupOpen(false)} title="Add New Supplier">
        <form onSubmit={handleAddSupplier} className="space-y-4 pt-2 pb-6">
          <Field label="Supplier / Company Name">
            <TextInput
              required
              placeholder="e.g. Inyange Industries Ltd"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Phone Number">
            <TextInput
              placeholder="0788 900 100"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
            />
          </Field>

          <Field label="Products Supplied">
            <TextInput
              placeholder="e.g. Milk, Rice, Sugar, Flour"
              value={supProducts}
              onChange={(e) => setSupProducts(e.target.value)}
            />
          </Field>

          <Field label="Initial Amount We Owe (RWF)">
            <TextInput
              type="number"
              placeholder="0"
              value={supOwed}
              onChange={(e) => setSupOwed(e.target.value)}
            />
          </Field>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="paper"
              onClick={() => setAddSupOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="green"
              className="flex-1 font-bold shadow-sm"
            >
              Add Supplier
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Record Customer Debt Payment Modal Sheet */}
      <Sheet open={!!payModalSale} onClose={() => setPayModalSale(null)} title="Record Customer Debt Payment">
        {payModalSale && (
          <form onSubmit={handleRecordDebtPaymentSubmit} className="space-y-4 pt-2 pb-6">
            <div className="rounded-2xl border border-line bg-paper p-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted font-medium">Invoice Number:</span>
                <span className="font-bold text-ink">{payModalSale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted font-medium">Customer:</span>
                <span className="font-bold text-ink">{payModalSale.customer_name}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1.5">
                <span className="text-muted font-bold uppercase">Total Outstanding:</span>
                <span className="font-extrabold text-amber-700 tabnum">{rwf(payModalSale.amount_owed || payModalSale.total_amount)} RWF</span>
              </div>
            </div>

            <Field label="Payment Amount (RWF)">
              <TextInput
                required
                type="number"
                min="1"
                max={payModalSale.amount_owed || payModalSale.total_amount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Payment Channel">
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
              >
                <option value="cash">Cash Till</option>
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </Field>

            <Field label="Notes / Reference (optional)">
              <TextInput
                placeholder="e.g. Partial cash payment at shop"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </Field>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="paper"
                onClick={() => setPayModalSale(null)}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="green"
                className="flex-1 font-bold shadow-sm"
              >
                Confirm Payment
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
