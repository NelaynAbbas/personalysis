import React, { Suspense as ReactSuspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface SuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Default loading spinner component
export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center w-full h-32">
    <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
  </div>
);

// Suspense component with default loading spinner
export const Suspense: React.FC<SuspenseProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <ReactSuspense fallback={fallback}>
      {children}
    </ReactSuspense>
  );
};

// Function to lazily load components
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ReactNode = <LoadingSpinner />
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <ReactSuspense fallback={LoadingComponent}>
      <LazyComponent {...props} />
    </ReactSuspense>
  );
}

// Higher order component to lazy load with specific suspense boundary
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <LoadingSpinner />
) {
  return (props: P) => (
    <ReactSuspense fallback={fallback}>
      <Component {...props} />
    </ReactSuspense>
  );
}

export default Suspense;