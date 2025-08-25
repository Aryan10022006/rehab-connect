// Optimized Firebase query service with caching and smart filtering
class OptimizedFirebaseService {
  constructor() {
    this.API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.cache = {
      clinics: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      pincodeCache: new Map(),
      locationCache: new Map(),
      textCache: new Map(),
      allCache: new Map()
    };
  }

  // Check if cache is valid
  isCacheValid() {
    return this.cache.clinics && 
           this.cache.lastFetch && 
           (Date.now() - this.cache.lastFetch) < this.cache.cacheDuration;
  }

  // Get optimized clinic data with smart caching
  async getOptimizedClinics(forceRefresh = false) {
    // Return cached data if valid
    if (!forceRefresh && this.isCacheValid()) {
      console.log('📦 Returning cached clinic data');
      return this.cache.clinics;
    }

    try {
      const response = await fetch(`${this.API_BASE}/clinics/optimized`);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      
      const data = await response.json();
      
      // Update cache
      this.cache.clinics = data.clinics || [];
      this.cache.lastFetch = Date.now();
      
      console.log(`📥 Fetched ${this.cache.clinics.length} clinics from server`);
      return this.cache.clinics;
    } catch (error) {
      console.error('Error fetching optimized clinics:', error);
      // Return cached data if available, even if expired
      return this.cache.clinics || [];
    }
  }

  // Smart search by pincode with caching
  async searchByPincode(pincode, isPremium = false, limit = null) {
    const cacheKey = `pincode_${pincode}_${isPremium}_${limit}`;
    
    // Check pincode cache
    if (this.cache.pincodeCache.has(cacheKey)) {
      const cached = this.cache.pincodeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cache.cacheDuration) {
        console.log(`📦 Returning cached pincode search for ${pincode}`);
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        pincode,
        isPremium: isPremium.toString(),
        ...(limit && { limit: limit.toString() })
      });

      const response = await fetch(`${this.API_BASE}/clinics/search-by-pincode?${params}`);
      if (!response.ok) throw new Error('Failed to search by pincode');
      
      const data = await response.json();
      
      // Cache the result
      this.cache.pincodeCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`🔍 Found ${data.clinics?.length || 0} clinics for pincode ${pincode} (Backend)`);
      return data;
    } catch (error) {
      console.warn(`Backend pincode search failed for ${pincode}, using client-side fallback:`, error.message);
      
      // Fallback to client-side pincode matching
      return await this.searchPincodeClientSide(pincode, isPremium, limit, cacheKey);
    }
  }

  // Client-side pincode search fallback - independent of distance/location
  async searchPincodeClientSide(pincode, isPremium = false, limit = null, cacheKey) {
    try {
      // Get all clinics from cache or fetch
      const allClinics = await this.getAllClinics();
      
      // Enhanced pincode matching logic - NO distance filtering
      const matchingClinics = allClinics.filter(clinic => {
        const clinicPincode = clinic.pincode?.toString() || '';
        const searchPincode = pincode.toString();
        
        // Exact match - highest priority
        if (clinicPincode === searchPincode) return true;
        
        // Location contains pincode
        if (clinic.location?.toLowerCase().includes(searchPincode)) return true;
        
        // Address contains pincode
        if (clinic.address?.toLowerCase().includes(searchPincode)) return true;
        
        // Area code match (first 3 digits)
        if (clinicPincode.length >= 3 && searchPincode.length >= 3) {
          const clinicArea = clinicPincode.substring(0, 3);
          const searchArea = searchPincode.substring(0, 3);
          if (clinicArea === searchArea) return true;
        }
        
        // Partial pincode match for flexible search
        if (searchPincode.length >= 4) {
          if (clinicPincode.startsWith(searchPincode) || 
              searchPincode.startsWith(clinicPincode.substring(0, 4))) {
            return true;
          }
        }
        
        return false;
      });

      // Smart sorting by relevance (NOT by distance)
      const sortedClinics = matchingClinics.sort((a, b) => {
        const aPincode = a.pincode?.toString() || '';
        const bPincode = b.pincode?.toString() || '';
        const searchPincode = pincode.toString();
        
        let aScore = 0;
        let bScore = 0;
        
        // Exact pincode match gets highest priority
        if (aPincode === searchPincode) aScore += 100;
        if (bPincode === searchPincode) bScore += 100;
        
        // Partial matches
        if (aPincode.startsWith(searchPincode)) aScore += 50;
        if (bPincode.startsWith(searchPincode)) bScore += 50;
        
        // Area code matches
        if (aPincode.substring(0, 3) === searchPincode.substring(0, 3)) aScore += 25;
        if (bPincode.substring(0, 3) === searchPincode.substring(0, 3)) bScore += 25;
        
        // Verified clinics bonus
        if (a.verified) aScore += 20;
        if (b.verified) bScore += 20;
        
        // Rating bonus
        aScore += (a.rating || 0) * 5;
        bScore += (b.rating || 0) * 5;
        
        return bScore - aScore;
      });

      // Apply freemium limits (no distance constraints)
      const resultLimit = isPremium ? (limit || 50) : 3;
      const visibleClinics = sortedClinics.slice(0, resultLimit);
      const totalClinics = sortedClinics.length;
      const hiddenCount = Math.max(0, totalClinics - resultLimit);

      const result = {
        success: true,
        clinics: visibleClinics,
        total: totalClinics,
        visible: visibleClinics.length,
        hidden: hiddenCount,
        hasMore: hiddenCount > 0,
        isPremium,
        searchType: 'pincode',
        pincode,
        source: 'client-side',
        // Note: NO distance filter applied - pincode search is location-independent
        filters: {
          pincode: pincode,
          exactMatches: sortedClinics.filter(c => c.pincode === pincode).length,
          proximityMatches: sortedClinics.filter(c => c.pincode?.substring(0, 3) === pincode.substring(0, 3)).length
        }
      };

      // Cache the client-side result
      this.cache.pincodeCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`📍 Found ${visibleClinics.length}/${totalClinics} clinics for pincode ${pincode} (Client-side)`);
      return result;
      
    } catch (error) {
      console.error('Client-side pincode search failed:', error);
      return {
        success: false,
        clinics: [],
        total: 0,
        visible: 0,
        hidden: 0,
        hasMore: false,
        error: 'Pincode search failed',
        searchType: 'pincode',
        pincode,
        source: 'client-side'
      };
    }
  }

  // General text search for clinics
  async searchClinics(query, options = {}, limit = null) {
    const { isPremium = false } = options;
    const cacheKey = `text_${query}_${isPremium}_${limit}`;
    
    // Check text search cache
    if (this.cache.textCache.has(cacheKey)) {
      const cached = this.cache.textCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cache.cacheDuration) {
        console.log(`📦 Returning cached text search for "${query}"`);
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        q: query,
        isPremium: isPremium.toString(),
        ...(limit && { limit: limit.toString() })
      });

      const response = await fetch(`${this.API_BASE}/clinics/search?${params}`);
      if (!response.ok) {
        // If backend search fails, try pincode search as fallback
        if (query.match(/^\d{4,6}$/)) {
          console.log('🔄 Falling back to pincode search for numeric query');
          return await this.searchByPincode(query, isPremium, limit);
        }
        throw new Error('Failed to search clinics');
      }

      const data = await response.json();

      // Cache successful results
      if (!this.cache.textCache) {
        this.cache.textCache = new Map();
      }
      
      this.cache.textCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`🔍 Found ${data.clinics?.length || 0} clinics for query "${query}"`);
      return data;
    } catch (error) {
      console.error('Error searching clinics:', error);
      
      // Fallback to pincode search if query looks like a pincode
      if (query.match(/^\d{4,6}$/)) {
        console.log('🔄 Using pincode search as final fallback');
        return await this.searchByPincode(query, isPremium, limit);
      }
      
      return { clinics: [], total: 0, hasMore: false };
    }
  }

  // Advanced nearby search with filters
  async getNearbyWithFilters(userLocation, options = {}, maxResults = null) {
    // Validate userLocation
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      console.error('❌ Invalid userLocation provided to getNearbyWithFilters:', userLocation);
      return { clinics: [], total: 0, success: false };
    }
    
    const { 
      radius = 20, 
      isPremium = false,
      filters = {}
    } = options;
    
    try {
      const response = await fetch(`${this.API_BASE}/clinics/nearby-optimized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius,
          isPremium,
          limit: maxResults,
          filters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get nearby clinics with filters');
      }

      const data = await response.json();
      console.log(`🏥 Found ${data.clinics?.length || 0} nearby clinics with filters`);
      return data;
    } catch (error) {
      console.error('Error getting nearby clinics with filters:', error);
      // Fallback to basic nearby search - but only if we have valid coordinates
      if (userLocation && userLocation.lat && userLocation.lng) {
        return await this.searchNearby(userLocation.lat, userLocation.lng, radius, isPremium, maxResults);
      } else {
        // If no valid location, return empty results
        return { clinics: [], total: 0, success: false, error: 'No valid location provided' };
      }
    }
  }

  // Smart nearby search with location caching
  async searchNearby(lat, lng, radius, isPremium = false, limit = null) {
    // Validate inputs
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('❌ Invalid coordinates provided to searchNearby:', { lat, lng });
      return { clinics: [], total: 0, success: false };
    }
    
    const validLat = parseFloat(lat);
    const validLng = parseFloat(lng);
    const cacheKey = `location_${validLat.toFixed(3)}_${validLng.toFixed(3)}_${radius}_${isPremium}_${limit}`;
    
    // Check location cache
    if (this.cache.locationCache.has(cacheKey)) {
      const cached = this.cache.locationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cache.cacheDuration) {
        console.log('📦 Returning cached location search');
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.API_BASE}/clinics/nearby-optimized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: validLat,
          lng: validLng,
          radius,
          isPremium,
          ...(limit && { limit })
        })
      });

      if (!response.ok) throw new Error('Failed to search nearby');
      
      const data = await response.json();
      
      // Cache the result
      this.cache.locationCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`📍 Found ${data.clinics?.length || 0} nearby clinics`);
      return data;
    } catch (error) {
      console.error('Error searching nearby:', error);
      return { clinics: [], total: 0, hasMore: false };
    }
  }

  // Apply freemium rules client-side for cached data
  applyFreemiumRules(clinics, isPremium = false, limit = 3) {
    if (isPremium) {
      return {
        visibleClinics: clinics,
        blurredClinics: [],
        hasMore: false
      };
    }

    const visibleClinics = clinics.slice(0, limit);
    const blurredClinics = clinics.slice(limit).map(clinic => ({
      ...clinic,
      id: `blurred_${Math.random()}`,
      name: '*** Premium Clinic ***',
      address: 'Upgrade to see full details',
      phone: 'Hidden',
      website: 'Hidden',
      isBlurred: true,
      originalId: clinic.id
    }));

    return {
      visibleClinics,
      blurredClinics,
      hasMore: blurredClinics.length > 0
    };
  }

  // Smart filtering with multiple criteria
  filterClinics(clinics, filters = {}) {
    let filtered = [...clinics];

    // Filter by verification status
    if (filters.verified !== undefined) {
      filtered = filtered.filter(clinic => clinic.verified === filters.verified);
    }

    // Filter by rating
    if (filters.minRating) {
      filtered = filtered.filter(clinic => 
        (clinic.rating || 0) >= filters.minRating
      );
    }

    // Filter by services
    if (filters.services && filters.services.length > 0) {
      filtered = filtered.filter(clinic => {
        const clinicServices = clinic.services || [];
        return filters.services.some(service => 
          clinicServices.some(cs => 
            cs.toLowerCase().includes(service.toLowerCase())
          )
        );
      });
    }

    // Filter by specialization
    if (filters.specialization) {
      filtered = filtered.filter(clinic => {
        const spec = clinic.specialization || '';
        return spec.toLowerCase().includes(filters.specialization.toLowerCase());
      });
    }

    // Filter by operational status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(clinic => {
        const status = clinic.status || 'unknown';
        return status.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Filter by distance (if provided)
    if (filters.maxDistance && typeof filters.maxDistance === 'number') {
      filtered = filtered.filter(clinic => {
        const distance = clinic.distance || clinic.roadDistance;
        return distance && distance <= filters.maxDistance;
      });
    }

    // Filter by emergency services
    if (filters.emergencyServices) {
      filtered = filtered.filter(clinic => clinic.emergency_services === true);
    }

    // Filter by insurance acceptance
    if (filters.insuranceAccepted) {
      filtered = filtered.filter(clinic => clinic.insurance_accepted === true);
    }

    return filtered;
  }

  // Smart sorting with multiple options
  sortClinics(clinics, sortBy = 'distance') {
    const sorted = [...clinics];

    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = a.roadDistance || a.distance || Infinity;
          const distB = b.roadDistance || b.distance || Infinity;
          return distA - distB;
        });

      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA; // Descending
        });

      case 'name':
        return sorted.sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );

      case 'verified':
        return sorted.sort((a, b) => {
          if (a.verified && !b.verified) return -1;
          if (!a.verified && b.verified) return 1;
          return 0;
        });

      case 'reviews':
        return sorted.sort((a, b) => {
          const reviewsA = a.noOfReviews || 0;
          const reviewsB = b.noOfReviews || 0;
          return reviewsB - reviewsA; // Descending
        });

      default:
        return sorted;
    }
  }

  // Get all clinics with filters applied
  async getAllWithFilters(options = {}, maxResults = null) {
    const { 
      isPremium = false,
      filters = {},
      sortBy = 'rating'
    } = options;
    
    const cacheKey = `all_${JSON.stringify(filters)}_${sortBy}_${isPremium}_${maxResults}`;
    
    // Check cache first
    if (this.cache.allCache && this.cache.allCache.has(cacheKey)) {
      const cached = this.cache.allCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cache.cacheDuration) {
        console.log('📦 Returning cached all clinics with filters');
        return cached.data;
      }
    }

    try {
      // Get all clinics from API
      const response = await fetch(`${this.API_BASE}/clinics`);
      if (!response.ok) {
        throw new Error('Failed to get all clinics');
      }

      const allClinics = await response.json();
      
      // Apply filters
      let filteredClinics = this.filterClinics(allClinics, filters);
      
      // Sort clinics
      filteredClinics = this.sortClinics(filteredClinics, sortBy);
      
      // Apply freemium limits
      const resultLimit = isPremium ? (maxResults || 50) : 3;
      const visibleClinics = filteredClinics.slice(0, resultLimit);
      const totalClinics = filteredClinics.length;
      const hiddenCount = Math.max(0, totalClinics - resultLimit);

      const result = {
        clinics: visibleClinics,
        total: totalClinics,
        visible: visibleClinics.length,
        hidden: hiddenCount,
        hasMore: hiddenCount > 0,
        isPremium
      };

      // Cache the result
      if (!this.cache.allCache) {
        this.cache.allCache = new Map();
      }
      
      this.cache.allCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`🏥 Found ${totalClinics} clinics with filters, showing ${visibleClinics.length}`);
      return result;
    } catch (error) {
      console.error('Error getting all clinics with filters:', error);
      return { clinics: [], total: 0, visible: 0, hidden: 0, hasMore: false };
    }
  }

  // Pagination helper
  paginateClinics(clinics, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      clinics: clinics.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(clinics.length / limit),
        totalItems: clinics.length,
        hasNext: endIndex < clinics.length,
        hasPrev: page > 1
      }
    };
  }

  // Clear specific cache
  clearCache(type = 'all') {
    switch (type) {
      case 'clinics':
        this.cache.clinics = null;
        this.cache.lastFetch = null;
        break;
      case 'pincode':
        this.cache.pincodeCache.clear();
        break;
      case 'location':
        this.cache.locationCache.clear();
        break;
      case 'text':
        this.cache.textCache.clear();
        break;
      case 'all':
      default:
        this.cache.clinics = null;
        this.cache.lastFetch = null;
        this.cache.pincodeCache.clear();
        this.cache.locationCache.clear();
        this.cache.textCache.clear();
        this.cache.allCache.clear();
        break;
    }
    console.log(`🗑️ Cache cleared: ${type}`);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      clinicsCache: {
        hasData: !!this.cache.clinics,
        count: this.cache.clinics?.length || 0,
        lastFetch: this.cache.lastFetch,
        isValid: this.isCacheValid()
      },
      pincodeCache: {
        size: this.cache.pincodeCache.size
      },
      locationCache: {
        size: this.cache.locationCache.size
      }
    };
  }
}

// Export singleton instance and class
export const optimizedFirebase = new OptimizedFirebaseService();
export { OptimizedFirebaseService };

export default OptimizedFirebaseService;
