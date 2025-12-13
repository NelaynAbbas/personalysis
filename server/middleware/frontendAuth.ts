import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

const logger = new Logger('FrontendAuth');

/**
 * Middleware to protect frontend routes that require authentication
 */
export function protectFrontendRoute(req: Request, res: Response, next: NextFunction) {
  // Skip protection for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/collaboration',
    '/survey',
    '/analytics',
    '/settings',
    '/profile'
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => req.path.startsWith(route));

  if (!isProtectedRoute) {
    return next();
  }

  // Check authentication
  if (!req.session || !req.session.userId) {
    logger.warn('Unauthenticated access attempt to protected frontend route', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });

    // Redirect to login page for frontend routes
    return res.redirect('/login');
  }

  // For admin routes, check admin privileges
  if (req.path.startsWith('/admin')) {
    const userRole = req.session.userRole;
    const isAdmin = userRole === 'admin' || userRole === 'platform_admin';
    
    if (!isAdmin) {
      logger.warn('Unauthorized access attempt to admin frontend route', {
        ip: req.ip,
        path: req.path,
        userId: req.session.userId,
        userRole: userRole
      });

      // Redirect to dashboard if user is authenticated but not admin
      return res.redirect('/dashboard');
    }
  }

  // User is authenticated and authorized, continue
  next();
}

/**
 * Middleware to redirect authenticated users away from login/register pages
 */
export function redirectAuthenticatedUsers(req: Request, res: Response, next: NextFunction) {
  const authRoutes = ['/login', '/register', '/'];
  
  // Only apply to auth routes
  if (!authRoutes.includes(req.path)) {
    return next();
  }

  // If user is already authenticated, redirect to dashboard
  if (req.session && req.session.userId) {
    const userRole = req.session.userRole;
    
    // Redirect admin users to admin panel
    if (userRole === 'admin' || userRole === 'platform_admin') {
      return res.redirect('/admin');
    }
    
    // Redirect regular users to dashboard
    return res.redirect('/dashboard');
  }

  next();
}