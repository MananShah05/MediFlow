import { z } from "zod";

export const listPrescriptionsSchema = z.object({
  encounterId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPrescriptionSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  notes: z.string().nullish(),
  items: z.array(z.object({
    medicationId: z.string().uuid(),
    dose: z.number().positive(),
    doseUnit: z.enum(["mg", "ml", "mcg", "units", "IU", "g"]),
    route: z.enum(["oral", "iv", "im", "sc", "topical", "inhaled", "sublingual", "rectal"]),
    frequency: z.enum(["OD", "BD", "TDS", "QID", "PRN", "SOS", "STAT", "other"]),
    frequencyDetails: z.string().nullish(),
    durationDays: z.number().int().positive().optional(),
    instructions: z.string().nullish(),
  })).min(1),
});

export type CreatePrescriptionBody = z.infer<typeof createPrescriptionSchema>;
