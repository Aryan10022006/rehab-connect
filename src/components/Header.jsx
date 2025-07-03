import React from "react";
import { FaBell, FaUserCircle, FaClinicMedical } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <header className="w-full bg-blue-800 text-white shadow-md sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <FaClinicMedical className="text-3xl text-blue-200" />
          <button onClick={() => navigate('/')} className="text-2xl font-bold tracking-tight hover:text-blue-200 transition focus:outline-none">Rehab Connect</button>
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold hidden md:inline">by Robo Bionics</span>
        </div>
        <ul className="hidden md:flex gap-6 text-base font-medium">
          <li><button onClick={() => navigate('/')} className="hover:text-blue-200 transition bg-transparent border-none outline-none cursor-pointer">Home</button></li>
          <li><a href="#clinics" className="hover:text-blue-200 transition">Browse Clinics</a></li>
          <li><a href="#about" className="hover:text-blue-200 transition">About</a></li>
          <li><a href="#contact" className="hover:text-blue-200 transition">Contact</a></li>
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