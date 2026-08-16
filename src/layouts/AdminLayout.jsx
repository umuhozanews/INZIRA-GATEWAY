import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  ShieldCheck,
  Trash2,
  Settings,
  LogOut,
  ChevronRight,
  Globe,
  Lock,
  Grid,
} from "lucide-react";
import { useAuth, checkIsAdmin } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import OfflineBadge from "../components/OfflineBadge";
import Sheet from "../components/Sheet";
import Logomark from "../components/Logomark";

const ADMIN_NAV_LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/smes", label: "SME Stores", icon: Store },
  { to: "/admin/analytics", label: "Global Analytics", icon: BarChart3 },
  { to: "/admin/audit", label: "Security & Audit", icon: ShieldCheck },
  { to: "/admin/deletion-logs", label: "Permanent Deletion Logs", icon: Trash2 },
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
      <div className="min-h-screen bg-paper flex items-center justify-center p-4 font-body text-ink">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-line shadow-card text-center space-y-4 font-heading">
          <div className="h-14 w-14 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-orange-sm">
            <Lock size={26} strokeWidth={2.2} />
          </div>
          <h2 className="text-xl font-black text-ink">Restricted Access</h2>
          <p className="text-xs font-medium text-muted font-body">
            This portal is strictly reserved for INZIRA Platform Administrators. Your account does not have master governance permissions.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary-hover transition shadow-orange-sm active:scale-95 cursor-pointer"
            >
              Return to Store Dashboard
            </button>
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-card-hover border border-line text-muted hover:text-ink rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-paper font-body text-ink">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-line bg-card p-5 shrink-0 select-none shadow-card h-screen overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line font-heading">
            <div className="flex items-center gap-3">
              <Logomark size={36} />
              <div>
                <h1 className="text-base font-black text-ink leading-tight">
                  DataBridge
                </h1>
                <p className="text-[10px] font-black text-primary tracking-wider">
                  ADMIN CONTROL CENTER
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 font-heading">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted uppercase">
              Admin Governance
            </span>

            {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-white shadow-orange-sm font-black"
                      : "text-muted hover:bg-card-hover hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={isActive ? "text-white" : "text-muted group-hover:text-ink"}
                        strokeWidth={isActive ? 2.4 : 1.8}
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

        {/* Footer Section */}
        <div className="flex flex-col gap-3 pt-4 border-t border-line mt-4">
          {/* Language & Network Status */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-card-hover px-3 py-1.5 text-[11px] font-heading font-extrabold text-ink hover:border-primary/40 transition cursor-pointer"
            >
              <Globe size={13} className="text-primary" />
              <span>{lang === "en" ? "EN" : "RW"}</span>
            </button>
            <OfflineBadge />
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-card-hover p-2.5">
            <div className="flex items-center gap-2.5 truncate font-heading">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-white shadow-orange-sm">
                {(user?.name || "A")[0].toUpperCase()}
              </div>
              <div className="truncate text-left">
                <p className="truncate text-xs font-bold text-ink">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-[10px] text-muted font-medium font-body">
                  {user?.email || "admin@inzira.rw"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-ink transition cursor-pointer"
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
          className="md:hidden sticky bottom-0 z-30 flex items-center justify-around border-t border-line bg-card/95 backdrop-blur-md shadow-nav select-none w-full font-heading"
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
                    className={`flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-white shadow-orange-sm scale-105"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span
                    className={`text-[10px] tracking-tight ${
                      isActive ? "text-primary font-black" : "text-muted font-bold"
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
            className="flex flex-1 flex-col items-center justify-center py-1 text-muted hover:text-ink transition cursor-pointer"
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex h-8 w-12 items-center justify-center rounded-xl text-muted">
                <Grid size={18} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-muted">More</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Mobile More Sheet */}
      <Sheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Platform Management">
        <div className="grid grid-cols-1 gap-2.5 pt-2 pb-6 font-body">
          {ADMIN_NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(to);
              }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-line bg-card hover:bg-card-hover hover:border-primary/40 transition cursor-pointer text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition shadow-sm">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-heading text-xs font-black text-ink group-hover:text-primary transition">{label}</h4>
                <p className="text-[11px] text-muted font-medium">Access platform administration module</p>
              </div>
            </button>
          ))}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full py-3 rounded-xl bg-card border border-line text-ink hover:bg-card-hover font-heading font-black text-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out Admin Session</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
