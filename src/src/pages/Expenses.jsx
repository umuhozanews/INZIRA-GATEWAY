import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Wallet, TrendingDown, Trash2, Calendar, Tag } from "lucide-react";
import api from "../lib/api";
import { StorageEngine } from "../lib/storage";
import { useLang } from "../lib/i18n.jsx";
import { rwf, todayISO } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";

const EMPTY = { category: "", amount: "", description: "", expense_date: todayISO() };

export default function Expenses() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/expenses").catch(() => ({ data: null }));
      if (data && Array.isArray(data.data || data)) {
        setEntries(data.data || data);
      } else {
        setEntries(StorageEngine.getExpenses());
      }
    } catch {
      setEntries(StorageEngine.getExpenses());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (params.get("new") === "1") {
      setOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const totalExpense = useMemo(() => {
    return entries.reduce((s, r) => s + Number(r.amount || 0), 0);
  }, [entries]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.category.trim()) return toast.error("Expense category is required");
    if (!Number(form.amount)) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      await api.post("/expenses", form).catch(() => null);
      StorageEngine.saveExpense({
        category: form.category.trim(),
        amount: Number(form.amount),
        description: form.description.trim() || "",
        expense_date: form.expense_date || todayISO(),
      });
      toast.success("Expense recorded");
      setForm(EMPTY);
      setOpen(false);
      load();
    } catch {
      toast.error("Could not record expense");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id) {
    StorageEngine.deleteExpense(id);
    toast.success("Expense deleted");
    load();
  }

  if (loading) return <Loading label="Loading expenses..." />;

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader
        title="Expense Tracker"
        right={
          <button
            onClick={() => setOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm"
          >
            <Plus size={18} strokeWidth={2.4} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Total Expense Card */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-[#2F7A67] p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 text-[12px] opacity-90">
            <Wallet size={16} /> Total Expenses Recorded
          </div>
          <div className="mt-2 text-[24px] font-extrabold tabnum">{rwf(totalExpense)} RWF</div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2.5">
          <div className="text-[12px] font-bold text-muted uppercase tracking-wider">Recent Expense Logs</div>
          {entries.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted">No expenses recorded yet</div>
          ) : (
            entries.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-3 shadow-xs">
                <div>
                  <div className="text-[13px] font-bold text-ink">{item.category}</div>
                  {item.description && <div className="text-[11px] text-muted">{item.description}</div>}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {item.expense_date || 'Today'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold tabnum text-red-600">-{rwf(item.amount)} RWF</span>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-muted hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Record New Expense">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 p-4">
          <Field label="Category">
            <TextInput value={form.category} onChange={set("category")} placeholder="e.g. Shop Rent, Transport, Electricity" required />
          </Field>
          <Field label="Amount (RWF)">
            <TextInput type="number" inputMode="numeric" value={form.amount} onChange={set("amount")} placeholder="e.g. 25000" required />
          </Field>
          <Field label="Expense Date">
            <TextInput type="date" value={form.expense_date} onChange={set("expense_date")} required />
          </Field>
          <Field label="Notes / Description">
            <TextInput value={form.description} onChange={set("description")} placeholder="e.g. Paid delivery fee for Guangzhou cargo" />
          </Field>
          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              Save Expense Log
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
