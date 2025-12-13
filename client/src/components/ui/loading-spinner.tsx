import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** The size of the spinner: 'xs', 'sm', 'md', 'lg', or 'xl' */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  
  /** Custom CSS classes to apply */
  className?: string;
  
  /** Text to display below the spinner */
  text?: string;
  
  /** Whether the spinner is centered in its container */
  centered?: boolean;
  
  /** Whether the spinner takes up the full height of its container */
  fullHeight?: boolean;
  
  /** Color of the spinner (uses Tailwind text color classes) */
  color?: string;
}

/**
 * Loading spinner component for async operations
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  text,
  centered = false,
  fullHeight = false,
  color = "text-primary"
}) => {
  // Size mappings
  const sizeMap = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };
  
  // Text size mappings
  const textSizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };
  
  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    centered && "absolute inset-0 m-auto",
    fullHeight && "h-full min-h-[200px]",
    className
  );
  
  const spinnerClasses = cn(
    "animate-spin",
    sizeMap[size],
    color
  );

  return (
    <div className={containerClasses}>
      <Loader2 className={spinnerClasses} />
      {text && (
        <p className={cn("mt-2 text-gray-500", textSizeMap[size])}>
          {text}
        </p>
      )}
    </div>
  );
};

export { LoadingSpinner };