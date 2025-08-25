/**
 * Integrated Search Service - Combines all optimized services for best performance
 * Uses Google Maps for accuracy, Firebase for caching, and smart fallbacks
 */

import { OptimizedFirebaseService } from './optimizedFirebaseService';
import { GoogleMapsDistanceService } from './googleMapsService';
import { clinicAPI } from './apiService';
import { calculateAccurateDistance, formatDistance } from './geoUtils';

export class IntegratedSearchService {
  constructor() {
    this.firebaseService = new OptimizedFirebaseService();
    this.googleMapsService = new GoogleMapsDistanceService();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Smart clinic search with automatic location detection and caching
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with enhanced data
   */
  async smartSearch(options = {}) {
    const {
      searchType = 'auto', // 'auto', 'nearby', 'pincode', 'text'
      query = '',
      location = null,
      pincode = '',
      radius = 10,
      isPremium = false,
      useGoogleMaps = true,
      maxResults = null
    } = options;

    try {
      let searchResults;
      let userLocation = location;

      // Auto-detect search type if not specified
      const detectedType = this._detectSearchType(query, pincode, location);
      const finalSearchType = searchType === 'auto' ? detectedType : searchType;

      console.log(`🔍 Integrated search: ${finalSearchType}`, { query, pincode, location });

      // Execute search based on type
      switch (finalSearchType) {
        case 'nearby':
          searchResults = await this._nearbySearch(userLocation, radius, isPremium, useGoogleMaps, maxResults);
          break;
        
        case 'pincode':
          searchResults = await this._pincodeSearch(pincode, isPremium, useGoogleMaps, maxResults);
          userLocation = searchResults.userLocation;
          break;
        
        case 'text':
          searchResults = await this._textSearch(query, isPremium, userLocation, useGoogleMaps, maxResults);
          break;
        
        default:
          searchResults = await this._getAllClinics(isPremium, maxResults);
      }

      // Enhance results with additional data
      const enhancedResults = await this._enhanceResults(
        searchResults,
        userLocation,
        useGoogleMaps,
        isPremium
      );

      return {
        success: true,
        ...enhancedResults,
        searchType: finalSearchType,
        userLocation,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Integrated search error:', error);
      return this._getFallbackResults(options);
    }
  }

  /**
   * Detect search type based on input parameters
   */
  _detectSearchType(query, pincode, location) {
    if (pincode && pincode.length >= 6) return 'pincode';
    if (location && location.lat && location.lng) return 'nearby';
    if (query && query.trim()) return 'text';
    return 'all';
  }

  /**
   * Nearby search with Google Maps enhancement
   */
  async _nearbySearch(location, radius, isPremium, useGoogleMaps, maxResults) {
    if (!location || !location.lat || !location.lng) {
      throw new Error('Valid location required for nearby search');
    }

    // Try backend optimized endpoint first
    try {
      const backendResult = await clinicAPI.getNearbyOptimized(
        location.lat,
        location.lng,
        radius,
        isPremium,
        maxResults
      );

      if (useGoogleMaps && backendResult.clinics.length > 0) {
        // Enhance with Google Maps distances
        const enhancedClinics = await this.googleMapsService.calculateDistancesToClinics(
          location,
          backendResult.clinics
        );
        
        return {
          ...backendResult,
          clinics: enhancedClinics,
          enhanced: true
        };
      }

      return backendResult;

    } catch (error) {
      console.log('Backend nearby search failed, using Firebase service');
      
      // Fallback to Firebase service
      const result = await this.firebaseService.getNearbyWithFilters(
        location, // Pass the complete location object, not individual lat/lng
        { radius, isPremium },
        maxResults || (isPremium ? 50 : 3)
      );

      if (useGoogleMaps) {
        try {
          const enhancedClinics = await this.googleMapsService.calculateDistancesToClinics(
            location,
            result.clinics
          );
          result.clinics = enhancedClinics;
          result.enhanced = true;
        } catch (gmapsError) {
          console.log('Google Maps enhancement failed');
        }
      }

      return result;
    }
  }

  /**
   * Pincode search - Independent of location/distance
   */
  async _pincodeSearch(pincode, isPremium, useGoogleMaps, maxResults) {
    // Use Firebase service for pincode search (independent of location/distance)
    try {
      const result = await this.firebaseService.searchByPincode(pincode, isPremium, maxResults);
      
      // For pincode search, we DON'T add distance calculations
      // Pincode search is location-independent and sorted by relevance
      console.log(`📍 Pincode search completed for ${pincode}: ${result.clinics?.length || 0} results`);
      
      return {
        ...result,
        searchType: 'pincode',
        enhanced: false, // No distance enhancement needed for pincode search
        source: result.source || 'firebase',
        pincode
      };
      
    } catch (error) {
      console.error(`Pincode search failed for ${pincode}:`, error);
      return {
        success: false,
        clinics: [],
        total: 0,
        searchType: 'pincode',
        error: error.message,
        pincode
      };
    }
  }

  /**
   * Text-based search with location context
   */
  async _textSearch(query, isPremium, userLocation, useGoogleMaps, maxResults) {
    // Use Firebase service for text search
    const result = await this.firebaseService.searchClinics(
      query,
      { isPremium },
      maxResults || (isPremium ? 50 : 3)
    );

    // Add distances if user location is available
    if (userLocation && result.clinics.length > 0) {
      if (useGoogleMaps) {
        try {
          const enhancedClinics = await this.googleMapsService.calculateDistancesToClinics(
            userLocation,
            result.clinics
          );
          result.clinics = enhancedClinics;
          result.enhanced = true;
        } catch (gmapsError) {
          // Fallback to Haversine distance
          result.clinics = result.clinics.map(clinic => ({
            ...clinic,
            distance: calculateAccurateDistance(
              userLocation.lat,
              userLocation.lng,
              clinic.lat,
              clinic.lng || clinic.long
            ),
            distanceText: formatDistance(clinic.distance)
          }));
        }
      }
    }

    return {
      ...result,
      query
    };
  }

  /**
   * Get all clinics with optimization
   */
  async _getAllClinics(isPremium, maxResults) {
    try {
      const result = await this.firebaseService.getAllWithFilters(
        { isPremium },
        maxResults || (isPremium ? 100 : 3)
      );
      return result;
    } catch (error) {
      console.log('Firebase service failed, using basic API');
      const clinics = await clinicAPI.getOptimized();
      const limit = maxResults || (isPremium ? 100 : 3);
      
      return {
        clinics: clinics.slice(0, limit),
        total: clinics.length,
        visible: Math.min(clinics.length, limit),
        hidden: Math.max(0, clinics.length - limit),
        hasMore: clinics.length > limit
      };
    }
  }

  /**
   * Enhance search results with additional data
   */
  async _enhanceResults(results, userLocation, useGoogleMaps, isPremium) {
    const enhanced = { ...results };

    // Sort by distance if user location is available
    if (userLocation && enhanced.clinics.length > 0) {
      enhanced.clinics.sort((a, b) => {
        const distA = a.distance || calculateAccurateDistance(
          userLocation.lat, userLocation.lng, a.lat, a.lng || a.long
        );
        const distB = b.distance || calculateAccurateDistance(
          userLocation.lat, userLocation.lng, b.lat, b.lng || b.long
        );
        return distA - distB;
      });
    }

    // Add metadata
    enhanced.metadata = {
      enhanced: enhanced.enhanced || false,
      hasUserLocation: !!userLocation,
      useGoogleMaps,
      isPremium,
      searchTime: Date.now()
    };

    return enhanced;
  }

  /**
   * Fallback results when all services fail
   */
  async _getFallbackResults(options) {
    console.warn('All search services failed, providing basic fallback');
    
    try {
      // First try optimized endpoint
      let basicClinics;
      try {
        basicClinics = await clinicAPI.getOptimized();
      } catch (error) {
        console.warn('Optimized endpoint failed, using basic clinics endpoint');
        // Fallback to basic clinics endpoint with proper URL
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE}/clinics`);
        if (response.ok) {
          const data = await response.json();
          basicClinics = data.clinics || data; // Handle different response formats
        } else {
          throw new Error('Basic clinics endpoint also failed');
        }
      }
      
      const limit = options.isPremium ? 100 : 3;
      
      return {
        success: false,
        clinics: basicClinics.slice(0, limit),
        total: basicClinics.length,
        visible: Math.min(basicClinics.length, limit),
        hidden: Math.max(0, basicClinics.length - limit),
        hasMore: basicClinics.length > limit,
        fallback: true,
        searchType: 'fallback'
      };
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      return {
        success: false,
        clinics: [],
        total: 0,
        visible: 0,
        hidden: 0,
        hasMore: false,
        error: 'All search services unavailable',
        searchType: 'failed'
      };
    }
  }

  /**
   * Get current user location with caching
   */
  async getCurrentLocation() {
    const cacheKey = 'user-location';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: location,
            timestamp: Date.now()
          });
          
          resolve(location);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.firebaseService.clearCache();
    console.log('🧹 Integrated search cache cleared');
  }
}

// Export singleton instance
export const integratedSearchService = new IntegratedSearchService();
export default integratedSearchService;
