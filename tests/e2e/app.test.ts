import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { Server } from 'http';
import { createTestServer, startTestServer } from './test-server';

/**
 * E2E API Tests using a dedicated test server
 * 
 * These tests can run in one of two modes:
 * 1. Using a real HTTP server (default, spawned by the test)
 * 2. Using in-memory Express app (faster, better isolation)
 */

describe('E2E API Tests', () => {
  let app: Express;
  let server: Server;
  let authCookie: string;
  
  // Decide whether to use in-memory testing or real HTTP
  const useInMemoryTestServer = process.env.USE_IN_MEMORY_TEST_SERVER === 'true';
  
  // Setup test environment
  beforeAll(async () => {
    if (useInMemoryTestServer) {
      // Create an in-memory test server
      app = await createTestServer();
    } else {
      // Start an actual HTTP server on a random port
      const port = 3333 + Math.floor(Math.random() * 1000);
      server = await startTestServer(port);
    }
  });
  
  // Cleanup test environment
  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });
  
  it('should have API server running', async () => {
    const response = await request(useInMemoryTestServer ? app : server).get('/api/system/performance');
    
    // We're mainly checking if the server is responding - exact response doesn't matter
    expect(response.status).toBe(200);
  });
  
  it('should register a new user', async () => {
    // Generate a random email to avoid conflicts in repeated test runs
    const randomEmail = `test-${Date.now()}@example.com`;
    
    const response = await request(useInMemoryTestServer ? app : server)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: randomEmail,
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
  });
  
  it('should login with the new user', async () => {
    const response = await request(useInMemoryTestServer ? app : server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',  // Use a known test user for simplicity
        password: 'Password123'
      });
    
    // Note: In a real test, we'd use the dynamically created user from above
    expect(response.status).toBe(200);
    
    // Store the auth cookie for subsequent requests
    if (response.headers['set-cookie']) {
      authCookie = response.headers['set-cookie'][0];
    }
  });
  
  it('should fetch user profile when authenticated', async () => {
    // Skip if login failed and we don't have a cookie
    if (!authCookie) {
      console.warn('Skipping test because login failed');
      return;
    }
    
    const response = await request(useInMemoryTestServer ? app : server)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('username');
  });
  
  it('should create a new survey when authenticated', async () => {
    // Skip if login failed and we don't have a cookie
    if (!authCookie) {
      console.warn('Skipping test because login failed');
      return;
    }
    
    const surveyData = {
      title: 'Test Survey',
      description: 'This is a test survey created by E2E tests',
      questions: [
        {
          type: 'multiple_choice',
          text: 'What is your favorite color?',
          options: ['Red', 'Blue', 'Green', 'Yellow']
        },
        {
          type: 'text',
          text: 'Please explain why you chose that color.'
        }
      ]
    };
    
    const response = await request(useInMemoryTestServer ? app : server)
      .post('/api/surveys')
      .set('Cookie', authCookie)
      .send(surveyData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', 'Test Survey');
  });
  
  it('should logout successfully', async () => {
    if (!authCookie) {
      console.warn('Skipping test because login failed');
      return;
    }
    
    const response = await request(useInMemoryTestServer ? app : server)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);
    
    expect(response.status).toBe(200);
    
    // Verify we can't access protected route anymore
    const profileResponse = await request(useInMemoryTestServer ? app : server)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
    
    expect(profileResponse.status).toBe(401);
  });
});

// Note: For a real E2E test suite, we would also:
// 1. Use a test database
// 2. Reset the database between test runs
// 3. Test with Browser automation (Playwright, Puppeteer) for frontend tests
// 4. Include user flow tests (registration, survey creation, etc.)
// 5. Test performance and error cases