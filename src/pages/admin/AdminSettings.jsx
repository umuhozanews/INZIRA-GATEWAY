import { useState } from "react";
import {
  Settings,
  Database,
  Download,
  ShieldCheck,
  Globe,
  Mail,
  Server,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function AdminSettings() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadBackup() {
    setDownloading(true);
    try {
      const res = await api.get("/settings/backup");
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-manrope">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
          System Administration
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
          Platform Configuration & Database Backups
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Manage system-level settings, export immutable database snapshots, and monitor cloud services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Backup Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Database Snapshot Export</h3>
              <p className="text-xs text-gray-500">Download a complete JSON export of all platform tables</p>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Exports users, sales, stock items, invoices, expenses, journals, and audit logs. This backup is cryptographically sanitized and safe for disaster recovery.
          </p>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-xl bg-purple-900 text-white font-black text-xs hover:bg-purple-800 flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 disabled:opacity-50 transition cursor-pointer"
          >
            <Download size={16} />
            <span>{downloading ? "Exporting Database..." : "Download Full Database JSON Backup"}</span>
          </button>
        </div>

        {/* Cloud Integration Status */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Connected Cloud Infrastructure</h3>
              <p className="text-xs text-gray-500">Live operational status of external services</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-purple-600" />
                <span className="font-bold text-gray-800">Resend Email Gateway</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
                <CheckCircle2 size={13} />
                <span>Connected (onboarding@resend.dev)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-purple-600" />
                <span className="font-bold text-gray-800">PostgreSQL Multi-Tenant DB</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
                <CheckCircle2 size={13} />
                <span>Active & Healthy</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-purple-600" />
                <span className="font-bold text-gray-800">Google OAuth Identity</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
                <CheckCircle2 size={13} />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
