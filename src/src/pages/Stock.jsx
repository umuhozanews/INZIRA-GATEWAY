import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, Edit3, Trash2, AlertTriangle, CheckCircle2, Package, Tag, ArrowUpRight } from "lucide-react";
import api from "../lib/api";
import { StorageEngine } from "../lib/storage";
import { useLang } from "../lib/i18n.jsx";
import { rwf } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";

const EMPTY_ITEM = {
  id: null,
  name: "",
  category: "General",
  size: "",
  color: "",
  quantity: "",
  unit: "pcs",
  cost_price_rwf: "",
  sell_price_rwf: "",
  low_stock_threshold: 5,
};

export default function Stock() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("__all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/stock", { params: { limit: 300 } }).catch(() => null);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      } else {
        setItems(StorageEngine.getStock());
      }
    } catch {
      setItems(StorageEngine.getStock());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener("databridge:data_changed", handleUpdate);
    return () => window.removeEventListener("databridge:data_changed", handleUpdate);
  }, [load]);

  useEffect(() => {
    if (params.get("new") === "1") {
      setForm(EMPTY_ITEM);
      setSheetOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const categories = useMemo(() => {
    const set = new Set(["__all"]);
    items.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((p) => {
      if (activeCat !== "__all" && p.category !== activeCat) return false;
      if (query && !p.name?.toLowerCase().includes(query.toLowerCase()) && !p.category?.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCat, query]);

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleOpenAdd() {
    setForm(EMPTY_ITEM);
    setSheetOpen(true);
  }

  function handleOpenEdit(item) {
    setForm({
      id: item.id,
      name: item.name || "",
      category: item.category || "General",
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity ?? "",
      unit: item.unit || "pcs",
      cost_price_rwf: item.cost_price_rwf ?? "",
      sell_price_rwf: item.sell_price_rwf ?? "",
      low_stock_threshold: item.low_stock_threshold ?? 5,
    });
    setSheetOpen(true);
  }

  function handleDelete(id) {
    StorageEngine.deleteStockItem(id);
    toast.success("Item deleted from inventory");
    load();
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (form.quantity === "") return toast.error("Quantity is required");
    if (!form.sell_price_rwf) return toast.error("Selling price is required");

    setSaving(true);
    try {
      await api.post("/stock", form).catch(() => null);
      StorageEngine.saveStockItem({
        id: form.id,
        name: form.name.trim(),
        category: form.category.trim() || "General",
        size: form.size.trim(),
        color: form.color.trim(),
        quantity: Number(form.quantity) || 0,
        unit: form.unit || "pcs",
        cost_price_rwf: Number(form.cost_price_rwf) || 0,
        sell_price_rwf: Number(form.sell_price_rwf) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 5,
      });

      toast.success(form.id ? "Stock updated" : "Product added to inventory");
      setSheetOpen(false);
      setForm(EMPTY_ITEM);
      load();
    } catch {
      toast.error("Could not save item");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading stock directory..." />;

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader
        title="Stock & Inventory"
        right={
          <button
            onClick={handleOpenAdd}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm"
          >
            <Plus size={18} strokeWidth={2.4} />
          </button>
        }
      />

      <div className="px-4 space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            className="flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted"
            placeholder="Search stock by name or category..."
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

      <div className="mt-2 flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted">No items match your search</div>
        ) : (
          visible.map((p) => {
            const qty = Number(p.quantity) || 0;
            const threshold = Number(p.low_stock_threshold) || 5;
            const isOut = qty <= 0;
            const isLow = !isOut && qty <= threshold;

            return (
              <div key={p.id} className="rounded-xl border border-line bg-card p-3 shadow-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13.5px] font-bold text-ink">{p.name}</div>
                    <div className="text-[11px] text-muted">{p.category || 'General'} {p.size ? `• Size ${p.size}` : ''} {p.color ? `• ${p.color}` : ''}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(p)} className="p-1 text-muted hover:text-primary">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-muted hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                  <div>
                    <span className="text-muted">Cost: </span><span className="font-bold tabnum text-ink">{rwf(p.cost_price_rwf)} RWF</span>
                    <span className="mx-1 text-muted">•</span>
                    <span className="text-muted">Sell: </span><span className="font-extrabold tabnum text-primary">{rwf(p.sell_price_rwf)} RWF</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isOut ? 'Out of Stock' : isLow ? `Low (${qty})` : `In Stock (${qty})`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={form.id ? "Edit Stock Item" : "Add Stock Item"}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 p-4">
          <Field label="Product Name">
            <TextInput value={form.name} onChange={setF("name")} placeholder="e.g. Slim Fit Denim Jeans" required />
          </Field>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Category">
                <TextInput value={form.category} onChange={setF("category")} placeholder="Trousers" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Size">
                <TextInput value={form.size} onChange={setF("size")} placeholder="32 or M" />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Quantity">
                <TextInput type="number" inputMode="numeric" value={form.quantity} onChange={setF("quantity")} placeholder="25" required />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Low Alert Threshold">
                <TextInput type="number" inputMode="numeric" value={form.low_stock_threshold} onChange={setF("low_stock_threshold")} placeholder="5" />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Cost Price (RWF)">
                <TextInput type="number" inputMode="numeric" value={form.cost_price_rwf} onChange={setF("cost_price_rwf")} placeholder="8500" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Selling Price (RWF)">
                <TextInput type="number" inputMode="numeric" value={form.sell_price_rwf} onChange={setF("sell_price_rwf")} placeholder="15000" required />
              </Field>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              {form.id ? "Update Item" : "Save Stock Item"}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
