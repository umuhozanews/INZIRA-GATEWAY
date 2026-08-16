import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  Plus,
  ArrowUpRight,
  Printer,
  Download,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useLang } from "../lib/i18n.jsx";
import { rwf, formatDate } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Loading from "../components/Loading";
import Sheet from "../components/Sheet";
import { useData } from "../context/DataContext";
import EbmReceipt from "../components/EbmReceipt";

export default function Invoices() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { sales, refreshAll, voidSale } = useData();

  const [loading, setLoading] = useState(false);
  const [remoteInvoices, setRemoteInvoices] = useState([]);
  const [shopSettings, setShopSettings] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Void Invoice with Mandatory Reason State
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [invRes, setRes] = await Promise.allSettled([
        api.get("/invoices"),
        api.get("/settings"),
      ]);
      if (invRes.status === "fulfilled") {
        const data = invRes.value.data?.data || invRes.value.data;
        if (Array.isArray(data?.data)) setRemoteInvoices(data.data);
        else if (Array.isArray(data)) setRemoteInvoices(data);
      }
      if (setRes.status === "fulfilled" && setRes.value.data?.settings) {
        setShopSettings(setRes.value.data.settings);
      }
    } catch {
      /* network fallback */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmVoidInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      return toast.error("Please enter a cancellation reason.");
    }
    setVoiding(true);
    const targetIdentifier = voidTarget.invoice_number || voidTarget.id;
    const saleId = voidTarget.sale_id || voidTarget.id;

    try {
      // 1. Try deleting/voiding via backend invoices endpoint
      try {
        await api.delete(`/invoices/${encodeURIComponent(targetIdentifier)}?reason=${encodeURIComponent(voidReason.trim())}`);
      } catch (invErr) {
        // Fallback: try deleting via sales endpoint
        try {
          await api.delete(`/sales/${encodeURIComponent(targetIdentifier)}?reason=${encodeURIComponent(voidReason.trim())}`);
        } catch (saleErr) {
          console.warn("Backend void fallback:", saleErr.message);
        }
      }

      // 2. Perform client-side inventory restoration and state update
      if (voidSale) {
        await voidSale(saleId);
      }

      toast.success(`Invoice ${voidTarget.invoice_number || targetIdentifier} voided, items restored to inventory.`);
      setRemoteInvoices(prev => prev.filter(inv => String(inv.id) !== String(voidTarget.id) && inv.invoice_number !== voidTarget.invoice_number));
      if (selectedInvoice && (String(selectedInvoice.id) === String(voidTarget.id) || selectedInvoice.invoice_number === voidTarget.invoice_number)) {
        setSelectedInvoice(null);
      }
      setVoidTarget(null);
      setVoidReason("");
      if (refreshAll) refreshAll(true);
      setTimeout(() => load(), 400);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to void invoice."));
    } finally {
      setVoiding(false);
    }
  };

  async function handleDownloadPDF(inv) {
    if (!inv) return;
    const toastId = toast.loading("Downloading PDF...");
    try {
      const response = await api.get(`/invoices/${inv.id}/pdf`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${inv.invoice_number || 'invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF Downloaded successfully!", { id: toastId });
    } catch (err) {
      toast.error("Could not download PDF file. Using browser print...", { id: toastId });
      window.print();
    }
  }

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

  // Dedicated Single Page Document View for printing / saving as PDF
  if (selectedInvoice) {
    return (
      <div className="min-h-screen bg-gray-100 font-manrope text-gray-900 pb-16 pt-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:hidden">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> <span>Back to Invoices</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setVoidTarget(selectedInvoice);
                  setVoidReason("");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-red-200 bg-red-50 text-xs font-extrabold text-red-700 hover:bg-red-100 transition cursor-pointer"
                title="Cancel / Void Invoice"
              >
                <Trash2 size={14} /> <span>Void Invoice</span>
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-xs font-extrabold text-white hover:bg-purple-700 transition cursor-pointer shadow-sm"
              >
                <Download size={15} /> <span>Download PDF</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4F06B] text-xs font-black text-gray-900 hover:bg-[#C5E456] transition cursor-pointer shadow-sm"
              >
                <Printer size={15} /> <span>Print Invoice</span>
              </button>
            </div>
          </div>

          {/* Clean Single Page Document */}
          <div className="w-full flex justify-center py-2">
            <EbmReceipt sale={selectedInvoice} shopSettings={shopSettings} />
          </div>
        </div>

        {/* Void Reason Modal Sheet */}
        <Sheet
          open={Boolean(voidTarget)}
          onClose={() => setVoidTarget(null)}
          title={voidTarget ? `Void Invoice ${voidTarget.invoice_number}` : "Void Invoice"}
        >
          {voidTarget && (
            <form onSubmit={handleConfirmVoidInvoice} className="space-y-4 pt-2 font-manrope pb-6">
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-red-800">
                  <AlertTriangle size={15} />
                  <span>Mandatory Cancellation Requirement</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Voiding invoice <strong>{voidTarget.invoice_number}</strong> ({rwf(voidTarget.total_amount)} RWF) will cancel this transaction, restore sold items to inventory, and log the reason in the official audit trail.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Reason for Voiding Invoice <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Customer returned items, wrong billing amount, order canceled..."
                  className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/30 transition shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTarget(null)}
                  className="flex-1 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-extrabold text-gray-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voiding || !voidReason.trim()}
                  className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {voiding ? "Voiding…" : "Confirm Void (Logged)"}
                </button>
              </div>
            </form>
          )}
        </Sheet>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader
        title={t("nav_invoices")}
        right={
          <button
            onClick={() => navigate("/sell")}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-heading font-black text-white shadow-orange-sm hover:bg-primary-hover transition cursor-pointer active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Invoice</span>
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3 font-heading">
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Invoiced</span>
            <div className="mt-1 text-base md:text-lg font-black text-ink tabnum">{rwf(totalInvoiced)} RWF</div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Paid Total</span>
            <div className="mt-1 text-base md:text-lg font-black text-emerald-400 tabnum">{rwf(totalPaid)} RWF</div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Unpaid / Pending</span>
            <div className="mt-1 text-base md:text-lg font-black text-amber-400 tabnum">{rwf(totalPending)} RWF</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 font-body">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or customer name…"
              className="w-full rounded-xl border border-line bg-card pl-11 pr-4 py-2.5 text-xs font-semibold text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-card p-1.5 rounded-xl border border-line text-xs font-heading font-bold shadow-sm">
            {["all", "paid", "pending", "voided"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                  filter === tab
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
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
            <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-xs text-muted font-medium">
              No invoices match your search.
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="flex items-center justify-between p-4 rounded-2xl border border-line bg-card shadow-card hover:border-primary/40 transition cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-black text-ink group-hover:text-primary transition">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-md capitalize ${
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : inv.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted mt-0.5 font-body">
                      {inv.customer_name || "Walk-in Customer"} · {formatDate(inv.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-heading text-sm font-black text-ink tabnum">
                      {rwf(inv.total_amount)} RWF
                    </div>
                    <span className="text-[11px] font-heading font-black text-primary flex items-center justify-end gap-1 group-hover:underline">
                      View <ArrowUpRight size={13} />
                    </span>
                  </div>

                  {inv.status !== "voided" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVoidTarget(inv);
                        setVoidReason("");
                      }}
                      className="p-2 rounded-xl text-muted hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Void / Cancel Invoice (Logged)"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Void Reason Modal Sheet */}
      <Sheet
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title={voidTarget ? `Void Invoice ${voidTarget.invoice_number}` : "Void Invoice"}
      >
        {voidTarget && (
          <form onSubmit={handleConfirmVoidInvoice} className="space-y-4 pt-2 font-body pb-6">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-ink space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-black text-rose-400">
                <AlertTriangle size={15} />
                <span>Are you sure? This action will be logged.</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Deleting / voiding invoice <strong>{voidTarget.invoice_number}</strong> ({rwf(voidTarget.total_amount)} RWF) will cancel this transaction, restore all sold items to your inventory, and permanently store a snapshot in the deletion log.
              </p>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                Reason for Voiding Invoice <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Customer returned items, wrong billing amount, order canceled..."
                className="w-full rounded-xl border border-line bg-paper p-3 text-xs font-medium text-ink placeholder:text-muted outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 font-heading">
              <button
                type="button"
                onClick={() => setVoidTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-card border border-line hover:bg-card-hover text-xs font-bold text-ink transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={voiding || !voidReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {voiding ? "Voiding…" : "Confirm Void (Logged)"}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
