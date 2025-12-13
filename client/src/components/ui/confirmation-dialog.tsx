import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, HelpCircle, Info, AlertOctagon } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "destructive";
  children?: React.ReactNode;
  showIcon?: boolean;
  loading?: boolean;
  loadingText?: string;
}

/**
 * Confirmation Dialog for critical actions
 * Provides an accessible dialog with confirm/cancel options
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  children,
  showIcon = true,
  loading = false,
  loadingText = "Processing...",
}: ConfirmationDialogProps) {
  // Use different icons and colors based on the variant
  const getIconAndColors = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertOctagon />,
          buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
          iconClass: "text-destructive",
        };
      case "warning":
        return {
          icon: <AlertTriangle />,
          buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground",
          iconClass: "text-warning",
        };
      case "destructive":
        return {
          icon: <AlertOctagon />,
          buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
          iconClass: "text-destructive",
        };
      case "info":
      default:
        return {
          icon: <Info />,
          buttonClass: "bg-primary hover:bg-primary/90",
          iconClass: "text-primary",
        };
    }
  };

  const { icon, buttonClass, iconClass } = getIconAndColors();

  // Handle the confirm action
  const handleConfirm = () => {
    onConfirm();
  };

  // Handle the cancel action
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onEscapeKeyDown={handleCancel}
        onPointerDownOutside={handleCancel}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            {showIcon && <div className={cn("h-6 w-6", iconClass)}>{icon}</div>}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="sm:mr-2"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={cn(buttonClass)}
            disabled={loading}
          >
            {loading ? loadingText : confirmText}
            {loading && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}