import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Store,
  Lock,
  ChevronLeft,
  DollarSign,
  Package,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { sendOtp, registerUser } = useAuth();

  const [step, setStep] = useState(1); // 1: Business Basics | 2: Initial Stock | 3: Add Workers | 4: OTP Verification
  const [busy, setBusy] = useState(false);

  // Step 1: Business Onboarding & Credentials State
  const [shopName, setShopName] = useState("Amani Grocery & Retail");
  const [firstName, setFirstName] = useState("Raj");
  const [lastName, setLastName] = useState("Sarkar");
  const [sector, setSector] = useState("Retail & Grocery");
  const [currency, setCurrency] = useState("RWF");
  const [email, setEmail] = useState("sarkarraj0766@gmail.com");
  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState("788123456");
  const [password, setPassword] = useState("*******");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Initial Stock Setup State
  const [initialStock, setInitialStock] = useState([
    { id: 1, name: "Sugar 1kg", category: "Groceries", unit: "kg", quantity: 50, cost_price_rwf: 1200, sell_price_rwf: 1500 },
    { id: 2, name: "Cooking Oil 1L", category: "Groceries", unit: "litre", quantity: 30, cost_price_rwf: 2200, sell_price_rwf: 2800 },
  ]);
  const [newStockName, setNewStockName] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStockCost, setNewStockCost] = useState("");
  const [newStockPrice, setNewStockPrice] = useState("");

  // Step 3: Add Workers Setup State
  const [workers, setWorkers] = useState([]);
  const [workerName, setWorkerName] = useState("");
  const [workerRole, setWorkerRole] = useState("Cashier — POS only");
  const [workerPhone, setWorkerPhone] = useState("");

  // Step 4: OTP Verification State
  const [otpCode, setOtpCode] = useState(["4", "7", "", ""]);

  // Handler for Step 1 -> Step 2
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!shopName.trim()) return toast.error("Please enter your Business / Shop name.");
    if (!firstName || !lastName) return toast.error("Please enter the owner's full name.");
    if (!email) return toast.error("Please enter a valid business email address.");
    if (!phone) return toast.error("Please enter your phone number.");
    setStep(2);
  };

  // Handler for adding custom stock item in Step 2
  const handleAddStockItem = (e) => {
    e.preventDefault();
    if (!newStockName.trim()) return toast.error("Enter product name.");
    if (!newStockPrice) return toast.error("Enter selling price.");

    const item = {
      id: Date.now(),
      name: newStockName.trim(),
      category: sector.split("&")[0].trim() || "General",
      unit: "pcs",
      quantity: Number(newStockQty) || 10,
      cost_price_rwf: Number(newStockCost) || 0,
      sell_price_rwf: Number(newStockPrice) || 0,
      low_stock_threshold: 5,
      is_active: true
    };

    setInitialStock((prev) => [...prev, item]);
    setNewStockName("");
    setNewStockQty("");
    setNewStockCost("");
    setNewStockPrice("");
    toast.success(`Added "${item.name}" to inventory!`);
  };

  const handleRemoveStock = (id) => {
    setInitialStock((prev) => prev.filter((i) => i.id !== id));
  };

  // Handler for adding worker in Step 3
  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!workerName.trim()) return toast.error("Enter worker full name.");

    const w = {
      id: Date.now(),
      name: workerName.trim(),
      role: workerRole,
      phone: workerPhone.trim() || "N/A",
      status: "Active"
    };

    setWorkers((prev) => [...prev, w]);
    setWorkerName("");
    setWorkerPhone("");
    toast.success(`Worker "${w.name}" added!`);
  };

  const handleRemoveWorker = (id) => {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  };

  // Handler for Step 3 -> Send OTP & Step 4
  const handleProceedToOtp = async () => {
    setBusy(true);
    try {
      await sendOtp(`${countryCode}${phone}`);
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setBusy(false);
    }
  };

  // Final Registration & System Settlement
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 4) {
      toast.error("Please enter the 4-digit verification code.");
      return;
    }
    setBusy(true);
    try {
      await registerUser({
        shop_name: shopName,
        name: `${firstName} ${lastName}`,
        email,
        phone: `${countryCode}${phone}`,
        sector,
        currency,
        password,
        initialStock,
        initialWorkers: workers,
      });

      toast.success(`Welcome! ${shopName} registered & ready with ${initialStock.length} items!`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.success("Business account settled!");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#F4FBE4] via-[#F9FAFB] to-[#FFFFFF] font-manrope text-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px] rounded-[36px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100/80">
        
        {/* Progress Step Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-purple-600">
              Step {step} of 4
            </span>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
              {step === 1 && "Business & Owner Setup"}
              {step === 2 && "Setup Your Initial Stock"}
              {step === 3 && "Add Workers & Staff"}
              {step === 4 && "Verification Code"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === i ? "w-6 bg-[#D4F06B]" : step > i ? "w-2 bg-purple-600" : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Business Info, Sector, Currency & Credentials */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-3.5">
            {/* Tab Switcher */}
            <div className="flex rounded-full bg-gray-100 p-1.5 border border-gray-200/50 mb-2">
              <button
                type="button"
                className="flex-1 rounded-full bg-[#D4F06B] py-2 text-xs font-bold text-gray-900 shadow-sm transition-all"
              >
                Sign Up
              </button>
              <Link
                to="/login"
                className="flex-1 rounded-full py-2 text-center text-xs font-bold text-gray-500 hover:text-gray-800 transition-all"
              >
                Log In
              </Link>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Business / Shop Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. Amani Grocery Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#D4F06B] focus:ring-2 focus:ring-[#D4F06B]/30 transition pr-10"
                  required
                />
                <div className="pointer-events-none absolute right-3.5 text-gray-400">
                  <Store size={16} />
                </div>
              </div>
            </div>

            {/* Owner Split Name Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Owner First Name
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
                  Owner Last Name
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

            {/* Sector & Currency Split Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Category / Sector
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-[#D4F06B] transition cursor-pointer"
                >
                  <option value="Retail & Grocery">Retail & Grocery</option>
                  <option value="Electronics & Hardware">Electronics</option>
                  <option value="Pharmacy & Healthcare">Pharmacy</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Base Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#D4F06B] transition cursor-pointer"
                >
                  <option value="RWF">🇷🇼 RWF (Rwandan Franc)</option>
                  <option value="USD">🇺🇸 USD ($ Dollar)</option>
                  <option value="EUR">🇪🇺 EUR (€ Euro)</option>
                  <option value="KES">🇰🇪 KES (Kenyan Shilling)</option>
                  <option value="UGX">🇺🇬 UGX (Ugandan Shilling)</option>
                  <option value="TZS">🇹🇿 TZS (Tanzanian Shilling)</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                placeholder="sarkarraj0766@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-[#D4F06B] transition"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Business Phone Number
              </label>
              <div className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 focus-within:border-[#D4F06B] transition">
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
                  placeholder="788 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent py-1 text-xs font-medium text-gray-900 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
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
                  className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:border-[#D4F06B] transition pr-10"
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

            {/* Step 1 Button */}
            <button
              type="submit"
              className="w-full rounded-full bg-[#D4F06B] py-3.5 text-xs font-black text-gray-900 hover:bg-[#C5E456] active:scale-[0.98] transition shadow-sm mt-4 flex items-center justify-center gap-2"
            >
              <span>Next: Setup Initial Inventory</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: Initial Inventory / Products Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-medium">
              Add your shop's initial stock items. You can add more later anytime in <strong className="text-gray-900">My Stock</strong>.
            </p>

            {/* Stock List Display */}
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {initialStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 bg-gray-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4F06B] text-gray-900 font-bold shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-gray-900">{item.name}</div>
                      <div className="text-[11px] font-semibold text-gray-500">
                        Qty: {item.quantity} {item.unit} &bull; Price: {item.sell_price_rwf} {currency}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStock(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Stock Item Form */}
            <form onSubmit={handleAddStockItem} className="p-3.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/40 space-y-2.5">
              <span className="text-[11px] font-bold text-gray-700 block">+ Add Inventory Product</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Product Name (e.g. Bread)"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none"
                />
                <input
                  type="number"
                  placeholder="Quantity (e.g. 20)"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={`Cost (${currency})`}
                  value={newStockCost}
                  onChange={(e) => setNewStockCost(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none"
                />
                <input
                  type="number"
                  placeholder={`Selling Price (${currency})`}
                  value={newStockPrice}
                  onChange={(e) => setNewStockPrice(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-gray-900 py-2 text-xs font-bold text-white hover:bg-gray-800 transition"
              >
                + Add Item to Stock List
              </button>
            </form>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-4 rounded-full bg-[#D4F06B] text-xs font-black text-gray-900 hover:bg-[#C5E456] flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Next: Add Workers</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add Workers / Staff Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-medium">
              Add cashiers or managers to your team. You can also skip this step and add workers later in <strong className="text-gray-900">Settings</strong>.
            </p>

            {/* Workers List Display */}
            {workers.length > 0 && (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                {workers.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 bg-gray-50/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-gray-900">{w.name}</div>
                        <div className="text-[11px] font-semibold text-gray-500">
                          {w.role} &bull; {w.phone}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWorker(w.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Worker Input Form */}
            <form onSubmit={handleAddWorker} className="p-3.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/40 space-y-2.5">
              <span className="text-[11px] font-bold text-gray-700 block">+ Add Cashier / Staff Member</span>
              <input
                type="text"
                placeholder="Worker Full Name (e.g. Jean Muneza)"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={workerRole}
                  onChange={(e) => setWorkerRole(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none cursor-pointer"
                >
                  <option value="Cashier — POS only">Cashier (POS only)</option>
                  <option value="Manager — Full Access">Manager (Full Access)</option>
                  <option value="Accountant — Books & P&L">Accountant</option>
                </select>
                <input
                  type="tel"
                  placeholder="Worker Phone"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-gray-900 py-2 text-xs font-bold text-white hover:bg-gray-800 transition"
              >
                + Add Worker to Team
              </button>
            </form>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleProceedToOtp}
                className="flex-1 py-3 px-4 rounded-full bg-[#D4F06B] text-xs font-black text-gray-900 hover:bg-[#C5E456] flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{busy ? "Sending PIN..." : "Next: Verify Code"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: OTP PIN Verification & System Launch */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Purple Icon Lock Badge */}
            <div className="mx-auto my-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-200 text-purple-600">
                <Lock size={22} />
              </div>
            </div>

            {/* Title & Notice */}
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-gray-900">Verification code</h2>
              <p className="mt-2 text-xs font-medium text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                Enter the verification code we've sent to your{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </p>
            </div>

            {/* 4 Pin Code Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                className="w-full rounded-full bg-[#D4F06B] py-3.5 text-sm font-black text-gray-900 hover:bg-[#C5E456] active:scale-[0.98] transition shadow-sm"
              >
                {busy ? "Settling Dashboard..." : "Confirm & Launch My Account"}
              </button>
            </form>

            <div className="text-center text-xs font-semibold text-gray-500">
              Didn't receive code?{" "}
              <button
                type="button"
                onClick={() => toast.success("New code sent!")}
                className="text-purple-600 hover:underline font-bold"
              >
                Resend
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
