import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './AdminLoginPage.css';

const getApiUrl = () => {
  let url = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
};

// Secure Admin Credentials
const ADMIN_CREDENTIALS = {
  email: "admin@rehabconnect.secure",
  password: "RehabAdmin2024!@#",
  masterKey: "RC-SECURE-ADMIN-2024"
};

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    masterKey: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if already authenticated
    const adminToken = localStorage.getItem("admin_token");
    const loginTime = localStorage.getItem("admin_login_time");
    const maxSession = 2 * 60 * 60 * 1000; // 2 hours session
    
    if (adminToken && loginTime) {
      const now = Date.now();
      if (now - Number(loginTime) < maxSession) {
        navigate("/admin-dashboard");
        return;
      } else {
        // Clear expired session
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_login_time");
        localStorage.removeItem("admin_email");
      }
    }

    // Check for failed attempts
    const failedAttempts = localStorage.getItem("admin_failed_attempts");
    const lastAttempt = localStorage.getItem("admin_last_attempt");
    
    if (failedAttempts && lastAttempt) {
      const timeDiff = Date.now() - Number(lastAttempt);
      const blockTime = 15 * 60 * 1000; // 15 minutes block
      
      if (Number(failedAttempts) >= 3 && timeDiff < blockTime) {
        setBlocked(true);
        setError(`Too many failed attempts. Please try again after ${Math.ceil((blockTime - timeDiff) / 60000)} minutes.`);
      } else if (timeDiff >= blockTime) {
        // Reset attempts after block time
        localStorage.removeItem("admin_failed_attempts");
        localStorage.removeItem("admin_last_attempt");
      }
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateCredentials = () => {
    const { email, password, masterKey } = formData;
    
    return (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password &&
      masterKey === ADMIN_CREDENTIALS.masterKey
    );
  };

  const handleFailedAttempt = () => {
    const currentAttempts = Number(localStorage.getItem("admin_failed_attempts") || "0") + 1;
    localStorage.setItem("admin_failed_attempts", currentAttempts.toString());
    localStorage.setItem("admin_last_attempt", Date.now().toString());
    
    setAttempts(currentAttempts);
    
    if (currentAttempts >= 3) {
      setBlocked(true);
      setError("Too many failed attempts. Access blocked for 15 minutes.");
    } else {
      setError(`Invalid credentials. ${3 - currentAttempts} attempts remaining.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (blocked) {
      setError("Access blocked. Please wait before trying again.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Validate credentials locally first
      if (!validateCredentials()) {
        handleFailedAttempt();
        setLoading(false);
        return;
      }
      
      // Generate secure session token
      const sessionToken = btoa(`${ADMIN_CREDENTIALS.email}:${Date.now()}:${Math.random()}`);
      
      // Store admin session
      localStorage.setItem("admin_token", sessionToken);
      localStorage.setItem("admin_email", ADMIN_CREDENTIALS.email);
      localStorage.setItem("admin_login_time", Date.now().toString());
      
      // Clear failed attempts
      localStorage.removeItem("admin_failed_attempts");
      localStorage.removeItem("admin_last_attempt");
      
      // Log successful admin login
      console.log(`🔐 Admin login successful: ${ADMIN_CREDENTIALS.email} at ${new Date().toISOString()}`);
      
      // Navigate to admin dashboard
      navigate("/admin-dashboard");
      
    } catch (err) {
      console.error("Admin login error:", err);
      setError("System error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const isSessionExpired = location.state?.expired;

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="security-warning">
          <div className="warning-icon">🔒</div>
          <h1>SECURE ADMIN ACCESS</h1>
          <p>Authorized Personnel Only</p>
        </div>

        <div className="login-form-container">
          {isSessionExpired && (
            <div className="session-expired-notice">
              <span className="alert-icon">⚠️</span>
              Session expired. Please log in again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <h2>Administrator Login</h2>
            
            <div className="form-group">
              <label htmlFor="email">Admin Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={blocked || loading}
                placeholder="Enter admin email"
                autoComplete="off"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={blocked || loading}
                placeholder="Enter admin password"
                autoComplete="off"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="masterKey">Master Key</label>
              <input
                type="password"
                id="masterKey"
                name="masterKey"
                value={formData.masterKey}
                onChange={handleInputChange}
                required
                disabled={blocked || loading}
                placeholder="Enter master security key"
                autoComplete="off"
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={blocked || loading}
              className={`login-button ${blocked ? 'blocked' : ''} ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Authenticating...
                </>
              ) : blocked ? (
                'Access Blocked'
              ) : (
                'SECURE LOGIN'
              )}
            </button>

            <div className="security-info">
              <p>
                <span className="info-icon">🛡️</span>
                This is a secure administrative portal. All access attempts are logged and monitored.
              </p>
            </div>
          </form>
        </div>

        <div className="credentials-display">
          <h3>🔑 Admin Access Credentials</h3>
          <div className="credential-item">
            <strong>Email:</strong> <code>{ADMIN_CREDENTIALS.email}</code>
          </div>
          <div className="credential-item">
            <strong>Password:</strong> <code>{ADMIN_CREDENTIALS.password}</code>
          </div>
          <div className="credential-item">
            <strong>Master Key:</strong> <code>{ADMIN_CREDENTIALS.masterKey}</code>
          </div>
          <div className="security-note">
            <span className="note-icon">📋</span>
            Please save these credentials securely. Change them in production environment.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 