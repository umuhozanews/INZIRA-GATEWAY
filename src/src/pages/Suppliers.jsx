import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, MessageSquare, PhoneCall, Globe, Search, Trash2, Edit3, MapPin } from "lucide-react";
import api from "../lib/api";
import { StorageEngine } from "../lib/storage";
import { useLang } from "../lib/i18n.jsx";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";

const EMPTY = { id: null, name: "", wechat: "", whatsapp: "", city: "", country: "China", specialty: "" };

export default function Suppliers() {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/suppliers").catch(() => ({ data: null }));
      if (data && Array.isArray(data.data || data)) {
        setSuppliers(data.data || data);
      } else {
        setSuppliers(StorageEngine.getSuppliers());
      }
    } catch {
      setSuppliers(StorageEngine.getSuppliers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return suppliers.filter((s) => {
      if (query && !s.name?.toLowerCase().includes(query.toLowerCase()) && !s.specialty?.toLowerCase().includes(query.toLowerCase()) && !s.city?.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [suppliers, query]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleEdit(sup) {
    setForm({
      id: sup.id,
      name: sup.name || "",
      wechat: sup.wechat || "",
      whatsapp: sup.whatsapp || "",
      city: sup.city || "",
      country: sup.country || "China",
      specialty: sup.specialty || "",
    });
    setOpen(true);
  }

  function handleDelete(id) {
    StorageEngine.deleteSupplier(id);
    toast.success("Supplier removed");
    load();
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Supplier name is required");
    setSaving(true);
    try {
      await api.post("/suppliers", form).catch(() => null);
      StorageEngine.saveSupplier({
        id: form.id,
        name: form.name.trim(),
        wechat: form.wechat.trim(),
        whatsapp: form.whatsapp.trim(),
        city: form.city.trim(),
        country: form.country.trim() || "China",
        specialty: form.specialty.trim(),
      });
      toast.success(form.id ? "Supplier updated" : "Supplier added");
      setForm(EMPTY);
      setOpen(false);
      load();
    } catch {
      toast.error("Could not save supplier");
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp(phone) {
    if (!phone) return toast.error("No WhatsApp number provided");
    const num = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num}`, "_blank");
  }

  if (loading) return <Loading label="Loading suppliers directory..." />;

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader
        title="China & Global Suppliers"
        right={
          <button
            onClick={() => { setForm(EMPTY); setOpen(true); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm"
          >
            <Plus size={18} strokeWidth={2.4} />
          </button>
        }
      />

      <div className="px-4 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            className="flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted"
            placeholder="Search suppliers by name, city, or specialty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted">No suppliers found</div>
        ) : (
          visible.map((sup) => (
            <div key={sup.id} className="rounded-xl border border-line bg-card p-3 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-bold text-ink">{sup.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                    <MapPin size={11} className="text-primary" /> {sup.city || 'China'} • {sup.country || 'China'}
                  </div>
                  {sup.specialty && <div className="mt-1 text-[11px] font-medium text-primary/90">{sup.specialty}</div>}
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(sup)} className="p-1 text-muted hover:text-primary">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => handleDelete(sup.id)} className="p-1 text-muted hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="flex items-center gap-2 border-t border-line/60 pt-2">
                {sup.whatsapp && (
                  <button
                    onClick={() => openWhatsApp(sup.whatsapp)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600/10 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-600/20"
                  >
                    <MessageSquare size={13} /> WhatsApp
                  </button>
                )}
                {sup.wechat && (
                  <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 py-1.5 text-[11px] font-bold text-primary">
                    <Globe size={13} /> WeChat: <span className="font-mono">{sup.wechat}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Supplier" : "Add New Supplier"}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 p-4">
          <Field label="Supplier / Company Name">
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Guangzhou Fashion Co." required />
          </Field>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="City">
                <TextInput value={form.city} onChange={set("city")} placeholder="Guangzhou" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Country">
                <TextInput value={form.country} onChange={set("country")} placeholder="China" />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="WhatsApp Number">
                <TextInput value={form.whatsapp} onChange={set("whatsapp")} placeholder="+8613800000001" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="WeChat ID">
                <TextInput value={form.wechat} onChange={set("wechat")} placeholder="gzfashion2024" />
              </Field>
            </div>
          </div>
          <Field label="Product Specialty">
            <TextInput value={form.specialty} onChange={set("specialty")} placeholder="e.g. T-Shirts, Jeans, Casual Wear" />
          </Field>

          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              {form.id ? "Update Supplier" : "Save Supplier"}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
