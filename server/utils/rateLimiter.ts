/**
 * Rate Limiter
 * 
 * This module provides rate limiting functionality to protect routes from 
 * brute force attacks and abuse.
 * 
 * It includes:
 * - A memory-based rate limiter implementation
 * - Middleware for API routes with configurable limits
 * - A stricter middleware for auth-related routes
 * - Stats monitoring for administrative purposes
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Simple in-memory store for rate limiting
const requestStore = new Map<string, { count: number, resetTime: number }>();

// Stats for monitoring
const stats = {
  totalRequests: 0,
  limitedRequests: 0,
  activeKeys: 0
};

/**
 * Returns a unique key for a request based on IP and optional identifier
 */
function getClientKey(req: Request, keyType: string): string {
  const ip = req.ip || '0.0.0.0';
  
  // For auth routes, we might want to include the username as part of the key
  if (keyType === 'auth' && req.body && req.body.username) {
    return `${ip}-${keyType}-${req.body.username}`;
  }
  
  return `${ip}-${keyType}`;
}

interface RateLimitOptions {
  windowSec: number;      // Time window in seconds
  maxRequests: number;    // Maximum requests per window
  message?: string;       // Optional custom message
  keyPrefix?: string;     // Optional key prefix
  headerEnabled?: boolean; // Whether to include rate limit headers
}

/**
 * Generic rate limiting middleware factory
 */
function createRateLimiterMiddleware(options: RateLimitOptions) {
  const {
    windowSec, 
    maxRequests, 
    message = 'Too many requests, please try again later',
    keyPrefix = 'generic',
    headerEnabled = true
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // In development mode, apply much more generous limits
    const isDevelopment = process.env.NODE_ENV === 'development';
    const adjustedMaxRequests = isDevelopment ? maxRequests * 50 : maxRequests; // 50x more generous in dev
    const adjustedWindowSec = isDevelopment ? Math.max(windowSec, 300) : windowSec; // At least 5 min window in dev
    
    // Get client identifier
    const clientKey = getClientKey(req, keyPrefix);
    
    // Increment stats
    stats.totalRequests++;
    
    // Get current time
    const now = Date.now();
    
    // Get or initialize client state
    let clientState = requestStore.get(clientKey);
    
    if (!clientState || now > clientState.resetTime) {
      // Initialize new window
      clientState = {
        count: 0,
        resetTime: now + (adjustedWindowSec * 1000)
      };
      requestStore.set(clientKey, clientState);
      stats.activeKeys = requestStore.size;
    }
    
    // Increment request count
    clientState.count++;
    
    // Calculate remaining slots and time until reset
    const remaining = Math.max(0, adjustedMaxRequests - clientState.count);
    const resetInSec = Math.ceil((clientState.resetTime - now) / 1000);
    
    // Set rate limit headers if enabled
    if (headerEnabled) {
      res.setHeader('X-RateLimit-Limit', adjustedMaxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(clientState.resetTime / 1000).toString());
    }
    
    // Check if rate limit is exceeded (>= maxRequests)
    if (clientState.count >= adjustedMaxRequests) {
      stats.limitedRequests++;
      
      // Log rate limit event
      console.warn(`Rate limit exceeded for ${clientKey}: ${clientState.count} requests`);
      
      // Set retry header
      res.setHeader('Retry-After', resetInSec.toString());
      
      return next(new AppError(message, 429));
    }
    
    // Rate limit not exceeded, proceed to next middleware
    next();
  };
}

/**
 * Regular API rate limiter - more lenient
 */
export const apiRateLimiter = (options: Omit<RateLimitOptions, 'keyPrefix'>) => 
  createRateLimiterMiddleware({
    ...options,
    keyPrefix: 'api'
  });

/**
 * Auth routes rate limiter - more strict
 */
export const authRateLimiter = (options: Omit<RateLimitOptions, 'keyPrefix'>) => 
  createRateLimiterMiddleware({
    ...options,
    keyPrefix: 'auth'
  });

/**
 * Housekeeping function to clean up expired entries
 * This should be called periodically in a production app
 */
export function cleanupRateLimiter(): void {
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, value] of requestStore.entries()) {
    if (now > value.resetTime) {
      requestStore.delete(key);
    }
  }
  
  // Update stats
  stats.activeKeys = requestStore.size;
}

/**
 * Reset rate limits for testing or maintenance
 */
export function resetRateLimits(): void {
  requestStore.clear();
  
  // Reset stats
  stats.totalRequests = 0;
  stats.limitedRequests = 0;
  stats.activeKeys = 0;
}

/**
 * Get rate limiting statistics for monitoring
 */
export function getRateLimitStats() {
  return {
    ...stats,
    activeIPs: new Set([...requestStore.keys()].map(key => key.split('-')[0])).size,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
  };
}

// Initialize cleanup interval (every 5 minutes)
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupRateLimiter, 5 * 60 * 1000);
}

// Register exit handler to cleanup resources
process.on('exit', () => {
  requestStore.clear();
});

export default {
  apiRateLimiter,
  authRateLimiter,
  getRateLimitStats,
  cleanupRateLimiter,
  resetRateLimits
};