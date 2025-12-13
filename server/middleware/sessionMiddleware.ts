/**
 * Session Middleware
 * 
 * This middleware handles session management, including:
 * - Session timeout handling
 * - Session security settings
 * - Session persistence
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

const logger = new Logger('SessionMiddleware');
import { AppError } from './errorHandler';

// Constants
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const TIMEOUT_CHECK_INTERVAL = 60 * 1000; // Check every minute (in ms)

// Session management settings
const SESSION_CONFIG = {
  idleTimeout: process.env.SESSION_IDLE_TIMEOUT 
    ? parseInt(process.env.SESSION_IDLE_TIMEOUT) 
    : SESSION_IDLE_TIMEOUT,
  absoluteTimeout: process.env.SESSION_ABSOLUTE_TIMEOUT 
    ? parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT) 
    : SESSION_ABSOLUTE_TIMEOUT,
  enableAbsoluteTimeout: process.env.ENABLE_ABSOLUTE_TIMEOUT === 'true',
  extendOnActivity: process.env.EXTEND_SESSION_ON_ACTIVITY !== 'false'
};

/**
 * Middleware to handle session timeout
 */
export function sessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for paths that don't require authentication
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
  if (publicPaths.includes(req.path) || req.path.startsWith('/api/survey/')) {
    return next();
  }

  // Check if user is logged in (has a session)
  if (req.session && req.session.userId) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const sessionCreatedAt = req.session.createdAt || now;
    const idleTime = now - lastActivity;
    const sessionAge = now - sessionCreatedAt;

    // Check for idle timeout
    if (idleTime > SESSION_CONFIG.idleTimeout) {
      logger.security('Session idle timeout exceeded', {
        idleTime,
        maxIdleTime: SESSION_CONFIG.idleTimeout,
        userId: req.session.userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path
      });
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Error destroying timed-out session', {
            error: err.message,
            userId: req.session.userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            sessionType: 'idle timeout',
            timestamp: Date.now()
          });
        }
      });
      
      return next(new AppError('Your session has expired due to inactivity. Please login again.', 401));
    }

    // Check for absolute timeout
    if (SESSION_CONFIG.enableAbsoluteTimeout && sessionAge > SESSION_CONFIG.absoluteTimeout) {
      logger.security('Session absolute timeout exceeded', {
        sessionAge,
        maxSessionAge: SESSION_CONFIG.absoluteTimeout,
        userId: req.session.userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path
      });
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Error destroying absolute timed-out session', {
            error: err.message,
            userId: req.session.userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            sessionType: 'absolute timeout',
            timestamp: Date.now()
          });
        }
      });
      
      return next(new AppError('Your session has expired. Please login again.', 401));
    }

    // Update last activity time for the session if configured to do so
    if (SESSION_CONFIG.extendOnActivity) {
      req.session.lastActivity = now;
    }
  }
  
  next();
}

/**
 * Initialize session for a new login
 */
export function initializeSession(req: Request, userId: number, userRole: string, companyId: number): void {
  if (req.session) {
    req.session.userId = userId;
    req.session.userRole = userRole;
    req.session.companyId = companyId;
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();
    
    logger.security('Session initialized', {
      userId,
      userRole,
      companyId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: Date.now()
    });
  }
}

/**
 * Middleware to extend session lifetime on certain operations
 * 
 * Use this for routes that shouldn't trigger session expiration even without user interaction
 * (e.g., long-running background operations, file downloads, etc.)
 */
export function extendSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
}

/**
 * Middleware to ensure user is authenticated
 */
export function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  return next(new AppError('Authentication required', 401));
}

/**
 * Middleware to check if user has a specific role
 */
export function requireRole(role: string | string[]) {
  const roles = Array.isArray(role) ? role : [role];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return next(new AppError('Authentication required', 401));
    }
    
    const userRole = req.session.userRole;
    
    if (!roles.includes(userRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
}

export default {
  sessionTimeoutMiddleware,
  initializeSession,
  extendSessionMiddleware,
  requireAuthentication,
  requireRole
};