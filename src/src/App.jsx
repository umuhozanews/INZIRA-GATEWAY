import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Loading from "./components/Loading";
import ErrorBoundary from "./components/ErrorBoundary";

const SignIn = lazy(() => import("./pages/SignIn"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Sell = lazy(() => import("./pages/Sell"));
const Stock = lazy(() => import("./pages/Stock"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const HealthScore = lazy(() => import("./pages/HealthScore"));

// Additional System Pages matching the main web platform
const ProfitLoss = lazy(() => import("./pages/ProfitLoss"));
const FinancialBooks = lazy(() => import("./pages/FinancialBooks"));
const SalesReport = lazy(() => import("./pages/SalesReport"));
const StockReport = lazy(() => import("./pages/StockReport"));
const TaxReport = lazy(() => import("./pages/TaxReport"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<SignIn />} />

          {/* Full-screen standalone pages */}
          <Route
            path="/health-score"
            element={
              <ProtectedRoute>
                <HealthScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pnl"
            element={
              <ProtectedRoute>
                <ProfitLoss />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <FinancialBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/sales"
            element={
              <ProtectedRoute>
                <SalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/stock"
            element={
              <ProtectedRoute>
                <StockReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/tax"
            element={
              <ProtectedRoute>
                <TaxReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute>
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Tabbed app shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/suppliers" element={<Suppliers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
