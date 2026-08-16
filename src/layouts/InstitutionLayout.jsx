import { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  Users,
  BadgeDollarSign,
  Sliders,
  Store,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OfflineBadge from "../components/OfflineBadge";
import Logomark from "../components/Logomark";

export const INSTITUTION_OPTIONS = [
  { id: "sacco_umwalimu", name: "Umwalimu SACCO", bnrCode: "SACCO-KGL-041" },
  { id: "urwego_bank", name: "Urwego Bank", bnrCode: "MFB-RWA-102" },
  { id: "bk_micro", name: "Bank of Kigali", bnrCode: "CB-BK-001" },
  { id: "zigama_css", name: "Zigama CSS", bnrCode: "CSS-ZIG-003" },
  { id: "inzira_capital", name: "Inzira Growth", bnrCode: "FIN-INZ-2024" },
];

const INSTITUTION_NAV_ITEMS = [
  { to: "/institution", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/institution/borrowers", label: "Borrowers", icon: Users },
  { to: "/institution/loans", label: "Facilities", icon: BadgeDollarSign },
  { to: "/institution/settings", label: "Settings", icon: Sliders },
];

export default function InstitutionLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedInstId, setSelectedInstId] = useState(() => {
    return localStorage.getItem("inzira_selected_institution") || "sacco_umwalimu";
  });

  const activeInstitution = useMemo(() => {
    return INSTITUTION_OPTIONS.find((i) => i.id === selectedInstId) || INSTITUTION_OPTIONS[0];
  }, [selectedInstId]);

  const handleSelectInstitution = (id) => {
    setSelectedInstId(id);
    localStorage.setItem("inzira_selected_institution", id);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-paper font-body text-ink">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-line bg-card p-5 shrink-0 select-none shadow-card h-screen overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-3">
              <Logomark size={36} className="shadow-sm border border-line rounded-xl" />
              <div>
                <h1 className="font-heading text-lg font-black text-ink leading-tight tracking-tight">
                  DataBridge
                </h1>
                <p className="text-[10px] font-heading font-extrabold text-primary tracking-wider uppercase">
                  Institutional Credit
                </p>
              </div>
            </div>
          </div>

          {/* Active Financial Institution Switcher */}
          <div className="p-3 rounded-xl border border-line bg-card-hover space-y-1.5 font-heading">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase">
              <span>Institution</span>
              <span className="text-primary font-mono text-[9px]">{activeInstitution.bnrCode}</span>
            </div>
            <select
              value={selectedInstId}
              onChange={(e) => handleSelectInstitution(e.target.value)}
              className="w-full bg-paper border border-line text-ink text-xs font-bold rounded-lg px-2.5 py-2 focus:border-primary focus:outline-none transition cursor-pointer"
            >
              {INSTITUTION_OPTIONS.map((inst) => (
                <option key={inst.id} value={inst.id} className="bg-card text-ink">
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5 font-heading">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted uppercase">
              Credit Operations
            </span>

            {INSTITUTION_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? "bg-primary text-white shadow-orange-sm font-extrabold"
                      : "text-muted hover:text-ink hover:bg-card-hover"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? "text-white" : "text-muted"}
                      />
                      <span>{label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/90" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Quick Cross-Portal Switcher */}
          <div className="pt-2 border-t border-line font-heading space-y-1.5">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted uppercase">
              Portals
            </span>
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-muted hover:text-ink hover:bg-card-hover border border-transparent hover:border-line transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Store size={15} className="text-primary" />
                <span>Store POS</span>
              </div>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-muted hover:text-ink hover:bg-card-hover border border-transparent hover:border-line transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} className="text-primary" />
                <span>Admin</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-line font-heading space-y-3">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-card-hover text-muted hover:text-primary transition cursor-pointer"
            >
              {isDark ? <Sun size={14} className="text-primary" /> : <Moon size={14} />}
            </button>
            <OfflineBadge />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-card-hover border border-line p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-heading text-xs font-black">
                {activeInstitution.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="truncate text-xs font-heading font-bold text-ink">{activeInstitution.name}</div>
                <div className="truncate text-[10.5px] text-muted">Lending Officer</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Header */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-xl select-none font-heading"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Logomark size={30} className="shadow-sm border border-line rounded-xl shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-black text-ink leading-tight truncate">
                {activeInstitution.name}
              </h2>
              <p className="text-[9.5px] font-black text-primary uppercase">
                Institutional Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedInstId}
              onChange={(e) => handleSelectInstitution(e.target.value)}
              className="bg-card border border-line text-ink text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none"
            >
              {INSTITUTION_OPTIONS.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name.split(" ")[0]}
                </option>
              ))}
            </select>
            <OfflineBadge />
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-paper pb-20 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet context={{ activeInstitution }} />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Matching SME POS style) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-line bg-card/95 backdrop-blur-xl px-2 py-2 select-none font-heading">
          {INSTITUTION_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "text-primary font-black"
                    : "text-muted hover:text-ink font-bold"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-primary" : "text-muted"} />
                  <span className="text-[10px] leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
