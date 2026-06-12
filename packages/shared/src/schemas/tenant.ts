import { z } from "zod";
import { UuidSchema, NonEmptyString, EmailSchema, PhoneSchema, AddressSchema } from "./common.js";
import {
  TenantStatusEnum,
  TenantTypeEnum,
  TenantTierEnum,
  ComplianceProfileEnum,
} from "../enums.js";

// =============================================================================
// Create Tenant
// =============================================================================

export const CreateTenantRequestSchema = z.object({
  name: NonEmptyString.max(200),
  slug: z
    .string()
    .min(3)
    .max(63)
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Slug must be lowercase alphanumeric with hyphens, cannot start/end with hyphen"
    ),
  type: TenantTypeEnum,
  tier: TenantTierEnum.default("starter"),
  region: NonEmptyString,
  complianceProfile: ComplianceProfileEnum.default("dpdp"),
  address: AddressSchema.optional(),
  contactEmail: EmailSchema,
  contactPhone: PhoneSchema.optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional(),
  licenseNumber: z.string().optional(),
});
export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;

// =============================================================================
// Update Tenant
// =============================================================================

export const UpdateTenantRequestSchema = z.object({
  name: NonEmptyString.max(200).optional(),
  type: TenantTypeEnum.optional(),
  tier: TenantTierEnum.optional(),
  address: AddressSchema.optional(),
  contactEmail: EmailSchema.optional(),
  contactPhone: PhoneSchema.optional(),
  gstin: z.string().optional(),
  licenseNumber: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});
export type UpdateTenantRequest = z.infer<typeof UpdateTenantRequestSchema>;

// =============================================================================
// Tenant Status Change
// =============================================================================

export const ChangeTenantStatusRequestSchema = z.object({
  status: TenantStatusEnum,
  reason: NonEmptyString.max(500),
});
export type ChangeTenantStatusRequest = z.infer<typeof ChangeTenantStatusRequestSchema>;

// =============================================================================
// Tenant Response
// =============================================================================

export const TenantResponseSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  slug: z.string(),
  type: TenantTypeEnum,
  status: TenantStatusEnum,
  tier: TenantTierEnum,
  region: z.string(),
  complianceProfile: ComplianceProfileEnum,
  address: AddressSchema.nullable(),
  contactEmail: z.string(),
  contactPhone: z.string().nullable(),
  gstin: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  settings: z.record(z.unknown()),
  featureFlags: z.record(z.boolean()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantResponse = z.infer<typeof TenantResponseSchema>;

// =============================================================================
// Tenant List Query
// =============================================================================

export const TenantListQuerySchema = z.object({
  status: TenantStatusEnum.optional(),
  type: TenantTypeEnum.optional(),
  tier: TenantTierEnum.optional(),
  search: z.string().optional(),
});
export type TenantListQuery = z.infer<typeof TenantListQuerySchema>;
