/**
 * Test Server Launcher
 * 
 * This script starts a minimalist Express server for E2E testing
 * It's used in the test runner to ensure the server is running during E2E tests
 */

const express = require('express');
const path = require('path');
const { registerRoutes } = require('../../server/routes');
const { setupAuth } = require('../../server/auth');
const { errorHandler, notFoundHandler } = require('../../server/middleware/errorHandler');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sanitizeRequestMiddleware } = require('../../server/utils/security');

// Create a test server
async function createTestServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(helmet());
  app.use(cors());

  // Security middleware
  app.use(sanitizeRequestMiddleware);

  // Add CSRF and Auth setup
  setupAuth(app);

  // Add routes
  await registerRoutes(app);

  // Add error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Start the server on a test port
async function startTestServer() {
  try {
    const app = await createTestServer();
    const port = process.env.TEST_PORT || 3333;

    const server = app.listen(port, () => {
      console.log(`Test server running on port ${port}`);
    });

    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down test server...');
      server.close(() => {
        console.log('Test server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down test server...');
      server.close(() => {
        console.log('Test server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start test server:', error);
    process.exit(1);
  }
}

// Start the server
startTestServer();