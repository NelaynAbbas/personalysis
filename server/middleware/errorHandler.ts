import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendClientError, sendServerError, ErrorCodes } from '../utils/apiResponses';

// Custom error class for API errors with status code
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // By default, we mark errors as operational unless explicitly set
    this.errors = errors;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Convert Postgres errors to readable errors
export function handlePostgresErrors(err: any, res: Response): Response {
  if (err.code === '23505') {
    // Unique violation
    return sendClientError(
      res,
      'A record with this information already exists.',
      409,
      undefined,
      ErrorCodes.ALREADY_EXISTS
    );
  } else if (err.code === '23503') {
    // Foreign key violation
    return sendClientError(
      res,
      'This operation refers to a resource that does not exist or is no longer available.',
      400,
      undefined,
      ErrorCodes.INVALID_INPUT
    );
  } else if (err.code === '42P01') {
    // Undefined table
    return sendServerError(
      res,
      'Database schema error.',
      500,
      ErrorCodes.DATABASE_ERROR
    );
  } else if (err.code === '42703') {
    // Undefined column
    return sendServerError(
      res, 
      'Database schema error.',
      500,
      ErrorCodes.DATABASE_ERROR
    );
  }

  // Default database error
  console.error('Database error:', err);
  return sendServerError(
    res,
    'A database error occurred.',
    500,
    ErrorCodes.DATABASE_ERROR
  );
}

// Convert validation errors to readable format
export function handleValidationErrors(err: any, _req: Request, res: Response): Response {
  if (err instanceof ZodError) {
    const validationErrors: Record<string, string[]> = {};
    
    // Format Zod validation errors
    err.errors.forEach(e => {
      const field = e.path.join('.');
      if (!validationErrors[field]) {
        validationErrors[field] = [];
      }
      validationErrors[field].push(e.message);
    });
    
    return sendClientError(
      res,
      'Validation failed. Please check the data and try again.',
      400,
      validationErrors,
      ErrorCodes.VALIDATION_ERROR
    );
  }
  
  // For other validation libraries or custom validation errors
  if (err.name === 'ValidationError') {
    let validationErrors: Record<string, string[]> = {};
    
    // Handle errors from other validation libraries
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = [err.errors[key].message];
      });
    }
    
    return sendClientError(
      res,
      'Validation failed. Please check the data and try again.',
      400,
      validationErrors,
      ErrorCodes.VALIDATION_ERROR
    );
  }
  
  return sendClientError(
    res,
    err.message || 'Invalid input provided.',
    400,
    undefined,
    ErrorCodes.INVALID_INPUT
  );
}

// Error statistics storage for analytics
interface ErrorStats {
  count: number;
  lastOccurred: Date;
  occurrences: {
    timestamp: Date;
    url: string;
    userId?: number;
  }[];
}

// In-memory error tracking (would be replaced with a database in production)
const errorTracking: Record<string, ErrorStats> = {};

// Log error details
function logError(err: Error, req: Request): void {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    user: (req as any).user ? { id: (req as any).user.id } : 'unauthenticated',
    requestId: req.headers['x-request-id'] || 'unknown',
    body: process.env.NODE_ENV === 'development' ? req.body : undefined,
    query: req.query,
  };

  console.error('ERROR:', JSON.stringify(errorDetails, null, 2));
}

// Track error for analytics and realtime reporting
function trackError(err: Error, req: Request): void {
  const errorKey = getErrorKey(err);
  const timestamp = new Date();
  const userId = (req as any).user?.id;
  
  if (!errorTracking[errorKey]) {
    errorTracking[errorKey] = {
      count: 0,
      lastOccurred: timestamp,
      occurrences: []
    };
  }
  
  // Update stats
  errorTracking[errorKey].count++;
  errorTracking[errorKey].lastOccurred = timestamp;
  
  // Keep the most recent 100 occurrences for trending analysis
  errorTracking[errorKey].occurrences.push({
    timestamp,
    url: req.originalUrl,
    userId
  });
  
  if (errorTracking[errorKey].occurrences.length > 100) {
    errorTracking[errorKey].occurrences.shift();
  }
  
  // Broadcast error to connected admin clients
  broadcastErrorUpdate(errorKey, err, req);
}

// Create a consistent key for error tracking
function getErrorKey(err: Error): string {
  // Custom error with code
  if ((err as any).code) {
    return `${err.constructor.name}:${(err as any).code}`;
  }
  
  // Normalize the error message to make it more consistent for grouping
  const normalizedMessage = err.message
    .replace(/[0-9]+/g, '__NUM__')  // Replace numbers
    .replace(/'.*?'/g, '__STR__')   // Replace string literals
    .substring(0, 100);             // Limit length to avoid massive keys
  
  return `${err.constructor.name}:${normalizedMessage}`;
}

// Broadcast error to admin clients via WebSocket
function broadcastErrorUpdate(errorKey: string, err: Error, req: Request): void {
  try {
    // Only attempt to broadcast if the WebSocket server is available
    const { broadcastSystemUpdate } = require('../routes');
    if (typeof broadcastSystemUpdate === 'function') {
      const systemUpdate = {
        type: 'systemUpdate',
        updateType: 'error',
        errorDetails: {
          key: errorKey,
          message: err.message,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
          count: errorTracking[errorKey].count,
        },
        errorCount: Object.values(errorTracking).reduce((sum, stat) => sum + stat.count, 0)
      };
      
      broadcastSystemUpdate(systemUpdate);
    }
  } catch (broadcastErr) {
    // Don't let broadcasting errors affect the main error handling
    console.error('Error broadcasting error update:', broadcastErr);
  }
}

// Export error stats API for admin dashboard
export function getErrorStats(): {
  total: number;
  unique: number;
  recent: Array<{
    key: string;
    count: number;
    lastOccurred: Date;
    message: string;
  }>;
  trending: Array<{
    key: string;
    count: number;
    increasing: boolean;
  }>;
} {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Get recent errors (last hour)
  const recentErrors = Object.entries(errorTracking)
    .filter(([_, stats]) => stats.lastOccurred > oneHourAgo)
    .map(([key, stats]) => ({
      key,
      count: stats.count,
      lastOccurred: stats.lastOccurred,
      message: key.split(':')[1] || key
    }))
    .sort((a, b) => b.lastOccurred.getTime() - a.lastOccurred.getTime())
    .slice(0, 10);
  
  // Calculate trending errors (comparing last 5 minutes vs previous)
  const trending = Object.entries(errorTracking).map(([key, stats]) => {
    const recentOccurrences = stats.occurrences.filter(o => o.timestamp > fiveMinutesAgo).length;
    const previousOccurrences = stats.occurrences.filter(o => 
      o.timestamp <= fiveMinutesAgo && 
      o.timestamp > new Date(fiveMinutesAgo.getTime() - 5 * 60 * 1000)
    ).length;
    
    return {
      key,
      count: recentOccurrences,
      increasing: recentOccurrences > previousOccurrences,
    };
  })
  .filter(trend => trend.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);
  
  return {
    total: Object.values(errorTracking).reduce((sum, stat) => sum + stat.count, 0),
    unique: Object.keys(errorTracking).length,
    recent: recentErrors,
    trending
  };
}

// Main error handling middleware
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): Response {
  // Log the error
  logError(err, req);

  // Handle different types of errors
  
  // Track error occurrence for analytics
  trackError(err, req);
  
  // Handle operational errors (our AppError)
  if (err instanceof AppError) {
    return sendClientError(
      res,
      err.message,
      err.statusCode,
      err.errors,
      err.code
    );
  }
  
  // Handle Postgres/Database errors
  if (err.code && (err.code.startsWith('22') || err.code.startsWith('23') || err.code.startsWith('42'))) {
    return handlePostgresErrors(err, res);
  }
  
  // Handle validation errors (Zod, etc.)
  if (err instanceof ZodError || err.name === 'ValidationError') {
    return handleValidationErrors(err, req, res);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendClientError(
      res,
      'Invalid authentication token.',
      401,
      undefined,
      ErrorCodes.UNAUTHORIZED
    );
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendClientError(
      res,
      'Authentication token has expired. Please log in again.',
      401,
      undefined,
      ErrorCodes.TOKEN_EXPIRED
    );
  }
  
  // Handle file upload errors
  if (err.name === 'MulterError') {
    return sendClientError(
      res,
      `File upload error: ${err.message}`,
      400,
      undefined,
      ErrorCodes.INVALID_INPUT
    );
  }
  
  // Handle network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    return sendServerError(
      res,
      'Network connection error. Please try again later.',
      503,
      ErrorCodes.SERVICE_UNAVAILABLE
    );
  }
  
  // Handle permission errors
  if (err.code === 'EACCES') {
    return sendServerError(
      res,
      'Server permission error.',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
  
  // Handle external API errors
  if (err.isAxiosError || err.name === 'FetchError') {
    return sendServerError(
      res,
      'Error communicating with external service.',
      502,
      ErrorCodes.EXTERNAL_SERVICE_ERROR
    );
  }
  
  // Handle rate limiting errors
  if (err.statusCode === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
    return sendClientError(
      res,
      'Rate limit exceeded. Please try again later.',
      429,
      undefined,
      ErrorCodes.RATE_LIMITED
    );
  }
  
  // Handle business logic errors
  if (err.code === 'BUSINESS_RULE_VIOLATION') {
    return sendClientError(
      res,
      err.message || 'Operation violates business rules.',
      422,
      undefined,
      ErrorCodes.BUSINESS_RULE_VIOLATION
    );
  }
  
  // Handle unknown/unexpected errors in production
  if (process.env.NODE_ENV === 'production') {
    // Don't leak error details in production
    return sendServerError(
      res,
      'Something went wrong on our side. Our team has been notified.',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
  
  // In development, send the actual error message and stack
  return sendServerError(
    res,
    `${err.message || 'Unknown error'} - Stack: ${err.stack || 'No stack trace available'}`,
    500,
    ErrorCodes.INTERNAL_ERROR
  );
}

// Custom 404 handler
export function notFoundHandler(req: Request, res: Response): Response {
  return sendClientError(
    res,
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    undefined,
    ErrorCodes.NOT_FOUND
  );
}

// Export the error handler middleware
export default errorHandler;