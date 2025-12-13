/**
 * Production Configuration Settings
 * 
 * This file contains security and configuration settings specific to production mode.
 * In a real environment, many of these would be set through environment variables.
 */

// Session security settings
export const SESSION_CONFIG = {
  // Default to 30 minutes idle timeout, but prefer environment variable if set
  idleTimeout: process.env.SESSION_IDLE_TIMEOUT 
    ? parseInt(process.env.SESSION_IDLE_TIMEOUT) 
    : 30 * 60 * 1000, // 30 minutes
  
  // Default to 8 hours absolute timeout, but prefer environment variable if set
  absoluteTimeout: process.env.SESSION_ABSOLUTE_TIMEOUT 
    ? parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT) 
    : 8 * 60 * 60 * 1000, // 8 hours
  
  // Enable absolute timeout (session expires after X hours regardless of activity)
  enableAbsoluteTimeout: true,
  
  // Extend session on activity
  extendOnActivity: true,
  
  // Session cookie settings
  cookie: {
    // Force secure cookie in production
    secure: true,
    
    // Prevent client-side JS from accessing cookie
    httpOnly: true,
    
    // Default expiry (overridden by session timeout logic)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    
    // CSRF protection
    sameSite: 'lax',
    
    // Domain restriction (uncomment and set in production)
    // domain: '.personalysispro.com',
    
    // Path restriction
    path: '/'
  },
  
  // Session secret - should be set through environment variables in production
  secret: process.env.SESSION_SECRET || 'replace-with-strong-random-secret',
  
  // How often to check for expired sessions
  checkInterval: 60 * 1000 // 1 minute
};

// CSRF Protection settings
export const CSRF_CONFIG = {
  // CSRF protection disabled
  enabled: false,
  
  // How often to rotate CSRF tokens
  tokenRotationInterval: 60 * 60 * 1000, // 1 hour
  
  // Generate a new token after authentication state changes
  rotateOnAuthChange: true,
  
  // Cookie settings for the CSRF token
  cookie: {
    key: 'csrf',
    path: '/',
    signed: true,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Paths excluded from CSRF protection (APIs with signatures, non-browser clients, etc.)
  excludePaths: [
    '/api/auth/token',
    '/api/webhook/stripe',
    '/api/webhook/mailchimp',
    '/api/webhook/sendgrid',
    '/api/survey/respond',
    '/api/health'
  ]
};

// API Signature settings
export const API_SIGNATURE_CONFIG = {
  // Enable API signature verification
  enabled: true,
  
  // Header containing the signature
  headerName: 'X-API-Signature',
  
  // Header containing the timestamp (for preventing replay attacks)
  timestampHeaderName: 'X-Timestamp',
  
  // How long a request is valid
  expirationTimeMs: 5 * 60 * 1000, // 5 minutes
  
  // Secret key for verification - should be set through environment variables
  secretKey: process.env.API_SIGNATURE_KEY || 'replace-with-secure-key',
  
  // Paths that should be excluded from signature verification
  excludePaths: [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/csrf-token',
    '/api/auth/me',
    '/api/survey/start',
    '/api/survey/questions',
    '/api/system/performance',
    '/health'
  ],
  
  // Sensitive paths that always require signature verification
  requireForPaths: [
    '/api/company',
    '/api/invoices',
    '/api/users',
    '/api/roles',
    '/api/surveys'
  ]
};

// Rate Limiting settings
export const RATE_LIMIT_CONFIG = {
  // General API rate limits
  api: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // 1000 requests per hour per IP
    message: "Too many requests, please try again later"
  },
  
  // Auth-specific rate limits (login attempts, etc.)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 attempts per minute per IP
    message: "Too many login attempts, please try again later"
  },
  
  // WebSocket rate limits
  websocket: {
    maxConnections: 5, // Maximum 5 concurrent connections per IP
    maxMessages: 100, // Maximum 100 messages per minute
    windowMs: 60 * 1000, // 1 minute window
    whitelistedIPs: [] // Empty in production
  }
};

// Security Headers
export const SECURITY_HEADERS_CONFIG = {
  // Content Security Policy
  csp: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.personalysispro.com",
    "connect-src 'self' https://*.personalysispro.com",
    "frame-src 'self'",
    "object-src 'none'"
  ].join('; '),
  
  // HTTP Strict Transport Security
  hsts: "max-age=63072000; includeSubDomains; preload",
  
  // Prevent browsers from MIME-sniffing
  noSniff: "nosniff",
  
  // XSS Protection
  xssProtection: "1; mode=block",
  
  // Prevent embedding in frames (clickjacking protection)
  frameOptions: "DENY",
  
  // Referrer Policy
  referrerPolicy: "strict-origin-when-cross-origin",
  
  // Permitted cross-domain policies
  permittedCrossDomainPolicies: "none",
  
  // Feature Policy / Permissions Policy
  permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
};

// Database encryption and sensitive data handling
export const DATA_PROTECTION_CONFIG = {
  // Enable field-level encryption for sensitive data
  enableFieldEncryption: true,
  
  // Fields that should be encrypted when stored
  encryptedFields: [
    'creditCardNumber',
    'ssn',
    'taxId',
    'personalAddress',
    'personalPhone',
    'apiKey',
    'secretKey'
  ],
  
  // Fields that should be masked in logs
  maskedLogFields: [
    'password',
    'passwordHash',
    'passwordSalt',
    'token',
    'refreshToken',
    'apiKey',
    'secretKey',
    'creditCard',
    'ssn'
  ],
  
  // How to mask these fields
  maskingPattern: '[REDACTED]'
};