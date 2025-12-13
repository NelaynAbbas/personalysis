import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, RotateCcw, Home } from 'lucide-react';
import { Link } from 'wouter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onRecover?: (error: Error, info: ErrorInfo | null) => void | Promise<void>;
  resetKeys?: any[];
  FallbackComponent?: React.ComponentType<FallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  attemptingRecovery: boolean;
}

export interface FallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
  attemptRecovery: () => void;
  attemptingRecovery: boolean;
}

/**
 * Error Boundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * Enhanced with recovery features and reset keys for automatic recovery.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      attemptingRecovery: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Here you could also log to an error tracking service like Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }

  // Reset the error boundary state (retry rendering)
  resetErrorBoundary = (): void => {
    const { onReset } = this.props;
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false
    });
    
    if (onReset) {
      onReset();
    }
  };
  
  // Attempt recovery through the recovery function
  attemptRecovery = async (): Promise<void> => {
    const { onRecover } = this.props;
    const { error, errorInfo } = this.state;
    
    if (!onRecover || !error) return;

    this.setState({ attemptingRecovery: true });
    
    try {
      await onRecover(error, errorInfo);
      // If recovery succeeds, reset the error state
      this.resetErrorBoundary();
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      // Keep showing the error UI but stop the recovery spinner
      this.setState({ attemptingRecovery: false });
    }
  };

  // Check if any resetKeys changed to auto-reset the error boundary
  componentDidUpdate(prevProps: Props): void {
    const { resetKeys } = this.props;
    if (resetKeys && prevProps.resetKeys) {
      // Check if resetKeys have changed
      const hasResetKeysChanged = resetKeys.length !== prevProps.resetKeys.length || 
        resetKeys.some((value, index) => value !== prevProps.resetKeys[index]);
      
      if (hasResetKeysChanged && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo, attemptingRecovery } = this.state;
    const { children, fallback, FallbackComponent } = this.props;

    if (hasError) {
      // If a custom fallback component is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={error} 
            errorInfo={errorInfo} 
            resetErrorBoundary={this.resetErrorBoundary}
            attemptRecovery={this.attemptRecovery}
            attemptingRecovery={attemptingRecovery}
          />
        );
      }
      
      // If a custom fallback element is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, use the default fallback UI
      return (
        <DefaultErrorFallback 
          error={error} 
          errorInfo={errorInfo} 
          resetErrorBoundary={this.resetErrorBoundary}
          attemptRecovery={this.attemptRecovery}
          attemptingRecovery={attemptingRecovery}
        />
      );
    }

    // When there's no error, render children normally
    return children;
  }
}

/**
 * Default fallback component when errors occur
 * Enhanced with improved accessibility and keyboard navigation
 */
const DefaultErrorFallback: React.FC<FallbackProps> = ({ 
  error, 
  errorInfo, 
  resetErrorBoundary,
  attemptRecovery,
  attemptingRecovery
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Ctrl+R or Cmd+R to retry
    if ((event.ctrlKey || event.metaKey) && event.key === 'r' && !attemptingRecovery) {
      event.preventDefault();
      resetErrorBoundary();
    }
    // Alt+H to return home
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      // Will navigate to home through the link
    }
    // Alt+D to toggle details
    if (event.altKey && event.key === 'd' && (process.env.NODE_ENV === 'development' || import.meta.env.DEV)) {
      event.preventDefault();
      setShowDetails(prev => !prev);
    }
  };
  
  return (
    <div 
      className="p-6 max-w-lg mx-auto my-8 bg-background border rounded-lg shadow-sm"
      role="alert"
      aria-labelledby="error-title"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-5 w-5 mr-2" aria-hidden="true" />
        <AlertTitle id="error-title">Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          {error?.message || 'An unexpected error has occurred.'}
        </AlertDescription>
      </Alert>
      
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="default" 
            onClick={resetErrorBoundary}
            className="w-full"
            disabled={attemptingRecovery}
            aria-label="Try again"
            aria-describedby="try-again-desc"
            aria-busy={attemptingRecovery}
          >
            <RefreshCw 
              className={`mr-2 h-4 w-4 ${attemptingRecovery ? 'animate-spin' : ''}`} 
              aria-hidden="true" 
            />
            Try Again
            <span className="sr-only" id="try-again-desc">
              (Keyboard shortcut: Ctrl+R or Cmd+R)
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={attemptRecovery}
            className="w-full"
            disabled={attemptingRecovery}
            aria-label="Attempt recovery"
            aria-busy={attemptingRecovery}
          >
            <RotateCcw 
              className={`mr-2 h-4 w-4 ${attemptingRecovery ? 'animate-spin' : ''}`} 
              aria-hidden="true" 
            />
            Attempt Recovery
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          asChild
          className="w-full"
          aria-label="Return to homepage"
          aria-describedby="home-desc"
        >
          <Link href="/">
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Return to Homepage
            <span className="sr-only" id="home-desc">
              (Keyboard shortcut: Alt+H)
            </span>
          </Link>
        </Button>
        
        {(process.env.NODE_ENV === 'development' || import.meta.env.DEV) && error && (
          <div className="mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mb-2 flex items-center justify-between"
              aria-expanded={showDetails}
              aria-controls="error-details"
              aria-describedby="details-desc"
            >
              <span>Error Details (Development Only)</span>
              {showDetails ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              <span className="sr-only" id="details-desc">
                (Keyboard shortcut: Alt+D)
              </span>
            </Button>
            
            {showDetails && (
              <div className="mt-3 space-y-3" id="error-details">
                <div>
                  <p className="text-xs font-medium mb-1 text-muted-foreground">Error:</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                    {error.stack}
                  </pre>
                </div>
                
                {errorInfo && (
                  <div>
                    <p className="text-xs font-medium mb-1 text-muted-foreground">Component Stack:</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div aria-live="polite" className="sr-only">
          {attemptingRecovery 
            ? 'Attempting to recover from error. Please wait.' 
            : 'Error occurred. Try again or return to homepage.'}
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;

/**
 * A hook to easily create error boundaries for function components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<Props, 'children'> = {}
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return ComponentWithErrorBoundary;
}

/**
 * A hook to retry a failed operation with exponential backoff
 */
export function useErrorRetry<T>(
  operation: () => Promise<T>, 
  options: {
    maxRetries?: number;
    initialDelay?: number;
    onError?: (error: Error, retryCount: number) => void;
    retryCondition?: (error: Error) => boolean;
  } = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    onError,
    retryCondition = () => true,
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const execute = async (): Promise<T> => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    try {
      const result = await operation();
      setData(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      return handleError(err as Error, 0);
    }
  };
  
  const handleError = async (err: Error, currentRetryCount: number): Promise<T> => {
    if (currentRetryCount < maxRetries && retryCondition(err)) {
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, currentRetryCount);
      
      // Call onError callback if provided
      if (onError) {
        onError(err, currentRetryCount);
      }
      
      setRetryCount(currentRetryCount + 1);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      try {
        const result = await operation();
        setData(result);
        setIsLoading(false);
        return result;
      } catch (retryErr) {
        return handleError(retryErr as Error, currentRetryCount + 1);
      }
    } else {
      // Max retries reached or condition not met, set error state
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };
  
  return {
    execute,
    isLoading,
    error,
    data,
    retryCount,
    reset: () => {
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    }
  };
}