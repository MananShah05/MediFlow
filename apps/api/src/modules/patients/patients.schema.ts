import { z } from "zod";

// ── Patient Search & List ──
export const listPatientsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPatientsQuery = z.infer<typeof listPatientsSchema>;

// ── Get Patient by ID ──
export const getPatientParamsSchema = z.object({
  id: z.string().uuid(),
});

// ── Create Patient ──
export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  bloodGroup: z.enum(["A_positive", "A_negative", "B_positive", "B_negative", "AB_positive", "AB_negative", "O_positive", "O_negative"]).optional(),
  mobileNumber: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  registrationType: z.enum(["self", "admin", "emergency"]).default("admin"),
});

export type CreatePatientBody = z.infer<typeof createPatientSchema>;

// ── Update Patient Profile ──
export const updatePatientProfileSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  mobileNumber: z.string().min(10).max(15).nullable().optional(),
  email: z.string().email().nullable().optional(),
  bloodGroup: z.enum(["A_positive", "A_negative", "B_positive", "B_negative", "AB_positive", "AB_negative", "O_positive", "O_negative"]).nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insurancePolicyNumber: z.string().nullable().optional(),
  insuranceValidity: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").nullable().optional(),
  preferredLanguage: z.string().optional(),
  preferredContact: z.enum(["sms", "email", "whatsapp"]).optional(),
  version: z.number().int().positive(),
});

export type UpdatePatientProfileBody = z.infer<typeof updatePatientProfileSchema>;

// ── Update Security Settings ──
export const updateSecuritySettingsSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
});

export type UpdateSecuritySettingsBody = z.infer<typeof updateSecuritySettingsSchema>;

