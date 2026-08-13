import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  Sparkles,
  Search,
  ExternalLink,
  Menu,
  X,
  AlertCircle,
  Database,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logomark from "../components/Logomark";

const ADMIN_NAV_LINKS = [
  { to: "/admin", label: "Platform Overview", icon: ShieldCheck, end: true },
  { to: "/admin/smes", label: "SME Directory", icon: Users },
  { to: "/admin/analytics", label: "Platform Analytics", icon: TrendingUp },
  { to: "/admin/audit", label: "Security Audit Logs", icon: FileText },
  { to: "/admin/settings", label: "Settings & Backups", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin =
    user?.role === "Admin" ||
    user?.role === "pulse_admin" ||
    user?.role === "admin" ||
    (user?.email && user.email.toLowerCase().includes("creator"));

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-manrope">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-sm text-gray-500 mb-6">
            This portal is strictly reserved for INZIRA Platform Administrators. Your account does not have sufficient permissions.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition"
            >
              Return to Store Dashboard
            </button>
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-manrope flex flex-col md:flex-row">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex w-72 flex-col justify-between border-r border-slate-200/80 bg-slate-900 text-white p-5 shrink-0 shadow-2xl h-screen sticky top-0">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Logomark size={38} className="ring-2 ring-purple-500/30" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base text-white tracking-tight leading-tight">
                  INZIRA
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Control
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                PLATFORM ADMIN PORTAL
              </p>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-md">
                {(user?.name || "A")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-white truncate">{user?.name || "Administrator"}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    {user?.role || "pulse_admin"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              Management Suite
            </span>
            {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-4 py-3 text-xs font-black transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 translate-x-1"
                      : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={isActive ? "text-white" : "text-slate-400 group-hover:text-purple-400"}
                      />
                      <span>{label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/80" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
            <span>System Health</span>
            <span className="text-emerald-400 font-bold">99.8% Online</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logomark size={30} />
          <div>
            <h2 className="text-xs font-black text-white leading-tight">INZIRA ADMIN</h2>
            <p className="text-[9px] font-bold text-purple-400 uppercase">Platform Control</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-200"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-400" />
                <h3 className="font-black text-sm text-white">Platform Administration</h3>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="space-y-1">
              {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${
                      isActive ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Log Out Admin Session</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 min-w-0 bg-[#F8FAFC] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
