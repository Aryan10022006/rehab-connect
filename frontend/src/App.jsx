import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserPortal from "./pages/UserPortal";
import AdminLoginPage from "./pages/AdminLoginPage";
import ClinicDetailPage from "./pages/ClinicDetailPage";
import AdminPanel from "./pages/AdminPanel";
import { useAuth } from "./context/AuthContext";

// Protected route component for authenticated users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
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

// App content with auth context
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <>
                <Header />
                <HomePage />
              </>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user" 
          element={
            <ProtectedRoute>
              <>
                <Header />
                <UserPortal />
              </>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clinic/:id" 
          element={
            <ProtectedRoute>
              <>
                <Header />
                <ClinicDetailPage />
              </>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route path="/admin-secret-login" element={<AdminLoginPage />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminPanel />
              </>
            </AdminRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App; 