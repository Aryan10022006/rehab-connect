// Professional Rate Limiting Middleware
const redis = require('redis');

class RateLimitService {
  constructor() {
    this.memoryStore = new Map();
    this.redisClient = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      // Production Redis configuration
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL || process.env.REDISCLOUD_URL;
      
      if (redisUrl && redisUrl !== 'redis://localhost:6379') {
        this.redisClient = redis.createClient({
          url: redisUrl,
          socket: { 
            connectTimeout: 10000,
            lazyConnect: true,
            reconnectStrategy: (retries) => {
              // Exponential backoff with max delay of 5 seconds
              return Math.min(retries * 100, 5000);
            }
          },
          // Production Redis often requires password
          ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
        });
        
        await this.redisClient.connect();
        console.log('✅ Rate limiting using Redis (Production)');
      } else {
        console.log('ℹ️ Rate limiting using memory store (fallback)');
      }
    } catch (error) {
      console.log('⚠️ Redis unavailable, using memory store for rate limiting:', error.message);
      this.redisClient = null;
    }
  }

  async isRateLimited(key, limit, windowMs) {
    const now = Date.now();
    
    if (this.redisClient) {
      return this.checkRedisRateLimit(key, limit, windowMs, now);
    } else {
      return this.checkMemoryRateLimit(key, limit, windowMs, now);
    }
  }

  async checkRedisRateLimit(key, limit, windowMs, now) {
    try {
      const pipeline = this.redisClient.multi();
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results[1][1];
      
      return {
        limited: count >= limit,
        count: count + 1,
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return this.checkMemoryRateLimit(key, limit, windowMs, now);
    }
  }

  checkMemoryRateLimit(key, limit, windowMs, now) {
    if (!this.memoryStore.has(key)) {
      this.memoryStore.set(key, { requests: [], resetTime: now + windowMs });
    }

    const userData = this.memoryStore.get(key);
    
    // Reset if window expired
    if (now > userData.resetTime) {
      userData.requests = [];
      userData.resetTime = now + windowMs;
    }

    // Clean old requests
    userData.requests = userData.requests.filter(time => now - time < windowMs);
    userData.requests.push(now);

    return {
      limited: userData.requests.length > limit,
      count: userData.requests.length,
      resetTime: userData.resetTime
    };
  }

  // Different rate limits for different endpoints
  createMiddleware(options = {}) {
    const {
      windowMs = 60 * 1000, // 1 minute
      limit = 100, // 100 requests per minute
      keyGenerator = (req) => req.ip || 'anonymous',
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      message = 'Too many requests, please try again later'
    } = options;

    return async (req, res, next) => {
      try {
        const key = `rate_limit:${keyGenerator(req)}`;
        const result = await this.isRateLimited(key, limit, windowMs);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': limit,
          'X-RateLimit-Remaining': Math.max(0, limit - result.count),
          'X-RateLimit-Reset': new Date(result.resetTime)
        });

        if (result.limited) {
          return res.status(429).json({
            error: message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }

        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance
          this.cleanup();
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Allow request on error
      }
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (now > data.resetTime + 60000) { // Clean entries older than 1 minute past reset
        this.memoryStore.delete(key);
      }
    }
  }
}

const rateLimitService = new RateLimitService();

// Different rate limits for different types of requests
module.exports = {
  // General API rate limiting - 100 requests per minute
  generalRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 100,
    message: 'Too many requests, please slow down'
  }),

  // Search API - more restrictive - 30 requests per minute
  searchRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 30,
    message: 'Too many searches, please wait before searching again'
  }),

  // User data fetching - moderate - 60 requests per minute
  userDataRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (req) => req.user?.uid || req.ip,
    message: 'Too many profile requests, please wait'
  }),

  // Auth endpoints - strict - 20 requests per minute
  authRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 20,
    message: 'Too many authentication attempts, please wait'
  }),

  // Admin endpoints - very strict - 10 requests per minute
  adminRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 10,
    keyGenerator: (req) => req.user?.uid || req.ip,
    message: 'Admin rate limit exceeded'
  }),

  // Clinic fetching with caching - 50 requests per minute
  clinicRateLimit: rateLimitService.createMiddleware({
    windowMs: 60 * 1000,
    limit: 50,
    message: 'Too many clinic requests, data is cached for your convenience'
  }),

  rateLimitService
};
