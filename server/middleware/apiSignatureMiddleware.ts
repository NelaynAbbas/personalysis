import { Request, Response, NextFunction } from 'express';
import { createSignatureVerificationMiddleware, SignatureConfig } from '../utils/apiSignature';
import { Logger } from '../utils/Logger';

const logger = new Logger('ApiSignatureMiddleware');
import { AppError } from './errorHandler';
import { ErrorCodes } from '../utils/apiResponses';

// Default configuration for API signature handling
const DEFAULT_CONFIG = {
  headerName: 'X-API-Signature',
  timestampHeaderName: 'X-Timestamp',
  expirationTimeMs: 5 * 60 * 1000, // 5 minutes in milliseconds
  secretKey: process.env.API_SIGNATURE_KEY || 'survey-platform-default-signature-key'
};

/**
 * Configuration for which paths require API signature verification
 */
const API_SIGNATURE_CONFIG = {
  // Paths that should be excluded from signature verification
  excludePaths: [
    '/api/login',                    // Add: Direct login endpoint
    '/api/logout',                   // Add: Direct logout endpoint
    '/api/register',                 // Add: Direct register endpoint
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',            // Add: Register endpoint
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/csrf-token',
    '/api/auth/me',
    '/api/survey/start',
    '/api/survey/answer',            // Add: Public survey answer
    '/api/survey/complete',          // Add: Public survey complete
    '/api/survey/questions',
    '/api/system/performance',
    '/api/demo-request',
    '/api/templates',
    '/api/newsletter',               // Add: Public newsletter
    '/api/cookie-consent',           // Add: Public cookie consent
    '/health'
  ],
  
  // Sensitive paths that always require signature verification, regardless of global settings
  requireForPaths: [
    '/api/company',
    '/api/invoices',
    '/api/users',
    '/api/roles',
    '/api/surveys'
  ]
};

/**
 * Environment-based middleware configuration
 */
function getMiddlewareConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, disable API signature verification for easier testing and debugging
    // Don't require the signature for any paths - this simplifies development
    return {
      excludePaths: [
        ...API_SIGNATURE_CONFIG.excludePaths,
        '/api/survey',
        '/api/support',
        '/api/company', // Exclude company endpoints in development
        '/api/invoices', // Exclude invoice endpoints in development
        '/api/users',    // Exclude user endpoints in development
        '/api/roles'     // Exclude role endpoints in development
      ],
      requireForPaths: [] // Don't require signature for any paths in development
    };
  }
  
  return API_SIGNATURE_CONFIG;
}

/**
 * Create the API signature verification middleware based on environment
 */
export const apiSignatureMiddleware = createSignatureVerificationMiddleware(getMiddlewareConfig());

/**
 * Enhanced middleware to check and enforce API signature requirements
 * with more detailed error handling
 * 
 * @param customConfig - Optional custom configuration for signature verification
 */
export function enhancedApiSignatureMiddleware(customConfig?: Partial<SignatureConfig>) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  return function(req: Request, res: Response, next: NextFunction) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const middlewareConfig = getMiddlewareConfig();
    
    // Check if the path is exempted from signature verification
    const isExcluded = middlewareConfig.excludePaths.some(path => 
      req.path === path || req.path.startsWith(`${path}/`)
    );
    
    // Check if the path always requires signature verification
    const isRequired = middlewareConfig.requireForPaths.some(path => 
      req.path === path || req.path.startsWith(`${path}/`)
    );
    
    // Skip in development mode for non-required paths
    if (isDevelopment && !isRequired) {
      return next();
    }
    
    // Skip for excluded paths unless it's explicitly required
    if (isExcluded && !isRequired) {
      logger.debug(`Skipping API signature verification for excluded path: ${req.path}`);
      return next();
    }
    
    // Check for required headers
    const signature = req.headers[config.headerName.toLowerCase()];
    const timestamp = req.headers[config.timestampHeaderName.toLowerCase()];
    
    if (!signature || !timestamp) {
      logger.error('API request missing required signature headers', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp
      });
      
      return next(new AppError('Missing required API signature headers', 401, undefined, ErrorCodes.UNAUTHORIZED));
    }
    
    // Call the normal signature verification middleware
    return apiSignatureMiddleware(req, res, next);
  };
}

/**
 * Helper middleware to log API signature usage in debug mode
 * with additional security reporting
 */
export function apiSignatureDebugMiddleware(req: Request, res: Response, next: NextFunction) {
  const hasSignature = req.headers['x-api-signature'] !== undefined;
  const hasTimestamp = req.headers['x-timestamp'] !== undefined;
  
  if (hasSignature || hasTimestamp) {
    logger.debug('API signature information', {
      path: req.path,
      method: req.method,
      hasSignature,
      hasTimestamp,
      timestamp: req.headers['x-timestamp'],
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  }
  
  next();
}
