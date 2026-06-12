import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Static label displayed above the input (never floating) */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Numeric vital input mode — applies decimal keyboard and data font */
  vitalMode?: boolean;
  /** Helper text shown below the input (hidden when error is present) */
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, vitalMode = false, helperText, type, id, required, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-[6px]">
        {label && (
          <LabelPrimitive.Root
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
            {required && (
              <span className="ml-[2px] text-critical" aria-hidden="true">
                *
              </span>
            )}
          </LabelPrimitive.Root>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          inputMode={vitalMode ? "decimal" : undefined}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          className={cn(
            "flex h-10 w-full rounded-md px-3 py-2",
            "bg-bg-muted text-text-primary text-base",
            "border border-border",
            "placeholder:text-text-tertiary",
            "outline-none",
            "transition-colors duration-fast",
            "focus:border-clinical focus:ring-2 focus:ring-clinical/20",
            error && "border-critical focus:border-critical focus:ring-critical/20",
            vitalMode && "font-data text-2xl h-12 tabular-nums",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-sm text-critical-text"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-text-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
