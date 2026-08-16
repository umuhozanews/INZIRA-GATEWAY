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
  Globe,
  Lock,
  Menu,
  X,
  Grid,
  Trash2,
} from "lucide-react";
import { useAuth, checkIsAdmin } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import Logomark from "../components/Logomark";
import OfflineBadge from "../components/OfflineBadge";
import Sheet from "../components/Sheet";

const ADMIN_NAV_LINKS = [
  { to: "/admin", label: "Platform Overview", icon: ShieldCheck, end: true },
  { to: "/admin/smes", label: "SME Directory", icon: Users },
  { to: "/admin/analytics", label: "Platform Analytics", icon: TrendingUp },
  { to: "/admin/audit", label: "Security Audit Logs", icon: FileText },
  { to: "/admin/deletion-logs", label: "Deletion Logs", icon: Trash2 },
  { to: "/admin/settings", label: "Settings & Backups", icon: Settings },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthorizedAdmin = isAdmin || checkIsAdmin(user);

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-manrope text-gray-900">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 border border-gray-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] text-center space-y-4">
          <div className="h-16 w-16 bg-[#F4FBE4] text-purple-900 border border-[#D4F06B] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Restricted Access</h2>
          <p className="text-xs font-medium text-gray-500">
            This portal is strictly reserved for INZIRA Platform Administrators. Your account does not have master governance permissions.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-[#D4F06B] text-gray-900 rounded-full font-black text-xs hover:bg-[#C5E456] transition shadow-sm active:scale-95 cursor-pointer"
            >
              Return to Store Dashboard
            </button>
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-full font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F9FAFB] font-manrope text-gray-900">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-gray-200/80 bg-white p-5 shrink-0 select-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] h-screen overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Logomark size={36} />
              <div>
                <h1 className="font-manrope text-lg font-black text-gray-900 leading-tight">
                  DataBridge
                </h1>
                <p className="text-[10px] font-extrabold text-purple-600 tracking-wider">
                  ADMIN CONTROL CENTER
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
              Admin Governance
            </span>

            {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#D4F06B] text-gray-900 shadow-md shadow-[#D4F06B]/20 font-black"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-700"}
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                      <span>{label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-gray-900/80" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-4">
          {/* Language & Network Status */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-extrabold text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            >
              <Globe size={13} className="text-purple-600" />
              <span>{lang === "en" ? "EN" : "RW"}</span>
            </button>
            <OfflineBadge />
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F4FBE4]/50 p-2.5">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4F06B] text-xs font-black text-gray-900 shadow-sm">
                {(user?.name || "A")[0].toUpperCase()}
              </div>
              <div className="truncate text-left">
                <p className="truncate text-xs font-bold text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-[10px] text-purple-700 font-bold">
                  {user?.email || "admin@inzira.rw"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-red-500 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* ─── MOBILE BOTTOM NAVIGATION ─── */}
        <nav
          className="md:hidden sticky bottom-0 z-30 flex items-center justify-around border-t border-gray-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] select-none w-full"
          style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {ADMIN_NAV_LINKS.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-1 flex-col items-center justify-center py-1 transition"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-[#D4F06B] text-gray-900 shadow-sm scale-105"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold tracking-tight ${
                      isActive ? "text-gray-900 font-black" : "text-gray-400"
                    }`}
                  >
                    {String(label || "").split(" ")[0]}
                  </span>
                </div>
              )}
            </NavLink>
          ))}

          {/* More Quick Action Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-1 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex h-8 w-12 items-center justify-center rounded-full text-gray-400">
                <Grid size={19} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-gray-400">More</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Mobile More Sheet */}
      <Sheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Platform Management">
        <div className="grid grid-cols-1 gap-2.5 pt-2 pb-6">
          {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(to);
              }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-gray-200/80 bg-white hover:bg-[#F4FBE4] hover:border-[#D4F06B] transition cursor-pointer text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4F06B] text-gray-900 group-hover:scale-105 transition shadow-sm">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-600 transition">{label}</h4>
                <p className="text-[11px] text-gray-500">Access platform administration module</p>
              </div>
            </button>
          ))}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full py-3 rounded-2xl bg-red-50 text-red-700 font-black text-xs flex items-center justify-center gap-2 mt-2"
          >
            <LogOut size={16} />
            <span>Sign Out Admin Session</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
