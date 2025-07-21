import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiUrl, debugFetch, fetchWithAuth } from "../utils/api";
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
  // User profile fields
  const [profile, setProfile] = useState({ address: '', phone: '', gender: '', name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [clinicDetailsMap, setClinicDetailsMap] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchUserProfile();
    fetchFavorites();
    fetchMyReviews();
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (user?.token) {
        const response = await debugFetch(`${getApiUrl()}/user/history`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const history = await response.json();
          setRecentClinics(history);
          // Fetch clinic names for recent clinics
          const ids = history.map(h => h.clinicId);
          if (ids.length > 0) {
            const details = {};
            await Promise.all(ids.map(async (id) => {
              try {
                const res = await debugFetch(`${getApiUrl()}/clinics/${id}`);
                if (res.ok) {
                  const data = await res.json();
                  details[id] = data.name || id;
                }
              } catch {}
            }));
            setClinicDetailsMap(details);
          }
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

  const fetchUserProfile = async () => {
    if (!user?.token) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await debugFetch(`${getApiUrl()}/user/profile`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          address: data.address || '',
          phone: data.phone || '',
          gender: data.gender || '',
          name: data.name || user.name || '',
          email: data.email || user.email || ''
        });
      }
    } catch {
      setProfileError('Failed to load profile');
    }
    setProfileLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user?.token) return;
    try {
      const res = await fetchWithAuth(`${getApiUrl()}/user/favorites`);
      if (res.ok) {
        setFavorites(await res.json());
      }
    } catch {}
  };

  const fetchMyReviews = async () => {
    if (!user?.token) return;
    try {
      const res = await fetchWithAuth(`${getApiUrl()}/user/my-reviews`);
      if (res.ok) {
        setMyReviews(await res.json());
      }
    } catch {}
  };

  const handleToggleFavorite = async (clinic) => {
    if (!user?.token) return;
    const isFav = favorites.some(f => f.id === clinic.id);
    try {
      const res = await debugFetch(`${getApiUrl()}/user/favorites`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      });
      if (res.ok) {
        fetchFavorites();
      }
    } catch {}
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await debugFetch(`${getApiUrl()}/user/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileSuccess('Profile updated successfully!');
      } else {
        setProfileError('Failed to update profile');
      }
    } catch {
      setProfileError('Failed to update profile');
    }
    setProfileLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { id: 'history', label: 'Recent Views', icon: <FaHistory /> },
    { id: 'favorites', label: 'Favorites', icon: <FaHeart /> },
    { id: 'myreviews', label: 'My Reviews', icon: <FaStar /> },
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
              onClick={() => navigate('/clinics')}
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
                  <p className="text-xs text-gray-500">{clinicDetailsMap[clinic.clinicId] || clinic.clinicId}</p>
                  <p className="text-xs text-gray-400">Viewed: {clinic.viewedAt ? new Date(clinic.viewedAt.seconds ? clinic.viewedAt.seconds * 1000 : clinic.viewedAt).toLocaleString() : ''}</p>
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
            onClick={() => navigate('/clinics')}
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
                  <p className="font-medium">{clinicDetailsMap[item.clinicId] || item.clinicId}</p>
                  <p className="text-xs text-gray-400">Viewed: {item.viewedAt ? new Date(item.viewedAt.seconds ? item.viewedAt.seconds * 1000 : item.viewedAt).toLocaleString() : ''}</p>
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
      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <FaHeart className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No favorite clinics yet</p>
          <button 
            onClick={() => navigate('/clinics')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Find Clinics
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} locked={false} isFavorite={true} onFavorite={handleToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );

  const AppointmentsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
      <div className="text-center py-8">
        <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No appointments scheduled</p>
        <button 
          onClick={() => navigate('/clinics')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );

  const MyReviewsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">My Reviews</h3>
      {myReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No reviews submitted yet.</div>
      ) : (
        <div className="space-y-4">
          {myReviews.map((r, idx) => (
            <div key={r.id || idx} className={`border rounded-lg p-4 bg-slate-50 ${r.flagged ? 'border-red-400 bg-red-50' : ''}`}>
              <div className="font-bold text-blue-800 mb-1">{r.clinicName || r.clinicId}</div>
              <div className="text-sm text-slate-700 mb-1">{r.text}</div>
              <div className="text-xs text-slate-500 mb-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
              {r.reply && (
                <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <span className="font-semibold text-blue-700">Clinic Reply:</span> <span className="text-blue-800">{r.reply}</span>
                </div>
              )}
              {r.flagged && <div className="text-xs text-red-600 mt-1">This review has been flagged as inappropriate.</div>}
            </div>
          ))}
        </div>
      )}
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
                  Welcome back, {user?.name || profile.name || 'User'}!
                </h1>
                <p className="text-gray-600">{user?.email || profile.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/clinics')}
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
          {/* Editable Profile Fields only on button click */}
          {!showProfileEdit && (
            <button onClick={() => setShowProfileEdit(true)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold">Update Profile</button>
          )}
          {showProfileEdit && (
            <form onSubmit={handleProfileSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="border rounded px-3 py-2" required />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Email</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="border rounded px-3 py-2" required disabled />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Phone</label>
                <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className="border rounded px-3 py-2" />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Gender</label>
                <select name="gender" value={profile.gender} onChange={handleProfileChange} className="border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold mb-1">Address</label>
                <input type="text" name="address" value={profile.address} onChange={handleProfileChange} className="border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2 flex gap-4 items-center">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save Profile'}</button>
                <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 font-semibold" onClick={() => setShowProfileEdit(false)} disabled={profileLoading}>Cancel</button>
                {profileSuccess && <span className="text-green-600 font-medium">{profileSuccess}</span>}
                {profileError && <span className="text-red-600 font-medium">{profileError}</span>}
              </div>
            </form>
          )}
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
            {activeTab === 'myreviews' && <MyReviewsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortal; 