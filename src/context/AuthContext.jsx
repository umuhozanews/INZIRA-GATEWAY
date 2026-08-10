import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api, { TOKEN_KEY, REFRESH_KEY, USER_KEY } from "../lib/api";

const AuthContext = createContext(null);

const DEFAULT_STOCK = [
  { id: 1, name: "Sugar 1kg", category: "Groceries", unit: "kg", quantity: 48, sell_price_rwf: 1500, cost_price_rwf: 1200, low_stock_threshold: 10, is_active: true },
  { id: 2, name: "Cooking Oil 1L", category: "Groceries", unit: "litre", quantity: 28, sell_price_rwf: 2800, cost_price_rwf: 2200, low_stock_threshold: 5, is_active: true },
  { id: 3, name: "Soap Bar", category: "Hygiene", unit: "pcs", quantity: 96, sell_price_rwf: 600, cost_price_rwf: 400, low_stock_threshold: 20, is_active: true },
  { id: 4, name: "Rice 1kg", category: "Groceries", unit: "kg", quantity: 75, sell_price_rwf: 1200, cost_price_rwf: 900, low_stock_threshold: 15, is_active: true },
];

const DB_STOCK_KEY = "db_local_stock_v1";
const DB_SALES_KEY = "db_local_sales_v1";
const DB_EXPENSES_KEY = "db_local_expenses_v1";
const SETTINGS_KEY = "db_settings_v1";
const TEAM_KEY = "db_team_v1";

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
      scheduleRefresh();
      return data.user;
    },
    [scheduleRefresh]
  );

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Initialize brand new fresh business account directly from onboarding questions (No verification code required)
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
      };

      // Store initial user settings and initialize fresh business account data
      localStorage.setItem(
        SETTINGS_KEY,
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
      localStorage.setItem(TEAM_KEY, JSON.stringify([]));
      localStorage.setItem(DB_STOCK_KEY, JSON.stringify(DEFAULT_STOCK));
      localStorage.setItem(DB_SALES_KEY, JSON.stringify([]));
      localStorage.setItem(DB_EXPENSES_KEY, JSON.stringify([]));

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
    async (email, password) => {
      try {
        const { data } = await api.post("/auth/login", { email, password });
        return persist(data);
      } catch (err) {
        const savedUser = localStorage.getItem(USER_KEY);
        let parsed = savedUser ? JSON.parse(savedUser) : null;
        if (!parsed || (parsed.email !== email && email !== "demo")) {
          parsed = {
            id: "usr_" + Date.now(),
            name: email.split("@")[0] || "Shop Owner",
            email,
            shop_name: "My Shop",
          };
        }
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
          picture: "https://lh3.googleusercontent.com/a/default-user"
        };
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
        setUser(JSON.parse(stored));
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
