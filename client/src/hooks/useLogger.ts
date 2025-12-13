import { useEffect, useRef } from 'react';
import logger from '../lib/logger';

/**
 * Hook to provide component-specific logging
 * Automatically logs mount and unmount events
 * 
 * @param componentName Name of the component for logging identification
 * @param initialProps Optional initial props to log with mount event
 */
export function useLogger(componentName: string, initialProps?: Record<string, any>) {
  const mounted = useRef(false);

  useEffect(() => {
    // Only log mount once to avoid duplicate logs on strict mode
    if (!mounted.current) {
      mounted.current = true;
      logger.logMount(componentName, initialProps);
    }

    return () => {
      logger.logUnmount(componentName);
    };
  }, [componentName, initialProps]);

  return {
    debug: (message: string, metadata?: Record<string, any>) => 
      logger.debug(message, metadata, componentName),
    
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, metadata, componentName),
    
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, metadata, componentName),
    
    error: (message: string, metadata?: Record<string, any>) => 
      logger.error(message, metadata, componentName),
    
    logUserAction: (action: string, details?: Record<string, any>) => 
      logger.logUserAction(`${componentName} - ${action}`, details),
    
    logApiRequest: (endpoint: string, method: string, params?: any) => 
      logger.logApiRequest(endpoint, method, params),
    
    logApiResponse: (endpoint: string, method: string, status: number, data?: any) => 
      logger.logApiResponse(endpoint, method, status, data),
    
    logApiError: (endpoint: string, method: string, error: any) => 
      logger.logApiError(endpoint, method, error)
  };
}

export default useLogger;