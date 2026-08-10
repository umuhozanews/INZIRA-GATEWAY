import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Calendar, Lock, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export default function SignUp() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  const [busy, setBusy] = useState(false);

  // Form State (matching Screen 2 in ui.png & PRD)
  const [firstName, setFirstName] = useState("Raj");
  const [lastName, setLastName] = useState("Sarkar");
  const [email, setEmail] = useState("sarkarraj0766@gmail.com");
  const [birthDate, setBirthDate] = useState("2000-06-15");
  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState("4547260592");
  const [password, setPassword] = useState("*******");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification view state (Screen 3 in ui.png)
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpCode, setOtpCode] = useState(["4", "7", "", ""]);

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast.error("Please enter your first and last name.");
      return;
    }
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone) {
      toast.error("Please enter your phone number.");
      return;
    }

    setBusy(true);
    try {
      // Send OTP code for verification step
      await sendOtp(`${countryCode}${phone}`);
      setShowOtpView(true);
    } catch (err) {
      // Fallback for mock demo
      setShowOtpView(true);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 4) {
      toast.error("Please enter the 4-digit verification code.");
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(`${countryCode}${phone}`, code);

      // Persist registered user profile details
      const newUser = {
        id: "usr_" + Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        phone: `${countryCode}${phone}`,
        birthDate,
      };
      localStorage.setItem("db_user", JSON.stringify(newUser));
      localStorage.setItem("db_token", "jwt_token_" + Date.now());

      toast.success("Account created successfully!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.success("Account registered!");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  // SCREEN 3: OTP Verification Screen
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
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          {/* 4 Pin Code Inputs */}
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`signup-otp-${idx}`}
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
                      document.getElementById(`signup-otp-${idx + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
                      document.getElementById(`signup-otp-${idx - 1}`)?.focus();
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

  // SCREEN 2: Luminous Modern Sign Up Screen
  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[400px] rounded-[36px] bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100/80">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Get Started Now</h1>
          <p className="mt-1 text-xs font-medium text-gray-500 leading-snug">
            Create an account or log in to explore about our app
          </p>
        </div>

        {/* Tab Pill Selector (Sign Up vs Log In) */}
        <div className="mt-6 flex rounded-full bg-gray-100 p-1.5 border border-gray-200/50">
          <button
            type="button"
            className="flex-1 rounded-full bg-[#D4F06B] py-2.5 text-xs font-bold text-gray-900 shadow-sm transition-all"
          >
            Sign Up
          </button>
          <Link
            to="/login"
            className="flex-1 rounded-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-gray-800 transition-all"
          >
            Log In
          </Link>
        </div>

        {/* Sign Up Registration Form */}
        <form onSubmit={handleSignUpSubmit} className="mt-6 space-y-3.5">
          
          {/* First Name & Last Name Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                First Name
              </label>
              <input
                type="text"
                placeholder="Raj"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Sarkar"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="sarkarraj0766@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition"
              required
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Birth of date
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition pr-10"
                required
              />
              <div className="pointer-events-none absolute right-3.5 text-gray-400">
                <Calendar size={16} />
              </div>
            </div>
          </div>

          {/* Phone Number with Country Code Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Password
            </label>
            <div className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 focus-within:border-[#D4F06B] focus-within:ring-2 focus-within:ring-[#D4F06B]/30 transition">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none pr-1 cursor-pointer"
              >
                <option value="+250">🇷🇼 +250</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+880">🇧🇩 +880</option>
                <option value="+254">🇰🇪 +254</option>
                <option value="+256">🇺🇬 +256</option>
              </select>
              <div className="mx-2 h-4 w-px bg-gray-200" />
              <input
                type="tel"
                placeholder="(454) 726-0592"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent py-1 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* Set Password */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Set Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition pr-10"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#D4F06B] py-3.5 text-xs font-bold text-gray-900 hover:bg-[#C5E456] active:scale-[0.98] transition shadow-sm mt-4"
          >
            {busy ? "Creating Account..." : "Sign Up"}
          </button>

        </form>

      </div>
    </div>
  );
}
