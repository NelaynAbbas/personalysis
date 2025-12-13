import React from 'react';
import { useQuery, UseQueryResult, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import LoadingState, { LoadingStateProps } from '@/components/ui/loading-state';

interface UseQueryWithLoadingOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  /**
   * Options to customize the loading state component
   */
  loadingStateProps?: Omit<LoadingStateProps, 'ref'>;
  
  /**
   * Custom loading component to use instead of the default
   */
  LoadingComponent?: React.ComponentType<any>;
  
  /**
   * Custom error component to use instead of showing the error in the console
   */
  ErrorComponent?: React.ComponentType<{ error: TError | null }>;
  
  /**
   * Whether to skip rendering the loading component
   */
  skipLoadingComponent?: boolean;
  
  /**
   * Whether to show any error in the console
   */
  logErrorsToConsole?: boolean;
}

/**
 * A hook that combines useQuery with automatic loading state management
 * 
 * @example
 * const { data, isLoading, Component } = useQueryWithLoading({
 *   queryKey: ['users'],
 *   url: '/api/users',
 *   loadingStateProps: { text: 'Loading users...' }
 * });
 * 
 * return (
 *   <div>
 *     <Component>
 *       {data && <UserList users={data} />}
 *     </Component>
 *   </div>
 * );
 */
export function useQueryWithLoading<TData = unknown, TError = unknown>({
  queryKey,
  url,
  loadingStateProps = {},
  LoadingComponent,
  ErrorComponent,
  skipLoadingComponent = false,
  logErrorsToConsole = true,
  ...options
}: {
  queryKey: QueryKey;
  url: string;
} & UseQueryWithLoadingOptions<TData, TError>): UseQueryResult<TData, TError> & {
  Component: React.ComponentType<{ children?: React.ReactNode }>;
} {
  // Execute the query
  const queryResult = useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res.json();
    },
    ...options,
  });

  const { isLoading, error, isError } = queryResult;

  // Log any errors to the console
  React.useEffect(() => {
    if (isError && error && logErrorsToConsole) {
      console.error(`Query error for ${url}:`, error);
    }
  }, [isError, error, url, logErrorsToConsole]);

  // The wrapper component that will show loading/error states
  const Component: React.FC<{ children?: React.ReactNode }> = React.useCallback(
    ({ children }) => {
      if (isLoading && !skipLoadingComponent) {
        if (LoadingComponent) {
          return <LoadingComponent />;
        }
        return <LoadingState {...loadingStateProps} />;
      }

      if (isError && error) {
        if (ErrorComponent) {
          return <ErrorComponent error={error} />;
        }
        return <>{children}</>;
      }

      return <>{children}</>;
    },
    [isLoading, isError, error, skipLoadingComponent, loadingStateProps]
  );

  return {
    ...queryResult,
    Component,
  };
}

export default useQueryWithLoading;