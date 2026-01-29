// Simple in-memory cache implementation
// For production, consider using Redis

const cache = new Map();

// @desc    Cache middleware for GET requests
// @param   duration - Cache duration in seconds (default: 5 minutes)
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache if user is authenticated (personalized data)
    if (req.user) {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      const { body, timestamp } = cachedResponse;
      const age = (Date.now() - timestamp) / 1000;

      // Check if cache is still valid
      if (age < duration) {
        console.log(`✓ Cache hit: ${key} (age: ${age.toFixed(2)}s)`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', age.toFixed(2));
        return res.json(body);
      } else {
        // Cache expired, delete it
        cache.delete(key);
      }
    }

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          body,
          timestamp: Date.now()
        });
        console.log(`✓ Cache miss: ${key} - Cached for ${duration}s`);
      }

      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

// @desc    Clear cache for specific routes or all cache
const clearCache = (pattern = null) => {
  if (!pattern) {
    // Clear all cache
    const size = cache.size;
    cache.clear();
    console.log(`Cleared ${size} cache entries`);
    return size;
  }

  // Clear cache matching pattern
  let cleared = 0;
  for (const [key] of cache.entries()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  
  console.log(`Cleared ${cleared} cache entries matching pattern: ${pattern}`);
  return cleared;
};

// @desc    Clear cache middleware - for use after mutations
const clearCacheAfter = (patterns = []) => {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to clear cache after successful response
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => clearCache(pattern));
      }
      return originalJson(body);
    };

    next();
  };
};

// @desc    Get cache statistics
const getCacheStats = () => {
  const stats = {
    size: cache.size,
    keys: [],
    totalSize: 0
  };

  for (const [key, value] of cache.entries()) {
    const age = (Date.now() - value.timestamp) / 1000;
    const size = JSON.stringify(value.body).length;
    
    stats.keys.push({
      key,
      age: `${age.toFixed(2)}s`,
      size: `${(size / 1024).toFixed(2)}KB`
    });
    
    stats.totalSize += size;
  }

  stats.totalSize = `${(stats.totalSize / 1024).toFixed(2)}KB`;
  
  return stats;
};

// @desc    Cache warming - pre-populate cache with frequently accessed data
const warmCache = async (routes = []) => {
  console.log('Warming cache...');
  
  for (const route of routes) {
    try {
      // You would make internal requests here to populate cache
      console.log(`Warming cache for: ${route}`);
    } catch (error) {
      console.error(`Error warming cache for ${route}:`, error);
    }
  }
  
  console.log('Cache warming complete');
};

// @desc    Automatic cache cleanup - remove expired entries
const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of cache.entries()) {
    const age = (now - value.timestamp) / 1000;
    
    // Remove entries older than 1 hour
    if (age > 3600) {
      cache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired cache entries`);
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

// @desc    Cache control headers middleware
const cacheControl = (maxAge = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheAfter,
  getCacheStats,
  warmCache,
  cleanupCache,
  cacheControl
};