import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn } from './queryClient';
import { apiRequest } from './queryClient';

export interface SystemErrorLog {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  source: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface SystemErrorsResponse {
  success: boolean;
  errors: SystemErrorLog[];
  total: number;
  filters: {
    count: number;
    level?: string;
    source?: string;
  };
}

export interface ErrorFilters {
  count?: number;
  level?: 'error' | 'warning' | 'info';
  source?: string;
}

/**
 * Hook to fetch system error logs with optional filtering
 */
export function useSystemErrors(filters: ErrorFilters = {}) {
  const { count = 10, level, source } = filters;
  
  // Build query string for filters
  const queryParams = new URLSearchParams();
  if (count) queryParams.append('count', count.toString());
  if (level) queryParams.append('level', level);
  if (source) queryParams.append('source', source);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/system/errors${queryString ? `?${queryString}` : ''}`;
  
  return useQuery<SystemErrorsResponse>({
    queryKey: ['/api/system/errors', { count, level, source }],
    queryFn: getQueryFn({
      on401: 'throw',
    }),
    refetchInterval: 60000, // Refetch every minute for up-to-date error logs
  });
}

/**
 * Hook to clear system error logs
 */
export function useClearSystemErrors() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest('/api/system/errors/clear', 'POST');
    },
    onSuccess: () => {
      // Invalidate the error logs query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/system/errors'] });
    },
  });
}

/**
 * Hook to generate a test error for testing error logging
 */
export function useGenerateTestError() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (errorType: 'runtime' | 'api' | 'warning' | 'generic' = 'generic') => {
      return apiRequest(`/api/system/test-error?type=${errorType}`, 'GET');
    },
    onSuccess: () => {
      // Invalidate the error logs query to refetch updated data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/system/errors'] });
      }, 500); // Small delay to ensure the error is logged before refetching
    },
  });
}