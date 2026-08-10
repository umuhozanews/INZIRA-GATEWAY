import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Globe, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { errorMessage } from "../lib/api";
import Logomark from "../components/Logomark";
import { Button, Field, TextInput, Segmented } from "../components/ui";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const { t, lang, toggle } = useLang();

  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [busy, setBusy] = useState(false);

  async function handleGoogleAuth() {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google successfully!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Google sign-in failed."));
    } finally {
      setBusy(false);
    }
  }

  // email flow
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // phone flow
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const fullPhone = () => {
    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    return `+250${digits}`;
  };

  async function handleEmail(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Invalid email or password."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendCode(e) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 9) {
      toast.error("Enter a valid phone number.");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(fullPhone());
      setCodeSent(true);
      toast.success("Code sent to your phone.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the code."));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (code.length < 4) return;
    setBusy(true);
    try {
      await verifyOtp(fullPhone(), code.trim());
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Invalid or expired code."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-primary p-0 md:p-6 lg:p-8">
      <div className="flex h-full md:h-auto w-full max-w-md md:max-w-4xl flex-col md:flex-row overflow-hidden md:rounded-3xl bg-primary md:bg-card md:shadow-2xl">
        {/* Left Branding Hero (Desktop/Tablet & Mobile header) */}
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

          <div className="my-8 md:my-12">
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold leading-tight">
              SME Management & Business Insights
            </h1>
            <p className="mt-2 text-xs md:text-sm text-white/80 leading-relaxed font-body">
              Track sales, manage inventory stock, monitor expenses, and check your credit health score in real-time.
            </p>
          </div>

          <div className="hidden md:block text-[11px] text-white/60">
            Powered by Inzira Insights &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="flex-1 flex flex-col justify-center rounded-t-[28px] md:rounded-none bg-card p-6 md:p-10 text-ink">
          <h2 className="font-heading text-xl md:text-2xl font-extrabold text-ink">{t("welcome")}</h2>
          <p className="mt-1 font-body text-xs md:text-sm leading-relaxed text-muted">{t("signin_sub")}</p>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-line bg-paper px-4 py-3 text-xs md:text-sm font-bold text-ink hover:bg-card hover:border-primary transition shadow-card active:scale-[0.98]"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t("google_signin")}</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-line" />
            <span className="absolute bg-card px-3 text-[11px] font-bold text-muted uppercase">or</span>
          </div>

          <div>
            <Segmented
              value={method}
              onChange={(m) => setMethod(m)}
              options={[
                { value: "email", label: t("tab_email") },
                { value: "phone", label: t("tab_phone") },
              ]}
            />
          </div>

          {method === "email" ? (
            <form onSubmit={handleEmail} className="mt-4 space-y-3">
              <Field label={t("email")}>
                <TextInput
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@business.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label={t("password")}>
                <div className="relative flex items-center">
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-muted hover:text-ink focus:outline-none p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              <Button full className="mt-6 py-3 font-bold" type="submit" disabled={busy}>
                {busy ? "…" : t("signin")} <ChevronRight size={16} />
              </Button>
            </form>
          ) : !codeSent ? (
            <form onSubmit={handleSendCode} className="mt-4 space-y-3">
              <Field label={t("phone")}>
                <div className="flex items-center rounded-xl border-[1.5px] border-line bg-paper px-3.5 py-3">
                  <span className="font-body text-sm font-semibold text-ink">🇷🇼 +250</span>
                  <div className="mx-3 h-4 w-px bg-line" />
                  <input
                    className="flex-1 bg-transparent font-body text-sm tabnum text-ink outline-none placeholder:text-muted"
                    inputMode="tel"
                    placeholder="78 812 3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </Field>
              <Button full className="mt-6 py-3 font-bold" type="submit" disabled={busy}>
                {busy ? "…" : t("send_code")} <ChevronRight size={16} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-4 space-y-3">
              <Field label={t("otp_code")}>
                <TextInput
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="text-center text-xl tracking-[0.4em] tabnum"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Button full variant="green" className="mt-6 py-3 font-bold" type="submit" disabled={busy}>
                {busy ? "…" : t("verify")}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                }}
                className="mt-3 w-full text-center font-body text-xs font-semibold text-primary hover:underline"
              >
                {t("phone")}: +250 {phone} ✎
              </button>
            </form>
          )}

          <div className="mt-6 text-center pt-2 border-t border-line">
            <p className="font-body text-xs font-semibold text-muted">
              {t("dont_have_account")}{" "}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                {t("signup")}
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center font-body text-[11px] text-muted">{t("privacy")}</p>
        </div>
      </div>
    </div>
  );
}
