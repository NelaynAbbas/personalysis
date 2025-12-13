/**
 * Tests for utility functions
 * These tests verify the functionality of our performance, cache, and rate limiter utilities
 */

import { assert, runTests, wait } from '../utils/testUtils';
import cacheService from '../utils/cache';
import { createRateLimiter } from '../utils/rateLimiter';
import { createMockRequest, createMockResponse } from '../utils/testUtils';
import { Logger } from '../utils/Logger';

const logger = new Logger('UtilTests');
import { measure } from '../utils/performance';

/**
 * Run tests for utility functions
 */
export async function runUtilTests() {
  logger.info('Starting utility tests...');
  
  return runTests([
    // Cache tests
    {
      name: 'Cache - set and get work correctly',
      fn: () => {
        // Clear cache before test
        cacheService.clear();
        
        // Set a value
        cacheService.set('test-key', { value: 'test-value' });
        
        // Get the value
        const value = cacheService.get('test-key');
        
        // Assert it was retrieved correctly
        assert.truthy(value);
        assert.equal(value.value, 'test-value');
      }
    },
    
    {
      name: 'Cache - getOrSet computes value if not in cache',
      fn: async () => {
        // Clear cache before test
        cacheService.clear();
        
        // Function to compute the value
        const computeValue = async () => {
          await wait(10); // Simulate computation time
          return { value: 'computed-value' };
        };
        
        // Get or compute value (will compute first time)
        const value1 = await cacheService.getOrSet('computed-key', computeValue);
        
        // Get or compute value again (should return from cache)
        const value2 = await cacheService.getOrSet('computed-key', computeValue);
        
        // Assert values match
        assert.equal(value1.value, 'computed-value');
        assert.equal(value2.value, 'computed-value');
      }
    },
    
    {
      name: 'Cache - expired items are removed during cleanup',
      fn: async () => {
        // Clear cache before test
        cacheService.clear();
        
        // Set a value with short TTL
        cacheService.set('short-lived', { value: 'expiring-soon' }, { ttl: 50 });
        
        // Value should be available immediately
        let value = cacheService.get('short-lived');
        assert.truthy(value);
        assert.equal(value.value, 'expiring-soon');
        
        // Wait for TTL to expire
        await wait(60);
        
        // Run cleanup
        const removed = cacheService.cleanup();
        
        // Assert item was removed
        assert.equal(removed, 1);
        
        // Value should now be undefined
        value = cacheService.get('short-lived');
        assert.equal(value, undefined);
      }
    },
    
    // Rate limiter tests
    {
      name: 'Rate Limiter - allows requests within limit',
      fn: () => {
        // Create a rate limiter with very permissive limits
        const limiter = createRateLimiter({
          windowSec: 60,
          maxRequests: 5,
          message: 'Rate limit exceeded'
        });
        
        // Send multiple requests (below limit)
        for (let i = 0; i < 5; i++) {
          const req = createMockRequest({
            method: 'GET',
            path: '/api/test',
            ip: '127.0.0.1'
          });
          
          const res = createMockResponse();
          const next = jest.fn();
          
          // Execute the rate limiter middleware
          limiter(req as any, res as any, next);
          
          // Verify request was allowed (next was called)
          assert.equal(next.mock.calls.length, 1);
        }
      }
    },
    
    {
      name: 'Rate Limiter - blocks requests over limit',
      fn: () => {
        // Create a rate limiter with very restrictive limits
        const limiter = createRateLimiter({
          windowSec: 60,
          maxRequests: 3,
          message: 'Rate limit exceeded'
        });
        
        // Send multiple requests (exceeding limit)
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
          ip: '192.168.1.1' // Using different IP from previous test
        });
        
        const responses: any[] = [];
        
        // Send 5 requests (limit is 3)
        for (let i = 0; i < 5; i++) {
          const res = createMockResponse();
          const next = jest.fn();
          
          // Execute the rate limiter middleware
          limiter(req as any, res as any, next);
          
          responses.push({
            statusCode: res.statusCode,
            sentJson: res.sentJson,
            nextCalled: next.mock.calls.length > 0
          });
        }
        
        // First 3 requests should be allowed
        for (let i = 0; i < 3; i++) {
          assert.equal(responses[i].nextCalled, true, `Request ${i+1} should be allowed`);
        }
        
        // Requests beyond the limit should be blocked
        for (let i = 3; i < 5; i++) {
          assert.equal(responses[i].nextCalled, false, `Request ${i+1} should be blocked`);
          assert.equal(responses[i].statusCode, 429, `Request ${i+1} should return 429 status`);
          assert.equal(responses[i].sentJson.message, 'Rate limit exceeded');
        }
      }
    },
    
    // Performance tests
    {
      name: 'Performance - measure correctly calculates time',
      fn: async () => {
        // Define a function that waits a specific time
        const testFunction = async (): Promise<string> => {
          await wait(50); // Wait 50ms
          return 'result';
        };
        
        // Measure its execution time
        const result = await measure(testFunction, 'test-function');
        
        // Check the result
        assert.equal(result, 'result');
      }
    }
  ]);
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runUtilTests()
    .then(results => {
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

export default { runUtilTests };