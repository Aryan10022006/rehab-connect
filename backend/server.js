require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced logging utility with request counting
const requestStats = {
  totalRequests: 0,
  clinicRequests: 0,
  nearbyRequests: 0,
  optimizedRequests: 0,
  lastReset: new Date()
};

const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? error.stack || error : '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development' && process.env.VERBOSE_LOGS === 'true') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  logRequest: (type, details = {}) => {
    requestStats.totalRequests++;
    requestStats[type + 'Requests']++;
    console.log(`[REQUEST-${type.toUpperCase()}] ${new Date().toISOString()} - Total: ${requestStats.totalRequests}`, details);
  },
  getStats: () => ({ ...requestStats, uptime: new Date() - requestStats.lastReset })
};

// Global error handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Initialize Firebase Admin SDK with enhanced error handling
const initializeFirebase = () => {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // Validate required environment variables
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });

    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });

    logger.info('Firebase Admin SDK initialized successfully');
    return db;
  } catch (error) {
    logger.error('Firebase Admin SDK initialization failed:', error);
    throw error;
  }
};

let db;
try {
  db = initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase. Server cannot start.');
  process.exit(1);
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://rehab-connect-pi.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Advanced services (optional)
let CacheService, ElasticsearchService, GeoService, SearchController, PaymentService;

try {
  CacheService = require('./services/cacheService');
  console.log('✅ Cache Service loaded');
} catch (error) {
  console.log('⚠️  Cache Service not available, using basic caching');
  CacheService = {
    memoryCache: new Map(),
    generateSearchHash: (params) => JSON.stringify(params),
    get: async (key) => CacheService.memoryCache.get(key),
    set: async (key, value, ttl = 300) => {
      CacheService.memoryCache.set(key, value);
      setTimeout(() => CacheService.memoryCache.delete(key), ttl * 1000);
    },
    getSearchResults: async (hash) => CacheService.get(`search:${hash}`),
    setSearchResults: async (hash, results, ttl) => CacheService.set(`search:${hash}`, results, ttl)
  };
}

try {
  PaymentService = require('./services/paymentService');
  console.log('✅ Payment Service loaded');
} catch (error) {
  console.log('⚠️  Payment Service not available');
}

// Initialize Razorpay for premium upgrades
let razorpay = null;
try {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized for premium upgrades');
} catch (error) {
  console.log('⚠️  Razorpay not available:', error.message);
}

try {
  GeoService = require('./services/geoService');
  console.log('✅ Geo Service loaded');
} catch (error) {
  console.log('⚠️  Geo Service not available');
}

// Cache for clinics data
let clinicsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Add nearby search cache
let nearbySearchCache = new Map();
const NEARBY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Rate limiting
const { 
  generalRateLimit, 
  userDataRateLimit, 
  clinicRateLimit,
  searchRateLimit,
  authRateLimit 
} = require('./middleware/rateLimit');

// Apply different rate limits to different endpoints
app.use('/api/auth', authRateLimit);
app.use('/api/user', userDataRateLimit);
app.use('/api/clinics', clinicRateLimit);
app.use('/api/search', searchRateLimit);
app.use('/api', generalRateLimit);

// Auth middleware
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Admin middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const adminUsers = JSON.parse(process.env.ADMIN_USERS || '{}');
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    const userEmail = req.user?.email;
    const isAdmin = adminEmails.includes(userEmail) || adminUsers[userEmail];
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    return res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Optimized clinic fetching
const getClinics = async () => {
  const now = Date.now();
  
  if (clinicsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Returning cached clinics data');
    return clinicsCache;
  }
  
  try {
    console.log('🔍 Fetching clinics from Firestore...');
    const snapshot = await db.collection('clinics').get();
    
    const clinics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    clinicsCache = clinics;
    cacheTimestamp = now;
    
    console.log(`✅ Fetched ${clinics.length} clinics from Firestore`);
    return clinics;
  } catch (error) {
    console.error('❌ Error fetching clinics:', error);
    return clinicsCache || []; // Return cached data if available
  }
};

// ============= BASIC ENDPOINTS =============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      firebase: true,
      cache: !!CacheService,
      payments: !!PaymentService,
      geo: !!GeoService
    }
  });
});

// Auth verification endpoint
app.post('/api/auth/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    
    // Get or create user profile in Firestore
    const userRef = db.collection('users').doc(uid);
    let userData;
    
    try {
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        userData = userDoc.data();
      } else {
        // Create new user profile
        userData = {
          uid,
          email,
          name: name || email?.split('@')[0] || 'User',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          role: 'user'
        };
        await userRef.set(userData);
      }
      
      // Update last login
      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        user: {
          uid,
          email,
          name: userData.name,
          role: userData.role || 'user'
        }
      });
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // Fallback response without Firestore
      res.json({
        success: true,
        user: {
          uid,
          email,
          name: name || email?.split('@')[0] || 'User',
          role: 'user'
        }
      });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication verification failed'
    });
  }
});

// Get all clinics with caching and request logging
app.get('/api/clinics', async (req, res) => {
  try {
    logger.logRequest('clinic', { 
      query: req.query,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    
    const clinics = await getClinics();
    
    logger.info(`Served ${clinics.length} clinics from ${clinicsCache ? 'cache' : 'database'}`);
    
    res.json({
      success: true,
      clinics,
      count: clinics.length,
      cached: !!clinicsCache,
      requestId: requestStats.totalRequests
    });
  } catch (error) {
    logger.error('Error getting clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// Get clinics by location with professional distance calculation
app.post('/api/clinics/nearby', async (req, res) => {
  try {
    logger.logRequest('nearby', { 
      body: req.body,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    
    const { lat, lng, radius = 20, isPremium = false } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    
    // Validate coordinates
    if (!GeoService.isValidCoordinate(userLocation)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Get all clinics
    const allClinics = await getClinics();
    
    // Apply geolocation filtering and premium logic
    const result = GeoService.getDefaultVisibleClinics(allClinics, userLocation, isPremium);
    
    logger.info(`Nearby clinics query - Total: ${allClinics.length}, In radius: ${result.all.length}, Visible: ${result.visible.length}, Premium: ${result.premium.length}`);
    
    res.json({
      success: true,
      location: userLocation,
      radius,
      isPremium,
      visible: result.visible,
      premium: result.premium,
      stats: {
        totalInRadius: result.all.length,
        visible: result.visible.length,
        premium: result.premium.length
      },
      requestId: requestStats.totalRequests
    });

  } catch (error) {
    logger.error('Nearby clinics error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby clinics' });
  }
});

// Optimized endpoint for pincode-based clinic fetching
app.post('/api/clinics/optimized', async (req, res) => {
  try {
    logger.logRequest('optimized', { 
      body: req.body,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    
    const { 
      pincode, 
      nearbyPincodes = [], 
      userLocation = null, 
      maxDistance = 5, 
      isPremium = false,
      maxResults = 10
    } = req.body;
    
    if (!pincode && !userLocation) {
      return res.status(400).json({ error: 'Pincode or user location required' });
    }

    // Get all clinics (cached)
    const allClinics = await getClinics();
    let filteredClinics = [];
    
    // Apply precise pincode-based filtering first (OPTIMIZATION)
    if (pincode || nearbyPincodes.length > 0) {
      const targetPincodes = [pincode, ...nearbyPincodes].filter(Boolean);
      
      filteredClinics = allClinics.filter(clinic => {
        // Priority 1: Exact pincode match
        if (clinic.pincode && targetPincodes.includes(clinic.pincode.toString())) {
          return true;
        }
        
        // Priority 2: Address contains pincode
        if (clinic.address && targetPincodes.some(pin => clinic.address.includes(pin))) {
          return true;
        }
        
        // Priority 3: Location contains pincode
        if (clinic.location && targetPincodes.some(pin => clinic.location.includes(pin))) {
          return true;
        }
        
        // Priority 4: Only for 6-digit Indian pincodes - same postal circle/area
        if (pincode && pincode.length === 6 && clinic.pincode && clinic.pincode.length === 6) {
          const clinicPincode = clinic.pincode.toString();
          const searchPincode = pincode.toString();
          
          // Same postal circle (first 2 digits)
          if (clinicPincode.substring(0, 2) === searchPincode.substring(0, 2)) {
            // Same sub-division (first 3 digits) for relevance
            if (clinicPincode.substring(0, 3) === searchPincode.substring(0, 3)) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      logger.info(`Pincode filtering: ${allClinics.length} → ${filteredClinics.length} clinics`);
    } else {
      filteredClinics = allClinics;
    }
    
    // Apply distance-based filtering if user location is available
    if (userLocation && userLocation.lat && userLocation.lng) {
      const effectiveMaxDistance = isPremium ? Math.min(maxDistance, 20) : Math.min(maxDistance, 20); // TEMP: Changed from 5 to 20 for testing
      
      filteredClinics = filteredClinics
        .map(clinic => {
          // Calculate distance for each clinic
          let distance = null;
          if (clinic.coordinates?.lat && clinic.coordinates?.lng) {
            distance = GeoService.calculateDistance(
              userLocation.lat, userLocation.lng,
              clinic.coordinates.lat, clinic.coordinates.lng
            );
          } else if (clinic.lat && clinic.lng) {
            distance = GeoService.calculateDistance(
              userLocation.lat, userLocation.lng,
              clinic.lat, clinic.lng
            );
          }
          
          return { ...clinic, calculatedDistance: distance };
        })
        .filter(clinic => 
          clinic.calculatedDistance === null || clinic.calculatedDistance <= effectiveMaxDistance
        )
        .sort((a, b) => {
          if (a.calculatedDistance === null) return 1;
          if (b.calculatedDistance === null) return -1;
          return a.calculatedDistance - b.calculatedDistance;
        });
        
      logger.info(`Distance filtering: ${filteredClinics.length} clinics within ${effectiveMaxDistance}km`);
    }
    
    // Apply result limits based on user plan
    const effectiveMaxResults = isPremium ? maxResults : Math.min(maxResults, 5);
    const visibleClinics = filteredClinics.slice(0, effectiveMaxResults);
    const premiumClinics = filteredClinics.slice(effectiveMaxResults, effectiveMaxResults + 10);
    
    logger.info(`Optimized query result: ${visibleClinics.length} visible, ${premiumClinics.length} premium, from ${allClinics.length} total`);
    
    res.json({
      success: true,
      optimization: {
        originalCount: allClinics.length,
        pincodeFiltered: pincode ? filteredClinics.length : allClinics.length,
        distanceFiltered: userLocation ? filteredClinics.length : null,
        finalCount: visibleClinics.length + premiumClinics.length
      },
      visible: visibleClinics,
      premium: premiumClinics,
      stats: {
        totalFiltered: filteredClinics.length,
        visible: visibleClinics.length,
        premium: premiumClinics.length,
        maxDistance: userLocation ? (isPremium ? Math.min(maxDistance, 20) : Math.min(maxDistance, 20)) : null // TEMP: Changed from 5 to 20 for testing
      },
      requestId: requestStats.totalRequests
    });

  } catch (error) {
    logger.error('Optimized clinics error:', error);
    res.status(500).json({ error: 'Failed to fetch optimized clinics' });
  }
});

// Get API usage statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = logger.getStats();
    res.json({
      success: true,
      ...stats,
      performance: {
        averageResponseTime: 'N/A', // Could be implemented with timing middleware
        cacheHitRate: clinicsCache ? '100%' : '0%'
      }
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get clinic by ID
app.get('/api/clinics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clinics = await getClinics();
    const clinic = clinics.find(c => c.id === id);
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    res.json({ success: true, clinic });
  } catch (error) {
    console.error('Error getting clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
});

// ============= SEARCH ENDPOINTS =============

// Advanced search with fallbacks
app.post('/api/clinics/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const searchParams = req.body;
    const { query = '', limit = 20, filters = {} } = searchParams;
    
    // Try advanced search if available
    if (CacheService) {
      const searchHash = CacheService.generateSearchHash(searchParams);
      const cachedResults = await CacheService.getSearchResults(searchHash);
      
      if (cachedResults) {
        return res.json({
          ...cachedResults,
          meta: { ...cachedResults.meta, cached: true, searchTime: Date.now() - startTime }
        });
      }
    }

    // Basic search fallback
    const clinics = await getClinics();
    let results = clinics;

    // Text filtering
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(clinic => 
        clinic.name?.toLowerCase().includes(queryLower) ||
        clinic.address?.toLowerCase().includes(queryLower) ||
        clinic.city?.toLowerCase().includes(queryLower) ||
        clinic.state?.toLowerCase().includes(queryLower) ||
        clinic.treatments?.some(t => t.toLowerCase().includes(queryLower))
      );
    }

    // Apply filters
    if (filters.verified !== undefined) {
      results = results.filter(clinic => clinic.verified === filters.verified);
    }

    if (filters.rating && filters.rating > 0) {
      results = results.filter(clinic => clinic.rating >= filters.rating);
    }

    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      results = results.filter(clinic => 
        clinic.city?.toLowerCase().includes(cityLower)
      );
    }

    // Limit results
    const offset = searchParams.offset || 0;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchResult = {
      clinics: paginatedResults,
      meta: {
        strategy: 'BASIC_FIRESTORE',
        totalResults: results.length,
        limit,
        offset,
        hasMore: offset + limit < results.length,
        searchTime: Date.now() - startTime
      }
    };

    // Cache results if service available
    if (CacheService) {
      const searchHash = CacheService.generateSearchHash(searchParams);
      await CacheService.setSearchResults(searchHash, searchResult, 300);
    }

    res.json(searchResult);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message,
      searchTime: Date.now() - startTime
    });
  }
});

// GET version of search for simple queries
app.get('/api/clinics/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { q: query = '', limit = 20, isPremium = 'false', fields } = req.query;
    const isUserPremium = isPremium === 'true';
    const searchLimit = isUserPremium ? (parseInt(limit) || 50) : 3;

    logger.info(`🔍 GET search for query: "${query}", Premium: ${isUserPremium}`);

    if (!query || query.length < 2) {
      return res.json({ 
        clinics: [], 
        total: 0,
        visible: 0,
        hidden: 0,
        hasMore: false,
        searchTime: Date.now() - startTime
      });
    }

    // Get all clinics
    const allClinics = await getClinics();
    
    // Simple text search across multiple fields
    const queryLower = query.toLowerCase();
    let matchingClinics = allClinics.filter(clinic => {
      // Check if it's a numeric query (possible pincode)
      if (query.match(/^\d+$/)) {
        return clinic.pincode?.includes(query) ||
               clinic.address?.toLowerCase().includes(query) ||
               clinic.location?.toLowerCase().includes(query);
      }
      
      // Text search across multiple fields
      return clinic.name?.toLowerCase().includes(queryLower) ||
             clinic.address?.toLowerCase().includes(queryLower) ||
             clinic.location?.toLowerCase().includes(queryLower) ||
             clinic.specialization?.toLowerCase().includes(queryLower) ||
             clinic.services?.some(service => 
               service.toLowerCase().includes(queryLower)
             );
    });

    // Sort by relevance
    matchingClinics = matchingClinics.sort((a, b) => {
      // Calculate relevance scores
      let aScore = 0;
      let bScore = 0;
      
      // Exact name match gets highest score
      if (a.name?.toLowerCase() === queryLower) aScore += 100;
      if (b.name?.toLowerCase() === queryLower) bScore += 100;
      
      // Name starts with query
      if (a.name?.toLowerCase().startsWith(queryLower)) aScore += 50;
      if (b.name?.toLowerCase().startsWith(queryLower)) bScore += 50;
      
      // Verified clinics get bonus
      if (a.verified) aScore += 20;
      if (b.verified) bScore += 20;
      
      // Rating bonus
      aScore += (a.rating || 0) * 5;
      bScore += (b.rating || 0) * 5;
      
      // Sort by score, then rating
      if (aScore !== bScore) return bScore - aScore;
      return (b.rating || 0) - (a.rating || 0);
    });

    // Apply freemium limits
    const visibleClinics = matchingClinics.slice(0, searchLimit);
    const totalClinics = matchingClinics.length;
    const hiddenCount = Math.max(0, totalClinics - searchLimit);

    logger.info(`📍 Search results for "${query}": ${totalClinics} total, ${visibleClinics.length} visible`);

    res.json({
      clinics: visibleClinics,
      total: totalClinics,
      visible: visibleClinics.length,
      hidden: hiddenCount,
      hasMore: hiddenCount > 0,
      isPremium: isUserPremium,
      query: query,
      searchTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('GET search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message,
      searchTime: Date.now() - startTime
    });
  }
});

// Precision Pincode Search - Professional endpoint for exact pincode matching
app.get('/api/clinics/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const { limit = 20 } = req.query;
    
    logger.info(`🎯 Precision pincode search for: ${pincode}`);
    
    if (!pincode || pincode.length < 3) {
      return res.status(400).json({ 
        error: 'Invalid pincode. Minimum 3 digits required.',
        received: pincode
      });
    }
    
    // Get all clinics
    const allClinics = await getClinics();
    const searchPincode = pincode.toString();
    
    // Professional matching with priorities
    const exactMatches = [];
    const addressMatches = [];
    const locationMatches = [];
    const nearbyMatches = [];
    
    allClinics.forEach(clinic => {
      const clinicPincode = clinic.pincode?.toString() || '';
      
      // Priority 1: Exact pincode match
      if (clinicPincode === searchPincode) {
        exactMatches.push(clinic);
        return;
      }
      
      // Priority 2: Address contains pincode
      if (clinic.address?.includes(searchPincode)) {
        addressMatches.push(clinic);
        return;
      }
      
      // Priority 3: Location contains pincode
      if (clinic.location?.includes(searchPincode)) {
        locationMatches.push(clinic);
        return;
      }
      
      // Priority 4: Nearby pincodes (only for valid 6-digit Indian pincodes)
      if (searchPincode.length === 6 && clinicPincode.length === 6) {
        // Same postal subdivision (first 3 digits)
        if (clinicPincode.substring(0, 3) === searchPincode.substring(0, 3)) {
          nearbyMatches.push(clinic);
        }
      }
    });
    
    // Combine results in priority order
    const results = [
      ...exactMatches,
      ...addressMatches, 
      ...locationMatches,
      ...nearbyMatches
    ].slice(0, parseInt(limit));
    
    logger.info(`🎯 Pincode search results: ${exactMatches.length} exact, ${addressMatches.length} address, ${locationMatches.length} location, ${nearbyMatches.length} nearby = ${results.length} total`);
    
    res.json({
      success: true,
      pincode: searchPincode,
      results,
      meta: {
        exactMatches: exactMatches.length,
        addressMatches: addressMatches.length,
        locationMatches: locationMatches.length,
        nearbyMatches: nearbyMatches.length,
        totalResults: results.length,
        strategy: 'PRECISION_PINCODE'
      }
    });
    
  } catch (error) {
    logger.error('Precision pincode search error:', error);
    res.status(500).json({ 
      error: 'Failed to search by pincode',
      details: error.message 
    });
  }
});

// Auto-complete suggestions
app.get('/api/clinics/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const clinics = await getClinics();
    const queryLower = query.toLowerCase();
    const suggestionSet = new Set();

    clinics.forEach(clinic => {
      if (clinic.name && clinic.name.toLowerCase().includes(queryLower)) {
        suggestionSet.add(clinic.name);
      }
      if (clinic.city && clinic.city.toLowerCase().includes(queryLower)) {
        suggestionSet.add(clinic.city);
      }
      if (clinic.treatments) {
        clinic.treatments.forEach(treatment => {
          if (treatment.toLowerCase().includes(queryLower)) {
            suggestionSet.add(treatment);
          }
        });
      }
    });

    const suggestions = Array.from(suggestionSet).slice(0, 8);
    res.json({ suggestions });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Popular searches
app.get('/api/clinics/popular', async (req, res) => {
  try {
    const popularSearches = [
      'Physiotherapy',
      'Rehabilitation Center',
      'Speech Therapy',
      'Occupational Therapy',
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Pune',
      'Chennai',
      'Hyderabad'
    ];
    res.json({ popular: popularSearches });
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({ error: 'Failed to get popular searches' });
  }
});

// ============= OPTIMIZED CLINIC ENDPOINTS =============

// Get optimized clinic data with smart caching
app.get('/api/clinics/optimized-data', async (req, res) => {
  try {
    // Check if we have cached data
    if (clinicsCache.data && Date.now() - clinicsCache.lastUpdate < clinicsCache.duration) {
      logger.info('📦 Returning cached optimized clinics data');
      return res.json({
        success: true,
        clinics: clinicsCache.data,
        cached: true,
        lastUpdate: clinicsCache.lastUpdate
      });
    }

    // Fetch fresh data with optimized query
    const clinicsRef = db.collection('clinics');
    let snapshot;

    try {
      // Try optimized query with indexing
      snapshot = await clinicsRef
        .where('status', '==', 'operational')
        .orderBy('verified', 'desc')
        .orderBy('rating', 'desc')
        .limit(1000) // Reasonable limit
        .get();
    } catch (indexError) {
      logger.warn('Optimized query failed, using basic query:', indexError.message);
      // Fallback to basic query
      snapshot = await clinicsRef.limit(1000).get();
    }

    const clinics = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Only include clinics with valid coordinates
      if (typeof data.lat === 'number' && typeof data.long === 'number') {
        clinics.push({
          id: doc.id,
          ...data,
          // Ensure consistent coordinate naming
          lng: data.long,
          // Add computed fields
          hasValidLocation: true,
          lastUpdated: data.updatedAt || data.createdAt
        });
      }
    });

    // Update cache
    clinicsCache.data = clinics;
    clinicsCache.lastUpdate = Date.now();

    logger.info(`📥 Cached ${clinics.length} optimized clinics`);

    res.json({
      success: true,
      clinics,
      total: clinics.length,
      cached: false,
      lastUpdate: clinicsCache.lastUpdate
    });

  } catch (error) {
    logger.error('Error getting optimized clinics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get optimized clinics',
      clinics: []
    });
  }
});

// Search clinics by pincode with optimization
app.get('/api/clinics/search-by-pincode', async (req, res) => {
  try {
    const { pincode, isPremium = 'false', limit } = req.query;
    
    if (!pincode) {
      return res.status(400).json({ 
        success: false,
        error: 'Pincode is required' 
      });
    }

    const isUserPremium = isPremium === 'true';
    const resultLimit = isUserPremium ? (parseInt(limit) || 50) : 3;

    logger.info(`🔍 Enhanced pincode search: ${pincode}, Premium: ${isUserPremium}`);

    // Get all clinics (use cache if available)
    const allClinics = await getClinics();
    
    // Enhanced pincode matching with proximity and fuzzy search
    const matchingClinics = allClinics.filter(clinic => {
      const clinicPincode = clinic.pincode?.toString() || '';
      const searchPincode = pincode.toString();
      
      // Exact match
      if (clinicPincode === searchPincode) return true;
      
      // Location contains pincode
      if (clinic.location?.toLowerCase().includes(searchPincode)) return true;
      
      // Address contains pincode
      if (clinic.address?.toLowerCase().includes(searchPincode)) return true;
      
      // Proximity search - same area code (first 3 digits)
      if (clinicPincode.length >= 3 && searchPincode.length >= 3) {
        const clinicArea = clinicPincode.substring(0, 3);
        const searchArea = searchPincode.substring(0, 3);
        if (clinicArea === searchArea) return true;
      }
      
      // Partial pincode match for short queries
      if (searchPincode.length >= 4) {
        if (clinicPincode.startsWith(searchPincode) || 
            searchPincode.startsWith(clinicPincode.substring(0, 4))) {
          return true;
        }
      }
      
      // City/state matching if pincode belongs to known areas
      const searchLocation = searchPincode;
      if (clinic.location?.toLowerCase().includes(searchLocation.toLowerCase()) ||
          clinic.address?.toLowerCase().includes(searchLocation.toLowerCase())) {
        return true;
      }
      
      return false;
    });

    // Smart sorting by relevance and quality
    const sortedClinics = matchingClinics.sort((a, b) => {
      const aPincode = a.pincode?.toString() || '';
      const bPincode = b.pincode?.toString() || '';
      const searchPincode = pincode.toString();
      
      // Calculate relevance scores
      let aScore = 0;
      let bScore = 0;
      
      // Exact pincode match gets highest score
      if (aPincode === searchPincode) aScore += 100;
      if (bPincode === searchPincode) bScore += 100;
      
      // Partial matches get medium score
      if (aPincode.startsWith(searchPincode)) aScore += 50;
      if (bPincode.startsWith(searchPincode)) bScore += 50;
      
      // Area code matches get lower score
      if (aPincode.substring(0, 3) === searchPincode.substring(0, 3)) aScore += 25;
      if (bPincode.substring(0, 3) === searchPincode.substring(0, 3)) bScore += 25;
      
      // Verified clinics get bonus
      if (a.verified) aScore += 20;
      if (b.verified) bScore += 20;
      
      // Rating bonus (scaled)
      aScore += (a.rating || 0) * 5;
      bScore += (b.rating || 0) * 5;
      
      // Primary sort by relevance score
      if (aScore !== bScore) return bScore - aScore;
      
      // Secondary sort by rating
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

    // Apply freemium rules
    const visibleClinics = sortedClinics.slice(0, resultLimit);
    const totalClinics = sortedClinics.length;
    const hiddenCount = Math.max(0, totalClinics - resultLimit);

    logger.info(`📍 Enhanced search results for pincode ${pincode}: ${totalClinics} total, ${visibleClinics.length} visible`);

    // Add search insights
    const searchInsights = {
      searchType: 'pincode',
      exactMatches: sortedClinics.filter(c => c.pincode === pincode).length,
      proximityMatches: sortedClinics.filter(c => c.pincode?.substring(0, 3) === pincode.substring(0, 3)).length,
      areaCode: pincode.substring(0, 3)
    };

    res.json({
      success: true,
      clinics: visibleClinics,
      total: totalClinics,
      visible: visibleClinics.length,
      hidden: hiddenCount,
      hasMore: hiddenCount > 0,
      isPremium: isUserPremium,
      pincode: pincode,
      insights: searchInsights
    });

  } catch (error) {
    logger.error('Error searching by pincode:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search by pincode',
      details: error.message
    });
  }
});

// Premium upgrade endpoints
app.post('/api/premium/create-order', async (req, res) => {
  try {
    const { userId, userEmail, planType = 'premium' } = req.body;
    
    if (!userId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required'
      });
    }

    // Premium plan pricing
    const premiumPlans = {
      premium: { amount: 29900, currency: 'INR', period: 'monthly' }, // ₹299/month
      annual: { amount: 299900, currency: 'INR', period: 'yearly' }   // ₹2999/year
    };

    const selectedPlan = premiumPlans[planType] || premiumPlans.premium;
    
    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: selectedPlan.amount, // Amount in paise
      currency: selectedPlan.currency,
      receipt: `premium_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        userEmail: userEmail,
        planType: planType,
        upgradeTimestamp: new Date().toISOString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    
    logger.info(`💳 Created premium upgrade order for user ${userId}: ${razorpayOrder.id}`);

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      planType: planType,
      period: selectedPlan.period
    });

  } catch (error) {
    logger.error('Error creating premium order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create premium order',
      details: error.message
    });
  }
});

app.post('/api/premium/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters'
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn(`⚠️ Invalid payment signature for user ${userId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (payment.status === 'captured' && order.status === 'paid') {
      // Update user premium status in Firestore
      const userRef = db.collection('users').doc(userId);
      const upgradeData = {
        isPremium: true,
        premiumStartDate: admin.firestore.FieldValue.serverTimestamp(),
        premiumPlan: order.notes.planType || 'premium',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      await userRef.update(upgradeData);
      
      logger.info(`✅ Premium upgrade successful for user ${userId}: ${razorpay_payment_id}`);

      res.json({
        success: true,
        message: 'Premium upgrade successful',
        paymentId: razorpay_payment_id,
        premiumPlan: order.notes.planType
      });

    } else {
      logger.warn(`❌ Payment verification failed for user ${userId}: ${payment.status}`);
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        paymentStatus: payment.status
      });
    }

  } catch (error) {
    logger.error('Error verifying premium payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: error.message
    });
  }
});

// Optimized nearby search with better performance
app.post('/api/clinics/nearby-optimized', async (req, res) => {
  try {
    const { lat, lng, radius = 20, isPremium = false, limit } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    const resultLimit = isPremium ? (parseInt(limit) || 50) : 3;

    // Create cache key for nearby search
    const cacheKey = `${userLat.toFixed(3)}_${userLng.toFixed(3)}_${searchRadius}_${isPremium}_${resultLimit}`;
    
    // Check nearby search cache first
    if (nearbySearchCache.has(cacheKey)) {
      const cached = nearbySearchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < NEARBY_CACHE_DURATION) {
        logger.info(`📦 Returning cached nearby search for ${cacheKey}`);
        return res.json(cached.data);
      } else {
        // Remove expired cache entry
        nearbySearchCache.delete(cacheKey);
      }
    }

    logger.info(`📍 Optimized nearby search: lat=${userLat}, lng=${userLng}, radius=${searchRadius}km, premium=${isPremium}`);

    // Get cached clinics for better performance
    const allClinics = await getClinics();

    // First pass: rough bounding box filter for performance
    const boundingBox = {
      minLat: userLat - (searchRadius / 111), // Rough conversion: 1 degree ≈ 111km
      maxLat: userLat + (searchRadius / 111),
      minLng: userLng - (searchRadius / (111 * Math.cos(userLat * Math.PI / 180))),
      maxLng: userLng + (searchRadius / (111 * Math.cos(userLat * Math.PI / 180)))
    };

    const roughFiltered = allClinics.filter(clinic => {
      return clinic.lat >= boundingBox.minLat &&
             clinic.lat <= boundingBox.maxLat &&
             clinic.long >= boundingBox.minLng &&
             clinic.long <= boundingBox.maxLng;
    });

    // Second pass: accurate distance calculation with early termination
    let clinicsWithDistance = [];
    let processedCount = 0;
    
    for (const clinic of roughFiltered) {
      processedCount++;
      const distance = calculateAccurateDistance(userLat, userLng, clinic.lat, clinic.long);
      
      if (distance <= searchRadius) {
        clinicsWithDistance.push({
          ...clinic,
          distance,
          distanceText: formatDistance(distance)
        });
      }
      
      // Early termination: if we have enough premium results or significant overage for sorting
      if (!isPremium && clinicsWithDistance.length >= resultLimit * 3) {
        break;
      } else if (isPremium && clinicsWithDistance.length >= (resultLimit || 50) * 1.5) {
        break;
      }
    }
    
    logger.info(`📊 Processed ${processedCount}/${roughFiltered.length} clinics, found ${clinicsWithDistance.length} within radius`);

    // Sort by distance and rating (only sort what we need for better performance)
    const sortedClinics = clinicsWithDistance.sort((a, b) => {
      // Distance first
      if (Math.abs(a.distance - b.distance) > 0.5) {
        return a.distance - b.distance;
      }
      // Then by verification
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });

    // Apply freemium rules
    const visibleClinics = sortedClinics.slice(0, resultLimit);
    const totalInRadius = clinicsWithDistance.length; // Use the actual count, not sorted count
    const hiddenCount = Math.max(0, totalInRadius - resultLimit);

    logger.info(`📊 Nearby search results: ${totalInRadius} total, ${visibleClinics.length} visible, ${hiddenCount} hidden`);

    const resultData = {
      success: true,
      clinics: visibleClinics,
      total: totalInRadius,
      visible: visibleClinics.length,
      hidden: hiddenCount,
      hasMore: hiddenCount > 0,
      isPremium,
      searchRadius,
      userLocation: { lat: userLat, lng: userLng }
    };

    // Cache the result
    nearbySearchCache.set(cacheKey, {
      data: resultData,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (nearbySearchCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of nearbySearchCache) {
        if (now - value.timestamp > NEARBY_CACHE_DURATION) {
          nearbySearchCache.delete(key);
        }
      }
    }

    res.json(resultData);

  } catch (error) {
    logger.error('Error in optimized nearby search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform nearby search',
      clinics: []
    });
  }
});

// ============= PAYMENT ENDPOINTS =============

// Get payment providers
app.get('/api/payments/providers', async (req, res) => {
  try {
    if (PaymentService) {
      const status = await PaymentService.healthCheck();
      res.json(status);
    } else {
      res.json({ available: [], stripe: false, razorpay: false, paypal: false });
    }
  } catch (error) {
    console.error('Payment providers check failed:', error);
    res.status(500).json({ error: 'Failed to check payment providers' });
  }
});

// Stripe payment intent
app.post('/api/payments/stripe/create-intent', async (req, res) => {
  try {
    if (!PaymentService || !PaymentService.stripe) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;
    const result = await PaymentService.createStripePaymentIntent(amount, currency, metadata);
    res.json(result);
    
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay order creation
app.post('/api/payments/razorpay/create-order', async (req, res) => {
  try {
    if (!PaymentService || !PaymentService.razorpay) {
      return res.status(400).json({ error: 'Razorpay not configured' });
    }

    const { amount, currency = 'INR', receipt, notes = {} } = req.body;
    const result = await PaymentService.createRazorpayOrder(amount, currency, receipt, notes);
    res.json(result);
    
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay payment verification
app.post('/api/payments/razorpay/verify', async (req, res) => {
  try {
    if (!PaymentService || !PaymentService.razorpay) {
      return res.status(400).json({ error: 'Razorpay not configured' });
    }

    const { paymentId, orderId, signature } = req.body;
    const result = await PaymentService.verifyRazorpayPayment(paymentId, orderId, signature);
    res.json(result);
    
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= PREMIUM SUBSCRIPTION ENDPOINTS =============

// Create payment order for subscription
app.post('/api/payment/create-order', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Mock Razorpay order creation (replace with actual Razorpay integration)
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };

    logger.info(`Payment order created for user ${req.user.uid}:`, order);
    res.json(order);
    
  } catch (error) {
    logger.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and update subscription
app.post('/api/payment/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    
    // Mock payment verification (replace with actual Razorpay signature verification)
    const isValid = order_id && payment_id && signature;
    
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid payment data' });
    }

    // For demo purposes, always verify as successful
    logger.info(`Payment verified for user ${req.user.uid}:`, { order_id, payment_id });
    
    res.json({
      success: true,
      payment_id,
      order_id,
      verified: true
    });
    
  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user subscription
app.post('/api/user/subscription', verifyFirebaseToken, async (req, res) => {
  try {
    const { payment_id, order_id, plan_id, plan_name, amount, duration, features } = req.body;
    
    // Calculate expiry date based on plan
    const now = new Date();
    let expiryDate = new Date(now);
    
    switch (plan_id) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'yearly':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        expiryDate.setMonth(expiryDate.getMonth() + 1); // Default to monthly
    }

    const subscription = {
      status: 'active',
      plan_id,
      plan_name,
      amount,
      duration,
      features,
      payment_id,
      order_id,
      startDate: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      updatedAt: now.toISOString()
    };

    // Update user document with subscription
    await db.collection('users').doc(req.user.uid).set({
      subscription,
      isPremium: true,
      premiumSince: now.toISOString(),
      updatedAt: now.toISOString()
    }, { merge: true });

    logger.info(`Subscription updated for user ${req.user.uid}:`, subscription);
    
    res.json({
      success: true,
      subscription,
      message: 'Subscription updated successfully'
    });
    
  } catch (error) {
    logger.error('Subscription update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment status
app.get('/api/payment/status/:paymentId', verifyFirebaseToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Mock payment status (replace with actual Razorpay API call)
    const status = {
      payment_id: paymentId,
      status: 'captured',
      amount: 29900, // Demo amount
      currency: 'INR',
      created_at: Math.floor(Date.now() / 1000)
    };

    res.json(status);
    
  } catch (error) {
    logger.error('Payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= USER ENDPOINTS =============

// User profile
app.get('/api/user/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (userDoc.exists) {
      res.json({ success: true, profile: userDoc.data() });
    } else {
      // Create basic profile
      const basicProfile = {
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        createdAt: new Date().toISOString(),
        favorites: [],
        bookings: []
      };
      
      await db.collection('users').doc(req.user.uid).set(basicProfile);
      res.json({ success: true, profile: basicProfile });
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
app.put('/api/user/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.email; // Don't allow email updates
    
    await db.collection('users').doc(req.user.uid).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// User favorites - ROBUST IMPLEMENTATION
app.get('/api/user/favorites', verifyFirebaseToken, async (req, res) => {
  try {
    logger.info('Getting user favorites for:', req.user.uid);
    
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    const favorites = userData?.favorites || [];
    
    logger.info(`User has ${favorites.length} favorite clinic IDs`);
    
    // Get all clinics with caching
    const allClinics = await getClinics();
    
    // Filter to get favorite clinic objects with full data
    const favoriteClinics = allClinics.filter(clinic => {
      return clinic && clinic.id && favorites.includes(clinic.id);
    }).map(clinic => ({
      ...clinic,
      isFavorite: true,
      addedToFavorites: userData?.favoriteTimestamps?.[clinic.id] || new Date().toISOString()
    }));
    
    logger.info(`Returning ${favoriteClinics.length} favorite clinics with full data`);
    
    res.json({ 
      success: true, 
      favorites: favoriteClinics,
      favoriteIds: favorites,
      count: favoriteClinics.length
    });
  } catch (error) {
    logger.error('Error getting favorites:', error);
    res.status(500).json({ 
      error: 'Failed to get favorites',
      success: false,
      favorites: [],
      favoriteIds: [],
      count: 0
    });
  }
});

// Add/remove favorite - ROBUST IMPLEMENTATION
app.post('/api/user/favorites/:clinicId', verifyFirebaseToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { action } = req.body; // 'add' or 'remove'
    
    if (!clinicId) {
      return res.status(400).json({ 
        error: 'Clinic ID is required',
        success: false 
      });
    }
    
    logger.info(`User ${req.user.uid} ${action}ing clinic ${clinicId} to favorites`);
    
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    let userData = userDoc.data() || {};
    let favorites = userData.favorites || [];
    let favoriteTimestamps = userData.favoriteTimestamps || {};
    
    if (action === 'add' && !favorites.includes(clinicId)) {
      favorites.push(clinicId);
      favoriteTimestamps[clinicId] = new Date().toISOString();
      logger.info(`Added clinic ${clinicId} to favorites`);
    } else if (action === 'remove') {
      favorites = favorites.filter(id => id !== clinicId);
      delete favoriteTimestamps[clinicId];
      logger.info(`Removed clinic ${clinicId} from favorites`);
    }
    
    await userRef.update({ 
      favorites,
      favoriteTimestamps,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      favorites,
      favoriteIds: favorites,
      count: favorites.length,
      action: action,
      clinicId: clinicId
    });
  } catch (error) {
    logger.error('Error updating favorites:', error);
    res.status(500).json({ 
      error: 'Failed to update favorites',
      success: false 
    });
  }
});

// DELETE favorite (for compatibility with frontend) - ROBUST IMPLEMENTATION
app.delete('/api/user/favorites/:clinicId', verifyFirebaseToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    if (!clinicId) {
      return res.status(400).json({ 
        error: 'Clinic ID is required',
        success: false 
      });
    }
    
    logger.info(`User ${req.user.uid} removing clinic ${clinicId} from favorites (DELETE)`);
    
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    let userData = userDoc.data() || {};
    let favorites = userData.favorites || [];
    let favoriteTimestamps = userData.favoriteTimestamps || {};
    
    // Remove from favorites
    favorites = favorites.filter(id => id !== clinicId);
    delete favoriteTimestamps[clinicId];
    
    await userRef.update({ 
      favorites,
      favoriteTimestamps,
      updatedAt: new Date().toISOString()
    });
    
    logger.info(`Removed clinic ${clinicId} from favorites`);
    
    res.json({ 
      success: true, 
      favorites,
      favoriteIds: favorites,
      count: favorites.length,
      action: 'remove',
      clinicId: clinicId
    });
  } catch (error) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({ 
      error: 'Failed to remove favorite',
      success: false 
    });
  }
});

// User browsing history
app.get('/api/user/history', verifyFirebaseToken, async (req, res) => {
  try {
    const historyRef = db.collection('user_history').doc(req.user.uid);
    const historyDoc = await historyRef.get();
    
    if (!historyDoc.exists) {
      return res.json({ success: true, history: [] });
    }
    
    const historyData = historyDoc.data();
    const history = historyData.clinics || [];
    
    // Sort by most recent first
    const sortedHistory = history.sort((a, b) => 
      new Date(b.viewedAt) - new Date(a.viewedAt)
    );
    
    res.json({ 
      success: true, 
      history: sortedHistory.slice(0, 50) // Limit to last 50 entries
    });
  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({ error: 'Failed to get browsing history' });
  }
});

// Add to browsing history
app.post('/api/user/history', verifyFirebaseToken, async (req, res) => {
  try {
    const { clinicId } = req.body;
    
    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic ID required' });
    }
    
    const historyRef = db.collection('user_history').doc(req.user.uid);
    const historyDoc = await historyRef.get();
    
    let history = [];
    if (historyDoc.exists) {
      history = historyDoc.data().clinics || [];
    }
    
    // Remove existing entry for this clinic (to move to front)
    history = history.filter(item => item.clinicId !== clinicId);
    
    // Add new entry at the beginning
    history.unshift({
      clinicId,
      viewedAt: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Keep only last 100 entries
    history = history.slice(0, 100);
    
    await historyRef.set({ 
      clinics: history,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to history:', error);
    res.status(500).json({ error: 'Failed to add to history' });
  }
});

// User reviews
app.get('/api/user/my-reviews', verifyFirebaseToken, async (req, res) => {
  try {
    const reviewsRef = db.collection('reviews').where('userId', '==', req.user.uid);
    const reviewsSnapshot = await reviewsRef.get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by most recent first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Submit a review
app.post('/api/reviews', verifyFirebaseToken, async (req, res) => {
  try {
    const { clinicId, rating, comment, anonymous } = req.body;
    const userId = req.user.uid;
    
    // Validate input
    if (!clinicId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid clinic ID or rating' });
    }
    
    // Check if clinic exists
    const clinicDoc = await db.collection('clinics').doc(clinicId).get();
    if (!clinicDoc.exists) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    // Check if user already reviewed this clinic
    const existingReviewQuery = await db.collection('reviews')
      .where('userId', '==', userId)
      .where('clinicId', '==', clinicId)
      .get();
    
    if (!existingReviewQuery.empty) {
      return res.status(400).json({ error: 'You have already reviewed this clinic' });
    }
    
    // Get user profile for reviewer name
    let reviewerName = 'Anonymous User';
    if (!anonymous) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().name) {
        reviewerName = userDoc.data().name;
      }
    }
    
    const reviewData = {
      userId,
      clinicId,
      rating: parseInt(rating),
      comment: comment || '',
      reviewerName: anonymous ? 'Anonymous User' : reviewerName,
      anonymous: Boolean(anonymous),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      helpful: 0,
      helpfulBy: []
    };
    
    const reviewRef = await db.collection('reviews').add(reviewData);
    
    // Update clinic rating statistics
    await updateClinicRating(clinicId);
    
    logger.info(`Review submitted for clinic: ${clinicId} by user: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Review submitted successfully',
      reviewId: reviewRef.id
    });
  } catch (error) {
    logger.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get reviews for a clinic
app.get('/api/clinics/:clinicId/reviews', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    logger.info(`Getting reviews for clinic: ${clinicId}, page: ${page}, sort: ${sort}`);
    
    // Use the most basic query to avoid index issues
    let reviewsSnapshot;
    
    try {
      // Simple query without ordering to avoid index requirements
      reviewsSnapshot = await db.collection('reviews')
        .where('clinicId', '==', clinicId)
        .limit(parseInt(limit) || 10)
        .get();
      
      logger.info(`Found ${reviewsSnapshot.size} reviews for clinic: ${clinicId}`);
    } catch (basicError) {
      logger.warn('Basic reviews query failed, trying alternative approach:', basicError.message);
      
      // If even basic query fails, get all reviews and filter manually
      const allReviewsSnapshot = await db.collection('reviews').get();
      const clinicReviews = [];
      
      allReviewsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.clinicId === clinicId) {
          clinicReviews.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Return the filtered reviews
      return res.json({
        success: true,
        reviews: clinicReviews.slice(0, parseInt(limit) || 10),
        pagination: {
          currentPage: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          totalReviews: clinicReviews.length,
          totalPages: Math.ceil(clinicReviews.length / (parseInt(limit) || 10))
        },
        summary: {
          averageRating: clinicReviews.length > 0 ? 
            (clinicReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / clinicReviews.length).toFixed(1) : 0,
          totalReviews: clinicReviews.length,
          ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      const reviewData = doc.data();
      try {
        reviews.push({
          id: doc.id,
          ...reviewData,
          // Safe date formatting with fallbacks
          createdAt: reviewData.createdAt ? 
            new Date(reviewData.createdAt).toLocaleDateString() : 
            new Date().toLocaleDateString(),
          timeAgo: reviewData.createdAt ? 
            getTimeAgo(reviewData.createdAt) : 
            'Recently'
        });
      } catch (dateError) {
        logger.warn('Error formatting review date:', dateError.message);
        reviews.push({
          id: doc.id,
          ...reviewData,
          createdAt: 'Recently',
          timeAgo: 'Recently'
        });
      }
    });
    
    // Get total count with error handling
    let totalReviews = 0;
    let averageRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    try {
      const totalSnapshot = await db.collection('reviews')
        .where('clinicId', '==', clinicId)
        .get();
      
      totalReviews = totalSnapshot.size;
      let totalRating = 0;
      
      totalSnapshot.forEach(doc => {
        const rating = doc.data().rating || 0;
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating]++;
          totalRating += rating;
        }
      });
      
      averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
    } catch (countError) {
      logger.warn('Error calculating review stats:', countError.message);
      totalReviews = reviews.length;
      averageRating = reviews.length > 0 ? 
        (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0;
    }
    
    logger.info(`Reviews fetched successfully for clinic: ${clinicId}, total: ${totalReviews}`);
    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        totalReviews,
        totalPages: Math.ceil(totalReviews / (parseInt(limit) || 10))
      },
      summary: {
        averageRating: parseFloat(averageRating),
        totalReviews,
        ratingCounts
      }
    });
  } catch (error) {
    logger.error('Error getting clinic reviews:', error);
    // Return empty response instead of error to prevent frontend crashes
    res.json({
      success: false,
      reviews: [],
      pagination: {
        currentPage: 1,
        limit: 10,
        totalReviews: 0,
        totalPages: 0
      },
      summary: {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      error: 'Unable to load reviews at this time'
    });
  }
});

// Update/Edit review
app.put('/api/reviews/:reviewId', verifyFirebaseToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review, title } = req.body;
    const userId = req.user.uid;
    
    // Get existing review to verify ownership
    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }
    
    // Update review
    const updateData = {
      rating: parseInt(rating),
      review: review.trim(),
      title: title ? title.trim() : '',
      updatedAt: new Date().toISOString(),
      isEdited: true
    };
    
    await db.collection('reviews').doc(reviewId).update(updateData);
    
    logger.info(`Review updated: ${reviewId} by user: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Review updated successfully',
      reviewId 
    });
    
  } catch (error) {
    logger.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
app.delete('/api/reviews/:reviewId', verifyFirebaseToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.uid;
    
    // Get existing review to verify ownership
    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    // Delete review
    await db.collection('reviews').doc(reviewId).delete();
    
    logger.info(`Review deleted: ${reviewId} by user: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Review deleted successfully' 
    });
    
  } catch (error) {
    logger.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Admin reply to review
app.post('/api/reviews/:reviewId/admin-reply', verifyFirebaseToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const userId = req.user.uid;
    
    // Check if user is admin (you can implement proper admin check)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Add admin reply to review
    const replyData = {
      adminReply: reply.trim(),
      adminReplyAt: new Date().toISOString(),
      adminId: userId,
      adminName: userData.name || 'Admin'
    };
    
    await db.collection('reviews').doc(reviewId).update(replyData);
    
    logger.info(`Admin reply added to review: ${reviewId} by admin: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Admin reply added successfully' 
    });
    
  } catch (error) {
    logger.error('Error adding admin reply:', error);
    res.status(500).json({ error: 'Failed to add admin reply' });
  }
});

// Mark review as helpful
app.post('/api/reviews/:reviewId/helpful', verifyFirebaseToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.uid;
    
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    const helpfulBy = reviewData.helpfulBy || [];
    
    if (helpfulBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already marked this review as helpful' });
    }
    
    // Add user to helpful list
    helpfulBy.push(userId);
    
    await reviewRef.update({
      helpful: helpfulBy.length,
      helpfulBy: helpfulBy,
      updatedAt: new Date().toISOString()
    });
    
    logger.info(`Review ${reviewId} marked as helpful by user: ${userId}`);
    res.json({ success: true, message: 'Review marked as helpful' });
  } catch (error) {
    logger.error('Error marking review as helpful:', error);
    res.status(500).json({ error: 'Failed to mark review as helpful' });
  }
});

// Helper function to update clinic rating
async function updateClinicRating(clinicId) {
  try {
    const reviewsSnapshot = await db.collection('reviews').where('clinicId', '==', clinicId).get();
    
    if (reviewsSnapshot.empty) {
      // No reviews, reset rating
      await db.collection('clinics').doc(clinicId).update({
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      return;
    }
    
    let totalRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviewsSnapshot.forEach(doc => {
      const rating = doc.data().rating;
      totalRating += rating;
      ratingCounts[rating]++;
    });
    
    const averageRating = totalRating / reviewsSnapshot.size;
    
    await db.collection('clinics').doc(clinicId).update({
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviewsSnapshot.size,
      ratingCounts,
      updatedAt: new Date().toISOString()
    });
    
    logger.info(`Updated rating for clinic: ${clinicId}, average: ${averageRating.toFixed(1)}`);
  } catch (error) {
    logger.error(`Error updating clinic rating for ${clinicId}:`, error);
  }
}

// Helper function to get time ago
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// ============= USER DASHBOARD ENDPOINTS =============

// User dashboard data
app.get('/api/user/dashboard', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Initialize default data and tracking variables
    let profile = {};
    let favorites = [];
    let myReviews = [];
    let recentClinicsDetails = [];
    let favoriteIds = [];
    let recentClinics = [];
    
    try {
      // Get user profile - create if doesn't exist
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        profile = userDoc.data();
      } else {
        // Create new user profile for new users
        profile = {
          uid: userId,
          email: req.user.email,
          name: req.user.name || req.user.email?.split('@')[0] || 'User',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          role: 'user',
          favorites: [],
          reviewCount: 0,
          isPremium: false
        };
        
        // Save the new profile to database
        await db.collection('users').doc(userId).set(profile);
        logger.info(`Created new user profile for: ${userId}`);
      }
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      // Fallback profile for errors
      profile = {
        uid: userId,
        email: req.user.email,
        name: req.user.name || req.user.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        role: 'user',
        favorites: [],
        reviewCount: 0,
        isPremium: false
      };
    }

    try {
      // Get user favorites
      const favoritesRef = db.collection('user_favorites').doc(userId);
      const favoritesDoc = await favoritesRef.get();
      favoriteIds = favoritesDoc.exists ? (favoritesDoc.data().clinics || []) : [];
      
      // Get favorite clinics details
      if (favoriteIds.length > 0) {
        const favoriteClinics = await Promise.all(
          favoriteIds.slice(0, 10).map(async (clinicId) => {
            try {
              const clinicDoc = await db.collection('clinics').doc(clinicId).get();
              if (clinicDoc.exists) {
                return { id: clinicDoc.id, ...clinicDoc.data() };
              }
              return null;
            } catch (error) {
              logger.error(`Error fetching favorite clinic ${clinicId}:`, error);
              return null;
            }
          })
        );
        favorites = favoriteClinics.filter(clinic => clinic !== null);
      }
    } catch (error) {
      logger.error('Error fetching user favorites:', error);
    }

    try {
      // Get user reviews (simplified query to avoid index requirement)
      const reviewsSnapshot = await db.collection('reviews')
        .where('userId', '==', userId)
        .limit(10)
        .get();
      
      reviewsSnapshot.forEach(doc => {
        myReviews.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort reviews by createdAt in memory
      myReviews.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } catch (error) {
      logger.error('Error fetching user reviews:', error);
    }

    try {
      // Get browsing history
      const historyRef = db.collection('user_history').doc(userId);
      const historyDoc = await historyRef.get();
      const historyData = historyDoc.exists ? historyDoc.data() : {};
      recentClinics = historyData.clinics || [];
      
      // Get recent clinic details
      if (recentClinics.length > 0) {
        const recentDetails = await Promise.all(
          recentClinics.slice(0, 5).map(async (historyItem) => {
            try {
              const clinicDoc = await db.collection('clinics').doc(historyItem.clinicId).get();
              if (clinicDoc.exists) {
                return { 
                  id: clinicDoc.id, 
                  ...clinicDoc.data(),
                  viewedAt: historyItem.viewedAt
                };
              }
              return null;
            } catch (error) {
              logger.error(`Error fetching recent clinic ${historyItem.clinicId}:`, error);
              return null;
            }
          })
        );
        recentClinicsDetails = recentDetails.filter(clinic => clinic !== null);
      }
    } catch (error) {
      logger.error('Error fetching browsing history:', error);
    }
    
    const dashboardData = {
      profile: {
        name: profile.name || '',
        email: profile.email || req.user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        gender: profile.gender || '',
        dateJoined: profile.createdAt || new Date().toISOString()
      },
      favorites,
      myReviews,
      recentClinics: recentClinicsDetails,
      stats: {
        totalFavorites: favoriteIds.length,
        totalReviews: myReviews.length,
        totalViewed: recentClinics.length
      }
    };
    
    logger.info(`User dashboard data fetched for user: ${userId}`);
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    logger.error('Error getting user dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Delete user account with comprehensive data cleanup
app.delete('/api/user/account', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { confirmation } = req.body;
    
    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: 'Account deletion requires explicit confirmation. Please provide confirmation: "DELETE_MY_ACCOUNT"' 
      });
    }

    logger.info(`Starting account deletion process for user: ${userId}`);
    
    // Begin comprehensive data cleanup
    const deletionTasks = [];
    
    try {
      // 1. Delete user profile
      deletionTasks.push(
        db.collection('users').doc(userId).delete()
          .then(() => logger.info(`Deleted user profile: ${userId}`))
          .catch(err => logger.error(`Error deleting user profile: ${err.message}`))
      );
      
      // 2. Delete user favorites
      deletionTasks.push(
        db.collection('user_favorites').doc(userId).delete()
          .then(() => logger.info(`Deleted user favorites: ${userId}`))
          .catch(err => logger.error(`Error deleting favorites: ${err.message}`))
      );
      
      // 3. Delete user history
      deletionTasks.push(
        db.collection('user_history').doc(userId).delete()
          .then(() => logger.info(`Deleted user history: ${userId}`))
          .catch(err => logger.error(`Error deleting history: ${err.message}`))
      );
      
      // 4. Delete user reviews
      const reviewsQuery = db.collection('reviews').where('userId', '==', userId);
      deletionTasks.push(
        reviewsQuery.get().then(async (snapshot) => {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          if (snapshot.docs.length > 0) {
            await batch.commit();
            logger.info(`Deleted ${snapshot.docs.length} reviews for user: ${userId}`);
            
            // Update clinic ratings for affected clinics
            const affectedClinics = [...new Set(snapshot.docs.map(doc => doc.data().clinicId))];
            for (const clinicId of affectedClinics) {
              await updateClinicRating(clinicId);
            }
          }
        }).catch(err => logger.error(`Error deleting reviews: ${err.message}`))
      );
      
      // 5. Remove user from any admin lists (if applicable)
      deletionTasks.push(
        db.collection('admin_users').doc(userId).delete()
          .then(() => logger.info(`Removed admin access: ${userId}`))
          .catch(err => {
            // This is expected to fail for non-admin users
            if (!err.message.includes('No document to update')) {
              logger.error(`Error removing admin access: ${err.message}`);
            }
          })
      );
      
      // 6. Delete any subscription data
      deletionTasks.push(
        db.collection('subscriptions').where('userId', '==', userId).get()
          .then(async (snapshot) => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            if (snapshot.docs.length > 0) {
              await batch.commit();
              logger.info(`Deleted ${snapshot.docs.length} subscriptions for user: ${userId}`);
            }
          }).catch(err => logger.error(`Error deleting subscriptions: ${err.message}`))
      );
      
      // Execute all deletion tasks
      await Promise.allSettled(deletionTasks);
      
      // Final step: Delete Firebase Auth user
      try {
        await admin.auth().deleteUser(userId);
        logger.info(`Deleted Firebase Auth user: ${userId}`);
      } catch (authError) {
        logger.error(`Error deleting Firebase Auth user: ${authError.message}`);
        // Don't fail the entire operation if auth deletion fails
      }
      
      logger.info(`Account deletion completed successfully for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'Account deleted successfully. All associated data has been permanently removed.',
        deletedData: {
          profile: true,
          favorites: true,
          history: true,
          reviews: true,
          subscriptions: true,
          authAccount: true
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`Critical error during account deletion for ${userId}:`, error);
      res.status(500).json({
        error: 'Account deletion encountered errors. Please contact support.',
        details: 'Some data may have been partially deleted. Support team can complete the process.'
      });
    }
    
  } catch (error) {
    logger.error('Error in account deletion endpoint:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============= ADMIN ENDPOINTS =============

// Admin dashboard
app.get('/api/admin/dashboard', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const clinics = await getClinics();
    const usersSnapshot = await db.collection('users').get();
    
    const stats = {
      totalClinics: clinics.length,
      verifiedClinics: clinics.filter(c => c.verified).length,
      totalUsers: usersSnapshot.size,
      recentClinics: clinics.slice(-5).reverse()
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Add clinic (Admin only)
app.post('/api/admin/clinics', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const clinicData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      verified: false
    };
    
    const docRef = await db.collection('clinics').add(clinicData);
    
    // Clear cache
    clinicsCache = null;
    
    res.json({ success: true, id: docRef.id, message: 'Clinic added successfully' });
  } catch (error) {
    console.error('Error adding clinic:', error);
    res.status(500).json({ error: 'Failed to add clinic' });
  }
});

// Update clinic (Admin only)
app.put('/api/admin/clinics/:id', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('clinics').doc(id).update(updates);
    
    // Clear cache
    clinicsCache = null;
    
    res.json({ success: true, message: 'Clinic updated successfully' });
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ error: 'Failed to update clinic' });
  }
});

// Delete clinic (Admin only)
app.delete('/api/admin/clinics/:id', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('clinics').doc(id).delete();
    
    // Clear cache
    clinicsCache = null;
    
    res.json({ success: true, message: 'Clinic deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ error: 'Failed to delete clinic' });
  }
});

// ============= ERROR HANDLING =============

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ============= ERROR HANDLING MIDDLEWARE =============

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/clinics',
      'GET /api/clinics/:id',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/admin/dashboard',
      'POST /api/admin/clinics'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  // Handle specific error types
  if (error.code === 'auth/invalid-credential') {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials provided'
    });
  }
  
  if (error.code === 'permission-denied') {
    return res.status(403).json({
      error: 'Permission denied',
      message: 'You do not have permission to access this resource'
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message,
      details: error.details || null
    });
  }
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'External service is temporarily unavailable'
    });
  }
  
  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
});

// ============= UTILITY FUNCTIONS =============

// Helper function for accurate distance calculation using Haversine formula
function calculateAccurateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to format distance
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// Enhanced distance calculation with Vincenty's formula for higher accuracy
function calculateVincentyDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const toDeg = (rad) => rad * 180 / Math.PI;
  
  const a = 6378137; // WGS-84 semi-major axis in meters
  const b = 6356752.314245; // WGS-84 semi-minor axis in meters
  const f = 1 / 298.257223563; // WGS-84 flattening
  
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const deltaLngRad = toRad(lng2 - lng1);
  
  const U1 = Math.atan((1 - f) * Math.tan(lat1Rad));
  const U2 = Math.atan((1 - f) * Math.tan(lat2Rad));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  
  let lambda = deltaLngRad;
  let lambdaP;
  let iterLimit = 100;
  let cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;
  
  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    
    if (sinSigma === 0) return 0; // co-incident points
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line
    
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = deltaLngRad + (1 - C) * f * sinAlpha *
      (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
  
  if (iterLimit === 0) {
    // Fallback to Haversine if Vincenty fails to converge
    return calculateAccurateDistance(lat1, lng1, lat2, lng2) * 1000; // Convert to meters
  }
  
  const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
    B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  
  const s = b * A * (sigma - deltaSigma);
  return s / 1000; // Convert to kilometers
}

// ============= SERVER STARTUP =============

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('RehabConnect Server Started');
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Payment Services: ${PaymentService ? 'Available' : 'Not configured'}`);
  logger.info(`Geo Services: ${GeoService ? 'Available' : 'Not configured'}`);
  logger.info(`Cache Services: ${CacheService ? 'Available' : 'Basic memory cache'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
