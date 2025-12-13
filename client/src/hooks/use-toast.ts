import React, { useState, useCallback, useContext, createContext, ReactNode } from "react";

type ToastVariant = "default" | "success" | "destructive" | "info" | "warning";

interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ReactNode;
}

type ToastContextType = {
  toasts: ToastProps[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Initialize with an empty array of toasts
const DEFAULT_TOAST_CONTEXT: ToastContextType = {
  toasts: [],
  toast: () => {},
  dismiss: () => {},
};

/**
 * Toast provider component that manages toast state
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  const dismiss = useCallback((id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((props: ToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9);
    const duration = props.duration || 5000;
    
    setToasts((toasts) => [...toasts, { ...props, id }]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, [dismiss]);

  const value = {
    toasts,
    toast,
    dismiss,
  };

  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

/**
 * Hook to access toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  // Return a default context if not within provider to prevent errors
  if (!context) {
    console.warn('useToast was used outside of ToastProvider');
    return DEFAULT_TOAST_CONTEXT;
  }
  
  return context;
}

// Export a direct toast function for compatibility with existing code
export const toast = (props: ToastProps) => {
  // Create and show a DOM toast for immediate use (fallback)
  console.log("Direct toast called:", props);
  const message = document.createElement("div");
  message.className = `fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg ${getBackgroundClass(props.variant)}`;
  message.innerHTML = `
    <div class="flex">
      <div class="flex-1">
        ${props.title ? `<h3 class="font-medium">${props.title}</h3>` : ""}
        ${props.description ? `<p class="text-sm mt-1">${props.description}</p>` : ""}
      </div>
      <button class="ml-4 text-gray-400 hover:text-gray-500">×</button>
    </div>
  `;
  
  document.body.appendChild(message);
  
  const closeButton = message.querySelector("button");
  closeButton?.addEventListener("click", () => {
    document.body.removeChild(message);
  });
  
  if (props.duration !== Infinity) {
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, props.duration || 5000);
  }
};

function getBackgroundClass(variant?: ToastVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-50 text-green-800 border border-green-200";
    case "destructive":
      return "bg-red-50 text-red-800 border border-red-200";
    case "info":
      return "bg-blue-50 text-blue-800 border border-blue-200";
    case "warning":
      return "bg-yellow-50 text-yellow-800 border border-yellow-200";
    default:
      return "bg-white text-gray-800 border border-gray-200";
  }
}