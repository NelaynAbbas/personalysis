import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { performLogout } from './logout';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // First try to parse as JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorJson = await res.json();
        throw new Error(`${res.status}: ${JSON.stringify(errorJson)}`);
      } else {
        // If not JSON, get as text
        const text = await res.text();
        console.error("Non-JSON error response:", text);
        throw new Error(`${res.status}: Non-JSON response received`);
      }
    } catch (parseError) {
      // If JSON parsing fails
      console.error("Error parsing response:", parseError);
      throw new Error(`${res.status}: ${res.statusText || "Unknown error"}`);
    }
  }
}

// Keep track of the CSRF token
let csrfToken: string | null = null;

// Function to get CSRF token from cookie (XSRF-TOKEN)
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Function to fetch a new CSRF token
export async function fetchCsrfToken(forceRefresh: boolean = false): Promise<string | null> {
  // If we already have a token and not forcing refresh, return it
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  // First, try to read from cookie (set by server)
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken && !forceRefresh) {
    csrfToken = cookieToken;
    return csrfToken;
  }

  try {
    const response = await fetch('/api/auth/csrf-token', {
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn(`CSRF token endpoint not available: ${response.status}. Continuing without CSRF protection.`);
      return null;
    }

    const data = await response.json();
    const newToken = data.csrfToken || data.token;

    if (!newToken) {
      // Try reading from cookie again after the request
      const cookieTokenAfter = getCsrfTokenFromCookie();
      if (cookieTokenAfter) {
        csrfToken = cookieTokenAfter;
        return csrfToken;
      }
      console.warn('CSRF token not found in response. Continuing without CSRF protection.');
      return null;
    }

    csrfToken = newToken;
    console.log('CSRF token fetched successfully');
    return csrfToken;
  } catch (error) {
    // Fallback to cookie if fetch fails
    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) {
      csrfToken = cookieToken;
      return csrfToken;
    }
    console.warn('Error fetching CSRF token. Continuing without CSRF protection:', error);
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`);

  // CSRF protection disabled - no token needed

  const options: RequestInit = {
    method,
    headers: { 
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  // Add authentication headers for admin endpoints
  if (url.includes('/api/admin/') || url.includes('/api/system/')) {
    // For admin endpoints, always add admin headers in development
    (options.headers as Record<string, string>)['X-Mock-Admin'] = 'true';
    (options.headers as Record<string, string>)['X-User-ID'] = '1';
    (options.headers as Record<string, string>)['X-User-Role'] = 'platform_admin';
    console.log(`Enforced admin headers for admin endpoint ${url}`);
  }

  // Add authentication headers for admin user
  const mockAdminUser = localStorage.getItem('currentUser');
  if (mockAdminUser) {
    try {
      const user = JSON.parse(mockAdminUser);
      if (user.role === 'platform_admin' && user.isAuthenticated) {
        // For mock admin, set special headers for testing
        (options.headers as Record<string, string>)['X-Mock-Admin'] = 'true';
        (options.headers as Record<string, string>)['X-User-ID'] = String(user.id);
        (options.headers as Record<string, string>)['X-User-Role'] = user.role;
        console.log('Added admin authentication headers', {
          'X-Mock-Admin': 'true',
          'X-User-ID': String(user.id),
          'X-User-Role': user.role
        });
      }
    } catch (e) {
      console.error('Error parsing mock user:', e);
    }
  }

  // CSRF protection disabled - no token headers needed

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    console.log(`Response status for ${url}:`, response.status);

    // Debug response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(`Response headers for ${url}:`, headers);

    // CSRF protection disabled - no CSRF error handling needed

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query request for ${queryKey[0]}`);
    try {
      // Setup request options with authentication headers
      const requestOptions: RequestInit = {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add authentication headers for admin user
      const mockAdminUser = localStorage.getItem('currentUser');
      if (mockAdminUser) {
        try {
          const user = JSON.parse(mockAdminUser);
          if (user.role === 'platform_admin' && user.isAuthenticated) {
            // For mock admin, set special headers for testing
            (requestOptions.headers as Record<string, string>)['X-Mock-Admin'] = 'true';
            (requestOptions.headers as Record<string, string>)['X-User-ID'] = String(user.id);
            (requestOptions.headers as Record<string, string>)['X-User-Role'] = user.role;
            console.log(`Adding admin headers for query to ${queryKey[0]}:`, {
              'X-Mock-Admin': 'true',
              'X-User-ID': String(user.id),
              'X-User-Role': user.role
            });
          }
        } catch (e) {
          console.error('Error parsing mock user:', e);
        }
      }

      // If this is an admin-specific endpoint, double-check auth headers are present
      if (queryKey[0].toString().includes('/api/admin/')) {
        const mockAdminUser = localStorage.getItem('currentUser');
        if (!mockAdminUser) {
          throw new Error('Admin authentication required for this endpoint');
        }

        try {
          const user = JSON.parse(mockAdminUser);
          if (!user || !user.isAuthenticated || user.role !== 'platform_admin') {
            throw new Error('Admin role required for this endpoint');
          }

          // Ensure admin headers are set correctly
          (requestOptions.headers as Record<string, string>)['X-Mock-Admin'] = 'true';
          (requestOptions.headers as Record<string, string>)['X-User-ID'] = String(user.id);
          (requestOptions.headers as Record<string, string>)['X-User-Role'] = user.role;

          console.log(`Enforced admin headers for admin endpoint ${queryKey[0]}`);
        } catch (e) {
          console.error('Error enforcing admin auth:', e);
          throw new Error('Admin authentication required');
        }
      }

      // CSRF protection disabled - no token needed

      const res = await (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          return await fetch(queryKey[0] as string, { ...requestOptions, signal: controller.signal });
        } catch (e: any) {
          if (e && e.name === 'AbortError') {
            throw new Error('Request timed out after 15s');
          }
          throw e;
        } finally {
          clearTimeout(timeoutId);
        }
      })();

      console.log(`Query response status for ${queryKey[0]}:`, res.status);

      // Handle 401 Unauthorized - session expired
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        
        // Auto-logout on 401 for protected routes
        performLogout({
          showToast: true,
          reason: 'Your session has expired. Please log in again.',
          redirectTo: '/'
        });
        
        throw new Error('401: Unauthorized - Session expired');
      }

      // CSRF protection disabled - no CSRF error handling needed

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await res.json();
          throw new Error(`${res.status}: ${JSON.stringify(errorJson)}`);
        } else {
          // If not JSON, get as text and log it for debugging
          const text = await res.text();
          console.error(`Non-JSON response (${res.status}) for ${queryKey[0]}:`, text);
          throw new Error(`${res.status}: Non-JSON response received`);
        }
      }

      // Ensure we're getting JSON back
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error(`Expected JSON but got (${contentType}) for ${queryKey[0]}:`, text);
        throw new Error("Expected JSON response but received a different content type");
      }

      return await res.json();
    } catch (error) {
      console.error(`Query error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetching on window focus for up-to-date data
      staleTime: 60000, // Data becomes stale after 60 seconds (reduced from Infinity)
      gcTime: 300000, // Keep unused data in cache for 5 minutes (formerly cacheTime in v4)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Utility to update the cache when receiving real-time updates from WebSocket
 * This helps keep data in sync across all clients without requiring re-fetching
 */
export function updateQueryCache(type: string, data: any): void {
  console.log(`Updating query cache for ${type}`, data);

  // Map of WebSocket message types to their corresponding query keys
  const queryKeyMap: Record<string, string[]> = {
    'surveyUpdate': ['/api/surveys'],
    'surveyTemplateUpdate': ['/api/survey-templates'],
    'businessContextUpdate': ['/api/business-contexts'],
    'integrationUpdate': ['/api/integrations'],
    'licenseUpdate': ['/api/licenses'],
    'analyticsUpdate': [
      '/api/analytics', 
      '/api/company/*/analytics'
    ],
    'clientUpdate': ['/api/clients'],
    'deploymentUpdate': ['/api/deployments']
  };

  // Get the query keys to invalidate
  const queryKeys = queryKeyMap[type] || [];

  if (queryKeys.length === 0) {
    console.log(`No query keys mapped for type: ${type}`);
    return;
  }

  // Invalidate relevant queries
  queryKeys.forEach(key => {
    // If the key contains a wildcard, invalidate all matching queries
    if (key.includes('*')) {
      const prefix = key.split('*')[0];
      queryClient.invalidateQueries({
        predicate: query => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith(prefix)
      });
    } else {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  });

  // If data includes an entityId, also invalidate specific entity queries
  if (data?.id || data?.entityId) {
    const id = data.id || data.entityId;

    switch (type) {
      case 'surveyUpdate':
        queryClient.invalidateQueries({ queryKey: [`/api/surveys/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/surveys/${id}/analytics`] });
        break;
      case 'businessContextUpdate':
        queryClient.invalidateQueries({ queryKey: [`/api/business-contexts/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/company/${data.companyId}/business-contexts`] });
        break;
      case 'licenseUpdate':
        // If a license is updated, also invalidate related client queries
        if (data.clientId) {
          queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}`] });
        }
        break;
      case 'clientUpdate':
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
        break;
    }
  }
}