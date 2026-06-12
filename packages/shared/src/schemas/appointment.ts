import { z } from "zod";
import { UuidSchema, NonEmptyString, TimestampSchema, PositiveInt } from "./common.js";
import { AppointmentTypeEnum, AppointmentStatusEnum } from "../enums.js";

// =============================================================================
// Book Appointment
// =============================================================================

export const BookAppointmentRequestSchema = z.object({
  patientId: UuidSchema,
  doctorId: UuidSchema,
  departmentId: UuidSchema.optional(),
  facilityId: UuidSchema,
  appointmentType: AppointmentTypeEnum.default("outpatient"),
  scheduledAt: TimestampSchema,
  durationMinutes: PositiveInt.default(30),
  visitReason: z.string().max(1000).optional(),
  bookingChannel: z.enum(["patient_portal", "admin", "phone", "walk_in"]).default("patient_portal"),
  idempotencyKey: z.string().uuid().optional(),
});
export type BookAppointmentRequest = z.infer<typeof BookAppointmentRequestSchema>;

// =============================================================================
// Update Appointment
// =============================================================================

export const UpdateAppointmentRequestSchema = z.object({
  scheduledAt: TimestampSchema.optional(),
  durationMinutes: PositiveInt.optional(),
  visitReason: z.string().max(1000).optional(),
  appointmentType: AppointmentTypeEnum.optional(),
});
export type UpdateAppointmentRequest = z.infer<typeof UpdateAppointmentRequestSchema>;

// =============================================================================
// Cancel Appointment
// =============================================================================

export const CancelAppointmentRequestSchema = z.object({
  cancellationReason: NonEmptyString.max(500),
});
export type CancelAppointmentRequest = z.infer<typeof CancelAppointmentRequestSchema>;

// =============================================================================
// Check-in
// =============================================================================

export const CheckInAppointmentRequestSchema = z.object({
  appointmentId: UuidSchema,
});
export type CheckInAppointmentRequest = z.infer<typeof CheckInAppointmentRequestSchema>;

// =============================================================================
// Appointment Response
// =============================================================================

export const AppointmentResponseSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  doctorId: UuidSchema,
  departmentId: UuidSchema.nullable(),
  facilityId: UuidSchema,
  appointmentType: AppointmentTypeEnum,
  status: AppointmentStatusEnum,
  scheduledAt: z.string(),
  durationMinutes: z.number().int(),
  visitReason: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  checkinTime: z.string().nullable(),
  encounterId: UuidSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;

// =============================================================================
// Available Slots
// =============================================================================

export const AvailableSlotsQuerySchema = z.object({
  doctorId: UuidSchema,
  facilityId: UuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  appointmentType: AppointmentTypeEnum.default("outpatient"),
});
export type AvailableSlotsQuery = z.infer<typeof AvailableSlotsQuerySchema>;

export const TimeSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  available: z.boolean(),
});
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// =============================================================================
// Appointment List Query
// =============================================================================

export const AppointmentListQuerySchema = z.object({
  patientId: UuidSchema.optional(),
  doctorId: UuidSchema.optional(),
  status: AppointmentStatusEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  appointmentType: AppointmentTypeEnum.optional(),
});
export type AppointmentListQuery = z.infer<typeof AppointmentListQuerySchema>;
