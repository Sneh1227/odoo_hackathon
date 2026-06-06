import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { ProcurementProvider } from "./context/ProcurementContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PortalPage from "./pages/PortalPage";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import ProcurementDashboard from "./pages/ProcurementDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

function App() {
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

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<Navigate to="/admin/dashboard?tab=users" replace />} />
          <Route path="/admin/vendors" element={<Navigate to="/admin/dashboard?tab=vendors" replace />} />
          <Route path="/admin/reports" element={<Navigate to="/admin/dashboard?tab=reports" replace />} />
          <Route path="/admin/activity" element={<Navigate to="/admin/dashboard?tab=activity" replace />} />

          <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={["Vendor"]}><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/rfqs" element={<Navigate to="/vendor/dashboard?tab=rfqs" replace />} />
          <Route path="/vendor/quotations" element={<Navigate to="/vendor/dashboard?tab=bids" replace />} />
          <Route path="/vendor/orders" element={<Navigate to="/vendor/dashboard?tab=orders" replace />} />
          <Route path="/vendor/activity" element={<Navigate to="/vendor/dashboard?tab=activity" replace />} />

          <Route path="/procurement/dashboard" element={<ProtectedRoute allowedRoles={["Procurement Officer"]}><ProcurementDashboard /></ProtectedRoute>} />
          <Route path="/procurement/users" element={<Navigate to="/procurement/dashboard?tab=users" replace />} />
          <Route path="/procurement/vendors" element={<Navigate to="/procurement/dashboard?tab=vendors" replace />} />
          <Route path="/procurement/rfq" element={<Navigate to="/procurement/dashboard?tab=response" replace />} />
          <Route path="/procurement/quotations" element={<Navigate to="/procurement/dashboard?tab=spend" replace />} />
          <Route path="/procurement/approvals" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
          <Route path="/procurement/orders" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
          <Route path="/procurement/activity" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />
          <Route path="/procurement/reports" element={<Navigate to="/procurement/dashboard?tab=overview" replace />} />

          <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={["Manager"]}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/approvals" element={<Navigate to="/manager/dashboard?tab=approvals" replace />} />
          <Route path="/manager/activity" element={<Navigate to="/manager/dashboard?tab=overview" replace />} />
          <Route path="/manager/reports" element={<Navigate to="/manager/dashboard?tab=overview" replace />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </ProcurementProvider>
    </Router>
  );
}

export default App;