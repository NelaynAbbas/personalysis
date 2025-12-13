import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp: string;
  path?: string;
  code?: string;
}

/**
 * Send a success response
 * @param res Express response object
 * @param data Data to be sent in the response
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 */
export function sendSuccess<T = any>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode = 200
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl,
  });
}

/**
 * Send an error response for client errors (4xx)
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 400)
 * @param errors Validation errors
 * @param code Error code for the client
 */
export function sendClientError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]> | string,
  code?: string
): Response<ApiResponse> {
  return res.status(statusCode).json({
    status: 'fail',
    message,
    errors: typeof errors === 'string' ? { general: [errors] } : errors,
    code,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl,
  });
}

/**
 * Send an error response for server errors (5xx)
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 * @param code Error code for the client
 */
export function sendServerError(
  res: Response,
  message = 'Internal server error',
  statusCode = 500,
  code?: string
): Response<ApiResponse> {
  return res.status(statusCode).json({
    status: 'error',
    message,
    code,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl,
  });
}

/**
 * Error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
};

/**
 * Map HTTP status codes to meaningful descriptions
 */
export const HttpStatusMessages: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};