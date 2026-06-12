/**
 * Platform Permission Matrix — all permission codes from Rules.md.
 *
 * Permission format: resource:action[:scope]
 * Scope can be: self, own, assigned, ward, tenant, platform
 */

// -----------------------------------------------------------------------------
// Patient permissions
// -----------------------------------------------------------------------------
export const PATIENT_READ_SELF = "patient:read:self" as const;
export const PATIENT_READ_ASSIGNED = "patient:read:assigned" as const;
export const PATIENT_READ_TENANT = "patient:read:tenant" as const;
export const PATIENT_WRITE_SELF = "patient:write:self" as const;

// -----------------------------------------------------------------------------
// Encounter permissions
// -----------------------------------------------------------------------------
export const ENCOUNTER_READ_ASSIGNED = "encounter:read:assigned" as const;
export const ENCOUNTER_WRITE = "encounter:write" as const;
export const ENCOUNTER_FINALIZE = "encounter:finalize" as const;

// -----------------------------------------------------------------------------
// Prescription permissions
// -----------------------------------------------------------------------------
export const PRESCRIPTION_WRITE = "prescription:write" as const;
export const PRESCRIPTION_READ = "prescription:read" as const;

// -----------------------------------------------------------------------------
// Vitals permissions
// -----------------------------------------------------------------------------
export const VITALS_WRITE = "vitals:write" as const;
export const VITALS_READ = "vitals:read" as const;

// -----------------------------------------------------------------------------
// MAR permissions
// -----------------------------------------------------------------------------
export const MAR_WRITE = "mar:write" as const;
export const MAR_READ = "mar:read" as const;

// -----------------------------------------------------------------------------
// Lab permissions
// -----------------------------------------------------------------------------
export const LAB_ORDER_WRITE = "lab:order:write" as const;
export const LAB_RESULT_READ = "lab:result:read" as const;

// -----------------------------------------------------------------------------
// Consent permissions
// -----------------------------------------------------------------------------
export const CONSENT_WRITE_SELF = "consent:write:self" as const;
export const CONSENT_READ_SELF = "consent:read:self" as const;

// -----------------------------------------------------------------------------
// Billing permissions
// -----------------------------------------------------------------------------
export const BILLING_READ_SELF = "billing:read:self" as const;
export const BILLING_WRITE = "billing:write" as const;

// -----------------------------------------------------------------------------
// Audit permissions
// -----------------------------------------------------------------------------
export const AUDIT_READ_TENANT = "audit:read:tenant" as const;
export const AUDIT_READ_PLATFORM = "audit:read:platform" as const;
export const AUDIT_EXPORT = "audit:export" as const;

// -----------------------------------------------------------------------------
// Admin / Staff permissions
// -----------------------------------------------------------------------------
export const TENANT_MANAGE = "tenant:manage" as const;
export const STAFF_MANAGE = "staff:manage" as const;
export const BED_MANAGE = "bed:manage" as const;

// -----------------------------------------------------------------------------
// Break-glass
// -----------------------------------------------------------------------------
export const BREAK_GLASS_ACTIVATE = "break_glass:activate" as const;

// =============================================================================
// Aggregated exports
// =============================================================================

/** All permission codes as an array */
export const ALL_PERMISSIONS = [
  PATIENT_READ_SELF,
  PATIENT_READ_ASSIGNED,
  PATIENT_READ_TENANT,
  PATIENT_WRITE_SELF,
  ENCOUNTER_READ_ASSIGNED,
  ENCOUNTER_WRITE,
  ENCOUNTER_FINALIZE,
  PRESCRIPTION_WRITE,
  PRESCRIPTION_READ,
  VITALS_WRITE,
  VITALS_READ,
  MAR_WRITE,
  MAR_READ,
  LAB_ORDER_WRITE,
  LAB_RESULT_READ,
  CONSENT_WRITE_SELF,
  CONSENT_READ_SELF,
  BILLING_READ_SELF,
  BILLING_WRITE,
  AUDIT_READ_TENANT,
  AUDIT_READ_PLATFORM,
  AUDIT_EXPORT,
  TENANT_MANAGE,
  STAFF_MANAGE,
  BED_MANAGE,
  BREAK_GLASS_ACTIVATE,
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Role-to-permission mapping per the Platform Permission Matrix in Rules.md.
 * Each role key maps to the set of permissions granted to that role.
 */
export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  patient: [
    PATIENT_READ_SELF,
    PATIENT_WRITE_SELF,
    ENCOUNTER_READ_ASSIGNED,
    PRESCRIPTION_READ,
    LAB_RESULT_READ,
    CONSENT_WRITE_SELF,
    CONSENT_READ_SELF,
    BILLING_READ_SELF,
  ],
  doctor: [
    PATIENT_READ_ASSIGNED,
    ENCOUNTER_READ_ASSIGNED,
    ENCOUNTER_WRITE,
    ENCOUNTER_FINALIZE,
    PRESCRIPTION_WRITE,
    PRESCRIPTION_READ,
    VITALS_READ,
    MAR_READ,
    LAB_ORDER_WRITE,
    LAB_RESULT_READ,
    BREAK_GLASS_ACTIVATE,
  ],
  nurse: [
    PATIENT_READ_ASSIGNED,
    ENCOUNTER_READ_ASSIGNED,
    PRESCRIPTION_READ,
    VITALS_WRITE,
    VITALS_READ,
    MAR_WRITE,
    MAR_READ,
    LAB_RESULT_READ,
    BREAK_GLASS_ACTIVATE,
  ],
  admin: [
    PATIENT_READ_ASSIGNED,
    PATIENT_WRITE_SELF,
    BILLING_WRITE,
    AUDIT_READ_TENANT,
    AUDIT_EXPORT,
    STAFF_MANAGE,
    BED_MANAGE,
  ],
  super_admin: [
    AUDIT_READ_TENANT,
    AUDIT_READ_PLATFORM,
    AUDIT_EXPORT,
    TENANT_MANAGE,
  ],
} as const;
