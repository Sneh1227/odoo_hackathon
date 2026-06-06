import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./App.css";
import { ProcurementProvider } from "./context/ProcurementContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import ProcurementDashboard from "./pages/ProcurementDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const RoleLayout = () => <Outlet />;

function App() {
  return (
    <AuthProvider>
      <ProcurementProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
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
              <Route path="users" element={<Navigate to="/admin/dashboard?tab=users" replace />} />
              <Route path="vendors" element={<Navigate to="/admin/dashboard?tab=vendors" replace />} />
              <Route path="reports" element={<Navigate to="/admin/dashboard?tab=reports" replace />} />
              <Route path="activity" element={<Navigate to="/admin/dashboard?tab=activity" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Vendor Routes */}
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
              <Route path="rfqs" element={<Navigate to="/vendor/dashboard?tab=rfqs" replace />} />
              <Route path="quotations" element={<Navigate to="/vendor/dashboard?tab=bids" replace />} />
              <Route path="orders" element={<Navigate to="/vendor/dashboard?tab=orders" replace />} />
              <Route path="activity" element={<Navigate to="/vendor/dashboard?tab=activity" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Procurement Officer Routes */}
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
              <Route path="users" element={<Navigate to="/procurement/dashboard?tab=users" replace />} />
              <Route path="vendors" element={<Navigate to="/procurement/dashboard?tab=vendors" replace />} />
              <Route path="rfq" element={<Navigate to="/procurement/dashboard?tab=response" replace />} />
              <Route path="quotations" element={<Navigate to="/procurement/dashboard?tab=spend" replace />} />
              <Route path="approvals" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
              <Route path="orders" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
              <Route path="activity" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
              <Route path="reports" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Manager Routes */}
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
              <Route path="approvals" element={<Navigate to="/manager/dashboard?tab=approvals" replace />} />
              <Route path="activity" element={<Navigate to="/manager/dashboard?tab=overview" replace />} />
              <Route path="reports" element={<Navigate to="/manager/dashboard?tab=overview" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </Router>
      </ProcurementProvider>
    </AuthProvider>
  );
}

export default App;
