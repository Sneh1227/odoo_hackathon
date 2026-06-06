import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./App.css";
<<<<<<< HEAD
import { ProcurementProvider } from "./context/ProcurementContext";
=======
import { AuthProvider } from "./context/AuthContext";
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
<<<<<<< HEAD
import PortalPage from "./pages/PortalPage";
=======
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import ProcurementDashboard from "./pages/ProcurementDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440
import ProtectedRoute from "./components/ProtectedRoute";

const RoleLayout = () => <Outlet />;

function App() {
  const portalRoute = (role, view) => (
    <ProtectedRoute allowedRoles={[role]}>
      <PortalPage role={role} view={view} />
    </ProtectedRoute>
  );

  return (
<<<<<<< HEAD
    <Router>
      <ProcurementProvider>
=======
    <AuthProvider>
          <Router>
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

<<<<<<< HEAD
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
=======
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <RoleLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/vendor"
            element={
              <ProtectedRoute allowedRoles={["Vendor"]}>
                <RoleLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/procurement"
            element={
              <ProtectedRoute allowedRoles={["Procurement Officer"]}>
                <RoleLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProcurementDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["Manager"]}>
                <RoleLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes >
<<<<<<< HEAD
      </ProcurementProvider >
    </Router >
=======
      </Router>
    </AuthProvider>
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440
  );
}

export default App;
