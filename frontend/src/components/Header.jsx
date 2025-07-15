import React from "react";
import { FaBell, FaUserCircle, FaClinicMedical } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

function getUserName() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.credential) {
    try {
      const base64Url = user.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.name;
    } catch (e) { return null; }
  }
  return null;
}

const Header = () => {
  const name = getUserName();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  const handleBrowseClinics = () => {
    if (location.pathname === "/clinics") {
      window.location.reload();
    } else {
      navigate("/clinics");
    }
  };
  return (
    <header className="w-full bg-blue-800 text-white shadow-md sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-16 w-16 object-contain mr-2" />
          <button onClick={() => navigate('/')} className="text-2xl font-bold tracking-tight hover:text-blue-200 transition focus:outline-none">Rehab Connect</button>
        </div>
        <ul className="hidden md:flex gap-2 text-base font-medium items-center">
          {[
            { label: 'Home', path: '/' },
            { label: 'Browse Clinics', path: '/clinics', onClick: handleBrowseClinics },
            { label: 'About', path: '#about' },
            { label: 'Contact', path: '#contact' },
          ].map((item) => (
            <li key={item.label}>
              <button
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.path.startsWith('#')) window.location.hash = item.path;
                  else navigate(item.path);
                }}
                className={`px-4 py-2 rounded-full font-semibold transition border-none outline-none cursor-pointer flex items-center
                  ${location.pathname === item.path
                    ? 'bg-white text-blue-800 shadow'
                    : 'bg-transparent text-white hover:bg-white/20'}
                `}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {name && <span className="hidden md:inline text-base font-semibold mr-2">Hello, {name}</span>}
          {name && <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition text-sm font-semibold" onClick={handleLogout}>Logout</button>}
          <button className="relative hover:text-blue-200 transition">
            <FaBell className="text-2xl" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">1</span>
          </button>
          <button className="hover:text-blue-200 transition" onClick={() => navigate("/user") }>
            <FaUserCircle className="text-3xl" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header; 