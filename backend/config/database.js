const admin = require('firebase-admin');
const NodeCache = require('node-cache');

// Cache configuration - 15 minutes for clinic data, 5 minutes for user data
const clinicCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });
const userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const analyticsCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 minutes for analytics

class DatabaseService {
  constructor() {
    this.db = admin.firestore();
    this.batchSize = 100; // Firestore batch limit
  }

  // Optimized clinic fetching with caching
  async getClinics(options = {}) {
    const cacheKey = `clinics_${JSON.stringify(options)}`;
    const cached = clinicCache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached clinics');
      return cached;
    }

    let query = this.db.collection('clinics');
    
    // Apply filters if provided
    if (options.verified !== undefined) {
      query = query.where('verified', '==', options.verified);
    }
    if (options.status) {
      query = query.where('status', '==', options.status);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const clinics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    clinicCache.set(cacheKey, clinics);
    console.log(`Fetched ${clinics.length} clinics from database`);
    return clinics;
  }

  // Optimized single clinic fetch
  async getClinic(id) {
    const cacheKey = `clinic_${id}`;
    const cached = clinicCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const doc = await this.db.collection('clinics').doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const clinic = { id: doc.id, ...doc.data() };
    clinicCache.set(cacheKey, clinic);
    return clinic;
  }

  // Batch update clinics efficiently
  async updateClinics(updates) {
    const batch = this.db.batch();
    let operationCount = 0;
    const batches = [];

    for (const update of updates) {
      if (operationCount >= this.batchSize) {
        batches.push(batch);
        batch = this.db.batch();
        operationCount = 0;
      }

      const docRef = this.db.collection('clinics').doc(update.id);
      batch.update(docRef, update.data);
      operationCount++;
    }

    if (operationCount > 0) {
      batches.push(batch);
    }

    // Execute all batches
    await Promise.all(batches.map(b => b.commit()));
    
    // Invalidate cache
    clinicCache.flushAll();
    
    return { updated: updates.length };
  }

  // Optimized user data with minimal reads
  async getUserProfile(uid) {
    const cacheKey = `user_${uid}`;
    const cached = userCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const doc = await this.db.collection('users').doc(uid).get();
    const userData = doc.exists ? doc.data() : {};
    
    userCache.set(cacheKey, userData);
    return userData;
  }

  // Batch user operations
  async getUsersBatch(uids) {
    const uncachedUids = [];
    const results = {};

    // Check cache first
    for (const uid of uids) {
      const cached = userCache.get(`user_${uid}`);
      if (cached) {
        results[uid] = cached;
      } else {
        uncachedUids.push(uid);
      }
    }

    // Fetch uncached users in batches
    if (uncachedUids.length > 0) {
      const chunks = this.chunkArray(uncachedUids, 10); // Firestore limit for 'in' queries
      
      for (const chunk of chunks) {
        const snapshot = await this.db.collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        snapshot.docs.forEach(doc => {
          const userData = doc.data();
          results[doc.id] = userData;
          userCache.set(`user_${doc.id}`, userData);
        });
      }
    }

    return results;
  }

  // Efficient analytics with aggressive caching
  async getAnalytics() {
    const cacheKey = 'analytics_dashboard';
    const cached = analyticsCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Use aggregation queries where possible
    const [usersCount, clinicsCount, verifiedClinicsCount] = await Promise.all([
      this.db.collection('users').count().get(),
      this.db.collection('clinics').count().get(),
      this.db.collection('clinics').where('verified', '==', true).count().get()
    ]);

    const analytics = {
      totalUsers: usersCount.data().count,
      totalClinics: clinicsCount.data().count,
      verifiedClinics: verifiedClinicsCount.data().count,
      timestamp: new Date().toISOString()
    };

    analyticsCache.set(cacheKey, analytics);
    return analytics;
  }

  // Utility function to chunk arrays
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Clear specific cache
  clearCache(type) {
    switch (type) {
      case 'clinics':
        clinicCache.flushAll();
        break;
      case 'users':
        userCache.flushAll();
        break;
      case 'analytics':
        analyticsCache.flushAll();
        break;
      case 'all':
        clinicCache.flushAll();
        userCache.flushAll();
        analyticsCache.flushAll();
        break;
    }
  }
}

module.exports = new DatabaseService();
