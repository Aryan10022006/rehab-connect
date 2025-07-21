import React from "react";
import { FaBell, FaUserCircle, FaClinicMedical, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import { fetchWithAuth } from '../utils/api';

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
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (user?.token) {
      fetchWithAuth(`${getApiUrl()}/user/notifications`)
        .then(res => res.ok ? res.json() : [])
        .then(setNotifications)
        .catch(() => setNotifications([]));
    }
  }, [user]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const handleDropdown = () => setShowDropdown(d => !d);
  const handleMarkRead = async (id) => {
    if (!user?.token) return;
    await fetch(`${getApiUrl()}/user/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
  };
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
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 relative">
        <div className="flex items-center gap-3">
          <img src="/robobionicslogo.png" alt="Robo Bionics Logo" className="h-24 w-24 md:h-32 md:w-32 object-contain mr-2 transition-all duration-200" />
          <button onClick={() => navigate('/')} className="text-2xl font-bold tracking-tight hover:text-blue-200 transition focus:outline-none">Rehab Connect</button>
        </div>
        {/* Desktop Nav */}
        <ul className="hidden md:flex gap-2 text-base font-medium items-center">
          {[
            { label: 'Home', path: '/' },
            { label: 'Browse Clinics', path: '/clinics', onClick: handleBrowseClinics },
            { label: 'About', path: '#about' },
            { label: 'Contact', path: '/contact' },
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
        {/* Mobile Hamburger */}
        <button className="md:hidden ml-2 p-2 rounded focus:outline-none hover:bg-blue-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
        </button>
        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-blue-800 shadow-lg z-50 flex flex-col md:hidden animate-fade-in">
            {[
              { label: 'Home', path: '/' },
              { label: 'Browse Clinics', path: '/clinics', onClick: handleBrowseClinics },
              { label: 'About', path: '#about' },
              { label: 'Contact', path: '/contact' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.onClick) item.onClick();
                  else if (item.path.startsWith('#')) window.location.hash = item.path;
                  else navigate(item.path);
                }}
                className={`w-full text-left px-6 py-4 border-b border-blue-700 text-lg font-semibold transition bg-blue-800 hover:bg-blue-700 ${location.pathname === item.path ? 'bg-white text-blue-800' : 'text-white'}`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex items-center gap-4 px-6 py-4">
              {name && <span className="text-base font-semibold">Hello, {name}</span>}
              {name && <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition text-sm font-semibold" onClick={handleLogout}>Logout</button>}
              <button className="hover:text-blue-200 transition" onClick={() => { setMobileMenuOpen(false); navigate("/user"); }}>
                <FaUserCircle className="text-3xl" />
              </button>
              <button className="relative hover:text-blue-200 transition" onClick={handleDropdown}>
                <FaBell className="text-2xl" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unreadCount}</span>}
              </button>
            </div>
          </div>
        )}
        {/* Desktop Icons */}
        <div className="hidden md:flex items-center gap-4">
          {name && <span className="text-base font-semibold mr-2">Hello, {name}</span>}
          {name && <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition text-sm font-semibold" onClick={handleLogout}>Logout</button>}
          <div className="relative">
            <button className="relative hover:text-blue-200 transition" onClick={handleDropdown}>
              <FaBell className="text-2xl" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unreadCount}</span>}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b font-bold text-blue-800">Notifications</div>
                {notifications.length === 0 && <div className="p-3 text-gray-500">No notifications</div>}
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b last:border-b-0 ${!n.read ? 'bg-blue-50' : ''}`}
                    onClick={() => { handleMarkRead(n.id); setShowDropdown(false); }}
                  >
                    <div className="font-semibold">{n.message}</div>
                    <div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="hover:text-blue-200 transition" onClick={() => navigate("/user") }>
            <FaUserCircle className="text-3xl" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header; 