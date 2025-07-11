import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle, FaHistory, FaMapMarkerAlt, FaStar, FaHeart, FaSearch, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import ClinicCard from "../components/ClinicCard";

const UserPortal = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentClinics, setRecentClinics] = useState([]);
  const [userStats, setUserStats] = useState({
    totalViews: 0,
    favoritesClinics: 0,
    averageRating: 0
  });

  useEffect(() => {
    // Fetch user's recent clinics and stats
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (user?.token) {
        const response = await fetch('/api/user/history', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const history = await response.json();
          setRecentClinics(history);
          setUserStats({
            totalViews: history.length,
            favoritesClinics: 0, // To be implemented
            averageRating: 4.2 // Sample data
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { id: 'history', label: 'Recent Views', icon: <FaHistory /> },
    { id: 'favorites', label: 'Favorites', icon: <FaHeart /> },
    { id: 'appointments', label: 'Appointments', icon: <FaCalendarAlt /> }
  ];

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Views</p>
            <p className="text-3xl font-bold">{userStats.totalViews}</p>
          </div>
          <FaSearch className="text-3xl text-blue-200" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Favorite Clinics</p>
            <p className="text-3xl font-bold">{userStats.favoritesClinics}</p>
          </div>
          <FaHeart className="text-3xl text-green-200" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Avg. Rating</p>
            <p className="text-3xl font-bold">{userStats.averageRating}</p>
          </div>
          <FaStar className="text-3xl text-purple-200" />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div>
      <QuickStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <FaSearch className="text-blue-600" />
              <span className="font-medium">Find Clinics</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <FaHistory className="text-gray-600" />
              <span className="font-medium">View History</span>
            </button>
            <button 
              onClick={() => setActiveTab('appointments')}
              className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <FaCalendarAlt className="text-green-600" />
              <span className="font-medium">Appointments</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentClinics.slice(0, 3).map((clinic, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                <FaMapMarkerAlt className="text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Viewed clinic</p>
                  <p className="text-xs text-gray-500">ID: {clinic.clinicId}</p>
                </div>
              </div>
            ))}
            {recentClinics.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const HistoryTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Recently Viewed Clinics</h3>
      {recentClinics.length === 0 ? (
        <div className="text-center py-8">
          <FaHistory className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No clinics viewed yet</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Start Exploring
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recentClinics.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Clinic ID: {item.clinicId}</p>
                  <p className="text-sm text-gray-500">
                    Viewed: {new Date(item.viewedAt?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/clinic/${item.clinicId}`)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const FavoritesTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Favorite Clinics</h3>
      <div className="text-center py-8">
        <FaHeart className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No favorite clinics yet</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Find Clinics
        </button>
      </div>
    </div>
  );

  const AppointmentsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
      <div className="text-center py-8">
        <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No appointments scheduled</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUserCircle className="text-3xl text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.name || 'User'}!
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Find Clinics
              </button>
              <button 
                onClick={handleLogout}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'favorites' && <FavoritesTab />}
            {activeTab === 'appointments' && <AppointmentsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortal; 