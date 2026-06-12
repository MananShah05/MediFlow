"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * MediFLOW Toast provider — wraps Sonner with Design.md styling.
 *
 * Rules from Design.md:
 * - Enter: translateY(8px) → 0 + fade, 200ms ease-out
 * - Exit: 150ms
 * - Stack: up to 3 visible
 * - Critical toasts do not auto-dismiss
 */
function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      visibleToasts={3}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "toast-enter",
            "flex items-start gap-3 w-full",
            "rounded-lg p-4",
            "bg-bg-overlay border border-border",
            "shadow-lg",
            "text-sm text-text-primary font-ui",
          ].join(" "),
          title: "font-medium text-text-primary",
          description: "text-text-secondary text-sm mt-1",
          success: "!border-success/30 !bg-success-muted",
          error: "!border-critical/30 !bg-critical-muted",
          warning: "!border-warning/30 !bg-warning-muted",
          info: "!border-info/30 !bg-info-muted",
          closeButton: [
            "!bg-transparent !border-0 !text-text-tertiary",
            "hover:!text-text-primary",
          ].join(" "),
        },
      }}
    />
  );
}

/** Convenience wrappers for toast types */
const mediflowToast = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),

  error: (message: string, description?: string) =>
    toast.error(message, { description, duration: Infinity }),

  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),

  info: (message: string, description?: string) =>
    toast.info(message, { description }),

  /** Critical toasts never auto-dismiss per Design.md */
  critical: (message: string, description?: string) =>
    toast.error(message, {
      description,
      duration: Infinity,
    }),

  dismiss: (id?: string | number) => toast.dismiss(id),
};

export { ToastProvider, mediflowToast, toast };
