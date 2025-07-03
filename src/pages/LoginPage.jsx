import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const handleSuccess = (credentialResponse) => {
    // Save user info to localStorage/session (for demo)
    localStorage.setItem("user", JSON.stringify(credentialResponse));
    navigate("/user");
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 px-4">
      <div className="max-w-lg w-full bg-white/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo512.png" alt="Rehab Connect Logo" className="w-12 h-12" />
            <span className="text-4xl font-extrabold text-blue-800 tracking-tight drop-shadow">Rehab Connect</span>
          </div>
          <div className="text-lg text-blue-700 font-semibold mb-1 text-center">Discover Verified P&O and Physiotherapy Clinics</div>
          <div className="text-slate-500 text-center text-base mb-2">Find the best clinics, compare services, and connect with top professionals across India.</div>
        </div>
        <div className="w-full flex flex-col items-center mb-6">
          <div className="text-xl font-bold text-slate-700 mb-2">Sign in to access the portal</div>
          <div className="text-sm text-slate-500 mb-4 text-center">Login to explore premium features, save your history, and personalize your experience.</div>
          <GoogleLogin onSuccess={handleSuccess} onError={() => alert("Login Failed")} width="100%" size="large" shape="pill" theme="filled_blue" />
        </div>
        <button className="mt-2 text-blue-600 hover:underline text-sm" onClick={() => navigate("/register")}>Don't have an account? Register</button>
      </div>
      <div className="mt-10 text-center text-blue-900/80 text-xs font-medium">
        &copy; {new Date().getFullYear()} Rehab Connect. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage; 