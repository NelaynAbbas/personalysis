/**
 * Security Headers Middleware
 * 
 * Sets a comprehensive set of security headers to protect the application
 * against common web vulnerabilities like XSS, clickjacking, MIME sniffing, etc.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sets required security headers for the application
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Basic security headers that should be used everywhere
  const headers = {
    // Prevent browsers from MIME-sniffing a response away from the declared content-type
    'X-Content-Type-Options': 'nosniff',
    
    // Prevents the browser from embedding site in a frame/iframe (protects against clickjacking)
    'X-Frame-Options': 'DENY',
    
    // Enables the Cross-site scripting (XSS) filter built into most recent web browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Sends minimal identifying information for HTTPS requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Tell browsers to start making HTTPS calls instead of HTTP, once we're enforcing HTTPS
    // Only enable in production
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
    })
  };
  
  // Content Security Policy - defines approved sources of content
  // Disable in development to allow hot reloading and other dev tools
  if (process.env.NODE_ENV === 'production') {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for now
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' https://api.openai.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; ');
  }
  
  // Add all headers to the response
  Object.entries(headers).forEach(([name, value]) => {
    if (value !== undefined) {
      res.setHeader(name, value);
    }
  });
  
  next();
}

/**
 * Adds proper Cache-Control headers based on the request path
 * @param maxAge Maximum age in seconds for the cache
 */
export function cacheControl(maxAge = 0) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Static assets (typically in public directory)
    if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    } 
    // API responses - no caching by default 
    else if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // HTML responses - no caching by default
    else {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    
    next();
  };
}

/**
 * Adds security headers for file downloads
 */
export function secureDownloads(req: Request, res: Response, next: NextFunction) {
  // Check if this is a download response (by path or Content-Disposition header)
  const potentialDownload = req.path.match(/\.(csv|xlsx|pdf|zip|doc|docx)$/) 
                          || res.getHeader('Content-Disposition')?.toString().includes('attachment');
  
  if (potentialDownload) {
    // Add headers to help prevent XSS attacks via downloaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  }
  
  next();
}

export default {
  securityHeaders,
  cacheControl,
  secureDownloads
};