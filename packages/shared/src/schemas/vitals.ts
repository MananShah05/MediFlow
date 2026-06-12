import { z } from "zod";
import { UuidSchema } from "./common.js";
import { TemperatureUnitEnum, BloodGlucoseTypeEnum } from "../enums.js";
import { VITAL_RANGES } from "../constants/vital-ranges.js";

// =============================================================================
// Record Vitals
// =============================================================================

export const RecordVitalsRequestSchema = z
  .object({
    patientId: UuidSchema,
    encounterId: UuidSchema.optional(),
    admissionId: UuidSchema.optional(),
    systolicBp: z
      .number()
      .min(VITAL_RANGES.systolicBp.min, `Systolic BP must be ≥ ${VITAL_RANGES.systolicBp.min}`)
      .max(VITAL_RANGES.systolicBp.max, `Systolic BP must be ≤ ${VITAL_RANGES.systolicBp.max}`)
      .optional(),
    diastolicBp: z
      .number()
      .min(VITAL_RANGES.diastolicBp.min, `Diastolic BP must be ≥ ${VITAL_RANGES.diastolicBp.min}`)
      .max(VITAL_RANGES.diastolicBp.max, `Diastolic BP must be ≤ ${VITAL_RANGES.diastolicBp.max}`)
      .optional(),
    pulse: z
      .number()
      .min(VITAL_RANGES.pulse.min, `Pulse must be ≥ ${VITAL_RANGES.pulse.min}`)
      .max(VITAL_RANGES.pulse.max, `Pulse must be ≤ ${VITAL_RANGES.pulse.max}`)
      .optional(),
    temperature: z
      .number()
      .min(VITAL_RANGES.temperature.min, `Temperature must be ≥ ${VITAL_RANGES.temperature.min}`)
      .max(VITAL_RANGES.temperature.max, `Temperature must be ≤ ${VITAL_RANGES.temperature.max}`)
      .optional(),
    temperatureUnit: TemperatureUnitEnum.default("C"),
    spo2: z
      .number()
      .min(VITAL_RANGES.spo2.min, `SpO2 must be ≥ ${VITAL_RANGES.spo2.min}`)
      .max(VITAL_RANGES.spo2.max, `SpO2 must be ≤ ${VITAL_RANGES.spo2.max}`)
      .optional(),
    respiratoryRate: z
      .number()
      .min(VITAL_RANGES.respiratoryRate.min, `Respiratory rate must be ≥ ${VITAL_RANGES.respiratoryRate.min}`)
      .max(VITAL_RANGES.respiratoryRate.max, `Respiratory rate must be ≤ ${VITAL_RANGES.respiratoryRate.max}`)
      .optional(),
    weightKg: z
      .number()
      .min(VITAL_RANGES.weightKg.min)
      .max(VITAL_RANGES.weightKg.max)
      .optional(),
    heightCm: z
      .number()
      .min(VITAL_RANGES.heightCm.min)
      .max(VITAL_RANGES.heightCm.max)
      .optional(),
    bloodGlucose: z
      .number()
      .min(VITAL_RANGES.bloodGlucose.min, `Blood glucose must be ≥ ${VITAL_RANGES.bloodGlucose.min}`)
      .max(VITAL_RANGES.bloodGlucose.max, `Blood glucose must be ≤ ${VITAL_RANGES.bloodGlucose.max}`)
      .optional(),
    bloodGlucoseType: BloodGlucoseTypeEnum.optional(),
    painScore: z
      .number()
      .int()
      .min(VITAL_RANGES.painScore.min, `Pain score must be ≥ ${VITAL_RANGES.painScore.min}`)
      .max(VITAL_RANGES.painScore.max, `Pain score must be ≤ ${VITAL_RANGES.painScore.max}`)
      .optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      // When temperature is provided and unit is Fahrenheit, validate against F range
      if (data.temperature !== undefined && data.temperatureUnit === "F") {
        return (
          data.temperature >= VITAL_RANGES.temperatureF.min &&
          data.temperature <= VITAL_RANGES.temperatureF.max
        );
      }
      return true;
    },
    {
      message: `Temperature in Fahrenheit must be between ${VITAL_RANGES.temperatureF.min} and ${VITAL_RANGES.temperatureF.max}`,
      path: ["temperature"],
    }
  )
  .refine(
    (data) => {
      // If diastolicBp is provided, systolicBp must also be provided, and systolic > diastolic
      if (data.systolicBp !== undefined && data.diastolicBp !== undefined) {
        return data.systolicBp > data.diastolicBp;
      }
      return true;
    },
    {
      message: "Systolic BP must be greater than diastolic BP",
      path: ["systolicBp"],
    }
  );
export type RecordVitalsRequest = z.infer<typeof RecordVitalsRequestSchema>;

// =============================================================================
// Vitals Response
// =============================================================================

export const VitalsResponseSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  encounterId: UuidSchema.nullable(),
  admissionId: UuidSchema.nullable(),
  recordedBy: UuidSchema,
  recordedByName: z.string(),
  recordedAt: z.string(),
  systolicBp: z.number().nullable(),
  diastolicBp: z.number().nullable(),
  pulse: z.number().nullable(),
  temperature: z.number().nullable(),
  temperatureUnit: TemperatureUnitEnum,
  spo2: z.number().nullable(),
  respiratoryRate: z.number().nullable(),
  weightKg: z.number().nullable(),
  heightCm: z.number().nullable(),
  bmi: z.number().nullable(),
  bloodGlucose: z.number().nullable(),
  bloodGlucoseType: BloodGlucoseTypeEnum.nullable(),
  painScore: z.number().int().nullable(),
  isCritical: z.boolean(),
  criticalParams: z.array(z.string()),
  criticalAlerted: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type VitalsResponse = z.infer<typeof VitalsResponseSchema>;

// =============================================================================
// Vitals List Query
// =============================================================================

export const VitalsListQuerySchema = z.object({
  patientId: UuidSchema,
  encounterId: UuidSchema.optional(),
  admissionId: UuidSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  criticalOnly: z.coerce.boolean().default(false),
});
export type VitalsListQuery = z.infer<typeof VitalsListQuerySchema>;
