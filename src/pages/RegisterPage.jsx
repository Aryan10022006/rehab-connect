import React from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-bold mb-6">Register for Rehab Connect</h2>
      <p className="mb-4">Registration is handled via Google. Please use the login page to sign in with your Google account.</p>
      <button className="text-blue-600 hover:underline" onClick={() => navigate("/login")}>Go to Login</button>
    </div>
  );
};

export default RegisterPage; 