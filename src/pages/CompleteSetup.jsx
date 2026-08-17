import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Coins,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Tag,
  User,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Logomark from "../components/Logomark";

const SECTORS = [
  "Retail & Supermarket",
  "Wholesale & Distribution",
  "Electronics & Phones",
  "Pharmacy & Health",
  "Clothing & Fashion",
  "Hardware & Construction",
  "Services & Salon",
  "Restaurant & Café",
];

const CURRENCIES = [
  { code: "RWF", label: "Rwandan Franc (RWF)" },
  { code: "USD", label: "US Dollar (USD $)" },
  { code: "EUR", label: "Euro (EUR €)" },
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "UGX", label: "Ugandan Shilling (UGX)" },
];

const COUNTRY_CODES = [
  { code: "+250", label: "🇷🇼 +250 (RW)" },
  { code: "+256", label: "🇺🇬 +256 (UG)" },
  { code: "+254", label: "🇰🇪 +254 (KE)" },
  { code: "+257", label: "🇧🇮 +257 (BI)" },
  { code: "+243", label: "🇨🇩 +243 (CD)" },
  { code: "+1", label: "🇺🇸 +1 (US)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
];

export default function CompleteSetup() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Wizard state: Step 1 (Store details) vs Step 2 (Currency & Operations)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("Retail & Supermarket");
  const [currency, setCurrency] = useState("RWF");
  const [teamSize, setTeamSize] = useState("1 (Just Me)");
  const [needEbm, setNeedEbm] = useState("No");
  const [tinNumber, setTinNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [busy, setBusy] = useState(false);

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      if (user.shop_name && user.shop_name !== "My Shop" && user.phone) {
        // If already completed setup, navigate to dashboard
        navigate("/", { replace: true });
        return;
      }
      if (user.shop_name && user.shop_name !== "My Shop") {
        setShopName(user.shop_name);
      }
      if (user.phone) {
        setPhone(user.phone.replace(/^\+250/, "").trim());
      }
      if (user.email && !businessEmail) {
        setBusinessEmail(user.email);
      }
    }
  }, [user, navigate]);

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      return toast.error("Please enter your business phone number.");
    }
    if (!shopName.trim()) {
      return toast.error("Please enter your business/shop name.");
    }
    if (!location.trim()) {
      return toast.error("Please enter your business district or location.");
    }
    setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needEbm === "Yes" && !tinNumber.trim()) {
      return toast.error("Please provide your RRA TIN Number or select 'No'.");
    }

    setBusy(true);
    const fullPhone = `${countryCode} ${phone.trim()}`;

    try {
      const payload = {
        name: user?.name,
        shop_name: shopName.trim(),
        phone: fullPhone,
        business_email: businessEmail.trim() || user?.email,
        location: location.trim(),
        district: location.trim(),
        sector: businessType,
        currency,
        teamSize,
        needEbm,
        tinNumber: needEbm === "Yes" ? tinNumber.trim() : null,
        referralCode: referralCode.trim() || null,
        profile_complete: true,
      };

      // 1. Update store settings on backend
      try {
        await api.put("/settings", {
          shop_name: shopName.trim(),
          shop_address: location.trim(),
          shop_phone: fullPhone,
          currency: currency || "RWF",
          tin_number: needEbm === "Yes" ? tinNumber.trim() : null,
          has_ebm: needEbm === "Yes",
          sector_default: businessType,
          district_default: location.trim(),
          shop_email: businessEmail.trim() || user?.email,
        });
      } catch (settingsErr) {
        console.warn("Backend settings update notice:", settingsErr.message);
      }

      // 2. Complete setup on backend
      try {
        await api.post("/auth/complete-setup", {
          shop_name: shopName.trim(),
          business_name: shopName.trim(),
          phone: fullPhone,
          location: location.trim(),
          district: location.trim(),
          sector: businessType,
          currency,
          teamSize,
          needEbm,
          tinNumber: needEbm === "Yes" ? tinNumber.trim() : null,
        });
      } catch (setupErr) {
        console.warn("Backend complete setup notice:", setupErr.message);
      }
      
      // 3. Update Auth context locally
      updateUser({
        ...user,
        ...payload,
        shop_name: shopName.trim(),
        phone: fullPhone,
        profile_complete: true,
      });

      toast.success(`Welcome to INZIRA! "${shopName}" is ready.`);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Complete setup error:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to save shop details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-paper font-body text-ink flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[560px] rounded-3xl bg-card p-6 sm:p-10 shadow-card border border-line">
        
        {/* Header Branding & Welcome */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-orange-sm border border-line" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-heading font-black mb-2">
            <Store className="w-3.5 h-3.5" />
            First-Time Store Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink tracking-tight">
            Complete Shop Setup
          </h1>
          <p className="text-xs font-medium text-muted mt-1 font-body">
            Welcome, <span className="font-bold text-ink">{user?.name || "Merchant"}</span>! Finish setting up your store profile to start recording sales.
          </p>
        </div>

        {/* Verified Google Account Card */}
        <div className="mb-6 p-3.5 rounded-xl bg-card-hover border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center font-bold text-ink">
              <User className="w-5 h-5 text-muted" />
            </div>
            <div>
              <p className="text-xs font-heading font-black text-ink">{user?.name || "Verified User"}</p>
              <p className="text-[11px] font-medium text-muted font-body">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Google Verified
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[11px] font-heading font-black uppercase tracking-wider mb-2">
            <span className={currentStep === 1 ? "text-primary font-black" : "text-muted"}>
              1. Business Details
            </span>
            <span className={currentStep === 2 ? "text-primary font-black" : "text-muted"}>
              2. Currency & Setup
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-paper overflow-hidden flex gap-1 border border-line">
            <div
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? "bg-primary" : "bg-card-hover"
              }`}
            />
            <div
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? "bg-primary" : "bg-card-hover"
              }`}
            />
          </div>
        </div>

        {/* Form Steps */}
        <form onSubmit={currentStep === 1 ? handleNext : handleSubmit} className="font-body">
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Business Phone Number <span className="text-primary">*</span>
                </label>
                <div className="flex gap-2 font-body">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="788 123 456"
                      className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shop / Business Name */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Business / Shop Name <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Kigali Fresh Supermarket"
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Official Business Email <span className="text-muted font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="sales@myshop.rw"
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Location / District */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Business City / District <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nyarugenge, Kigali"
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Business Sector */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Business Category / Sector <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-muted pointer-events-none" />
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
                  >
                    {SECTORS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-xs md:text-sm font-heading font-black text-white shadow-orange-sm hover:bg-primary-hover transition active:scale-[0.99] cursor-pointer"
              >
                <span>Continue to Financial Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Primary Currency <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3.5 h-4 w-4 text-muted pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Team Size */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Team / Workers Size
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-muted pointer-events-none" />
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
                  >
                    <option value="1 (Just Me)">1 Person (Just Me)</option>
                    <option value="2-5 Employees">2 – 5 Employees</option>
                    <option value="6-15 Employees">6 – 15 Employees</option>
                    <option value="15+ Staff">15+ Staff & Branch Team</option>
                  </select>
                </div>
              </div>

              {/* EBM Invoicing Preference */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Do you issue EBM (Electronic Billing Machine) Invoices?
                </label>
                <div className="grid grid-cols-2 gap-3 font-heading">
                  <button
                    type="button"
                    onClick={() => setNeedEbm("Yes")}
                    className={`rounded-xl p-3 text-xs font-black border transition cursor-pointer ${
                      needEbm === "Yes"
                        ? "bg-primary text-white border-primary shadow-orange-sm"
                        : "bg-card text-muted border-line hover:bg-card-hover hover:text-ink"
                    }`}
                  >
                    Yes (EBM Enabled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedEbm("No")}
                    className={`rounded-xl p-3 text-xs font-black border transition cursor-pointer ${
                      needEbm === "No"
                        ? "bg-primary text-white border-primary shadow-orange-sm"
                        : "bg-card text-muted border-line hover:bg-card-hover hover:text-ink"
                    }`}
                  >
                    No (Standard Receipts)
                  </button>
                </div>
              </div>

              {/* Conditional RRA TIN Number Input */}
              {needEbm === "Yes" && (
                <div className="p-3.5 rounded-xl bg-card-hover border border-line space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-heading font-black text-ink">
                    RRA Tax Identification Number (TIN) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
                    <input
                      type="text"
                      required={needEbm === "Yes"}
                      placeholder="e.g. 102345678 (9-digit TIN)"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                    />
                  </div>
                  <p className="text-[10px] text-muted font-medium pl-1">
                    This TIN will automatically be printed on all your customer invoices & official EBM fiscal receipts.
                  </p>
                </div>
              )}

              {/* Referral Code */}
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1.5">
                  Referral / Partner Code <span className="text-muted font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. SACCO-KGL-2024"
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs md:text-sm font-semibold text-ink placeholder:text-muted outline-none focus:border-primary transition uppercase font-mono"
                  />
                </div>
              </div>

              {/* Step Buttons */}
              <div className="flex gap-2 pt-2 font-heading">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-card border border-line px-5 py-3.5 text-xs font-bold text-ink hover:bg-card-hover transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-xs md:text-sm font-black text-white shadow-orange-sm hover:bg-primary-hover transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Launch My Business Store</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-line flex items-center justify-between text-xs text-muted font-body">
          <span className="flex items-center gap-1 text-muted">
            <ShieldCheck className="w-4 h-4 text-primary" /> 256-Bit Encrypted & Compliant
          </span>
          <button
            type="button"
            onClick={logout}
            className="font-heading font-bold text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
