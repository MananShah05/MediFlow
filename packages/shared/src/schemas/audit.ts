import { z } from "zod";
import { UuidSchema, TimestampSchema, PaginationQuerySchema } from "./common.js";
import { AuditActionEnum, AuditOutcomeEnum } from "../enums.js";

// =============================================================================
// Audit Query Schemas
// =============================================================================

export const AuditQuerySchema = PaginationQuerySchema.extend({
  tenantId: UuidSchema.optional(),
  userId: UuidSchema.optional(),
  patientId: UuidSchema.optional(),
  actionType: AuditActionEnum.optional(),
  outcome: AuditOutcomeEnum.optional(),
  startDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
  breakGlassOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
});
export type AuditQuery = z.infer<typeof AuditQuerySchema>;

export const AuditLogResponseSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema.optional(),
  timestamp: TimestampSchema,
  userId: UuidSchema,
  userRole: z.string(),
  patientId: UuidSchema.optional(),
  actionType: AuditActionEnum,
  resourceType: z.string(),
  resourceId: z.string(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  outcome: AuditOutcomeEnum,
  failureReason: z.string().optional(),
  breakGlass: z.boolean(),
  breakGlassReason: z.string().optional(),
  metadata: z.record(z.unknown()),
  prevHash: z.string(),
  hash: z.string(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;
