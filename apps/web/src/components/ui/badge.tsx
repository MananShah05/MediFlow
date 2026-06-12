import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center",
    "rounded-full",
    "px-2 py-[2px]",
    "text-xs font-semibold uppercase tracking-[0.05em]",
    "select-none",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        success: "bg-success-muted text-success-text",
        warning: "bg-warning-muted text-warning-text",
        critical: "bg-critical-muted text-critical-text",
        info: "bg-info-muted text-info-text",
        neutral: "bg-bg-subtle text-text-secondary",
        pending: "bg-bg-subtle text-text-tertiary border border-border",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** If true, shows a 3-second critical pulse animation on mount (for critical vitals) */
  criticalPulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, criticalPulse = false, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant }),
          criticalPulse && variant === "critical" && "animate-critical-pulse",
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
