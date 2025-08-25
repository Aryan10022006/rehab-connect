// Advanced Search Controller with Multiple Optimization Strategies
const GeoService = require('./geoService');
const admin = require('firebase-admin');

class AdvancedSearchController {
  constructor() {
    this.db = admin.firestore();
    this.searchCache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  // Intelligent search that chooses the best strategy
  async intelligentSearch(req, res) {
    try {
      const {
        query = '',
        lat,
        lng,
        pincode,
        radius = 10,
        filters = {},
        limit = 20,
        offset = 0
      } = req.body;

      console.log('Intelligent search request:', { query, lat, lng, pincode, radius, filters });

      let results = [];
      const searchStrategy = this.determineSearchStrategy({ query, lat, lng, pincode });

      console.log(`Using search strategy: ${searchStrategy}`);

      switch (searchStrategy) {
        case 'GEOSPATIAL':
          results = await GeoService.searchClinicsByLocation(
            parseFloat(lat), 
            parseFloat(lng), 
            parseInt(radius), 
            filters
          );
          break;

        case 'PINCODE':
          results = await GeoService.searchByPincode(pincode, limit);
          break;

        case 'TEXT':
          results = await GeoService.searchByText(query, limit, filters);
          break;

        case 'HYBRID':
          results = await this.hybridSearch({ query, lat, lng, pincode, radius, filters, limit });
          break;

        default:
          results = await this.fallbackSearch(limit, filters);
      }

      // Apply pagination
      const paginatedResults = results.slice(offset, offset + limit);

      // Add search metadata
      const searchMeta = {
        strategy: searchStrategy,
        totalResults: results.length,
        limit,
        offset,
        hasMore: (offset + limit) < results.length,
        searchTime: Date.now() - req.startTime
      };

      res.json({
        clinics: paginatedResults,
        meta: searchMeta
      });

    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({ 
        error: 'Search failed', 
        details: error.message 
      });
    }
  }

  // Determine the best search strategy based on available parameters
  determineSearchStrategy({ query, lat, lng, pincode }) {
    // Priority order: Location > Pincode > Text > Fallback
    
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return query ? 'HYBRID' : 'GEOSPATIAL';
    }
    
    if (pincode && pincode.length === 6) {
      return query ? 'HYBRID' : 'PINCODE';
    }
    
    if (query && query.trim().length > 0) {
      return 'TEXT';
    }
    
    return 'FALLBACK';
  }

  // Hybrid search combining multiple strategies
  async hybridSearch({ query, lat, lng, pincode, radius, filters, limit }) {
    try {
      console.log('Executing hybrid search...');
      
      const searchPromises = [];

      // 1. Geographic search if coordinates available
      if (lat && lng) {
        searchPromises.push(
          GeoService.searchClinicsByLocation(
            parseFloat(lat), 
            parseFloat(lng), 
            parseInt(radius), 
            filters
          ).catch(err => {
            console.warn('Geo search failed in hybrid:', err.message);
            return [];
          })
        );
      }

      // 2. Pincode search if available
      if (pincode) {
        searchPromises.push(
          GeoService.searchByPincode(pincode, limit).catch(err => {
            console.warn('Pincode search failed in hybrid:', err.message);
            return [];
          })
        );
      }

      // 3. Text search if query provided
      if (query) {
        searchPromises.push(
          GeoService.searchByText(query, limit, filters).catch(err => {
            console.warn('Text search failed in hybrid:', err.message);
            return [];
          })
        );
      }

      // Execute all searches in parallel
      const searchResults = await Promise.all(searchPromises);
      
      // Merge and deduplicate results with scoring
      const combinedResults = this.mergeSearchResults(searchResults, { query, lat, lng, pincode });
      
      return combinedResults.slice(0, limit);

    } catch (error) {
      console.error('Hybrid search error:', error);
      throw error;
    }
  }

  // Intelligent result merging with relevance scoring
  mergeSearchResults(searchResults, searchParams) {
    const clinicsMap = new Map();
    const { query, lat, lng } = searchParams;

    searchResults.forEach((results, strategyIndex) => {
      results.forEach(clinic => {
        if (clinicsMap.has(clinic.id)) {
          // Boost score for clinics found by multiple strategies
          const existing = clinicsMap.get(clinic.id);
          existing.relevanceScore += (strategyIndex === 0 ? 10 : 5); // Prioritize first strategy
          existing.foundByStrategies.push(strategyIndex);
        } else {
          // Calculate relevance score
          let relevanceScore = 10; // Base score
          
          // Distance scoring (closer = higher score)
          if (clinic.distance !== undefined) {
            relevanceScore += Math.max(0, 20 - clinic.distance);
          }
          
          // Rating scoring
          if (clinic.rating) {
            relevanceScore += clinic.rating * 2;
          }
          
          // Text relevance scoring
          if (query && clinic.name) {
            const nameMatch = clinic.name.toLowerCase().includes(query.toLowerCase());
            if (nameMatch) relevanceScore += 15;
          }

          // Verification bonus
          if (clinic.verified) {
            relevanceScore += 5;
          }

          clinicsMap.set(clinic.id, {
            ...clinic,
            relevanceScore,
            foundByStrategies: [strategyIndex]
          });
        }
      });
    });

    // Sort by relevance score
    return Array.from(clinicsMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Fallback search when no specific parameters provided
  async fallbackSearch(limit, filters) {
    try {
      console.log('Using fallback search strategy');
      
      let query = this.db.collection('clinics');
      
      // Apply basic filters
      if (filters.verified !== undefined) {
        query = query.where('verified', '==', filters.verified);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      // Order by rating and limit
      query = query.orderBy('rating', 'desc').limit(limit);

      const snapshot = await query.get();
      const results = [];
      
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      return results;

    } catch (error) {
      console.error('Fallback search error:', error);
      throw error;
    }
  }

  // Auto-complete suggestions for search
  async getSearchSuggestions(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      // Check cache first
      const cacheKey = `suggestions_${query.toLowerCase()}`;
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.CACHE_TTL) {
          return res.json({ suggestions: cached.data });
        }
      }

      const suggestions = await this.generateSuggestions(query);
      
      // Cache suggestions
      this.searchCache.set(cacheKey, {
        data: suggestions,
        timestamp: Date.now()
      });

      res.json({ suggestions });

    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  }

  // Generate intelligent search suggestions
  async generateSuggestions(query) {
    try {
      const queryLower = query.toLowerCase();
      const suggestions = new Set();

      // Search clinic names
      const nameQuery = await this.db.collection('clinics')
        .where('searchKeywords', 'array-contains-any', [queryLower])
        .limit(10)
        .get();

      nameQuery.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(queryLower)) {
          suggestions.add(data.name);
        }
      });

      // Search locations/addresses
      const locationQuery = await this.db.collection('clinics')
        .where('addressKeywords', 'array-contains-any', [queryLower])
        .limit(10)
        .get();

      locationQuery.forEach(doc => {
        const data = doc.data();
        if (data.address) {
          const addressParts = data.address.split(',');
          addressParts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed.toLowerCase().includes(queryLower)) {
              suggestions.add(trimmed);
            }
          });
        }
      });

      return Array.from(suggestions).slice(0, 8);

    } catch (error) {
      console.error('Generate suggestions error:', error);
      return [];
    }
  }

  // Popular searches and trending
  async getPopularSearches(req, res) {
    try {
      // This would typically come from analytics/tracking
      const popularSearches = [
        'Physiotherapy',
        'Rehabilitation Center',
        'Speech Therapy',
        'Occupational Therapy',
        'Mumbai',
        'Delhi',
        'Bangalore',
        'Pune'
      ];

      res.json({ popular: popularSearches });

    } catch (error) {
      console.error('Popular searches error:', error);
      res.status(500).json({ error: 'Failed to get popular searches' });
    }
  }
}

module.exports = new AdvancedSearchController();
