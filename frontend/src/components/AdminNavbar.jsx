import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Manage Clinics", path: "/admin/clinics" },
  { label: "Users", path: "/admin/users" },
  { label: "Reviews", path: "/admin/reviews" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <nav className="bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 relative">
        <div className="flex items-center gap-4">
          <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-24 w-24 md:h-32 md:w-32 object-contain mr-2 transition-all duration-200" />
          <span className="text-xl font-bold tracking-tight">Admin Panel</span>
        </div>
        {/* Desktop Nav */}
        <ul className="hidden md:flex gap-2 text-base font-medium items-center">
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
        {/* Mobile Hamburger */}
        <button className="md:hidden ml-2 p-2 rounded focus:outline-none hover:bg-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
        </button>
        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-gray-900 shadow-lg z-50 flex flex-col md:hidden animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}
                className={`w-full text-left px-6 py-4 border-b border-gray-800 text-lg font-semibold transition bg-gray-900 hover:bg-gray-800 ${location.pathname.startsWith(item.path) ? 'bg-white text-blue-800' : 'text-white'}`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full text-left px-6 py-4 text-lg font-semibold bg-red-600 hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar; 