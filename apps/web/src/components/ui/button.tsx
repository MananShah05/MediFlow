import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-ui font-medium",
    "rounded-md",
    "outline-none",
    "transition-colors duration-fast",
    "focus-visible:ring-2 focus-visible:ring-clinical focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.97] active:transition-transform active:duration-fast",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-clinical text-text-inverse",
          "hover:bg-clinical-hover",
        ],
        secondary: [
          "bg-bg-subtle text-text-primary",
          "border border-border",
          "hover:bg-bg-overlay",
        ],
        destructive: [
          "bg-critical text-white",
          "hover:bg-[#DC2626]",
        ],
        ghost: [
          "bg-transparent text-text-secondary",
          "hover:bg-bg-subtle hover:text-text-primary",
        ],
        link: [
          "bg-transparent text-clinical underline-offset-4",
          "hover:underline hover:text-clinical-hover",
          "p-0 h-auto",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (e.g., for Next.js Link) */
  asChild?: boolean;
  /** Show loading spinner and preserve width */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading</span>
            {/* Invisible children to preserve width */}
            <span className="invisible">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
