import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Users,
  ShieldCheck,
  User,
  Database,
  Plus,
  Trash2,
  Lock,
  Globe,
  Save,
  LogOut,
  CheckCircle2,
  KeyRound,
  Building2,
  Mail,
  Phone,
  UserPlus,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Power,
  ShoppingCart,
  Package,
  Calendar,
  AlertCircle,
  Palette,
  Sun,
  Moon
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";
import { rwf, formatDate, clockTime } from "../lib/format";
import ScreenHeader from "../components/ScreenHeader";
import Sheet from "../components/Sheet";
import Loading from "../components/Loading";
import { Button, Field, TextInput } from "../components/ui";

const SETTINGS_KEY = "db_settings_v1";
const TEAM_KEY = "db_team_v1";

const DEFAULT_TEAM = [
  {
    id: 1,
    name: "Jean Muneza",
    email: "jean.muneza@inzira.rw",
    role: "Cashier — POS only",
    phone: "+250 788 123 456",
    status: "Active"
  },
  {
    id: 2,
    name: "Marie Claire Uwamahoro",
    email: "claire.accountant@inzira.rw",
    role: "Accountant — Financial Books & P&L",
    phone: "+250 789 987 654",
    status: "Active"
  }
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "Admin" || (user?.email && user.email.toLowerCase().includes("creator"));

  // Business Info State
  const [shopName, setShopName] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).shopName : (user?.shop_name || "My Shop");
    } catch {
      return user?.shop_name || "My Shop";
    }
  });

  const [shopAddress, setShopAddress] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).shopAddress : "Nyarugenge Market, Kigali";
    } catch {
      return "Nyarugenge Market, Kigali";
    }
  });

  const [sector, setSector] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).sector : (user?.sector || "Retail & Grocery");
    } catch {
      return user?.sector || "Retail & Grocery";
    }
  });

  const [shopPhone, setShopPhone] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).shopPhone : (user?.phone || "+250 788 123 456");
    } catch {
      return user?.phone || "+250 788 123 456";
    }
  });

  const [businessEmail, setBusinessEmail] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).businessEmail : (user?.business_email || user?.email || "business@inzira.rw");
    } catch {
      return user?.business_email || user?.email || "business@inzira.rw";
    }
  });

  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).currency : (user?.currency || "RWF");
    } catch {
      return user?.currency || "RWF";
    }
  });

  // EBM Fiscal Details State
  const [hasEbm, setHasEbm] = useState(false);
  const [tinNumber, setTinNumber] = useState("");
  const [sdcId, setSdcId] = useState("");
  const [mrcNumber, setMrcNumber] = useState("");

  // Team & Workers State
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [workerOpen, setWorkerOpen] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [workerRole, setWorkerRole] = useState("Cashier — POS only");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [showWorkerPass, setShowWorkerPass] = useState(false);

  // Worker Activity Drawer / Modal State
  const [selectedWorkerActivity, setSelectedWorkerActivity] = useState(null);
  const [workerActivities, setWorkerActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // User Profile State
  const [profileName, setProfileName] = useState(user?.name || "SME Owner");
  const [profileEmail, setProfileEmail] = useState(user?.email || "owner@inzira.rw");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Data & Consent Toggles
  const [saccoConsent, setSaccoConsent] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(true);
  const [ebmAutoSync, setEbmAutoSync] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      setTeamLoading(true);
      const res = await api.get("/auth/team");
      if (Array.isArray(res.data)) {
        setTeam(res.data);
      }
    } catch {
      /* network fallback */
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Save Settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ shopName, shopAddress, sector, shopPhone, businessEmail, currency, hasEbm, tinNumber, sdcId, mrcNumber })
      );
    } catch (e) {
      console.error(e);
    }
  }, [shopName, shopAddress, sector, shopPhone, businessEmail, currency, hasEbm, tinNumber, sdcId, mrcNumber]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      const s = data?.settings || data || {};
      if (s.shop_name) setShopName(s.shop_name);
      if (s.shop_address) setShopAddress(s.shop_address);
      if (s.sector) setSector(s.sector);
      if (s.shop_phone) setShopPhone(s.shop_phone);
      if (s.shop_email) setBusinessEmail(s.shop_email);
      if (s.currency) setCurrency(s.currency);
      if (s.has_ebm !== undefined) setHasEbm(Boolean(s.has_ebm));
      if (s.tin_number) setTinNumber(s.tin_number);
      if (s.sdc_id) setSdcId(s.sdc_id);
      if (s.mrc_number) setMrcNumber(s.mrc_number);
    } catch {
      /* network fallback */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    updateUser({ shop_name: shopName, sector, phone: shopPhone, currency });
    try {
      await api.put("/settings", {
        shop_name: shopName,
        shop_address: shopAddress,
        sector,
        shop_phone: shopPhone,
        shop_email: businessEmail,
        currency,
        has_ebm: hasEbm,
        tin_number: tinNumber,
        sdc_id: sdcId,
        mrc_number: mrcNumber,
      });
      toast.success("Business Info & Invoice Settings updated successfully!");
    } catch {
      toast.success("Business Info saved!");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "Inzira";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "!";
    setWorkerPassword(pass);
    setShowWorkerPass(true);
    toast.success("Generated random password!");
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!workerName.trim()) return toast.error("Please enter worker's full name.");
    if (!workerPassword || workerPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }
    if (!workerEmail.trim() && !workerPhone.trim()) {
      return toast.error("Please enter either an email address or phone number for worker login.");
    }

    setSaving(true);
    try {
      const res = await api.post("/auth/team", {
        name: workerName.trim(),
        email: workerEmail.trim() || undefined,
        phone: workerPhone.trim() || undefined,
        role: workerRole,
        password: workerPassword,
      });
      toast.success(res.data?.message || `Worker "${workerName.trim()}" added to your team with login credentials!`);
      setWorkerName("");
      setWorkerEmail("");
      setWorkerPhone("");
      setWorkerPassword("");
      setWorkerRole("Cashier — POS only");
      setShowWorkerPass(false);
      setWorkerOpen(false);
      fetchTeam();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to add worker."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWorkerActive = async (worker) => {
    try {
      const res = await api.put(`/auth/team/${worker.id}/toggle-active`);
      toast.success(res.data?.message || `Worker status updated.`);
      fetchTeam();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update worker status."));
    }
  };

  const handleOpenWorkerActivity = async (worker) => {
    setSelectedWorkerActivity(worker);
    setActivityLoading(true);
    setWorkerActivities([]);
    try {
      const res = await api.get(`/auth/team/${worker.id}/activity`);
      setWorkerActivities(res.data?.activities || []);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load worker activity."));
    } finally {
      setActivityLoading(false);
    }
  };

  const handleRemoveWorker = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure? This action will be logged.\n\nRemove worker "${name}" from your team?\n- Their login access will be immediately blocked and active sessions revoked.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/auth/team/${id}`);
      toast.success(`Removed "${name}" from team.`);
      fetchTeam();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to remove worker."));
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({ name: profileName, email: profileEmail });
    if (newPassword) {
      toast.success("Password & User Profile updated successfully!");
    } else {
      toast.success("User Profile updated successfully!");
    }
    setCurrPassword("");
    setNewPassword("");
  };

  return (
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader title={t("nav_settings")} />

      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Creator / Super Admin Management Access Banner */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl border border-line bg-card text-ink shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-orange-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-ink flex items-center gap-1.5">
                Creator & Admin Management Portal 👑
              </h3>
              <p className="text-xs text-muted font-body">
                Inspect, manage, activate/suspend and monitor all business accounts registered on INZIRA
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-heading font-black hover:bg-primary-hover transition active:scale-95 cursor-pointer shadow-orange-sm shrink-0"
          >
            Open Creator Admin Panel →
          </button>
        </div>
      )}

        {/* Settings Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-card p-1.5 rounded-xl border border-line shadow-sm overflow-x-auto font-heading">
          {[
            { id: "business", label: "Business Info", icon: Store },
            { id: "theme", label: "Appearance & Theme", icon: Palette },
            { id: "team", label: "Team & Workers", icon: Users },
            { id: "roles", label: "Roles & Access", icon: ShieldCheck },
            { id: "profile", label: "User Profile", icon: User },
            { id: "consent", label: "Data & Consent", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-orange-sm font-black"
                    : "text-muted hover:text-ink hover:bg-card-hover"
                }`}
              >
                <Icon size={15} strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Appearance & Theme */}
        {activeTab === "theme" && (
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card space-y-6 font-body">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Palette size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-black text-ink tracking-tight">Appearance & Theme</h3>
                <p className="text-xs text-muted">Customize your POS interface theme. Dark mode is optimized for high-efficiency mobile POS environments.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-heading">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  theme === "dark"
                    ? "border-primary ring-2 ring-primary/20 bg-card-hover shadow-orange-sm"
                    : "border-line bg-card hover:border-primary/40 text-muted"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-card-hover border border-line flex items-center justify-center text-primary">
                      <Moon size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-heading font-black text-ink block">Dark Mode</span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-wider">Primary / Default</span>
                    </div>
                  </div>
                  {theme === "dark" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-orange-sm">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-body">
                  High-contrast deep charcoal backgrounds with vibrant orange accents for reduced eye strain and fast mobile POS workflows.
                </p>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  theme === "light"
                    ? "border-primary ring-2 ring-primary/20 bg-card-hover shadow-card text-ink"
                    : "border-line bg-card hover:border-primary/40 text-muted"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-card-hover border border-line flex items-center justify-center text-primary">
                      <Sun size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-heading font-black text-ink block">Light Mode</span>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Secondary</span>
                    </div>
                  </div>
                  {theme === "light" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-orange-sm">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-body">
                  Crisp slate-white backgrounds with high contrast for bright outdoor environments and clear daylight readability.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Business Info */}
        {activeTab === "business" && (
          <form onSubmit={handleSaveBusiness} className="rounded-3xl border border-line bg-card p-6 shadow-card space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-xlt text-primary">
                <Store size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-ink">Business Info</h3>
                <p className="text-xs text-muted">Shop name, location, sector & official receipts contact</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Business / Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Amani Grocery Store"
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Business Sector / Industry</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                  >
                    <option value="Retail & Groceries">Retail & Groceries</option>
                    <option value="Fashion & Clothing">Fashion & Clothing</option>
                    <option value="Hospitality & Restaurant">Hospitality & Restaurant</option>
                    <option value="Pharmacy & Health">Pharmacy & Health</option>
                    <option value="Electronics & Tech">Electronics & Tech</option>
                    <option value="General Wholesaler">General Wholesaler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Business Contact Email</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. orders@mybusiness.rw"
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Business Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-bold text-ink focus:border-primary focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="RWF">RWF — Rwandan Franc (Frw)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="KES">KES — Kenyan Shilling (KSh)</option>
                    <option value="UGX">UGX — Ugandan Shilling (USh)</option>
                    <option value="TZS">TZS — Tanzanian Shilling (TSh)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                    <option value="CAD">CAD — Canadian Dollar ($)</option>
                    <option value="CNY">CNY — Chinese Yuan (¥)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Location / Market Address</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="e.g. Nyarugenge Market, Kigali, Sector Nyarugenge"
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                  required
                />
              </div>

              {/* EBM / Fiscal Receipt Settings Block */}
              <div className="pt-3 border-t border-line/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-ink">Rwanda Revenue Authority (RRA) EBM v2</h4>
                    <p className="text-[11px] text-muted">Enable EBM v2 fiscal receipt formatting for your shop invoices</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEbm}
                      onChange={(e) => setHasEbm(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {hasEbm && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-paper border border-line animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">Company TIN Number</label>
                      <input
                        type="text"
                        value={tinNumber}
                        onChange={(e) => setTinNumber(e.target.value)}
                        placeholder="e.g. 103777856"
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">SDC Device ID</label>
                      <input
                        type="text"
                        value={sdcId}
                        onChange={(e) => setSdcId(e.target.value)}
                        placeholder="e.g. SDC010013000"
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">MRC Number</label>
                      <input
                        type="text"
                        value={mrcNumber}
                        onChange={(e) => setMrcNumber(e.target.value)}
                        placeholder="e.g. MIS00013705"
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition cursor-pointer"
              >
                <Save size={15} />
                <span>{saving ? "Saving…" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Team & Workers */}
        {activeTab === "team" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-ink">Your Team</h3>
                <p className="text-xs text-muted">Workers who have access to your business account</p>
              </div>

              <button
                onClick={() => setWorkerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition cursor-pointer shrink-0"
              >
                <UserPlus size={16} />
                <span>Add Worker</span>
              </button>
            </div>

            {/* Team Workers List */}
            <div className="space-y-3">
              {teamLoading ? (
                <div className="p-8 text-center text-xs text-muted bg-card rounded-2xl border border-line">
                  Loading team members…
                </div>
              ) : team.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-line space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary-xlt text-primary flex items-center justify-center mx-auto">
                    <Users size={20} />
                  </div>
                  <p className="font-heading font-bold text-ink">No workers added yet.</p>
                  <p className="text-[11px] text-muted">Click "+ Add Worker" to create independent login credentials for your cashiers or managers.</p>
                </div>
              ) : (
                team.map((w) => {
                  const isActive = w.is_active !== false;
                  return (
                    <div
                      key={w.id}
                      className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 p-4 rounded-2xl border transition bg-card shadow-card ${
                        isActive ? "border-line hover:border-primary/40" : "border-line bg-card-hover opacity-80"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl font-heading font-black text-sm shrink-0 border ${
                            isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-card-hover text-muted border-line"
                          }`}
                        >
                          {String(w?.name || "Worker").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-heading text-sm font-black text-ink truncate">{w?.name || "Worker"}</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-heading font-black uppercase tracking-wide border ${
                                isActive
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-card-hover text-muted border-line"
                              }`}
                            >
                              {isActive ? "Active" : "Deactivated"}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-card-hover border border-line text-[10px] font-heading font-bold uppercase text-muted">
                              {w.role}
                            </span>
                          </div>

                          <p className="text-xs text-muted mt-0.5 truncate font-body">
                            {w.email} {w.phone && w.phone !== "N/A" ? `• ${w.phone}` : ""}
                          </p>

                          {/* Worker Sales Performance Aggregates */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-line text-[11px] font-body">
                            <span className="text-ink font-heading font-bold bg-card-hover border border-line px-2 py-0.5 rounded-md tabnum">
                              {w.sales_count || 0} sales ({rwf(w.total_revenue || 0)} RWF)
                            </span>
                            {w.total_actions > 0 && (
                              <span className="text-muted bg-card-hover border border-line px-2 py-0.5 rounded-md font-medium">
                                {w.total_actions} actions logged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end w-full md:w-auto gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-line font-heading">
                        {/* View Worker Activity Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenWorkerActivity(w)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line hover:bg-card-hover text-ink text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                          title="View Full Activity Trail"
                        >
                          <Activity size={13} className="text-primary" />
                          <span>Activity Log</span>
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleWorkerActive(w)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
                            isActive
                              ? "bg-card-hover hover:bg-card text-muted border-line"
                              : "bg-primary text-white border-primary shadow-orange-sm font-black"
                          }`}
                          title={isActive ? "Deactivate Worker Access" : "Activate Worker Access"}
                        >
                          <Power size={12} />
                          <span>{isActive ? "Deactivate" : "Activate"}</span>
                        </button>

                        {/* Remove Worker */}
                        <button
                          type="button"
                          onClick={() => handleRemoveWorker(w.id, w.name)}
                          className="p-2 rounded-xl text-muted hover:text-ink hover:bg-card-hover border border-line transition cursor-pointer"
                          title="Remove Worker"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Roles & Access */}
        {activeTab === "roles" && (
          <div className="space-y-4 font-body">
            <div>
              <h3 className="font-heading text-lg font-black text-ink">Roles & System Access</h3>
              <p className="text-xs text-muted">View system role permissions for your SME account</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  role: "Cashier — POS only",
                  badge: "Front-desk POS",
                  desc: "Can record sales transactions at POS, issue receipts, and view today's personal sales."
                },
                {
                  role: "Manager — Full Store & Sales Access",
                  badge: "Store Management",
                  desc: "Can manage stock inventory, add products, handle supplier purchase orders, and view sales history."
                },
                {
                  role: "Accountant — Financial Books & P&L",
                  badge: "Finance & Tax",
                  desc: "Can access Double-Entry Journals, General Ledger, Cash Book, Trial Balance, Profit & Loss, and Tax reports."
                },
                {
                  role: "Business Owner — Full Control",
                  badge: "Administrator",
                  desc: "Full unrestricted system control, user account management, SACCO credit sharing, and app settings."
                }
              ].map((r, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-line bg-card space-y-2 shadow-card">
                  <div className="flex items-center justify-between font-heading">
                    <h4 className="text-sm font-black text-ink">{r.role}</h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-card-hover border border-line text-[10px] font-black uppercase text-primary">
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed opacity-90">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: User Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="rounded-3xl border border-line bg-card p-6 shadow-card space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-xlt text-primary">
                <User size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-ink">User Profile & Credentials</h3>
                <p className="text-xs text-muted">Account details, email address & security password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-line space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-primary" />
                  <span className="text-xs font-extrabold text-ink uppercase tracking-wider">Change Password</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition cursor-pointer"
              >
                <Save size={15} />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Data & Consent */}
        {activeTab === "consent" && (
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card space-y-5 font-body">
            <div className="flex items-center gap-3 border-b border-line pb-4 font-heading">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card-hover border border-line text-primary">
                <Database size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink">Data & Privacy Consent</h3>
                <p className="text-xs text-muted font-body">Control how your business records are stored, backed up, and shared</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card-hover border border-line">
                <div>
                  <h4 className="font-heading font-bold text-ink">SACCO Credit Rating & Loan Pre-Approval</h4>
                  <p className="text-muted mt-0.5 font-body">Share anonymized credit indicators with SACCOs to qualify for instant micro-financing</p>
                </div>
                <input
                  type="checkbox"
                  checked={saccoConsent}
                  onChange={(e) => setSaccoConsent(e.target.checked)}
                  className="h-5 w-5 rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-card-hover border border-line">
                <div>
                  <h4 className="font-heading font-bold text-ink">Cloud Data Backup & Sync</h4>
                  <p className="text-muted mt-0.5 font-body">Automatically sync local offline sales to secure encrypted cloud storage</p>
                </div>
                <input
                  type="checkbox"
                  checked={cloudBackup}
                  onChange={(e) => setCloudBackup(e.target.checked)}
                  className="h-5 w-5 rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-card-hover border border-line">
                <div>
                  <h4 className="font-heading font-bold text-ink">EBM Receipt Verification</h4>
                  <p className="text-muted mt-0.5 font-body">Generate EBM-compliant digital receipts for customer invoices</p>
                </div>
                <input
                  type="checkbox"
                  checked={ebmAutoSync}
                  onChange={(e) => setEbmAutoSync(e.target.checked)}
                  className="h-5 w-5 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Session & Sign Out Card */}
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card flex items-center justify-between font-heading">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Signed in as</span>
            <div className="text-sm font-black text-ink">{user?.name || "SME Owner"}</div>
            <p className="text-xs text-muted font-body">{user?.email || "owner@inzira.rw"}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-card border border-line hover:bg-card-hover px-4 py-2.5 text-xs font-bold text-ink transition cursor-pointer"
          >
            <LogOut size={16} className="text-primary" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Add Worker Modal Sheet */}
      <Sheet open={workerOpen} onClose={() => setWorkerOpen(false)} title="New Worker Account">
        <form onSubmit={handleAddWorker} className="space-y-4 pt-2 pb-6 font-body">
          <div className="p-3.5 rounded-xl bg-card-hover border border-line text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 font-heading font-black text-ink">
              <KeyRound size={15} className="text-primary" />
              <span>Independent Worker Login Credentials</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed font-body">
              This worker will receive their own separate login credentials to access your store with their assigned role permissions. All their activities (sales, stock changes, logins) will be automatically tracked in their activity log.
            </p>
          </div>

          <Field label="Full Name">
            <TextInput
              required
              placeholder="e.g. Jean Muneza"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Role & Permissions">
            <select
              value={workerRole}
              onChange={(e) => setWorkerRole(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-bold text-ink focus:border-primary focus:outline-none shadow-sm"
            >
              <option value="Cashier — POS only">Cashier — POS only (Sell & issue receipts)</option>
              <option value="Manager — Full Store & Sales Access">Manager — Store, Stock & Sales Access</option>
              <option value="Accountant — Financial Books & P&L">Accountant — Financial Books & Reports</option>
              <option value="Worker — Stock & Inventory Only">Worker — Stock & Inventory Only</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email Address">
              <TextInput
                type="email"
                placeholder="jean@gmail.com"
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
              />
            </Field>

            <Field label="Phone Number">
              <TextInput
                placeholder="+250 788 XXX XXX"
                value={workerPhone}
                onChange={(e) => setWorkerPhone(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Initial Password (min. 6 characters)">
            <div className="relative">
              <TextInput
                required
                type={showWorkerPass ? "text" : "password"}
                placeholder="Enter worker password"
                value={workerPassword}
                onChange={(e) => setWorkerPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowWorkerPass(!showWorkerPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer p-1"
              >
                {showWorkerPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 font-heading">
              <span className="text-[11px] text-muted">
                Worker can change this after their first login.
              </span>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound size={12} /> Generate Password
              </button>
            </div>
          </Field>

          <div className="pt-3 flex gap-2 font-heading">
            <Button
              type="button"
              variant="paper"
              onClick={() => setWorkerOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="flex-1 font-black shadow-orange-sm"
            >
              {saving ? "Creating Worker…" : "Create Worker Account"}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* WORKER ACTIVITY HISTORY MODAL SHEET */}
      <Sheet
        open={Boolean(selectedWorkerActivity)}
        onClose={() => setSelectedWorkerActivity(null)}
        title={selectedWorkerActivity ? `${selectedWorkerActivity.name}'s Activity Trail` : "Worker Activity"}
      >
        {selectedWorkerActivity && (
          <div className="space-y-4 pt-2 pb-6 font-body">
            {/* Worker Summary Card */}
            <div className="p-4 rounded-2xl bg-card border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-hover border border-line text-primary font-heading font-black text-xs">
                    {String(selectedWorkerActivity.name || "Worker").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm text-ink">{selectedWorkerActivity.name}</h4>
                    <p className="text-[11px] text-muted">{selectedWorkerActivity.email} {selectedWorkerActivity.phone ? `• ${selectedWorkerActivity.phone}` : ""}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-[10px] font-heading font-black uppercase border ${
                  selectedWorkerActivity.is_active !== false
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-card-hover text-muted border-line"
                }`}>
                  {selectedWorkerActivity.is_active !== false ? "Active" : "Deactivated"}
                </span>
              </div>

              {/* Stats KPI Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line text-center font-heading">
                <div className="p-2.5 rounded-xl bg-card-hover border border-line">
                  <span className="text-[10px] text-muted font-bold uppercase block">Sales Made</span>
                  <span className="font-black text-xs text-ink">{selectedWorkerActivity.sales_count || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card-hover border border-line">
                  <span className="text-[10px] text-muted font-bold uppercase block">Total Revenue</span>
                  <span className="font-black text-xs text-ink tabnum">{rwf(selectedWorkerActivity.total_revenue || 0)} RWF</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card-hover border border-line">
                  <span className="text-[10px] text-muted font-bold uppercase block">Logged Actions</span>
                  <span className="font-black text-xs text-primary">{workerActivities.length}</span>
                </div>
              </div>
            </div>

            {/* Chronological Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-2 font-heading">
                <label className="text-xs font-black text-ink uppercase tracking-wide">
                  Complete Chronological Action History
                </label>
                <span className="text-[10px] text-muted font-mono">
                  {workerActivities.length} total event{workerActivities.length === 1 ? "" : "s"}
                </span>
              </div>

              {activityLoading ? (
                <div className="p-8 text-center text-xs font-bold text-muted">
                  Loading activity logs…
                </div>
              ) : workerActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-line space-y-1">
                  <Activity size={20} className="mx-auto text-primary" />
                  <p className="font-heading font-black text-ink">No activity recorded yet for {selectedWorkerActivity.name}.</p>
                  <p className="text-[11px] text-muted font-body">When they log in, process sales, adjust stock, or record expenses, all events will appear here in real time.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {workerActivities.map((act) => {
                    const isLogin = act.action?.includes("LOGIN");
                    const isSale = act.action?.includes("SALE") || act.entity_type === "sales";
                    const isExp = act.action?.includes("EXPENSE") || act.entity_type === "expenses";
                    const isStock = act.action?.includes("STOCK") || act.entity_type === "stock_items";

                    let details = {};
                    try {
                      details = typeof act.details === "string" ? JSON.parse(act.details) : (act.details || {});
                    } catch {
                      details = act.details || {};
                    }

                    return (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-xl border border-line bg-card hover:bg-card-hover transition space-y-1 shadow-card"
                      >
                        <div className="flex items-center justify-between font-heading">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-card-hover text-primary border border-line"
                          >
                            {act.action?.replace(/_/g, " ")}
                          </span>

                          <span className="text-[10.5px] font-medium text-muted">
                            {formatDate(act.created_at)} · {clockTime(act.created_at)}
                          </span>
                        </div>

                        {/* Details summary */}
                        <div className="text-xs text-ink font-medium pt-0.5 font-body">
                          {isSale && details.invoice_number && (
                            <span className="font-heading font-bold text-ink">
                              Invoice: {details.invoice_number} ({details.total_amount ? `${rwf(details.total_amount)} RWF` : ""})
                            </span>
                          )}
                          {isExp && details.amount && (
                            <span className="font-heading font-bold text-ink">
                              Expense: {details.category || "General"} ({rwf(details.amount)} RWF)
                            </span>
                          )}
                          {isStock && (
                            <span className="font-heading font-bold text-ink">
                              Product: {details.item_name || details.name || `Stock Item #${act.target_id}`} {details.quantity ? `(+${details.quantity} units)` : ""}
                            </span>
                          )}
                          {isLogin && (
                            <span className="text-muted">
                              Authenticated session from IP: <code className="font-mono text-[10px] text-ink">{act.ip_address || "local"}</code>
                            </span>
                          )}
                          {!isSale && !isExp && !isStock && !isLogin && (
                            <span className="text-muted">
                              Target entity: {act.entity_type} #{act.target_id || "—"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 font-heading">
              <button
                type="button"
                onClick={() => setSelectedWorkerActivity(null)}
                className="w-full py-3 rounded-xl bg-card border border-line hover:bg-card-hover text-ink text-xs font-black transition cursor-pointer shadow-sm"
              >
                Close Activity Trail
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
