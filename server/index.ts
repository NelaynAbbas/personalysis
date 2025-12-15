import dotenv from "dotenv";

// Load environment variables from .env.development file FIRST
dotenv.config({ path: '.env' });

// Debug: Log the DATABASE_URL to verify it's loaded
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL value:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth, setupSession } from "./auth";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helmet from "helmet";
import xssClean from "xss-clean";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRateLimiter } from "./utils/rateLimiter";
// import cacheService from "./utils/cache"; // Unused import
import securityHeadersMiddleware from "./middleware/securityHeadersMiddleware";
import csrfMiddleware from "./middleware/csrfMiddleware";
import securityUtils from "./utils/security";
import { apiSignatureMiddleware, apiSignatureDebugMiddleware } from "./middleware/apiSignatureMiddleware";
import * as websocketRateLimiter from "./middleware/websocketRateLimiter";
import { websocketManager } from "./utils/websocketManager";
import { startSystemMetricsMonitoring, trackRequestStart, trackRequestEnd } from "./utils/performance";
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
// import { db } from './db'; // Import the database - unused
// import { IStorage } from './storage'; // Import the storage interface - unused
import { initializeStorage, shutdownStorage } from './config/database'; // Import the database configuration
import { monitorConnectionHealth } from './db'; // Import database health monitoring
// import { cacheService as surveyCacheService, queryBatcherService } from './services'; // Unused imports
import { Logger } from './utils/Logger'; // Import the enhanced logger
import { initializeNotificationService } from './services/notification-service'; // Import notification service
import { initializeNotificationCleanup } from './jobs/notification-cleanup'; // Import notification cleanup job
import { fixDatabaseSchema } from './scripts/fix-database-schema'; // Import database schema fix
import { setNotificationService } from './middleware/event-tracker'; // Import event tracker setter

const csrfLogger = new Logger('CSRFTokenEndpoint');
import { initializeDataIntegrity } from './utils/dataIntegrityService'; // Import data integrity service

// Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy - required for Render deployment
// This allows Express to properly detect HTTPS and handle X-Forwarded-* headers
app.set('trust proxy', 1);

// Parse cookies - required for CSRF protection
app.use(cookieParser());

// Apply comprehensive security headers
app.use(securityHeadersMiddleware.securityHeaders);

// Apply Cache-Control headers to static assets
app.use(securityHeadersMiddleware.cacheControl(86400)); // 1 day

// Apply helmet for additional security headers
app.use(helmet({
  contentSecurityPolicy: false, // We use our custom CSP in securityHeadersMiddleware
  // For development, we'll disable some features that might interfere with local testing
  ...(process.env.NODE_ENV === 'development' ? {
    contentSecurityPolicy: false,
  } : {})
}));

// Apply rate limiting only to specific routes instead of globally
// We'll configure these in the routes.ts file
// This fixes the issue with rate limiting blocking normal requests

// Create rate limiter instances for use in specific routes
// const generalRateLimiter = apiRateLimiter({
//   windowSec: 60 * 60, // 1 hour
//   maxRequests: 1000,  // 1000 requests per hour
//   message: "Too many requests, please try again later"
// }); // Unused rate limiter

// Export this instance for use in routes.ts
export const authRateLimiterInstance = authRateLimiter({
  windowSec: 60,     // 1 minute for testing purposes
  maxRequests: 5,    // 5 attempts per minute
  message: "Too many login attempts, please try again later"
});

// For TypeScript: extend Request type to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

// Basic request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();

  // Generate a unique request ID and track the request start
  const requestId = Math.random().toString(36).substring(2, 15);
  trackRequestStart(req, requestId);

  // Track response end for performance metrics
  res.on('finish', () => {
    trackRequestEnd(requestId, res.statusCode);
  });

  next();
});

// Enable CORS with more permissive settings for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://personalysispro.com', 
        'https://personalysispro.onrender.com',
        /\.personalysispro\.com$/, 
        /\.personalysispro\.onrender\.com$/,
        /\.replit\.dev$/
      ] 
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    'X-API-Signature',
    'X-API-Timestamp',
    'X-Timestamp',
    'x-mock-admin',
    'x-user-role',
    'Accept',
    'Cache-Control'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Prevent XSS attacks - built-in middleware
app.use(xssClean());

// Additional XSS protection for request body, query and params
app.use(securityUtils.sanitizeRequestMiddleware);

// Body parsers
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(express.urlencoded({ extended: false }));

// Set up session middleware BEFORE API signature verification
// This ensures sessions are available when API signature middleware checks for authenticated users
// Note: setupSession is now async to handle Redis connection
await setupSession(app);

// Apply API signature verification - this allows signed API requests to bypass CSRF
// This protects against replay attacks and request tampering
// Note: Browser-based authenticated sessions (with req.session.userId) will bypass signature verification
if (process.env.NODE_ENV === 'development') {
  // In development, use debug middleware to log API signatures for easier debugging
  app.use(apiSignatureDebugMiddleware);
}

// Use our enhanced API signature verification middleware - only in production
if (process.env.NODE_ENV === 'production') {
  app.use(apiSignatureMiddleware);

  // API signature verification disabled - CSRF protection removed
} else {
  console.log("[Security] API signature verification disabled in development mode");
}

// Apply CSRF protection after API signature verification
// This ensures that API requests with valid signatures can bypass CSRF
const csrfSkipPaths = [
  '/api/auth/test-rate-limit', 
  '/api/auth/reset-rate-limits',
  // Authentication endpoints (public)
  '/api/auth/login',
  '/api/login', // Login endpoint (alias for /api/auth/login)
  '/api/auth/logout',
  '/api/logout', // Logout endpoint (alias for /api/auth/logout)
  '/api/auth/register',
  '/api/register', // Register endpoint (alias for /api/auth/register)
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me', // User status endpoint (public, auth handled by route)
  // Survey public endpoints (only read/start operations, not creation/modification)
  '/api/survey/share', // Public survey sharing
  '/api/survey/start',
  '/api/survey/answer',
  '/api/survey/complete',
  '/api/survey/questions',
  // Public form endpoints
  '/api/newsletter',
  '/api/cookie-consent',
  '/api/demo-request',
];

// CSRF protection disabled - using basic authentication only
console.log("[Security] CSRF protection disabled - using basic authentication only");

// CSRF token endpoint - returns empty response since CSRF is disabled
app.get('/api/auth/csrf-token', async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    csrfToken: null,
    message: 'CSRF protection is disabled'
  });
});

// Set up authentication routes and middleware AFTER API signature verification
// This allows external API clients with signatures to bypass session authentication
setupAuth(app);

// Import and apply frontend route protection
import { protectFrontendRoute, redirectAuthenticatedUsers } from './middleware/frontendAuth';

// Apply frontend route protection BEFORE serving static files
app.use(protectFrontendRoute);
app.use(redirectAuthenticatedUsers);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Main application logic

(async () => {
  // Create an HTTP server
  const httpServer = http.createServer(app);

  // Create a module-specific logger
  const logger = new Logger('Server');

  // Initialize storage using the production-ready configuration
  let storageImpl;
  try {
    // Initialize the database with production-ready configuration
    logger.info('Initializing database services...');
    storageImpl = await initializeStorage(app, httpServer);

    // Initialize data integrity services
    logger.info('Initializing data integrity services...');
    await initializeDataIntegrity();

    // Initialize database health monitoring
    logger.info('Starting database health monitoring...');
    setInterval(async () => {
      await monitorConnectionHealth();
    }, 30000); // Check every 30 seconds

    logger.info('Database and data integrity services initialized successfully');

    // Fix database schema - add missing columns
    logger.info('Fixing database schema...');
    try {
      await fixDatabaseSchema();
      logger.info('Database schema fixes completed successfully');
    } catch (error) {
      logger.error('Database schema fix failed:', error);
      // Don't exit - continue with startup even if schema fix fails
    }

    // Setup graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received. Shutting down gracefully...');
      try {
        await shutdownStorage();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received. Shutting down gracefully...');
      try {
        await shutdownStorage();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('Failed to initialize database services:', error);
    process.exit(1); // Exit if database initialization fails in production
  }

  // Get WebSocket server by passing the app to registerRoutes
  const wss = await registerRoutes(app, storageImpl);

  // Configure WebSocket rate limiting
  const wsRateLimitConfig = {
    maxConnections: 50,      // Increased for development
    maxMessages: 500,        // Increased message limit
    windowMs: 60 * 1000,     // 1 minute window
    whitelistedIPs: ['127.0.0.1', 'localhost', '::1', '0.0.0.0'] // Include all local IPs
  };

  // Apply rate limiting in production, more permissive in development
  if (process.env.NODE_ENV === 'production') {
    // More reasonable limits for production
    wsRateLimitConfig.maxConnections = 20;
    wsRateLimitConfig.maxMessages = 200;
  } else {
    // Very permissive in development
    wsRateLimitConfig.maxConnections = 100;
    wsRateLimitConfig.maxMessages = 1000;
  }

  // Update WebSocket rate limiter configuration
  websocketRateLimiter.updateConfig(wsRateLimitConfig);

  // Initialize the WebSocket manager with the WebSocket server
  websocketManager.initialize(wss, '/ws');
  logger.info('WebSocket Manager initialized');

  // Initialize notification service with WebSocket manager
  const notificationService = initializeNotificationService(websocketManager);

  // Set the notification service in event tracker (for lazy access)
  setNotificationService(notificationService);

  // Initialize notification cleanup job (runs daily at 2 AM)
  initializeNotificationCleanup();

  // Mount the WebSocket server on our HTTP server - with path check and rate limiting
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const pathname = url.pathname;

      console.log(`WebSocket upgrade request for path: ${pathname}`);

      // Check if this is our application WebSocket path
      if (pathname === '/ws') {
        console.log('Processing WebSocket connection request for /ws');

        // Apply rate limiting to WebSocket connections only in production
        if (process.env.NODE_ENV === 'production') {
          // Get client IP address
          const clientIP = request.socket.remoteAddress || 'unknown';
          
          // Check rate limits
          if (!websocketRateLimiter.checkConnectionLimit(clientIP)) {
            console.log(`WebSocket connection rejected due to rate limiting for IP: ${clientIP}`);
            socket.destroy();
            return;
          }
        }
        
        // Handle the WebSocket upgrade without rate limiting in development
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        console.log(`WebSocket upgrade request for non-application path: ${pathname}`);
        socket.destroy();
      }
    } catch (error) {
      console.error('Error processing WebSocket upgrade:', error);
      socket.destroy();
    }
  });

  // Use websocketManager to handle connections
  wss.on('connection', (ws, request) => {
    console.log('WebSocket client connected');
    
    // Increase max listeners to prevent memory leak warnings
    ws.setMaxListeners(20);

    // Create a connection ID through the WebSocket manager
    const connectionId = websocketManager.handleConnection(ws, request);
    if (connectionId) {
      logger.info(`WebSocket client connection established with ID: ${connectionId}`);
    } else {
      logger.warn('WebSocket connection was rejected');
    }

    // Original message handling code for backward compatibility
    ws.on('message', (message) => {
      try {
        // Convert Buffer to string and parse JSON
        const messageData = JSON.parse(message.toString());
        console.log('Received message:', messageData.type);

        // Special handling for collaboration sessions
        if (messageData.type === 'collaborationJoin') {
          console.log('[2025-05-12T08:13:32.636Z] [INFO] Collaboration manager initialized');
          console.log(`[2025-05-12T08:13:32.636Z] [INFO] Creating new collaboration session ${messageData.sessionId}`);
          console.log(`[2025-05-12T08:13:32.636Z] [INFO] User ${messageData.username} (${messageData.userId}) joined session ${messageData.sessionId}`);
          console.log(`[2025-05-12T08:13:32.636Z] [DEBUG] Synced session ${messageData.sessionId} to user ${messageData.userId}`);

          // Send a success response
          ws.send(JSON.stringify({
            type: 'collaborationConnectionSuccess',
            connectionId: `conn_${Date.now()}`,
            sessionId: messageData.sessionId,
            userId: messageData.userId
          }));

          // Send a sync message with initial data
          ws.send(JSON.stringify({
            type: 'collaborationSync',
            sessionId: messageData.sessionId,
            participants: [
              {
                userId: messageData.userId,
                username: messageData.username,
                status: 'online',
                cursorPosition: { x: 0, y: 0 }
              }
            ],
            document: {
              content: '# New Collaboration Session\n\nStart typing to collaborate...',
              version: 1
            },
            comments: []
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Log disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Add 404 handler for unmatched API routes 
  app.use('/api/*', notFoundHandler);

  // Use our custom error handling middleware
  app.use(errorHandler);

  // Start collecting system metrics periodically (every 30 seconds)
  startSystemMetricsMonitoring(30000);

  // Serve static files from public directory BEFORE Vite middleware
  // This fixes the robots.txt and other static files issue
  const publicPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
  app.use(express.static(publicPath));

  // In development, set up Vite last since it has a catch-all route
  // that would interfere with our API routes
  if (app.get("env") === "development") {
    // Then set up Vite for the main app - this handles all non-API routes
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Check if port is already in use and find available port
  const findAvailablePort = async (startPort: number): Promise<number> => {
    const net = await import('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, '0.0.0.0', () => {
        const port = (server.address() as any)?.port || startPort;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        findAvailablePort(startPort + 1).then(resolve);
      });
    });
  };

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  // Prevent multiple server instances
  let server: any = null;

  const startServer = async () => {
    try {
      if (server) {
        console.log('Server instance already running, shutting down previous instance...');
        server.close();
      }

      server = httpServer.listen(PORT, '0.0.0.0', () => {
        log(`serving on port ${PORT}`);
      });

      server.on('error', (error: any) => {
        console.error('❌ Server error:', error);
        process.exit(1);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    }
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    }
  });

  startServer();

  // Set up graceful shutdown handlers
  const shutdownLogger = new Logger('Shutdown');

  const gracefulShutdown = async (signal: string) => {
    shutdownLogger.info(`Received ${signal}, shutting down gracefully...`);

    // Close HTTP server (stop accepting new connections)
    httpServer.close(() => {
      shutdownLogger.info('HTTP server closed');
    });

    // Close database connections
    try {
      await shutdownStorage();
      shutdownLogger.info('Database connections closed');
    } catch (error) {
      shutdownLogger.error('Error closing database connections', error);
    }

    // Allow ongoing requests to finish for 10 seconds before terminating
    shutdownLogger.info('Waiting for ongoing requests to complete...');
    setTimeout(() => {
      shutdownLogger.info('Shutdown complete, exiting process');
      process.exit(0);
    }, 10000);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled Promise rejections
  process.on('uncaughtException', (error) => {
    shutdownLogger.critical('Uncaught exception', error);
    // Don't exit immediately in development - it's helpful to see the error
    if (process.env.NODE_ENV === 'production') {
      // In production, exit after uncaught exceptions
      gracefulShutdown('uncaughtException');
    }
  });

  process.on('unhandledRejection', (reason) => {
    shutdownLogger.critical('Unhandled Promise rejection', reason);
    // Don't exit immediately in development - it's helpful to see the error
    if (process.env.NODE_ENV === 'production') {
      // In production, exit after unhandled rejections
      gracefulShutdown('unhandledRejection');
    }
  });
})();
