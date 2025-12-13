import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Link } from 'wouter';
import logger from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  FallbackComponent?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
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
 * Enhanced Error Boundary component with production-ready features:
 * - Detailed error logging
 * - Automatic recovery attempts
 * - User-friendly fallback UI
 * - Keyboard shortcuts
 * - Accessibility improvements
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    attemptingRecovery: false
  };
  
  // Reset keys to track for automatic recovery
  private prevResetKeys: any[] = [];

  // Use static method to catch errors
  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      attemptingRecovery: false 
    };
  }

  // Log error details when caught
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to our centralized logger
    logger.error(`Error caught by ErrorBoundary: ${error.message}`, {
      error,
      componentStack: errorInfo.componentStack,
      stack: error.stack,
      name: error.name,
      message: error.message
    }, 'ErrorBoundary');
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call optional onError prop for parent handling
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset error state and re-render children
  resetErrorBoundary = (): void => {
    logger.info('Resetting error boundary', undefined, 'ErrorBoundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false
    });
  };

  // Attempt recovery with a grace period
  attemptRecovery = (): void => {
    logger.info('Attempting error boundary recovery', undefined, 'ErrorBoundary');
    this.setState({ attemptingRecovery: true });
    
    // Add short delay to allow system to stabilize
    setTimeout(() => {
      this.resetErrorBoundary();
    }, 1500);
  };

  // Check if reset keys have changed to auto-reset
  componentDidUpdate(prevProps: Props): void {
    const { resetKeys } = this.props;
    
    // Skip if there's no error or no reset keys
    if (!this.state.hasError || !resetKeys) {
      // Store current reset keys for future comparison
      if (resetKeys) {
        this.prevResetKeys = resetKeys;
      }
      return;
    }
    
    // Check if any reset keys changed
    const shouldReset = resetKeys?.some(
      (key, index) => key !== this.prevResetKeys[index]
    );
    
    // If keys changed, reset the error boundary
    if (shouldReset) {
      logger.info('Reset key changed, automatically resetting error boundary', undefined, 'ErrorBoundary');
      this.resetErrorBoundary();
    }
    
    // Update previous reset keys
    if (resetKeys) {
      this.prevResetKeys = resetKeys;
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
 * Default fallback component for production-ready error display
 */
const DefaultErrorFallback: React.FC<FallbackProps> = ({ 
  error, 
  errorInfo, 
  resetErrorBoundary,
  attemptRecovery,
  attemptingRecovery
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
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
    if (event.altKey && event.key === 'd') {
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
            disabled={attemptingRecovery}
            className="flex items-center justify-center" 
            aria-describedby="try-again-desc"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>
              Try Again
              <span className="sr-only" id="try-again-desc">
                (Keyboard shortcut: Ctrl+R or Cmd+R)
              </span>
            </span>
          </Button>
          
          <Button 
            variant="outline"
            asChild
            className="flex items-center justify-center"
            aria-describedby="go-home-desc"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>
                Return Home
                <span className="sr-only" id="go-home-desc">
                  (Keyboard shortcut: Alt+H)
                </span>
              </span>
            </Link>
          </Button>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="ghost" 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mb-2 flex items-center justify-between"
            aria-expanded={showDetails}
            aria-controls="error-details"
            aria-describedby="details-desc"
          >
            <span>Error Details</span>
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
                  {error?.stack || error?.toString() || 'No stack trace available'}
                </pre>
              </div>
              
              {errorInfo && (
                <div>
                  <p className="text-xs font-medium mb-1 text-muted-foreground">Component Stack:</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                    {errorInfo.componentStack || 'No component stack available'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        
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