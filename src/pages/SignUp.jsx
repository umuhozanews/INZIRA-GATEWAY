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
  FileText,
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
  const [needEbm, setNeedEbm] = useState("No");
  const [tinNumber, setTinNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Google Sign-Up Dynamic Script & Handler
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
            width: "340",
          });
        }
        return true;
      } catch (err) {
        console.warn("Google Sign-up init error:", err);
        return false;
      }
    };

    if (!initGIS()) {
      const interval = setInterval(() => {
        if (initGIS()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, navigate]);

  // Step 1 Validation
  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!shopName.trim()) {
      toast.error("Please enter your business or shop name.");
      return false;
    }
    if (!location.trim()) {
      toast.error("Please enter your business address or district.");
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (needEbm === "Yes" && !tinNumber.trim()) {
      toast.error("Please enter your 9-digit RRA TIN Number, or select 'No'.");
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
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setBusy(true);
    const fullPhone = `${countryCode} ${phone.trim()}`;

    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: fullPhone,
        shop_name: shopName.trim(),
        business_email: businessEmail.trim() || email.trim().toLowerCase(),
        location: location.trim(),
        district: location.trim(),
        sector: businessType,
        currency,
        team_size: teamSize,
        need_ebm: needEbm === "Yes",
        tin_number: needEbm === "Yes" ? tinNumber.trim() : null,
        referral_code: referralCode.trim() || null,
        profile_complete: true,
      };

      const loggedUser = await registerUser(payload);
      resetData();
      toast.success(`Welcome to INZIRA, ${fullName}! Your store is ready.`);

      const isAdmin =
        loggedUser?.role === "pulse_admin" ||
        loggedUser?.role === "admin" ||
        loggedUser?.email?.includes("creator");

      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(errorMessage(err, "Registration failed. Please try again."));
      if (
        err.message?.toLowerCase().includes("email") ||
        err.message?.toLowerCase().includes("phone")
      ) {
        setCurrentStep(1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-paper font-body text-ink flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[560px] rounded-3xl bg-card p-6 sm:p-10 shadow-card border border-line">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-orange-sm border border-line" />
          </div>
          <h1 className="text-2xl font-heading font-black text-ink tracking-tight">Create Business Account</h1>
          <p className="text-xs font-medium text-muted mt-1 font-body">
            Set up your shop in 3 simple steps and start tracking your sales.
          </p>
        </div>

        {/* Tab Switcher: Sign Up / Log In */}
        <div className="flex rounded-xl bg-paper p-1 border border-line mb-6 font-heading">
          <button
            type="button"
            className="flex-1 rounded-lg bg-primary py-2 text-xs font-black text-white shadow-orange-sm transition-all"
          >
            Sign Up
          </button>
          <Link
            to="/login"
            className="flex-1 rounded-lg py-2 text-center text-xs font-bold text-muted hover:text-ink transition-all"
          >
            Log In
          </Link>
        </div>

        {/* SCHEDULED STEP PROGRESS BAR */}
        <div className="mb-8 font-heading">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-2">
            <span className={currentStep === 1 ? "text-primary font-black" : "text-muted"}>
              1. Owner Profile
            </span>
            <span className={currentStep === 2 ? "text-primary font-black" : "text-muted"}>
              2. Business Details
            </span>
            <span className={currentStep === 3 ? "text-primary font-black" : "text-muted"}>
              3. Currency & Setup
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? "bg-primary" : "bg-paper border border-line"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? "bg-primary" : "bg-paper border border-line"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? "bg-primary" : "bg-paper border border-line"}`} />
          </div>
        </div>

        {/* ================= STEP 1: OWNER PROFILE & SECURITY ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4 font-body">
            
            {/* Google Quick Sign-Up */}
            <div className="mb-4 flex flex-col items-center">
              <div id="google-signup-button" className="w-full flex justify-center overflow-hidden rounded-xl min-h-[44px]"></div>
              <div className="relative my-3.5 w-full flex items-center justify-center">
                <div className="w-full border-t border-line" />
                <span className="absolute bg-card px-3 text-[11px] font-heading font-bold text-muted">
                  Or enter details manually
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Full Name (Owner / Manager)<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Jean Paul Ndayisaba"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Personal / Account Email<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="email"
                  placeholder="e.g. jeanpaul@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                  required
                />
              </div>
            </div>

            {/* Phone Number with Country Code */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Phone Number<span className="text-primary">*</span>
              </label>
              <div className="flex gap-2 font-body">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[125px] rounded-xl border border-line bg-paper px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 flex items-center">
                  <Phone size={15} className="absolute left-3.5 text-muted" />
                  <input
                    type="tel"
                    placeholder="788 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Account Password<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-11 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-muted hover:text-ink transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Step 1 Next Button */}
            <div className="pt-2 font-heading">
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-xs font-black text-white shadow-orange-sm hover:bg-primary-hover active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Business Details</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: BUSINESS INFORMATION ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4 font-body">
            
            {/* Business / Shop Name */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Business / Shop Name<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <Store size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Kigali Fresh Supermarket"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Business Contact Email <span className="text-muted font-normal">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="email"
                  placeholder="e.g. info@kigalifresh.rw (defaults to your email)"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Business Location / Address<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <MapPin size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Nyarugenge Market, Kigali, Rwanda"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                  required
                />
              </div>
            </div>

            {/* Business Type / Sector */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Business Sector / Category<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <Briefcase size={16} className="absolute left-3.5 text-muted pointer-events-none" />
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-8 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
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
            <div className="flex gap-3 pt-2 font-heading">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 rounded-xl border border-line bg-paper py-3 text-xs font-bold text-ink hover:bg-card-hover transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="flex-[2] rounded-xl bg-primary py-3 text-xs font-black text-white shadow-orange-sm hover:bg-primary-hover active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Financial Setup</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: FINANCIAL & LOCALIZATION SETUP ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 font-body">
            
            {/* Currency Dropdown */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Currency Used in Business<span className="text-primary">*</span>
              </label>
              <div className="relative flex items-center">
                <Coins size={16} className="absolute left-3.5 text-muted pointer-events-none" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-8 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] font-medium text-muted mt-1 pl-1 font-body">
                All daily sales, stock valuations, and financial books will be denominated in this currency.
              </p>
            </div>

            {/* Team Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1">
                  Team / Workers Size
                </label>
                <div className="relative flex items-center">
                  <Users size={16} className="absolute left-3.5 text-muted pointer-events-none" />
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
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
                <label className="block text-xs font-heading font-bold text-ink mb-1">
                  Need EBM Receipt?
                </label>
                <div className="relative flex items-center">
                  <ShieldCheck size={16} className="absolute left-3.5 text-muted pointer-events-none" />
                  <select
                    value={needEbm}
                    onChange={(e) => setNeedEbm(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer"
                  >
                    <option value="Yes">Yes (RRA EBM v2)</option>
                    <option value="No">No / Standard Receipts</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Conditional RRA TIN Number Input */}
            {needEbm === "Yes" && (
              <div className="p-3.5 rounded-xl bg-card-hover border border-line space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs font-heading font-black text-ink">
                  RRA Tax Identification Number (TIN) <span className="text-primary">*</span>
                </label>
                <div className="relative flex items-center">
                  <FileText size={16} className="absolute left-3.5 text-primary" />
                  <input
                    type="text"
                    required={needEbm === "Yes"}
                    placeholder="e.g. 102345678 (9-digit TIN)"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-2.5 text-xs font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition"
                  />
                </div>
                <p className="text-[10px] text-muted font-medium pl-1">
                  This TIN will automatically be printed on all your customer invoices & official EBM fiscal receipts.
                </p>
              </div>
            )}

            {/* Referral Code */}
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Referral Code or Source <span className="text-muted font-normal">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <Tag size={16} className="absolute left-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. INZIRA2026, Friend, Agent code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                />
              </div>
            </div>

            {/* Live Setup Confirmation Card */}
            <div className="rounded-xl bg-card-hover border border-line p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink font-heading font-black">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Shop Configuration Ready:</span>
              </div>
              <div className="text-muted text-[11px] leading-relaxed font-body">
                Your shop <strong className="text-ink">"{shopName || "My Business"}"</strong> will be initialized in <strong className="text-ink">{location}</strong> with <strong className="text-ink">{currency}</strong> currency and clean inventory tables.
              </div>
            </div>

            {/* Step 3 Actions (Back / Submit) */}
            <div className="flex gap-3 pt-2 font-heading">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 rounded-xl border border-line bg-paper py-3 text-xs font-bold text-ink hover:bg-card-hover transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={busy}
                className="flex-[2] rounded-xl bg-primary py-3.5 text-xs font-black text-white shadow-orange-sm hover:bg-primary-hover active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{busy ? "Setting Up Shop..." : "Create Account & Launch"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] font-medium text-muted border-t border-line pt-4 font-body">
          By registering, you agree to INZIRA's Terms of Service & Privacy Policy.
        </div>

      </div>
    </div>
  );
}
