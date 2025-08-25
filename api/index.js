// Vercel serverless function handler
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
let db;
try {
  if (!admin.apps.length) {
    // Use environment variables for Firebase config
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID || "rehab-connect-backend",
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
        };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });
  }
  db = admin.firestore();
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Create Express app
const app = express();

// Enhanced CORS configuration for Vercel
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://rehab-connect-pi.vercel.app',
    'https://rehab-connect-git-main-aryan-tambolis-projects.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging utility
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? error.stack || error : '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Simple in-memory cache for serverless
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Get all clinics with caching
async function getClinics() {
  const cacheKey = 'all_clinics';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const snapshot = await db.collection('clinics').get();
    const clinics = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (typeof data.lat === 'number' && typeof data.long === 'number') {
        clinics.push({
          id: doc.id,
          ...data,
          coordinates: {
            lat: data.lat,
            lng: data.long
          }
        });
      }
    });

    // Cache the results
    cache.set(cacheKey, {
      data: clinics,
      timestamp: Date.now()
    });

    return clinics;
  } catch (error) {
    logger.error('Error fetching clinics:', error);
    return [];
  }
}

// Precision Pincode Search
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
    
    logger.info(`🎯 Results: ${exactMatches.length} exact, ${addressMatches.length} address, ${locationMatches.length} location, ${nearbyMatches.length} nearby = ${results.length} total`);
    
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

// Basic clinic search
app.get('/api/clinics/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ clinics: [], total: 0 });
    }
    
    const allClinics = await getClinics();
    const queryLower = query.toLowerCase().trim();
    
    // Simple text search
    let matchingClinics = allClinics.filter(clinic => {
      return clinic.name?.toLowerCase().includes(queryLower) ||
             clinic.address?.toLowerCase().includes(queryLower) ||
             clinic.location?.toLowerCase().includes(queryLower) ||
             clinic.specialization?.toLowerCase().includes(queryLower);
    });
    
    // Sort by relevance
    matchingClinics = matchingClinics.sort((a, b) => {
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
      
      return bScore - aScore;
    });
    
    const results = matchingClinics.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      clinics: results,
      total: results.length,
      query
    });
    
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all clinics
app.get('/api/clinics', async (req, res) => {
  try {
    const clinics = await getClinics();
    res.json({
      success: true,
      clinics,
      total: clinics.length
    });
  } catch (error) {
    logger.error('Get clinics error:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export the Express app for Vercel
module.exports = app;
