import React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "info" | "warning";
  open?: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number; // in milliseconds
  className?: string;
  children?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = "default",
  open = true,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  className,
  children,
}) => {
  React.useEffect(() => {
    if (open && autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, autoCloseDelay, onClose]);

  if (!open) return null;

  const variantStyles = {
    default: "bg-white border-gray-200",
    success: "bg-green-50 border-green-200",
    destructive: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const titleColors = {
    default: "text-gray-900",
    success: "text-green-800",
    destructive: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  };

  const descriptionColors = {
    default: "text-gray-600",
    success: "text-green-700",
    destructive: "text-red-700",
    info: "text-blue-700",
    warning: "text-yellow-700",
  };

  const icons = {
    default: null,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    destructive: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md rounded-lg border shadow-lg",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex flex-1 items-start p-4">
        {icons[variant] && (
          <div className="flex-shrink-0 pt-0.5">{icons[variant]}</div>
        )}
        
        <div className={cn("ml-3 flex-1", !icons[variant] && "ml-0")}>
          {title && (
            <h3 className={cn("text-sm font-medium", titleColors[variant])}>
              {title}
            </h3>
          )}
          {description && (
            <div className={cn("mt-1 text-sm", descriptionColors[variant])}>
              {description}
            </div>
          )}
          {children}
        </div>
      </div>
      
      {onClose && (
        <div className="flex border-l border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center justify-center px-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Required components for Shadcn compatibility
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-medium">{children}</div>
);

export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-1 text-sm text-gray-500">{children}</div>
);

export const ToastClose: React.FC = () => (
  <button 
    className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
    aria-label="Close"
  >
    <X className="h-4 w-4" />
  </button>
);

export const ToastViewport: React.FC = () => (
  <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></div>
);

// ToastContainer to manage multiple toasts
export const ToastContainer: React.FC<{
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}> = ({ 
  children, 
  position = "bottom-right" 
}) => {
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-center": "top-0 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-0 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col p-4 gap-4 sm:gap-2 items-end max-h-screen overflow-hidden",
        positionClasses[position]
      )}
    >
      {children}
    </div>
  );
};

// Toast context for application-wide toast management
type ToastType = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "info" | "warning";
  duration?: number;
  action?: React.ReactNode;
};

type ToastContextType = {
  toasts: ToastType[];
  toast: (props: Omit<ToastType, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default", duration = 5000, action }: Omit<ToastType, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant, duration, action }]);
      
      if (duration !== Infinity) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      
      return id;
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant}
            onClose={() => dismiss(t.id)}
            autoClose={t.duration !== Infinity}
            autoCloseDelay={t.duration}
          >
            {t.action}
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};