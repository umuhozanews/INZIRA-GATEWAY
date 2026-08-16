import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./lib/i18n.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <App />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    className: "!font-body !text-[13px] !font-medium !bg-charcoal-800 !text-white !border !border-charcoal-700",
                    duration: 3500,
                    style: { borderRadius: "14px" },
                  }}
                />
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
