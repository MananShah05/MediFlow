import { create } from "zustand";
import { API_BASE_URL, type UserRole } from "./constants";

/** User object stored in auth state */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
}

/** Auth store state shape */
interface AuthState {
  /** Access token stored IN MEMORY ONLY (R-ACCESS-006). Never persisted to localStorage. */
  accessToken: string | null;
  /** Currently authenticated user */
  user: AuthUser | null;
  /** Whether auth state has been initialized (attempted token refresh) */
  initialized: boolean;
  /** Whether a token refresh is in progress */
  isRefreshing: boolean;

  /** Computed: whether user is authenticated */
  isAuthenticated: () => boolean;

  /** Set user and token after successful authentication */
  setAuth: (user: AuthUser, accessToken: string) => void;

  /** Log in with email and password */
  login: (email: string, password: string) => Promise<void>;

  /** Self-register a patient account */
  registerPatient: (body: RegisterPatientBody) => Promise<void>;

  /** Log out — clear in-memory state and call server to invalidate refresh cookie */
  logout: () => Promise<void>;

  /** Attempt to refresh the access token using the HttpOnly refresh cookie */
  refreshToken: () => Promise<boolean>;

  /** Initialize auth state on app load */
  initialize: () => Promise<void>;

  /** Clear auth state */
  clearAuth: () => void;
}

export interface RegisterPatientBody {
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  email: string;
  password: string;
  confirmPassword: string;
  mobileNumber?: string;
  bloodGroup?:
    | "A_positive"
    | "A_negative"
    | "B_positive"
    | "B_negative"
    | "AB_positive"
    | "AB_negative"
    | "O_positive"
    | "O_negative";
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  tenantSlug?: string;
}

let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  initialized: false,
  isRefreshing: false,

  isAuthenticated: () => {
    const state = get();
    return state.accessToken !== null && state.user !== null;
  },

  setAuth: (user, accessToken) => {
    set({ user, accessToken, initialized: true });
  },

  clearAuth: () => {
    set({ accessToken: null, user: null, initialized: true });
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // sends/receives HttpOnly cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ?? "Invalid email or password. Please try again."
      );
    }

    const data = await response.json();
    set({
      accessToken: data.accessToken,
      initialized: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        tenantId: data.user.tenantId,
      },
    });
  },

  registerPatient: async (body: RegisterPatientBody) => {
    const response = await fetch(`${API_BASE_URL}/auth/register-patient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ??
          error.error?.message ??
          "Unable to register patient. Please check the details and try again."
      );
    }

    const data = await response.json();
    set({
      accessToken: data.accessToken,
      initialized: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        tenantId: data.user.tenantId,
      },
    });
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${get().accessToken}`,
        },
      });
    } catch {
      // Best-effort logout — clear local state regardless
    }
    set({ accessToken: null, user: null, initialized: true });
  },

  refreshToken: async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      set({ isRefreshing: true });

      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include", // refresh token is in HttpOnly cookie
        });

        if (!response.ok) {
          get().clearAuth();
          return false;
        }

        const data = await response.json();
        set({
          accessToken: data.accessToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            tenantId: data.user.tenantId,
          },
        });
        return true;
      } catch {
        get().clearAuth();
        return false;
      } finally {
        set({ isRefreshing: false });
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  initialize: async () => {
    if (get().initialized) return;

    const success = await get().refreshToken();
    set({ initialized: true });
    if (!success) {
      get().clearAuth();
    }
  },
}));
