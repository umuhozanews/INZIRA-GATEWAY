import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Store,
  ShieldCheck,
  Search,
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  Phone,
  Mail,
  Calendar,
  Activity,
  Award,
} from "lucide-react";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import { Button, Field, TextInput } from "../components/ui";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { checkIsAdmin, ALL_ACCOUNTS_KEY, DEFAULT_ACCOUNTS, saveAccountToRegistry } from "../context/AuthContext";
import { rwf, formatDate } from "../lib/format";

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = checkIsAdmin(user);

  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(ALL_ACCOUNTS_KEY);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  // Fetch real-time backend registered users and activity
  useEffect(() => {
    api.get("/admin/smes")
      .then((res) => {
        const data = res.data?.smes || res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
        }
      })
      .catch(() => {});
  }, []);

  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("inzira_admin_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clearAlerts = () => {
    localStorage.removeItem("inzira_admin_alerts");
    setAlerts([]);
    toast.success("Admin alerts cleared.");
  };
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // New Merchant Form State for Admin
  const [newAccForm, setNewAccForm] = useState({
    name: "",
    shop_name: "",
    email: "",
    phone: "",
    location: "Kigali, Rwanda",
    currency: "RWF",
    sector: "Retail & Supermarket",
    dailySales: "20-50",
    needEbm: "Yes",
    teamSize: "2-5",
    role: "Merchant",
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-body text-ink">
        <div className="w-16 h-16 rounded-2xl bg-card-hover border border-line flex items-center justify-center text-primary">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-heading font-black text-ink">Access Restricted</h2>
        <p className="text-sm font-medium text-muted max-w-md">
          The Creator & Admin Management Portal is reserved exclusively for platform administrators. Normal SME merchant accounts cannot view or access this portal.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-heading font-black hover:bg-primary-hover shadow-orange-sm transition cursor-pointer active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Re-save to localStorage whenever accounts change
  useEffect(() => {
    try {
      localStorage.setItem(ALL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !query ||
        acc.name?.toLowerCase().includes(q) ||
        acc.shop_name?.toLowerCase().includes(q) ||
        acc.email?.toLowerCase().includes(q) ||
        acc.location?.toLowerCase().includes(q) ||
        acc.phone?.includes(q) ||
        acc.referralCode?.toLowerCase().includes(q) ||
        acc.referralSource?.toLowerCase().includes(q);

      const matchesSector =
        sectorFilter === "all" ||
        acc.sector?.toLowerCase().includes(sectorFilter.toLowerCase());

      return matchesQuery && matchesSector;
    });
  }, [accounts, query, sectorFilter]);

  const toggleAccountStatus = (id) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const nextStatus = acc.status === "Suspended" ? "Active" : "Suspended";
          toast.success(`Account "${acc.shop_name}" is now ${nextStatus}`);
          return { ...acc, status: nextStatus };
        }
        return acc;
      })
    );
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newAccForm.name.trim() || !newAccForm.shop_name.trim()) {
      return toast.error("Please fill in Owner Name and Business Name.");
    }

    const created = {
      id: "usr_" + Date.now(),
      name: newAccForm.name.trim(),
      shop_name: newAccForm.shop_name.trim(),
      location: newAccForm.location || "Kigali, Rwanda",
      currency: newAccForm.currency || "RWF",
      sector: newAccForm.sector,
      email: newAccForm.email.trim() || `${Date.now()}@inzira.rw`,
      business_email: newAccForm.email.trim() || `${Date.now()}@inzira.rw`,
      phone: newAccForm.phone.trim() || "+250 788 000 000",
      dailySales: newAccForm.dailySales,
      needEbm: newAccForm.needEbm,
      teamSize: newAccForm.teamSize,
      startDate: "Immediately",
      referralCode: "ADMIN_CREATOR",
      referralSource: "Created by Admin Creator",
      status: "Active",
      role: newAccForm.role,
      createdAt: new Date().toISOString(),
    };

    saveAccountToRegistry(created);
    setAccounts((prev) => [created, ...prev]);
    toast.success(`Account "${created.shop_name}" settled & created!`);
    setCreateOpen(false);
    setNewAccForm({
      name: "",
      shop_name: "",
      email: "",
      phone: "",
      location: "Kigali, Rwanda",
      currency: "RWF",
      sector: "Retail & Supermarket",
      dailySales: "20-50",
      needEbm: "Yes",
      teamSize: "2-5",
      role: "Merchant",
    });
  };

  const ebmCount = accounts.filter((a) => a.needEbm === "Yes" || a.needEbm === "y").length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-body text-ink pb-24 md:pb-8">
      {/* Header */}
      <ScreenHeader
        title="INZIRA Creator & Admin Control Portal"
        right={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-heading font-black text-white shadow-orange-sm hover:bg-primary-hover transition cursor-pointer active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} /> <span>Settle New Account</span>
          </button>
        }
      />

      {/* Creator Platform Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-heading">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-orange-sm">
            <Store size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Registered Accounts</div>
            <div className="text-2xl font-black text-ink mt-0.5 tabnum">{accounts.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-orange-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Active Merchants</div>
            <div className="text-2xl font-black text-ink mt-0.5 tabnum">
              {accounts.filter((a) => a.status !== "Suspended").length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-orange-sm">
            <Building size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-wider">EBM Integrated</div>
            <div className="text-2xl font-black text-ink mt-0.5 tabnum">{ebmCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-orange-sm">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Platform Health</div>
            <div className="text-2xl font-black text-ink mt-0.5 tabnum">99.8%</div>
          </div>
        </div>
      </div>

      {/* REAL-TIME NEW MERCHANT SIGNUP ALERTS BANNER */}
      {alerts.length > 0 && (
        <div className="rounded-2xl bg-card text-ink p-5 shadow-card border border-primary/30 font-heading">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-primary">
                New Merchant Signup Alerts ({alerts.length})
              </h3>
            </div>
            <button
              onClick={clearAlerts}
              className="text-[11px] font-bold text-muted hover:text-ink underline cursor-pointer"
            >
              Clear Alerts
            </button>
          </div>

          <div className="space-y-2 font-body">
            {alerts.slice(0, 3).map((al) => (
              <div
                key={al.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-paper border border-line text-xs"
              >
                <div>
                  <span className="font-heading font-black text-ink">{al.title}</span>
                  <p className="text-muted text-[11px] mt-0.5">{al.message}</p>
                </div>
                <span className="text-[10px] font-medium text-muted shrink-0">
                  {formatDate(al.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-body">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 shadow-sm flex-1">
          <Search size={16} className="text-muted shrink-0" />
          <input
            className="flex-1 bg-transparent text-xs md:text-sm font-medium text-ink outline-none placeholder:text-muted"
            placeholder="Search by owner name, shop name, location, phone, currency or referral..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Account Registry Table & Cards */}
      <div className="space-y-3 font-body">
        <div className="flex items-center justify-between px-1 font-heading">
          <h2 className="text-sm font-black text-ink">
            All Business Accounts ({filteredAccounts.length})
          </h2>
          <span className="text-xs font-bold text-muted">Creator Master Registry</span>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-line text-xs font-medium text-muted">
            No business accounts match your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAccounts.map((acc) => {
              const isSuspended = acc.status === "Suspended";

              return (
                <div
                  key={acc.id}
                  className="rounded-2xl border border-line bg-card p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-primary/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-heading font-black text-base shadow-orange-sm">
                        {acc.shop_name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-heading">
                          <h3 className="text-sm font-black text-ink leading-snug">
                            {acc.shop_name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              acc.role === "Admin"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-card-hover text-muted border border-line"
                            }`}
                          >
                            {acc.role || "Merchant"}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted mt-0.5 font-body">
                          Owner: <span className="text-ink font-bold">{acc.name}</span> • <span className="text-muted font-semibold">{acc.location || "Kigali, Rwanda"}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-heading font-black uppercase tracking-wider shrink-0 ${
                        isSuspended ? "bg-card-hover border border-line text-muted" : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {acc.status || "Active"}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-line py-3 font-body">
                    <div>
                      <span className="text-muted font-medium block text-[11px]">Sector</span>
                      <span className="font-bold text-ink truncate block">{acc.sector || "Retail"}</span>
                    </div>
                    <div>
                      <span className="text-muted font-medium block text-[11px]">Contact & Email</span>
                      <span className="font-bold text-ink truncate block">{acc.phone || acc.email}</span>
                    </div>
                    <div>
                      <span className="text-muted font-medium block text-[11px]">Currency Standard</span>
                      <span className="font-black font-heading text-ink block">{acc.currency || "RWF"}</span>
                    </div>
                    <div>
                      <span className="text-muted font-medium block text-[11px]">EBM Status</span>
                      <span className="font-black font-heading text-ink block">
                        {acc.needEbm === "Yes" ? "EBM Enabled" : "Standard"}
                      </span>
                    </div>
                  </div>

                  {/* Referral Source & Actions */}
                  <div className="flex items-center justify-between pt-1 font-heading">
                    <div className="text-[11px] font-medium text-muted truncate max-w-[180px] font-body">
                      Referral: <strong className="text-ink font-bold">{acc.referralCode || acc.referralSource || "Direct"}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAcc(acc)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-line bg-card-hover text-xs font-bold text-ink hover:border-primary/40 transition cursor-pointer"
                      >
                        <Eye size={13} /> View
                      </button>

                      <button
                        onClick={() => toggleAccountStatus(acc.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                          isSuspended
                            ? "bg-primary text-white shadow-orange-sm hover:bg-primary-hover"
                            : "bg-card-hover text-muted border border-line hover:text-ink hover:border-line"
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <CheckCircle size={13} /> Activate
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> Suspend
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INSPECT ACCOUNT MODAL SHEET */}
      <Sheet open={!!selectedAcc} onClose={() => setSelectedAcc(null)} title="Merchant Account Details">
        {selectedAcc && (
          <div className="space-y-4 pt-2 font-body pb-6 text-ink">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-line">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-heading font-black text-lg shadow-orange-sm">
                {selectedAcc.shop_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-ink">{selectedAcc.shop_name}</h3>
                <p className="text-xs text-muted font-medium">ID: {selectedAcc.id}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Owner Full Name</span>
                <span className="font-heading font-black text-ink">{selectedAcc.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Location / Address</span>
                <span className="font-heading font-bold text-ink">{selectedAcc.location || "Kigali, Rwanda"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Business Currency</span>
                <span className="font-heading font-black text-ink">{selectedAcc.currency || "RWF"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Business Sector</span>
                <span className="font-heading font-bold text-ink">{selectedAcc.sector}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Owner Email</span>
                <span className="font-bold text-ink">{selectedAcc.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Business Email</span>
                <span className="font-bold text-ink">{selectedAcc.business_email || selectedAcc.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Phone Number</span>
                <span className="font-bold text-ink">{selectedAcc.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Team Size</span>
                <span className="font-heading font-bold text-ink">{selectedAcc.teamSize}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Referral Code</span>
                <span className="font-heading font-black text-primary font-mono">{selectedAcc.referralCode || selectedAcc.referralSource || "DIRECT"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-muted font-medium">Registration Date</span>
                <span className="font-bold text-ink">{formatDate(selectedAcc.createdAt)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 font-heading">
              <Button
                variant="primary"
                onClick={() => {
                  if (selectedAcc.id) {
                    navigate(`/admin/smes/${selectedAcc.id}`);
                  }
                }}
                className="w-full font-black shadow-orange-sm flex items-center justify-center gap-2 py-3"
              >
                <Store size={16} />
                <span>Visit Merchant Store Dashboard</span>
              </Button>
              <Button variant="secondary" onClick={() => setSelectedAcc(null)} className="w-full font-bold">
                Close Inspection
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* CREATE NEW ACCOUNT MODAL SHEET FOR ADMIN */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Settle & Create New Merchant Account">
        <form onSubmit={handleCreateAccount} className="space-y-4 pt-2 font-body pb-6 text-ink">
          <Field label="Business / Shop Name">
            <TextInput
              required
              placeholder="e.g. Kigali Wholesale Mart"
              value={newAccForm.shop_name}
              onChange={(e) => setNewAccForm({ ...newAccForm, shop_name: e.target.value })}
            />
          </Field>

          <Field label="Owner Full Name">
            <TextInput
              required
              placeholder="e.g. Jean Paul Ndayisaba"
              value={newAccForm.name}
              onChange={(e) => setNewAccForm({ ...newAccForm, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email Address">
              <TextInput
                type="email"
                placeholder="owner@gmail.com"
                value={newAccForm.email}
                onChange={(e) => setNewAccForm({ ...newAccForm, email: e.target.value })}
              />
            </Field>

            <Field label="Phone Number">
              <TextInput
                type="tel"
                placeholder="+250 788 123 456"
                value={newAccForm.phone}
                onChange={(e) => setNewAccForm({ ...newAccForm, phone: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Business Sector">
              <select
                value={newAccForm.sector}
                onChange={(e) => setNewAccForm({ ...newAccForm, sector: e.target.value })}
                className="w-full rounded-xl border border-line bg-card p-2.5 text-xs font-semibold text-ink outline-none focus:border-primary"
              >
                <option>Retail & Supermarket</option>
                <option>Wholesale & Distribution</option>
                <option>Electronics & Phones</option>
                <option>Pharmacy & Health</option>
                <option>Clothing & Fashion</option>
                <option>Hardware & Construction</option>
                <option>Services & Salon</option>
                <option>Restaurant & Café</option>
              </select>
            </Field>

            <Field label="Need EBM Integration?">
              <select
                value={newAccForm.needEbm}
                onChange={(e) => setNewAccForm({ ...newAccForm, needEbm: e.target.value })}
                className="w-full rounded-xl border border-line bg-card p-2.5 text-xs font-semibold text-ink outline-none focus:border-primary"
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>
          </div>

          <div className="pt-2 flex gap-2 font-heading">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-black shadow-orange-sm">
              Settle Account
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
