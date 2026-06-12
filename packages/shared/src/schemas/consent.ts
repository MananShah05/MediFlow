import { z } from "zod";
import { UuidSchema, TimestampSchema } from "./common.js";
import { ConsentPurposeEnum, ConsentStatusEnum, ConsentGranteeTypeEnum, ConsentChannelEnum } from "../enums.js";

// =============================================================================
// Consent Management Schemas
// =============================================================================

export const ConsentSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema,
  patientId: UuidSchema,
  purpose: ConsentPurposeEnum,
  status: ConsentStatusEnum,
  granteeType: ConsentGranteeTypeEnum,
  granteeId: UuidSchema,
  scope: z.record(z.unknown()).default({}),
  grantedAt: TimestampSchema,
  expiresAt: TimestampSchema.optional(),
  revokedAt: TimestampSchema.optional(),
  consentVersion: z.string().default("1.0"),
  channel: ConsentChannelEnum,
});

export const GrantConsentSchema = ConsentSchema.omit({
  id: true,
  tenantId: true,
  status: true,
  grantedAt: true,
  revokedAt: true,
});

export const RevokeConsentSchema = z.object({
  reason: z.string().min(1),
});
