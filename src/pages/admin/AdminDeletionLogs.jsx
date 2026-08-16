import { useState, useEffect } from "react";
import {
  Trash2,
  Search,
  Filter,
  Lock,
  Package,
  ShoppingCart,
  FileText,
  Clock,
  Eye,
  Store,
} from "lucide-react";
import api from "../../lib/api";
import { formatDate, rwf } from "../../lib/format";
import Sheet from "../../components/Sheet";

export default function AdminDeletionLogs() {
  const [logs, setLogs] = useState([]);
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [smeFilter, setSmeFilter] = useState("all");
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [logsRes, smesRes] = await Promise.allSettled([
          api.get("/admin/deletion-logs", {
            params: {
              entity_type: entityFilter !== "all" ? entityFilter : undefined,
              owner_id: smeFilter !== "all" ? smeFilter : undefined,
              search: search.trim() || undefined,
            },
          }),
          api.get("/admin/smes"),
        ]);

        if (logsRes.status === "fulfilled") {
          setLogs(logsRes.value.data?.logs || []);
        }
        if (smesRes.status === "fulfilled") {
          setSmes(smesRes.value.data?.smes || []);
        }
      } catch (err) {
        console.warn("Deletion logs fetch fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, entityFilter, smeFilter]);

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "stock":
        return <Package size={13} className="text-primary" />;
      case "sale":
        return <ShoppingCart size={13} className="text-primary" />;
      case "invoice":
        return <FileText size={13} className="text-primary" />;
      default:
        return <Trash2 size={13} className="text-muted" />;
    }
  };

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-body text-ink">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-heading">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">
              PERMANENT AUDIT ARCHIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Append-Only Log
            </span>
          </div>
          <h1 className="text-lg md:text-2xl font-black text-ink flex items-center gap-1.5 leading-tight">
            Permanent Deletion Records
          </h1>
          <p className="text-xs text-muted font-medium mt-0.5 font-body">
            Every deleted product, voided sale, and cancelled invoice is permanently captured with a complete JSON snapshot before deletion.
          </p>
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-line shadow-card space-y-3 font-body">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, user, SME, reason..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-paper text-xs font-medium text-ink focus:border-primary outline-none transition"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary"
            >
              <option value="all">All Entity Types</option>
              <option value="stock">Stock Items</option>
              <option value="sale">Sales</option>
              <option value="invoice">Invoices</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={smeFilter}
              onChange={(e) => setSmeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary"
            >
              <option value="all">All SME Stores</option>
              {smes.map((sme) => (
                <option key={sme.id} value={sme.id}>
                  {sme.shop_name || sme.name || `SME #${sme.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Deletion Records Table ─── */}
      <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden font-body">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-muted">
            Loading Deletion Snapshots...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted">
            No permanent deletion logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase">
                  <th className="py-3.5 px-4 sm:px-6">Deleted Record</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">SME Store</th>
                  <th className="py-3.5 px-4">Deleted By</th>
                  <th className="py-3.5 px-4">Recorded Reason</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Deletion Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => {
                  let parsed = log.deleted_data;
                  if (typeof parsed === "string") {
                    try {
                      parsed = JSON.parse(parsed);
                    } catch {
                      parsed = {};
                    }
                  }
                  const previewTitle = parsed?.name || parsed?.sale?.customer_name || parsed?.invoice?.invoice_number || `Record #${log.entity_id}`;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedSnapshot({ ...log, parsed })}
                      className="hover:bg-card-hover cursor-pointer transition"
                    >
                      <td className="py-4 px-4 sm:px-6 font-heading">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-ink hover:text-primary transition">{previewTitle}</span>
                          <Eye size={13} className="text-primary opacity-70" />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-heading font-black uppercase border border-line bg-card-hover text-ink">
                          {getEntityIcon(log.entity_type)}
                          {log.entity_type} #{log.entity_id}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-ink">
                        {log.shop_name || log.owner_name || `SME #${log.owner_id || "—"}`}
                      </td>

                      <td className="py-4 px-4 text-muted">
                        {log.deleted_by_name || log.deleted_by_email || `User #${log.deleted_by || "System"}`}
                      </td>

                      <td className="py-4 px-4 text-muted italic max-w-xs truncate">
                        "{log.reason || "Deleted by user"}"
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right text-muted text-[11px]">
                        {log.deleted_at ? formatDate(log.deleted_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SNAPSHOT VIEWER MODAL SHEET ─── */}
      <Sheet
        open={Boolean(selectedSnapshot)}
        onClose={() => setSelectedSnapshot(null)}
        title={selectedSnapshot ? `Deleted ${selectedSnapshot.entity_type.toUpperCase()} #${selectedSnapshot.entity_id} Snapshot` : "Deleted Snapshot"}
      >
        {selectedSnapshot && (
          <div className="space-y-4 pt-2 font-body pb-6 text-ink">
            {/* Meta summary card */}
            <div className="p-4 rounded-xl bg-card border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-heading font-black uppercase border border-line bg-card-hover text-ink">
                  {getEntityIcon(selectedSnapshot.entity_type)}
                  {selectedSnapshot.entity_type} #{selectedSnapshot.entity_id}
                </span>
                <span className="text-xs text-muted font-bold font-heading">
                  Deleted {formatDate(selectedSnapshot.deleted_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase block font-heading">Deleted By</span>
                  <span className="font-black text-ink">{selectedSnapshot.deleted_by_name || selectedSnapshot.deleted_by_email || `User #${selectedSnapshot.deleted_by}`}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase block font-heading">SME Shop</span>
                  <span className="font-black text-ink">{selectedSnapshot.shop_name || selectedSnapshot.owner_name || `SME #${selectedSnapshot.owner_id}`}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-line text-xs">
                <span className="text-[10px] text-muted font-bold uppercase block font-heading">Recorded Reason</span>
                <p className="font-medium text-ink italic">"{selectedSnapshot.reason || "Deleted by merchant"}"</p>
              </div>
            </div>

            {/* Formatted JSON Snapshot Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-heading">
                <label className="text-xs font-black text-ink">Full Deleted Data Snapshot (Tamper-Proof):</label>
                <span className="text-[10px] font-mono text-muted">JSONB Capture</span>
              </div>
              <div className="rounded-xl border border-line bg-paper p-4 text-ink font-mono text-xs overflow-x-auto max-h-[350px] overflow-y-auto leading-relaxed shadow-inner">
                <pre>{JSON.stringify(selectedSnapshot.parsed || selectedSnapshot.deleted_data, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-2 font-heading">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
