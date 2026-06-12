import { z } from "zod";

export const listLabOrdersSchema = z.object({
  encounterId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createLabOrderSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  clinicalNotes: z.string().nullish(),
  items: z.array(z.object({
    testName: z.string().min(2),
    testCode: z.string().optional(),
  })).min(1),
});

export type CreateLabOrderBody = z.infer<typeof createLabOrderSchema>;
