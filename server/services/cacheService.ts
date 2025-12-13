import NodeCache from 'node-cache';
import { Logger } from '../utils/Logger';

const logger = new Logger('CacheService');

// Cache TTL configuration (in seconds)
const DEFAULT_TTL = 300; // 5 minutes
const LONG_TTL = 1800; // 30 minutes
const SHORT_TTL = 60; // 1 minute

/**
 * Defines the caching strategy for different data types
 */
export enum CacheStrategy {
  // No caching
  NONE = 'none',
  
  // Short-lived cache (60 seconds)
  SHORT = 'short',
  
  // Default cache duration (5 minutes)
  DEFAULT = 'default',
  
  // Long-lived cache (30 minutes)
  LONG = 'long'
}

/**
 * Cache service for application-wide caching
 */
class CacheService {
  private cache: NodeCache;
  private enabled: boolean;
  private hitCount: number = 0;
  private missCount: number = 0;
  private keyPrefix: string = 'pap:'; // PersonalysisPro prefix for all keys

  constructor() {
    this.cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // For better performance
      maxKeys: 1000 // Limit cache size
    });
    
    // Cache is enabled in production, can be disabled in development
    this.enabled = process.env.NODE_ENV === 'production';
    
    // Log cache stats periodically
    setInterval(() => this.logCacheStats(), 1800000); // every 30 minutes
    
    logger.info('Cache service initialized', {
      enabled: this.enabled,
      defaultTTL: DEFAULT_TTL,
      maxKeys: 1000
    });
  }
  
  /**
   * Builds a cache key with proper prefixing
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
  
  /**
   * Sets a value in the cache
   */
  set<T>(key: string, value: T, strategy: CacheStrategy = CacheStrategy.DEFAULT): boolean {
    if (!this.enabled) return false;
    
    // Determine TTL based on strategy
    let ttl: number;
    switch (strategy) {
      case CacheStrategy.NONE:
        return false; // Don't cache
      case CacheStrategy.SHORT:
        ttl = SHORT_TTL;
        break;
      case CacheStrategy.LONG:
        ttl = LONG_TTL;
        break;
      case CacheStrategy.DEFAULT:
      default:
        ttl = DEFAULT_TTL;
        break;
    }
    
    const cacheKey = this.buildKey(key);
    return this.cache.set(cacheKey, value, ttl);
  }
  
  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;
    
    const cacheKey = this.buildKey(key);
    const value = this.cache.get<T>(cacheKey);
    
    if (value === undefined) {
      this.missCount++;
      return undefined;
    }
    
    this.hitCount++;
    return value;
  }
  
  /**
   * Removes a value from the cache
   */
  del(key: string): number {
    const cacheKey = this.buildKey(key);
    return this.cache.del(cacheKey);
  }
  
  /**
   * Flushes the entire cache
   */
  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }
  
  /**
   * Invalidates cache keys by pattern
   * @param pattern A string pattern to match keys
   */
  invalidateByPattern(pattern: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    let deleted = 0;
    
    matchingKeys.forEach(key => {
      this.cache.del(key);
      deleted++;
    });
    
    if (deleted > 0) {
      logger.info(`Invalidated ${deleted} cache entries matching pattern: ${pattern}`);
    }
    
    return deleted;
  }
  
  /**
   * Returns cache statistics
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.hitCount + this.missCount > 0 
        ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
        : 0,
      enabled: this.enabled
    };
  }
  
  /**
   * Logs cache statistics
   */
  private logCacheStats(): void {
    const stats = this.getStats();
    logger.info('Cache statistics', stats);
  }
  
  /**
   * Enables or disables the cache
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Cache ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      this.flush();
    }
  }
  
  /**
   * Wrapper for function results caching
   * @param key Base cache key
   * @param fn Function to execute if cache miss
   * @param args Arguments to pass to the function for creating the cache key
   * @param strategy Cache strategy to use
   */
  async cachify<T, A extends any[]>(
    key: string,
    fn: (...args: A) => Promise<T>,
    args: A,
    strategy: CacheStrategy = CacheStrategy.DEFAULT
  ): Promise<T> {
    // Create a composite key that includes the arguments
    const argsKey = JSON.stringify(args);
    const cacheKey = `${key}:${argsKey}`;
    
    // Try to get from cache
    const cachedValue = this.get<T>(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Cache miss, execute function
    const result = await fn(...args);
    
    // Store in cache and return
    this.set(cacheKey, result, strategy);
    return result;
  }
}

export const cacheService = new CacheService();