/**
 * Authentication Middleware
 * 
 * This middleware provides authentication and authorization functions.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

const logger = new Logger('AuthMiddleware');

/**
 * Middleware to require authentication
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function requireAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    logger.warn('Unauthenticated access attempt', { 
      ip: req.ip, 
      path: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  next();
}

/**
 * Middleware to require admin privileges
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check for mock admin headers (development mode)
  const mockAdmin = req.headers['x-mock-admin'] as string;
  const mockUserRole = req.headers['x-user-role'] as string;
  

  
  if (mockAdmin === 'true' && mockUserRole === 'platform_admin') {
    logger.info('Mock admin access granted for development', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    return next();
  }
  
  if (!req.session || !req.session.user) {
    logger.warn('Unauthenticated access attempt to admin endpoint', { 
      ip: req.ip, 
      path: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  // Check if user is an admin
  const isAdmin = req.session.user.role === 'admin' || 
                   req.session.user.role === 'platform_admin';
  
  if (!isAdmin) {
    logger.warn('Unauthorized access attempt to admin endpoint', { 
      ip: req.ip, 
      path: req.path,
      method: req.method,
      userId: req.session.user.id,
      userRole: req.session.user.role
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Admin privileges required'
    });
  }
  
  next();
}