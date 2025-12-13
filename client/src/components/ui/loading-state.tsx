import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAccessibilityPreferences } from '@/hooks/use-accessibility';

/**
 * Define the loading state variants using CVA (class-variance-authority)
 * This allows us to create a reusable component with different styles based on props
 */
const loadingStateVariants = cva(
  "flex items-center justify-center p-4 transition-all",
  {
    variants: {
      size: {
        xs: "h-6",
        sm: "h-10",
        md: "h-16",
        lg: "h-24",
        xl: "h-32",
        full: "h-full min-h-[150px]",
        screen: "min-h-[50vh]",
      },
      variant: {
        default: "text-primary",
        subtle: "text-gray-400",
        inverted: "text-white",
        ghost: "text-gray-300 bg-gray-50 bg-opacity-50 backdrop-blur-sm",
      },
      align: {
        center: "text-center",
        left: "text-left justify-start",
        right: "text-right justify-end",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      align: "center",
    },
  }
);

export interface LoadingStateProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof loadingStateVariants> {
  /**
   * Text to display alongside the loading spinner
   */
  text?: string;
  
  /**
   * Render a custom spinner component instead of the default
   */
  spinnerComponent?: React.ReactNode;
  
  /**
   * Unique identifier for the loading state
   */
  id?: string;
}

/**
 * Loading state component that shows a spinner with optional text
 * Adapts to reduced motion preferences for accessibility
 */
export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, size, variant, align, text, id, spinnerComponent, ...props }, ref) => {
    const { prefersReducedMotion } = useAccessibilityPreferences();
    
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        id={id}
        className={cn(loadingStateVariants({ size, variant, align }), className)}
        {...props}
      >
        {spinnerComponent || (
          <div className="relative flex items-center justify-center">
            <div 
              className={cn(
                "h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent",
                prefersReducedMotion && "animate-none opacity-70"
              )}
              aria-hidden="true"
            />
          </div>
        )}
        {text && (
          <span className="ml-3 text-sm" aria-live="polite">
            {text}
          </span>
        )}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";

/**
 * Skeleton component for loading state that shows content placeholders
 */
export const SkeletonLoader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      role="status"
      aria-label="Loading content"
      {...props}
    />
  );
};

SkeletonLoader.displayName = "SkeletonLoader";

export default LoadingState;