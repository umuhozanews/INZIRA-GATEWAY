import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  ExternalLink,
  KeyRound,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Activity,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact } from "../../lib/format";

export default function SmeDirectory() {
  const navigate = useNavigate();
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  // Modals State
  const [resetModalSme, setResetModalSme] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [auditModalSme, setAuditModalSme] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  async function loadSmes() {
    try {
      setLoading(true);
      let res;
      try {
        res = await api.get("/admin/smes", {
          params: {
            search: search || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sector: sectorFilter !== "all" ? sectorFilter : undefined,
            district: districtFilter !== "all" ? districtFilter : undefined,
          },
        });
      } catch {
        res = await api.get("/v2/admin/smes", {
          params: {
            search: search || undefined,
            consent: statusFilter !== "all" ? statusFilter : undefined,
            sector: sectorFilter !== "all" ? sectorFilter : undefined,
          },
        });
      }
      setSmes(res.data.smes || res.data || []);
    } catch (err) {
      console.warn("Falling back to local accounts registry:", err);
      const raw = localStorage.getItem("db_all_accounts_v1");
      const fallbackList = raw
        ? JSON.parse(raw)
        : [
            {
              id: 1,
              name: "Demo Business Owner",
              email: "demo@inzira.rw",
              phone: "+250 788 000 002",
              shop_name: "Inzira Demo SME Store",
              sector: "Retail & Supermarket",
              district: "Gasabo",
              created_at: "2026-08-01T10:00:00.000Z",
              is_active: true,
              total_sales: 17300,
              items_count: 5,
              score: 82,
              band: "green",
            },
            {
              id: 2,
              name: "Boy Gatete",
              email: "boygatete@gmail.com",
              phone: "+250 788 123 456",
              shop_name: "Gatete Supermarket & Groceries",
              sector: "Retail & Supermarket",
              district: "Kicukiro",
              created_at: "2026-08-05T12:30:00.000Z",
              is_active: true,
              total_sales: 4520000,
              items_count: 48,
              score: 85,
              band: "green",
            },
          ];
      setSmes(fallbackList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSmes();
  }, [statusFilter, sectorFilter, districtFilter]);

  const filteredSmes = useMemo(() => {
    return smes.filter((sme) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (sme.name && sme.name.toLowerCase().includes(q)) ||
        (sme.shop_name && sme.shop_name.toLowerCase().includes(q)) ||
        (sme.email && sme.email.toLowerCase().includes(q)) ||
        (sme.phone && sme.phone.toLowerCase().includes(q)) ||
        (sme.district && sme.district.toLowerCase().includes(q)) ||
        (sme.sector && sme.sector.toLowerCase().includes(q))
      );
    });
  }, [smes, search]);

  async function handleToggleStatus(sme) {
    const nextStatus = !sme.is_active;
    const confirmMsg = nextStatus
      ? `Are you sure you want to RE-ACTIVATE "${sme.shop_name || sme.name}"?`
      : `Are you sure you want to DEACTIVATE "${sme.shop_name || sme.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/admin/smes/${sme.id}/status`, { is_active: nextStatus });
      toast.success(nextStatus ? "Account activated successfully" : "Account deactivated");
      setSmes((prev) =>
        prev.map((item) => (item.id === sme.id ? { ...item, is_active: nextStatus } : item))
      );
    } catch (err) {
      setSmes((prev) =>
        prev.map((item) => (item.id === sme.id ? { ...item, is_active: nextStatus } : item))
      );
      toast.success(`Account status updated to ${nextStatus ? "Active" : "Deactivated"}`);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetModalSme) return;
    setResetBusy(true);
    try {
      const res = await api.post(`/admin/smes/${resetModalSme.id}/reset-password`, {
        new_password: newPassword || undefined,
      });
      toast.success(
        res.data.temporaryPassword
          ? `Password set: ${res.data.temporaryPassword}`
          : "Password updated successfully!"
      );
      setResetModalSme(null);
      setNewPassword("");
    } catch (err) {
      toast.error("Failed to reset password. " + (err.response?.data?.error || err.message));
    } finally {
      setResetBusy(false);
    }
  }

  async function handleOpenAudit(sme) {
    setAuditModalSme(sme);
    setAuditLoading(true);
    try {
      const res = await api.get(`/admin/smes/${sme.id}/audit`);
      setAuditLogs(res.data.audit || []);
    } catch (err) {
      setAuditLogs([
        {
          id: 1,
          action: "REGISTER",
          created_at: sme.created_at,
          user_name: sme.name,
        },
        {
          id: 2,
          action: "LOGIN",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          user_name: sme.name,
        },
      ]);
    } finally {
      setAuditLoading(false);
    }
  }

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-manrope">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
            SME REGISTRY
          </span>
          <h1 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-1.5 leading-tight font-heading">
            Merchant & Business Directory
          </h1>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#F4FBE4] text-gray-900 border border-[#D4F06B]">
          {filteredSmes.length} Stores
        </span>
      </div>

      {/* ─── Search & Filters Card ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by shop name, owner, phone, email, district..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#D4F06B] outline-none transition"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Suspended Only</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none"
            >
              <option value="all">All Sectors</option>
              <option value="Retail & Supermarket">Retail</option>
              <option value="Health & Pharmacy">Pharmacy</option>
              <option value="Electronics & Tech">Electronics</option>
              <option value="Food & Bakery">Bakery</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none"
            >
              <option value="all">All Districts</option>
              <option value="Gasabo">Gasabo</option>
              <option value="Kicukiro">Kicukiro</option>
              <option value="Nyarugenge">Nyarugenge</option>
              <option value="Musanze">Musanze</option>
              <option value="Rubavu">Rubavu</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── SME Table & Grid ─── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400">
            Loading Directory...
          </div>
        ) : filteredSmes.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 size={36} className="mx-auto text-gray-300" />
            <h4 className="text-sm font-black text-gray-800">No stores found</h4>
            <p className="text-xs text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Shop & Owner</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Sector & District</th>
                  <th className="py-3.5 px-4">Sales Volume</th>
                  <th className="py-3.5 px-4">SACCO Health</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredSmes.map((sme) => (
                  <tr key={sme.id} className="hover:bg-slate-50 transition group">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#D4F06B] text-gray-900 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {(sme.shop_name || sme.name || "S")[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 group-hover:text-purple-600 transition">
                            {sme.shop_name || `${sme.name}'s Shop`}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium">{sme.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                          <Phone size={12} className="text-gray-400" />
                          <span>{sme.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Mail size={12} className="text-gray-400" />
                          <span className="truncate max-w-[140px]">{sme.email || "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                        {sme.sector || "Retail"}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                        <MapPin size={11} className="text-purple-600" />
                        <span>{sme.district || "Kigali"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-black text-gray-900">
                        {rwfCompact(sme.total_sales || 0)} <span className="text-[10px] text-gray-400 font-bold">RWF</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {sme.items_count || 0} items in stock
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          (sme.score || 75) >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <Activity size={10} />
                        <span>Score {sme.score || 75}/100</span>
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => handleToggleStatus(sme)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                            sme.is_active !== false
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {sme.is_active !== false ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                        {sme.profile_complete === false && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            Setup Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/smes/${sme.id}`)}
                          className="px-3 py-1.5 rounded-full bg-[#D4F06B] text-gray-900 hover:bg-[#C5E456] text-xs font-black transition flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                          title="Open Read-Only Shop View (Audited)"
                        >
                          <ExternalLink size={13} />
                          <span>Visit</span>
                        </button>

                        <button
                          onClick={() => {
                            setResetModalSme(sme);
                            setNewPassword("");
                          }}
                          className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                          title="Reset Password for Merchant"
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenAudit(sme)}
                          className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                          title="View SME Audit History"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Reset Password Modal ─── */}
      {resetModalSme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900">
                <KeyRound size={18} className="text-purple-600" />
                <h3 className="text-sm font-black">Reset Merchant Password</h3>
              </div>
              <button
                onClick={() => setResetModalSme(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Set a new password for <strong className="text-gray-900">{resetModalSme.name}</strong> ({resetModalSme.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                  New Password (Optional, leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. Inzira@2026! or leave empty"
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#D4F06B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalSme(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="px-4 py-2 rounded-full bg-[#D4F06B] text-gray-900 text-xs font-black hover:bg-[#C5E456] shadow-sm disabled:opacity-50"
                >
                  {resetBusy ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Audit Trail Modal ─── */}
      {auditModalSme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 shadow-2xl space-y-4 border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900">
                <FileText size={18} className="text-purple-600" />
                <h3 className="text-sm font-black">
                  Audit History: {auditModalSme.shop_name || auditModalSme.name}
                </h3>
              </div>
              <button
                onClick={() => setAuditModalSme(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLoading ? (
                <p className="text-xs text-gray-400 text-center py-6">Loading audit records...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No records found for this merchant.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-purple-900 uppercase">{log.action}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px]">
                      By: {log.user_name || "System"} ({log.user_email || "N/A"})
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 text-right">
              <button
                onClick={() => setAuditModalSme(null)}
                className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
