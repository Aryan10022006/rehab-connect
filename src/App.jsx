import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserPortal from "./pages/UserPortal";
import AdminLoginPage from "./pages/AdminLoginPage";
import ClinicDetailPage from "./pages/ClinicDetailPage";
import AdminPanel from "./pages/AdminPanel";

// Protected route for user
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
}
// Protected route for admin
function AdminRoute({ children }) {
  const admin = localStorage.getItem("admin");
  const loginTime = localStorage.getItem("admin_login_time");
  const maxSession = 30 * 60 * 1000; // 30 minutes
  if (!admin || !loginTime) {
    return <Navigate to="/admin-secret-login" replace state={{ expired: false }} />;
  }
  const now = Date.now();
  if (now - Number(loginTime) > maxSession) {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_login_time");
    return <Navigate to="/admin-secret-login" replace state={{ expired: true }} />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Hide header on admin login */}
        {window.location.pathname !== "/admin-secret-login" && <Header />}
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user" element={<ProtectedRoute><UserPortal /></ProtectedRoute>} />
          <Route path="/clinic/:id" element={<ProtectedRoute><ClinicDetailPage /></ProtectedRoute>} />
          <Route path="/admin-secret-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 