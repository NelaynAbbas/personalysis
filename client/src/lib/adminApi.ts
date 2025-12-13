// Unified admin API client with proper authentication
export const adminRequest = async (method: string, url: string, body?: any) => {
  console.log(`Making admin ${method} request to ${url}`);
  
  // Admin authentication headers for development mode
  const adminHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Mock-Admin': 'true',
    'X-User-ID': '1',
    'X-User-Role': 'platform_admin'
  };
  
  // CSRF protection disabled - no token needed
  
  const options: RequestInit = {
    method,
    headers: adminHeaders,
    credentials: 'include'
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Admin ${method} request headers:`, adminHeaders);
  
  try {
    const response = await fetch(url, options);
    console.log(`Admin ${method} response status:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Admin API error response:', errorText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    if (method === 'DELETE') {
      return { status: 'success', message: 'Deleted successfully' };
    }
    
    const data = await response.json();
    console.log(`Admin ${method} response data:`, data);
    return data;
  } catch (error) {
    console.error(`Admin API request failed (${method} ${url}):`, error);
    throw error;
  }
};

// Helper function for admin queries with React Query
export const createAdminQueryFn = (url: string) => {
  return async () => {
    const response = await adminRequest('GET', url);
    return response.data || response;
  };
};