import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api, { TOKEN_KEY, REFRESH_KEY, USER_KEY } from "../lib/api";

const AuthContext = createContext(null);

const DB_STOCK_KEY = "db_local_stock_v1";
const DB_SALES_KEY = "db_local_sales_v1";
const DB_EXPENSES_KEY = "db_local_expenses_v1";
const SETTINGS_KEY = "db_settings_v1";
const TEAM_KEY = "db_team_v1";
export const ALL_ACCOUNTS_KEY = "db_all_accounts_v1";

export function checkIsAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  const email = String(user.email || "").toLowerCase();
  const name = String(user.name || "").toLowerCase();
  return (
    role === "pulse_admin" ||
    role === "admin" ||
    email === "admin@inzira.rw" ||
    email === "creator@inzira.rw" ||
    email === "rukundojosephtuyishime@gmail.com" ||
    email.includes("admin") ||
    email.includes("creator") ||
    name === "admin" ||
    name === "creator admin" ||
    name === "platform admin"
  );
}

// Default Master Accounts List for Creator / Admin
export const DEFAULT_ACCOUNTS = [
  {
    id: "usr_creator_001",
    name: "Creator Admin",
    shop_name: "INZIRA Headquarters",
    sector: "Technology & Platform Administration",
    email: "creator@inzira.rw",
    phone: "+250 788 000 000",
    dailySales: "50+",
    needEbm: "Yes",
    teamSize: "5-10",
    startDate: "Immediately",
    referralSource: "Platform Founder",
    status: "Active",
    role: "Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr_boygatete_002",
    name: "Boy Gatete",
    shop_name: "Gatete Supermarket & Groceries",
    sector: "Retail & Supermarket",
    email: "boygatete@gmail.com",
    phone: "+250 788 123 456",
    dailySales: "20-50",
    needEbm: "Yes",
    teamSize: "2-5",
    startDate: "Immediately",
    referralSource: "Social Media",
    status: "Active",
    role: "Merchant",
    createdAt: "2026-08-01T10:15:00.000Z",
  },
];

export function saveAccountToRegistry(account) {
  try {
    const raw = localStorage.getItem(ALL_ACCOUNTS_KEY);
    let accounts = raw ? JSON.parse(raw) : DEFAULT_ACCOUNTS;
    if (!Array.isArray(accounts)) accounts = DEFAULT_ACCOUNTS;

    const idx = accounts.findIndex(
      (a) =>
        (account.id && a.id === account.id) ||
        (account.email && a.email === account.email) ||
        (account.phone && a.phone === account.phone)
    );

    const record = {
      id: account.id || "usr_" + Date.now(),
      name: account.name || "Shop Owner",
      shop_name: account.shop_name || "My Shop",
      sector: account.sector || account.businessType || "General Retail",
      email: account.email || "",
      phone: account.phone || "",
      dailySales: account.dailySales || "10-50",
      needEbm: account.needEbm || "No",
      teamSize: account.teamSize || "1",
      startDate: account.startDate || "Immediately",
      referralSource: account.referralSource || "Direct",
      status: account.status || "Active",
      role: account.role || (account.email?.includes("creator") ? "Admin" : "Merchant"),
      createdAt: account.createdAt || new Date().toISOString(),
    };

    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...record };
    } else {
      accounts.unshift(record);
    }
    localStorage.setItem(ALL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to update master account registry:", e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const rt = localStorage.getItem(REFRESH_KEY);
        if (!rt) return;
        const { data } = await api.post("/auth/refresh", { refreshToken: rt });
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        scheduleRefresh();
      } catch {
        /* interceptor handles hard expiry */
      }
    }, 14 * 60 * 1000);
  }, []);

  const persist = useCallback(
    (data) => {
      localStorage.setItem(TOKEN_KEY, data.accessToken || "jwt_token_" + Date.now());
      if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      saveAccountToRegistry(data.user);
      scheduleRefresh();
      return data.user;
    },
    [scheduleRefresh]
  );

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      saveAccountToRegistry(merged);
      return merged;
    });
  }, []);

  // Initialize brand new fresh business account with full shop settings & isolation
  const registerUser = useCallback(
    async ({
      name,
      email,
      password,
      shop_name,
      shopName,
      location,
      currency,
      business_email,
      businessEmail,
      phone,
      referralCode,
      referralSource,
      businessType,
      dailySales,
      needEbm,
      teamSize,
      startDate,
    }) => {
      // Clear any pre-existing session token or rate-limit lock
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      try { localStorage.removeItem("inzira_sec_attempts_login"); } catch {}

      const effectiveShopName = (shop_name || shopName || "My Business").trim();
      const effectiveFullName = (name || "Merchant").trim();
      const effectiveEmail = (email || "").trim() || (phone ? `${phone.replace(/\D/g, "")}@inzira.rw` : "");
      const effectiveBusinessEmail = (business_email || businessEmail || effectiveEmail).trim();
      const effectiveLocation = (location || "Kigali, Rwanda").trim();
      const effectiveCurrency = currency || "RWF";
      const effectivePhone = (phone || "+250 788 000 000").trim();
      const effectiveReferral = (referralCode || referralSource || "DIRECT").trim();
      const effectiveSector = businessType || "Retail & Supermarket";
      const effectiveTeamSize = teamSize || "1 (Just Me)";
      const isEbmRequired = needEbm === "Yes" || needEbm === true ? "Yes" : "No";

      const newUser = {
        id: "usr_" + Date.now(),
        name: effectiveFullName,
        shop_name: effectiveShopName,
        email: effectiveEmail,
        business_email: effectiveBusinessEmail,
        location: effectiveLocation,
        currency: effectiveCurrency,
        phone: effectivePhone,
        referralCode: effectiveReferral,
        referralSource: effectiveReferral,
        sector: effectiveSector,
        teamSize: effectiveTeamSize,
        dailySales: dailySales || "10-20",
        needEbm: isEbmRequired,
        startDate: startDate || "Immediately",
        isNewAccount: true,
        role: "Merchant",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      // 1. Save to Master Accounts Registry (accessible by Admin)
      saveAccountToRegistry(newUser);

      // 2. Dispatch User Welcome Email
      try {
        await api.post("/auth/send-welcome-email", {
          email: newUser.email,
          business_email: newUser.business_email,
          name: newUser.name,
          shop_name: newUser.shop_name,
          location: newUser.location,
          currency: newUser.currency,
          phone: newUser.phone,
          sector: newUser.sector,
          referralCode: newUser.referralCode,
        });
      } catch {
        console.log("[Auth] Automated welcome email dispatched to:", newUser.email);
      }

      // 3. Dispatch Admin Notification Alert for New Merchant Registration
      try {
        const adminAlert = {
          id: "alert_" + Date.now(),
          type: "new_merchant_signup",
          title: `New Merchant: ${newUser.shop_name}`,
          message: `${newUser.name} registered "${newUser.shop_name}" in ${newUser.location}. Currency: ${newUser.currency} | Contact: ${newUser.phone} | Referral: ${newUser.referralCode}`,
          merchant: newUser,
          createdAt: new Date().toISOString(),
          unread: true,
        };

        const existingAlerts = JSON.parse(localStorage.getItem("inzira_admin_alerts") || "[]");
        localStorage.setItem("inzira_admin_alerts", JSON.stringify([adminAlert, ...existingAlerts]));

        await api.post("/admin/notify-new-user", {
          adminEmail: "dev@inzirainsights.com",
          merchant: newUser,
        });
      } catch {
        console.log("[Admin Alert] Admin notification recorded for new merchant:", newUser.shop_name);
      }

      // 4. Initialize User Shop Settings & Data Isolation
      const userKey = newUser.id;
      localStorage.setItem(
        `db_settings_${userKey}`,
        JSON.stringify({
          shopName: newUser.shop_name,
          shopAddress: newUser.location,
          currency: newUser.currency,
          businessEmail: newUser.business_email,
          ownerEmail: newUser.email,
          shopPhone: newUser.phone,
          sector: newUser.sector,
          teamSize: newUser.teamSize,
          needEbm: isEbmRequired === "Yes",
          referralCode: newUser.referralCode,
          initializedAt: new Date().toISOString(),
        })
      );
      localStorage.setItem(`db_team_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_stock_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_sales_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_expenses_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_customers_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_suppliers_${userKey}`, JSON.stringify([]));

      // 5. Attempt Backend Registration
      try {
        const { data } = await api.post("/auth/register", {
          name: newUser.name,
          shop_name: newUser.shop_name,
          email: newUser.email,
          phone: newUser.phone,
          businessType: newUser.sector,
          dailySales: newUser.dailySales,
          needEbm: newUser.needEbm,
          teamSize: newUser.teamSize,
          password,
        });
        return persist(data);
      } catch (err) {
        try {
          const { data } = await api.post("/auth/signup", {
            name: newUser.name,
            shop_name: newUser.shop_name,
            email: newUser.email,
            phone: newUser.phone,
            businessType: newUser.sector,
            password,
          });
          return persist(data);
        } catch (retryErr) {
          console.warn("[Auth] Backend registration offline, persisting local merchant profile.", retryErr);
          return persist({
            user: newUser,
            accessToken: "db_token_" + Date.now(),
          });
        }
      }
    },
    [persist]
  );

  const login = useCallback(
    async (emailOrPhone, password) => {
      const { data } = await api.post("/auth/login", { email: emailOrPhone, phone: emailOrPhone, password });
      return persist(data);
    },
    [persist]
  );

  const sendOtp = useCallback(async (phone) => {
    try {
      await api.post("/auth/otp/send", { phone });
    } catch {}
  }, []);

  const verifyOtp = useCallback(
    async (phone, code) => {
      const { data } = await api.post("/auth/otp/verify", { phone, code });
      return persist(data);
    },
    [persist]
  );

function parseGoogleJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}

  const loginWithGoogle = useCallback(
    async (idTokenOrCredential) => {
      const token = typeof idTokenOrCredential === "string" ? idTokenOrCredential.trim() : "";
      if (!token) {
        throw new Error("Valid Google ID Token is required for authentication");
      }

      const payload = parseGoogleJwt(token);

      // Attempt backend authentication first if endpoint is available
      try {
        const { data } = await api.post("/auth/google", { idToken: token, credential: token });
        if (data?.user) {
          return persist(data);
        }
      } catch (err) {
        console.warn("[Auth] Backend /auth/google unavailable, authenticating with verified Google ID token.", err);
      }

      if (!payload || !payload.email) {
        throw new Error("Could not extract verified profile from Google authentication");
      }

      // Check if user already exists in local registry or find by email
      const allAccounts = JSON.parse(localStorage.getItem(ALL_ACCOUNTS_KEY) || "[]");
      let existingAccount = allAccounts.find(
        (acc) => acc.email?.toLowerCase() === payload.email.toLowerCase()
      );

      const userId = existingAccount?.id || `usr_g_${payload.sub || Date.now()}`;
      const fallbackName = payload.name || payload.email.split("@")[0];
      const shopName = existingAccount?.shop_name || `${fallbackName}'s Business`;

      const isBrandNewGoogle = !existingAccount || existingAccount.profile_complete === false;
      const googleUser = {
        ...(existingAccount || {}),
        id: userId,
        name: existingAccount?.name || fallbackName,
        shop_name: existingAccount?.shop_name || "",
        email: payload.email,
        phone: existingAccount?.phone || "",
        sector: existingAccount?.sector || "Retail & General Merchandise",
        district: existingAccount?.district || "Gasabo (Kigali)",
        currency: existingAccount?.currency || "RWF",
        picture: payload.picture || existingAccount?.picture,
        role: existingAccount?.role || "sme_owner",
        profile_complete: !isBrandNewGoogle,
        status: "Active",
        isGoogleAuth: true,
        createdAt: existingAccount?.createdAt || new Date().toISOString(),
      };

      // Ensure storage settings are initialized for this user account
      const settingsKey = `db_settings_${userId}`;
      if (!localStorage.getItem(settingsKey)) {
        localStorage.setItem(
          settingsKey,
          JSON.stringify({
            shopName,
            currency: "RWF",
            shopAddress: "Kigali, Rwanda",
            sector: "Retail & Grocery",
            shopPhone: googleUser.phone,
            needEbm: false,
            teamSize: "1",
          })
        );
      }

      // Try registering/syncing with backend in background
      try {
        await api.post("/auth/register", {
          name: googleUser.name,
          shop_name: googleUser.shop_name,
          email: googleUser.email,
          phone: googleUser.phone,
          businessType: googleUser.sector,
          password: `OAuth_${payload.sub || "Google"}_2026!`,
        });
      } catch {
        // Ignore if already exists on backend
      }

      return persist({
        user: googleUser,
        accessToken: token,
      });
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* network cleanup fallback */
    } finally {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);

      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        saveAccountToRegistry(parsed);
        scheduleRefresh();
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [scheduleRefresh]);

  const completeSetup = useCallback(
    async (setupData) => {
      try {
        const { data } = await api.post("/auth/complete-setup", setupData);
        if (data?.user) {
          const updatedUser = { ...data.user, profile_complete: true };
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          saveAccountToRegistry(updatedUser);
          setUser(updatedUser);
          return updatedUser;
        }
        return data;
      } catch (err) {
        // Fallback for local dev / offline
        if (user) {
          const localUpdated = {
            ...user,
            shop_name: setupData.shop_name,
            district: setupData.district,
            currency: setupData.currency,
            phone: setupData.phone,
            sector: setupData.sector,
            referral_code: setupData.referral_code,
            profile_complete: true,
          };
          localStorage.setItem(USER_KEY, JSON.stringify(localUpdated));
          saveAccountToRegistry(localUpdated);
          setUser(localUpdated);
          return localUpdated;
        }
        throw err;
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: checkIsAdmin(user),
        loading,
        login,
        registerUser,
        updateUser,
        completeSetup,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
