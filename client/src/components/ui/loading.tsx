import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  label
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          sizeClasses[size]
        )}
      />
      {label && <p className="mt-3 text-sm text-gray-600">{label}</p>}
    </div>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  className,
  title = "Loading...",
  subtitle
}) => {
  return (
    <div className={cn("rounded-lg bg-white shadow p-6", className)}>
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <LoadingSpinner className="mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export const LoadingRow: React.FC<{ columns?: number; height?: string }> = ({ 
  columns = 3,
  height = "h-10" 
}) => {
  return (
    <div className="animate-pulse flex space-x-4">
      {Array(columns)
        .fill(0)
        .map((_, i) => (
          <div key={i} className={`flex-1 ${height} bg-gray-200 rounded`}></div>
        ))}
    </div>
  );
};