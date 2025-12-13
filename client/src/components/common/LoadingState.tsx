import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/skeleton';

export interface LoadingStateProps {
  /**
   * The loading state variant to display
   * - spinner: Simple spinner with optional text
   * - skeleton: Skeleton UI for content loading
   * - card: Card with skeleton content for data loading
   * - table: Table with skeleton rows for data loading
   * - fullscreen: Full screen overlay with spinner
   */
  variant?: 'spinner' | 'skeleton' | 'card' | 'table' | 'fullscreen';
  
  /**
   * Text to display with the loading spinner
   */
  text?: string;
  
  /**
   * Number of skeleton items to render (for skeleton, card, table variants)
   */
  count?: number;
  
  /**
   * Custom classes to apply to the container
   */
  className?: string;
  
  /**
   * Additional props for the containing element
   */
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  
  /**
   * Whether loading state is animated (default: true)
   */
  animated?: boolean;
  
  /**
   * Additional information to display in the loading state
   */
  info?: string;
}

/**
 * A flexible loading state component with multiple variants for different use cases
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  text = 'Loading...',
  count = 3,
  className = '',
  containerProps = {},
  animated = true,
  info
}) => {
  // Helper to create array of items for repeating elements
  const items = Array.from({ length: count }).map((_, i) => i);
  
  // Spinner animation class
  const spinnerClass = animated ? 'animate-spin' : '';
  
  // Helper for screen reader announcement
  const ariaLive = variant === 'fullscreen' ? 'assertive' : 'polite';

  // Render appropriate loading variant
  switch (variant) {
    case 'spinner':
      return (
        <div 
          role="status" 
          aria-live={ariaLive}
          className={cn("flex flex-col items-center justify-center p-4", className)}
          {...containerProps}
        >
          <Loader2 className={cn("h-8 w-8 text-primary mr-2", spinnerClass)} />
          {text && (
            <span className="mt-2 text-sm text-muted-foreground">{text}</span>
          )}
          {info && (
            <span className="mt-1 text-xs text-muted-foreground">{info}</span>
          )}
          <span className="sr-only">Loading content, please wait</span>
        </div>
      );
      
    case 'skeleton':
      return (
        <div 
          role="status" 
          aria-live={ariaLive}
          className={cn("space-y-4", className)}
          {...containerProps}
        >
          {items.map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
          {text && (
            <span className="text-sm text-muted-foreground block text-center mt-4">{text}</span>
          )}
          <span className="sr-only">Loading content, please wait</span>
        </div>
      );
      
    case 'card':
      return (
        <div 
          role="status" 
          aria-live={ariaLive}
          className={cn("space-y-6", className)}
          {...containerProps}
        >
          {items.map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
          {text && (
            <span className="text-sm text-muted-foreground block text-center">{text}</span>
          )}
          <span className="sr-only">Loading content, please wait</span>
        </div>
      );
      
    case 'table':
      return (
        <div 
          role="status" 
          aria-live={ariaLive}
          className={cn("overflow-hidden", className)}
          {...containerProps}
        >
          <div className="border rounded-lg">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/50">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            {/* Table rows */}
            {items.map((i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
          
          {text && (
            <span className="text-sm text-muted-foreground block text-center mt-4">{text}</span>
          )}
          <span className="sr-only">Loading table data, please wait</span>
        </div>
      );
      
    case 'fullscreen':
      return (
        <div 
          role="status" 
          aria-live={ariaLive}
          className={cn(
            "fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50",
            className
          )}
          {...containerProps}
        >
          <Loader2 className={cn("h-12 w-12 text-primary", spinnerClass)} />
          {text && (
            <h2 className="mt-4 text-xl font-medium">{text}</h2>
          )}
          {info && (
            <p className="mt-2 text-sm text-muted-foreground">{info}</p>
          )}
          <span className="sr-only">Loading application, please wait</span>
        </div>
      );
  }
};

export default LoadingState;