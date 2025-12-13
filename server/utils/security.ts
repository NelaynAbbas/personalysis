/**
 * Security Utilities
 * 
 * A collection of security-focused utilities for protecting against common
 * web vulnerabilities like XSS, CSRF, and others.
 */

import { randomBytes, timingSafeEqual, createHash } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;

  // Simple sanitization function since xss-clean doesn't expose a direct sanitize method
  // It's designed to be used as middleware
  const sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Additional protection: replace common attack vectors
  return sanitized
    .replace(/javascript:/gi, 'blocked:')
    .replace(/data:/gi, 'blocked:')
    .replace(/vbscript:/gi, 'blocked:')
    // More aggressive event handler blocking - handles various formats (space, quotes, etc.)
    .replace(/\son\w+\s*=\s*(['"`])?[^'"]*(['"`])?/gi, '');
}

/**
 * Recursively sanitizes all string values in an object
 * @param obj Object to sanitize
 * @returns Sanitized object with same structure
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to sanitize request query parameters
 */
export function sanitizeQuery(req: Request, _res: Response, next: NextFunction) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Middleware to sanitize request URL parameters
 */
export function sanitizeParams(req: Request, _res: Response, next: NextFunction) {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Combined middleware to sanitize all request inputs
 */
export function sanitizeRequestMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Generates a cryptographically secure random token
 * @param length Desired length of the token (default: 32)
 * @returns Random secure token as a hex string
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param expected Expected value
 * @param actual Actual value to compare
 * @returns True if values match
 */
export function constantTimeCompare(expected: string, actual: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Creates a hash of a value using specified algorithm (default: sha256)
 * @param value Value to hash
 * @param algorithm Hashing algorithm to use (default: sha256)
 * @returns Hexadecimal string of the hash
 */
export function hashValue(value: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(value).digest('hex');
}

/**
 * Generates a URL-safe random verification token
 * for email verification, password reset, etc.
 * @returns URL-safe token string
 */
export function generateVerificationToken(userId: string | number): string {
  const randomPart = generateSecureToken(16);
  const timestamp = Date.now().toString();
  const payload = `${userId}-${timestamp}-${randomPart}`;
  return Buffer.from(payload).toString('base64url');
}

/**
 * Verify and decode a token, ensuring it's not expired
 * @param token The token to verify
 * @param maxAgeMs Maximum age in milliseconds (default: 24 hours)
 * @returns Object with userId and isValid, or null if invalid
 */
export function verifyToken(token: string, maxAgeMs = 24 * 60 * 60 * 1000): { userId: string; timestamp: number } | null {
  try {
    // Decode the token
    const payload = Buffer.from(token, 'base64url').toString('utf-8');
    const [userId, timestampStr] = payload.split('-');
    
    // Check if all parts are present
    if (!userId || !timestampStr) {
      return null;
    }
    
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if token is expired
    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return null;
    }
    
    return { userId, timestamp };
  } catch (error) {
    return null;
  }
}

export default {
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeRequestMiddleware,
  generateSecureToken,
  constantTimeCompare,
  hashValue,
  generateVerificationToken,
  verifyToken
};