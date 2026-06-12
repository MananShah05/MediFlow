"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

interface BreadcrumbOverrides {
  /** Map of URL segment (e.g. a UUID) -> display label (e.g. "Rahul Sharma") */
  overrides: Record<string, string>;
  /** Set a display label for a specific URL segment */
  setOverride: (segment: string, label: string) => void;
  /** Clear all overrides */
  clearOverrides: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbOverrides>({
  overrides: {},
  setOverride: () => {},
  clearOverrides: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const setOverride = useCallback((segment: string, label: string) => {
    setOverrides((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  const clearOverrides = useCallback(() => {
    setOverrides({});
  }, []);

  const value = useMemo(
    () => ({ overrides, setOverride, clearOverrides }),
    [overrides, setOverride, clearOverrides]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Hook to set a breadcrumb label for a specific URL segment (typically a UUID).
 * Call this in page components to replace ugly UUIDs with human-readable names.
 */
export function useBreadcrumbOverride(segment: string | undefined, label: string | undefined) {
  const { setOverride } = useContext(BreadcrumbContext);

  React.useEffect(() => {
    if (segment && label) {
      setOverride(segment, label);
    }
  }, [segment, label, setOverride]);
}

/** Hook to read the current breadcrumb overrides (used by Topbar) */
export function useBreadcrumbOverrides() {
  return useContext(BreadcrumbContext);
}
