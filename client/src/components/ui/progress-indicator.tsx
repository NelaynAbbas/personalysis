import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
  className?: string;
  variant?: "spinner" | "bar" | "dots";
  size?: "sm" | "md" | "lg";
  overlay?: boolean;
}

/**
 * Progress Indicator for async operations
 * Shows a loading spinner, progress bar, or dots animation
 */
export function ProgressIndicator({
  isLoading,
  loadingText = "Loading...",
  progress,
  className,
  variant = "spinner",
  size = "md",
  overlay = false,
}: ProgressIndicatorProps) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  // Wrapper component - either overlay or inline
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (overlay) {
      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-md shadow-lg flex flex-col items-center">
            {children}
          </div>
        </div>
      );
    }
    return <div className={cn("flex items-center", className)}>{children}</div>;
  };

  return (
    <Wrapper>
      {variant === "spinner" && (
        <>
          <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
          {loadingText && (
            <span className={cn("ml-2 text-sm font-medium", overlay && "mt-2")}>
              {loadingText}
            </span>
          )}
        </>
      )}

      {variant === "bar" && progress !== undefined && (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          {loadingText && (
            <div className="flex justify-between text-xs">
              <span>{loadingText}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      )}

      {variant === "dots" && (
        <div className="flex items-center">
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          {loadingText && <span className="ml-2 text-sm font-medium">{loadingText}</span>}
        </div>
      )}
    </Wrapper>
  );
}