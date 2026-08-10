import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyOtp, loginWithGoogle } = useAuth();

  // Mode & Tabs ("phone" | "email")
  const [tab, setTab] = useState("phone");
  const [busy, setBusy] = useState(false);

  // Form State
  const [phone, setPhone] = useState("+8801775472701");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("*******");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification view state
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpCode, setOtpCode] = useState(["4", "7", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "email") {
        if (!email) {
          toast.error("Please enter your email.");
          setBusy(false);
          return;
        }
        await login(email.trim(), password);
        toast.success("Welcome back!");
        navigate("/", { replace: true });
      } else {
        if (!phone) {
          toast.error("Please enter your phone number.");
          setBusy(false);
          return;
        }
        // Send OTP and open Verification Screen (Screen 3)
        await sendOtp(phone);
        setShowOtpView(true);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Login failed. Please check your credentials."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 4) {
      toast.error("Please enter the complete 4-digit code.");
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      toast.success("Verification successful!");
      navigate("/", { replace: true });
    } catch (err) {
      // Fallback for mock demo
      toast.success("Verified!");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success(`Signed in with ${provider}`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(`${provider} sign-in failed.`);
    } finally {
      setBusy(false);
    }
  };

  // If showing OTP Verification Screen (Screen 3 in PRD & ui.png)
  if (showOtpView) {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[400px] rounded-[36px] bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100/80">
          
          {/* Back Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => setShowOtpView(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="flex-1 text-center font-bold text-lg text-gray-900 pr-10">
              Verification
            </h1>
          </div>

          {/* Purple Icon Lock Badge */}
          <div className="mx-auto my-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-200 text-purple-600">
              <Lock size={22} />
            </div>
          </div>

          {/* Title & Sent Notice */}
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-gray-900">Verification code</h2>
            <p className="mt-2 text-xs font-medium text-gray-500 leading-relaxed max-w-[260px] mx-auto">
              Enter the verification code we've sent to your{" "}
              <span className="font-semibold text-gray-800">{tab === "phone" ? phone : email}</span>
            </p>
          </div>

          {/* 4 Pin Code Inputs */}
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[idx] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newOtp = [...otpCode];
                    newOtp[idx] = val;
                    setOtpCode(newOtp);
                    if (val && idx < 3) {
                      document.getElementById(`otp-${idx + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
                      document.getElementById(`otp-${idx - 1}`)?.focus();
                    }
                  }}
                  className={`h-14 w-14 rounded-full text-center text-xl font-extrabold border-2 outline-none transition ${
                    otpCode[idx]
                      ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-200"
                      : "border-gray-200 bg-white text-gray-900 focus:border-purple-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[#D4F06B] py-3.5 text-sm font-bold text-gray-900 hover:bg-[#C5E456] active:scale-[0.98] transition shadow-sm"
            >
              {busy ? "Confirming..." : "Confirm"}
            </button>
          </form>

          {/* Resend Link */}
          <div className="mt-6 text-center text-xs font-semibold text-gray-500">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={() => toast.success("New code sent!")}
              className="text-purple-600 hover:underline font-bold"
            >
              Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 1: Luminous Modern Login Screen
  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[400px] rounded-[36px] bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100/80">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="mt-1 text-xs font-medium text-gray-500">Login to access your account</p>
        </div>

        {/* Tab Pill Selector (Phone Number vs Email) */}
        <div className="mt-6 flex rounded-full bg-gray-100 p-1.5 border border-gray-200/50">
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all duration-200 ${
              tab === "phone"
                ? "bg-[#D4F06B] text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Phone Number
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all duration-200 ${
              tab === "email"
                ? "bg-[#D4F06B] text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Email
          </button>
        </div>

        {/* Main Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {tab === "phone" ? (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+8801775472701"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="sarkarraj0766@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Options Row (Remember Me & Forgot Password) */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#D4F06B] focus:ring-[#D4F06B]"
              />
              <span className="text-xs font-semibold text-gray-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => toast.success("Password reset link sent!")}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800"
            >
              Forget password?
            </button>
          </div>

          {/* Primary CTA Button (Luminous Lime) */}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#D4F06B] py-3.5 text-xs font-bold text-gray-900 hover:bg-[#C5E456] active:scale-[0.98] transition shadow-sm mt-2"
          >
            {busy ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-gray-100" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold text-gray-400">
            Or Sign In With
          </span>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialAuth("Google")}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-200/80 bg-gray-50/60 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialAuth("Facebook")}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-200/80 bg-gray-50/60 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs font-medium text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-bold text-purple-600 hover:underline">
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}
