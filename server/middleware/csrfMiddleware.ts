/**
 * CSRF Protection Middleware
 * 
 * Comprehensive implementation of Cross-Site Request Forgery protection
 * with token rotation, robust validation, and flexible path exemptions.
 */
import { Request, Response, NextFunction } from 'express';
import csurf from 'csurf';
import { AppError } from './errorHandler';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';

const logger = new Logger('CSRFMiddleware');

// Default CSRF exempt paths - these paths don't require CSRF protection
const DEFAULT_EXEMPT_PATHS = [
  // Authentication endpoints
  '/api/auth/login',
  '/api/login',
  '/api/auth/logout',
  '/api/logout',
  '/api/auth/register',
  '/api/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  // Public survey endpoints
  '/api/survey/start',
  '/api/survey/answer',
  '/api/survey/complete',
  '/api/survey/questions',
  '/api/survey/submit',
  '/api/survey/share',
  // Public form endpoints
  '/api/newsletter',
  '/api/cookie-consent',
  '/api/demo-request',
  // System endpoints
  '/api/health',
  '/api/webhook',
  '/api/public'
];

/**
 * CSRF Protection Configuration
 */
interface CsrfConfig {
  // Cookie configuration
  cookie: {
    key: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: boolean | 'lax' | 'strict' | 'none';
    maxAge: number;
  };
  
  // Token configuration
  tokenName: string;
  
  // Which request methods to enforce CSRF protection on
  ignoreMethods: string[];
  
  // Paths that don't require CSRF protection
  exemptPaths: string[];
  
  // Paths that always require CSRF validation, regardless of method
  strictPaths: string[];
  
  // Cookie age before rotation
  tokenRotationAge: number;
}

// Create the default configuration
const defaultConfig: CsrfConfig = {
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Use 'lax' for better compatibility with reverse proxies (like Render)
    maxAge: 3600 * 24 // 24 hours
  },
  tokenName: 'XSRF-TOKEN',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  exemptPaths: DEFAULT_EXEMPT_PATHS,
  strictPaths: [
    '/api/admin',
    '/api/company',
    '/api/users',
    '/api/roles',
    '/api/billing'
  ],
  tokenRotationAge: 3600 * 4 // 4 hours
};

// Configure CSRF protection with default options
// IMPORTANT: We use session-based storage (not cookie-based) for the CSRF secret
// This is more reliable because:
// 1. The secret is stored in req.session._csrfSecret (managed by express-session)
// 2. The session cookie is already being handled correctly
// 3. No need to manage a separate _csrf cookie
// 
// The 'value' function tells csurf where to look for the CSRF token
// It checks: 1) req.body._csrf, 2) req.headers['x-csrf-token'], 3) req.headers['x-xsrf-token'] (from XSRF-TOKEN cookie)
// Express normalizes headers to lowercase, so 'X-CSRF-Token' becomes 'x-csrf-token'
//
// IMPORTANT: We explicitly set cookie: false to force session-based storage
// This prevents csurf from using any leftover _csrf cookies
const csrfProtection = csurf({
  // Explicitly disable cookie-based storage to force session-based storage
  cookie: false,
  value: (req: Request) => {
    // Check body first
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }
    
    // Check headers (Express normalizes to lowercase)
    // Check x-csrf-token first (what our frontend sends)
    const csrfTokenHeader = req.headers['x-csrf-token'];
    if (csrfTokenHeader) {
      const token = Array.isArray(csrfTokenHeader) ? csrfTokenHeader[0] : csrfTokenHeader;
      logger.debug('CSRF token found in x-csrf-token header', {
        path: req.path,
        tokenLength: token?.length || 0
      });
      return token;
    }
    
    // Check x-xsrf-token (standard header that csurf also checks by default)
    const xsrfTokenHeader = req.headers['x-xsrf-token'];
    if (xsrfTokenHeader) {
      const token = Array.isArray(xsrfTokenHeader) ? xsrfTokenHeader[0] : xsrfTokenHeader;
      logger.debug('CSRF token found in x-xsrf-token header', {
        path: req.path,
        tokenLength: token?.length || 0
      });
      return token;
    }
    
    // Return undefined if no token found (csurf will handle the error)
    // csurf will also check the XSRF-TOKEN cookie automatically
    logger.debug('No CSRF token found in headers or body', {
      path: req.path,
      method: req.method,
      hasCookies: !!req.headers.cookie,
      hasSession: !!req.session
    });
    return undefined;
  }
});

/**
 * Error handler for CSRF validation errors with enhanced logging and response details
 */
export function handleCsrfError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.code === 'EBADCSRFTOKEN') {
    // Determine if token is missing or invalid
    const tokenSource = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) ? 'header' :
                        (req.body && req.body._csrf) ? 'form' : 'none';
    
    // Extract the token that was sent (if any)
    const sentToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || 
                      (req.body && req.body._csrf)) || 'none';
    
    // Check for the CSRF secret in session (session-based storage)
    // csurf stores it as either _csrfSecret or csrfSecret depending on configuration
    const csrfSecret = (req.session as any)?._csrfSecret || (req.session as any)?.csrfSecret;
    const hasCsrfSecretInSession = !!csrfSecret;
    const csrfSecretLength = csrfSecret ? (typeof csrfSecret === 'string' ? csrfSecret.length : 'unknown') : 0;
    
    // Log the actual secret value (first 8 chars for debugging) to help diagnose mismatch
    const secretPreview = csrfSecret && typeof csrfSecret === 'string' ? csrfSecret.substring(0, 8) + '...' : 'none';
    const tokenPreview = typeof sentToken === 'string' && sentToken !== 'none' ? sentToken.substring(0, 8) + '...' : 'none';
    
    // Generate a request identifier for tracking this specific CSRF error
    const errorId = crypto.randomBytes(4).toString('hex');
    
    // Log detailed information about the failure
    logger.error(`CSRF validation failed [${errorId}]`, {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.session?.userId || 'unauthenticated',
      referrer: req.headers.referer || req.headers.origin || 'unknown',
      errorDetail: err.message,
      tokenSource,
      sentTokenLength: typeof sentToken === 'string' ? sentToken.length : 'unknown',
      tokenPreview,
      hasCsrfSecretInSession,
      csrfSecretLength,
      secretPreview,
      secretKey: (req.session as any)?._csrfSecret ? '_csrfSecret' : ((req.session as any)?.csrfSecret ? 'csrfSecret' : 'none'),
      tokenAge: req.session?._csrfTokenCreatedAt ? 
               `${Math.floor((Date.now() - req.session._csrfTokenCreatedAt) / 1000)}s` : 'unknown',
      sessionAge: req.session?.createdAt ?
                 `${Math.floor((Date.now() - (req.session.createdAt as number)) / 1000)}s` : 'unknown',
      authChanged: req.session?._authChanged || false,
      cookies: {
        hasSessionCookie: !!req.cookies?.['connect.sid'],
        cookieNames: req.cookies ? Object.keys(req.cookies) : []
      },
      session: {
        hasSession: !!req.session,
        hasCsrfSecret: hasCsrfSecretInSession,
        sessionId: req.sessionID || 'none'
      },
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host
      }
    });
    
    // Mark auth state as changed to force token rotation on next request
    markAuthStateChanged(req);
    
    // Provide clear and helpful error message with the error ID for reference
    return next(new AppError(`CSRF token validation failed (Error ID: ${errorId}). This could be due to an expired session or a cross-site request. Please refresh the page and try again.`, 403));
  }
  
  // Pass other errors through
  next(err);
}

/**
 * Generates a CSRF token and sends it in the response
 * Includes token refresh based on age when authentication state changes
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip if csrfToken function is not available (middleware not applied)
  if (typeof req.csrfToken !== 'function') {
    return next();
  }
  
  // Only generate tokens for GET/HEAD/OPTIONS requests or the CSRF token endpoint
  // Don't generate new tokens on POST/PUT/DELETE requests as it can interfere with validation
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS' && req.path !== '/api/auth/csrf-token') {
    return next();
  }
  
  // CRITICAL: Prevent duplicate token generation if token already exists in res.locals
  // This can happen if generateCsrfToken middleware is applied multiple times
  if (res.locals.csrfToken) {
    logger.debug('CSRF token already generated, skipping duplicate generation', {
      path: req.path,
      method: req.method,
      sessionId: req.sessionID || 'none'
    });
    return next();
  }
  
  // Check if token needs rotation based on authentication change or age
  const shouldRotate = shouldRotateToken(req);
  
  // CRITICAL: Reset _authChanged flag IMMEDIATELY if rotation is needed due to auth change
  // This prevents race conditions where multiple concurrent requests all rotate the token
  // We reset it before generating the token so subsequent requests won't also rotate
  const wasAuthChanged = req.session?._authChanged || false;
  if (shouldRotate && wasAuthChanged && req.session) {
    req.session._authChanged = false;
    // Mark session as modified so it gets saved
    req.session.touch();
  }
  
  // Generate new token - this modifies the session by adding _csrfSecret
  // IMPORTANT: req.csrfToken() will generate a new secret if one doesn't exist
  // If a secret already exists, it will use that secret to generate the token
  const token = req.csrfToken();
  
  // Log token generation for debugging
  const csrfSecret = (req.session as any)?._csrfSecret || (req.session as any)?.csrfSecret;
  logger.debug('CSRF token generated', {
    path: req.path,
    method: req.method,
    hasSession: !!req.session,
    hasCsrfSecret: !!csrfSecret,
    csrfSecretKey: (req.session as any)?._csrfSecret ? '_csrfSecret' : ((req.session as any)?.csrfSecret ? 'csrfSecret' : 'none'),
    sessionId: req.sessionID || 'none',
    userId: req.session?.userId || 'unauthenticated',
    tokenPreview: token ? token.substring(0, 8) + '...' : 'none',
    secretPreview: csrfSecret && typeof csrfSecret === 'string' ? csrfSecret.substring(0, 8) + '...' : 'none',
    secretLength: csrfSecret && typeof csrfSecret === 'string' ? csrfSecret.length : 0
  });
  
  // CRITICAL: Save the session after generating CSRF token
  // With resave: false, we must explicitly save the session when it's modified
  // The csrfToken() function modifies req.session by adding _csrfSecret, so we need to save it
  if (req.session) {
    // IMPORTANT: Normalize CSRF secret key - csurf expects _csrfSecret (with underscore)
    // If for some reason it's stored as csrfSecret (without underscore), normalize it
    if ((req.session as any)?.csrfSecret && !(req.session as any)?._csrfSecret) {
      (req.session as any)._csrfSecret = (req.session as any).csrfSecret;
      delete (req.session as any).csrfSecret;
      logger.debug('Normalized CSRF secret key from csrfSecret to _csrfSecret', {
        sessionId: req.sessionID || 'none'
      });
    }
    
    // Mark session as touched to ensure it's saved
    req.session.touch();
    
    // CRITICAL: For the CSRF token endpoint, we need to wait for the session save
    // For other GET requests, we can save asynchronously (but this might cause issues)
    // The CSRF token endpoint already waits for the save in the route handler
    if (req.path === '/api/auth/csrf-token') {
      // For the CSRF token endpoint, save will be awaited in the route handler
      // Just set the token in locals and cookie, and continue
      res.cookie(defaultConfig.tokenName, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: defaultConfig.cookie.maxAge * 1000,
        path: '/'
      });
      res.locals.csrfToken = token;
      
      if (shouldRotate) {
        logger.warn('CSRF token rotated', {
          userId: req.session?.userId || 'unauthenticated',
          reason: wasAuthChanged ? 'auth_change' : 'age',
          ip: req.ip,
          sessionId: req.sessionID || 'none'
        });
      }
      
      return next();
    }
    
    // For other GET requests, save asynchronously (non-blocking)
    req.session.save((err: any) => {
      if (err) {
        logger.error('Failed to save session after CSRF token generation', {
          error: err.message,
          path: req.path,
          userId: req.session?.userId || 'unauthenticated',
          sessionId: req.sessionID || 'none'
        });
        // Continue anyway - the token might still work if session was already saved
      } else {
        // Log successful save
        const savedCsrfSecret = (req.session as any)?._csrfSecret || (req.session as any)?.csrfSecret;
        logger.debug('Session saved after CSRF token generation', {
          path: req.path,
          sessionId: req.sessionID || 'none',
          hasCsrfSecret: !!savedCsrfSecret,
          csrfSecretKey: (req.session as any)?._csrfSecret ? '_csrfSecret' : ((req.session as any)?.csrfSecret ? 'csrfSecret' : 'none'),
          userId: req.session?.userId || 'unauthenticated',
          tokenPreview: token ? token.substring(0, 8) + '...' : 'none',
          secretPreview: savedCsrfSecret && typeof savedCsrfSecret === 'string' ? savedCsrfSecret.substring(0, 8) + '...' : 'none',
          secretLength: savedCsrfSecret && typeof savedCsrfSecret === 'string' ? savedCsrfSecret.length : 0
        });
      }
      
      // Send token in cookie with appropriate settings
      res.cookie(defaultConfig.tokenName, token, {
        httpOnly: false, // Client-side JS needs to read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' for better compatibility with reverse proxies (like Render)
        maxAge: defaultConfig.cookie.maxAge * 1000, // Convert to milliseconds
        path: '/' // Ensure cookie is available for all paths
      });
      
      // Also store token in locals for template rendering
      res.locals.csrfToken = token;
      
      // If token was rotated due to authentication change, log it
      if (shouldRotate) {
        logger.warn('CSRF token rotated', {
          userId: req.session?.userId || 'unauthenticated',
          reason: wasAuthChanged ? 'auth_change' : 'age',
          ip: req.ip,
          sessionId: req.sessionID || 'none'
        });
      }
      
      next();
    });
  } else {
    // No session - send token anyway (might be used for stateless requests)
    logger.warn('Generating CSRF token without session', {
      path: req.path,
      method: req.method
    });
    res.cookie(defaultConfig.tokenName, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: defaultConfig.cookie.maxAge * 1000,
      path: '/'
    });
    res.locals.csrfToken = token;
    next();
  }
}

/**
 * Determines if the CSRF token should be rotated
 * Tokens rotate on authentication state changes or after a certain age
 */
function shouldRotateToken(req: Request): boolean {
  // Always rotate if authentication state changed
  if (req.session && req.session._authChanged) {
    return true;
  }
  
  // Check token age - if cookie timestamp metadata exists
  const tokenTimestamp = req.session?._csrfTokenCreatedAt;
  if (tokenTimestamp) {
    const tokenAgeMs = Date.now() - tokenTimestamp;
    return tokenAgeMs > (defaultConfig.tokenRotationAge * 1000);
  }
  
  // If no timestamp, consider it as needing rotation
  return true;
}

/**
 * Mark authentication state as changed, triggering token rotation
 */
export function markAuthStateChanged(req: Request): void {
  if (req.session) {
    req.session._authChanged = true;
    
    // Invalidate the existing token immediately by changing its ID
    if (req.session._csrfSecret) {
      req.session._csrfSecret = crypto.randomBytes(16).toString('hex');
    }
  }
}

/**
 * Enhanced middleware to set up CSRF protection with flexible path configuration
 * @param options Custom configuration options
 */
export function setupCsrf(customExemptPaths: string[] = []) {
  // Merge custom exempt paths with defaults
  const exemptPaths = [...defaultConfig.exemptPaths, ...customExemptPaths];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if path is exempt from CSRF protection
    const isExemptPath = exemptPaths.some(path => req.path.startsWith(path));
    
    // Check if method is exempt (unless path is in strictPaths)
    const isStrictPath = defaultConfig.strictPaths.some(path => req.path.startsWith(path));
    const isExemptMethod = defaultConfig.ignoreMethods.includes(req.method) && !isStrictPath;
    
    // Skip CSRF protection if path is exempt or method is exempt
    if (isExemptPath || isExemptMethod) {
      return next();
    }
    
    // IMPORTANT: Normalize CSRF secret key before validation
    // csurf expects _csrfSecret (with underscore) when cookie: false
    // If the session has csrfSecret (without underscore), normalize it
    // CRITICAL: With Redis, we need to ensure the session is fully loaded before validation
    // The session is automatically loaded by express-session middleware, but we should
    // ensure it's ready before proceeding with CSRF validation
    if (req.session) {
      if ((req.session as any)?.csrfSecret && !(req.session as any)?._csrfSecret) {
        (req.session as any)._csrfSecret = (req.session as any).csrfSecret;
        delete (req.session as any).csrfSecret;
        // Save the normalized session (async, don't wait)
        req.session.save((err) => {
          if (err) {
            logger.error('Failed to save session after normalizing CSRF secret key', { error: err });
          } else {
            logger.debug('Normalized CSRF secret key from csrfSecret to _csrfSecret', {
              sessionId: req.sessionID || 'none'
            });
          }
        });
      }
      
      // Ensure session is touched to prevent expiration during validation
      // This is especially important with Redis to ensure the session TTL is extended
      req.session.touch();
    }
    
    // Record token creation time for rotation logic
    if (req.session && !req.session._csrfTokenCreatedAt) {
      req.session._csrfTokenCreatedAt = Date.now();
    }
    
    // Log session state before CSRF validation
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const csrfSecretCheck = (req.session as any)?._csrfSecret || (req.session as any)?.csrfSecret;
      const sentToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || 
                        (req.body && req.body._csrf)) || 'none';
      
      logger.debug('CSRF validation check', {
        path: req.path,
        method: req.method,
        hasSession: !!req.session,
        hasCsrfSecret: !!csrfSecretCheck,
        csrfSecretKey: (req.session as any)?._csrfSecret ? '_csrfSecret' : ((req.session as any)?.csrfSecret ? 'csrfSecret' : 'none'),
        sessionId: req.sessionID || 'none',
        userId: req.session?.userId || 'unauthenticated',
        tokenProvided: sentToken !== 'none',
        tokenPreview: typeof sentToken === 'string' && sentToken !== 'none' ? sentToken.substring(0, 8) + '...' : 'none',
        secretPreview: csrfSecretCheck && typeof csrfSecretCheck === 'string' ? csrfSecretCheck.substring(0, 8) + '...' : 'none',
        secretLength: csrfSecretCheck && typeof csrfSecretCheck === 'string' ? csrfSecretCheck.length : 0
      });
      
      // If session exists but CSRF secret is missing, this is a problem
      // The secret should have been created when the token was generated
      // This usually means the session wasn't saved properly after token generation
      if (req.session && !csrfSecretCheck) {
        logger.error('CSRF secret missing in session during validation - session may not have been saved', {
          path: req.path,
          sessionId: req.sessionID || 'none',
          userId: req.session?.userId || 'unauthenticated',
          sessionKeys: req.session ? Object.keys(req.session) : [],
          has_csrfSecret: !!(req.session as any)?._csrfSecret,
          has_csrfSecret_no_underscore: !!(req.session as any)?.csrfSecret
        });
        // Don't generate a new secret here - it won't match the token that was sent
        // The validation will fail, which is correct behavior
      }
    }
    
    // Apply CSRF protection
    csrfProtection(req, res, next);
  };
}

/**
 * Simplified middleware for CSRF protection that includes error handling
 * @param customExemptPaths Optional array of paths that should skip CSRF protection
 */
export function csrfMiddleware(customExemptPaths: string[] = []) {
  return [
    // Add initial token format validation before passing to the main CSRF middleware
    validateCsrfTokenFormat,
    setupCsrf(customExemptPaths), 
    handleCsrfError,
    generateCsrfToken
  ];
}

/**
 * Validate the CSRF token format before processing
 * Acts as a pre-check before the main CSRF validation
 */
export function validateCsrfTokenFormat(req: Request, res: Response, next: NextFunction) {
  // Only apply for routes requiring CSRF protection
  const isExemptPath = defaultConfig.exemptPaths.some(path => req.path.startsWith(path));
  const isExemptMethod = defaultConfig.ignoreMethods.includes(req.method);
  const isStrictPath = defaultConfig.strictPaths.some(path => req.path.startsWith(path));
  
  if ((isExemptPath || isExemptMethod) && !isStrictPath) {
    return next();
  }
  
  // If we need to validate the token, check if it's in a valid format
  const tokenInHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const tokenInBody = req.body && req.body._csrf;
  const token = tokenInHeader || tokenInBody;
  
  // If no token is provided, log and continue (the main csrf middleware will handle the rejection)
  if (!token) {
    logger.debug('No CSRF token provided', { 
      path: req.path, 
      method: req.method, 
      hasSession: !!req.session 
    });
    return next();
  }
  
  // Check for token format validity (e.g., length, characters)
  if (typeof token !== 'string' || token.length < 24 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    logger.warn('Invalid CSRF token format', {
      path: req.path,
      method: req.method,
      tokenLength: typeof token === 'string' ? token.length : 'not a string',
      ip: req.ip
    });
    
    return next(new AppError('Invalid CSRF token format', 403));
  }
  
  // Token format appears valid, proceed to full validation
  next();
}

/**
 * API Request Signing
 * 
 * This provides an additional layer of protection for API requests by signing
 * requests with a timestamp and signature to prevent replay attacks and request tampering.
 */

// Import the more comprehensive API signature verification implementation
import { 
  verifyRequestSignature, 
  signPayload, 
  generateSignature 
} from '../utils/apiSignature';

// Secret key for API signing - in production, this would be environment-specific
const API_SIGNING_SECRET = process.env.API_SIGNING_SECRET || 'development-signing-secret';

// Timestamp tolerance in seconds
const TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes

// Configuration for API signature verification
const API_SIGNATURE_CONFIG = {
  headerName: 'X-API-Signature',
  timestampHeaderName: 'X-API-Timestamp',
  expirationTimeMs: TIMESTAMP_TOLERANCE_SEC * 1000,
  secretKey: API_SIGNING_SECRET
};

/**
 * Legacy signature generation function maintained for backward compatibility
 * with existing integrations
 * 
 * @param payload - The request data to sign
 * @param timestamp - Unix timestamp in seconds
 * @param secret - Secret key for signing
 * @returns Signature hex string
 */
export function generateApiSignature(payload: any, timestamp: number, secret: string = API_SIGNING_SECRET): string {
  const dataToSign = JSON.stringify({
    payload,
    timestamp
  });
  
  return crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');
}

/**
 * Legacy signature verification function maintained for backward compatibility
 * with existing integrations
 * 
 * @param payload - The request data that was signed
 * @param timestamp - Unix timestamp from the request
 * @param signature - Provided signature to verify
 * @param secret - Secret key for verification
 * @returns Boolean indicating if signature is valid
 */
export function verifyApiSignature(
  payload: any,
  timestamp: number,
  signature: string,
  secret: string = API_SIGNING_SECRET
): boolean {
  // Check if the timestamp is within tolerance
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - timestamp);
  
  if (timeDiff > TIMESTAMP_TOLERANCE_SEC) {
    logger.error('API signature timestamp expired', {
      timeDiff,
      maxAge: TIMESTAMP_TOLERANCE_SEC, 
      requestTimestamp: timestamp,
      currentTime,
      timestamp: Date.now()
    });
    return false;
  }
  
  // Generate expected signature and compare
  const expectedSignature = generateApiSignature(payload, timestamp, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Enhanced middleware to verify API request signatures using the new implementation
 * but with backward compatibility for existing integrations
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function verifyApiSignatureMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip verification for safe methods unless explicitly enabled for all methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) && process.env.SIGN_SAFE_METHODS !== 'true') {
    return next();
  }
  
  // Skip verification in development unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.ENFORCE_API_SIGNING !== 'true') {
    return next();
  }
  
  // Define paths to exempt from signature verification
  const exemptPaths = [
    '/api/login',                    // Add: Direct login endpoint
    '/api/logout',                   // Add: Direct logout endpoint
    '/api/register',                 // Add: Direct register endpoint
    '/api/auth/login',
    '/api/auth/logout',              // Add: Auth logout endpoint
    '/api/auth/register',
    '/api/auth/csrf-token',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',      // Add: Reset password
    '/api/survey/start',
    '/api/survey/answer',            // Add: Public survey answer
    '/api/survey/complete',          // Add: Public survey complete
    '/api/survey/questions',         // Add: Survey questions
    '/api/webhook',
    '/api/system/health',
    '/api/public',
    '/api/survey/share',
    '/api/demo-request',
    '/api/health',
    '/api/templates',
    '/api/newsletter',               // Add: Public newsletter
    '/api/cookie-consent',           // Add: Public cookie consent
  ];
  
  // For development, exempt all company endpoints as well
  if (process.env.NODE_ENV === 'development') {
    exemptPaths.push(
      '/api/company',
      '/api/invoices',
      '/api/users',
      '/api/roles',
      '/api/surveys'
    );
  }
  
  // Skip verification for exempt paths
  if (exemptPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Skip for requests with a valid session cookie that contains user authentication
  // This allows browser-based authenticated sessions to bypass API signing
  if (req.session && req.session.userId) {
    return next();
  }

  // Try new signature format first
  const newSignatureHeader = req.headers['x-api-signature'];
  const newTimestampHeader = req.headers['x-timestamp'];
  
  // If new style headers exist, use the new verification method
  if (newSignatureHeader && newTimestampHeader) {
    const isValidNewSignature = verifyRequestSignature(req, API_SIGNATURE_CONFIG);
    
    if (isValidNewSignature) {
      return next();
    }
    
    logger.error('Invalid API signature detected (new format)', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.session?.userId || 'unauthenticated',
      timestamp: newTimestampHeader
    });
    return next(new AppError('API signature verification failed: Invalid signature', 401));
  }
  
  // Fall back to legacy format
  const legacySignature = req.headers['x-api-signature'] as string;
  const legacyTimestamp = parseInt(req.headers['x-api-timestamp'] as string);
  
  // Validate legacy signature existence
  if (!legacySignature || isNaN(legacyTimestamp)) {
    logger.error('Missing API signature headers', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.session?.userId || 'unauthenticated',
      headers: req.headers
    });
    return next(new AppError('API signature verification failed: Missing signature headers', 401));
  }
  
  // Verify the legacy signature
  const isValidLegacy = verifyApiSignature(req.body, legacyTimestamp, legacySignature);
  
  if (!isValidLegacy) {
    logger.error('Invalid API signature detected (legacy format)', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.session?.userId || 'unauthenticated',
      timestamp: legacyTimestamp
    });
    return next(new AppError('API signature verification failed: Invalid signature', 401));
  }
  
  // Signature is valid
  next();
}

export default {
  csrfProtection,
  handleCsrfError,
  generateCsrfToken,
  setupCsrf,
  csrfMiddleware,
  markAuthStateChanged,
  shouldRotateToken,
  generateApiSignature,
  verifyApiSignature,
  verifyApiSignatureMiddleware
};
