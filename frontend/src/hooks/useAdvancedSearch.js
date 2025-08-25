// Advanced Search Hook for React Frontend
import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { fetchWithAuth } from './api';

export const useAdvancedSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const { showError } = useNotifications();

  // Advanced search with multiple parameters
  const search = useCallback(async (searchParams) => {
    setLoading(true);
    
    try {
      console.log('Performing advanced search:', searchParams);
      
      const response = await fetchWithAuth('/api/clinics/search', {
        method: 'POST',
        body: JSON.stringify(searchParams)
      });
      
      const data = await response.json();
      
      setResults(data.clinics || []);
      setSearchMeta(data.meta || null);
      
      console.log(`Search completed: ${data.clinics?.length || 0} results in ${data.meta?.searchTime || 0}ms`);
      
      return data;

    } catch (error) {
      console.error('Advanced search error:', error);
      showError('Search failed. Please try again.');
      setResults([]);
      setSearchMeta(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Location-based search
  const searchNearby = useCallback(async (lat, lng, radius = 10, filters = {}) => {
    setLoading(true);
    
    try {
      const response = await fetchWithAuth('/api/clinics/nearby', {
        method: 'POST',
        body: JSON.stringify({ lat, lng, radius, filters })
      });
      
      const data = await response.json();
      setResults(data.clinics || []);
      setSearchMeta(data.meta || null);
      
      return data;

    } catch (error) {
      console.error('Nearby search error:', error);
      showError('Location search failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Pincode search
  const searchByPincode = useCallback(async (pincode, limit = 20) => {
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`/api/clinics/pincode/${pincode}?limit=${limit}`);
      const data = await response.json();
      
      setResults(data.clinics || []);
      setSearchMeta(data.meta || null);
      
      return data;

    } catch (error) {
      console.error('Pincode search error:', error);
      showError('Pincode search failed. Please check the pincode and try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Auto-complete suggestions
  const getSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return [];
    }

    try {
      const response = await fetchWithAuth(`/api/clinics/suggestions?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      setSuggestions(data.suggestions || []);
      return data.suggestions || [];

    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
      return [];
    }
  }, []);

  // Get current location for nearby search
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000 // 5 minutes
        }
      );
    });
  }, []);

  // Smart search that determines the best strategy
  const smartSearch = useCallback(async ({ 
    query = '', 
    useLocation = false, 
    pincode = '', 
    filters = {},
    radius = 10,
    limit = 20 
  }) => {
    try {
      let searchParams = {
        query: query.trim(),
        filters,
        limit,
        radius
      };

      // Add location if requested and available
      if (useLocation) {
        try {
          const location = await getCurrentLocation();
          searchParams.lat = location.lat;
          searchParams.lng = location.lng;
          console.log('Using current location:', location);
        } catch (locationError) {
          console.warn('Could not get location:', locationError.message);
        }
      }

      // Add pincode if provided
      if (pincode && pincode.length === 6) {
        searchParams.pincode = pincode;
      }

      // Perform the search
      return await search(searchParams);

    } catch (error) {
      console.error('Smart search error:', error);
      throw error;
    }
  }, [search, getCurrentLocation]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setSearchMeta(null);
    setSuggestions([]);
  }, []);

  return {
    // State
    loading,
    results,
    suggestions,
    searchMeta,
    
    // Actions
    search,
    searchNearby,
    searchByPincode,
    smartSearch,
    getSuggestions,
    getCurrentLocation,
    clearResults
  };
};

// Search utilities
export const searchUtils = {
  // Generate search hash for caching
  generateSearchHash: (params) => {
    const normalized = {
      query: params.query || '',
      lat: params.lat || '',
      lng: params.lng || '',
      pincode: params.pincode || '',
      radius: params.radius || 10,
      filters: params.filters || {}
    };
    return btoa(JSON.stringify(normalized));
  },

  // Format distance for display
  formatDistance: (distance) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  },

  // Extract pincode from text
  extractPincode: (text) => {
    const match = text.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  },

  // Highlight search terms in text
  highlightText: (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  // Debounce function for search input
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

export default useAdvancedSearch;
