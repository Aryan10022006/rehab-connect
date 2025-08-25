import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import apiService from "../utils/apiService";
import { FaUserCircle, FaHistory, FaMapMarkerAlt, FaStar, FaHeart, FaSearch, FaChartLine, FaUser, FaPhone, FaUserMd } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const UserPortal = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  // Optimized state management
  const [dashboardData, setDashboardData] = useState({
    profile: { address: '', phone: '', gender: '', name: '', email: '' },
    recentClinics: [],
    favorites: [],
    myReviews: [],
    userStats: { totalViews: 0, favoritesClinics: 0, averageRating: 0 }
  });

  const [ui, setUi] = useState({
    loading: true,
    profileLoading: false,
    showProfileEdit: false,
    profileSuccess: '',
    profileError: '',
    dashboardError: false,
    showDeleteConfirm: false,
    deleteLoading: false
  });

  const [clinicDetailsMap, setClinicDetailsMap] = useState({});

  // MAIN OPTIMIZATION: Load all data in single batch request
  const loadDashboardData = useCallback(async () => {
    // Check if user is authenticated
    if (!user) {
      showError('Please sign in to access your dashboard.');
      setUi(prev => ({ ...prev, loading: false, dashboardError: true }));
      return;
    }

    try {
      setUi(prev => ({ ...prev, loading: true, dashboardError: false }));
      
      const batchData = await apiService.user.getDashboard();
      
      // Extract data from response (backend returns { success: true, data: {...} })
      const responseData = batchData.data || batchData;
      
      // Process profile with safe defaults for new users
      const profile = {
        address: responseData.profile?.address || '',
        phone: responseData.profile?.phone || '',
        gender: responseData.profile?.gender || '',
        name: responseData.profile?.name || user?.name || user?.email?.split('@')[0] || 'User',
        email: responseData.profile?.email || user?.email || '',
        dateJoined: responseData.profile?.dateJoined || responseData.profile?.createdAt || new Date().toISOString()
      };

      // Process data arrays with safe defaults for new users
      const recentClinics = Array.isArray(responseData.recentClinics) ? responseData.recentClinics : [];
      const favorites = Array.isArray(responseData.favorites) ? responseData.favorites : [];
      const myReviews = Array.isArray(responseData.myReviews) ? responseData.myReviews : [];

      // Calculate user stats safely
      const userStats = {
        totalViews: responseData.stats?.totalViewed || recentClinics.length || 0,
        favoritesClinics: responseData.stats?.totalFavorites || favorites.length || 0,
        averageRating: myReviews.length > 0 
          ? (myReviews.reduce((sum, review) => sum + (review.rating || 4), 0) / myReviews.length).toFixed(1)
          : 0,
        totalReviews: responseData.stats?.totalReviews || myReviews.length || 0
      };

      setDashboardData({
        profile,
        recentClinics,
        favorites,
        myReviews,
        userStats
      });

      // Batch fetch clinic details for history
      if (recentClinics.length > 0) {
        await fetchClinicDetailsForHistory(recentClinics);
      }

      setUi(prev => ({ ...prev, loading: false, dashboardError: false }));
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Dashboard loading error:', error);
      
      // Set fallback data for new users or when API fails
      const fallbackProfile = {
        address: '',
        phone: '',
        gender: '',
        name: user?.name || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        dateJoined: new Date().toISOString()
      };

      setDashboardData({
        profile: fallbackProfile,
        recentClinics: [],
        favorites: [],
        myReviews: [],
        userStats: {
          totalViews: 0,
          favoritesClinics: 0,
          averageRating: 0,
          totalReviews: 0
        }
      });

      // Only show error for non-404 errors (404 means new user)
      if (!error.message.includes('404') && !error.message.includes('No document')) {
        setUi(prev => ({ ...prev, dashboardError: true }));
        showError('Failed to load dashboard data. Using default view for new users.');
      }
      
      setUi(prev => ({ ...prev, loading: false }));
    }
  }, [user, showError]); // Dependencies for useCallback

  useEffect(() => {
    if (user?.token) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Update tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'history', 'favorites', 'myreviews'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Optimized clinic details fetching
  const fetchClinicDetailsForHistory = async (historyItems) => {
    try {
      const uniqueIds = [...new Set(historyItems.map(h => h.clinicId))].filter(id => id && id !== 'undefined');
      if (uniqueIds.length === 0) return;

      // Batch fetch clinic names - limit to 10 to avoid rate limiting
      const limitedIds = uniqueIds.slice(0, 10);
      const details = {};
      
      // Use Promise.allSettled to prevent one failure from breaking others
      const responses = await Promise.allSettled(
        limitedIds.map(id => 
          apiService.clinic.getById(id)
            .then(data => ({ id, name: data?.name || data?.clinic?.name || `Clinic ${id}` }))
            .catch(error => {
              console.error(`Failed to fetch clinic ${id}:`, error);
              return { id, name: `Clinic ${id}` };
            })
        )
      );
      
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          details[response.value.id] = response.value.name;
        }
      });
      
      setClinicDetailsMap(details);
    } catch (error) {
      console.error('Failed to fetch clinic details:', error);
      // Don't show error to user, just use IDs as fallback
    }
  };

  const handleToggleFavorite = async (clinic) => {
    if (!user?.token) return;
    try {
      const res = await apiService.user.toggleFavorite(clinic.id);
      if (res.ok) {
        // Refresh only favorites data
        const favResponse = await apiService.user.getFavorites();
        if (favResponse.ok) {
          const favData = await favResponse.json();
          setDashboardData(prev => ({
            ...prev,
            favorites: Array.isArray(favData) ? favData : [],
            userStats: { ...prev.userStats, favoritesClinics: favData.length }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setDashboardData(prev => ({
      ...prev,
      profile: { ...prev.profile, [name]: value }
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setUi(prev => ({ ...prev, profileLoading: true, profileError: '', profileSuccess: '' }));
    
    try {
      const res = await apiService.user.updateProfile(dashboardData.profile);
      if (res.ok) {
        setUi(prev => ({ 
          ...prev, 
          profileSuccess: 'Profile updated successfully!', 
          showProfileEdit: false 
        }));
        setTimeout(() => setUi(prev => ({ ...prev, profileSuccess: '' })), 3000);
      } else {
        setUi(prev => ({ ...prev, profileError: 'Failed to update profile' }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setUi(prev => ({ ...prev, profileError: 'Failed to update profile' }));
    }
    setUi(prev => ({ ...prev, profileLoading: false }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setUi(prev => ({ ...prev, deleteLoading: true }));
    
    try {
      await apiService.user.deleteAccount();
      showSuccess('Account deleted successfully. You will be redirected to the homepage.');
      
      // Sign out user and redirect
      setTimeout(async () => {
        await logout();
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Account deletion error:', error);
      showError('Failed to delete account. Please contact support if the issue persists.');
    } finally {
      setUi(prev => ({ ...prev, deleteLoading: false, showDeleteConfirm: false }));
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { id: 'history', label: 'Recent Views', icon: <FaHistory /> },
    { id: 'favorites', label: 'Favorites', icon: <FaHeart /> },
    { id: 'myreviews', label: 'My Reviews', icon: <FaStar /> },
    { id: 'settings', label: 'Settings', icon: <FaUserCircle /> },
  ];

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Views</p>
            <p className="text-3xl font-bold">{dashboardData.userStats.totalViews}</p>
          </div>
          <FaSearch className="text-3xl text-blue-200" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Favorite Clinics</p>
            <p className="text-3xl font-bold">{dashboardData.userStats.favoritesClinics}</p>
          </div>
          <FaHeart className="text-3xl text-green-200" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Avg. Rating</p>
            <p className="text-3xl font-bold">{dashboardData.userStats.averageRating}</p>
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
              onClick={() => handleTabChange('history')}
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
            {dashboardData.recentClinics.slice(0, 3).map((clinic, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                <FaMapMarkerAlt className="text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Viewed clinic</p>
                  <p className="text-xs text-gray-500">{clinicDetailsMap[clinic.clinicId] || clinic.clinicId}</p>
                  <p className="text-xs text-gray-400">
                    {clinic.viewedAt ? new Date(clinic.viewedAt.seconds ? clinic.viewedAt.seconds * 1000 : clinic.viewedAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
            {dashboardData.recentClinics.length === 0 && (
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
      {dashboardData.recentClinics.length === 0 ? (
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
          {dashboardData.recentClinics.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{clinicDetailsMap[item.clinicId] || item.clinicId}</p>
                  <p className="text-xs text-gray-400">
                    Viewed: {item.viewedAt ? new Date(item.viewedAt.seconds ? item.viewedAt.seconds * 1000 : item.viewedAt).toLocaleString() : ''}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Favorite Clinics</h3>
          <p className="text-gray-600 text-sm mt-1">
            Clinics you've saved for quick access
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {dashboardData.favorites.length} favorite{dashboardData.favorites.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Favorites Content */}
      {dashboardData.favorites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FaHeart className="text-3xl text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your collection of trusted clinics by adding them to your favorites. 
              You can easily bookmark clinics while browsing to access them later.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => navigate('/clinics')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explore Clinics
              </button>
              <button 
                onClick={() => navigate('/search')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Advanced Search
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter and Sort */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="recent">Recently Added</option>
                  <option value="name">Clinic Name</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Total: {dashboardData.favorites.length} clinic{dashboardData.favorites.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.favorites.map((clinic) => (
              <div key={clinic.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{clinic.name}</h4>
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500" />
                        {clinic.address || clinic.city}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(clinic)}
                      className="text-red-500 hover:text-red-600 transition-colors p-2"
                      title="Remove from favorites"
                    >
                      <FaHeart className="text-xl" />
                    </button>
                  </div>

                  {/* Clinic Details */}
                  <div className="space-y-3 mb-4">
                    {clinic.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < Math.floor(clinic.rating) ? 'text-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{clinic.rating}</span>
                        {clinic.noOfReviews && (
                          <span className="text-sm text-gray-500">({clinic.noOfReviews} reviews)</span>
                        )}
                      </div>
                    )}

                    {clinic.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaPhone className="text-green-500" />
                        <a href={`tel:${clinic.phone}`} className="hover:text-blue-600 transition-colors">
                          {clinic.phone}
                        </a>
                      </div>
                    )}

                    {clinic.status && (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          clinic.status.toLowerCase() === 'operational' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          clinic.status.toLowerCase() === 'operational' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {clinic.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/clinic/${clinic.id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {/* Handle contact */}}
                      className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const MyReviewsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">My Reviews</h3>
          <p className="text-gray-600 text-sm mt-1">
            Reviews and ratings you've submitted
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {dashboardData.myReviews.length} review{dashboardData.myReviews.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reviews Content */}
      {dashboardData.myReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FaStar className="text-3xl text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Share your experiences to help other patients make informed decisions. 
              Your reviews make a real difference in the healthcare community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => navigate('/clinics')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Find Clinics to Review
              </button>
              <button 
                onClick={() => navigate('/favorites')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Review Favorites
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter and Sort */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="recent">Most Recent</option>
                  <option value="rating">Rating (High to Low)</option>
                  <option value="clinic">Clinic Name</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Average Rating: 
                  <span className="font-semibold ml-1">
                    {dashboardData.userStats.averageRating || 'N/A'}
                  </span>
                </span>
                <span className="text-sm text-gray-500">
                  Total: {dashboardData.myReviews.length}
                </span>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {dashboardData.myReviews.map((review, idx) => (
              <div 
                key={review.id || idx} 
                className={`bg-white rounded-xl shadow-sm border p-6 ${
                  review.flagged ? 'border-red-200 bg-red-50' : 'hover:shadow-md transition-shadow'
                }`}
              >
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {review.clinicName || `Clinic ${review.clinicId}`}
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={`${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {review.rating}/5
                      </span>
                      <span className="text-sm text-gray-500">
                        {review.visitDate && new Date(review.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                    </div>
                    {review.flagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full mt-1">
                        ⚠️ Under Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                )}

                {/* Review Content */}
                <div className="text-gray-700 leading-relaxed mb-4">
                  {review.text || review.comment}
                </div>

                {/* Clinic Response */}
                {review.reply && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUserMd className="text-blue-600" />
                      <span className="font-semibold text-blue-800">Clinic Response:</span>
                    </div>
                    <p className="text-blue-700">{review.reply}</p>
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigate(`/clinic/${review.clinicId}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      View Clinic
                    </button>
                    <button 
                      onClick={() => {/* Handle edit review */}}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                      Edit Review
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.helpful && (
                      <span>👍 {review.helpful} found this helpful</span>
                    )}
                  </div>
                </div>

                {/* Flag Warning */}
                {review.flagged && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-medium">⚠️ Review Under Moderation</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      This review has been flagged for review by our moderation team. 
                      It may be temporarily hidden from public view.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const SettingsTab = () => {
    const [showAccountDeletion, setShowAccountDeletion] = useState(false);
    const [confirmDeletion, setConfirmDeletion] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleAccountDeletion = async () => {
      if (confirmDeletion !== 'DELETE') {
        alert('Please type "DELETE" to confirm account deletion.');
        return;
      }

      if (!window.confirm('This action cannot be undone. Are you absolutely sure you want to delete your account?')) {
        return;
      }

      setIsDeletingAccount(true);
      try {
        await handleDeleteAccount();
        alert('Account deleted successfully. You will be redirected to the home page.');
        const auth = getAuth();
        await auth.signOut();
        navigate('/');
      } catch (error) {
        console.error('Account deletion error:', error);
        alert('Failed to delete account. Please try again or contact support.');
      } finally {
        setIsDeletingAccount(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-6">Account Settings</h3>
        
        {/* Account Information */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-4 text-gray-800">Account Information</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account Created</label>
                <p className="text-gray-900">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-4 text-gray-800">Data Management</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaUser className="text-blue-600 mt-1 mr-3" />
              <div>
                <h5 className="font-medium text-blue-900">Your Data</h5>
                <p className="text-sm text-blue-700 mt-1">
                  We store your profile information, favorite clinics, and reviews to provide you with a personalized experience.
                  All data is handled according to our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium mb-4 text-red-800">Danger Zone</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-medium text-red-900">Delete Account</h5>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowAccountDeletion(!showAccountDeletion)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Delete Account
              </button>
            </div>

            {/* Account Deletion Confirmation */}
            {showAccountDeletion && (
              <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <div className="mb-4">
                  <h6 className="font-semibold text-red-900 mb-2">⚠️ Warning: This action is irreversible</h6>
                  <div className="text-sm text-red-800 space-y-1">
                    <p>• Your account and profile will be permanently deleted</p>
                    <p>• All your reviews and ratings will be removed</p>
                    <p>• Your favorite clinics list will be deleted</p>
                    <p>• Any subscription data will be cleared</p>
                    <p>• You will not be able to recover this data</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmDeletion}
                    onChange={(e) => setConfirmDeletion(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAccountDeletion}
                    disabled={confirmDeletion !== 'DELETE' || isDeletingAccount}
                    className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center"
                  >
                    {isDeletingAccount ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Confirm Deletion'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountDeletion(false);
                      setConfirmDeletion('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (ui.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show professional error state if dashboard failed to load
  if (ui.dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <FaSearch className="text-red-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Temporarily Unavailable</h1>
          <p className="text-gray-600 mb-8">
            We're experiencing technical difficulties loading your dashboard. This is likely due to database maintenance.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setUi(prev => ({ ...prev, dashboardError: false, loading: true }));
                loadDashboardData();
              }}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Return to Home
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            If the problem persists, please contact support at support@rehabconnect.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(user?.name || dashboardData.profile.name || 'User').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.name || dashboardData.profile.name || 'User'}!
                </h1>
                <p className="text-gray-600">{user?.email || dashboardData.profile.email}</p>
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
          
          {/* Profile Edit Section */}
          {!ui.showProfileEdit && (
            <button 
              onClick={() => setUi(prev => ({ ...prev, showProfileEdit: true }))} 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition font-medium"
            >
              Update Profile
            </button>
          )}
          
          {ui.showProfileEdit && (
            <form onSubmit={handleProfileSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="font-medium mb-1 text-gray-700">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={dashboardData.profile.name} 
                  onChange={handleProfileChange} 
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium mb-1 text-gray-700">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={dashboardData.profile.email} 
                  onChange={handleProfileChange} 
                  className="border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" 
                  disabled 
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium mb-1 text-gray-700">Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={dashboardData.profile.phone} 
                  onChange={handleProfileChange} 
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium mb-1 text-gray-700">Gender</label>
                <select 
                  name="gender" 
                  value={dashboardData.profile.gender} 
                  onChange={handleProfileChange} 
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="font-medium mb-1 text-gray-700">Address</label>
                <textarea 
                  name="address" 
                  value={dashboardData.profile.address} 
                  onChange={handleProfileChange} 
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                />
              </div>
              <div className="md:col-span-2 flex gap-4 items-center">
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium" 
                  disabled={ui.profileLoading}
                >
                  {ui.profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
                <button 
                  type="button" 
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-medium" 
                  onClick={() => setUi(prev => ({ ...prev, showProfileEdit: false }))} 
                  disabled={ui.profileLoading}
                >
                  Cancel
                </button>
                {ui.profileSuccess && <span className="text-green-600 font-medium">{ui.profileSuccess}</span>}
                {ui.profileError && <span className="text-red-600 font-medium">{ui.profileError}</span>}
              </div>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition whitespace-nowrap ${
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
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortal; 