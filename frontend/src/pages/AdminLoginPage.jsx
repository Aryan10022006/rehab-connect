import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "aryanst800@gmail.com"; // Change as needed
const ADMIN_PASSWORD = "aryan123"; // Change as needed

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin", "true");
      localStorage.setItem("admin_login_time", Date.now().toString());
      navigate("/admin");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
      {window.history.state && window.history.state.usr && window.history.state.usr.expired && (
        <div className="mb-4 text-red-600 font-semibold">Session expired. Please log in again.</div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 bg-white p-6 rounded shadow">
        <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="border rounded px-3 py-2" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border rounded px-3 py-2" required />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
};

export default AdminLoginPage; 