"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { PUBLIC_ROUTES, ROLE_PORTAL_MAP } from "@/lib/constants";
import { BreadcrumbProvider } from "@/lib/breadcrumb-context";

function AuthInitializer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    if (!initialized) {
      void initialize();
    }
  }, [initialize, initialized]);

  useEffect(() => {
    if (!initialized) return;

    const isAuthenticated = Boolean(user && accessToken);

    if (!isAuthenticated && !isPublicRoute) {
      const loginUrl = new URL("/login", window.location.origin);
      if (pathname !== "/") {
        loginUrl.searchParams.set("redirect", pathname);
      }
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    if (isAuthenticated && isPublicRoute && user) {
      router.replace(ROLE_PORTAL_MAP[user.role]);
    }
  }, [accessToken, initialized, isPublicRoute, pathname, router, user]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinical border-t-transparent" />
          <span className="text-sm text-text-secondary">Loading MediFLOW…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BreadcrumbProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </BreadcrumbProvider>
    </QueryClientProvider>
  );
}
