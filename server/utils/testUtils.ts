/**
 * Test Utilities
 * 
 * Provides utilities for testing Express applications including
 * mock objects, assertions, and test runners.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

/**
 * Simple assertion function for tests
 */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Run a test function and report results
 * @param name Name of the test
 * @param testFn Test function to run
 */
export function runTest(name: string, testFn: (assert: typeof assert) => void | Promise<void>): void {
  try {
    console.log(`Running test: ${name}`);
    const result = testFn(assert);
    
    // Handle async tests
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`✅ Test passed: ${name}`);
        })
        .catch((error) => {
          console.error(`❌ Test failed: ${name}`);
          console.error(error);
        });
    } else {
      console.log(`✅ Test passed: ${name}`);
    }
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(error);
  }
}

/**
 * Creates a mock Express request object
 * @param options Options to customize the request
 */
export function createMockRequest(options: {
  method?: string;
  path?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  session?: Record<string, any>;
  user?: Record<string, any>;
  ip?: string;
} = {}): Request {
  const req: Partial<Request> = {
    method: options.method || 'GET',
    path: options.path || '/',
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    session: options.session || {},
    ip: options.ip || '127.0.0.1',
    get: function(name: string) {
      return this.headers![name.toLowerCase()];
    }
  };
  
  // Add user if provided (for authenticated routes)
  if (options.user) {
    (req as any).user = options.user;
  }
  
  return req as Request;
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse(): Response {
  const res: Partial<Response> = {
    statusCode: 200,
    headers: {},
    cookies: {},
    
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    
    send: function(body: any) {
      (this as any).sentBody = body;
      return this;
    },
    
    json: function(body: any) {
      (this as any).sentJson = body;
      return this;
    },
    
    setHeader: function(name: string, value: string) {
      this.headers![name] = value;
      return this;
    },
    
    getHeader: function(name: string) {
      return this.headers![name];
    },
    
    cookie: function(name: string, value: string, options?: any) {
      this.cookies![name] = value;
      return this;
    },
    
    redirect: function(url: string) {
      (this as any).redirectUrl = url;
      return this;
    },
    
    render: function(view: string, locals?: any) {
      (this as any).renderedView = view;
      (this as any).renderedLocals = locals;
      return this;
    },
    
    // Add common Express response methods
    end: function(data?: any) {
      (this as any).ended = true;
      (this as any).endData = data;
      return this;
    },
    
    // Add events API
    on: function(event: string, callback: Function) {
      if (!this._events) {
        (this as any)._events = {};
      }
      if (!this._events[event]) {
        (this as any)._events[event] = [];
      }
      (this as any)._events[event].push(callback);
      return this;
    },
    
    emit: function(event: string, ...args: any[]) {
      if (this._events && this._events[event]) {
        this._events[event].forEach((callback: Function) => {
          callback(...args);
        });
      }
      return true;
    }
  };
  
  // TypeScript doesn't know about _events property
  (res as any)._events = {};
  
  return res as Response;
}

/**
 * Creates a mock next function for middleware testing
 */
export function createMockNext(): NextFunction {
  return (err?: Error) => {
    if (err) {
      (createMockNext as any).error = err;
    }
  };
}

/**
 * Utility to wait for a specified time
 * @param ms Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  assert,
  runTest,
  createMockRequest,
  createMockResponse,
  createMockNext,
  wait
};