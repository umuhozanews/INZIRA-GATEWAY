import { useState, useEffect } from "react";
import {
  Trash2,
  Search,
  ShieldCheck,
  Calendar,
  Package,
  ShoppingCart,
  FileText,
  Eye,
  AlertTriangle,
  Lock,
  Building,
  User,
  ChevronDown,
} from "lucide-react";
import api from "../../lib/api";
import { formatDate, rwf } from "../../lib/format";
import Sheet from "../../components/Sheet";

export default function AdminDeletionLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [smeFilter, setSmeFilter] = useState("all");
  const [smes, setSmes] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Load SME list for filter dropdown
  useEffect(() => {
    api.get("/admin/smes")
      .then((res) => {
        const list = res.data?.smes || res.data?.data || res.data || [];
        if (Array.isArray(list)) setSmes(list);
      })
      .catch(() => {});
  }, []);

  // Load permanent deletion logs
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/admin/deletion-logs", {
          params: {
            search: search || undefined,
            entity_type: entityFilter !== "all" ? entityFilter : undefined,
            owner_id: smeFilter !== "all" ? smeFilter : undefined,
            limit: 100,
          },
        });
        setLogs(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.warn("Using local deletion logs fallback:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, entityFilter, smeFilter]);

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "stock":
        return <Package size={13} className="text-amber-600" />;
      case "sale":
        return <ShoppingCart size={13} className="text-purple-600" />;
      case "invoice":
        return <FileText size={13} className="text-blue-600" />;
      default:
        return <Trash2 size={13} className="text-red-600" />;
    }
  };

  const getEntityBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "stock":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "sale":
        return "bg-purple-50 text-purple-900 border-purple-200";
      case "invoice":
        return "bg-blue-50 text-blue-900 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-manrope">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
              PERMANENT AUDIT ARCHIVE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Append-Only Log
            </span>
          </div>
          <h1 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-1.5 leading-tight font-heading">
            Permanent Deletion Records
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Every deleted product, voided sale, and cancelled invoice is permanently captured with a complete JSON snapshot before deletion.
          </p>
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, user, SME, reason..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#D4F06B] outline-none transition"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none"
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
              className="w-full px-3 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none"
            >
              <option value="all">All SME Shops</option>
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
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400">
            Loading Permanent Deletion Records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <ShieldCheck size={24} />
            </div>
            <p className="font-bold text-gray-600">No deletions recorded.</p>
            <p className="text-[11px] text-gray-400">When users delete stock items, sales, or invoices, their full snapshots will appear here permanently.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <th className="py-3.5 px-4 sm:px-6">Record Type & ID</th>
                  <th className="py-3.5 px-4">SME Shop</th>
                  <th className="py-3.5 px-4">Deleted By</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Snapshot Payload</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Deleted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  let parsed = {};
                  try {
                    parsed = typeof log.deleted_data === "string" ? JSON.parse(log.deleted_data) : log.deleted_data || {};
                  } catch {
                    parsed = log.deleted_data || {};
                  }

                  const previewTitle = parsed?.name || parsed?.sale?.customer_name || parsed?.invoice?.invoice_number || `Record #${log.entity_id}`;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getEntityBadgeColor(
                              log.entity_type
                            )}`}
                          >
                            {getEntityIcon(log.entity_type)}
                            {log.entity_type} #{log.entity_id}
                          </span>
                          <span className="font-extrabold text-gray-900 truncate max-w-[140px]" title={previewTitle}>
                            {previewTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building size={13} className="text-gray-400 shrink-0" />
                          <span className="font-bold text-gray-800">
                            {log.shop_name || log.owner_name || `SME #${log.owner_id || "—"}`}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-gray-800 font-semibold">
                          {log.deleted_by_name || log.deleted_by_email || `User #${log.deleted_by || "System"}`}
                        </div>
                        {log.deleted_by_email && (
                          <div className="text-[10px] text-gray-400 font-mono">{log.deleted_by_email}</div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-gray-600 text-[11px] font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 block max-w-[200px] truncate" title={log.reason || "Deleted by merchant"}>
                          {log.reason || "Deleted by merchant"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedSnapshot({ ...log, parsed })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-extrabold transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <Eye size={12} />
                          <span>View Snapshot</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right font-medium text-gray-500 whitespace-nowrap">
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
          <div className="space-y-4 pt-2 font-manrope pb-6">
            {/* Meta summary card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase border ${getEntityBadgeColor(selectedSnapshot.entity_type)}`}>
                  {getEntityIcon(selectedSnapshot.entity_type)}
                  {selectedSnapshot.entity_type} #{selectedSnapshot.entity_id}
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  Deleted {formatDate(selectedSnapshot.deleted_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Deleted By</span>
                  <span className="font-extrabold text-gray-900">{selectedSnapshot.deleted_by_name || selectedSnapshot.deleted_by_email || `User #${selectedSnapshot.deleted_by}`}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">SME Shop</span>
                  <span className="font-extrabold text-gray-900">{selectedSnapshot.shop_name || selectedSnapshot.owner_name || `SME #${selectedSnapshot.owner_id}`}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/60 text-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Recorded Reason</span>
                <p className="font-semibold text-gray-800 italic">"{selectedSnapshot.reason || "Deleted by merchant"}"</p>
              </div>
            </div>

            {/* Formatted JSON Snapshot Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-gray-700">Full Deleted Data Snapshot (Tamper-Proof):</label>
                <span className="text-[10px] font-mono text-gray-400">JSONB Capture</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-950 p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[350px] overflow-y-auto leading-relaxed shadow-inner">
                <pre>{JSON.stringify(selectedSnapshot.parsed || selectedSnapshot.deleted_data, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="w-full py-3 px-4 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-black transition cursor-pointer shadow-sm"
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
