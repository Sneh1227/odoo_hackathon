import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
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

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
