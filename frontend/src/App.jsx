import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageLoading } from "./components/LoadingSpinner";
import Header from "./components/Header";
import Footer from './components/Footer';
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserPortal from "./pages/UserPortal";
import AdminLoginPage from "./pages/AdminLoginPage";
import ClinicDetailPage from "./pages/ClinicDetailPage";
import AdminPanel from "./pages/AdminPanel";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Protected route component for authenticated users - NO DOUBLE SIGN IN
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoading text="Authenticating..." />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

// Protected route for admin - SECURE SESSION MANAGEMENT
function AdminRoute({ children }) {
  const admin = localStorage.getItem("admin");
  const loginTime = localStorage.getItem("admin_login_time");
  const maxSession = 60 * 60 * 1000; // 1 hour session
  
  if (!admin || !loginTime) {
    return <Navigate to="/secure-admin-portal-2024" replace state={{ expired: false }} />;
  }
  
  const now = Date.now();
  if (now - Number(loginTime) > maxSession) {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_login_time");
    return <Navigate to="/secure-admin-portal-2024" replace state={{ expired: true }} />;
  }
  
  return children;
}

// CLEAN ROUTE STRUCTURE - NO CONFLICTS
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading text="Loading Rehab Connect..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Routes>
        {/* Landing page - public */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes - REDIRECT IF LOGGED IN */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        />
        
        {/* Public pages */}
        <Route path="/contact" element={
          <>
            <Header />
            <ContactPage />
          </>
        } />
        
        <Route path="/pricing" element={
          <ErrorBoundary>
            <Header />
            <PricingPage />
          </ErrorBoundary>
        } />
        
        <Route path="/privacy" element={
          <>
            <Header />
            <PrivacyPolicy />
          </>
        } />
        
        <Route path="/terms" element={
          <>
            <Header />
            <TermsOfService />
          </>
        } />
        
        {/* Main app - clinic browsing - PROTECTED: Only authenticated users */}
        <Route 
          path="/clinics" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Header />
                <HomePage />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* Protected user routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Header />
                <HomePage />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/user" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Header />
                <UserPortal />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/clinic/:id" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Header />
                <ClinicDetailPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes - COMPLETELY SEPARATE */}
        <Route path="/secure-admin-portal-2024" element={<AdminLoginPage />} />
        <Route 
          path="/admin-dashboard/*" 
          element={
            <AdminRoute>
              <ErrorBoundary>
                <AdminPanel />
              </ErrorBoundary>
            </AdminRoute>
          } 
        />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Single Footer for entire app */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App; 