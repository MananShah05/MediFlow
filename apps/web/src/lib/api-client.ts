import { useAuthStore } from "./auth";
import { API_BASE_URL } from "./constants";

/** Typed error response from the API */
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  requestId?: string;
  details?: Record<string, string[]>;
}

/** Custom error class for API errors */
export class ApiRequestError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.requestId = error.requestId;
    this.details = error.details;
  }
}

/** Request configuration */
interface RequestConfig extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip automatic auth header attachment */
  skipAuth?: boolean;
  /** Skip automatic 401 retry with refresh */
  skipRetry?: boolean;
}

/**
 * Extract the tenant slug from the current hostname.
 * Pattern: {tenant}.mediflow.app → tenant slug
 * Falls back to null for localhost / single-tenant dev.
 */
function getTenantFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;

  // Dev environment: localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  // Production: {tenant}.mediflow.app
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Build headers with auth token and tenant context.
 */
function buildHeaders(
  config: RequestConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers as Record<string, string>),
  };

  // Attach Bearer token from in-memory store
  if (!config.skipAuth) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  // Attach tenant context from subdomain
  const tenant = getTenantFromHostname();
  if (tenant) {
    headers["X-Tenant-ID"] = tenant;
  }

  return headers;
}

/**
 * Core fetch wrapper with typed responses, auto-auth, and 401 refresh retry.
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { body, skipAuth, skipRetry, ...fetchConfig } = config;
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const headers = buildHeaders(config);

  const response = await fetch(url, {
    ...fetchConfig,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — attempt token refresh and retry once
  if (response.status === 401 && !skipRetry && !skipAuth) {
    const { refreshToken } = useAuthStore.getState();
    const refreshed = await refreshToken();

    if (refreshed) {
      // Retry with new token
      const retryHeaders = buildHeaders({ ...config, skipRetry: true });
      const retryResponse = await fetch(url, {
        ...fetchConfig,
        headers: retryHeaders,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      if (retryResponse.ok) {
        if (retryResponse.status === 204) return undefined as T;
        return retryResponse.json();
      }

      // Retry also failed — parse error
      const retryError = await retryResponse.json().catch(() => ({
        message: "Authentication failed",
        code: "AUTH_FAILED",
        statusCode: 401,
      }));
      throw new ApiRequestError({
        message: retryError.message ?? "Authentication failed",
        code: retryError.code ?? "AUTH_FAILED",
        statusCode: retryResponse.status,
        requestId: retryError.requestId,
        details: retryError.details,
      });
    }

    // Refresh failed — redirect to login
    if (typeof window !== "undefined") {
      const loginUrl = new URL("/login", window.location.origin);
      if (window.location.pathname !== "/login") {
        loginUrl.searchParams.set("redirect", window.location.pathname);
      }
      window.location.replace(`${loginUrl.pathname}${loginUrl.search}`);
    }
    throw new ApiRequestError({
      message: "Session expired. Please log in again.",
      code: "SESSION_EXPIRED",
      statusCode: 401,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      statusCode: response.status,
    }));

    throw new ApiRequestError({
      message: error.message ?? "An unexpected error occurred",
      code: error.code ?? "UNKNOWN_ERROR",
      statusCode: response.status,
      requestId: error.requestId,
      details: error.details,
    });
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

/** Typed API client with convenience methods */
export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "PATCH", body }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "DELETE" }),
};
