import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Manage Clinics", path: "/admin/clinics" },
  { label: "Users", path: "/admin/users" },
  { label: "Settings", path: "/admin/settings" },
];

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_login_time");
    navigate("/admin-secret-login");
  };
  return (
    <nav className="bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-10 w-10 object-contain mr-2" />
          <span className="text-xl font-bold tracking-tight">Admin Panel</span>
        </div>
        <ul className="flex gap-2 text-base font-medium items-center">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-full font-semibold transition border-none outline-none cursor-pointer flex items-center
                  ${location.pathname.startsWith(item.path)
                    ? 'bg-white text-blue-800 shadow'
                    : 'bg-transparent text-white hover:bg-white/20'}
                `}
              >
                {item.label}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full font-semibold transition border-none outline-none cursor-pointer flex items-center bg-red-600 text-white hover:bg-red-700 ml-2"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AdminNavbar; 