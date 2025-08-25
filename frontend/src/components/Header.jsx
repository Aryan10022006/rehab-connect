import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RazorpayService } from '../utils/razorpayService';
import { 
  FaHome, 
  FaHospital, 
  FaPhone, 
  FaUser, 
  FaHeart, 
  FaStar, 
  FaHistory, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaCrown
} from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef(null);
  
  // Check premium status
  const isPremium = RazorpayService.hasActivePremium();
  const subscriptionDetails = RazorpayService.getSubscriptionDetails();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActivePath = (path) => location.pathname === path;

  const NavLink = ({ to, children, icon: Icon, mobile = false, onClick }) => {
    const isActive = isActivePath(to);
    
    const baseClasses = mobile 
      ? "flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200 font-medium"
      : "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
    
    const activeClasses = isActive
      ? mobile 
        ? "bg-blue-50 text-blue-600"
        : "bg-white text-blue-600 shadow-lg"
      : mobile
        ? "text-gray-700 hover:bg-blue-50"
        : "text-white hover:bg-blue-700 hover:text-white";

    return (
      <Link
        to={to}
        className={`${baseClasses} ${activeClasses}`}
        onClick={onClick}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{children}</span>
      </Link>
    );
  };

  // Dynamic navigation based on user status
  const getHomeRoute = () => {
    if (user) {
      // If logged in, Home should go to dashboard
      return "/user";
    }
    return "/";
  };

  return (
    <>
      {/* Fixed navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-blue-600/95 shadow-2xl backdrop-blur-lg border-b border-blue-700' : 'bg-blue-600/90 backdrop-blur-md shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Professional Logo */}
            <Link to={getHomeRoute()} className="flex items-center space-x-3 group">
              <div className="relative flex items-center justify-center w-12 h-12 bg-transparent rounded-xl">
                <img 
                  src="/robobionicslogo.png" 
                  alt="RehabConnect Logo" 
                  className="w-10 h-10 object-contain transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
                  style={{ filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  onError={(e) => {
                    // Hide image and show fallback
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="logo-fallback hidden absolute inset-0 items-center justify-center bg-white text-blue-600 rounded-xl font-bold text-lg transition-all duration-300 group-hover:scale-110 shadow-lg"
                  style={{ display: 'none' }}
                >
                  RC
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors duration-200">
                  RehabConnect
                </h1>
                <p className="text-xs text-blue-100 -mt-1 hidden sm:block">Professional Healthcare Network</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink to={getHomeRoute()} icon={FaHome}>
                {user ? 'Dashboard' : 'Home'}
              </NavLink>
              <NavLink to="/clinics" icon={FaHospital}>
                Find Clinics
              </NavLink>
              <NavLink to="/contact" icon={FaPhone}>
                Contact
              </NavLink>
            </nav>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-blue-100 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm border border-blue-600"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <FaUser className="text-blue-600 text-sm" />
                    </div>
                    <span className="font-medium truncate max-w-32">
                      {user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </span>
                    <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full">
                            <FaCrown className="text-yellow-500" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            Free Plan
                          </span>
                        )}
                        {isPremium && subscriptionDetails.expiresAt && (
                          <span className="text-xs text-gray-500">
                            Until {new Date(subscriptionDetails.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      to="/user"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FaUser className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    
                    <Link
                      to="/user?tab=favorites"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FaHeart className="w-4 h-4" />
                      <span>My Favorites</span>
                    </Link>
                    
                    <Link
                      to="/user?tab=reviews"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FaStar className="w-4 h-4" />
                      <span>My Reviews</span>
                    </Link>
                    
                    <Link
                      to="/user?tab=history"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FaHistory className="w-4 h-4" />
                      <span>Visit History</span>
                    </Link>
                    
                    {!user.isPremium && (
                      <Link
                        to="/pricing"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-200 border-t border-gray-100 mt-2 pt-3"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaStar className="w-4 h-4" />
                        <span>Upgrade to Premium</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-white hover:text-blue-100 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-blue-100 p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg rounded-lg mt-2 mb-4 overflow-hidden shadow-xl border border-gray-200/50">
            <nav className="py-2">
              <NavLink to={getHomeRoute()} icon={FaHome} mobile onClick={() => setMobileMenuOpen(false)}>
                {user ? 'Dashboard' : 'Home'}
              </NavLink>
              <NavLink to="/clinics" icon={FaHospital} mobile onClick={() => setMobileMenuOpen(false)}>
                Find Clinics
              </NavLink>
              <NavLink to="/contact" icon={FaPhone} mobile onClick={() => setMobileMenuOpen(false)}>
                Contact
              </NavLink>
              
              {user ? (
                <>
                  <div className="border-t border-gray-200/50 my-2"></div>
                  <div className="px-4 py-2">
                    <p className="text-gray-700 text-sm font-medium truncate">{user.name || user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {user.isPremium ? 'Premium' : 'Free Plan'}
                    </span>
                  </div>
                  <NavLink to="/user" icon={FaUser} mobile onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/user?tab=favorites" icon={FaHeart} mobile onClick={() => setMobileMenuOpen(false)}>
                    Favorites
                  </NavLink>
                  <NavLink to="/user?tab=reviews" icon={FaStar} mobile onClick={() => setMobileMenuOpen(false)}>
                    Reviews
                  </NavLink>
                  {!user.isPremium && (
                    <NavLink to="/pricing" icon={FaStar} mobile onClick={() => setMobileMenuOpen(false)}>
                      Upgrade to Premium
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200/50 my-2"></div>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    
    {/* Spacer to prevent content from hiding under fixed header */}
    <div className="h-16"></div>
    </>
  );
};

export default Header;
