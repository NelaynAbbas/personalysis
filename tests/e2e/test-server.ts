/**
 * Test Server for E2E Tests
 * 
 * This module creates a minimal Express server for E2E testing without
 * requiring a running server instance. It's used in the E2E tests to 
 * ensure test isolation.
 */

import express, { Express } from 'express';
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import { AppError } from '../../server/middleware/errorHandler';

/**
 * Creates a minimal test server with basic routes for E2E testing
 */
export async function createTestServer(): Promise<Express> {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(helmet());
  app.use(cors());

  // Simple DB for test users
  const testUsers: any[] = [];
  const testSurveys: any[] = [];
  const invalidatedSessions: string[] = []; // Track invalidated sessions
  let nextUserId = 1;
  let nextSurveyId = 1;

  // System endpoint
  app.get('/api/system/performance', (req, res) => {
    res.json({
      status: 'success',
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
  });

  // Auth endpoints
  app.post('/api/auth/register', (req, res) => {
    // Validate with a simple schema
    const schema = z.object({
      username: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().optional(),
      lastName: z.string().optional()
    });

    try {
      const data = schema.parse(req.body);
      
      // Create a new user
      const newUser = {
        id: nextUserId++,
        ...data,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Store user
      testUsers.push(newUser);
      
      res.status(201).json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error'
        });
      }
    }
  });

  app.post('/api/auth/login', (req, res) => {
    // Simulate login - always return success for test@example.com/Password123
    if (req.body.email === 'test@example.com' && req.body.password === 'Password123') {
      // Set a fake session cookie
      res.cookie('test_session', 'test-session-value', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.json({
        status: 'success',
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        }
      });
    } else {
      // Check if the user exists in our test users
      const user = testUsers.find(u => u.email === req.body.email && u.password === req.body.password);
      
      if (user) {
        // Set a fake session cookie
        res.cookie('test_session', `test-session-value-${user.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        // Exclude password from response
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          status: 'success',
          data: userWithoutPassword
        });
      } else {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    // Clear the session cookie and invalidate it server-side
    // This ensures subsequent requests with the same cookie will be rejected
    res.clearCookie('test_session');
    
    // Store the cleared cookie in a blacklist to simulate session invalidation
    const sessionCookie = req.cookies.test_session;
    if (sessionCookie) {
      // In a real implementation, we'd invalidate the session in a database
      // Here we'll just add it to a blacklist array for testing purposes
      invalidatedSessions.push(sessionCookie);
    }
    
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  });

  app.get('/api/auth/me', (req, res) => {
    // Check for session cookie
    const sessionCookie = req.cookies.test_session;
    
    if (!sessionCookie) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    
    // Check if the session has been invalidated (logged out)
    if (invalidatedSessions.includes(sessionCookie)) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired or invalidated'
      });
    }
    
    // For test session, return hardcoded user
    if (sessionCookie === 'test-session-value') {
      return res.json({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });
    }
    
    // Check for other user sessions
    const userId = parseInt(sessionCookie.replace('test-session-value-', ''));
    const user = testUsers.find(u => u.id === userId);
    
    if (user) {
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized'
    });
  });

  // Survey endpoints
  app.post('/api/surveys', (req, res) => {
    // Check for session cookie
    const sessionCookie = req.cookies.test_session;
    
    if (!sessionCookie) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    
    const userId = sessionCookie === 'test-session-value' 
      ? 1 
      : parseInt(sessionCookie.replace('test-session-value-', ''));
    
    // Create a new survey
    const newSurvey = {
      id: nextSurveyId++,
      ...req.body,
      userId,
      createdAt: new Date().toISOString()
    };
    
    // Store survey
    testSurveys.push(newSurvey);
    
    res.status(201).json(newSurvey);
  });

  app.get('/api/surveys', (req, res) => {
    // Check for session cookie
    const sessionCookie = req.cookies.test_session;
    
    if (!sessionCookie) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    
    const userId = sessionCookie === 'test-session-value' 
      ? 1 
      : parseInt(sessionCookie.replace('test-session-value-', ''));
    
    // Return surveys for this user
    const userSurveys = testSurveys.filter(s => s.userId === userId);
    
    res.json({
      status: 'success',
      data: userSurveys
    });
  });

  // Error handling middleware for test server
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Test server error:', err);
    
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof AppError ? err.message : 'Internal server error';
    const errors = err instanceof AppError ? err.errors : undefined;
    
    res.status(statusCode).json({
      status: 'error',
      message,
      errors
    });
  });

  return app;
}

/**
 * Starts a test server on the specified port
 */
export async function startTestServer(port: number = 3333): Promise<Server> {
  const app = await createTestServer();
  
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Test server started on port ${port}`);
      resolve(server);
    });
  });
}

// If this file is run directly, start the test server
if (require.main === module) {
  const port = parseInt(process.env.TEST_PORT || '3333', 10);
  startTestServer(port)
    .then(() => console.log('Test server running'))
    .catch(err => console.error('Failed to start test server:', err));
}