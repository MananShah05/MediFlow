import { z } from "zod";
import { UuidSchema, NonEmptyString, DateStringSchema } from "./common.js";
import {
  EncounterTypeEnum,
  EncounterStatusEnum,
  DiagnosisTypeEnum,
  DiagnosisStatusEnum,
} from "../enums.js";

// =============================================================================
// Create Encounter
// =============================================================================

export const CreateEncounterRequestSchema = z.object({
  patientId: UuidSchema,
  doctorId: UuidSchema,
  appointmentId: UuidSchema.optional(),
  admissionId: UuidSchema.optional(),
  facilityId: UuidSchema,
  departmentId: UuidSchema.optional(),
  encounterType: EncounterTypeEnum.default("outpatient"),
});
export type CreateEncounterRequest = z.infer<typeof CreateEncounterRequestSchema>;

// =============================================================================
// Update Encounter (SOAP Notes)
// =============================================================================

export const UpdateEncounterRequestSchema = z.object({
  chiefComplaint: z.string().max(2000).optional(),
  historyOfPresentIllness: z.string().max(5000).optional(),
  examinationFindings: z.string().max(5000).optional(),
  assessmentNotes: z.string().max(5000).optional(),
  planNotes: z.string().max(5000).optional(),
  patientInstructions: z.string().max(2000).optional(),
  followUpDate: DateStringSchema.optional(),
  followUpInstructions: z.string().max(2000).optional(),
  /** Optimistic locking */
  version: z.number().int().positive(),
});
export type UpdateEncounterRequest = z.infer<typeof UpdateEncounterRequestSchema>;

// =============================================================================
// Finalize Encounter
// =============================================================================

export const FinalizeEncounterRequestSchema = z.object({
  /** Optimistic locking */
  version: z.number().int().positive(),
});
export type FinalizeEncounterRequest = z.infer<typeof FinalizeEncounterRequestSchema>;

// =============================================================================
// Add Diagnosis
// =============================================================================

export const AddDiagnosisRequestSchema = z.object({
  encounterId: UuidSchema,
  icdCode: NonEmptyString.max(20),
  icdDescription: NonEmptyString.max(500),
  diagnosisType: DiagnosisTypeEnum.default("primary"),
  status: DiagnosisStatusEnum.default("active"),
  onsetDate: DateStringSchema.optional(),
  notes: z.string().max(2000).optional(),
});
export type AddDiagnosisRequest = z.infer<typeof AddDiagnosisRequestSchema>;

// =============================================================================
// Encounter Response
// =============================================================================

export const EncounterResponseSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  doctorId: UuidSchema,
  appointmentId: UuidSchema.nullable(),
  admissionId: UuidSchema.nullable(),
  facilityId: UuidSchema,
  departmentId: UuidSchema.nullable(),
  encounterType: EncounterTypeEnum,
  status: EncounterStatusEnum,
  chiefComplaint: z.string().nullable(),
  historyOfPresentIllness: z.string().nullable(),
  examinationFindings: z.string().nullable(),
  assessmentNotes: z.string().nullable(),
  planNotes: z.string().nullable(),
  patientInstructions: z.string().nullable(),
  followUpDate: z.string().nullable(),
  followUpInstructions: z.string().nullable(),
  startedAt: z.string().nullable(),
  finalizedAt: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EncounterResponse = z.infer<typeof EncounterResponseSchema>;

// =============================================================================
// Diagnosis Response
// =============================================================================

export const DiagnosisResponseSchema = z.object({
  id: UuidSchema,
  encounterId: UuidSchema,
  patientId: UuidSchema,
  icdCode: z.string(),
  icdDescription: z.string(),
  diagnosisType: DiagnosisTypeEnum,
  status: DiagnosisStatusEnum,
  onsetDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type DiagnosisResponse = z.infer<typeof DiagnosisResponseSchema>;

// =============================================================================
// Encounter List Query
// =============================================================================

export const EncounterListQuerySchema = z.object({
  patientId: UuidSchema.optional(),
  doctorId: UuidSchema.optional(),
  status: EncounterStatusEnum.optional(),
  encounterType: EncounterTypeEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type EncounterListQuery = z.infer<typeof EncounterListQuerySchema>;
