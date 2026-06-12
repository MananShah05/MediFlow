import { z } from "zod";

export const listAppointmentsSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsSchema>;

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  facilityId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  appointmentType: z.enum(["outpatient", "inpatient", "emergency", "teleconsult"]).default("outpatient"),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(240).default(30),
  visitReason: z.string().optional(),
  bookingChannel: z.enum(["patient_portal", "admin", "phone", "walk_in"]).default("admin"),
});

export type CreateAppointmentBody = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "checked_in", "in_consultation", "completed", "no_show", "cancelled"]),
  cancellationReason: z.string().optional(),
});

export type UpdateAppointmentStatusBody = z.infer<typeof updateAppointmentStatusSchema>;
