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
