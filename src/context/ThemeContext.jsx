import { createContext, useContext, useState, useEffect, useLayoutEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("db_theme");
      if (saved === "light" || saved === "dark") return saved;
      return "dark"; // Default to Dark mode as requested
    } catch {
      return "dark";
    }
  });

  const isDark = theme === "dark";

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isDark ? "#090A0D" : "#F8FAFC");
    }
  }, [isDark]);

  const setTheme = (newTheme) => {
    const validTheme = newTheme === "light" ? "light" : "dark";
    setThemeState(validTheme);
    try {
      localStorage.setItem("db_theme", validTheme);
    } catch (e) {
      console.error("Failed to persist theme:", e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
