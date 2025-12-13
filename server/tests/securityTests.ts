/**
 * Security Feature Tests
 * 
 * This file contains tests for security-related features like:
 * - XSS protection
 * - CSRF protection 
 * - Rate limiting
 * - Input validation
 * - Authorization checks
 */

import { Request, Response, NextFunction } from 'express';
import * as security from '../utils/security';
import * as rateLimiter from '../utils/rateLimiter';
import { csrfProtection, handleCsrfError } from '../middleware/csrfMiddleware';
import { sanitizeRequestMiddleware } from '../utils/security';
import { runTest, createMockRequest, createMockResponse } from '../utils/testUtils';
import { validate, validationSchemas } from '../middleware/validationMiddleware';
import { z } from 'zod';

// Security utilities tests
runTest('Security: String sanitization', (assert) => {
  // Test XSS protection in string sanitization
  const maliciousInput = '<script>alert("XSS")</script>';
  const sanitized = security.sanitizeInput(maliciousInput);
  
  assert(sanitized !== maliciousInput, 'Malicious script should be sanitized');
  assert(!sanitized.includes('<script>'), 'Script tags should be removed');
  
  // Test JS protocol handling
  const jsProtocol = 'javascript:alert(1)';
  const protocolSanitized = security.sanitizeInput(jsProtocol);
  
  assert(protocolSanitized !== jsProtocol, 'JS protocol should be sanitized');
  
  // Test sanitization of event handlers
  const eventHandler = '<img onerror="alert(1)" src="invalid.jpg">';
  const handlerSanitized = security.sanitizeInput(eventHandler);
  
  assert(!handlerSanitized.includes('onerror='), 'Event handlers should be sanitized');
});

runTest('Security: Object sanitization', (assert) => {
  // Create object with nested malicious content
  const maliciousObject = {
    name: 'Test User',
    bio: '<script>alert("XSS")</script>',
    preferences: {
      theme: 'dark',
      notification: '<img src="x" onerror="alert(2)">'
    },
    tags: ['<script>document.cookie</script>', 'normal tag']
  };
  
  const sanitized = security.sanitizeObject(maliciousObject);
  
  // Verify strings were sanitized but structure preserved
  assert(sanitized.bio !== maliciousObject.bio, 'Bio should be sanitized');
  assert(!sanitized.bio.includes('<script>'), 'Script in bio should be removed');
  
  assert(sanitized.preferences.notification !== maliciousObject.preferences.notification, 
    'Nested property should be sanitized');
  
  assert(sanitized.tags[0] !== maliciousObject.tags[0], 
    'Array items should be sanitized');
  
  // Make sure safe values are unchanged
  assert(sanitized.name === maliciousObject.name, 'Safe values should be preserved');
  assert(sanitized.preferences.theme === maliciousObject.preferences.theme, 
    'Safe nested values should be preserved');
});

runTest('Security: CSRF token generation and validation', (assert) => {
  // Mock for csrfToken function that req.csrfToken would provide
  const csrfToken = () => 'token_123456';
  
  // Create a mock request with the token function
  const req: any = {
    csrfToken
  };
  
  // Create a mock response to capture the cookie setting
  const res: any = {
    cookie: jest.fn(),
    locals: {}
  };
  
  // Mock next function
  const next = jest.fn();
  
  // Test the token generation function
  try {
    // Use the imported generateCsrfToken but need to handle typings
    const generateCsrfToken = require('../middleware/csrfMiddleware').generateCsrfToken;
    generateCsrfToken(req, res, next);
    
    // Verify the token was set in the response
    assert(res.cookie.mock.calls.length === 1, 'Should set a cookie');
    assert(res.cookie.mock.calls[0][0] === 'XSRF-TOKEN', 'Should set XSRF-TOKEN cookie');
    assert(res.cookie.mock.calls[0][1] === 'token_123456', 'Cookie should contain the token');
    
    // Verify token was also set in locals for template rendering
    assert(res.locals.csrfToken === 'token_123456', 'Token should be set in locals');
    
    // Verify next was called
    assert(next.mock.calls.length === 1, 'Next should be called');
  } catch (error) {
    assert(false, `CSRF test threw error: ${error}`);
  }
});

runTest('Security: Token generation', (assert) => {
  // Generate and verify a token
  const token1 = security.generateSecureToken();
  const token2 = security.generateSecureToken();
  
  // Verify tokens are of expected length
  assert(token1.length === 32, 'Should generate 32 character token by default');
  
  // Verify tokens are random (different)
  assert(token1 !== token2, 'Should generate unique tokens');
  
  // Verify custom length
  const shortToken = security.generateSecureToken(16);
  assert(shortToken.length === 16, 'Should respect custom token length');
});

runTest('Security: Constant time comparison', (assert) => {
  // Test strings that are equal
  const str1 = 'secure_token_123';
  const str2 = 'secure_token_123';
  
  assert(security.constantTimeCompare(str1, str2) === true, 'Equal strings should match');
  
  // Test strings that are not equal
  const str3 = 'secure_token_124';
  assert(security.constantTimeCompare(str1, str3) === false, 'Unequal strings should not match');
  
  // Test strings of different length
  const str4 = 'secure_token_1234';
  assert(security.constantTimeCompare(str1, str4) === false, 'Different length strings should not match');
});

runTest('Security: Hash value', (assert) => {
  // Create a hash
  const value = 'test_value';
  const hash1 = security.hashValue(value);
  const hash2 = security.hashValue(value);
  
  // Same input should produce same hash
  assert(hash1 === hash2, 'Same input should produce same hash');
  
  // Verify hash is not the original value
  assert(hash1 !== value, 'Hash should be different from input');
  
  // Verify hash is of expected format (hex string)
  assert(/^[0-9a-f]+$/.test(hash1), 'Hash should be a hex string');
});

runTest('Security: Verification token', (assert) => {
  // Generate a verification token
  const userId = '12345';
  const token = security.generateVerificationToken(userId);
  
  // Verify the token
  const result = security.verifyToken(token);
  
  // Verify result contains the expected data
  assert(result !== null, 'Valid token should be verified');
  if (result) {
    assert(result.userId === userId, 'Token should contain the user ID');
  }
  
  // Test with expired token
  const expiredResult = security.verifyToken(token, -1); // Negative max age forces expiration
  assert(expiredResult === null, 'Expired token should not verify');
  
  // Test with invalid token
  const invalidResult = security.verifyToken('invalid.token.format');
  assert(invalidResult === null, 'Invalid token should not verify');
});

runTest('Security: Rate limiter basic functionality', (assert) => {
  // Reset rate limiter state for clean test
  rateLimiter.resetRateLimits();
  
  // Create middleware with low limits for testing
  const testLimiter = rateLimiter.apiRateLimiter({
    windowSec: 60,
    maxRequests: 2,
    message: 'Test rate limit exceeded'
  });
  
  // Create mock objects
  const req1 = createMockRequest({ ip: '127.0.0.1' });
  const res1 = createMockResponse();
  const next1 = jest.fn();
  
  // First request should pass
  testLimiter(req1, res1, next1);
  assert(next1.mock.calls.length === 1, 'First request should pass rate limiter');
  assert(res1.getHeader('X-RateLimit-Remaining') === '1', 'Should have 1 request remaining');
  
  // Second request should also pass but use last allowed request
  const req2 = createMockRequest({ ip: '127.0.0.1' });
  const res2 = createMockResponse();
  const next2 = jest.fn();
  
  testLimiter(req2, res2, next2);
  assert(next2.mock.calls.length === 1, 'Second request should pass rate limiter');
  assert(res2.getHeader('X-RateLimit-Remaining') === '0', 'Should have 0 requests remaining');
  
  // Third request should be limited
  const req3 = createMockRequest({ ip: '127.0.0.1' });
  const res3 = createMockResponse();
  const next3 = jest.fn();
  
  testLimiter(req3, res3, next3);
  
  // Next should be called with an error
  assert(next3.mock.calls.length === 1, 'Next should be called with error');
  assert(next3.mock.calls[0][0] instanceof Error, 'Should pass error to next');
  assert(next3.mock.calls[0][0].message === 'Test rate limit exceeded', 'Should have correct error message');
  assert(next3.mock.calls[0][0].statusCode === 429, 'Should have 429 status code');
  
  // Requests from a different IP should not be affected
  const req4 = createMockRequest({ ip: '192.168.1.1' });
  const res4 = createMockResponse();
  const next4 = jest.fn();
  
  testLimiter(req4, res4, next4);
  assert(next4.mock.calls.length === 1 && !next4.mock.calls[0][0], 'Different IP should not be limited');
  
  // Cleanup
  rateLimiter.resetRateLimits();
});

runTest('Security: Request sanitization middleware', (assert) => {
  // Create a mock request with potentially harmful data
  const req = createMockRequest({
    body: {
      name: 'Test User',
      comment: '<script>alert("XSS")</script>'
    },
    query: {
      search: '<img src="x" onerror="alert(2)">'
    },
    params: {
      id: '123',
      section: '<script>document.cookie</script>'
    }
  });
  
  const res = createMockResponse();
  const next = jest.fn();
  
  // Apply the middleware
  sanitizeRequestMiddleware(req, res, next);
  
  // Verify all inputs were sanitized
  assert(!req.body.comment.includes('<script>'), 'Body should be sanitized');
  assert(!req.query.search.includes('onerror='), 'Query should be sanitized');
  assert(!req.params.section.includes('<script>'), 'Params should be sanitized');
  
  // Verify safe values remained unchanged
  assert(req.body.name === 'Test User', 'Safe body values should be unchanged');
  assert(req.params.id === '123', 'Safe params should be unchanged');
  
  // Verify next was called
  assert(next.mock.calls.length === 1, 'Next should be called');
});

runTest('Security: Zod validation middleware', (assert) => {
  // Create a test schema
  const testSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().int().positive()
  });
  
  // Create validation middleware
  const validateBody = validate(testSchema);
  
  // Test with valid data
  const validReq = createMockRequest({
    body: {
      name: 'Test User',
      email: 'test@example.com',
      age: 25
    }
  });
  const validRes = createMockResponse();
  const validNext = jest.fn();
  
  validateBody(validReq, validRes, validNext);
  
  // Next should be called without error for valid data
  assert(validNext.mock.calls.length === 1, 'Next should be called for valid data');
  assert(!validNext.mock.calls[0][0], 'No error should be passed for valid data');
  
  // Test with invalid data
  const invalidReq = createMockRequest({
    body: {
      name: 'Te', // Too short
      email: 'not-an-email',
      age: -5 // Negative
    }
  });
  const invalidRes = createMockResponse();
  const invalidNext = jest.fn();
  
  validateBody(invalidReq, invalidRes, invalidNext);
  
  // Next should be called with validation error
  assert(invalidNext.mock.calls.length === 1, 'Next should be called for invalid data');
  assert(invalidNext.mock.calls[0][0], 'Error should be passed for invalid data');
  assert(invalidNext.mock.calls[0][0].statusCode === 400, 'Should have 400 status code');
  
  // Check that error contains all validation issues
  const errors = invalidNext.mock.calls[0][0].errors;
  assert(errors.name, 'Should have error for name field');
  assert(errors.email, 'Should have error for email field');
  assert(errors.age, 'Should have error for age field');
});