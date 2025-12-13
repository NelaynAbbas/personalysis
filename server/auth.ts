import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { getUserById, getUserByUsername, getUserByEmail, logUserActivity } from './database-storage-user-management';
import { Logger } from './utils/Logger';
import MemoryStore from 'memorystore';

const logger = new Logger('Auth');

// Extend Express Request interface to include user and company properties
declare global {
  namespace Express {
    interface Request {
      user?: any;
      company?: any;
    }
  }
}

// Extend the session data interface to include custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    companyId?: number;
    userRole?: string;
    username?: string;
    email?: string;
    createdAt?: number;
    lastActivity?: number;
    _csrfTokenCreatedAt?: number;
    _csrfSecret?: string;
    _authChanged?: boolean;
  }
}

// Setup session middleware (must run early, before API signature verification)
export async function setupSession(app: express.Application) {
  let store: session.Store;
  
  // Use Redis in production if REDIS_URL is available, otherwise use MemoryStore
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    try {
      // Use dynamic import for ES modules (works in both ESM and CommonJS contexts)
      // connect-redis v9+ exports RedisStore as a named export (it's a class)
      const { RedisStore } = await import('connect-redis');
      const { createClient } = await import('redis');
      
      // Create Redis client - connect-redis v9 works with redis v4+ without legacy mode
      const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      // Handle Redis connection events
      redisClient.on('error', (err: Error) => {
        logger.error('Redis client error:', err);
      });
      
      redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });
      
      redisClient.on('ready', () => {
        logger.info('Redis client ready');
      });
      
      // Connect to Redis (must be done before creating the store)
      await redisClient.connect().catch((err: Error) => {
        logger.error('Failed to connect to Redis:', err);
        throw err; // Re-throw to trigger fallback
      });
      
      // Create Redis store
      store = new RedisStore({
        client: redisClient,
        prefix: 'sess:',
        ttl: 86400, // 24 hours in seconds
        disableTouch: false // Enable touch to extend session TTL
      });
      
      logger.info('Session store: Redis (production)');
    } catch (error) {
      logger.error('Failed to initialize Redis store, falling back to MemoryStore:', error);
      // Fallback to MemoryStore if Redis initialization fails
      const MemStore = MemoryStore(session);
      store = new MemStore({ checkPeriod: 86400000 });
      logger.info('Session store: MemoryStore (fallback)');
    }
  } else {
    // Use MemoryStore in development or if Redis is not available
    const MemStore = MemoryStore(session);
    store = new MemStore({ checkPeriod: 86400000 });
    logger.info(`Session store: MemoryStore (${process.env.NODE_ENV === 'production' ? 'production - no Redis URL' : 'development'})`);
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'personalysispro-secret-key',
    resave: false,
    saveUninitialized: true, // ✅ make sure session is initialized
    store,
    name: 'connect.sid', // Explicit session cookie name
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax', // Required for proper cookie handling behind proxies (like Render)
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    },
    // Rolling: true ensures the session expiration is extended on each request
    rolling: false // Set to false to prevent session extension on every request (better for CSRF)
  }));

  // ✅ Disable session reload on every request - it causes CSRF token validation issues
  // Session reload is only needed in multi-process environments where sessions might be
  // modified by other processes. In single-process environments (like Render), it's unnecessary
  // and causes race conditions with CSRF token validation.
  // 
  // The express-session middleware already loads the session from the store automatically.
  // Reloading on every request can overwrite the CSRF secret (_csrfSecret) which causes
  // CSRF token validation to fail.
  //
  // If you need session reload for specific use cases (e.g., multi-process deployments),
  // you can enable it conditionally via environment variable:
  // const ENABLE_SESSION_RELOAD = process.env.ENABLE_SESSION_RELOAD === 'true';
  
  logger.info('Session middleware configured successfully');
}

// Setup Authentication routes and middleware
export function setupAuth(app: express.Application) {
  // ✅ Add login aliases
  app.post('/api/login', login);
  app.post('/api/auth/login', login);
  app.post('/api/logout', logout);
  app.post('/api/auth/logout', logout); // Add auth/logout alias
  app.get('/api/me', authenticate, (req, res) => res.json({ user: req.user }));
  app.get('/api/auth/status', (req, res) => {
    if (!req.session || !req.session.userId)
      return res.status(401).json({ authenticated: false });
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email,
        role: req.session.userRole,
        companyId: req.session.companyId
      }
    });
  });

  // Apply authenticate middleware - this should run AFTER API signature middleware
  // so that external API clients with signatures can bypass session authentication
  app.use(authenticate);
  logger.info('Authentication middleware configured successfully');
}

/**
 * Password hashing and verificaletion functions
 */
export function hashPassword(password: string): { hash: string, salt: string } {
  // Generate a secure random salt
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with the salt using SHA-256
  const hash = crypto
    .createHmac('sha256', salt)
    .update(password)
    .digest('hex');
  
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  // Hash the provided password with the stored salt
  const calculatedHash = crypto
    .createHmac('sha256', salt)
    .update(password)
    .digest('hex');
  
  // Compare the calculated hash with the stored hash
  return calculatedHash === hash;
}

/**
 * Authentication middleware
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip authentication for public routes FIRST - before any session checks
    if (isPublicRoute(req.path)) {
      logger.info(`✅ AUTH DEBUG - Skipping authentication for public route: ${req.path}`);
      return next();
    }

    // Check for mock admin headers (development mode)
    const mockAdmin = req.headers['x-mock-admin'] as string;
    const mockUserRole = req.headers['x-user-role'] as string;

    if (mockAdmin === 'true' && (mockUserRole === 'platform_admin' || mockUserRole === 'admin')) {
      // Allow admin routes to pass through to route-specific middleware
      return next();
    }

    // For protected routes, validate session safely
    if (req.session && req.session.userId) {
      try {
        const user = await getUserById(req.session.userId);

        if (user && user.isActive) {
          // Set user in request object for use in route handlers
          req.user = user;

          // Log user activity (non-blocking)
          logUserActivity(
            user.id,
            'route_access',
            { path: req.path, method: req.method },
            req.ip,
            req.headers['user-agent']
          ).catch(err => logger.error('Failed to log user activity:', err));

          return next();
        } else if (user === undefined) {
          // getUserById returned undefined - this could be a transient DB error
          // Check if it's likely a connection issue by checking error logs
          // For now, we'll treat undefined as a potential transient error
          // and return 503 to allow retry without clearing session
          logger.warn(`Could not retrieve user ${req.session.userId} - possible transient DB error`);
          return res.status(503).json({
            status: 'error',
            message: 'Database temporarily unavailable. Please try again.',
            retryAfter: 5, // Suggest retrying after 5 seconds
            timestamp: new Date().toISOString()
          });
        } else {
          // User found but inactive - this is a permanent error, clear session
          logger.warn(`Session contains inactive userId: ${req.session.userId}, clearing session`);
          if (req.session) {
            req.session.userId = undefined;
            req.session.companyId = undefined;
            req.session.userRole = undefined;
            req.session.username = undefined;
            req.session.email = undefined;
          }
        }
      } catch (dbError) {
        // Check if this is a transient database error (timeout, connection issue)
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        const isTransientError = errorMessage.includes('timeout') || 
                                 errorMessage.includes('ECONNRESET') ||
                                 errorMessage.includes('connection') ||
                                 errorMessage.includes('pool');

        if (isTransientError) {
          // For transient errors, don't clear the session - just return 503
          // This allows the user to retry without being logged out
          logger.warn(`Transient database error during authentication: ${errorMessage}`);
          return res.status(503).json({
            status: 'error',
            message: 'Database temporarily unavailable. Please try again.',
            retryAfter: 5, // Suggest retrying after 5 seconds
            timestamp: new Date().toISOString()
          });
        } else {
          // For permanent errors (invalid query, etc.), log and clear session
          logger.error('Database error during user validation:', dbError);
          if (req.session) {
            req.session.userId = undefined;
            req.session.companyId = undefined;
            req.session.userRole = undefined;
            req.session.username = undefined;
            req.session.email = undefined;
          }
        }
      }
    }

    // Check for API key authentication
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      // Implement API key authentication logic here
      logger.info('API key authentication attempted');

      // If you implement company retrieval by API key:
      // const company = await getCompanyByApiKey(apiKey);
      // if (company) {
      //   req.company = company;
      //   return next();
      // }
    }

    // If authenticated through neither session nor API key, return 401
    logger.warn(`Authentication failed for protected route: ${req.path}`);
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Login functionality
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // DEBUG: Log incoming login request
    logger.info('🔍 LOGIN DEBUG - Login attempt started', {
      username,
      passwordLength: password ? password.length : 0,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (!username || !password) {
      logger.warn('❌ LOGIN DEBUG - Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    logger.info('🔍 LOGIN DEBUG - Searching for user by username:', username);
    const user = await getUserByUsername(username);

    // If user not found, try by email
    const userByEmail = !user ? await getUserByEmail(username) : null;
    logger.info('🔍 LOGIN DEBUG - User by username found:', !!user);
    logger.info('🔍 LOGIN DEBUG - User by email found:', !!userByEmail);

    const foundUser = user || userByEmail;

    if (!foundUser) {
      // Log failed login attempt (but don't specify the reason to the client for security)
      logger.warn(`❌ LOGIN DEBUG - User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // DEBUG: Log found user details (without password)
    logger.info('🔍 LOGIN DEBUG - User found:', {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
      isActive: foundUser.isActive,
      companyId: foundUser.companyId
    });
    
    // Check if account is locked
    if (foundUser.accountLocked) {
      if (foundUser.accountLockedUntil && foundUser.accountLockedUntil > new Date()) {
        logger.warn(`Login attempt for locked account: ${username}`);
        return res.status(401).json({ 
          message: 'Account is temporarily locked. Please try again later.'
        });
      }
      
      // If lock time has expired, unlock the account automatically
      // This would be implemented in the updateUser method
    }
    
    // Verify password - handle both plain text and hashed passwords
    let isValid = false;

    // Check if password is hashed (bcrypt format)
    if (foundUser.password.startsWith('$2')) {
      // Use bcrypt for hashed passwords
      isValid = await bcrypt.compare(password, foundUser.password);
    } else {
      // Use plain text comparison for legacy passwords
      isValid = password === foundUser.password;
    }
    
    if (!isValid) {
      // Implement login attempts tracking logic here
      // This is a placeholder for your actual implementation
      logger.warn(`Failed login attempt (invalid password) for user: ${username}`);
      
      // Example implementation to update login attempts:
      // await updateUser(foundUser.id, {
      //   loginAttempts: (foundUser.loginAttempts || 0) + 1,
      //   lastFailedLogin: new Date(),
      //   accountLocked: (foundUser.loginAttempts || 0) >= 4,
      //   accountLockedUntil: (foundUser.loginAttempts || 0) >= 4 ? 
      //     new Date(Date.now() + 30 * 60 * 1000) : null // Lock for 30 minutes
      // });
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Valid credentials - create session with complete user context
    req.session.userId = foundUser.id;
    req.session.companyId = foundUser.companyId || undefined;
    req.session.userRole = foundUser.role;
    req.session.username = foundUser.username;
    req.session.email = foundUser.email;
    
    // CRITICAL: Invalidate old CSRF token by regenerating the secret
    // This ensures that any CSRF token generated before login is invalidated
    // The frontend will need to fetch a new token after login
    // We do this by deleting the old secret - csurf will generate a new one on next token generation
    if (req.session && (req.session as any)._csrfSecret) {
      delete (req.session as any)._csrfSecret;
      logger.debug('Invalidated old CSRF secret after login', {
        sessionId: req.sessionID || 'none',
        userId: foundUser.id
      });
    }
    
    // Mark authentication state as changed to trigger CSRF token rotation
    req.session._authChanged = true;
    
    // Mark session as touched and save it
    req.session.touch();
    
    // Save session before sending response to ensure it's persisted
    // This is especially important with Redis to ensure the session is stored
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          logger.error('Failed to save session after login:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Log successful login
    await logUserActivity(
      foundUser.id, 
      'login',
      { method: 'password', companyId: foundUser.companyId },
      req.ip,
      req.headers['user-agent']
    );
    
    // Reset login attempts on successful login
    // await updateUser(foundUser.id, {
    //   loginAttempts: 0,
    //   lastLogin: new Date(),
    //   accountLocked: false,
    //   accountLockedUntil: null
    // });
    
    // Return user info (excluding sensitive data)
    const { password: _, passwordSalt: __, ...userWithoutPassword } = foundUser;
    res.json({ 
      message: 'Login successful', 
      user: userWithoutPassword,
      session: {
        userId: foundUser.id,
        companyId: foundUser.companyId,
        role: foundUser.role,
        username: foundUser.username
      },
      // Note: CSRF token is not included here - the frontend should fetch a new token
      // after login by calling /api/auth/csrf-token endpoint
      // This ensures the token is generated with the correct session state
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
}

/**
 * Logout functionality
 */
export async function logout(req: Request, res: Response) {
  try {
    // Log the logout activity before destroying the session
    if (req.session && req.session.userId) {
      await logUserActivity(
        req.session.userId,
        'logout',
        {},
        req.ip,
        req.headers['user-agent']
      );
    }
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Error during logout' });
      }
      
      // Clear the session cookie with same settings as creation
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.json({ 
        status: 'success',
        message: 'Logout successful' 
      });
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
  }
}

/**
 * Helper function to check if a route is public (doesn't require authentication)
 */
function isPublicRoute(path: string): boolean {
  // API routes that are publicly accessible
  const publicApiRoutes = [
    '/api/login',
    '/api/logout',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/register',
    '/api/verify-email',
    '/api/reset-password',
    '/api/forgot-password',
    '/api/health',
    '/api/status',
    '/api/auth/csrf-token',
    '/api/cookie-consent',  // Cookie consent for GDPR compliance
    '/api/newsletter',      // Newsletter endpoints for public subscription
    '/api/demo-request',    // Demo request endpoint for public forms
    '/api/blog',            // Blog endpoints for admin management (development only)
    '/api/survey/start',    // Survey start endpoint
    '/api/survey/answer',   // Survey answer endpoint (allows anonymous)
    '/api/survey/complete', // Survey completion endpoint (allows anonymous)
    '/api/survey/questions', // Survey questions endpoint
    '/api/survey/results',  // Survey results endpoint (allows anonymous for public surveys)
    '/api/templates',       // Template endpoints for public access
    '/api/reports/shared',  // Shared report endpoint (public access with token)
    // Add more public API routes as needed
  ];

  // Check if it's a public API route
  if (publicApiRoutes.some(route => path.startsWith(route))) {
    return true;
  }

  // Allow public access to survey endpoints (format: /api/surveys/:id and /api/surveys/:id/questions)
  // Actual access control is handled in the route handlers based on survey settings
  if (/^\/api\/surveys\/\d+(\/questions)?$/.test(path)) {
    return true;
  }

  // All non-API routes (frontend routes) should be accessible without authentication
  if (!path.startsWith('/api/')) {
    return true;
  }

  return false;
}

/**
 * Role-based authorization middleware
 */
export function authorize(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // If authentication hasn't set the user, this middleware shouldn't run
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the user's role is in the list of required roles
    if (requiredRoles.includes(req.user.role)) {
      return next();
    }
    
    // Log unauthorized access attempt
    logger.warn(`Unauthorized access attempt to ${req.path} by user ${req.user.id} with role ${req.user.role}`);
    
    // User doesn't have the required role
    res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  };
}
