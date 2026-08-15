import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Store,
  MapPin,
  Phone,
  Coins,
  Mail,
  Tag,
  Briefcase,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logomark from "../components/Logomark";

// Supported Currencies for East Africa & Global Trade (Identical to SignUp.jsx)
const CURRENCIES = [
  { code: "RWF", label: "RWF — Rwandan Franc (Frw)", symbol: "FRW" },
  { code: "USD", label: "USD — US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "EUR — Euro (€)", symbol: "€" },
  { code: "KES", label: "KES — Kenyan Shilling (KSh)", symbol: "KSh" },
  { code: "UGX", label: "UGX — Ugandan Shilling (USh)", symbol: "USh" },
  { code: "TZS", label: "TZS — Tanzanian Shilling (TSh)", symbol: "TSh" },
  { code: "GBP", label: "GBP — British Pound (£)", symbol: "£" },
  { code: "CAD", label: "CAD — Canadian Dollar ($)", symbol: "CA$" },
  { code: "CNY", label: "CNY — Chinese Yuan (¥)", symbol: "¥" },
  { code: "CDF", label: "CDF — Congolese Franc (FC)", symbol: "FC" },
  { code: "BIF", label: "BIF — Burundian Franc (FBu)", symbol: "FBu" },
  { code: "ZAR", label: "ZAR — South African Rand (R)", symbol: "R" },
  { code: "NGN", label: "NGN — Nigerian Naira (₦)", symbol: "₦" },
  { code: "GHS", label: "GHS — Ghanaian Cedi (GH₵)", symbol: "GH₵" },
];

const SECTORS = [
  "Retail & Supermarket",
  "Pharmacy & Healthcare",
  "Boutique & Clothing",
  "Electronics & Tech",
  "Restaurant & Cafe",
  "Hardware & Construction",
  "Agro-Dealer & Farming",
  "Cosmetics & Salon",
  "Wholesale & Distribution",
  "Professional Services",
  "Other Business",
];

const COUNTRY_CODES = [
  { code: "+250", label: "🇷🇼 Rwanda (+250)" },
  { code: "+254", label: "🇰🇪 Kenya (+254)" },
  { code: "+256", label: "🇺🇬 Uganda (+256)" },
  { code: "+255", label: "🇹🇿 Tanzania (+255)" },
  { code: "+257", label: "🇧🇮 Burundi (+257)" },
  { code: "+243", label: "🇨🇩 DR Congo (+243)" },
  { code: "+1", label: "🇺🇸 USA/Canada (+1)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+86", label: "🇨🇳 China (+86)" },
  { code: "+27", label: "🇿🇦 South Africa (+27)" },
  { code: "+234", label: "🇳🇬 Nigeria (+234)" },
];

export default function CompleteSetup() {
  const navigate = useNavigate();
  const { user, completeSetup, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1: Business Details, 2: Financial Setup & Preferences
  const [busy, setBusy] = useState(false);

  // Step 1: Owner Verified Info & Business Profile
  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState(
    user?.phone && user.phone !== "Google Auth" ? user.phone.replace(/^\+\d+\s*/, "") : ""
  );
  const [shopName, setShopName] = useState(user?.shop_name || "");
  const [businessEmail, setBusinessEmail] = useState(user?.email || "");
  const [location, setLocation] = useState(user?.district || "Kigali, Rwanda");
  const [businessType, setBusinessType] = useState(user?.sector || "Retail & Supermarket");

  // Step 2: Financial Setup & Preferences (Identical to Manual Signup Step 3)
  const [currency, setCurrency] = useState(user?.currency || "RWF");
  const [teamSize, setTeamSize] = useState("1 (Just Me)");
  const [needEbm, setNeedEbm] = useState("Yes");
  const [referralCode, setReferralCode] = useState("");

  const validateStep1 = () => {
    if (!phone.trim()) {
      toast.error("Please enter your business phone number.");
      return false;
    }
    if (!shopName.trim()) {
      toast.error("Please enter your business or shop name.");
      return false;
    }
    if (!location.trim()) {
      toast.error("Please specify your business location or city.");
      return false;
    }
    if (!businessType) {
      toast.error("Please select your business type.");
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setBusy(true);
    try {
      const formattedPhone = `${countryCode} ${phone.replace(/^0+/, "")}`.trim();

      await completeSetup({
        shop_name: shopName.trim(),
        district: location.trim(),
        currency,
        phone: formattedPhone,
        business_email: (businessEmail || user?.email || "").trim(),
        sector: businessType,
        referral_code: referralCode.trim() || "GOOGLE_ONBOARDING",
        teamSize,
        needEbm,
      });

      toast.success(`🎉 Welcome to INZIRA! "${shopName}" is ready.`);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Complete setup error:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to save shop details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[560px] rounded-[36px] bg-white p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100">
        
        {/* Header Branding & Welcome */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-md border-2 border-white ring-2 ring-[#D4F06B]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4F06B]/20 text-[#2B3B08] text-xs font-extrabold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#5A7C0B]" />
            First-Time Store Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Complete Shop Setup
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Welcome, <span className="font-bold text-gray-800">{user?.name || "Merchant"}</span>! Finish setting up your store questions to start recording sales.
          </p>
        </div>

        {/* Verified Google Account Card */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center font-bold text-gray-700">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-gray-900">{user?.name || "Verified User"}</p>
              <p className="text-[11px] font-medium text-gray-500">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Google Verified
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span className={currentStep === 1 ? "text-gray-900 font-black" : "text-gray-400"}>
              1. Business Details
            </span>
            <span className={currentStep === 2 ? "text-gray-900 font-black" : "text-gray-400"}>
              2. Currency & Setup
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden flex gap-1">
            <div
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? "bg-[#D4F06B]" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? "bg-[#D4F06B]" : "bg-gray-200"
              }`}
            />
          </div>
        </div>

        {/* Form Steps */}
        <form onSubmit={currentStep === 1 ? handleNext : handleSubmit}>
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Business Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-3 text-xs font-extrabold text-gray-800 outline-none focus:border-gray-900 focus:bg-white transition"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="788 123 456"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shop / Business Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Business / Shop Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Kigali Fresh Supermarket"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Official Business Email <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="sales@myshop.rw"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Location / District */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Business City / District <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nyarugenge, Kigali"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Business Sector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Business Category / Sector <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-extrabold text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition cursor-pointer"
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
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#D4F06B] py-3.5 px-4 text-xs md:text-sm font-extrabold text-gray-900 shadow-sm hover:bg-[#C5E456] transition active:scale-[0.99] cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Primary Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-extrabold text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Team / Workers Size
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-extrabold text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Do you issue EBM (Electronic Billing Machine) Invoices?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNeedEbm("Yes")}
                    className={`rounded-2xl p-3 text-xs font-black border transition ${
                      needEbm === "Yes"
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-gray-50/50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Yes (EBM Enabled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedEbm("No")}
                    className={`rounded-2xl p-3 text-xs font-black border transition ${
                      needEbm === "No"
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-gray-50/50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    No (Standard Receipts)
                  </button>
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Referral / Partner Code <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. SACCO-KGL-2024"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-xs md:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:bg-white transition uppercase"
                  />
                </div>
              </div>

              {/* Step Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 px-5 py-3.5 text-xs font-extrabold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#D4F06B] py-3.5 px-4 text-xs md:text-sm font-extrabold text-gray-900 shadow-sm hover:bg-[#C5E456] transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Launch My Business Store</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-Bit Encrypted & Compliant
          </span>
          <button
            type="button"
            onClick={logout}
            className="font-bold text-gray-700 hover:text-red-600 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
