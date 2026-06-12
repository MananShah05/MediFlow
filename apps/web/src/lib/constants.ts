/** Application-wide constants */

export const APP_NAME = "MediFLOW" as const;
export const APP_TAGLINE = "Intelligent Hospital Management" as const;
export const APP_DESCRIPTION =
  "A multi-tenant hospital management system built for clinical safety, speed, and compliance." as const;

/** Authentication */
export const AUTH_COOKIE_NAME = "careos_refresh" as const;
export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/** API */
const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001/api/v1";

export const API_BASE_URL = rawApiBaseUrl.endsWith("/api/v1")
  ? rawApiBaseUrl
  : `${rawApiBaseUrl.replace(/\/$/, "")}/api/v1`;

/** User Roles */
export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  NURSE: "nurse",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Role to portal path mapping */
export const ROLE_PORTAL_MAP: Record<UserRole, string> = {
  [ROLES.PATIENT]: "/p/dashboard",
  [ROLES.DOCTOR]: "/d/dashboard",
  [ROLES.NURSE]: "/n/dashboard",
  [ROLES.ADMIN]: "/a/dashboard",
  [ROLES.SUPER_ADMIN]: "/sa/dashboard",
} as const;

/** Role to prefix mapping (for path matching) */
export const ROLE_PREFIX_MAP: Record<UserRole, string> = {
  [ROLES.PATIENT]: "/p",
  [ROLES.DOCTOR]: "/d",
  [ROLES.NURSE]: "/n",
  [ROLES.ADMIN]: "/a",
  [ROLES.SUPER_ADMIN]: "/sa",
} as const;

/** Role display names */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [ROLES.PATIENT]: "Patient",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.NURSE]: "Nurse",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.SUPER_ADMIN]: "Super Admin",
} as const;

/** Public (unauthenticated) routes */
export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
] as const;

/** Sidebar navigation items per role */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  [ROLES.PATIENT]: [
    { label: "Dashboard", href: "/p/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/p/appointments", icon: "Calendar" },
    { label: "My Records", href: "/p/records", icon: "FileText" },
    { label: "Billing", href: "/p/billing", icon: "CreditCard" },
    { label: "Consent", href: "/p/consent", icon: "Shield" },
    { label: "Settings", href: "/p/settings", icon: "Settings" },
  ],
  [ROLES.DOCTOR]: [
    { label: "Dashboard", href: "/d/dashboard", icon: "LayoutDashboard" },
    { label: "Schedule", href: "/d/schedule", icon: "Calendar" },
    { label: "My Patients", href: "/d/patients", icon: "Users" },
    { label: "Encounters", href: "/d/encounters", icon: "Stethoscope" },
    { label: "Prescriptions", href: "/d/prescriptions", icon: "Pill" },
    { label: "Lab Orders", href: "/d/lab-orders", icon: "FlaskConical" },
    { label: "Settings", href: "/d/settings", icon: "Settings" },
  ],
  [ROLES.NURSE]: [
    { label: "Dashboard", href: "/n/dashboard", icon: "LayoutDashboard" },
    { label: "My Ward", href: "/n/ward", icon: "BedDouble" },
    { label: "Task Queue", href: "/n/tasks", icon: "ListTodo" },
    { label: "Handoff", href: "/n/handoff", icon: "ArrowRightLeft" },
    { label: "Settings", href: "/n/settings", icon: "Settings" },
  ],
  [ROLES.ADMIN]: [
    { label: "Dashboard", href: "/a/dashboard", icon: "LayoutDashboard" },
    { label: "Beds & Wards", href: "/a/beds", icon: "BedDouble" },
    { label: "Patients", href: "/a/patients", icon: "Users" },
    { label: "Appointments", href: "/a/appointments", icon: "Calendar" },
    { label: "Staff", href: "/a/staff", icon: "UserCog" },
    { label: "Billing", href: "/a/billing", icon: "CreditCard" },
    { label: "Reports", href: "/a/reports", icon: "BarChart3" },
    { label: "Audit", href: "/a/audit", icon: "ScrollText" },
    { label: "Settings", href: "/a/settings", icon: "Settings" },
  ],
  [ROLES.SUPER_ADMIN]: [
    { label: "Dashboard", href: "/sa/dashboard", icon: "LayoutDashboard" },
    { label: "Tenants", href: "/sa/tenants", icon: "Building2" },
    { label: "Platform Health", href: "/sa/health", icon: "Activity" },
    { label: "Audit", href: "/sa/audit", icon: "ScrollText" },
    { label: "Incidents", href: "/sa/incidents", icon: "AlertTriangle" },
    { label: "Settings", href: "/sa/settings", icon: "Settings" },
  ],
} as const;

/** Role accent color CSS variable keys */
export const ROLE_ACCENT_COLORS: Record<UserRole, string> = {
  [ROLES.PATIENT]: "var(--color-role-patient)",
  [ROLES.DOCTOR]: "var(--color-role-doctor)",
  [ROLES.NURSE]: "var(--color-role-nurse)",
  [ROLES.ADMIN]: "var(--color-role-admin)",
  [ROLES.SUPER_ADMIN]: "var(--color-role-superadmin)",
} as const;
