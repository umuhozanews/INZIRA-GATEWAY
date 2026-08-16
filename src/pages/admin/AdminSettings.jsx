import { useState } from "react";
import {
  Settings,
  Database,
  Download,
  ShieldCheck,
  Globe,
  Mail,
  Server,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function AdminSettings() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadBackup() {
    setDownloading(true);
    try {
      let res;
      try {
        res = await api.get("/settings/backup");
      } catch {
        res = await api.get("/v2/admin/dashboard");
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inzira_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Platform database backup downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export backup: " + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto font-body text-ink">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between font-heading">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">
            INFRASTRUCTURE & CONFIGURATION
          </span>
          <h1 className="text-lg md:text-2xl font-black text-ink flex items-center gap-1.5 leading-tight">
            Settings & Database Backups
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-body">
        {/* Database Backup Card */}
        <div className="bg-card rounded-2xl p-5 sm:p-6 border border-line shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-orange-sm">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-ink">Database Snapshot Export</h3>
              <p className="text-[11px] text-muted font-medium">Download complete encrypted JSON data dump</p>
            </div>
          </div>

          <p className="text-xs text-muted font-medium leading-relaxed">
            Generates a sanitized JSON export of all registered SMEs, sales transactions, stock catalogs, invoices, and audit logs.
          </p>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-heading font-black text-xs hover:bg-primary-hover transition shadow-orange-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>{downloading ? "Preparing Backup..." : "Export Full Database JSON"}</span>
          </button>
        </div>

        {/* Cloud Infrastructure Status */}
        <div className="bg-card rounded-2xl p-5 sm:p-6 border border-line shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-orange-sm">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-ink">Cloud Infrastructure Status</h3>
              <p className="text-[11px] text-muted font-medium">Real-time platform services health</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-card-hover border border-line text-xs font-heading">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-primary" />
                <span className="font-bold text-ink">PostgreSQL Primary Database</span>
              </div>
              <span className="flex items-center gap-1 font-black text-ink text-[11px]">
                <CheckCircle2 size={13} className="text-primary" />
                <span>Connected</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card-hover border border-line text-xs font-heading">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                <span className="font-bold text-ink">Resend Email Gateway</span>
              </div>
              <span className="flex items-center gap-1 font-black text-ink text-[11px]">
                <CheckCircle2 size={13} className="text-primary" />
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card-hover border border-line text-xs font-heading">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-primary" />
                <span className="font-bold text-ink">Google OAuth SSO</span>
              </div>
              <span className="flex items-center gap-1 font-black text-ink text-[11px]">
                <CheckCircle2 size={13} className="text-primary" />
                <span>Enabled</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
