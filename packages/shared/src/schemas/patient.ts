import { z } from "zod";
import {
  UuidSchema,
  NonEmptyString,
  EmailSchema,
  PhoneSchema,
  DateStringSchema,
  AddressSchema,
} from "./common.js";
import {
  GenderEnum,
  BloodGroupEnum,
  IdTypeEnum,
  PatientStatusEnum,
  RegistrationTypeEnum,
} from "../enums.js";

// =============================================================================
// Patient Registration
// =============================================================================

export const RegisterPatientRequestSchema = z.object({
  fullName: NonEmptyString.max(200),
  dateOfBirth: DateStringSchema,
  gender: GenderEnum,
  mobileNumber: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  bloodGroup: BloodGroupEnum.optional(),
  address: AddressSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default("IN"),
  nationality: z.string().default("Indian"),
  idType: IdTypeEnum.optional(),
  idNumber: z.string().optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  emergencyContactPhone: PhoneSchema.optional(),
  allergies: z
    .array(
      z.object({
        drug: z.string(),
        reaction: z.string(),
        severity: z.enum(["mild", "moderate", "severe"]),
      })
    )
    .default([]),
  chronicConditions: z
    .array(
      z.object({
        icdCode: z.string(),
        description: z.string(),
      })
    )
    .default([]),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceValidity: DateStringSchema.optional(),
  preferredLanguage: z.string().default("en"),
  preferredContact: z.enum(["sms", "email", "whatsapp"]).default("sms"),
  registrationType: RegistrationTypeEnum.default("self"),
  abhaId: z.string().optional(),
});
export type RegisterPatientRequest = z.infer<typeof RegisterPatientRequestSchema>;

// =============================================================================
// Update Patient Profile
// =============================================================================

export const UpdatePatientProfileRequestSchema = z.object({
  fullName: NonEmptyString.max(200).optional(),
  dateOfBirth: DateStringSchema.optional(),
  gender: GenderEnum.optional(),
  mobileNumber: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  bloodGroup: BloodGroupEnum.optional(),
  address: AddressSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  nationality: z.string().optional(),
  idType: IdTypeEnum.optional(),
  idNumber: z.string().optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  emergencyContactPhone: PhoneSchema.optional(),
  allergies: z
    .array(
      z.object({
        drug: z.string(),
        reaction: z.string(),
        severity: z.enum(["mild", "moderate", "severe"]),
      })
    )
    .optional(),
  chronicConditions: z
    .array(
      z.object({
        icdCode: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceValidity: DateStringSchema.optional(),
  preferredLanguage: z.string().optional(),
  preferredContact: z.enum(["sms", "email", "whatsapp"]).optional(),
  /** Optimistic locking — version from the current record */
  version: z.number().int().positive(),
});
export type UpdatePatientProfileRequest = z.infer<typeof UpdatePatientProfileRequestSchema>;

// =============================================================================
// Patient Response
// =============================================================================

export const PatientResponseSchema = z.object({
  id: UuidSchema,
  uhid: z.string(),
  abhaId: z.string().nullable(),
  status: PatientStatusEnum,
  registrationDate: z.string(),
  registrationType: RegistrationTypeEnum,
  profile: z.object({
    fullName: z.string(),
    dateOfBirth: z.string(),
    gender: GenderEnum,
    bloodGroup: BloodGroupEnum.nullable(),
    mobileNumber: z.string().nullable(),
    email: z.string().nullable(),
    address: AddressSchema.nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    pincode: z.string().nullable(),
    country: z.string(),
    nationality: z.string(),
    emergencyContactName: z.string().nullable(),
    emergencyContactRelation: z.string().nullable(),
    emergencyContactPhone: z.string().nullable(),
    allergies: z.array(z.unknown()),
    chronicConditions: z.array(z.unknown()),
    insuranceProvider: z.string().nullable(),
    insuranceValidity: z.string().nullable(),
    preferredLanguage: z.string(),
    preferredContact: z.string(),
    version: z.number().int(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PatientResponse = z.infer<typeof PatientResponseSchema>;

// =============================================================================
// Patient Search / List
// =============================================================================

export const PatientSearchQuerySchema = z.object({
  search: z.string().optional(),
  uhid: z.string().optional(),
  phone: z.string().optional(),
  abhaId: z.string().optional(),
  status: PatientStatusEnum.optional(),
});
export type PatientSearchQuery = z.infer<typeof PatientSearchQuerySchema>;
