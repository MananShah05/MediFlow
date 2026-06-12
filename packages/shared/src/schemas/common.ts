import { z } from "zod";

// =============================================================================
// Primitive schemas
// =============================================================================

/** UUID v4 format validator */
export const UuidSchema = z.string().uuid("Invalid UUID format");

/** ISO 8601 datetime string */
export const TimestampSchema = z.string().datetime({ offset: true });

/** Date string in YYYY-MM-DD format */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/** E.164 phone number format */
export const PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format (e.g. +919876543210)");

/** Trimmed non-empty text */
export const NonEmptyString = z.string().trim().min(1, "Field cannot be empty");

/** Email address */
export const EmailSchema = z.string().email("Invalid email address").toLowerCase().trim();

/** IP address (v4 or v6) */
export const IpAddressSchema = z.string().ip("Invalid IP address");

/** Positive integer */
export const PositiveInt = z.number().int().positive();

/** Non-negative integer */
export const NonNegativeInt = z.number().int().nonnegative();

// =============================================================================
// Pagination
// =============================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  totalCount: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});
export type PaginatedResponseMeta = z.infer<typeof PaginatedResponseMetaSchema>;

// =============================================================================
// Common response wrappers
// =============================================================================

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginatedResponseMetaSchema,
  });
}

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    status: z.number().int(),
    requestId: z.string(),
    timestamp: TimestampSchema,
    details: z.record(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// =============================================================================
// Common field schemas
// =============================================================================

/** Tenant-scoped request context (added by middleware) */
export const TenantContextSchema = z.object({
  tenantId: UuidSchema,
  userId: UuidSchema,
  role: z.string(),
  sessionId: UuidSchema,
});
export type TenantContext = z.infer<typeof TenantContextSchema>;

/** Address JSONB schema */
export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(3).default("IN"),
});
export type Address = z.infer<typeof AddressSchema>;

/** Idempotency key header */
export const IdempotencyKeySchema = z.string().uuid().optional();
