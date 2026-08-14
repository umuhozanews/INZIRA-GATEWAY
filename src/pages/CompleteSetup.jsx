import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Store,
  MapPin,
  Phone,
  DollarSign,
  Mail,
  Tag,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logomark from "../components/Logomark";

const RWANDA_DISTRICTS = [
  // Kigali City
  "Gasabo (Kigali)",
  "Kicukiro (Kigali)",
  "Nyarugenge (Kigali)",
  // Northern Province
  "Musanze (Northern)",
  "Gicumbi (Northern)",
  "Rulindo (Northern)",
  "Burera (Northern)",
  "Gakenke (Northern)",
  // Southern Province
  "Huye (Southern)",
  "Muhanga (Southern)",
  "Kamonyi (Southern)",
  "Ruhango (Southern)",
  "Nyanza (Southern)",
  "Gisagara (Southern)",
  "Nyamagabe (Southern)",
  "Nyaruguru (Southern)",
  // Eastern Province
  "Bugesera (Eastern)",
  "Rwamagana (Eastern)",
  "Kayonza (Eastern)",
  "Nyagatare (Eastern)",
  "Gatsibo (Eastern)",
  "Ngoma (Eastern)",
  "Kirehe (Eastern)",
  // Western Province
  "Rubavu (Western)",
  "Rusizi (Western)",
  "Karongi (Western)",
  "Rutsiro (Western)",
  "Nyamasheke (Western)",
  "Ngororero (Western)",
  "Nyabihu (Western)",
];

const CURRENCIES = [
  { code: "RWF", label: "RWF - Rwandan Franc" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "KES", label: "KES - Kenyan Shilling" },
  { code: "UGX", label: "UGX - Ugandan Shilling" },
  { code: "TZS", label: "TZS - Tanzanian Shilling" },
  { code: "EUR", label: "EUR - Euro" },
];

const SECTORS = [
  "Retail & General Merchandise",
  "Grocery & Supermarket",
  "Pharmacy & Health Supplies",
  "Electronics, Mobile & Tech",
  "Fashion, Apparel & Boutique",
  "Agriculture, Farming & Produce",
  "Restaurant, Bar & Hospitality",
  "Hardware & Construction",
  "Automotive & Spare Parts",
  "Beauty Salon, Spa & Cosmetics",
  "Professional & Advisory Services",
  "Other Business / Enterprise",
];

export default function CompleteSetup() {
  const navigate = useNavigate();
  const { user, completeSetup, logout } = useAuth();

  const [shopName, setShopName] = useState(user?.shop_name || "");
  const [district, setDistrict] = useState(user?.district || "Gasabo (Kigali)");
  const [currency, setCurrency] = useState(user?.currency || "RWF");
  const [phone, setPhone] = useState(user?.phone && user.phone !== "Google Auth" ? user.phone : "");
  const [businessEmail, setBusinessEmail] = useState(user?.email || "");
  const [sector, setSector] = useState(user?.sector || "Retail & General Merchandise");
  const [referralCode, setReferralCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanShop = shopName.trim();
    const cleanDist = district.trim();
    const cleanPh = phone.trim();

    if (!cleanShop) {
      toast.error("Please enter your Business / Shop Name.");
      return;
    }
    if (!cleanDist) {
      toast.error("Please select your District / Location.");
      return;
    }
    if (!cleanPh) {
      toast.error("Please enter your primary Business Phone Number.");
      return;
    }

    setBusy(true);
    try {
      await completeSetup({
        shop_name: cleanShop,
        district: cleanDist,
        currency,
        phone: cleanPh,
        business_email: businessEmail.trim(),
        sector,
        referral_code: referralCode.trim(),
      });

      toast.success("Shop profile configured successfully! Welcome to Inzira.");
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
      <div className="w-full max-w-[560px] rounded-[36px] bg-white p-7 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100/90">
        
        {/* Header Branding & Welcome */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={58} className="shadow-md border-2 border-white ring-2 ring-[#D4F06B]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4F06B]/20 text-[#2B3B08] text-xs font-extrabold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#5A7C0B]" />
            First-Time Store Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Complete Your Shop Setup
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-gray-500 max-w-md mx-auto">
            Welcome, <span className="font-bold text-gray-800">{user?.name || "Merchant"}</span>! Configure your business store profile to access your point-of-sale and financial dashboard.
          </p>
        </div>

        {/* Pre-filled Account Card */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 flex items-center justify-between">
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        </div>

        {/* Shop Setup Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Business Name (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Business / Shop Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Inzira Fresh Mart, Kigali Boutique"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none"
              />
            </div>
          </div>

          {/* District / Location (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              District / Location in Rwanda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none appearance-none cursor-pointer"
              >
                {RWANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency & Phone Number (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Primary Currency <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none appearance-none cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 123 456"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Business Sector (Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Primary Business Category
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none appearance-none cursor-pointer"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Secondary Business Email & Referral Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Business Email <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@myshop.rw"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="e.g. INZ-BANK-100"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-[#D4F06B]/50 transition-all outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#D4F06B] hover:bg-[#c3e255] text-gray-900 font-extrabold text-sm tracking-wide shadow-md shadow-[#D4F06B]/30 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Launch My Business Store</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Account / Logout fallback */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center flex items-center justify-between text-xs text-gray-500">
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
