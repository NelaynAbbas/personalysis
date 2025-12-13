import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import React from 'react';
import LoadingState, { LoadingStateProps } from '../components/common/LoadingState';
import ErrorAlert, { ErrorAlertProps } from '../components/common/ErrorAlert';
import logger from '../lib/logger';

interface UseQueryWithStatusOptions<TData, TError> extends UseQueryOptions<TData, TError> {
  /**
   * Custom loading component or props to pass to default LoadingState
   */
  loadingComponent?: React.ReactNode | LoadingStateProps;
  
  /**
   * Custom error component or props to pass to default ErrorAlert
   */
  errorComponent?: React.ReactNode | ErrorAlertProps;
  
  /**
   * If true, error and loading components will be rendered only when they're the primary
   * content (useful for inline queries that shouldn't block the entire page)
   */
  showStatusAsContent?: boolean;
  
  /**
   * Log extra information with query errors
   */
  extraErrorContext?: Record<string, any>;
  
  /**
   * Error mapper function to convert API errors to user-friendly messages
   * If not provided, will use default error formatting
   */
  errorMapper?: (error: TError) => { message: string; code?: string; details?: string; };
}

type QueryWithStatusResult<TData, TError> = UseQueryResult<TData, TError> & {
  /**
   * A React component that shows the appropriate loading/error state or the children
   */
  StatusComponent: React.FC<{ children: React.ReactNode }>;
};

/**
 * Enhanced useQuery hook that provides consistent loading and error states
 * 
 * @example
 * // Basic usage
 * const { data, StatusComponent } = useQueryWithStatus({
 *   queryKey: ['/api/products'],
 *   loadingComponent: { variant: 'skeleton', count: 5 }
 * });
 * 
 * return (
 *   <StatusComponent>
 *     <ProductList products={data} />
 *   </StatusComponent>
 * );
 */
function useQueryWithStatus<TData = unknown, TError = Error>(
  options: UseQueryWithStatusOptions<TData, TError>
): QueryWithStatusResult<TData, TError> {
  const {
    loadingComponent,
    errorComponent,
    showStatusAsContent = true,
    extraErrorContext = {},
    errorMapper,
    ...queryOptions
  } = options;
  
  // Extract the queryKey for logging
  const queryKey = queryOptions.queryKey || [];
  const queryKeyString = Array.isArray(queryKey) ? queryKey[0] : String(queryKey);
  
  // Use the standard React Query hook
  const queryResult = useQuery<TData, TError>({
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      onError: (error: TError) => {
        // Log errors through our logger
        logger.error(`Query error for ${queryKeyString}`, {
          error,
          queryKey,
          ...extraErrorContext
        });
        
        // Call the original onError if provided
        if (queryOptions.onError) {
          queryOptions.onError(error);
        }
      }
    }
  });
  
  // Create a component that shows the appropriate state
  const StatusComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoading, error, status, isFetching, refetch } = queryResult;
    
    // Get default error message from the error
    const getDefaultErrorMessage = (err: any): string => {
      if (typeof err === 'string') return err;
      if (err instanceof Error) return err.message;
      if (err && typeof err === 'object') {
        if ('message' in err) return String(err.message);
        if ('error' in err) return String(err.error);
      }
      return 'An unexpected error occurred';
    };
    
    // Format error using mapper or default logic
    const formatError = (err: any) => {
      if (errorMapper) {
        return errorMapper(err as TError);
      }
      
      const message = getDefaultErrorMessage(err);
      return { message };
    };

    // When loading
    if (isLoading) {
      if (showStatusAsContent) {
        // Show loading component
        if (React.isValidElement(loadingComponent)) {
          return <>{loadingComponent}</>;
        }
        
        return <LoadingState {...(loadingComponent as LoadingStateProps || {})} />;
      }
      
      // If not showing as content, just show a subtle loading indicator
      return (
        <div className="relative">
          {isFetching && (
            <div className="absolute top-0 left-0 right-0 z-10">
              <div className="h-1 w-full bg-primary/10">
                <div className="h-1 bg-primary animate-pulse" style={{ width: '20%' }}></div>
              </div>
            </div>
          )}
          {children}
        </div>
      );
    }
    
    // When error
    if (error) {
      if (showStatusAsContent) {
        // Show error component
        if (React.isValidElement(errorComponent)) {
          return <>{errorComponent}</>;
        }
        
        const { message, code, details } = formatError(error);
        
        return (
          <ErrorAlert 
            message={message}
            error={error}
            errorCode={code}
            onRetry={() => refetch()}
            {...(errorComponent as ErrorAlertProps || {})}
          />
        );
      }
      
      // If not showing as content, show an error banner above the content
      const { message } = formatError(error);
      
      return (
        <div className="space-y-2">
          <ErrorAlert 
            message={message}
            onRetry={() => refetch()}
            className="mb-4"
          />
          {children}
        </div>
      );
    }
    
    // When success, just show the children
    return <>{children}</>;
  };
  
  return {
    ...queryResult,
    StatusComponent
  };
}

export default useQueryWithStatus;