import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Plus, AlertTriangle, Package, DollarSign, Trash2, ArrowUpRight, Check } from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";
import { useData } from "../context/DataContext";

function statusOf(item) {
  const q = Number(item.quantity) || 0;
  const th = Number(item.low_stock_threshold) || 5;
  if (q === 0) return "out";
  if (q <= th) return "low";
  return "ok";
}

function StockCard({ item, t, onRestock, onDelete }) {
  const st = statusOf(item);
  const color =
    st === "out"
      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
      : st === "low"
      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  const th = Number(item.low_stock_threshold) || 5;
  const pct = Math.max(6, Math.min(100, (Number(item.quantity) / (th * 3)) * 100));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-card overflow-hidden shadow-card hover:border-primary/40 hover:bg-card-hover/40 transition duration-150 group font-body">
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-heading font-extrabold text-ink truncate group-hover:text-primary transition">{item.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-heading font-extrabold uppercase shrink-0 ${color}`}>
              {st === "out" ? "Out of Stock" : st === "low" ? "Low Stock" : "In Stock"}
            </span>
          </div>

          {item.category && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-card-hover border border-line text-muted text-[9px] font-heading font-bold uppercase tracking-wider">
              {item.category}
            </span>
          )}

          <div className="flex items-baseline justify-between mt-2.5 text-xs">
            <span className="text-muted font-medium">{t("sell_price")}:</span>
            <span className="font-heading font-black tabnum text-ink">{rwf(item.sell_price_rwf)} RWF</span>
          </div>
        </div>

        <div className="pt-3 border-t border-line">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-muted">{t("quantity")}:</span>
            <span className="font-heading font-black tabnum text-ink">
              {Number(item.quantity)} {item.unit ? `${item.unit}` : ""}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-card-hover border border-line overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                st === "out" ? "bg-rose-500" : st === "low" ? "bg-amber-400" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Action Row: Quick Restock + Delete Option */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-line">
            <button
              type="button"
              onClick={() => onRestock(item)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-heading font-bold transition active:scale-95 cursor-pointer shadow-orange-sm"
            >
              <Plus size={14} strokeWidth={2.5} className="shrink-0" />
              <span>Restock (+Qty)</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
              title="Delete Product (Logged)"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRESET_PRODUCTS = [
  { name: "Sugar 1kg", category: "Groceries", unit: "kg", cost_price_rwf: 1200, sell_price_rwf: 1500, low_stock_threshold: 10, default_qty: 25 },
  { name: "Rice 1kg", category: "Groceries", unit: "kg", cost_price_rwf: 1100, sell_price_rwf: 1300, low_stock_threshold: 10, default_qty: 30 },
  { name: "Cooking Oil 1L", category: "Groceries", unit: "litre", cost_price_rwf: 2200, sell_price_rwf: 2600, low_stock_threshold: 5, default_qty: 15 },
  { name: "Wheat Flour 1kg", category: "Groceries", unit: "kg", cost_price_rwf: 900, sell_price_rwf: 1200, low_stock_threshold: 10, default_qty: 20 },
  { name: "Milk 1L Box", category: "Dairy", unit: "pcs", cost_price_rwf: 800, sell_price_rwf: 1000, low_stock_threshold: 6, default_qty: 24 },
  { name: "Bread (Fresh Loaf)", category: "Bakery", unit: "pcs", cost_price_rwf: 700, sell_price_rwf: 900, low_stock_threshold: 5, default_qty: 12 },
  { name: "Soap Bar", category: "Hygiene", unit: "pcs", cost_price_rwf: 400, sell_price_rwf: 600, low_stock_threshold: 10, default_qty: 40 },
  { name: "Soda Bottle 300ml", category: "Beverages", unit: "pcs", cost_price_rwf: 350, sell_price_rwf: 500, low_stock_threshold: 12, default_qty: 48 },
  { name: "Mineral Water 0.5L", category: "Beverages", unit: "pcs", cost_price_rwf: 200, sell_price_rwf: 300, low_stock_threshold: 15, default_qty: 60 },
  { name: "Men Plain T-Shirt", category: "Apparel", unit: "pcs", cost_price_rwf: 3500, sell_price_rwf: 5000, low_stock_threshold: 3, default_qty: 10 },
  { name: "Women Floral Dress", category: "Apparel", unit: "pcs", cost_price_rwf: 7000, sell_price_rwf: 10000, low_stock_threshold: 2, default_qty: 8 },
  { name: "Men Slim Jeans", category: "Apparel", unit: "pcs", cost_price_rwf: 8000, sell_price_rwf: 12000, low_stock_threshold: 3, default_qty: 10 },
  { name: "Airtime Card 1000 RWF", category: "Telecom", unit: "pcs", cost_price_rwf: 960, sell_price_rwf: 1000, low_stock_threshold: 20, default_qty: 50 },
];

const EMPTY = {
  name: "",
  category: "",
  unit: "pcs",
  quantity: "",
  cost_price_rwf: "",
  sell_price_rwf: "",
  low_stock_threshold: "5",
};

export default function Stock() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const { stock, addStockItem, addStockQuantity, deleteStockItem } = useData();

  const items = Array.isArray(stock) ? stock : [];

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedPresetName, setSelectedPresetName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Quick Restock State
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState("10");
  const [restocking, setRestocking] = useState(false);

  const handleQuickRestockClick = (item) => {
    setRestockTarget(item);
    setRestockQty("10");
  };

  const handleConfirmRestock = async (e) => {
    if (e) e.preventDefault();
    if (!restockTarget) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      return toast.error("Please enter a valid positive quantity to add.");
    }
    const targetItem = restockTarget;
    setRestocking(true);
    try {
      await addStockQuantity(targetItem.id, qty, "Quick restock", targetItem);
      toast.success(`🎉 Added +${qty} ${targetItem.unit || "units"} to "${targetItem.name}"!`);
      setRestockTarget(null);
    } catch {
      toast.error("Failed to update stock quantity.");
    } finally {
      setRestocking(false);
    }
  };

  const handleDeleteStockClick = async (item) => {
    if (window.confirm(`Are you sure? This action will be logged.\n\nDelete "${item.name}" from inventory?`)) {
      try {
        await deleteStockItem(item.id);
        toast.success(`"${item.name}" removed from stock and recorded in permanent deletion logs.`);
      } catch {
        toast.error("Failed to delete stock item.");
      }
    }
  };

  useEffect(() => {
    if (params.get("new") === "1") setOpen(true);
  }, [params]);

  const visible = useMemo(() => {
    const seenIds = new Set();
    const seenNames = new Set();
    return items.filter((i) => {
      if (!i || !i.id) return false;
      const cleanName = (i.name || "").toLowerCase().trim();
      if (seenIds.has(i.id) || (cleanName && seenNames.has(cleanName))) return false;
      seenIds.add(i.id);
      if (cleanName) seenNames.add(cleanName);

      return !query || cleanName.includes(query.toLowerCase());
    });
  }, [items, query]);

  const matchingExisting = useMemo(() => {
    const clean = form.name.trim().toLowerCase();
    if (!clean) return null;
    return items.find((i) => (i.name || "").toLowerCase().trim() === clean) || null;
  }, [items, form.name]);

  const lowCount = items.filter((i) => statusOf(i) !== "ok").length;
  const totalValue = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.sell_price_rwf) || 0),
    0
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyPreset = (preset) => {
    if (!preset) return;
    setSelectedPresetName(preset.name);
    setForm({
      name: preset.name,
      category: preset.category,
      unit: preset.unit,
      quantity: String(preset.default_qty || 10),
      cost_price_rwf: String(preset.cost_price_rwf || 0),
      sell_price_rwf: String(preset.sell_price_rwf || 0),
      low_stock_threshold: String(preset.low_stock_threshold || 5),
    });
  };

  async function handleQuickAddPreset(preset) {
    const cleanPresetName = preset.name?.toLowerCase().trim();
    const existing = items.find(
      (i) => (i.name || "").toLowerCase().trim() === cleanPresetName
    );
    if (existing) {
      // Prompt quick restock instead of hard error
      setRestockTarget(existing);
      setRestockQty(String(preset.default_qty || 10));
      return toast(`"${preset.name}" is already in stock. Opening restock modal!`, { icon: "📦" });
    }

    try {
      await addStockItem({
        name: preset.name,
        category: preset.category,
        unit: preset.unit,
        quantity: preset.default_qty || 10,
        cost_price_rwf: preset.cost_price_rwf,
        sell_price_rwf: preset.sell_price_rwf,
        low_stock_threshold: preset.low_stock_threshold,
      });
      toast.success(`Added "${preset.name}" to stock!`);
    } catch {
      toast.error(`Could not add "${preset.name}"`);
    }
  }

  async function handleAddAllPresets() {
    setSaving(true);
    try {
      let added = 0;
      for (const preset of PRESET_PRODUCTS.slice(0, 6)) {
        const cleanPresetName = preset.name?.toLowerCase().trim();
        const existing = items.find(
          (i) => (i.name || "").toLowerCase().trim() === cleanPresetName
        );
        if (!existing) {
          await addStockItem({
            name: preset.name,
            category: preset.category,
            unit: preset.unit,
            quantity: preset.default_qty || 10,
            cost_price_rwf: preset.cost_price_rwf,
            sell_price_rwf: preset.sell_price_rwf,
            low_stock_threshold: preset.low_stock_threshold,
          });
          added++;
        }
      }
      if (added > 0) {
        toast.success(`Added ${added} new standard catalog items!`);
      } else {
        toast.success("All preset catalog items already exist in your stock.");
      }
    } catch {
      toast.error("Failed to add preset catalog.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const cleanName = form.name.trim();
    if (!cleanName) return toast.error(t("item_name"));
    
    const existing = items.find(
      (i) => (i.name || "").toLowerCase().trim() === cleanName.toLowerCase()
    );
    if (existing) {
      const qtyToAdd = Number(form.quantity) || 0;
      if (qtyToAdd > 0) {
        setSaving(true);
        try {
          await addStockQuantity(existing.id, qtyToAdd);
          toast.success(`🎉 Added +${qtyToAdd} ${existing.unit || "units"} to existing "${existing.name}"!`);
          setForm(EMPTY);
          setSelectedPresetName("");
          setOpen(false);
          return;
        } catch {
          toast.error("Failed to add quantity to existing product.");
        } finally {
          setSaving(false);
        }
      }
      return toast.error(`"${cleanName}" already exists in stock. Enter a quantity to restock.`);
    }

    setSaving(true);
    try {
      await addStockItem({
        name: cleanName,
        category: form.category.trim() || null,
        unit: form.unit.trim() || null,
        quantity: Number(form.quantity) || 0,
        cost_price_rwf: Number(form.cost_price_rwf) || 0,
        sell_price_rwf: Number(form.sell_price_rwf) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 5,
      });
      toast.success("Product added to stock successfully!");
      setForm(EMPTY);
      setSelectedPresetName("");
      setOpen(false);
    } catch (err) {
      toast.error("Could not add the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto flex h-full flex-col font-body pb-24 md:pb-8">
      <ScreenHeader
        title={t("my_stock")}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setForm(EMPTY);
                setSelectedPresetName("");
                setOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-heading font-black text-white shadow-orange-sm hover:bg-primary-hover transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} /> <span>{t("plus_add_stock_item")}</span>
            </button>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card-hover border border-line text-primary shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">{t("all_products_upper")}</div>
            <div className="text-lg font-heading font-black tabnum text-ink">{items.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">{t("running_low")}</div>
            <div className="text-lg font-heading font-black tabnum text-ink">{lowCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider">{t("total_stock_value_upper")}</div>
            <div className="text-lg font-heading font-black tabnum text-ink">{rwf(totalValue)} RWF</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-4 py-3 shadow-sm focus-within:border-primary/50 transition">
            <Search size={16} className="text-muted shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs md:text-sm font-semibold text-ink outline-none placeholder:text-muted"
              placeholder={t("search_stock")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {lowCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs font-heading font-bold text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {lowCount} {t("running_low")}
          </span>
        </div>
      )}

      {/* Stock Cards Grid or Prominent Empty Null State with Catalog Pickers */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="mt-4 space-y-6">
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border border-dashed border-line bg-card shadow-card space-y-4 max-w-xl mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-orange-sm">
                <Package size={30} />
              </div>
              <div>
                <h3 className="text-lg font-heading font-black text-ink tracking-tight">{t("start_inventory_stock")}</h3>
                <p className="mt-1 text-xs text-muted font-medium leading-relaxed max-w-sm mx-auto">
                  {t("choose_standard_catalog")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2 font-heading">
                <button
                  onClick={handleAddAllPresets}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white hover:bg-primary-hover active:scale-95 transition shadow-orange-sm cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>+ Quick-Add Standard Starter Pack</span>
                </button>
                <button
                  onClick={() => {
                    setForm(EMPTY);
                    setSelectedPresetName("");
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-card-hover border border-line px-5 py-2.5 text-xs font-bold text-ink hover:border-primary/40 active:scale-95 transition cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.2} />
                  <span>+ Create Custom Item</span>
                </button>
              </div>
            </div>

            {/* Starter Catalog Grid */}
            <div className="space-y-3 max-w-5xl mx-auto">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-heading font-extrabold text-muted uppercase tracking-wider">
                  Pick & Add Popular SME Products
                </h4>
                <span className="text-[11px] font-heading font-bold text-primary">Click + to add instantly</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {PRESET_PRODUCTS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-line bg-card shadow-card hover:border-primary/40 transition"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-heading font-bold text-ink truncate">{preset.name}</div>
                      <div className="text-[11px] text-muted font-heading tabnum">
                        {rwf(preset.sell_price_rwf)} RWF · {preset.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreset(preset)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-orange-sm transition shrink-0 cursor-pointer"
                      title="Add to Stock"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {visible.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                t={t}
                onRestock={(it) => {
                  setRestockTarget(it);
                  setRestockQty("10");
                }}
                onDelete={(it) => setDeleteTarget(it)}
              />
            ))}
          </div>
        )}
      </div>

      {/* QUICK RESTOCK MODAL SHEET */}
      <Sheet open={!!restockTarget} onClose={() => setRestockTarget(null)} title={restockTarget ? `Restock "${restockTarget.name}"` : "Restock"}>
        {restockTarget && (
          <form onSubmit={handleConfirmRestock} className="space-y-4 pt-2 pb-6 font-body">
            {/* Current Stock Indicator */}
            <div className="p-4 rounded-2xl border border-line bg-card-hover/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-heading font-bold text-muted uppercase tracking-wider block">
                  Current in Stock
                </span>
                <span className="text-sm font-heading font-black text-ink tabnum">
                  {restockTarget.quantity} {restockTarget.unit || "pcs"}
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons (+5, +10, +20, +50, +100, +500) */}
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-2">Quick Add Amount:</label>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2 font-heading">
                {[5, 10, 20, 50, 100, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockQty(String(preset))}
                    className={`py-2 px-1 rounded-xl text-xs font-black border transition active:scale-95 cursor-pointer ${
                      Number(restockQty) === preset
                        ? "bg-primary text-white border-primary shadow-orange-sm"
                        : "bg-card text-muted border-line hover:text-ink hover:bg-card-hover"
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Quantity Input */}
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">
                Quantity to Add ({restockTarget.unit || "units"}) <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder="Enter quantity to add..."
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
              />
            </div>

            {/* New Total Preview */}
            <div className="p-3.5 rounded-xl bg-card-hover border border-line text-xs font-heading font-bold text-ink flex items-center justify-between">
              <span className="text-muted">New Total After Adding:</span>
              <span className="text-sm font-black text-ink tabnum">
                {(Number(restockTarget.quantity) || 0) + (Number(restockQty) || 0)} {restockTarget.unit || "pcs"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3 font-heading">
              <button
                type="button"
                onClick={() => setRestockTarget(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-card border border-line hover:bg-card-hover text-muted hover:text-ink text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={restocking}
                className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm active:scale-95 disabled:opacity-50"
              >
                {restocking ? "Updating…" : `Confirm +${restockQty || 0} Stock`}
              </button>
            </div>
          </form>
        )}
      </Sheet>

      {/* ADD / EDIT STOCK ITEM MODAL SHEET */}
      <Sheet open={open} onClose={() => setOpen(false)} title="New product">
        <div className="space-y-4 pt-2 font-body pb-6">
          {/* Product Name (Text Input) */}
          <div>
            <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">
              Product Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Write product name (e.g. Amata, Sugar 1kg)..."
              className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm placeholder:text-muted"
            />
            {matchingExisting && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 animate-fadeIn">
                <div>
                  <p className="text-xs font-heading font-black text-amber-400">"{matchingExisting.name}" is already in stock!</p>
                  <p className="text-[11px] text-muted font-heading tabnum">
                    Current: {matchingExisting.quantity} {matchingExisting.unit || "units"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const itemToRestock = matchingExisting;
                    const enteredQty = form.quantity || "10";
                    setOpen(false);
                    setRestockTarget(itemToRestock);
                    setRestockQty(String(enteredQty));
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-heading font-black transition cursor-pointer shrink-0 shadow-orange-sm"
                >
                  Restock Item →
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Category</label>
              <select
                value={form.category}
                onChange={set("category")}
                className="w-full rounded-xl border border-line bg-card px-3.5 py-3 text-xs font-heading font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm cursor-pointer"
              >
                <option value="">Select Category...</option>
                <option value="Groceries">Groceries</option>
                <option value="Food & Provisions">Food & Provisions</option>
                <option value="Dairy & Bakery">Dairy & Bakery</option>
                <option value="Beverages & Drinks">Beverages & Drinks</option>
                <option value="Cosmetics & Personal Care">Cosmetics & Personal Care</option>
                <option value="Cleaning & Hygiene">Cleaning & Hygiene</option>
                <option value="Electronics & Accessories">Electronics & Accessories</option>
                <option value="Apparel & Footwear">Apparel & Footwear</option>
                <option value="Hardware & Construction">Hardware & Construction</option>
                <option value="Agricultural Supplies">Agricultural Supplies</option>
                <option value="Pharmaceuticals & Health">Pharmaceuticals & Health</option>
                <option value="General Supplies">General Supplies / Other</option>
              </select>
            </div>

            {/* Unit Dropdown */}
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Unit of Measure</label>
              <select
                value={form.unit}
                onChange={set("unit")}
                className="w-full rounded-xl border border-line bg-card px-3.5 py-3 text-xs font-heading font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm cursor-pointer"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="mL">Milliliters (mL)</option>
                <option value="box">Boxes (box)</option>
                <option value="pack">Packs / Packets (pack)</option>
                <option value="carton">Cartons (carton)</option>
                <option value="bottle">Bottles (bottle)</option>
                <option value="can">Cans / Tins (can)</option>
                <option value="bag">Sacks / Bags (bag)</option>
                <option value="crate">Crates (crate)</option>
                <option value="doz">Dozens (doz)</option>
                <option value="m">Meters (m)</option>
                <option value="pair">Pairs (pair)</option>
                <option value="set">Sets (set)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Initial Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Alert me when below</label>
              <input
                type="number"
                value={form.low_stock_threshold}
                onChange={set("low_stock_threshold")}
                placeholder="5"
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Cost price (RWF)</label>
              <input
                type="number"
                value={form.cost_price_rwf}
                onChange={set("cost_price_rwf")}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-muted uppercase tracking-wider mb-1">Sell price (RWF)</label>
              <input
                type="number"
                value={form.sell_price_rwf}
                onChange={set("sell_price_rwf")}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm font-heading font-extrabold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3 font-heading">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 px-5 rounded-xl bg-card border border-line hover:bg-card-hover text-muted hover:text-ink text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm active:scale-95"
            >
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
