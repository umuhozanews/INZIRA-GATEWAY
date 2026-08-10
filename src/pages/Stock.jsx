import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Plus, AlertTriangle, Package, DollarSign } from "lucide-react";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
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
  const color = st === "out" ? "#C24B3D" : st === "low" ? "#E8A33D" : "#2F8F6E";
  const th = Number(item.low_stock_threshold) || 5;
  const pct = Math.max(6, Math.min(100, (Number(item.quantity) / (th * 3)) * 100));
  const photoUrl = getProductImage(item);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-card overflow-hidden shadow-card hover:border-primary/40 transition group">
      {/* Product Image Header */}
      <div className="relative h-32 w-full overflow-hidden bg-paper">
        <SafeImage
          src={photoUrl}
          alt={item.name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white shadow-sm"
          style={{ background: color }}
        >
          {st === "out" ? "Out of Stock" : st === "low" ? "Low Stock" : "In Stock"}
        </span>
        {item.category && (
          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white uppercase">
            {item.category}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink truncate group-hover:text-primary transition">{item.name}</h3>

          <div className="flex items-baseline justify-between mt-2 text-xs">
            <span className="text-muted font-semibold">{t("sell_price")}:</span>
            <span className="font-extrabold tabnum text-primary">{rwf(item.sell_price_rwf)} RWF</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-line/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-muted">{t("quantity")}:</span>
            <span className="font-extrabold tabnum text-ink">
              {Number(item.quantity)} {item.unit ? `${item.unit}` : ""}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY = {
  name: "",
  category: "",
  quantity: "",
  unit: "",
  cost_price_rwf: "",
  sell_price_rwf: "",
  low_stock_threshold: "5",
};

export default function Stock() {
  const { t } = useLang();
  const { stock: items, addStockItem } = useData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.get("new") === "1") {
      setOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

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
      toast.success(t("save"));
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error("Could not add the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto flex h-full flex-col">
      <ScreenHeader
        title={t("my_stock")}
        right={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-lt transition"
          >
            <Plus size={16} /> <span>{t("add")}</span>
          </button>
        }
      />

      {/* Overview Stat Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-xlt text-primary shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">{t("all")} Products</div>
            <div className="text-lg font-extrabold tabnum text-ink">{items.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">{t("running_low")}</div>
            <div className="text-lg font-extrabold tabnum text-ink">{lowCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 shadow-card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">Total Stock Value</div>
            <div className="text-lg font-extrabold tabnum text-success">{rwf(totalValue)} RWF</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-sm">
          <Search size={16} className="text-muted shrink-0" />
          <input
            className="flex-1 bg-transparent text-xs md:text-sm text-ink outline-none placeholder:text-muted"
            placeholder={t("search_stock")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {lowCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl bg-danger-lt border border-danger/20 px-4 py-2.5 text-xs font-bold text-[#7A2E22]">
          <AlertTriangle size={16} className="text-danger shrink-0" />
          <span>
            {lowCount} {t("running_low")}
          </span>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="flex-1 overflow-y-auto pb-6">
        {visible.length === 0 ? (
          <div className="mt-12 text-center text-xs md:text-sm text-muted">{t("no_stock")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((item) => (
              <StockCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Add Stock Sheet Modal */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("new_item")}
        footer={
          <Button full variant="green" disabled={saving} onClick={handleSave}>
            {saving ? "…" : t("save")}
          </Button>
        }
      >
        <Field label={t("item_name")}>
          <TextInput value={form.name} onChange={set("name")} placeholder="Sugar 1kg" />
        </Field>
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label={t("category")}>
              <TextInput value={form.category} onChange={set("category")} placeholder="Food" />
            </Field>
          </div>
          <div className="flex-1">
            <Field label={t("unit")}>
              <TextInput value={form.unit} onChange={set("unit")} placeholder="kg" />
            </Field>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label={t("quantity")}>
              <TextInput inputMode="numeric" value={form.quantity} onChange={set("quantity")} placeholder="0" />
            </Field>
          </div>
          <div className="flex-1">
            <Field label={t("low_threshold")}>
              <TextInput
                inputMode="numeric"
                value={form.low_stock_threshold}
                onChange={set("low_stock_threshold")}
                placeholder="5"
              />
            </Field>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label={t("cost_price")}>
              <TextInput inputMode="numeric" value={form.cost_price_rwf} onChange={set("cost_price_rwf")} placeholder="0" />
            </Field>
          </div>
          <div className="flex-1">
            <Field label={t("sell_price")}>
              <TextInput inputMode="numeric" value={form.sell_price_rwf} onChange={set("sell_price_rwf")} placeholder="0" />
            </Field>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
