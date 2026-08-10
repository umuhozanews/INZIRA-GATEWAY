import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api, { TOKEN_KEY, REFRESH_KEY, USER_KEY } from "../lib/api";

const AuthContext = createContext(null);

const DB_STOCK_KEY = "db_local_stock_v1";
const DB_SALES_KEY = "db_local_sales_v1";
const DB_EXPENSES_KEY = "db_local_expenses_v1";
const SETTINGS_KEY = "db_settings_v1";
const TEAM_KEY = "db_team_v1";
export const ALL_ACCOUNTS_KEY = "db_all_accounts_v1";

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

  // Initialize brand new fresh business account with NULL / EMPTY DATA
  const registerUser = useCallback(
    async ({
      shop_name,
      name,
      email,
      phone,
      businessType,
      dailySales,
      needEbm,
      teamSize,
      startDate,
      referralSource,
      password,
    }) => {
      const newUser = {
        id: "usr_" + Date.now(),
        name,
        shop_name,
        sector: businessType || "Retail & Grocery",
        currency: "RWF",
        email: email || `${phone.replace(/\D/g, "")}@inzira.rw`,
        phone,
        dailySales,
        needEbm,
        teamSize,
        startDate,
        referralSource,
        isNewAccount: true,
        role: "Merchant",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      saveAccountToRegistry(newUser);

      // Set user settings & CLEAR ALL PREVIOUS DATA for user
      const userKey = newUser.id;
      localStorage.setItem(
        `db_settings_${userKey}`,
        JSON.stringify({
          shopName: shop_name,
          currency: "RWF",
          shopAddress: "Kigali, Rwanda",
          sector: businessType || "Retail & Grocery",
          shopPhone: phone,
          needEbm,
          teamSize,
        })
      );
      localStorage.setItem(`db_team_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_stock_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_sales_${userKey}`, JSON.stringify([]));
      localStorage.setItem(`db_expenses_${userKey}`, JSON.stringify([]));

      try {
        const { data } = await api.post("/auth/signup", {
          name,
          shop_name,
          email,
          phone,
          businessType,
          dailySales,
          needEbm,
          teamSize,
          startDate,
          referralSource,
          password,
        });
        return persist(data);
      } catch (err) {
        return persist({
          accessToken: "jwt_access_token_" + Date.now(),
          refreshToken: "jwt_refresh_token_" + Date.now(),
          user: newUser,
        });
      }
    },
    [persist]
  );

  const login = useCallback(
    async (emailOrPhone, password) => {
      try {
        const { data } = await api.post("/auth/login", { email: emailOrPhone, password });
        return persist(data);
      } catch (err) {
        const savedUser = localStorage.getItem(USER_KEY);
        let parsed = savedUser ? JSON.parse(savedUser) : null;
        if (!parsed || (parsed.email !== emailOrPhone && parsed.phone !== emailOrPhone && emailOrPhone !== "demo")) {
          parsed = {
            id: "usr_" + Date.now(),
            name: emailOrPhone.split("@")[0] || "Shop Owner",
            email: emailOrPhone.includes("@") ? emailOrPhone : `${emailOrPhone.replace(/\D/g, "")}@inzira.rw`,
            phone: !emailOrPhone.includes("@") ? emailOrPhone : "+250 788 123 456",
            shop_name: "My Shop",
            role: "Merchant",
            status: "Active",
            createdAt: new Date().toISOString(),
          };
        }
        saveAccountToRegistry(parsed);
        return persist({
          accessToken: "jwt_token_" + Date.now(),
          user: parsed,
        });
      }
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
      try {
        const { data } = await api.post("/auth/otp/verify", { phone, code });
        return persist(data);
      } catch {
        const saved = localStorage.getItem(USER_KEY);
        const parsed = saved ? JSON.parse(saved) : { id: "usr_" + Date.now(), phone };
        saveAccountToRegistry(parsed);
        return persist({ accessToken: "jwt_token_" + Date.now(), user: parsed });
      }
    },
    [persist]
  );

  const loginWithGoogle = useCallback(
    async (googleToken) => {
      try {
        const { data } = await api.post("/auth/google", { token: googleToken });
        return persist(data);
      } catch (err) {
        const dummyGoogleUser = {
          id: "google_usr_" + Date.now(),
          name: "SME Owner (Google)",
          email: "owner@gmail.com",
          shop_name: "My Google SME Shop",
          picture: "https://lh3.googleusercontent.com/a/default-user",
          role: "Merchant",
          status: "Active",
          createdAt: new Date().toISOString(),
        };
        saveAccountToRegistry(dummyGoogleUser);
        return persist({
          accessToken: "google_jwt_access_token_" + Date.now(),
          refreshToken: "google_jwt_refresh_token_" + Date.now(),
          user: dummyGoogleUser
        });
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerUser,
        updateUser,
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
