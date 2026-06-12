"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumbOverrides } from "@/lib/breadcrumb-context";

interface TopbarProps {
  /** Page title override. If not provided, derived from pathname. */
  title?: string;
  /** Custom actions slot (buttons, etc.) rendered on the right */
  actions?: React.ReactNode;
}

/** Check if a string looks like a UUID */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Generate breadcrumb segments from pathname */
function generateBreadcrumbs(
  pathname: string,
  overrides: Record<string, string>
): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  // Map portal prefixes to display names
  const portalNames: Record<string, string> = {
    p: "Patient",
    d: "Doctor",
    n: "Nurse",
    a: "Admin",
    sa: "Super Admin",
  };

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Check for context-provided override first (e.g. UUID -> patient name)
    if (overrides[segment]) {
      crumbs.push({ label: overrides[segment], href: currentPath });
    }
    // Check for known portal prefix
    else if (portalNames[segment]) {
      crumbs.push({ label: portalNames[segment], href: currentPath });
    }
    // Skip rendering raw UUIDs that have no override — they'll be blank noise
    else if (isUUID(segment)) {
      // Still add a crumb but with a short fallback like "Details"
      crumbs.push({ label: "Details", href: currentPath });
    }
    // Default: capitalize hyphenated segments
    else {
      const label = segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      crumbs.push({ label, href: currentPath });
    }
  }

  return crumbs;
}

/** Get page title from breadcrumbs */
function getPageTitle(
  pathname: string,
  overrides: Record<string, string>,
  titleOverride?: string
): string {
  if (titleOverride) return titleOverride;

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "Dashboard";

  // If the last segment is a UUID, use its override or a clean fallback
  if (isUUID(last)) {
    return overrides[last] || "Details";
  }

  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Topbar({ title, actions }: TopbarProps) {
  const pathname = usePathname();
  const { overrides } = useBreadcrumbOverrides();
  const breadcrumbs = generateBreadcrumbs(pathname, overrides);
  const pageTitle = getPageTitle(pathname, overrides, title);

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-bg-elevated border-b border-border shrink-0">
      <div className="flex flex-col justify-center">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-text-tertiary" aria-hidden="true" />
              )}
              <span
                className={cn(
                  "text-xs",
                  index === breadcrumbs.length - 1
                    ? "text-text-primary font-medium"
                    : "text-text-tertiary"
                )}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Page Title */}
        <h1 className="text-lg font-semibold text-text-primary leading-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Quick Actions */}
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
