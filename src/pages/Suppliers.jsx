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
  AlertCircle,
  MessageSquare,
  Package,
  PackageCheck,
  PackagePlus,
  Send,
  Share2,
  ExternalLink,
  Trash2,
  Boxes,
  ChevronRight
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf, initials, formatDate, clockTime } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import Loading from "../components/Loading";
import { Button, Field, TextInput } from "../components/ui";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Suppliers() {
  const { t } = useLang();
  const { user } = useAuth();
  const { sales, recordDebtPayment, stock, addStockQuantity, reload: reloadData } = useData();
  const [params, setParams] = useSearchParams();

  // User-scoped keys so new signups start at clean NULL state
  const userKey = useMemo(() => {
    if (!user) return "guest";
    return String(user.id || user.email || user.phone || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
  }, [user]);

  const CUST_KEY = `db_customers_${userKey}`;
  const SUPP_KEY = `db_suppliers_${userKey}`;
  const ORDERS_KEY = `db_orders_${userKey}`;

  const [activeTab, setActiveTab] = useState("customers"); // 'customers' | 'owed' | 'payables' | 'orders'
  const [orderStatusFilter, setOrderStatusFilter] = useState("all"); // 'all' | 'ordered' | 'in_transit' | 'received' | 'stocked'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Local Customers State
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_customers_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local Suppliers State
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_suppliers_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Purchase Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_orders_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Catalog Stock items for PO autocomplete
  const [catalogItems, setCatalogItems] = useState([]);

  // Fetch remote backend suppliers & customers on mount
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await api.get("/suppliers");
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setSuppliers(data);
      }
    } catch {}
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get("/customers");
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get("/purchase-orders");
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch {} finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    try {
      const res = await api.get("/stock");
      const data = res.data?.items || res.data || [];
      if (Array.isArray(data)) {
        setCatalogItems(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
    fetchOrders();
    fetchStock();
  }, [fetchCustomers, fetchSuppliers, fetchOrders, fetchStock]);

  // Re-sync local state whenever active user account changes
  useEffect(() => {
    try {
      const savedCust = localStorage.getItem(CUST_KEY);
      const savedSupp = localStorage.getItem(SUPP_KEY);
      const savedOrders = localStorage.getItem(ORDERS_KEY);
      if (savedCust !== null) setCustomers(JSON.parse(savedCust));
      if (savedSupp !== null) setSuppliers(JSON.parse(savedSupp));
      if (savedOrders !== null) setOrders(JSON.parse(savedOrders));
    } catch (e) {
      console.error("Failed to load user-scoped customers/suppliers/orders:", e);
    }
  }, [userKey, CUST_KEY, SUPP_KEY, ORDERS_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(CUST_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers, CUST_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(SUPP_KEY, JSON.stringify(suppliers));
    } catch (e) {
      console.error(e);
    }
  }, [suppliers, SUPP_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders, ORDERS_KEY]);

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

  // Create Purchase Order Form State
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poOrderDate, setPoOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [poArrivalDate, setPoArrivalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [poNotes, setPoNotes] = useState("");
  const [poStatus, setPoStatus] = useState("ordered");
  const [poItems, setPoItems] = useState([
    { stock_item_id: "", item_name: "", quantity: 10, unit_cost_rwf: 0 }
  ]);
  const [poSaving, setPoSaving] = useState(false);

  // Dynamically compile Customer accounts merging DB/manual entries with POS Sales records
  const allCustomers = useMemo(() => {
    const map = new Map();

    (customers || []).forEach((c) => {
      if (!c || !c.name) return;
      const key = c.name.trim().toLowerCase();
      map.set(key, {
        id: c.id || `cust_${key}`,
        name: c.name.trim(),
        phone: c.phone || "N/A",
        email: c.email || "",
        owed_to_us_rwf: Number(c.owed_to_us_rwf || c.amount_owed || 0),
        total_spent_rwf: Number(c.total_spent_rwf || c.total_spent || 0),
        credit_limit_rwf: Number(c.credit_limit_rwf || 200000),
        created_at: c.created_at || new Date().toISOString(),
        sales_count: Number(c.sales_count || 0),
      });
    });

    (sales || []).forEach((s) => {
      const rawName = s.customer_name?.trim();
      if (!rawName || rawName === "Walk-in Customer") return;

      const key = rawName.toLowerCase();
      const existing = map.get(key) || {
        id: `cust_sale_${key}`,
        name: rawName,
        phone: s.customer_phone?.trim() || "N/A",
        email: "",
        owed_to_us_rwf: 0,
        total_spent_rwf: 0,
        credit_limit_rwf: 200000,
        created_at: s.created_at || new Date().toISOString(),
        sales_count: 0,
      };

      if (s.customer_phone && (existing.phone === "N/A" || !existing.phone)) {
        existing.phone = s.customer_phone.trim();
      }

      existing.total_spent_rwf += Number(s.total_amount || 0);
      const owed = Number(s.amount_owed || (s.payment_status === "pending" || s.payment_status === "partial" ? s.total_amount : 0));
      existing.owed_to_us_rwf += owed;
      existing.sales_count += 1;

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [customers, sales]);

  const receivables = useMemo(() => {
    return (sales || []).filter((s) => (Number(s.amount_owed) || 0) > 0 || s.payment_status === "pending" || s.payment_status === "partial");
  }, [sales]);

  const totalOwedToUs = useMemo(() => {
    const saleOwed = receivables.reduce((sum, s) => sum + (Number(s.amount_owed) || 0), 0);
    const custOwed = allCustomers.reduce((sum, c) => sum + (Number(c.owed_to_us_rwf) || 0), 0);
    return Math.max(saleOwed, custOwed);
  }, [receivables, allCustomers]);

  const totalPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.amount_we_owe_rwf) || 0), 0);
  }, [suppliers]);

  // WhatsApp Helpers
  const sanitizeWhatsAppPhone = (phone) => {
    if (!phone) return "";
    let clean = String(phone).replace(/[^0-9+]/g, "");
    if (clean.startsWith("+")) clean = clean.slice(1);
    if (clean.startsWith("07") && clean.length === 10) clean = "250" + clean.slice(1);
    else if (clean.startsWith("7") && clean.length === 9) clean = "250" + clean;
    return clean;
  };

  const formatWhatsAppOrderText = (order, shopName) => {
    const lines = [];
    lines.push(`📦 *PURCHASE ORDER: PO-${order.id}*`);
    if (shopName) lines.push(`🏪 *From:* ${shopName}`);
    lines.push(`👤 *Supplier:* ${order.supplier_name || "Supplier"}`);
    lines.push(`📅 *Order Date:* ${formatDate(order.order_date || order.created_at)}`);
    if (order.arrival_date) lines.push(`🚚 *Expected Delivery:* ${formatDate(order.arrival_date)}`);
    lines.push("");
    lines.push(`*Items Ordered:*`);

    const items = order.items && order.items.length > 0 ? order.items : [];
    items.forEach((it, idx) => {
      const itemTotal = (Number(it.quantity) || 1) * (Number(it.unit_cost_rwf) || 0);
      lines.push(`${idx + 1}. *${it.item_name}* — ${it.quantity} units @ ${rwf(it.unit_cost_rwf)} RWF (= ${rwf(itemTotal)} RWF)`);
    });

    lines.push("--------------------------------");
    lines.push(`💰 *Estimated Total:* ${rwf(order.total_cost_rwf || 0)} RWF`);
    if (order.notes) {
      lines.push("");
      lines.push(`📝 *Notes:* ${order.notes}`);
    }
    lines.push("");
    lines.push(`_Sent via Inzira DataBridge_`);
    return lines.join("\n");
  };

  const handleSendToWhatsApp = (order) => {
    const rawPhone = order.supplier_phone || (suppliers.find((s) => s.id === order.supplier_id)?.phone);
    const cleanPhone = sanitizeWhatsAppPhone(rawPhone);

    const message = formatWhatsAppOrderText(order, user?.shop_name || user?.name || "Merchant");
    const encoded = encodeURIComponent(message);

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, "_blank");
    toast.success("Opening WhatsApp with pre-filled Purchase Order!");
  };

  // PO Line Item Handlers
  const handleItemStockChange = (index, stockId) => {
    const stk = (catalogItems.length > 0 ? catalogItems : (stock || [])).find((s) => String(s.id) === String(stockId));
    setPoItems((prev) => {
      const copy = [...prev];
      if (stk) {
        copy[index] = {
          ...copy[index],
          stock_item_id: stk.id,
          item_name: stk.name,
          unit_cost_rwf: stk.cost_price_rwf || 0,
        };
      } else {
        copy[index] = {
          ...copy[index],
          stock_item_id: "",
        };
      }
      return copy;
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    setPoItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPoItemRow = () => {
    setPoItems((prev) => [
      ...prev,
      { stock_item_id: "", item_name: "", quantity: 10, unit_cost_rwf: 0 }
    ]);
  };

  const handleRemovePoItemRow = (index) => {
    if (poItems.length === 1) return;
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const poCalculatedTotal = useMemo(() => {
    return poItems.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unit_cost_rwf) || 0)), 0);
  }, [poItems]);

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    if (!poSupplierId) return toast.error("Please select a supplier.");
    if (poItems.length === 0 || !poItems[0].item_name.trim()) {
      return toast.error("Please add at least one item to order.");
    }

    setPoSaving(true);
    try {
      const selectedSup = suppliers.find((s) => String(s.id) === String(poSupplierId));
      const payload = {
        supplier_id: poSupplierId,
        supplier_name: selectedSup?.name || "Supplier",
        order_date: poOrderDate || new Date().toISOString().split("T")[0],
        arrival_date: poArrivalDate || null,
        notes: poNotes.trim() || null,
        status: poStatus,
        items: poItems.map((it) => ({
          stock_item_id: it.stock_item_id || null,
          item_name: it.item_name.trim() || "Item",
          quantity: parseInt(it.quantity, 10) || 1,
          unit_cost_rwf: parseInt(it.unit_cost_rwf, 10) || 0,
        }))
      };

      const res = await api.post("/purchase-orders", payload);
      const createdOrder = res.data;
      toast.success(`Purchase Order PO-${createdOrder.id} created!`);

      // Reset form & update state
      setCreatePoOpen(false);
      setPoNotes("");
      setPoItems([{ stock_item_id: "", item_name: "", quantity: 10, unit_cost_rwf: 0 }]);
      setOrders((prev) => [createdOrder, ...prev.filter(o => o.id !== createdOrder.id)]);
      fetchOrders();

      // Offer instant WhatsApp dispatch
      const sup = selectedSup || suppliers.find((s) => String(s.id) === String(poSupplierId));
      if (sup && sup.phone && confirm(`Would you like to send this Purchase Order to ${sup.name} on WhatsApp now?`)) {
        handleSendToWhatsApp({
          ...createdOrder,
          supplier_name: sup.name,
          supplier_phone: sup.phone,
          total_cost_rwf: poCalculatedTotal,
          items: payload.items
        });
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create purchase order."));
    } finally {
      setPoSaving(false);
    }
  };

  const handleUpdatePoStatus = async (po, nextStatus) => {
    // 1. Optimistically update local state immediately so UI updates with zero lag
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(po.id) ? { ...o, status: nextStatus } : o))
    );

    // 2. If marked as 'stocked', auto-increment inventory for every line item
    if (nextStatus === "stocked" && Array.isArray(po.items)) {
      po.items.forEach((it) => {
        if (addStockQuantity) {
          const qty = parseInt(it.quantity, 10) || 1;
          const target = it.stock_item_id || it.item_name;
          addStockQuantity(target, qty);
        }
      });
      toast.success(`🎉 PO-${po.id} marked as Stocked! Items added to live inventory.`);
      if (reloadData) reloadData();
    } else if (nextStatus === "received") {
      toast.success(`📦 PO-${po.id} marked as Received at store.`);
    } else if (nextStatus === "in_transit") {
      toast.success(`🚚 PO-${po.id} marked as In Transit.`);
    } else {
      toast.success(`Status updated to ${nextStatus.replace(/_/g, " ")}.`);
    }

    // 3. Send remote updates with multiple endpoint fallbacks
    try {
      try {
        await api.put(`/purchase-orders/${po.id}/status`, { status: nextStatus });
      } catch (err1) {
        try {
          await api.put(`/purchase-orders/${po.id}`, { status: nextStatus });
        } catch (err2) {
          await api.patch(`/purchase-orders/${po.id}`, { status: nextStatus });
        }
      }
      setTimeout(() => fetchOrders(), 500);
    } catch (err) {
      console.warn("Remote PO status update fallback (saved locally):", err.message);
    }
  };

  const handleDeletePo = async (po) => {
    if (!confirm(`Are you sure you want to delete Purchase Order PO-${po.id}?`)) return;
    try {
      await api.delete(`/purchase-orders/${po.id}`);
      toast.success(`Purchase Order PO-${po.id} deleted.`);
      fetchOrders();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete purchase order."));
    }
  };

  // Customers & Suppliers Handlers
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!custName.trim()) return toast.error("Please enter customer name.");

    try {
      const res = await api.post("/customers", {
        name: custName.trim(),
        phone: custPhone.trim() || undefined,
        credit_limit: Number(custLimit) || 200000,
        notes: custEmail.trim() ? `Email: ${custEmail.trim()}` : undefined
      });
      toast.success(`Added customer "${custName.trim()}"`);
      fetchCustomers();
    } catch {
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
      toast.success(`Saved customer locally.`);
    }

    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustLimit("200000");
    setAddCustOpen(false);
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supName.trim()) return toast.error("Please enter supplier name.");

    try {
      await api.post("/suppliers", {
        name: supName.trim(),
        phone: supPhone.trim() || undefined,
        products_supplied: supProducts.trim() || undefined,
        outstanding_balance: Number(supOwed) || 0,
      });
      toast.success(`Added supplier "${supName.trim()}"`);
      fetchSuppliers();
    } catch {
      const created = {
        id: Date.now(),
        name: supName.trim(),
        phone: supPhone.trim() || "N/A",
        products_supplied: supProducts.trim() || "General Goods",
        amount_we_owe_rwf: Number(supOwed) || 0,
      };
      setSuppliers((prev) => [created, ...prev]);
      toast.success(`Saved supplier locally.`);
    }

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
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader
        title="Suppliers & Ordering"
        right={
          <div className="flex items-center gap-1.5 sm:gap-2 font-heading">
            <button
              onClick={() => setCreatePoOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-black text-white shadow-orange-sm hover:bg-primary-hover transition cursor-pointer active:scale-95"
            >
              <PackagePlus size={15} strokeWidth={2.5} />
              <span>+ New Order</span>
            </button>

            <button
              onClick={() => setAddSupOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-card border border-line px-3 py-1.5 text-xs font-bold text-ink hover:border-primary/40 transition cursor-pointer active:scale-95"
            >
              <Plus size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">Supplier</span>
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Strip: Customers, Owed to Us, Payables, Active Orders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Customers */}
          <div
            onClick={() => setActiveTab("customers")}
            className={`p-4 rounded-2xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "customers" ? "border-primary ring-2 ring-primary/20 shadow-orange-sm" : "border-line hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">Customers</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-1 text-xl font-heading font-black text-ink tabnum">{allCustomers.length}</div>
            <div className="mt-1 text-[11px] text-muted">Customer profiles & history</div>
          </div>

          {/* Card 2: Customer Debts (Owed to Us) */}
          <div
            onClick={() => setActiveTab("owed")}
            className={`p-4 rounded-2xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "owed" ? "border-primary ring-2 ring-primary/20 shadow-orange-sm" : "border-line hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">Customer Debts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-primary border border-line">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-1 text-xl font-heading font-black text-ink tabnum">{rwf(totalOwedToUs)} RWF</div>
            <span className="text-[10.5px] font-medium text-muted block mt-0.5">{receivables.length} unpaid invoices</span>
          </div>

          {/* Card 3: Payables (Owed to Suppliers) */}
          <div
            onClick={() => setActiveTab("payables")}
            className={`p-4 rounded-2xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "payables" ? "border-primary ring-2 ring-primary/20 shadow-orange-sm" : "border-line hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">Supplier Debts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-hover text-muted border border-line">
                <Truck size={16} />
              </div>
            </div>
            <div className="mt-1 text-xl font-heading font-black text-ink tabnum">{rwf(totalPayables)} RWF</div>
            <span className="text-[10.5px] font-medium text-muted block mt-0.5">{suppliers.length} saved suppliers</span>
          </div>

          {/* Card 4: Supplier Orders */}
          <div
            onClick={() => setActiveTab("orders")}
            className={`p-4 rounded-2xl border bg-card shadow-card transition cursor-pointer active:scale-[0.99] ${
              activeTab === "orders" ? "border-primary ring-2 ring-primary/20 shadow-orange-sm" : "border-line hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">Purchase Orders</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Package size={16} />
              </div>
            </div>
            <div className="mt-1 text-xl font-heading font-black text-ink tabnum">{orders.length}</div>
            <span className="text-[10.5px] font-heading font-bold text-primary block mt-0.5">
              {orders.filter((o) => o.status !== "stocked").length} active shipments
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap font-heading">
          <div className="flex items-center gap-1.5 bg-card p-1.5 rounded-xl border border-line shadow-sm overflow-x-auto">
            {[
              { id: "orders", label: "Supplier Orders", count: orders.length },
              { id: "payables", label: "Suppliers & Payables", count: suppliers.length },
              { id: "customers", label: "Customers", count: allCustomers.length },
              { id: "owed", label: "Customer Debts", count: receivables.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.2 rounded-md text-[10px] font-black tabnum ${
                  activeTab === tab.id ? "bg-black/20 text-white" : "bg-card-hover text-muted"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs font-body">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier, item, PO…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-3 py-2 text-xs font-semibold text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* TAB: SUPPLIER ORDERS (WHATSAPP & ARRIVAL TRACKING) */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "All Orders" },
                { id: "ordered", label: "Ordered" },
                { id: "in_transit", label: "In Transit" },
                { id: "received", label: "Received (Arrived)" },
                { id: "stocked", label: "Stocked in Inventory" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
                    orderStatusFilter === f.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="p-12 text-center text-xs font-bold text-muted">Loading purchase orders…</div>
            ) : orders.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-card shadow-card space-y-4 max-w-lg mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-orange-sm">
                  <Boxes size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-ink">No Supplier Orders Yet</h3>
                  <p className="mt-1.5 text-xs text-muted font-body leading-relaxed max-w-xs mx-auto">
                    Create purchase orders to restock products from your suppliers, send orders via WhatsApp with 1 tap, and track arrival through to inventory stocking.
                  </p>
                </div>
                <button
                  onClick={() => setCreatePoOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-heading font-black text-white hover:bg-primary-hover active:scale-95 transition shadow-orange-sm cursor-pointer mt-2"
                >
                  <PackagePlus size={16} />
                  <span>+ Create First Purchase Order</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders
                  .filter((o) => {
                    if (orderStatusFilter !== "all") {
                      if (orderStatusFilter === "received") return o.status === "received" || o.status === "arrived";
                      return o.status === orderStatusFilter;
                    }
                    return true;
                  })
                  .filter((o) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      String(o.id).includes(q) ||
                      o.supplier_name?.toLowerCase().includes(q) ||
                      o.notes?.toLowerCase().includes(q) ||
                      (o.items || []).some((it) => it.item_name?.toLowerCase().includes(q))
                    );
                  })
                  .map((o) => {
                    const isStocked = o.status === "stocked";
                    const isReceived = o.status === "received" || o.status === "arrived";
                    const isInTransit = o.status === "in_transit";
                    const isOrdered = o.status === "ordered" || o.status === "draft";

                    const statusColor = isStocked
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-card-hover text-ink border-line";

                    return (
                      <div
                        key={o.id}
                        className="flex flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card hover:border-primary/40 transition space-y-4 font-body"
                      >
                        {/* Order Header */}
                        <div>
                          <div className="flex items-start justify-between gap-2 font-heading">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                  PO-{o.id}
                                </span>
                                <h3 className="font-black text-sm text-ink">{o.supplier_name || "Supplier"}</h3>
                              </div>
                              <p className="text-[11px] text-muted mt-1 font-body">
                                Ordered: {formatDate(o.order_date || o.created_at)}
                                {o.arrival_date ? ` · Delivery: ${formatDate(o.arrival_date)}` : ""}
                              </p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-heading font-black uppercase tracking-wide border ${statusColor}`}>
                              {o.status?.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Items List Preview */}
                          <div className="mt-3.5 p-3 rounded-xl bg-card-hover border border-line space-y-1.5 text-xs">
                            <div className="font-heading font-bold text-muted flex justify-between text-[10px] uppercase tracking-wider">
                              <span>Line Items ({o.items_count || (o.items || []).length})</span>
                              <span>Subtotal</span>
                            </div>
                            {(o.items || []).slice(0, 4).map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-ink font-body">
                                <span className="truncate pr-2 font-medium">
                                  <strong className="font-heading font-bold text-primary">{it.quantity}x</strong> {it.item_name}
                                </span>
                                <span className="font-mono text-ink font-bold tabnum shrink-0">
                                  {rwf((Number(it.quantity) || 1) * (Number(it.unit_cost_rwf) || 0))} RWF
                                </span>
                              </div>
                            ))}
                            {(o.items || []).length > 4 && (
                              <div className="text-[10px] text-primary font-bold font-heading">
                                + {(o.items || []).length - 4} more items…
                              </div>
                            )}

                            <div className="mt-2 pt-2 border-t border-line flex justify-between items-center font-heading font-black text-ink">
                              <span>Total Estimated Cost:</span>
                              <span className="text-ink tabnum text-sm">
                                {rwf(o.total_cost_rwf || 0)} RWF
                              </span>
                            </div>
                          </div>

                          {o.notes && (
                            <p className="text-[11px] text-muted italic mt-2 font-body">
                              Notes: {o.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 font-heading">
                          {/* WhatsApp Click-to-Chat Button */}
                          <button
                            type="button"
                            onClick={() => handleSendToWhatsApp(o)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-line hover:bg-card-hover text-ink text-xs font-bold transition cursor-pointer"
                            title="Send Purchase Order to Supplier on WhatsApp"
                          >
                            <MessageSquare size={14} className="text-primary" />
                            <span>WhatsApp Order</span>
                          </button>

                          {/* Lifecycle Steppers */}
                          <div className="flex items-center gap-2">
                            {isOrdered && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePoStatus(o, "in_transit")}
                                  className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover text-ink border border-line text-xs font-bold transition cursor-pointer"
                                >
                                  Mark In Transit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePoStatus(o, "received")}
                                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm"
                                >
                                  Mark Received
                                </button>
                              </>
                            )}

                            {isInTransit && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePoStatus(o, "received")}
                                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm"
                              >
                                Mark Received
                              </button>
                            )}

                            {isReceived && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePoStatus(o, "stocked")}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm active:scale-95"
                              >
                                <PackageCheck size={14} />
                                <span>Mark as Stocked</span>
                              </button>
                            )}

                            {isStocked && (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                                <CheckCircle2 size={13} /> In Stock
                              </span>
                            )}

                            {!isStocked && (
                              <button
                                type="button"
                                onClick={() => handleDeletePo(o)}
                                className="p-2 text-muted hover:text-ink hover:bg-card-hover border border-line rounded-xl transition cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
          <div className="space-y-3 font-body">
            {allCustomers.filter((c) => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-card shadow-card space-y-4 max-w-lg mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card-hover border border-line text-primary shadow-sm">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-ink">No Customers Listed Yet</h3>
                  <p className="mt-1.5 text-xs text-muted font-body leading-relaxed max-w-xs mx-auto">
                    Add your customer client accounts or record credit sales at the POS counter to track receivables.
                  </p>
                </div>
                <button
                  onClick={() => setAddCustOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-heading font-black text-white hover:bg-primary-hover active:scale-95 transition shadow-orange-sm cursor-pointer mt-2"
                >
                  <UserPlus size={16} />
                  <span>+ Add Your First Customer Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCustomers
                  .filter((c) => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card hover:border-primary/40 transition font-body"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card-hover border border-line text-primary font-heading font-black text-base shrink-0">
                          {initials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-black text-ink truncate">{c.name}</h3>
                          <p className="text-xs text-muted mt-0.5">{c.phone || "No phone"}</p>

                          <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted font-medium">Total Spent:</span>
                              <span className="font-heading font-bold text-ink tabnum">{rwf(c.total_spent_rwf)} RWF</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted font-medium">Owed to Us:</span>
                              <span className="font-heading font-black tabnum text-ink">
                                {c.owed_to_us_rwf > 0 ? `${rwf(c.owed_to_us_rwf)} RWF` : "Clean 0 RWF"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {c.phone && c.phone !== "N/A" && (
                        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between font-heading">
                          <span className="text-[11px] font-semibold text-muted font-mono">{c.phone}</span>
                          <a
                            href={`tel:${c.phone}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card border border-line hover:bg-card-hover text-ink text-xs font-bold transition"
                          >
                            <Phone size={13} className="text-primary" /> Call Client
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECEIVABLES */}
        {activeTab === "owed" && (
          <div className="space-y-3 font-body">
            {receivables.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted bg-card rounded-2xl border border-line space-y-2">
                <div className="w-12 h-12 rounded-xl bg-card-hover border border-line text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-heading font-black text-sm text-ink">All Customer Accounts Settled!</p>
                <p className="text-xs text-muted">You have 0 outstanding credit receivables.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivables.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card shadow-card"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-heading">
                        <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          {s.invoice_number || `INV-${s.id}`}
                        </span>
                        <h4 className="font-black text-sm text-ink">{s.customer_name || "Customer"}</h4>
                      </div>
                      <p className="text-xs text-muted mt-1 font-body">
                        Sale Date: {formatDate(s.created_at)} &bull; Total Sale: {rwf(s.total_amount)} RWF
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-line font-heading">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-muted uppercase block">Amount Owed</span>
                        <span className="text-base font-black text-ink tabnum">
                          {rwf(s.amount_owed || s.total_amount)} RWF
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setPayModalSale(s);
                          setPayAmount(String(s.amount_owed || s.total_amount));
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-xs font-black text-white shadow-orange-sm hover:bg-primary-hover transition cursor-pointer"
                      >
                        Record Repayment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYABLES & SUPPLIERS */}
        {activeTab === "payables" && (
          <div className="space-y-3 font-body">
            {suppliers.filter((s) => !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-card shadow-card space-y-4 max-w-lg mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card-hover border border-line text-primary shadow-sm">
                  <Truck size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-ink">No Stock Suppliers Listed Yet</h3>
                  <p className="mt-1.5 text-xs text-muted font-body leading-relaxed max-w-xs mx-auto">
                    Add your stock suppliers to manage invoice payables and restock orders.
                  </p>
                </div>
                <button
                  onClick={() => setAddSupOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-heading font-black text-white hover:bg-primary-hover active:scale-95 transition shadow-orange-sm cursor-pointer mt-2"
                >
                  <Plus size={16} />
                  <span>+ Add Stock Supplier Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers
                  .filter((s) => !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card hover:border-primary/40 transition font-body"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card-hover border border-line text-primary font-heading font-black text-base shrink-0">
                          <Truck size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-black text-ink truncate">{s.name}</h3>
                          <p className="text-xs text-muted mt-0.5">{s.phone || "No phone"}</p>
                          <p className="text-xs text-muted mt-1 italic truncate">
                            Products: {s.products_supplied || "General Supplies"}
                          </p>

                          <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted font-medium">We Owe Supplier:</span>
                              <span className="font-heading font-black tabnum text-ink">
                                {s.amount_we_owe_rwf > 0 ? `${rwf(s.amount_we_owe_rwf)} RWF` : "Paid in Full"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2 font-heading">
                        {s.phone && s.phone !== "N/A" ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-line bg-card hover:bg-card-hover text-xs font-bold text-ink transition"
                          >
                            <Phone size={13} className="text-primary" /> Call
                          </a>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPoSupplierId(String(s.id));
                              setCreatePoOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm"
                          >
                            Order Stock
                          </button>
                          <button
                            onClick={() => handlePaySupplier(s.id, s.amount_we_owe_rwf)}
                            className="px-3.5 py-1.5 rounded-xl bg-card hover:bg-card-hover border border-line text-xs font-bold text-ink transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE PURCHASE ORDER MODAL SHEET */}
      <Sheet open={createPoOpen} onClose={() => setCreatePoOpen(false)} title="New Supplier Purchase Order">
        <form onSubmit={handleCreatePoSubmit} className="space-y-4 pt-2 font-body pb-6">
          <div className="p-3.5 rounded-2xl bg-card-hover border border-line text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 font-heading font-black text-ink">
              <PackagePlus size={15} className="text-primary" />
              <span>WhatsApp Supplier Restocking</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed font-body">
              Assemble your purchase order lines. Once created, you can instantly dispatch the pre-formatted order directly to the supplier via WhatsApp with 1 tap.
            </p>
          </div>

          <Field label="Stock Supplier *">
            <select
              required
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs font-bold text-ink focus:border-primary focus:outline-none shadow-sm"
            >
              <option value="">Select a supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Order Date">
              <TextInput
                type="date"
                value={poOrderDate}
                onChange={(e) => setPoOrderDate(e.target.value)}
              />
            </Field>

            <Field label="Expected Delivery Date">
              <TextInput
                type="date"
                value={poArrivalDate}
                onChange={(e) => setPoArrivalDate(e.target.value)}
              />
            </Field>
          </div>

          {/* DYNAMIC LINE ITEMS BUILDER */}
          <div className="space-y-2 pt-2 border-t border-line font-body">
            <div className="flex items-center justify-between font-heading">
              <label className="text-xs font-black uppercase tracking-wider text-ink">
                Order Items ({poItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddPoItemRow}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Product
              </button>
            </div>

            <div className="space-y-2.5">
              {poItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-card-hover border border-line space-y-2">
                  <div className="flex items-center justify-between gap-2 font-heading">
                    <span className="text-[10px] font-black text-muted uppercase">Item #{idx + 1}</span>
                    {poItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePoItemRow(idx)}
                        className="text-muted hover:text-ink transition p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Product Catalog Picker / Custom Item Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-heading font-bold text-muted block mb-0.5">Pick from Catalog</label>
                      <select
                        value={item.stock_item_id || ""}
                        onChange={(e) => handleItemStockChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-line bg-card p-2 text-xs font-semibold text-ink outline-none"
                      >
                        <option value="">-- Custom Item --</option>
                        {(catalogItems.length > 0 ? catalogItems : (stock || [])).map((stk) => (
                          <option key={stk.id} value={stk.id}>
                            {stk.name} ({rwf(stk.cost_price_rwf || 0)} RWF)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-heading font-bold text-muted block mb-0.5">Item Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Inyange Milk 500ml"
                        value={item.item_name}
                        onChange={(e) => handleItemFieldChange(idx, "item_name", e.target.value)}
                        className="w-full rounded-xl border border-line bg-card p-2 text-xs font-semibold text-ink outline-none"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit Cost */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-heading font-bold text-muted block mb-0.5">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="10"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                        className="w-full rounded-xl border border-line bg-card p-2 text-xs font-heading font-black text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-heading font-bold text-muted block mb-0.5">Unit Cost (RWF)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="600"
                        value={item.unit_cost_rwf}
                        onChange={(e) => handleItemFieldChange(idx, "unit_cost_rwf", e.target.value)}
                        className="w-full rounded-xl border border-line bg-card p-2 text-xs font-heading font-bold text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-heading font-bold text-muted block mb-0.5">Subtotal</label>
                      <div className="p-2 rounded-xl bg-card border border-line text-xs font-heading font-black text-ink tabnum truncate">
                        {rwf((Number(item.quantity) || 1) * (Number(item.unit_cost_rwf) || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Order Preview */}
            <div className="p-3.5 rounded-2xl bg-card border border-line flex items-center justify-between font-heading">
              <span className="text-xs font-bold text-muted">Total Estimated Order:</span>
              <span className="text-base font-black text-ink tabnum">{rwf(poCalculatedTotal)} RWF</span>
            </div>
          </div>

          <Field label="Special Delivery Instructions / Notes">
            <TextInput
              placeholder="e.g. Please deliver before 10:00 AM at the Nyarugenge store"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </Field>

          <div className="pt-3 flex gap-2 font-heading">
            <Button type="button" variant="paper" onClick={() => setCreatePoOpen(false)} className="flex-1">
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={poSaving}
              className="flex-1 font-black shadow-orange-sm"
            >
              {poSaving ? "Creating Order…" : "Create & Send Order"}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* ADD CUSTOMER MODAL SHEET */}
      <Sheet open={addCustOpen} onClose={() => setAddCustOpen(false)} title="Add Customer Account">
        <form onSubmit={handleAddCustomer} className="space-y-4 pt-2 font-body pb-6">
          <Field label="Customer Full Name *">
            <TextInput
              required
              placeholder="e.g. Jean Paul Bizimana"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone Number">
              <TextInput
                type="tel"
                placeholder="0788123456"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
            </Field>

            <Field label="Email Address">
              <TextInput
                type="email"
                placeholder="customer@gmail.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Approved Credit Limit (RWF)">
            <TextInput
              type="number"
              placeholder="200000"
              value={custLimit}
              onChange={(e) => setCustLimit(e.target.value)}
            />
          </Field>

          <div className="pt-2 flex gap-2 font-heading">
            <Button type="button" variant="paper" onClick={() => setAddCustOpen(false)} className="flex-1">
              Cancel
            </Button>

            <Button type="submit" variant="primary" className="flex-1 font-black shadow-orange-sm">
              Save Customer
            </Button>
          </div>
        </form>
      </Sheet>

      {/* ADD SUPPLIER MODAL SHEET */}
      <Sheet open={addSupOpen} onClose={() => setAddSupOpen(false)} title="Add Stock Supplier Account">
        <form onSubmit={handleAddSupplier} className="space-y-4 pt-2 font-body pb-6">
          <Field label="Supplier / Company Name *">
            <TextInput
              required
              placeholder="e.g. Inyange Industries Ltd"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier Phone">
              <TextInput
                type="tel"
                placeholder="0788900100"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
              />
            </Field>

            <Field label="Current Amount We Owe (RWF)">
              <TextInput
                type="number"
                placeholder="0"
                value={supOwed}
                onChange={(e) => setSupOwed(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Products / Items Supplied">
            <TextInput
              placeholder="e.g. Milk, Juices, Bottled Water"
              value={supProducts}
              onChange={(e) => setSupProducts(e.target.value)}
            />
          </Field>

          <div className="pt-2 flex gap-2 font-heading">
            <Button type="button" variant="paper" onClick={() => setAddSupOpen(false)} className="flex-1">
              Cancel
            </Button>

            <Button type="submit" variant="primary" className="flex-1 font-black shadow-orange-sm">
              Save Supplier
            </Button>
          </div>
        </form>
      </Sheet>

      {/* RECORD DEBT REPAYMENT MODAL SHEET */}
      <Sheet open={!!payModalSale} onClose={() => setPayModalSale(null)} title="Record Customer Debt Repayment">
        {payModalSale && (
          <form onSubmit={handleRecordDebtPaymentSubmit} className="space-y-4 pt-2 font-body pb-6">
            <div className="p-4 rounded-2xl bg-card-hover border border-line text-xs text-ink space-y-1 font-heading">
              <div className="flex justify-between font-bold">
                <span>Invoice: {payModalSale.invoice_number || `INV-${payModalSale.id}`}</span>
                <span className="tabnum text-primary">Owed: {rwf(payModalSale.amount_owed || payModalSale.total_amount)} RWF</span>
              </div>
              <div className="font-body text-muted">Customer: <strong className="text-ink font-heading">{payModalSale.customer_name}</strong></div>
            </div>

            <Field label="Repayment Amount (RWF) *">
              <TextInput
                required
                type="number"
                min="1"
                max={payModalSale.amount_owed || payModalSale.total_amount}
                placeholder="Enter amount paid"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Payment Method">
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-2xl border border-line bg-paper p-3 text-xs font-semibold text-ink outline-none"
              >
                <option value="cash">Cash</option>
                <option value="momo">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </Field>

            <Field label="Notes / Reference (Optional)">
              <TextInput
                placeholder="e.g. Partial repayment via Cash"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </Field>

            <div className="pt-2 flex gap-2 font-heading">
              <Button type="button" variant="paper" onClick={() => setPayModalSale(null)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1 font-black shadow-orange-sm">
                Save Repayment
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
