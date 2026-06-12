import { z } from "zod";
import { UuidSchema, TimestampSchema } from "./common.js";
import { NursingTaskTypeEnum, NursingTaskStatusEnum, NursingTaskPriorityEnum, HandoffStatusEnum, ShiftTypeEnum } from "../enums.js";

// =============================================================================
// Nursing Task Schemas
// =============================================================================

export const NursingTaskSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema,
  patientId: UuidSchema,
  encounterId: UuidSchema.optional(),
  assignedNurseId: UuidSchema.optional(),
  taskType: NursingTaskTypeEnum,
  status: NursingTaskStatusEnum,
  priority: NursingTaskPriorityEnum,
  description: z.string().min(1),
  scheduledAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  cancelledAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const CreateNursingTaskSchema = NursingTaskSchema.omit({
  id: true,
  tenantId: true,
  status: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateNursingTaskStatusSchema = z.object({
  status: NursingTaskStatusEnum,
  reason: z.string().optional(),
});

// =============================================================================
// Nursing Handoff (SBAR) Schemas
// =============================================================================

export const NursingHandoffSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema,
  patientId: UuidSchema,
  outgoingNurseId: UuidSchema,
  incomingNurseId: UuidSchema,
  shiftType: ShiftTypeEnum,
  situation: z.string().min(1),
  background: z.string().min(1),
  assessment: z.string().min(1),
  recommendation: z.string().min(1),
  status: HandoffStatusEnum,
  submittedAt: TimestampSchema,
  acknowledgedAt: TimestampSchema.optional(),
});

export const SubmitHandoffSchema = NursingHandoffSchema.omit({
  id: true,
  tenantId: true,
  outgoingNurseId: true,
  status: true,
  submittedAt: true,
  acknowledgedAt: true,
});
