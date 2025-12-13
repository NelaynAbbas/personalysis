import { toast } from '@/hooks/use-toast';
import { performLogout } from './logout';

// API response types
export interface ApiSuccessResponse<T = any> {
  status: 'success';
  message?: string;
  data: T;
  timestamp: string;
  path?: string;
}

export interface ApiErrorResponse {
  status: 'error' | 'fail';
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path?: string;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// API error class
export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  response?: Response;

  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// Configuration for API requests
export interface ApiRequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  retries?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
  skipAuthHeader?: boolean;
}

// Default configuration
const defaultConfig: ApiRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  // Always include credentials so session cookies are sent, matching getQueryFn behavior
  credentials: 'include',
  retries: 3,
  retryDelay: 1000,
  showErrorToast: true,
  skipAuthHeader: false,
};

/**
 * Make an API request with retry mechanism and error handling
 */
export async function apiRequest<T = any>(
  url: string,
  config: ApiRequestConfig = {}
): Promise<T> {
  // Merge default config with user config
  const mergedConfig: ApiRequestConfig = {
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config.headers,
    },
  };

  // Add query parameters to the URL if present
  if (mergedConfig.params) {
    const queryParams = new URLSearchParams();
    Object.entries(mergedConfig.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  // Add auth header if not explicitly skipped
  if (!mergedConfig.skipAuthHeader) {
    // Check for mock admin user first (used for testing)
    const mockAdminUser = localStorage.getItem('currentUser');
    if (mockAdminUser) {
      try {
        const user = JSON.parse(mockAdminUser);
        if (user.role === 'platform_admin' && user.isAuthenticated) {
          // For mock admin, set a special header for testing
          mergedConfig.headers = {
            ...mergedConfig.headers,
            'X-Mock-Admin': 'true',
            'X-User-ID': String(user.id),
            'X-User-Role': user.role
          };
        }
      } catch (e) {
        console.error('Error parsing mock user:', e);
      }
    }
    
    // Regular token auth
    const token = localStorage.getItem('authToken');
    if (token) {
      mergedConfig.headers = {
        ...mergedConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // CSRF protection disabled - no token needed

  // Function to handle API errors
  const handleApiError = (error: ApiError): never => {
    // Handle 401 Unauthorized - session expired
    if (error.status === 401) {
      // Don't show error toast for 401 - logout will show its own message
      performLogout({
        showToast: true,
        reason: 'Your session has expired. Please log in again.',
        redirectTo: '/'
      });
      throw error; // Still throw to prevent further processing
    }

    // Handle 503 Service Unavailable - transient DB error (don't logout)
    if (error.status === 503) {
      if (mergedConfig.showErrorToast) {
        toast({
          title: 'Service Temporarily Unavailable',
          description: error.message || 'The database is temporarily unavailable. Please try again in a moment.',
          variant: 'destructive',
        });
      }
      throw error;
    }

    // Log using enhanced logger
    try {
      const logger = window.logger;
      if (logger && typeof logger.logApiError === 'function') {
        logger.logApiError(
          url, 
          mergedConfig.method || 'GET', 
          error, 
          mergedConfig.body ? JSON.parse(mergedConfig.body as string) : undefined
        );
      }
    } catch (loggingError) {
      console.error('Failed to log API error:', loggingError);
    }
    
    // Show toast if enabled
    if (mergedConfig.showErrorToast) {
      toast({
        title: error.code ? `Error ${error.code}` : 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
    
    throw error;
  };

  let lastError: any;
  const maxRetries = mergedConfig.retries || 0;
  const retryDelay = mergedConfig.retryDelay || 1000;

  // Retry loop
  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      const response = await fetch(url, mergedConfig);
      
      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: ApiErrorResponse;
        try {
          // Try to parse error response
          errorData = await response.json();
        } catch (e) {
          // If parsing fails, create a simple error object
          errorData = {
            status: 'error',
            message: response.statusText || 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }

        // CSRF protection disabled - no CSRF error handling needed

        const apiError = new ApiError(
          errorData.message || 'API request failed',
          response.status,
          response
        );
        apiError.code = errorData.code;
        apiError.errors = errorData.errors;
        
        // Don't retry 4xx errors except for specific cases like 429 (rate limiting) or CSRF (already handled above)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return handleApiError(apiError);
        }
        
        // For other errors, throw for retry if we have retries left
        if (retryCount === maxRetries) {
          return handleApiError(apiError);
        }
        throw apiError;
      }

      // For empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse successful response
      const data = await response.json();
      
      // Double-check that the response has the expected format
      // Accept both 'status: success' and 'success: true' formats
      if (data.status === 'success' || data.success === true) {
        // Handle both response formats
        return data.data || data;
      } else {
        const apiError = new ApiError(
          data.message || 'API response has error status',
          response.status,
          response
        );
        apiError.code = data.code;
        apiError.errors = data.errors;
        return handleApiError(apiError);
      }
    } catch (error: any) {
      lastError = error;
      
      // Network errors or other exceptions
      if (retryCount < maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount);
        console.warn(`API request failed, retrying (${retryCount + 1}/${maxRetries}) after ${delay}ms:`, url);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        const isApiError = error instanceof ApiError;
        const apiError = isApiError
          ? error
          : new ApiError(
              error?.message || 'Network error',
              0 // No status code for network errors
            );

        return handleApiError(apiError);
      }
    }
  }

  // If we get here, all retries failed
  const finalError = new ApiError(
    lastError?.message || 'API request failed after all retries',
    lastError?.status || 0
  );
  return handleApiError(finalError);
}

// Convenience methods for different HTTP methods
export const api = {
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return apiRequest<T>(url, { ...config, method: 'GET' });
  },
  
  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return apiRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return apiRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  async patch<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return apiRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return apiRequest<T>(url, { ...config, method: 'DELETE' });
  },
};

export default api;