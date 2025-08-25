// Redis Caching Service for Ultra-Fast Data Access
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Only try Redis if explicitly configured and available
      if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
            lazyConnect: true
          }
        });

        this.client.on('error', (err) => {
          console.log('⚠️ Redis connection failed, falling back to memory cache');
          this.isConnected = false;
          this.initializeMemoryCache();
        });

        this.client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isConnected = true;
        });

        // Test connection
        await this.client.connect();
        await this.client.ping();
      } else {
        console.log('ℹ️ Using in-memory cache (Redis not configured)');
        this.initializeMemoryCache();
      }
    } catch (error) {
      console.log('ℹ️ Redis not available, using in-memory cache');
      this.initializeMemoryCache();
    }
  }

  initializeMemoryCache() {
    this.memoryCache = new Map();
    this.isConnected = false;
    this.client = null;
  }

  // Get data from cache
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } else if (this.memoryCache) {
        const cached = this.memoryCache.get(key);
        if (cached && Date.now() < cached.expiry) {
          return cached.data;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.log('Cache get error for key', key);
      return null;
    }
  }

  // Set data in cache with TTL
  async set(key, data, ttlSeconds = 300) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
      } else if (this.memoryCache) {
        this.memoryCache.set(key, {
          data,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      console.log('Cache set error for key', key);
    }
  }

  // Specialized clinic caching methods
  async getClinicsInRadius(lat, lng, radius) {
    const key = `clinics:radius:${lat}:${lng}:${radius}`;
    return await this.get(key);
  }

  async setClinicsInRadius(lat, lng, radius, clinics, ttl = 300) {
    const key = `clinics:radius:${lat}:${lng}:${radius}`;
    await this.set(key, clinics, ttl);
  }

  async getClinicsByPincode(pincode) {
    const key = `clinics:pincode:${pincode}`;
    return await this.get(key);
  }

  async setClinicsByPincode(pincode, clinics, ttl = 600) {
    const key = `clinics:pincode:${pincode}`;
    await this.set(key, clinics, ttl);
  }

  // Search result caching
  async getSearchResults(searchHash) {
    const key = `search:${searchHash}`;
    return await this.get(key);
  }

  async setSearchResults(searchHash, results, ttl = 180) {
    const key = `search:${searchHash}`;
    await this.set(key, results, ttl);
  }

  // Popular searches caching
  async getPopularSearches() {
    return await this.get('popular_searches');
  }

  async setPopularSearches(searches, ttl = 3600) {
    await this.set('popular_searches', searches, ttl);
  }

  // Clear cache patterns
  async clearPattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else if (this.memoryCache) {
        const keysToDelete = [];
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.error('Clear cache pattern error:', error);
    }
  }

  // Generate hash for search parameters
  generateSearchHash(searchParams) {
    const normalized = {
      query: searchParams.query || '',
      lat: searchParams.lat || '',
      lng: searchParams.lng || '',
      pincode: searchParams.pincode || '',
      radius: searchParams.radius || 10,
      filters: searchParams.filters || {}
    };
    
    return Buffer.from(JSON.stringify(normalized)).toString('base64');
  }

  // Memory usage monitoring
  getStats() {
    if (this.isConnected && this.client) {
      return { type: 'redis', connected: true };
    } else if (this.memoryCache) {
      return { 
        type: 'memory', 
        size: this.memoryCache.size,
        connected: true 
      };
    }
    return { type: 'none', connected: false };
  }
}

module.exports = new CacheService();
