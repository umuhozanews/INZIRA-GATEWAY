import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Plus, AlertTriangle, Package, DollarSign } from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";
import { getProductImage } from "../lib/productImages";
import SafeImage from "../components/SafeImage";
import { useData } from "../context/DataContext";

function statusOf(item) {
  const q = Number(item.quantity) || 0;
  const th = Number(item.low_stock_threshold) || 5;
  if (q === 0) return "out";
  if (q <= th) return "low";
  return "ok";
}

function StockCard({ item, t }) {
  const st = statusOf(item);
  const color = st === "out" ? "bg-red-500 text-white" : st === "low" ? "bg-amber-400 text-gray-900" : "bg-[#D4F06B] text-gray-900";
  const th = Number(item.low_stock_threshold) || 5;
  const pct = Math.max(6, Math.min(100, (Number(item.quantity) / (th * 3)) * 100));
  const photoUrl = getProductImage(item);

  return (
    <div className="flex flex-col justify-between rounded-[28px] border border-gray-200/80 bg-white overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:border-gray-400 hover:shadow-md transition duration-200 group font-manrope">
      {/* Product Image Header */}
      <div className="relative h-36 w-full overflow-hidden bg-gray-100">
        <SafeImage
          src={photoUrl}
          alt={item.name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${color}`}
        >
          {st === "out" ? "Out of Stock" : st === "low" ? "Low Stock" : "In Stock"}
        </span>
        {item.category && (
          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white uppercase tracking-wider">
            {item.category}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 truncate group-hover:text-purple-600 transition">{item.name}</h3>

          <div className="flex items-baseline justify-between mt-2 text-xs">
            <span className="text-gray-400 font-semibold">{t("sell_price")}:</span>
            <span className="font-black tabnum text-gray-900">{rwf(item.sell_price_rwf)} RWF</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-400">{t("quantity")}:</span>
            <span className="font-black tabnum text-gray-900">
              {Number(item.quantity)} {item.unit ? `${item.unit}` : ""}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${st === "out" ? "bg-red-500" : st === "low" ? "bg-amber-400" : "bg-[#D4F06B]"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const { stock, addStockItem } = useData();

  const items = Array.isArray(stock) ? stock : [];

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.get("new") === "1") setOpen(true);
  }, [params]);

  const visible = useMemo(
    () => items.filter((i) => !query || i.name?.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );
  const lowCount = items.filter((i) => statusOf(i) !== "ok").length;
  const totalValue = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.sell_price_rwf) || 0),
    0
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.name.trim()) return toast.error(t("item_name"));
    setSaving(true);
    try {
      await addStockItem({
        name: form.name.trim(),
        category: form.category.trim() || null,
        unit: form.unit.trim() || null,
        quantity: Number(form.quantity) || 0,
        cost_price_rwf: Number(form.cost_price_rwf) || 0,
        sell_price_rwf: Number(form.sell_price_rwf) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 5,
      });
      toast.success("Product added to stock successfully!");
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error("Could not add the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto flex h-full flex-col font-manrope pb-24 md:pb-8">
      <ScreenHeader
        title={t("my_stock")}
        right={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-gray-800 transition cursor-pointer"
          >
            <Plus size={16} /> <span>+ Add Stock Item</span>
          </button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[28px] border border-gray-200/80 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-900 shrink-0 shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("all")} Products</div>
            <div className="text-lg font-black tabnum text-gray-900">{items.length}</div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200/80 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("running_low")}</div>
            <div className="text-lg font-black tabnum text-gray-900">{lowCount}</div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200/80 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Stock Value</div>
            <div className="text-lg font-black tabnum text-emerald-600">{rwf(totalValue)} RWF</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white px-4 py-3 shadow-sm">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs md:text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              placeholder={t("search_stock")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {lowCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-full bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-900">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>
            {lowCount} {t("running_low")}
          </span>
        </div>
      )}

      {/* Stock Cards Grid or Prominent Empty Null State */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[32px] border border-dashed border-gray-300 bg-white shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-900 shadow-sm">
              <Package size={36} className="text-gray-800" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Your Inventory Stock is Empty</h3>
              <p className="mt-1.5 text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                Add your business products to start managing stock levels, low-stock alerts, and sell directly at the counter.
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-xs font-extrabold text-white hover:bg-gray-800 active:scale-95 transition shadow-md cursor-pointer mt-2"
            >
              <Plus size={16} />
              <span>+ Add Your First Stock Product</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visible.map((item) => (
              <StockCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* ADD STOCK ITEM MODAL SHEET */}
      <Sheet open={open} onClose={() => setOpen(false)} title={t("new_item")}>
        <div className="space-y-4 pt-2 font-manrope pb-6">
          <Field label={t("item_name")}>
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Sugar 1kg" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("category")}>
              <TextInput value={form.category} onChange={set("category")} placeholder="e.g. Groceries" />
            </Field>
            <Field label={t("unit")}>
              <TextInput value={form.unit} onChange={set("unit")} placeholder="e.g. kg, pcs, litre" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("quantity")}>
              <TextInput type="number" value={form.quantity} onChange={set("quantity")} placeholder="0" />
            </Field>
            <Field label={t("low_threshold")}>
              <TextInput type="number" value={form.low_stock_threshold} onChange={set("low_stock_threshold")} placeholder="5" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("cost_price")}>
              <TextInput type="number" value={form.cost_price_rwf} onChange={set("cost_price_rwf")} placeholder="0" />
            </Field>
            <Field label={t("sell_price")}>
              <TextInput type="number" value={form.sell_price_rwf} onChange={set("sell_price_rwf")} placeholder="0" />
            </Field>
          </div>
          <div className="pt-2 flex gap-2">
            <Button variant="paper" onClick={() => setOpen(false)} className="flex-1">
              {t("cancel")}
            </Button>
            <Button variant="green" onClick={handleSave} disabled={saving} className="flex-1 font-bold shadow-sm">
              {saving ? "Saving…" : t("save")}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
