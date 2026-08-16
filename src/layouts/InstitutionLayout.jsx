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
  Briefcase,
  CheckCircle2,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import OfflineBadge from "../components/OfflineBadge";
import Logomark from "../components/Logomark";

export const INSTITUTION_OPTIONS = [
  { id: "sacco_umwalimu", name: "Umwalimu SACCO", type: "SACCO / Cooperative Bank", bnrCode: "SACCO-KGL-041", maxLoan: 15000000 },
  { id: "urwego_bank", name: "Urwego Bank Micro-Credit", type: "Microfinance Bank", bnrCode: "MFB-RWA-102", maxLoan: 25000000 },
  { id: "bk_micro", name: "Bank of Kigali SME Credit Desk", type: "Commercial Bank", bnrCode: "CB-BK-001", maxLoan: 50000000 },
  { id: "zigama_css", name: "Zigama CSS Credit Fund", type: "Cooperative Bank", bnrCode: "CSS-ZIG-003", maxLoan: 30000000 },
  { id: "inzira_capital", name: "Inzira Direct SME Growth Fund", type: "Fintech Lending Partner", bnrCode: "FIN-INZ-2024", maxLoan: 20000000 },
];

const INSTITUTION_NAV_LINKS = [
  { to: "/institution", label: "Portfolio Overview", icon: LayoutDashboard, end: true },
  { to: "/institution/borrowers", label: "Borrower Underwriting Queue", icon: Users },
  { to: "/institution/loans", label: "Active Loan Facilities", icon: BadgeDollarSign },
  { to: "/institution/settings", label: "Lending Criteria & Profile", icon: Sliders },
];

export default function InstitutionLayout() {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Institution profile selector stored locally
  const [selectedInstId, setSelectedInstId] = useState(() => {
    return localStorage.getItem("inzira_selected_institution") || "sacco_umwalimu";
  });

  const activeInstitution = useMemo(() => {
    return INSTITUTION_OPTIONS.find(i => i.id === selectedInstId) || INSTITUTION_OPTIONS[0];
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
          <div className="flex items-center justify-between pb-3 border-b border-line font-heading">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-orange-sm">
                <Building2 size={20} strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black text-ink leading-tight truncate">
                  INZIRA Credit
                </h1>
                <p className="text-[10px] font-black text-primary tracking-wider uppercase">
                  Institutional Portal
                </p>
              </div>
            </div>
          </div>

          {/* Active Financial Institution Badge & Switcher */}
          <div className="p-3 rounded-xl border border-line bg-card-hover space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-heading font-black text-muted uppercase tracking-wider">
                Active Institution
              </span>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                BNR Verified
              </span>
            </div>
            <select
              value={selectedInstId}
              onChange={(e) => handleSelectInstitution(e.target.value)}
              className="w-full bg-paper border border-line text-ink text-xs font-heading font-bold rounded-lg px-2.5 py-2 focus:border-primary focus:outline-none transition cursor-pointer"
            >
              {INSTITUTION_OPTIONS.map((inst) => (
                <option key={inst.id} value={inst.id} className="bg-card text-ink">
                  {inst.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10.5px] text-muted font-medium pt-0.5">
              <span>{activeInstitution.type}</span>
              <span className="font-mono text-[9.5px]">{activeInstitution.bnrCode}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 font-heading">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted uppercase">
              Credit & Underwriting
            </span>

            {INSTITUTION_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? "bg-primary text-white shadow-orange-sm font-black"
                      : "text-muted hover:text-ink hover:bg-card-hover"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-primary"} />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Cross-Portal Switcher Links */}
          <div className="pt-2 border-t border-line font-heading space-y-1.5">
            <span className="px-3 text-[10px] font-extrabold tracking-wider text-muted uppercase">
              Cross Portals
            </span>
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-ink hover:bg-card-hover border border-transparent hover:border-line transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Store size={15} className="text-primary" />
                <span>SME Merchant POS</span>
              </div>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-ink hover:bg-card-hover border border-transparent hover:border-line transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} className="text-primary" />
                <span>Admin Governance</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* User Info & Sign Out Footer */}
        <div className="pt-4 border-t border-line font-heading space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-hover border border-line text-ink text-xs font-black">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "FI"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-ink truncate leading-tight">
                {user?.name || "Credit Officer"}
              </p>
              <p className="text-[10.5px] font-medium text-muted truncate">
                Lending Officer
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-line bg-card-hover text-muted hover:text-ink text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between border-b border-line bg-card px-4 py-3 shrink-0 font-heading">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-ink leading-tight">
                INZIRA Institution
              </h2>
              <p className="text-[9.5px] font-black text-primary uppercase">
                {activeInstitution.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OfflineBadge />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card-hover text-ink text-xs font-black cursor-pointer"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-line bg-card p-4 space-y-3 font-heading z-30 animate-in slide-in-from-top duration-150">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted uppercase">
                Switch Institution
              </span>
              <select
                value={selectedInstId}
                onChange={(e) => handleSelectInstitution(e.target.value)}
                className="w-full bg-paper border border-line text-ink text-xs font-bold rounded-lg px-2.5 py-2"
              >
                {INSTITUTION_OPTIONS.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <nav className="flex flex-col gap-1">
              {INSTITUTION_NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                      isActive ? "bg-primary text-white" : "text-muted hover:text-ink hover:bg-card-hover"
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-2 border-t border-line flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
                className="flex-1 py-2 rounded-lg border border-line bg-card-hover text-xs font-bold text-ink"
              >
                Store POS
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/admin");
                }}
                className="flex-1 py-2 rounded-lg border border-line bg-card-hover text-xs font-bold text-ink"
              >
                Admin Center
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto bg-paper">
          <Outlet context={{ activeInstitution }} />
        </main>
      </div>
    </div>
  );
}
