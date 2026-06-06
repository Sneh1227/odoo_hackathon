import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { ProcurementProvider } from "./context/ProcurementContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PortalPage from "./pages/PortalPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const portalRoute = (role, view) => (
    <ProtectedRoute allowedRoles={[role]}>
      <PortalPage role={role} view={view} />
    </ProtectedRoute>
  );

  return (
    <Router>
      <ProcurementProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="/procurement" element={<Navigate to="/procurement/dashboard" replace />} />
          <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />

          <Route path="/admin/dashboard" element={portalRoute("Admin", "dashboard")} />
          <Route path="/admin/users" element={portalRoute("Admin", "users")} />
          <Route path="/admin/vendors" element={portalRoute("Admin", "vendors")} />
          <Route path="/admin/reports" element={portalRoute("Admin", "reports")} />
          <Route path="/admin/activity" element={portalRoute("Admin", "activity")} />

          <Route path="/vendor/dashboard" element={portalRoute("Vendor", "dashboard")} />
          <Route path="/vendor/rfqs" element={portalRoute("Vendor", "rfq")} />
          <Route path="/vendor/quotations" element={portalRoute("Vendor", "quotations")} />
          <Route path="/vendor/orders" element={portalRoute("Vendor", "orders")} />
          <Route path="/vendor/activity" element={portalRoute("Vendor", "activity")} />

          <Route path="/procurement/dashboard" element={portalRoute("Procurement Officer", "dashboard")} />
          <Route path="/procurement/users" element={portalRoute("Procurement Officer", "users")} />
          <Route path="/procurement/vendors" element={portalRoute("Procurement Officer", "vendors")} />
          <Route path="/procurement/rfq" element={portalRoute("Procurement Officer", "rfq")} />
          <Route path="/procurement/quotations" element={portalRoute("Procurement Officer", "quotations")} />
          <Route path="/procurement/approvals" element={portalRoute("Procurement Officer", "approvals")} />
          <Route path="/procurement/orders" element={portalRoute("Procurement Officer", "orders")} />
          <Route path="/procurement/activity" element={portalRoute("Procurement Officer", "activity")} />
          <Route path="/procurement/reports" element={portalRoute("Procurement Officer", "reports")} />

          <Route path="/manager/dashboard" element={portalRoute("Manager", "dashboard")} />
          <Route path="/manager/approvals" element={portalRoute("Manager", "approvals")} />
          <Route path="/manager/activity" element={portalRoute("Manager", "activity")} />
          <Route path="/manager/reports" element={portalRoute("Manager", "reports")} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ProcurementProvider>
    </Router>
  );
}

export default App;