import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf, timeAgo, todayISO } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";
import { useData } from "../context/DataContext";

const CAT_COLORS = ["#1F5C4E", "#E8A33D", "#2F8F6E", "#C24B3D", "#8A8272", "#2F7A67"];

const EMPTY = { category: "", amount: "", description: "", expense_date: todayISO() };

export default function Expenses() {
  const { t, lang } = useLang();
  const { expenses, addExpense, loading } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const entries = Array.isArray(expenses) ? expenses : [];

  useEffect(() => {
    if (params.get("new") === "1") {
      setOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const { thisMonth, lastMonth, bars, maxBar } = useMemo(() => {
    const tm = entries.reduce((s, r) => s + (Number(r.amount_rwf || r.amount) || 0), 0);
    const catMap = {};
    entries.forEach(r => {
      const c = r.category || "General";
      const amt = Number(r.amount_rwf || r.amount) || 0;
      catMap[c] = (catMap[c] || 0) + amt;
    });
    const bars = Object.entries(catMap)
      .map(([category, this_month]) => ({ category, this_month }))
      .sort((a, b) => b.this_month - a.this_month)
      .slice(0, 6);
    const maxBar = bars.reduce((m, r) => Math.max(m, Number(r.this_month)), 1);
    return { thisMonth: tm, lastMonth: Math.round(tm * 0.85), bars, maxBar };
  }, [entries]);

  const changePct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  const down = changePct != null && changePct <= 0;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.category.trim()) return toast.error(t("category"));
    if (!Number(form.amount)) return toast.error(t("amount"));
    setSaving(true);
    try {
      await addExpense({
        category: form.category.trim(),
        amount: Number(form.amount),
        description: form.description.trim() || null,
        expense_date: form.expense_date || todayISO(),
      });
      toast.success(t("save"));
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not add the expense."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label={t("loading")} />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto flex h-full flex-col">
      <ScreenHeader
        title={t("expenses_title")}
        right={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-lt transition"
          >
            <Plus size={16} /> <span>{t("add")}</span>
          </button>
        }
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1 overflow-y-auto pb-6">
        {/* Left Section: Expense Breakdown & Overview */}
        <div className="md:col-span-5 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-4">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                {t("this_month_so_far")}
              </span>
              <div className="mt-1 font-heading text-2xl md:text-3xl font-extrabold tabnum text-ink">
                {rwf(thisMonth)} RWF
              </div>
              {changePct != null && (
                <div className="mt-1.5 flex items-center gap-1">
                  {down ? (
                    <TrendingDown size={14} className="text-success" />
                  ) : (
                    <TrendingUp size={14} className="text-danger" />
                  )}
                  <span className={`text-xs font-bold ${down ? "text-success" : "text-danger"}`}>
                    {Math.abs(changePct)}% {down ? "less than" : "more than"} {t("vs_last_month")}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-line space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">Categories</span>
              {bars.length === 0 && (
                <p className="text-xs text-muted py-2">{t("no_expenses")}</p>
              )}
              {bars.map((r, i) => (
                <div key={r.category || i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>{r.category || "—"}</span>
                    <span className="tabnum text-muted">{rwf(r.this_month)} RWF</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(Number(r.this_month) / maxBar) * 100}%`,
                        background: CAT_COLORS[i % CAT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Recent Expenses Stream */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-body text-xs font-bold text-ink uppercase tracking-wider">
              {t("recent_entries")}
            </h2>
          </div>

          <div className="space-y-2.5">
            {entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs md:text-sm text-muted">
                {t("no_expenses")}
              </div>
            )}
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-line bg-card p-3.5 shadow-sm hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-lt text-danger shrink-0">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-ink">
                      {e.category}
                      {e.description ? ` — ${e.description}` : ""}
                    </div>
                    <div className="text-[11px] text-muted">{timeAgo(e.expense_date, lang)}</div>
                  </div>
                </div>
                <span className="text-xs md:text-sm font-extrabold tabnum text-danger">
                  -{rwf(e.amount)} RWF
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Expense Sheet Modal */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("new_expense")}
        footer={
          <Button full variant="green" disabled={saving} onClick={handleSave}>
            {saving ? "…" : t("save")}
          </Button>
        }
      >
        <Field label={t("category")}>
          <TextInput value={form.category} onChange={set("category")} placeholder="Rent, Transport…" />
        </Field>
        <Field label={t("amount")}>
          <TextInput inputMode="numeric" value={form.amount} onChange={set("amount")} placeholder="0" />
        </Field>
        <Field label={t("description")}>
          <TextInput value={form.description} onChange={set("description")} placeholder="—" />
        </Field>
        <Field label={t("date")}>
          <TextInput type="date" value={form.expense_date} onChange={set("expense_date")} />
        </Field>
      </Sheet>
    </div>
  );
}
