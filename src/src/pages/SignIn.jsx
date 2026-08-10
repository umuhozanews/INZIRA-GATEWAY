import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Globe, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { errorMessage } from "../lib/api";
import Logomark from "../components/Logomark";
import { Button, Field, TextInput, Segmented } from "../components/ui";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyOtp } = useAuth();
  const { t, lang, toggle } = useLang();

  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // email flow
  const [email, setEmail] = useState("rukundojosephtuyishime@gmail.com");
  const [password, setPassword] = useState("rukundo2007");

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
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Login error. Please try again."));
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
      toast.success("Code sent to your phone (Demo Code: 123456)");
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
      toast.success("Phone verified!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Invalid or expired code."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col bg-primary">
      <div className="flex items-center justify-between px-5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>
        <div />
        <button
          onClick={toggle}
          className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white"
        >
          <Globe size={12} /> {lang.toUpperCase()} <ChevronDown size={12} />
        </button>
      </div>

      <div className="-mt-4 flex flex-1 flex-col items-center justify-center px-7">
        <Logomark size={54} />
        <span className="mt-3 font-heading text-[22px] font-extrabold text-white">DataBridge</span>
        <span className="mt-1 font-body text-[12.5px] text-white/75">by Inzira Insights</span>
      </div>

      <div className="rounded-t-[28px] bg-card px-6 pb-8 pt-7 shadow-2xl">
        <span className="font-heading text-[19px] font-bold text-ink">{t("welcome")}</span>
        <p className="mt-1.5 font-body text-[13px] leading-relaxed text-muted">{t("signin_sub")}</p>

        <div className="mt-4">
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
          <form onSubmit={handleEmail} className="mt-2">
            <Field label={t("email")}>
              <TextInput
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@business.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label={t("password")}>
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Button full className="mt-5" type="submit" disabled={busy}>
              {busy ? "Signing in..." : t("signin")} <ChevronRight size={16} />
            </Button>
          </form>
        ) : !codeSent ? (
          <form onSubmit={handleSendCode} className="mt-2">
            <Field label={t("phone")}>
              <div className="flex items-center rounded-xl border-[1.5px] border-line bg-paper px-3.5 py-3">
                <span className="font-body text-[14.5px] font-semibold text-ink">🇷🇼 +250</span>
                <div className="mx-3 h-4 w-px bg-line" />
                <input
                  className="flex-1 bg-transparent font-body text-[15px] tabnum text-ink outline-none placeholder:text-muted"
                  inputMode="tel"
                  placeholder="78 812 3456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Field>
            <Button full className="mt-5" type="submit" disabled={busy}>
              {busy ? "Sending..." : t("send_code")} <ChevronRight size={16} />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-2">
            <Field label={t("otp_code")}>
              <TextInput
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                className="text-center text-[20px] tracking-[0.4em] tabnum"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Button full variant="green" className="mt-5" type="submit" disabled={busy}>
              {busy ? "Verifying..." : t("verify")}
            </Button>
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
              }}
              className="mt-3 w-full text-center font-body text-[12px] font-semibold text-primary"
            >
              {t("phone")}: +250 {phone} ✎
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
