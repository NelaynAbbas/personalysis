import React from 'react';
import { AlertCircle, XCircle, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { cn } from '../../lib/utils';
import logger from '../../lib/logger';

export interface ErrorAlertProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Original error object or error details (optional)
   */
  error?: Error | unknown;
  
  /**
   * Title of the error (default: "Error")
   */
  title?: string;
  
  /**
   * Callback to retry the operation that caused the error
   */
  onRetry?: () => void;
  
  /**
   * Callback to dismiss the error
   */
  onDismiss?: () => void;
  
  /**
   * Custom classes to apply to the container
   */
  className?: string;
  
  /**
   * If true, show detailed error information (useful for debugging)
   */
  showDetails?: boolean;
  
  /**
   * Error code or identifier if available
   */
  errorCode?: string;
  
  /**
   * Type of error for styling variations
   */
  variant?: 'default' | 'server' | 'network' | 'validation' | 'auth';
  
  /**
   * Additional instructions or help text for the user
   */
  helpText?: string;
}

/**
 * Enhanced error alert component with support for retries, error details, and more
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  error,
  title = "Error",
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  errorCode,
  variant = 'default',
  helpText
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);
  
  // Log the error when component mounts
  React.useEffect(() => {
    logger.error(`UI Error displayed: ${message}`, { 
      error, 
      errorCode, 
      variant 
    }, 'ErrorAlert');
  }, [message, error, errorCode, variant]);
  
  // Helper to format error details
  const getErrorDetails = (): string => {
    if (!error) return 'No error details available';
    
    if (error instanceof Error) {
      return error.stack || error.toString();
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    try {
      return JSON.stringify(error, null, 2);
    } catch (e) {
      return 'Error details not available in string format';
    }
  };
  
  // Choose icon based on error variant
  const getIcon = () => {
    switch (variant) {
      case 'server':
        return <AlertCircle className="h-5 w-5" />;
      case 'network':
        return <XCircle className="h-5 w-5" />;
      case 'validation':
        return <Info className="h-5 w-5" />;
      case 'auth':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  return (
    <Alert 
      variant="destructive" 
      className={cn("relative", className)}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-2 flex-1">
          <AlertTitle className="mb-1 flex items-center gap-2">
            {title}
            {errorCode && (
              <span className="text-xs bg-destructive/20 px-2 py-0.5 rounded-full">
                {errorCode}
              </span>
            )}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {message}
            
            {helpText && (
              <p className="text-sm mt-2 text-destructive-foreground/90">{helpText}</p>
            )}
            
            {(onRetry || onDismiss || error) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {onRetry && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onRetry}
                    className="border-destructive/30 hover:bg-destructive/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
                
                {onDismiss && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onDismiss}
                    className="border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                )}
              </div>
            )}
            
            {error && (
              <Accordion 
                type="single" 
                collapsible 
                className="mt-4"
                value={showErrorDetails ? 'details' : undefined}
                onValueChange={(value) => setShowErrorDetails(value === 'details')}
              >
                <AccordionItem value="details" className="border-destructive/20">
                  <AccordionTrigger className="text-sm py-2">
                    Show technical details
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs whitespace-pre-wrap break-all bg-destructive/5 p-3 rounded-md overflow-x-auto max-h-[200px]">
                      {getErrorDetails()}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default ErrorAlert;