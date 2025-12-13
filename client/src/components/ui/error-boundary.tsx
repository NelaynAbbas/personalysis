import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });

    // Log the error to an error reporting service
    console.error("UI Error Boundary caught an error:", error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-800">Something went wrong</h3>
          <p className="mb-4 text-sm text-red-600">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button 
            onClick={this.resetErrorBoundary}
            variant="outline" 
            className="border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-left">
              <p className="mb-2 text-sm font-medium text-red-800">Error Details (Development Only)</p>
              <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-xs text-red-800">
                {this.state.error.stack || this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-white p-2 text-xs text-red-800">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}