import { z } from "zod";

export const listEncountersSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListEncountersQuery = z.infer<typeof listEncountersSchema>;

export const createEncounterSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  facilityId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  encounterType: z.enum(["outpatient", "inpatient", "emergency", "teleconsult"]).default("outpatient"),
  chiefComplaint: z.string().optional(),
});

export type CreateEncounterBody = z.infer<typeof createEncounterSchema>;

export const updateEncounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  examinationFindings: z.string().optional(),
  assessmentNotes: z.string().optional(),
  planNotes: z.string().optional(),
  patientInstructions: z.string().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  followUpInstructions: z.string().optional(),
});

export type UpdateEncounterBody = z.infer<typeof updateEncounterSchema>;

export const addDiagnosisSchema = z.object({
  icdCode: z.string().min(3).max(10),
  icdDescription: z.string().min(2),
  diagnosisType: z.enum(["primary", "secondary", "differential", "admission", "discharge"]).default("primary"),
  status: z.enum(["active", "resolved", "chronic", "ruled_out"]).default("active"),
  onsetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export type AddDiagnosisBody = z.infer<typeof addDiagnosisSchema>;
