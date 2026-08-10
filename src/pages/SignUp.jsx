import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  Building2,
  DollarSign,
  Sparkles,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Receipt,
  Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import Logomark from "../components/Logomark";
import { Button, Field, TextInput, Segmented } from "../components/ui";

export default function SignUp() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { t, lang, toggle } = useLang();

  // Step 1: Account, 2: Business Info, 3: Currency & Finances, 4: Goals, 5: Launch
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  async function handleGoogleAuth() {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google! Let's set up your shop.");
      setStep(2);
    } catch (err) {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Step 1 State
  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Step 2 State
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("retail");
  const [location, setLocation] = useState("Kigali");

  // Step 3 State
  const [currency, setCurrency] = useState("RWF");
  const [initialCash, setInitialCash] = useState("50000");

  // Step 4 State
  const [goals, setGoals] = useState(["pos", "stock", "sacco"]);
  const [loadDemoData, setLoadDemoData] = useState(true);

  const categories = [
    { id: "retail", label: t("cat_retail"), icon: ShoppingBag, desc: "General shop, mini-market, kiosk" },
    { id: "wholesale", label: t("cat_wholesale"), icon: Building2, desc: "Bulk distributor & supplier" },
    { id: "electronics", label: t("cat_electronics"), icon: Smartphone, desc: "Mobile phones, laptops, repairs" },
    { id: "pharmacy", label: t("cat_pharmacy"), icon: ShieldCheck, desc: "Medicines & wellness products" },
    { id: "boutique", label: t("cat_boutique"), icon: Store, desc: "Clothes, shoes, cosmetics" },
    { id: "hardware", label: t("cat_hardware"), icon: Zap, desc: "Construction & quincaillerie" },
    { id: "services", label: t("cat_services"), icon: Sparkles, desc: "Barbershop, salon, consulting" },
    { id: "cafe", label: t("cat_cafe"), icon: Receipt, desc: "Food, bakery & refreshments" },
  ];

  const goalOptions = [
    { id: "pos", title: t("goal_pos"), icon: Receipt, tag: "Daily Sales" },
    { id: "stock", title: t("goal_stock"), icon: ShoppingBag, tag: "Inventory" },
    { id: "debts", title: t("goal_debts"), icon: TrendingUp, tag: "Invoices" },
    { id: "sacco", title: t("goal_sacco"), icon: ShieldCheck, tag: "SACCO Credit" },
  ];

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (method === "email" && (!email.trim() || !password)) {
      toast.error("Please provide email and password.");
      return;
    }
    if (method === "phone" && phone.replace(/\D/g, "").length < 9) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms & Privacy Policy.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("Please enter your shop or business name.");
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const handleNextStep4 = (e) => {
    e.preventDefault();
    setStep(5);
  };

  const handleFinishSetup = async () => {
    setBusy(true);
    try {
      const onboardingData = {
        ownerName: fullName.trim(),
        shopName: shopName.trim(),
        category,
        location,
        currency,
        initialCash: parseFloat(initialCash) || 0,
        goals,
        loadDemoData,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("db_onboarding_profile", JSON.stringify(onboardingData));
      localStorage.setItem("db_shop_name", shopName.trim());
      localStorage.setItem("db_currency", currency);

      const dummyUser = {
        id: "usr_" + Date.now(),
        name: fullName.trim(),
        email: email.trim() || `${phone}@business.rw`,
        shopName: shopName.trim(),
        category
      };
      localStorage.setItem("db_user", JSON.stringify(dummyUser));
      localStorage.setItem("db_token", "demo_jwt_token_" + Date.now());

      toast.success("Murakaza neza! Your shop is ready.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error("Account setup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-primary p-0 md:p-6 lg:p-8">
      <div className="flex h-full md:h-auto w-full max-w-md md:max-w-4xl flex-col md:flex-row overflow-hidden md:rounded-3xl bg-primary md:bg-card md:shadow-pop">
        
        {/* Left Branding & Progress Hero Panel */}
        <div className="flex flex-col justify-between p-6 md:p-10 bg-primary md:w-1/2 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logomark size={36} />
              <span className="font-heading text-xl font-extrabold tracking-tight">DataBridge</span>
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/25 transition"
            >
              <Globe size={13} /> {lang.toUpperCase()} <ChevronDown size={12} />
            </button>
          </div>

          <div className="my-6 md:my-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-accent mb-3">
              <Sparkles size={13} /> {t("setup_title")} • Step {step} of 5
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold leading-tight">
              {step === 1 && t("signup_title")}
              {step === 2 && t("question_shop_name")}
              {step === 3 && t("question_currency")}
              {step === 4 && t("question_goals")}
              {step === 5 && t("setup_complete_title")}
            </h1>
            <p className="mt-2 text-xs md:text-sm text-white/80 leading-relaxed font-body">
              {step === 1 && t("signup_sub")}
              {step === 2 && "Enter your shop name and select your primary business category."}
              {step === 3 && "Set up your operational currency and opening cash till balance."}
              {step === 4 && "Select the main tools you want to highlight on your dashboard."}
              {step === 5 && t("setup_complete_sub")}
            </p>

            {/* Visual Step Dots */}
            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-accent"
                      : s < step
                      ? "w-2 bg-white"
                      : "w-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quick Onboarding Summary List */}
          <div className="hidden md:block space-y-2 text-xs text-white/80 bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="font-heading font-bold text-accent text-[11px] uppercase tracking-wider">
              Shop Configuration Summary
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span>Owner:</span>
              <span className="font-semibold text-white">{fullName || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span>Shop Name:</span>
              <span className="font-semibold text-white">{shopName || "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Currency & Cash:</span>
              <span className="font-semibold text-white">
                {currency} {parseFloat(initialCash || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="hidden md:block text-[11px] text-white/60 mt-4">
            Powered by Inzira Insights &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right Form Card */}
        <div className="flex-1 flex flex-col justify-center rounded-t-[28px] md:rounded-none bg-card p-6 md:p-10 text-ink">
          
          {/* STEP 1: Account Creation */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div>
                <h2 className="font-heading text-xl md:text-2xl font-extrabold text-ink">{t("signup")}</h2>
                <p className="mt-1 font-body text-xs md:text-sm text-muted leading-relaxed">{t("signup_sub")}</p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-line bg-paper px-4 py-3 text-xs md:text-sm font-bold text-ink hover:bg-card hover:border-primary transition shadow-card active:scale-[0.98]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{t("google_signin")}</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-line" />
                <span className="absolute bg-card px-3 text-[11px] font-bold text-muted uppercase">or</span>
              </div>

              <Field label={t("full_name")}>
                <TextInput
                  type="text"
                  placeholder="Jean-Claude Habimana"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>

              <Segmented
                value={method}
                onChange={(m) => setMethod(m)}
                options={[
                  { value: "email", label: t("tab_email") },
                  { value: "phone", label: t("tab_phone") },
                ]}
              />

              {method === "email" ? (
                <>
                  <Field label={t("email")}>
                    <TextInput
                      type="email"
                      placeholder="owner@mybusiness.rw"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t("password")}>
                    <div className="relative flex items-center">
                      <TextInput
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-muted hover:text-ink p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>
                </>
              ) : (
                <Field label={t("phone")}>
                  <div className="flex items-center rounded-xl border-[1.5px] border-line bg-paper px-3.5 py-3">
                    <span className="font-body text-sm font-semibold text-ink">🇷🇼 +250</span>
                    <div className="mx-3 h-4 w-px bg-line" />
                    <input
                      className="flex-1 bg-transparent font-body text-sm text-ink outline-none placeholder:text-muted"
                      inputMode="tel"
                      placeholder="78 812 3456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </Field>
              )}

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
                <span className="font-body text-xs text-muted">
                  {t("agree_terms")}
                </span>
              </label>

              <Button full variant="green" className="mt-6 py-3.5 font-bold" type="submit">
                Continue to Business Setup <ChevronRight size={16} />
              </Button>

              <div className="mt-4 text-center pt-3 border-t border-line">
                <p className="font-body text-xs font-semibold text-muted">
                  {t("already_have_account")}{" "}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    {t("signin")}
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Shop Profile */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Step 2 of 5</span>
                <h2 className="font-heading text-xl font-extrabold text-ink mt-0.5">{t("question_shop_name")}</h2>
              </div>

              <Field label={t("shop_name")}>
                <TextInput
                  type="text"
                  placeholder="e.g. Kigali Fresh Market & Wholesale"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t("question_category")}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-start gap-2.5 rounded-xl p-2.5 text-left border-[1.5px] transition-all ${
                          selected
                            ? "border-primary bg-primary-xlt text-ink ring-1 ring-primary"
                            : "border-line bg-paper text-ink hover:border-muted"
                        }`}
                      >
                        <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${selected ? "bg-primary text-white" : "bg-card text-muted"}`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="font-heading text-xs font-bold leading-snug">{cat.label}</div>
                          <div className="font-body text-[10px] text-muted mt-0.5 leading-tight">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label={t("shop_address")}>
                <TextInput
                  type="text"
                  placeholder="e.g. Nyarugenge, Kigali City"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Field>

              <div className="flex gap-2.5 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="px-4">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button full variant="green" type="submit" className="py-3.5 font-bold">
                  Next: Currency <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Currency & Finances */}
          {step === 3 && (
            <form onSubmit={handleNextStep3} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Step 3 of 5</span>
                <h2 className="font-heading text-xl font-extrabold text-ink mt-0.5">{t("question_currency")}</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-2">Primary Currency</label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { code: "RWF", symbol: "RWF" },
                    { code: "USD", symbol: "$" },
                    { code: "KES", symbol: "KSh" },
                    { code: "UGX", symbol: "USh" },
                  ].map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`flex flex-col items-center justify-center rounded-xl border-[1.5px] p-3 transition-all ${
                        currency === c.code
                          ? "border-primary bg-primary-xlt text-primary ring-1 ring-primary"
                          : "border-line bg-paper text-ink hover:border-muted"
                      }`}
                    >
                      <span className="font-heading text-base font-extrabold">{c.symbol}</span>
                      <span className="font-body text-[11px] font-semibold mt-0.5">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label={`${t("question_initial_cash")} (${currency})`}>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-heading text-xs font-bold text-primary">
                    {currency}
                  </span>
                  <TextInput
                    type="number"
                    placeholder="50000"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="pl-14 tabnum font-semibold"
                  />
                </div>
              </Field>

              <div className="rounded-xl border border-line bg-paper p-3.5 flex gap-3 items-center">
                <div className="rounded-lg bg-primary-xlt p-2 text-primary shrink-0">
                  <DollarSign size={18} />
                </div>
                <p className="font-body text-xs text-muted leading-relaxed">
                  This cash amount is set as your starting Till Balance for daily POS transactions.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="px-4">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button full variant="green" type="submit" className="py-3.5 font-bold">
                  Next: Goals <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4: Goals & Preferences */}
          {step === 4 && (
            <form onSubmit={handleNextStep4} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Step 4 of 5</span>
                <h2 className="font-heading text-xl font-extrabold text-ink mt-0.5">{t("question_goals")}</h2>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {goalOptions.map((g) => {
                  const Icon = g.icon;
                  const isSelected = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`flex w-full items-center justify-between rounded-xl border-[1.5px] p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary-xlt text-ink ring-1 ring-primary"
                          : "border-line bg-paper text-ink hover:border-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${isSelected ? "bg-primary text-white" : "bg-card text-muted"}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span className="inline-block rounded bg-card px-1.5 py-0.5 text-[9.5px] font-bold text-muted border border-line mb-0.5">
                            {g.tag}
                          </span>
                          <div className="font-heading text-xs font-bold leading-tight">{g.title}</div>
                        </div>
                      </div>

                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${isSelected ? "border-primary bg-primary text-white" : "border-line bg-card"}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t("question_sample_data")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoadDemoData(true)}
                    className={`rounded-xl border-[1.5px] p-3 text-center text-xs font-bold transition ${
                      loadDemoData
                        ? "border-primary bg-primary-xlt text-primary"
                        : "border-line bg-paper text-muted"
                    }`}
                  >
                    {t("sample_yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoadDemoData(false)}
                    className={`rounded-xl border-[1.5px] p-3 text-center text-xs font-bold transition ${
                      !loadDemoData
                        ? "border-primary bg-primary-xlt text-primary"
                        : "border-line bg-paper text-muted"
                    }`}
                  >
                    {t("sample_no")}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(3)} className="px-4">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button full variant="green" type="submit" className="py-3.5 font-bold">
                  Review & Launch <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 5: Kayko Badge & Launch */}
          {step === 5 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-lt text-success border border-success/30">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h2 className="font-heading text-xl md:text-2xl font-extrabold text-ink">
                  {t("setup_complete_title")}
                </h2>
                <p className="mt-1 font-body text-xs text-muted leading-relaxed">
                  {t("setup_complete_sub")}
                </p>
              </div>

              {/* DataBridge Shop Badge Summary Card */}
              <div className="rounded-2xl border border-line bg-paper p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary-xlt p-2 text-primary">
                      <Store size={18} />
                    </div>
                    <div>
                      <div className="font-heading text-sm font-extrabold text-ink">{shopName || "My SME Shop"}</div>
                      <div className="font-body text-[11px] text-muted">{fullName} • {location}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-xlt px-2.5 py-0.5 text-[10px] font-extrabold text-primary border border-primary/20">
                    Active SME
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-card p-2.5 border border-line">
                    <div className="text-[10px] font-bold text-muted uppercase">Starting Cash</div>
                    <div className="font-heading text-xs font-black text-primary mt-0.5 tabnum">
                      {currency} {parseFloat(initialCash || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl bg-card p-2.5 border border-line">
                    <div className="text-[10px] font-bold text-muted uppercase">Category</div>
                    <div className="font-heading text-xs font-bold text-ink mt-0.5 capitalize">
                      {category}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  full
                  variant="primary"
                  onClick={handleFinishSetup}
                  disabled={busy}
                  className="py-4 font-extrabold text-sm"
                >
                  {busy ? "Setting up shop…" : t("launch_btn")}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="font-body text-xs font-semibold text-muted hover:text-ink"
                >
                  ← Edit preferences
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
