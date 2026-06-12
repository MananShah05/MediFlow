import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shimmer loading skeleton matching Design.md spec:
 * background: linear-gradient(90deg, bg-subtle 25%, bg-muted 50%, bg-subtle 75%)
 * animation: shimmer 1.5s infinite
 * border-radius: radius-sm (4px)
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "rounded-sm animate-shimmer",
      "bg-[length:200%_100%]",
      "bg-gradient-to-r from-bg-subtle via-bg-muted to-bg-subtle",
      className
    )}
    {...props}
  />
));

Skeleton.displayName = "Skeleton";

/* ── Preset skeleton shapes ── */

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-bg-elevated border border-border p-6 space-y-4",
        className
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

function SkeletonTableRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-20" : i === 1 ? "w-32" : "w-24"
          )}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow };
