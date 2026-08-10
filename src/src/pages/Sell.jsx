import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Search, Plus, Minus, CheckCircle2, ShoppingCart, History, Smartphone, Banknote, Share2, AlertCircle, Clock, Calendar, AlertTriangle } from "lucide-react";
import api from "../lib/api";
import { StorageEngine } from "../lib/storage";
import { useLang } from "../lib/i18n.jsx";
import { rwf, todayISO } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { Button, TextInput } from "../components/ui";

export default function Sell() {
  const { t } = useLang();
  const [tab, setTab] = useState("pos"); // "pos" | "history"
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeCat, setActiveCat] = useState("__all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState({});
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [customer, setCustomer] = useState("");
  const [saving, setSaving] = useState(false);

  // Partial Payment & Customer Debt controls
  const [isPartial, setIsPartial] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());

  const load = useCallback(async () => {
    try {
      const [prodRes, salesRes] = await Promise.allSettled([
        api.get("/stock", { params: { limit: 300 } }),
        api.get("/sales", { params: { limit: 50 } }),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value.data?.data)) {
        setProducts(prodRes.value.data.data);
      } else {
        setProducts(StorageEngine.getStock());
      }

      if (salesRes.status === "fulfilled" && Array.isArray(salesRes.value.data?.data)) {
        setSalesHistory(salesRes.value.data.data);
      } else {
        setSalesHistory(StorageEngine.getSales());
      }
    } catch {
      setProducts(StorageEngine.getStock());
      setSalesHistory(StorageEngine.getSales());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set(["__all"]);
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCat !== "__all" && p.category !== activeCat) return false;
      if (query && !p.name?.toLowerCase().includes(query.toLowerCase()) && !p.category?.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCat, query]);

  const lines = Object.values(cart);
  const totalItems = lines.reduce((s, l) => s + l.qty, 0);
  const totalAmount = lines.reduce((s, l) => s + l.qty * (l.item.sell_price_rwf || 0), 0);

  const paidVal = isPartial ? Number(amountPaid) || 0 : totalAmount;
  const remainingDebt = Math.max(0, totalAmount - paidVal);

  const addToCart = (item) => {
    setCart((c) => {
      const cur = c[item.id];
      const max = Number(item.quantity) || 0;
      const nextQty = Math.min((cur?.qty || 0) + 1, max);
      if (nextQty === 0) {
        toast.error("Item out of stock");
        return c;
      }
      return { ...c, [item.id]: { item, qty: nextQty } };
    });
  };

  const decFromCart = (item) => {
    setCart((c) => {
      const cur = c[item.id];
      if (!cur) return c;
      const nextQty = cur.qty - 1;
      const next = { ...c };
      if (nextQty <= 0) delete next[item.id];
      else next[item.id] = { item, qty: nextQty };
      return next;
    });
  };

  async function handleComplete() {
    if (!lines.length) return;

    if (isPartial) {
      if (paidVal < 0 || paidVal >= totalAmount) {
        toast.error("Partial payment amount must be less than total payable");
        return;
      }
      if (!customer.trim()) {
        toast.error("Please enter customer name to track the debt");
        return;
      }
      if (!dueDate) {
        toast.error("Please select a due date for the remaining debt");
        return;
      }
    }

    setSaving(true);
    try {
      const items = lines.map((l) => ({
        stock_item_id: l.item.id,
        quantity: l.qty,
        unit_price: Number(l.item.sell_price_rwf) || 0,
      }));

      await api.post("/sales", {
        items,
        payment_method: method,
        customer_name: customer.trim() || "Walk-in Customer",
        amount_paid: paidVal,
        due_date: isPartial ? dueDate : null,
      }).catch(() => null);

      StorageEngine.createSale({
        items,
        payment_method: method,
        customer_name: customer.trim() || "Walk-in Customer",
        amount_paid: paidVal,
        due_date: isPartial ? dueDate : null,
        is_partial: isPartial
      });

      toast.success(isPartial ? `Debt Sale Recorded! Customer Debt: ${rwf(remainingDebt)} RWF` : "Sale completed successfully!");
      setCart({});
      setCustomer("");
      setPayOpen(false);
      setMethod("cash");
      setIsPartial(false);
      setAmountPaid("");
      setDueDate(todayISO());
      load();
    } catch {
      toast.error("Could not record sale");
    } finally {
      setSaving(false);
    }
  }

  function handleVoid(saleId) {
    StorageEngine.voidSale(saleId);
    toast.success("Sale voided");
    load();
  }

  function shareReceipt(sale) {
    const text = `*RECEIPT: ${sale.invoice_number}*\nCustomer: ${sale.customer_name}\nTotal: ${rwf(sale.total_amount)} RWF\nPaid: ${rwf(sale.amount_paid || sale.total_amount)} RWF\n${sale.is_debt || sale.remaining_debt > 0 ? `Remaining Debt: ${rwf(sale.remaining_debt)} RWF (Due: ${sale.due_date || 'N/A'})\n` : ''}Payment Method: ${sale.payment_method?.toUpperCase()}\nDate: ${new Date(sale.created_at).toLocaleString()}\n\nThank you for choosing Inzira DataBridge!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (loading) return <Loading label="Loading POS catalog..." />;

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader
        title="Sales POS & Cashier"
        right={
          <div className="flex items-center gap-1 rounded-xl bg-card border border-line p-1">
            <button
              onClick={() => setTab("pos")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${tab === "pos" ? "bg-primary text-white" : "text-muted"}`}
            >
              <ShoppingCart size={13} /> POS
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${tab === "history" ? "bg-primary text-white" : "text-muted"}`}
            >
              <History size={13} /> History
            </button>
          </div>
        }
      />

      {tab === "pos" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search & Categories */}
          <div className="px-4 space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2">
              <Search size={15} className="text-muted" />
              <input
                className="flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted"
                placeholder="Search item to sell..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize whitespace-nowrap transition-colors ${
                    activeCat === c ? "bg-primary text-white" : "bg-card border border-line text-muted"
                  }`}
                >
                  {c === "__all" ? "All Items" : c}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid / List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {visibleProducts.map((p) => {
              const inCart = cart[p.id]?.qty || 0;
              const isOut = Number(p.quantity) <= 0;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-3 shadow-xs">
                  <div>
                    <div className="text-[13px] font-bold text-ink">{p.name}</div>
                    <div className="text-[11px] font-bold text-primary">{rwf(p.sell_price_rwf)} RWF</div>
                    <div className="text-[10px] text-muted">{p.category || 'General'} • In Stock: {p.quantity}</div>
                  </div>

                  {isOut ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">
                      Out of Stock
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {inCart > 0 && (
                        <>
                          <button onClick={() => decFromCart(p)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-bg text-ink font-bold">
                            <Minus size={14} />
                          </button>
                          <span className="w-5 text-center text-[13px] font-bold tabnum text-ink">{inCart}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(p)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white font-bold">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cart Bar */}
          {totalItems > 0 && (
            <div className="p-4 bg-card border-t border-line shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-muted">{totalItems} items selected</span>
                <span className="text-[16px] font-bold tabnum text-primary">{rwf(totalAmount)} RWF</span>
              </div>
              <Button full variant="green" onClick={() => setPayOpen(true)}>
                Checkout & Charge {rwf(totalAmount)} RWF
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* History View */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {salesHistory.map((s) => {
            const hasDebt = s.is_debt || Number(s.remaining_debt) > 0;
            return (
              <div key={s.id} className="rounded-xl border border-line bg-card p-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold text-primary">{s.invoice_number}</span>
                      {hasDebt && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9.5px] font-bold text-amber-800">
                          DEBT / PARTIAL
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] font-bold text-ink mt-0.5">{s.customer_name}</div>
                    <div className="text-[10.5px] text-muted">{new Date(s.created_at).toLocaleString()} • {s.payment_method?.toUpperCase()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold tabnum text-ink">{rwf(s.total_amount)} RWF</div>
                    {hasDebt ? (
                      <div className="text-[11px] font-bold text-amber-600">Debt: {rwf(s.remaining_debt)} RWF</div>
                    ) : (
                      <div className="text-[10px] text-emerald-600 font-bold">Paid Full</div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
                  <span className={`text-[10px] font-bold ${s.is_voided ? 'text-red-600' : 'text-emerald-700'}`}>
                    {s.is_voided ? 'VOIDED' : 'COMPLETED'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => shareReceipt(s)} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                      <Share2 size={12} /> WhatsApp
                    </button>
                    {!s.is_voided && (
                      <button onClick={() => handleVoid(s.id)} className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                        Void
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Sheet with Full Payment vs Debt/Partial Payment Toggle */}
      <Sheet open={payOpen} onClose={() => setPayOpen(false)} title="Complete Sale & Payment">
        <div className="space-y-4 p-4">
          {/* Payment Type Switcher: Full vs Partial / Debt */}
          <div className="flex items-center justify-between rounded-xl bg-bg border border-line p-1">
            <button
              onClick={() => setIsPartial(false)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${!isPartial ? 'bg-primary text-white' : 'text-muted'}`}
            >
              Full Payment
            </button>
            <button
              onClick={() => setIsPartial(true)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${isPartial ? 'bg-amber-600 text-white' : 'text-muted'}`}
            >
              Debt / Partial Payment
            </button>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-muted block mb-1">
              Customer Name {isPartial ? <span className="text-red-500">* (Required for Debt)</span> : "(Optional)"}
            </label>
            <TextInput
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Amani Boutique or Walk-in"
              required={isPartial}
            />
          </div>

          {isPartial ? (
            /* Partial Payment / Customer Debt Fields */
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-800">
                <AlertTriangle size={15} /> Customer Debt & Partial Payment
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">Initial Amount Paid Today (RWF)</label>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`e.g. ${Math.round(totalAmount / 2)}`}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted block mb-1">Due Date for Remaining Debt Balance</label>
                <TextInput
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-lg bg-card p-2.5 border border-line text-[12px]">
                <div className="flex justify-between text-muted"><span>Total Sale:</span><span className="font-bold tabnum text-ink">{rwf(totalAmount)} RWF</span></div>
                <div className="flex justify-between text-emerald-600 font-bold mt-1"><span>Paid Today:</span><span className="tabnum">{rwf(paidVal)} RWF</span></div>
                <div className="flex justify-between text-amber-600 font-extrabold text-[13px] border-t border-line/60 pt-1 mt-1">
                  <span>Remaining Customer Debt:</span>
                  <span className="tabnum">{rwf(remainingDebt)} RWF</span>
                </div>
              </div>
            </div>
          ) : (
            /* Full Payment Method Buttons */
            <div>
              <label className="text-[12px] font-semibold text-muted block mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
                  { id: "airtel", label: "Airtel Money", icon: Smartphone },
                  { id: "bank_transfer", label: "Bank Transfer", icon: Banknote },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-[12px] font-bold transition-all ${
                      method === id ? "border-primary bg-primary/10 text-primary" : "border-line bg-card text-muted"
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button full variant={isPartial ? "warning" : "green"} loading={saving} onClick={handleComplete}>
            {isPartial ? `Record Sale with ${rwf(remainingDebt)} RWF Debt` : `Confirm Payment & Save Sale`}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
