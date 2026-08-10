import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowUpRight,
  Printer,
  Download,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react";
import api from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import Loading from "../components/Loading";
import { useData } from "../context/DataContext";
import EbmReceipt from "../components/EbmReceipt";

export default function Invoices() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { sales } = useData();

  const [loading, setLoading] = useState(false);
  const [remoteInvoices, setRemoteInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'paid' | 'pending' | 'voided'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/invoices");
      if (Array.isArray(data?.data)) setRemoteInvoices(data.data);
      else if (Array.isArray(data)) setRemoteInvoices(data);
    } catch {
      /* network fallback */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Merge live recorded sales into official invoices list
  const invoices = useMemo(() => {
    const derivedFromSales = (sales || []).map((s) => ({
      id: s.id,
      invoice_number: s.invoice_number || `INV-2026-${String(s.id).slice(-3)}`,
      customer_name: s.customer_name || "Walk-in Customer",
      total_amount: Number(s.total_amount) || 0,
      status: s.payment_status === "pending" || s.payment_method === "credit" ? "pending" : "paid",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      created_at: s.created_at || new Date().toISOString(),
      items: (s.items || []).map((i) => ({
        name: i.item_name || i.name || "Item",
        qty: Number(i.quantity || i.qty) || 1,
        price: Number(i.unit_price || i.price) || 0,
        total: Number(i.subtotal || i.total || ((i.unit_price || 0) * (i.quantity || 1))) || 0,
      })),
    }));

    const derivedIds = new Set(derivedFromSales.map((i) => String(i.id)));
    const extraRemote = remoteInvoices.filter((r) => !derivedIds.has(String(r.id)));
    return [...derivedFromSales, ...extraRemote];
  }, [sales, remoteInvoices]);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesQuery =
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q);

    if (filter === "paid") return matchesQuery && inv.status === "paid";
    if (filter === "pending") return matchesQuery && inv.status === "pending";
    if (filter === "voided") return matchesQuery && inv.status === "voided";
    return matchesQuery;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + (i.total_amount || 0), 0);

  if (loading) return <Loading label={t("loading")} />;

  return (
    <div className="min-h-screen bg-paper pb-20">
      <ScreenHeader
        title={t("nav_invoices")}
        right={
          <button
            onClick={() => navigate("/sell")}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition"
          >
            <Plus size={15} />
            <span>New Invoice</span>
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <span className="text-[11px] font-bold text-muted uppercase">Total Invoiced</span>
            <div className="mt-1 text-base md:text-lg font-extrabold text-ink tabnum">{rwf(totalInvoiced)}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-card">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Paid Total</span>
            <div className="mt-1 text-base md:text-lg font-extrabold text-emerald-700 tabnum">{rwf(totalPaid)}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-card">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Unpaid / Pending</span>
            <div className="mt-1 text-base md:text-lg font-extrabold text-amber-700 tabnum">{rwf(totalPending)}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or customer name…"
              className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs font-semibold text-ink placeholder:text-muted focus:border-primary focus:outline-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-line text-xs font-semibold">
            {["all", "paid", "pending", "voided"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filter === tab
                    ? "bg-primary text-white shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-xs text-muted">
              No invoices match your search.
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card shadow-card hover:border-primary/40 hover:shadow-md transition cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-xlt text-primary shrink-0 group-hover:scale-105 transition">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-extrabold text-ink group-hover:text-primary transition">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {inv.customer_name || "Walk-in Customer"} · {formatDate(inv.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-heading text-sm font-extrabold text-ink tabnum">
                    {rwf(inv.total_amount)}
                  </div>
                  <span className="text-[11px] font-bold text-primary flex items-center justify-end gap-1 group-hover:underline">
                    View <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Detail Sheet Modal */}
      <Sheet
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice ${selectedInvoice?.invoice_number || ""}`}
      >
        {selectedInvoice && (
          <div className="space-y-4 pt-2 pb-4">
            <div className="w-full flex justify-center max-h-[60vh] overflow-y-auto p-2 bg-paper rounded-2xl border border-line">
              <EbmReceipt sale={selectedInvoice} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink hover:bg-card transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-xs font-extrabold text-white shadow-sm hover:bg-primary-dark transition"
              >
                <Printer size={16} /> Print EBM Receipt
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
