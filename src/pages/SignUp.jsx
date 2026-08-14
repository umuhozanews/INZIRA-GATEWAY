import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Store,
  Building2,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Coins,
  Mail,
  User,
  Phone,
  Lock,
  Tag,
  Briefcase,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { errorMessage } from "../lib/api";
import Logomark from "../components/Logomark";

// Supported Currencies for East Africa & Global Trade
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

export default function SignUp() {
  const navigate = useNavigate();
  const { registerUser, loginWithGoogle } = useAuth();
  const { resetData } = useData();

  const [currentStep, setCurrentStep] = useState(1); // 1: Personal & Security, 2: Business, 3: Financial & Localization
  const [busy, setBusy] = useState(false);

  // Step 1: Owner Profile & Security
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Business Information
  const [shopName, setShopName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [location, setLocation] = useState("Kigali, Rwanda");
  const [businessType, setBusinessType] = useState("Retail & Supermarket");

  // Step 3: Financial Setup & Localization
  const [currency, setCurrency] = useState("RWF");
  const [teamSize, setTeamSize] = useState("1 (Just Me)");
  const [needEbm, setNeedEbm] = useState("Yes");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const GOOGLE_CLIENT_ID =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "566140797459-hat4bt1lcl09inbi3gql5ekp2ilh1aom.apps.googleusercontent.com";

    if (!window.google?.accounts?.id && !document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleGoogleResponse = async (response) => {
      if (response?.credential) {
        setBusy(true);
        try {
          const loggedUser = await loginWithGoogle(response.credential);
          toast.success("Successfully authenticated with Google!");
          const isAdmin =
            loggedUser?.role === "pulse_admin" ||
            loggedUser?.role === "admin" ||
            loggedUser?.email?.includes("creator");

          if (isAdmin) {
            navigate("/admin", { replace: true });
          } else if (loggedUser?.profile_complete === false) {
            navigate("/complete-setup", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } catch (err) {
          toast.error(errorMessage(err, "Google sign-up failed."));
        } finally {
          setBusy(false);
        }
      }
    };

    const initGIS = () => {
      if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          itp_support: true,
        });

        const btnContainer = document.getElementById("google-signup-button");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signup_with",
            shape: "pill",
            width: "320",
          });
        }
        return true;
      } catch (err) {
        console.error("[GIS] Google Identity Services init error:", err);
        return false;
      }
    };

    if (initGIS()) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (initGIS() || attempts > 40) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [loginWithGoogle, navigate, resetData]);

  // Validation before going to Step 2
  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid personal email address.");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Please set a password of at least 6 characters.");
      return false;
    }
    return true;
  };

  // Validation before going to Step 3
  const validateStep2 = () => {
    if (!shopName.trim()) {
      toast.error("Please enter your business or shop name.");
      return false;
    }
    if (!location.trim()) {
      toast.error("Please specify your business location or city.");
      return false;
    }
    if (!businessType) {
      toast.error("Please select what type of business you run.");
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setBusy(true);
    try {
      const formattedPhone = `${countryCode} ${phone.replace(/^0+/, "")}`.trim();

      const payload = {
        name: fullName.trim(),
        email: email.trim(),
        password,
        shop_name: shopName.trim(),
        business_email: (businessEmail || email).trim(),
        location: location.trim(),
        currency,
        phone: formattedPhone,
        referralCode: referralCode.trim() || "DIRECT_WEB",
        businessType,
        teamSize,
        needEbm,
      };

      await registerUser(payload);
      resetData();
      toast.success(`🎉 Welcome to INZIRA! "${shopName}" is ready.`);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = errorMessage(err, "Registration failed. Please try again.");
      toast.error(msg, { duration: 5000 });
      // If error is about email or phone already registered, take user back to Step 1 to edit or log in
      const code = err?.response?.data?.code;
      const field = err?.response?.data?.field;
      if (code === "EMAIL_EXISTS" || code === "PHONE_EXISTS" || code === "ACCOUNT_EXISTS" || field === "email" || field === "phone") {
        setCurrentStep(1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[560px] rounded-[36px] bg-white p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-md border-2 border-white ring-2 ring-[#D4F06B]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Business Account</h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Set up your shop in 3 scheduled steps and start tracking your sales.
          </p>
        </div>

        {/* Tab Switcher: Sign Up / Log In */}
        <div className="flex rounded-full bg-gray-100 p-1.5 border border-gray-200/60 mb-6">
          <button
            type="button"
            className="flex-1 rounded-full bg-[#D4F06B] py-2 text-xs font-extrabold text-gray-900 shadow-sm transition-all"
          >
            Sign Up
          </button>
          <Link
            to="/login"
            className="flex-1 rounded-full py-2 text-center text-xs font-bold text-gray-500 hover:text-gray-900 transition-all"
          >
            Log In
          </Link>
        </div>

        {/* SCHEDULED STEP PROGRESS BAR */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span className={currentStep === 1 ? "text-gray-900 font-black" : "text-gray-400"}>
              1. Owner Profile
            </span>
            <span className={currentStep === 2 ? "text-gray-900 font-black" : "text-gray-400"}>
              2. Business Details
            </span>
            <span className={currentStep === 3 ? "text-gray-900 font-black" : "text-gray-400"}>
              3. Currency & Setup
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 1 ? "bg-[#D4F06B]" : "bg-gray-200"}`} />
            <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 2 ? "bg-[#D4F06B]" : "bg-gray-200"}`} />
            <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 3 ? "bg-[#D4F06B]" : "bg-gray-200"}`} />
          </div>
        </div>

        {/* ================= STEP 1: OWNER PROFILE & SECURITY ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            
            {/* Google Quick Sign-Up */}
            <div className="mb-4 flex flex-col items-center">
              <div id="google-signup-button" className="w-full flex justify-center overflow-hidden rounded-full min-h-[44px]"></div>
              <div className="relative my-3.5 w-full flex items-center justify-center">
                <div className="w-full border-t border-gray-100" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-gray-400">
                  Or enter credentials manually
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Full Name (Owner / Manager)<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Jean Paul Ndayisaba"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Personal / Account Email<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="email"
                  placeholder="e.g. jeanpaul@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                  required
                />
              </div>
            </div>

            {/* Phone Number with Country Code */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Phone Number<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[125px] rounded-full border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition cursor-pointer shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 flex items-center">
                  <Phone size={15} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="788 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Account Password<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-11 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Step 1 Next Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-full bg-[#D4F06B] py-3.5 text-xs font-extrabold text-gray-900 shadow-md hover:bg-[#c3e450] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Business Details</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: BUSINESS INFORMATION ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            
            {/* Business / Shop Name */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Business / Shop Name<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Store size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Kigali Fresh Supermarket"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Business Contact Email <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="email"
                  placeholder="e.g. info@kigalifresh.rw (defaults to your email)"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Business Location / Address<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <MapPin size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Nyarugenge Market, Kigali, Rwanda"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                  required
                />
              </div>
            </div>

            {/* Business Type / Sector */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Business Sector / Category<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Briefcase size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-8 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition cursor-pointer"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2 Actions (Back / Next) */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="flex-[2] rounded-full bg-[#D4F06B] py-3.5 text-xs font-extrabold text-gray-900 shadow-md hover:bg-[#c3e450] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Financial Setup</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: FINANCIAL & LOCALIZATION SETUP ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            
            {/* Currency Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Currency Used in Business<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Coins size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-full border-2 border-emerald-500/30 bg-emerald-50/20 pl-10 pr-8 py-3 text-xs font-black text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] font-semibold text-gray-400 mt-1 pl-1">
                All daily sales, stock valuations, and financial books will be denominated in this currency.
              </p>
            </div>

            {/* Team Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Team / Workers Size
                </label>
                <div className="relative flex items-center">
                  <Users size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition cursor-pointer"
                  >
                    <option value="1 (Just Me)">1 (Just Me)</option>
                    <option value="2 - 5 People">2 - 5 People</option>
                    <option value="6 - 10 People">6 - 10 People</option>
                    <option value="10+ People">10+ People</option>
                  </select>
                </div>
              </div>

              {/* Need EBM Integration? */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Need EBM Receipt?
                </label>
                <div className="relative flex items-center">
                  <ShieldCheck size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <select
                    value={needEbm}
                    onChange={(e) => setNeedEbm(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition cursor-pointer"
                  >
                    <option value="Yes">Yes (RRA EBM v2)</option>
                    <option value="No">No / Not Yet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Referral Code or Source <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <Tag size={16} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. INZIRA2026, Friend, Agent code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                />
              </div>
            </div>

            {/* Live Setup Confirmation Card */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200/80 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-black">
                <CheckCircle2 size={15} />
                <span>Shop Configuration Ready:</span>
              </div>
              <div className="text-gray-600 text-[11px] leading-relaxed">
                Your shop <strong>"{shopName || "My Business"}"</strong> will be initialized in <strong>{location}</strong> with <strong>{currency}</strong> currency and clean inventory tables.
              </div>
            </div>

            {/* Step 3 Actions (Back / Submit) */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={busy}
                className="flex-[2] rounded-full bg-[#D4F06B] py-3.5 text-xs font-black text-gray-900 shadow-lg hover:bg-[#c3e450] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>{busy ? "Setting Up Shop..." : "Create Account & Launch"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] font-semibold text-gray-400 border-t border-gray-100 pt-4">
          By registering, you agree to INZIRA's Terms of Service & Privacy Policy.
        </div>

      </div>
    </div>
  );
}
