import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Vendors } from "./pages/Vendors";
import { RFQs } from "./pages/RFQs";
import { Quotations } from "./pages/Quotations";
import { Approvals } from "./pages/Approvals";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { Invoices } from "./pages/Invoices";
import { Reports } from "./pages/Reports";
import { ActivityLogs } from "./pages/ActivityLogs";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Role definitions (single source of truth — mirrors AppShell NAV_ITEMS)
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = {
  ALL:                ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  ADMIN_ONLY:         ["ADMIN"],
  // Vendors page: Admin approves registrations (PENDING→ACTIVE)
  VENDORS_PAGE:       ["ADMIN"],
  // RFQs: Officer creates, Vendor responds (Manager doesn't need this view)
  RFQS_PAGE:          ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"],
  // Quotations: Officer compares & selects, Vendor submits
  QUOTATIONS_PAGE:    ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"],
  // Approvals: Manager approves/rejects
  APPROVERS:          ["ADMIN", "MANAGER"],
  // POs: all roles see their own scoped view
  PURCHASE_ORDERS:    ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  // Invoices: Officer generates, Admin/Manager view all, Vendor sees own
  INVOICES:           ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  // Reports/analytics: Admin + Manager only
  ANALYTICS:          ["ADMIN", "MANAGER"],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Protected Route wrapper
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: readonly string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <AppShell>{children}</AppShell>;
};

// ─────────────────────────────────────────────────────────────────────────────
// App Routes
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* All authenticated roles */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={ROLES.ALL}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Admin only: user management ──────────────────────────── */}
          <Route
            path="/activity"
            element={
              <ProtectedRoute allowedRoles={ROLES.ADMIN_ONLY}>
                <ActivityLogs />
              </ProtectedRoute>
            }
          />
          {/* ── Admin only: vendor management & registration approval ─── */}
          <Route
            path="/vendors"
            element={
              <ProtectedRoute allowedRoles={ROLES.VENDORS_PAGE}>
                <Vendors />
              </ProtectedRoute>
            }
          />
          {/* ── Officer creates, Vendor responds ─────────────────────── */}
          <Route
            path="/rfqs"
            element={
              <ProtectedRoute allowedRoles={ROLES.RFQS_PAGE}>
                <RFQs />
              </ProtectedRoute>
            }
          />
          {/* ── Officer compares & selects, Vendor submits ────────────── */}
          <Route
            path="/quotations"
            element={
              <ProtectedRoute allowedRoles={ROLES.QUOTATIONS_PAGE}>
                <Quotations />
              </ProtectedRoute>
            }
          />
          {/* ── Manager approves/rejects ──────────────────────────────── */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={ROLES.APPROVERS}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          {/* ── All roles see their own POs ───────────────────────────── */}
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute allowedRoles={ROLES.PURCHASE_ORDERS}>
                <PurchaseOrders />
              </ProtectedRoute>
            }
          />
          {/* ── Vendor sees own invoices; Officer generates ───────────── */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={ROLES.INVOICES}>
                <Invoices />
              </ProtectedRoute>
            }
          />

          {/* ── Reports/Analytics: Admin + Manager ───────────────────────── */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={ROLES.ANALYTICS}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors theme="light" />
    </AuthProvider>
  );
}

export default App;
