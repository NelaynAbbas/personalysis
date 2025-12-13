import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as security from '../../server/utils/security';
import * as rateLimiter from '../../server/utils/rateLimiter';
import cacheService from '../../server/utils/cache';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should sanitize XSS attack vectors', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = security.sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toBe(malicious);
    });
    
    it('should sanitize javascript: protocol', () => {
      const malicious = 'javascript:alert(1)';
      const sanitized = security.sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('javascript:');
    });
    
    it('should sanitize event handlers', () => {
      const malicious = '<img src="x" onerror="alert(1)">';
      const sanitized = security.sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('onerror=');
    });
    
    it('should handle null or undefined gracefully', () => {
      expect(security.sanitizeInput('')).toBe('');
      expect(security.sanitizeInput(undefined as any)).toBeUndefined();
      expect(security.sanitizeInput(null as any)).toBeNull();
    });
  });
  
  describe('generateSecureToken', () => {
    it('should generate a token of the specified length', () => {
      const token = security.generateSecureToken(16);
      expect(token).toHaveLength(16);
    });
    
    it('should generate different tokens each time', () => {
      const token1 = security.generateSecureToken();
      const token2 = security.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });
  
  describe('hashValue', () => {
    it('should hash a value consistently', () => {
      const value = 'test-password';
      const hash1 = security.hashValue(value);
      const hash2 = security.hashValue(value);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(value);
    });
  });
});

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.resetRateLimits();
  });
  
  it('should provide rate limiting statistics', () => {
    const stats = rateLimiter.getRateLimitStats();
    
    expect(stats).toHaveProperty('totalRequests');
    expect(stats).toHaveProperty('limitedRequests');
    expect(stats).toHaveProperty('activeKeys');
  });
});

describe('Cache Service', () => {
  beforeEach(() => {
    cacheService.clear();
  });
  
  it('should store and retrieve values', () => {
    const key = 'test-key';
    const value = { data: 'test-value' };
    
    cacheService.set(key, value);
    
    const retrieved = cacheService.get(key);
    expect(retrieved).toEqual(value);
  });
  
  it('should return undefined for non-existent keys', () => {
    const retrieved = cacheService.get('non-existent');
    expect(retrieved).toBeUndefined();
  });
  
  it('should handle getOrCompute for missing values', async () => {
    const key = 'computed-key';
    const computeFn = vi.fn().mockResolvedValue('computed-value');
    
    const result = await cacheService.getOrCompute(key, computeFn);
    
    expect(result).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    const cachedResult = await cacheService.getOrCompute(key, computeFn);
    expect(cachedResult).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1); // Still only called once
  });
  
  it('should delete values', () => {
    const key = 'to-delete';
    cacheService.set(key, 'value');
    
    expect(cacheService.get(key)).toBe('value');
    
    cacheService.delete(key);
    expect(cacheService.get(key)).toBeUndefined();
  });
  
  it('should check if a key exists', () => {
    const key = 'exists-check';
    cacheService.set(key, 'value');
    
    expect(cacheService.has(key)).toBe(true);
    expect(cacheService.has('non-existent')).toBe(false);
  });
});