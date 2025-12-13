import { Request, Response, NextFunction } from 'express';

// Type for cache entries
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// Cache service class
class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time to live in milliseconds
  private maxSize: number; // Maximum number of entries
  private hitCount: number;
  private missCount: number;
  private lastCleanup: number;
  
  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 1000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;
    this.lastCleanup = Date.now();
    
    // Schedule regular cleanup
    setInterval(() => this.cleanup(), 60000); // Run cleanup every minute
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Run cleanup if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
      
      // If still full after cleanup, remove oldest entry
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }
    
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }
    
    this.hitCount++;
    return entry.data as T;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  /**
   * Get or compute a value
   * @param key Cache key
   * @param compute Function to compute the value if not in cache
   * @param ttl Optional TTL override
   * @returns Promise resolving to the cached or computed value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const computed = await compute();
    this.set(key, computed, ttl);
    return computed;
  }
  
  /**
   * Remove expired entries from the cache
   * @returns Number of entries removed
   */
  private cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.lastCleanup = now;
    return count;
  }
  
  /**
   * Get cache statistics
   * @returns Statistics about the cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.calculateHitRate(),
      lastCleanup: this.lastCleanup,
    };
  }
  
  /**
   * Calculate the cache hit rate
   * @returns Hit rate as a percentage
   */
  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount;
    if (total === 0) return 0;
    return (this.hitCount / total) * 100;
  }
}

// Create a singleton instance
const cacheService = new CacheService();

/**
 * Middleware for caching API responses
 * @param ttl Time to live in milliseconds (optional)
 * @returns Express middleware function
 */
export function cacheMiddleware(ttl?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated requests by default
    // Can be customized based on your requirements
    if ((req as any).user) {
      return next();
    }
    
    // Create a cache key from the request path and query
    const cacheKey = `${req.originalUrl}`;
    
    // Try to get from cache
    const cachedResponse = cacheService.get<{ data: any; statusCode: number }>(cacheKey);
    
    if (cachedResponse) {
      return res.status(cachedResponse.statusCode).json(cachedResponse.data);
    }
    
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(
          cacheKey,
          { data, statusCode: res.statusCode },
          ttl
        );
      }
      
      // Call the original method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware for conditional caching of API responses
 * @param shouldCache Function that decides if the response should be cached
 * @param ttl Time to live in milliseconds (optional)
 * @returns Express middleware function
 */
export function conditionalCacheMiddleware(
  shouldCache: (req: Request) => boolean,
  ttl?: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!shouldCache(req)) {
      return next();
    }
    
    // Create a cache key from the request path and query
    const cacheKey = `${req.originalUrl}`;
    
    // Try to get from cache
    const cachedResponse = cacheService.get<{ data: any; statusCode: number }>(cacheKey);
    
    if (cachedResponse) {
      return res.status(cachedResponse.statusCode).json(cachedResponse.data);
    }
    
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(
          cacheKey,
          { data, statusCode: res.statusCode },
          ttl
        );
      }
      
      // Call the original method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Clear cache entries matching a pattern
 * @param pattern String or RegExp to match against cache keys
 */
export function clearCachePattern(pattern: string | RegExp): void {
  for (const key of cacheService.getKeys()) {
    if (typeof pattern === 'string') {
      if (key.includes(pattern)) {
        cacheService.delete(key);
      }
    } else if (pattern.test(key)) {
      cacheService.delete(key);
    }
  }
}

// Add method to get all keys for pattern matching
CacheService.prototype.getKeys = function() {
  return Array.from(this.cache.keys());
};

export default cacheService;