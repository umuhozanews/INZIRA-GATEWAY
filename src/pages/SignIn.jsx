import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Store, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeInput,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "../lib/security";

import Logomark from "../components/Logomark";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Mode & Tabs ("phone" | "email")
  const [tab, setTab] = useState("phone");
  const [busy, setBusy] = useState(false);

  // Form State
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Google Sign-In Interactive Modal State & Token Input
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");

  useEffect(() => {
    const GOOGLE_CLIENT_ID =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "566140797459-hat4bt1lcl09inbi3gql5ekp2ilh1aom.apps.googleusercontent.com";

    // Ensure Google Identity Services script is dynamically loaded if missing in production DOM
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

  const handleManualGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleCredential.trim()) {
      return toast.error("Please paste your Google ID credential token.");
    }
    setBusy(true);
    try {
      const loggedUser = await loginWithGoogle(googleCredential.trim());
      toast.success("Successfully signed in with Google!");
      setGoogleOpen(false);
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
      toast.error(errorMessage(err, "Invalid Google credential token."));
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      return toast.error(
        `Too many failed sign-in attempts. Please wait ${rateLimit.remainingTime} seconds.`
      );
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
      recordFailedAttempt();
      toast.error(errorMessage(err, "Login failed. Please check your credentials."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-paper font-body text-ink flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px] rounded-3xl bg-card p-6 sm:p-8 shadow-card border border-line">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Logomark size={56} className="shadow-orange-sm border border-line" />
          </div>
          <h1 className="text-2xl font-heading font-black text-ink tracking-tight">
            Sign In to DataBridge
          </h1>
          <p className="text-xs font-medium text-muted mt-1 font-body">
            Access your inventory, POS, and financial books
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-paper p-1 border border-line font-heading">
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              tab === "phone"
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "text-muted hover:text-ink"
            }`}
          >
            Phone Number
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              tab === "email"
                ? "bg-primary text-white shadow-orange-sm font-black"
                : "text-muted hover:text-ink"
            }`}
          >
            Email Address
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3.5 font-body">
          {tab === "phone" ? (
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
            {busy ? "Signing in…" : "Sign In to Store"}
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

        {/* Live Demo Store Fast Entry */}
        <div className="mt-4 pt-4 border-t border-line text-center font-heading">
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card-hover hover:border-primary/40 border border-line text-ink text-[11px] font-black transition shadow-sm"
          >
            <Store size={14} className="text-primary" />
            <span>Launch POS Sandbox Directly</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
