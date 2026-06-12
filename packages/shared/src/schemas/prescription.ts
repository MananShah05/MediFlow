import { z } from "zod";
import { UuidSchema, NonEmptyString, DateStringSchema, PositiveInt } from "./common.js";
import {
  PrescriptionStatusEnum,
  DoseUnitEnum,
  RouteEnum,
  FrequencyEnum,
} from "../enums.js";

// =============================================================================
// Create Prescription
// =============================================================================

export const PrescriptionItemSchema = z.object({
  medicationId: UuidSchema,
  dose: z.number().positive("Dose must be positive"),
  doseUnit: DoseUnitEnum,
  route: RouteEnum,
  frequency: FrequencyEnum,
  frequencyDetails: z.string().max(200).optional(),
  durationDays: PositiveInt.optional(),
  totalQuantity: z.number().positive().optional(),
  instructions: z.string().max(500).optional(),
  startDate: DateStringSchema,
  endDate: DateStringSchema.optional(),
});
export type PrescriptionItem = z.infer<typeof PrescriptionItemSchema>;

export const CreatePrescriptionRequestSchema = z.object({
  patientId: UuidSchema,
  encounterId: UuidSchema,
  items: z
    .array(PrescriptionItemSchema)
    .min(1, "At least one prescription item is required"),
  notes: z.string().max(2000).optional(),
});
export type CreatePrescriptionRequest = z.infer<typeof CreatePrescriptionRequestSchema>;

// =============================================================================
// Cancel Prescription
// =============================================================================

export const CancelPrescriptionRequestSchema = z.object({
  cancellationReason: NonEmptyString.max(500),
});
export type CancelPrescriptionRequest = z.infer<typeof CancelPrescriptionRequestSchema>;

// =============================================================================
// Prescription Response
// =============================================================================

export const PrescriptionItemResponseSchema = z.object({
  id: UuidSchema,
  medicationId: UuidSchema,
  medicationName: z.string(),
  dose: z.number(),
  doseUnit: DoseUnitEnum,
  route: RouteEnum,
  frequency: FrequencyEnum,
  frequencyDetails: z.string().nullable(),
  durationDays: z.number().int().nullable(),
  totalQuantity: z.number().nullable(),
  instructions: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
});
export type PrescriptionItemResponse = z.infer<typeof PrescriptionItemResponseSchema>;

export const PrescriptionResponseSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  encounterId: UuidSchema,
  prescribedBy: UuidSchema,
  prescribedByName: z.string(),
  status: PrescriptionStatusEnum,
  prescribedAt: z.string(),
  cancelledAt: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(PrescriptionItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PrescriptionResponse = z.infer<typeof PrescriptionResponseSchema>;

// =============================================================================
// Drug Search
// =============================================================================

export const DrugSearchQuerySchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  formularyOnly: z.coerce.boolean().default(true),
});
export type DrugSearchQuery = z.infer<typeof DrugSearchQuerySchema>;

export const DrugSearchResultSchema = z.object({
  id: UuidSchema,
  genericName: z.string(),
  brandNames: z.array(z.string()),
  drugClass: z.string().nullable(),
  controlledSubstance: z.boolean(),
  highAlert: z.boolean(),
  standardDoses: z.array(z.unknown()),
  routesAvailable: z.array(z.string()),
  isActive: z.boolean(),
});
export type DrugSearchResult = z.infer<typeof DrugSearchResultSchema>;

// =============================================================================
// Prescription List Query
// =============================================================================

export const PrescriptionListQuerySchema = z.object({
  patientId: UuidSchema.optional(),
  encounterId: UuidSchema.optional(),
  status: PrescriptionStatusEnum.optional(),
});
export type PrescriptionListQuery = z.infer<typeof PrescriptionListQuerySchema>;
