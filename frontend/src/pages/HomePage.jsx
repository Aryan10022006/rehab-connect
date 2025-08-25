import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/apiService';
import { integratedSearchService } from '../utils/integratedSearchService';
import { distanceService, calculateAccurateDistance, formatDistance } from '../utils/distanceService';
import { FaSearch, FaMapMarkerAlt, FaSpinner, FaStar, FaLock, FaCrown, FaMap, FaList, FaFilter, FaCheckCircle, FaHeart, FaRegHeart } from 'react-icons/fa';
import ClinicMap from "../components/ClinicMap";
import PremiumUpgrade from '../components/PremiumUpgrade';
import PremiumButton, { PremiumBanner } from '../components/PremiumButton';
import { razorpayService, RazorpayService } from '../utils/razorpayService';

// Auto-location service - OPTIMIZED
const locationService = {
  // Get user location automatically
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  },

  // Calculate distance between two points using accurate Haversine formula
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    return calculateAccurateDistance(lat1, lng1, lat2, lng2);
  }
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = RazorpayService.hasActivePremium();
  const freeLimit = 3;

  // CLEAN STATE MANAGEMENT - NO LAG
  const [state, setState] = useState({
    loading: true,
    locationLoading: true,
    clinics: [],
    userLocation: null,
    searchQuery: '',
    pincode: '',
    viewMode: 'both', // 'list', 'map', or 'both'
    showFilters: false,
    filters: {
      verified: false,
      rating: 0,
      distance: isPremium ? 20 : 20, // TEMP: Changed from 5 to 20 for testing
      status: 'all'
    },
    sortBy: 'distance' // 'distance', 'rating', 'name'
  });

  // PREMIUM UPGRADE STATE
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // FAVORITES MANAGEMENT
  const [favorites, setFavorites] = useState([]);

  // Handle premium upgrade
  const handlePremiumUpgrade = async (planDetails) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPaymentLoading(true);
    try {
      const customerInfo = {
        name: user.displayName || user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      };

      const result = await razorpayService.upgradeSubscription(planDetails, customerInfo);
      
      // Success - refresh page to show premium features
      alert('🎉 Premium upgrade successful! You now have unlimited access to all clinics.');
      setShowPremiumModal(false);
      window.location.reload(); // Refresh to update premium status
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Define functions before useEffect calls to avoid "use before define" errors
  // Load user favorites with better error handling
  const loadUserFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Loading user favorites...');
      const userFavorites = await userAPI.getFavorites();
      console.log('User favorites loaded:', userFavorites);
      
      // Handle both clinic objects and clinic IDs
      const favoriteIds = userFavorites.map(fav => {
        if (typeof fav === 'string') return fav;
        return fav.id || fav.clinicId;
      }).filter(Boolean);
      
      setFavorites(favoriteIds);
      console.log('Favorite IDs set:', favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]); // Set empty array on error
    }
  }, [user]);

  const autoLoadNearby = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, locationLoading: true }));
      
      // Try to get user location, with fallback to all clinics
      let userLocation = null;
      try {
        userLocation = await integratedSearchService.getCurrentLocation();
      } catch (error) {
        console.warn('Location access denied or failed, loading all clinics instead:', error);
      }
      
      // Use integrated search service for smart auto-loading
      const searchResult = await integratedSearchService.smartSearch({
        searchType: userLocation ? 'nearby' : 'all', // Fallback to 'all' if no location
        location: userLocation,
        radius: isPremium ? 20 : 20, // TEMP: Changed from 5 to 20 for testing
        isPremium,
        useGoogleMaps: !!userLocation, // Only use Google Maps if we have location
        maxResults: isPremium ? 50 : 3
      });
      
      console.log('✅ Integrated search completed:', searchResult);
      
      setState(prev => ({ 
        ...prev, 
        clinics: searchResult.clinics || [],
        userLocation: searchResult.userLocation,
        loading: false,
        locationLoading: false
      }));
      
    } catch (error) {
      console.log('📍 Auto-load failed, showing fallback interface');
      setState(prev => ({ 
        ...prev, 
        locationLoading: false,
        loading: false
      }));
    }
  }, [isPremium]);

  // Auto-load user location and nearby clinics - OPTIMIZED
  useEffect(() => {
    autoLoadNearby();
  }, [autoLoadNearby]); // Include autoLoadNearby dependency

  useEffect(() => {
    if (user) {
      loadUserFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, loadUserFavorites]); // Include loadUserFavorites dependency

  // Toggle favorite with robust error handling and state management
  const toggleFavorite = async (clinicId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!clinicId) {
      console.error('No clinic ID provided');
      return;
    }

    try {
      const isFavorited = favorites.includes(clinicId);
      console.log(`Toggling favorite for clinic ${clinicId}, currently favorited: ${isFavorited}`);
      
      // Optimistically update UI
      if (isFavorited) {
        setFavorites(prev => prev.filter(id => id !== clinicId));
      } else {
        setFavorites(prev => [...prev, clinicId]);
      }
      
      // Make API call
      if (isFavorited) {
        await userAPI.removeFavorite(clinicId);
        console.log('Removed from favorites:', clinicId);
      } else {
        await userAPI.addFavorite(clinicId);
        console.log('Added to favorites:', clinicId);
      }
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      if (favorites.includes(clinicId)) {
        setFavorites(prev => prev.filter(id => id !== clinicId));
      } else {
        setFavorites(prev => [...prev, clinicId]);
      }
      
      // Show user-friendly error
      alert('Failed to update favorites. Please try again.');
    }
  };

  // Handle pincode search - ENHANCED WITH INTEGRATED SERVICE
  const handlePincodeSearch = async () => {
    if (!state.pincode || state.pincode.length < 6) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Use integrated search service for smart pincode search
      const searchResult = await integratedSearchService.smartSearch({
        searchType: 'pincode',
        pincode: state.pincode,
        isPremium,
        useGoogleMaps: true,
        maxResults: isPremium ? 50 : 3
      });
      
      console.log('✅ Integrated pincode search completed:', searchResult);
      
      setState(prev => ({ 
        ...prev, 
        clinics: searchResult.clinics || [],
        userLocation: searchResult.userLocation,
        loading: false
      }));
      
    } catch (error) {
      console.error('Integrated pincode search error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Apply filters and sorting - PROFESSIONAL & ROBUST
  const getFilteredAndSortedClinics = () => {
    if (!state.clinics || !Array.isArray(state.clinics)) {
      return [];
    }

    let filtered = state.clinics.filter(clinic => {
      if (!clinic) return false;

      // Text search - check multiple fields
      if (state.searchQuery && state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        const searchableText = [
          clinic.name || '',
          clinic.address || '',
          clinic.description || '',
          clinic.specialization || '',
          clinic.services || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Verified filter
      if (state.filters.verified && !clinic.verified) {
        return false;
      }

      // Rating filter - handle missing ratings properly
      if (state.filters.rating > 0) {
        const clinicRating = parseFloat(clinic.rating) || 0;
        if (clinicRating < state.filters.rating) {
          return false;
        }
      }

      // Distance filter - handle missing distances properly
      if (state.filters.distance && state.filters.distance > 0) {
        const clinicDistance = parseFloat(clinic.distance);
        if (isNaN(clinicDistance) || clinicDistance > state.filters.distance) {
          return false;
        }
      }

      // Status filter
      if (state.filters.status && state.filters.status !== 'all') {
        const clinicStatus = (clinic.status || 'operational').toLowerCase();
        if (clinicStatus !== state.filters.status.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Sort clinics with robust sorting logic
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'distance':
          const distA = parseFloat(a.distance) || 999999;
          const distB = parseFloat(b.distance) || 999999;
          if (distA !== distB) return distA - distB;
          // Secondary sort by rating if distances are equal
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
          
        case 'rating':
          const ratingA = parseFloat(a.rating) || 0;
          const ratingB = parseFloat(b.rating) || 0;
          if (ratingA !== ratingB) return ratingB - ratingA;
          // Secondary sort by verification status
          if (a.verified && !b.verified) return -1;
          if (!a.verified && b.verified) return 1;
          return 0;
          
        case 'name':
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
          
        case 'verification':
          // Verified first, then by rating
          if (a.verified && !b.verified) return -1;
          if (!a.verified && b.verified) return 1;
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
          
        default:
          // Default sort: verified first, then by rating, then by distance
          if (a.verified && !b.verified) return -1;
          if (!a.verified && b.verified) return 1;
          
          const defRatingA = parseFloat(a.rating) || 0;
          const defRatingB = parseFloat(b.rating) || 0;
          if (defRatingA !== defRatingB) return defRatingB - defRatingA;
          
          const defDistA = parseFloat(a.distance) || 999999;
          const defDistB = parseFloat(b.distance) || 999999;
          return defDistA - defDistB;
      }
    });

    return filtered;
  };

  const filteredClinics = getFilteredAndSortedClinics();
  const visibleClinics = isPremium ? filteredClinics : filteredClinics.slice(0, freeLimit);
  const blurredClinics = isPremium ? [] : filteredClinics.slice(freeLimit);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div></div> {/* Left spacer */}
          <h1 className="text-4xl font-bold text-gray-900">
            Find Healthcare Near You
          </h1>
          {/* Premium Upgrade Button */}
          {!isPremium && (
            <PremiumButton 
              onClick={() => setShowPremiumModal(true)}
              variant="primary"
              size="medium"
              className="shadow-lg"
            />
          )}
          {isPremium && (
            <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 py-2 rounded-lg">
              <FaCrown className="text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Premium Member</span>
            </div>
          )}
        </div>
        <p className="text-xl text-gray-600 mb-6">
          {!isPremium 
            ? "Automatically discover verified clinics in your area" 
            : "Unlimited access to all clinics and premium features"
          }
        </p>
      </div>

      {/* Location Status */}
      {state.locationLoading && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-blue-600 text-xl" />
            <span className="text-lg text-gray-700">Getting your location...</span>
          </div>
        </div>
      )}

      {/* Persistent Pincode Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 flex items-center gap-3 max-w-md">
            <FaMapMarkerAlt className="text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search clinics by pincode (any area)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={state.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setState(prev => ({ ...prev, pincode: value }));
              }}
              onKeyPress={(e) => e.key === 'Enter' && handlePincodeSearch()}
            />
            <button
              onClick={handlePincodeSearch}
              disabled={state.pincode.length < 6}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 md:mt-0">
            <span>Search by pincode works for any area, not just nearby. </span>
            <span className="text-amber-600">Enter any valid Indian pincode to find clinics in that location.</span>
          </div>
        </div>
      </div>

      {/* Search Bar, Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search and Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics by name or address..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Sort by:</label>
              <select
                value={state.sortBy}
                onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="verification">Verified First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                state.showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FaFilter />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  state.viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <FaList />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, viewMode: 'map' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  state.viewMode === 'map' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <FaMap />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, viewMode: 'both' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  state.viewMode === 'both' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <FaMap />
                <FaList />
                <span className="hidden sm:inline">Both</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {state.showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Verified Filter */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.filters.verified}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, verified: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Verified Only</span>
                    <FaCheckCircle className="text-green-500 text-xs" />
                  </label>
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Rating</label>
                  <select
                    value={state.filters.rating}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      filters: { ...prev.filters, rating: parseFloat(e.target.value) }
                    }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                {/* Distance Filter with Premium Restriction */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max Distance</label>
                  <select
                    value={state.filters.distance}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      filters: { ...prev.filters, distance: parseFloat(e.target.value) }
                    }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={1}>Within 1 km</option>
                    <option value={2}>Within 2 km</option>
                    <option value={3}>Within 3 km</option>
                    <option value={5}>Within 5 km</option>
                    <option value={10} disabled={!isPremium}>Within 10 km {!isPremium && '(Premium)'}</option>
                    <option value={15} disabled={!isPremium}>Within 15 km {!isPremium && '(Premium)'}</option>
                    <option value={20}>Within 20 km</option>
                  </select>
                  {!isPremium && state.filters.distance > 20 && (
                    <p className="text-xs text-amber-600 mt-1">
                      <FaCrown className="inline mr-1" />
                      Premium users can search beyond 20km
                    </p>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select
                    value={state.filters.status}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: e.target.value }
                    }))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Clinics</option>
                    <option value="open">Open Now</option>
                    <option value="operational">Operational</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Loading */}
        {state.loading && (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
            <span className="text-gray-600">Loading clinics...</span>
          </div>
        )}

        {/* No results */}
        {!state.loading && filteredClinics.length === 0 && (
          <div className="text-center py-12">
            <FaMapMarkerAlt className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
            <p className="text-gray-600 mb-4">
              Try searching with a different pincode or expanding your search criteria.
            </p>
          </div>
        )}

        {/* Results Header */}
        {/* Results Section */}
        {filteredClinics.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {state.userLocation ? "Clinics Found" : "Search Results"}
                <span className="text-gray-500 text-base font-normal ml-2">
                  ({filteredClinics.length} found)
                </span>
              </h2>
              
              {/* Premium Status */}
              {!isPremium && filteredClinics.length > freeLimit && (
                <div className="text-sm text-gray-600">
                  Showing {freeLimit} of {filteredClinics.length} clinics
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="text-blue-600 hover:text-blue-700 ml-1 underline"
                  >
                    Upgrade for all
                  </button>
                </div>
              )}
            </div>

            {/* Premium Upgrade Banner */}
            {!isPremium && filteredClinics.length > freeLimit && (
              <PremiumBanner 
                onUpgrade={() => setShowPremiumModal(true)}
                hiddenCount={filteredClinics.length - freeLimit}
              />
            )}
          </>
        )}
        {filteredClinics.length > 0 && (
          <>
            {/* Combined View (Both Map and List) */}
            {state.viewMode === 'both' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FaMap className="text-blue-600" />
                      Map View
                    </h3>
                  </div>
                  <div className="h-[500px] w-full">
                    <ClinicMap
                      clinics={filteredClinics}
                      center={state.userLocation}
                      onMarkerClick={(clinicId) => navigate(`/clinic/${clinicId}`)}
                      blurredClinicIds={blurredClinics.map(c => c.id)}
                    />
                  </div>
                </div>

                {/* List Section */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FaList className="text-blue-600" />
                      List View
                    </h3>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto">
                    <div className="space-y-4">
                      {/* Visible Clinics */}
                      {visibleClinics.map((clinic) => (
                        <SimpleClinicCard
                          key={clinic.id}
                          clinic={clinic}
                          onClick={() => navigate(`/clinic/${clinic.id}`)}
                          isFavorite={favorites.includes(clinic.id)}
                          onFavorite={() => toggleFavorite(clinic.id)}
                          showFavoriteButton={!!user}
                        />
                      ))}

                      {/* Blurred Premium Clinics */}
                      {blurredClinics.length > 0 && (
                        <div className="text-center py-3 border-t border-gray-200">
                          <FaLock className="text-gray-400 text-lg mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            {blurredClinics.length} more clinics available
                          </p>
                          <button
                            onClick={() => setShowPremiumModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded text-sm hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 mx-auto"
                          >
                            <FaCrown className="text-yellow-300" />
                            Upgrade to Premium
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map Only View */}
            {state.viewMode === 'map' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-[600px] w-full">
                  <ClinicMap
                    clinics={filteredClinics}
                    center={state.userLocation}
                    onMarkerClick={(clinicId) => navigate(`/clinic/${clinicId}`)}
                    blurredClinicIds={blurredClinics.map(c => c.id)}
                  />
                </div>
              </div>
            )}

            {/* List Only View */}
            {state.viewMode === 'list' && (
              <div className="space-y-4">
                {visibleClinics.map((clinic) => (
                  <SimpleClinicCard
                    key={clinic.id}
                    clinic={clinic}
                    onClick={() => navigate(`/clinic/${clinic.id}`)}
                    isFavorite={favorites.includes(clinic.id)}
                    onFavorite={() => toggleFavorite(clinic.id)}
                    showFavoriteButton={!!user}
                  />
                ))}

                {/* Premium Upsell */}
                {blurredClinics.length > 0 && (
                  <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                    <FaLock className="text-blue-500 text-3xl mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {blurredClinics.length} More Clinics Available
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Premium to see all clinics in your area
                    </p>
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <FaCrown className="text-yellow-300" />
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgrade
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={(response) => {
          console.log('Premium upgrade successful:', response);
          // Refresh user premium status if needed
          setShowPremiumModal(false);
        }}
      />
    </div>
  );
};

// Professional clinic card component
const SimpleClinicCard = ({ 
  clinic, 
  onClick, 
  isFavorite = false, 
  onToggleFavorite, 
  showFavoriteButton = false 
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favoriteLoading || !onToggleFavorite) return;
    
    setFavoriteLoading(true);
    try {
      await onToggleFavorite();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
    >
      {/* Favorite Button */}
      {showFavoriteButton && (
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 ${
            favoriteLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : isFavorite
              ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favoriteLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
          ) : isFavorite ? (
            <FaHeart className="w-4 h-4" />
          ) : (
            <FaRegHeart className="w-4 h-4" />
          )}
        </button>
      )}
      
      <div className={`${showFavoriteButton ? 'pr-12' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {clinic.name}
          </h3>
          {clinic.verified && (
            <FaCheckCircle className="text-green-500 flex-shrink-0 ml-2" />
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {clinic.address}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Rating */}
            {clinic.rating && (
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-400 text-sm" />
                <span className="text-sm font-medium text-gray-700">
                  {clinic.rating.toFixed(1)}
                </span>
              </div>
            )}
            
            {/* Distance */}
            {clinic.distance && (
              <span className="text-sm text-gray-500">
                {formatDistance(clinic.distance)} away
              </span>
            )}
          </div>
          
          {/* Status */}
          {clinic.status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clinic.status)}`}>
              {clinic.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
