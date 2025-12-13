import { apiRequest } from './queryClient';
import logger from './logger';

/**
 * Error class for API request failures
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;
  originalError?: Error;

  constructor(status: number, statusText: string, data?: any, originalError?: Error) {
    const message = data?.message || statusText || 'API request failed';
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.originalError = originalError;
  }
}

/**
 * Options for API requests
 */
export interface ApiOptions {
  /**
   * Headers to include with the request
   */
  headers?: Record<string, string>;
  
  /**
   * If true, suppress logging of request and response
   */
  silent?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: ApiError) => void;
  
  /**
   * Number of retry attempts for failed requests
   */
  retries?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Context information to include in logs
   */
  logContext?: Record<string, any>;
  
  /**
   * If true, don't throw errors (return { data: null, error } instead)
   */
  noThrow?: boolean;
  
  /**
   * If provided, automatically show toast notifications on error
   */
  showErrorToast?: boolean | ((error: ApiError) => string);
}

/**
 * Send a GET request to the API
 */
export async function apiGet<T = any>(url: string, options: ApiOptions = {}) {
  return apiCall<T>('GET', url, undefined, options);
}

/**
 * Send a POST request to the API
 */
export async function apiPost<T = any>(url: string, data?: any, options: ApiOptions = {}) {
  return apiCall<T>('POST', url, data, options);
}

/**
 * Send a PUT request to the API
 */
export async function apiPut<T = any>(url: string, data?: any, options: ApiOptions = {}) {
  return apiCall<T>('PUT', url, data, options);
}

/**
 * Send a PATCH request to the API
 */
export async function apiPatch<T = any>(url: string, data?: any, options: ApiOptions = {}) {
  return apiCall<T>('PATCH', url, data, options);
}

/**
 * Send a DELETE request to the API
 */
export async function apiDelete<T = any>(url: string, options: ApiOptions = {}) {
  return apiCall<T>('DELETE', url, undefined, options);
}

/**
 * Generic function to send an API request with consistent error handling
 */
async function apiCall<T = any>(
  method: string,
  url: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const {
    headers,
    silent = false,
    onError,
    retries = 0,
    retryDelay = 1000,
    logContext = {},
    noThrow = false,
    showErrorToast = false,
  } = options;

  let attempt = 0;

  // Log the request unless silent is true
  if (!silent) {
    logger.debug(`API ${method} request to ${url}`, {
      method,
      url,
      data,
      ...logContext
    }, 'API');
  }

  async function attemptRequest(): Promise<any> {
    try {
      attempt++;
      
      // Send the request using our apiRequest utility
      const response = await apiRequest(method, url, data);
      
      // Check if response is OK
      if (!response.ok) {
        let errorData;
        try {
          // Try to parse error response as JSON
          errorData = await response.json();
        } catch (e) {
          // If not JSON, use text
          errorData = { message: await response.text() };
        }
        
        // Create ApiError object
        const error = new ApiError(response.status, response.statusText, errorData);
        
        // Log the error
        if (!silent) {
          logger.error(`API Error: ${method} ${url} - ${response.status} ${response.statusText}`, {
            error,
            attempt,
            ...logContext
          }, 'API');
        }
        
        // Call custom error handler if provided
        if (onError) {
          onError(error);
        }
        
        // Retry if we have attempts left
        if (attempt <= retries) {
          // Wait for retry delay
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          // Attempt again
          return attemptRequest();
        }
        
        // Handle error toast if requested
        if (showErrorToast) {
          const message = typeof showErrorToast === 'function'
            ? showErrorToast(error)
            : errorData.message || 'API request failed';
            
          // Import toast dynamically to avoid circular dependencies
          const { toast } = await import('../hooks/use-toast');
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
        
        // Either throw the error or return it based on options
        if (noThrow) {
          return { data: null, error };
        } else {
          throw error;
        }
      }
      
      // Handle empty responses
      if (response.status === 204) {
        return null;
      }
      
      // Parse response as JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Log the successful response
      if (!silent) {
        logger.debug(`API ${method} response from ${url}`, {
          status: response.status,
          data: responseData,
          ...logContext
        }, 'API');
      }
      
      return responseData;
    } catch (error) {
      // Handle network errors or other exceptions
      if (!(error instanceof ApiError)) {
        // Log the error
        if (!silent) {
          logger.error(`API Request failed: ${method} ${url}`, {
            error,
            attempt,
            ...logContext
          }, 'API');
        }
        
        // Create an ApiError from the generic error
        const apiError = new ApiError(
          0,
          error instanceof Error ? error.message : 'Unknown error',
          null,
          error instanceof Error ? error : undefined
        );
        
        // Call custom error handler if provided
        if (onError) {
          onError(apiError);
        }
        
        // Retry if we have attempts left
        if (attempt <= retries) {
          // Wait for retry delay
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          // Attempt again
          return attemptRequest();
        }
        
        // Handle error toast if requested
        if (showErrorToast) {
          const message = typeof showErrorToast === 'function'
            ? showErrorToast(apiError)
            : apiError.message;
            
          // Import toast dynamically to avoid circular dependencies
          const { toast } = await import('../hooks/use-toast');
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
        
        // Either throw the error or return it based on options
        if (noThrow) {
          return { data: null, error: apiError };
        } else {
          throw apiError;
        }
      }
      
      // Re-throw ApiError
      throw error;
    }
  }

  return attemptRequest();
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};