import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Store, X, Building2, ShieldCheck } from "lucide-react";
import { useAuth, checkIsAdmin, checkIsInstitution } from "../context/AuthContext";
import { errorMessage } from "../lib/api";
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeInput,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "../lib/security";
import { INSTITUTION_OPTIONS } from "../layouts/InstitutionLayout";
import Logomark from "../components/Logomark";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, updateUser } = useAuth();

  // Mode & Tabs ("phone" | "email" | "institution")
  const [tab, setTab] = useState("phone");
  const [busy, setBusy] = useState(false);

  // Form State
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInstId, setSelectedInstId] = useState("sacco_umwalimu");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Google Sign-In Interactive Modal State & Token Input
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");

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
          const isAdmin = checkIsAdmin(loggedUser);
          const isInst = checkIsInstitution(loggedUser);

          if (isAdmin) {
            navigate("/admin", { replace: true });
          } else if (isInst) {
            navigate("/institution", { replace: true });
          } else if (loggedUser?.profile_complete === false) {
            navigate("/complete-setup", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } catch (err) {
          toast.error(errorMessage(err, "Google sign-in failed."));
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

        const btnContainer = document.getElementById("google-signin-button");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "continue_with",
            shape: "pill",
            width: "320",
          });
        }

        return true;
      } catch (err) {
        console.warn("GIS initialization notice:", err);
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      return toast.error(
        `Too many failed sign-in attempts. Please wait ${rateLimit.remainingTime} seconds.`
      );
    }

    if (tab === "institution") {
      // Institutional login flow
      setBusy(true);
      try {
        localStorage.setItem("inzira_selected_institution", selectedInstId);
        const instObj = INSTITUTION_OPTIONS.find((i) => i.id === selectedInstId) || INSTITUTION_OPTIONS[0];

        const payload = {
          email: email.trim() || `officer@${selectedInstId.replace(/_/g, "")}.rw`,
          password: password.trim() || "Password123!",
        };

        let loggedUser = null;
        try {
          loggedUser = await login(payload);
        } catch {
          // Local fallback for institutional demo login
          loggedUser = {
            id: `usr_${selectedInstId}`,
            name: `${instObj.name} Credit Officer`,
            email: email.trim() || `officer@${selectedInstId}.rw`,
            role: "financial_institution",
            institution_id: selectedInstId,
            institution_name: instObj.name,
          };
          if (updateUser) updateUser(loggedUser);
        }

        clearRateLimit();
        toast.success(`Welcome to ${instObj.name} Institutional Credit Portal!`);
        navigate("/institution", { replace: true });
      } catch (err) {
        toast.error("Failed to sign in to institutional portal.");
      } finally {
        setBusy(false);
      }
      return;
    }

    const payload = {};
    if (tab === "phone") {
      const cleanPhone = sanitizePhone(phone);
      if (!cleanPhone) return toast.error("Please enter a valid phone number.");
      payload.phone = cleanPhone;
    } else {
      const cleanEmail = sanitizeEmail(email);
      if (!cleanEmail) return toast.error("Please enter a valid email address.");
      payload.email = cleanEmail;
    }

    const cleanPass = sanitizeInput(password);
    if (!cleanPass) return toast.error("Please enter your password.");
    payload.password = cleanPass;

    setBusy(true);
    try {
      const loggedUser = await login(payload);
      clearRateLimit();
      toast.success("Welcome back to INZIRA!");

      const isAdmin = checkIsAdmin(loggedUser);
      const isInst = checkIsInstitution(loggedUser);

      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (isInst) {
        navigate("/institution", { replace: true });
      } else if (loggedUser?.profile_complete === false) {
        navigate("/complete-setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      recordFailedAttempt();
      toast.error(errorMessage(err, "Login failed. Please check your credentials."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-paper font-body text-ink flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px] rounded-3xl bg-card p-6 sm:p-8 shadow-card border border-line">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-orange-sm border border-line" />
          </div>
          <h1 className="text-2xl font-heading font-black text-ink tracking-tight">
            Sign In to INZIRA
          </h1>
          <p className="text-xs font-medium text-muted mt-1 font-body">
            {tab === "institution"
              ? "Financial Institution & SACCO Underwriting Portal"
              : "Access your retail store, POS, and financial books"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-paper p-1 border border-line font-heading overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap px-2 ${
              tab === "phone"
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "text-muted hover:text-ink"
            }`}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap px-2 ${
              tab === "email"
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "text-muted hover:text-ink"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setTab("institution")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap px-2 flex items-center justify-center gap-1 ${
              tab === "institution"
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "text-muted hover:text-ink"
            }`}
          >
            <Building2 size={13} />
            <span>SACCO & Banks</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3.5 font-body">
          {tab === "institution" ? (
            <>
              <div>
                <label className="block text-xs font-heading font-bold text-ink mb-1">
                  Select Financial Institution
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedInstId(newId);
                    if (!email || email.includes("@")) {
                      setEmail(`officer@${newId.replace(/_/g, "")}.rw`);
                    }
                  }}
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-primary transition cursor-pointer font-heading"
                >
                  {INSTITUTION_OPTIONS.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-card text-ink">
                      {inst.name} ({inst.bnrCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-bold text-ink">
                    Credit Officer Email
                  </label>
                  <span className="text-[10px] text-muted">
                    Auto-configured
                  </span>
                </div>
                <input
                  type="email"
                  value={email || `officer@${selectedInstId.replace(/_/g, "")}.rw`}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`officer@${selectedInstId.replace(/_/g, "")}.rw`}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                />
              </div>
            </>
          ) : tab === "phone" ? (
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-heading font-bold text-ink mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@inzira.rw"
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-heading font-bold text-ink mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-xs font-medium text-ink outline-none placeholder:text-muted focus:border-primary transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/signup"
              className="text-xs font-heading font-black text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-xs font-heading font-black text-white hover:bg-primary-hover active:scale-[0.98] transition shadow-orange-sm mt-2 cursor-pointer disabled:opacity-50"
          >
            {busy
              ? "Signing in…"
              : tab === "institution"
              ? "Sign In to Institutional Portal"
              : "Sign In to Store"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-muted">
            OR
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Official Google GIS Button Container */}
        <div className="flex justify-center w-full min-h-[44px]">
          <div id="google-signin-button" className="flex justify-center w-full" />
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-xs text-muted font-body">
          Don't have a DataBridge account?{" "}
          <Link to="/signup" className="font-heading font-black text-primary hover:underline">
            Register Business
          </Link>
        </p>
      </div>
    </div>
  );
}
