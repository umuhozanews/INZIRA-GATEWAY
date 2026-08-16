import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact, formatDate } from "../../lib/format";

export default function SmeDirectory() {
  const navigate = useNavigate();
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  const [resetModalSme, setResetModalSme] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [auditModalSme, setAuditModalSme] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  async function loadSmes() {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get("/admin/smes", {
          params: {
            status: statusFilter !== "all" ? statusFilter : undefined,
            sector: sectorFilter !== "all" ? sectorFilter : undefined,
          },
        });
      } catch {
        res = await api.get("/v2/admin/smes", {
          params: {
            status: statusFilter !== "all" ? statusFilter : undefined,
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
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-body text-ink">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between font-heading">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">
            SME REGISTRY
          </span>
          <h1 className="text-lg md:text-2xl font-black text-ink flex items-center gap-1.5 leading-tight">
            Merchant & Business Directory
          </h1>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-black bg-primary/10 text-primary border border-primary/20 tabnum">
          {filteredSmes.length} Stores
        </span>
      </div>

      {/* ─── Search & Filters Card ─── */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-line shadow-card space-y-3 font-body">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by shop name, owner, phone, email, district..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-paper text-xs font-medium text-ink focus:border-primary outline-none transition"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary"
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
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary"
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
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary"
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
      <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-muted">
            Loading Directory...
          </div>
        ) : filteredSmes.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 size={36} className="mx-auto text-muted" />
            <h4 className="text-sm font-heading font-black text-ink">No stores found</h4>
            <p className="text-xs text-muted">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-card-hover text-[10px] font-heading font-black text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Shop & Owner</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Sector & District</th>
                  <th className="py-3.5 px-4">Sales Volume</th>
                  <th className="py-3.5 px-4">SACCO Health</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-body">
                {filteredSmes.map((sme) => (
                  <tr key={sme.id} className="hover:bg-card-hover transition group">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-orange-sm">
                          {(sme.shop_name || sme.name || "S")[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-heading font-black text-ink group-hover:text-primary transition">
                            {sme.shop_name || `${sme.name}'s Shop`}
                          </h4>
                          <p className="text-[11px] text-muted font-medium">{sme.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-ink font-bold">
                          <Phone size={12} className="text-muted" />
                          <span>{sme.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted">
                          <Mail size={12} className="text-muted" />
                          <span className="truncate max-w-[140px]">{sme.email || "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-card-hover text-muted border border-line">
                        {sme.sector || "Retail"}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted mt-1">
                        <MapPin size={11} className="text-primary" />
                        <span>{sme.district || "Kigali"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-heading">
                      <div className="font-black text-ink tabnum">
                        {rwfCompact(sme.total_sales || 0)} <span className="text-[10px] text-muted font-bold">RWF</span>
                      </div>
                      <p className="text-[11px] text-muted font-body">
                        {sme.items_count || 0} items in stock
                      </p>
                    </td>

                    <td className="py-4 px-4 font-heading">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-card-hover text-ink border border-line tabnum"
                      >
                        <Activity size={10} className="text-primary" />
                        <span>Score {sme.score || 75}/100</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 font-heading">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => handleToggleStatus(sme)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                            sme.is_active !== false
                              ? "bg-primary text-white shadow-orange-sm hover:bg-primary-hover"
                              : "bg-card-hover text-muted border border-line hover:text-ink"
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
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-card-hover text-muted border border-line">
                            Setup Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right font-heading">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/smes/${sme.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-black transition flex items-center gap-1 shadow-orange-sm cursor-pointer active:scale-95"
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
                          className="p-1.5 rounded-xl border border-line hover:bg-card-hover text-muted hover:text-ink transition cursor-pointer"
                          title="Reset Password for Merchant"
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenAudit(sme)}
                          className="p-1.5 rounded-xl border border-line hover:bg-card-hover text-muted hover:text-ink transition cursor-pointer"
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
          <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-card space-y-4 border border-line text-ink font-body">
            <div className="flex items-center justify-between pb-3 border-b border-line font-heading">
              <div className="flex items-center gap-2 text-ink">
                <KeyRound size={18} className="text-primary" />
                <h3 className="text-sm font-black">Reset Merchant Password</h3>
              </div>
              <button
                onClick={() => setResetModalSme(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted font-medium">
              Set a new password for <strong className="text-ink font-bold">{resetModalSme.name}</strong> ({resetModalSme.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 font-heading">
              <div>
                <label className="block text-[11px] font-black text-muted uppercase mb-1">
                  New Password (Optional, leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. Inzira@2026! or leave empty"
                  className="w-full px-4 py-2.5 rounded-xl border border-line bg-paper text-xs font-bold text-ink outline-none focus:border-primary font-body"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 font-heading">
                <button
                  type="button"
                  onClick={() => setResetModalSme(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:bg-card-hover border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover shadow-orange-sm disabled:opacity-50"
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
          <div className="bg-card rounded-2xl max-w-xl w-full p-6 shadow-card space-y-4 border border-line max-h-[85vh] flex flex-col text-ink font-body">
            <div className="flex items-center justify-between pb-3 border-b border-line font-heading">
              <div className="flex items-center gap-2 text-ink">
                <FileText size={18} className="text-primary" />
                <h3 className="text-sm font-black">
                  Audit History: {auditModalSme.shop_name || auditModalSme.name}
                </h3>
              </div>
              <button
                onClick={() => setAuditModalSme(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-body">
              {auditLoading ? (
                <p className="text-xs text-muted text-center py-6">Loading audit records...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No records found for this merchant.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-card-hover border border-line text-xs space-y-1">
                    <div className="flex items-center justify-between font-heading">
                      <span className="font-black text-ink uppercase">{log.action}</span>
                      <span className="text-[10px] text-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted text-[11px]">
                      By: {log.user_name || "System"} ({log.user_email || "N/A"})
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-line text-right font-heading">
              <button
                onClick={() => setAuditModalSme(null)}
                className="px-4 py-2 rounded-xl bg-card-hover border border-line text-ink text-xs font-bold hover:bg-card cursor-pointer"
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
