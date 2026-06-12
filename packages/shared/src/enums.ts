import { z } from "zod";

// =============================================================================
// User & Auth Enums
// =============================================================================

export const UserStatusEnum = z.enum([
  "active",
  "suspended",
  "deactivated",
  "pending_verification",
]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const UserRoleEnum = z.enum([
  "patient",
  "doctor",
  "nurse",
  "admin",
  "super_admin",
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const MfaMethodEnum = z.enum(["totp", "sms", "passkey", "hardware_key"]);
export type MfaMethod = z.infer<typeof MfaMethodEnum>;

export const LoginOutcomeEnum = z.enum([
  "success",
  "failure_password",
  "failure_mfa",
  "failure_lockout",
  "failure_not_found",
]);
export type LoginOutcome = z.infer<typeof LoginOutcomeEnum>;

export const SessionInvalidationReasonEnum = z.enum([
  "logout",
  "timeout",
  "password_change",
  "admin_revoke",
  "security_event",
]);
export type SessionInvalidationReason = z.infer<
  typeof SessionInvalidationReasonEnum
>;

// =============================================================================
// Tenant Enums
// =============================================================================

export const TenantStatusEnum = z.enum([
  "provisioning",
  "active",
  "suspended",
  "deactivated",
]);
export type TenantStatus = z.infer<typeof TenantStatusEnum>;

export const TenantTypeEnum = z.enum([
  "hospital",
  "clinic",
  "diagnostic_center",
  "care_network",
]);
export type TenantType = z.infer<typeof TenantTypeEnum>;

export const TenantTierEnum = z.enum([
  "starter",
  "professional",
  "enterprise",
]);
export type TenantTier = z.infer<typeof TenantTierEnum>;

export const ComplianceProfileEnum = z.enum([
  "hipaa",
  "dpdp",
  "gdpr",
  "abdm_dpdp",
]);
export type ComplianceProfile = z.infer<typeof ComplianceProfileEnum>;

// =============================================================================
// Patient Enums
// =============================================================================

export const GenderEnum = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
export type Gender = z.infer<typeof GenderEnum>;

export const BloodGroupEnum = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);
export type BloodGroup = z.infer<typeof BloodGroupEnum>;

export const IdTypeEnum = z.enum([
  "aadhaar",
  "passport",
  "voter_id",
  "pan",
  "dl",
]);
export type IdType = z.infer<typeof IdTypeEnum>;

export const PatientStatusEnum = z.enum([
  "active",
  "deceased",
  "merged",
  "deactivated",
]);
export type PatientStatus = z.infer<typeof PatientStatusEnum>;

export const RegistrationTypeEnum = z.enum(["self", "admin", "emergency"]);
export type RegistrationType = z.infer<typeof RegistrationTypeEnum>;

// =============================================================================
// Appointment Enums
// =============================================================================

export const AppointmentTypeEnum = z.enum([
  "outpatient",
  "inpatient",
  "emergency",
  "teleconsult",
]);
export type AppointmentType = z.infer<typeof AppointmentTypeEnum>;

export const AppointmentStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "checked_in",
  "in_consultation",
  "completed",
  "no_show",
  "cancelled",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

// =============================================================================
// Encounter Enums
// =============================================================================

export const EncounterTypeEnum = z.enum([
  "outpatient",
  "inpatient",
  "emergency",
  "teleconsult",
]);
export type EncounterType = z.infer<typeof EncounterTypeEnum>;

export const EncounterStatusEnum = z.enum([
  "draft",
  "in_progress",
  "pending_review",
  "finalized",
  "cancelled",
]);
export type EncounterStatus = z.infer<typeof EncounterStatusEnum>;

// =============================================================================
// Diagnosis Enums
// =============================================================================

export const DiagnosisTypeEnum = z.enum([
  "primary",
  "secondary",
  "differential",
  "admission",
  "discharge",
]);
export type DiagnosisType = z.infer<typeof DiagnosisTypeEnum>;

export const DiagnosisStatusEnum = z.enum([
  "active",
  "resolved",
  "chronic",
  "ruled_out",
]);
export type DiagnosisStatus = z.infer<typeof DiagnosisStatusEnum>;

// =============================================================================
// Prescription & Medication Enums
// =============================================================================

export const PrescriptionStatusEnum = z.enum([
  "active",
  "on_hold",
  "completed",
  "cancelled",
  "dispensed",
]);
export type PrescriptionStatus = z.infer<typeof PrescriptionStatusEnum>;

export const DoseUnitEnum = z.enum(["mg", "ml", "mcg", "units", "IU", "g"]);
export type DoseUnit = z.infer<typeof DoseUnitEnum>;

export const RouteEnum = z.enum([
  "oral",
  "iv",
  "im",
  "sc",
  "topical",
  "inhaled",
  "sublingual",
  "rectal",
]);
export type Route = z.infer<typeof RouteEnum>;

export const FrequencyEnum = z.enum([
  "OD",
  "BD",
  "TDS",
  "QID",
  "PRN",
  "SOS",
  "STAT",
  "other",
]);
export type Frequency = z.infer<typeof FrequencyEnum>;

export const MedicationAdminStatusEnum = z.enum([
  "pending",
  "administered",
  "omitted",
  "delayed",
]);
export type MedicationAdminStatus = z.infer<typeof MedicationAdminStatusEnum>;

// =============================================================================
// Lab Enums
// =============================================================================

export const LabOrderStatusEnum = z.enum([
  "ordered",
  "specimen_collected",
  "processing",
  "resulted",
  "reviewed",
  "cancelled",
]);
export type LabOrderStatus = z.infer<typeof LabOrderStatusEnum>;

export const LabPriorityEnum = z.enum(["routine", "urgent", "stat"]);
export type LabPriority = z.infer<typeof LabPriorityEnum>;

export const LabResultFlagEnum = z.enum([
  "normal",
  "low",
  "high",
  "critical_low",
  "critical_high",
]);
export type LabResultFlag = z.infer<typeof LabResultFlagEnum>;

export const LabResultTypeEnum = z.enum([
  "numeric",
  "text",
  "structured",
  "file",
]);
export type LabResultType = z.infer<typeof LabResultTypeEnum>;

// =============================================================================
// Nursing Enums
// =============================================================================

export const NursingTaskTypeEnum = z.enum([
  "wound_care",
  "catheter_care",
  "reposition",
  "iv_check",
  "custom",
]);
export type NursingTaskType = z.infer<typeof NursingTaskTypeEnum>;

export const NursingTaskStatusEnum = z.enum([
  "created",
  "assigned",
  "acknowledged",
  "in_progress",
  "completed",
  "deferred",
  "escalated",
]);
export type NursingTaskStatus = z.infer<typeof NursingTaskStatusEnum>;

export const NursingTaskPriorityEnum = z.enum(["routine", "urgent", "stat"]);
export type NursingTaskPriority = z.infer<typeof NursingTaskPriorityEnum>;

export const HandoffStatusEnum = z.enum([
  "pending",
  "submitted",
  "acknowledged",
]);
export type HandoffStatus = z.infer<typeof HandoffStatusEnum>;

export const ShiftTypeEnum = z.enum(["day", "evening", "night"]);
export type ShiftType = z.infer<typeof ShiftTypeEnum>;

export const NoteTypeEnum = z.enum([
  "clinical",
  "nursing",
  "discharge",
  "progress",
  "referral",
]);
export type NoteType = z.infer<typeof NoteTypeEnum>;

// =============================================================================
// File Enums
// =============================================================================

export const FileResourceTypeEnum = z.enum([
  "lab_result",
  "prescription",
  "id_document",
  "discharge_summary",
  "imaging",
  "other",
]);
export type FileResourceType = z.infer<typeof FileResourceTypeEnum>;

// =============================================================================
// Admission & Facility Enums
// =============================================================================

export const AdmissionStatusEnum = z.enum([
  "pending",
  "admitted",
  "in_care",
  "discharge_pending",
  "discharged",
]);
export type AdmissionStatus = z.infer<typeof AdmissionStatusEnum>;

export const AdmissionTypeEnum = z.enum([
  "regular",
  "emergency",
  "day_care",
  "icu",
]);
export type AdmissionType = z.infer<typeof AdmissionTypeEnum>;

export const DischargeTypeEnum = z.enum([
  "improved",
  "against_advice",
  "transfer",
  "expired",
  "normal",
]);
export type DischargeType = z.infer<typeof DischargeTypeEnum>;

export const WardTypeEnum = z.enum([
  "general",
  "icu",
  "hdu",
  "maternity",
  "paediatric",
  "surgical",
  "private",
]);
export type WardType = z.infer<typeof WardTypeEnum>;

export const RoomTypeEnum = z.enum([
  "general",
  "private",
  "semi_private",
  "icu",
]);
export type RoomType = z.infer<typeof RoomTypeEnum>;

export const BedStatusEnum = z.enum([
  "available",
  "occupied",
  "maintenance",
  "reserved",
]);
export type BedStatus = z.infer<typeof BedStatusEnum>;

export const BedTypeEnum = z.enum(["standard", "icu", "hdu", "isolation"]);
export type BedType = z.infer<typeof BedTypeEnum>;

export const DepartmentTypeEnum = z.enum([
  "clinical",
  "surgical",
  "icu",
  "emergency",
  "diagnostic",
  "admin",
]);
export type DepartmentType = z.infer<typeof DepartmentTypeEnum>;

// =============================================================================
// Billing Enums
// =============================================================================

export const InvoiceStatusEnum = z.enum([
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "cancelled",
  "refunded",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const PaymentMethodEnum = z.enum([
  "cash",
  "card",
  "upi",
  "netbanking",
  "insurance",
  "waiver",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// =============================================================================
// Consent Enums
// =============================================================================

export const ConsentPurposeEnum = z.enum([
  "treatment",
  "research",
  "insurance",
  "marketing",
  "data_sharing",
  "abdm_exchange",
]);
export type ConsentPurpose = z.infer<typeof ConsentPurposeEnum>;

export const ConsentStatusEnum = z.enum([
  "granted",
  "suspended",
  "revoked",
  "expired",
]);
export type ConsentStatus = z.infer<typeof ConsentStatusEnum>;

export const ConsentGranteeTypeEnum = z.enum([
  "doctor",
  "facility",
  "system",
  "external_org",
]);
export type ConsentGranteeType = z.infer<typeof ConsentGranteeTypeEnum>;

export const ConsentChannelEnum = z.enum(["web", "app", "paper", "verbal"]);
export type ConsentChannel = z.infer<typeof ConsentChannelEnum>;

export const ConsentEventTypeEnum = z.enum([
  "granted",
  "revoked",
  "suspended",
  "expired",
  "modified",
  "viewed",
]);
export type ConsentEventType = z.infer<typeof ConsentEventTypeEnum>;

// =============================================================================
// Notification Enums
// =============================================================================

export const NotificationChannelEnum = z.enum([
  "in_app",
  "email",
  "sms",
  "push",
]);
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>;

export const NotificationStatusEnum = z.enum([
  "pending",
  "sent",
  "delivered",
  "failed",
  "read",
]);
export type NotificationStatus = z.infer<typeof NotificationStatusEnum>;

// =============================================================================
// Audit Enums
// =============================================================================

export const AuditOutcomeEnum = z.enum(["success", "failure", "partial"]);
export type AuditOutcome = z.infer<typeof AuditOutcomeEnum>;

export const AuditActionEnum = z.enum([
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_REGISTERED",
  "PATIENT_RECORD_ACCESSED",
  "PATIENT_SEARCHED",
  "ENCOUNTER_CREATED",
  "ENCOUNTER_UPDATED",
  "ENCOUNTER_FINALIZED",
  "PRESCRIPTION_CREATED",
  "PRESCRIPTION_CANCELLED",
  "MEDICATION_ADMINISTERED",
  "MEDICATION_OMITTED",
  "VITALS_RECORDED",
  "CRITICAL_VITAL_FLAGGED",
  "LAB_ORDER_CREATED",
  "LAB_RESULT_ENTERED",
  "LAB_RESULT_REVIEWED",
  "CONSENT_GRANTED",
  "CONSENT_REVOKED",
  "CONSENT_DENIED",
  "BREAK_GLASS_ACTIVATED",
  "BREAK_GLASS_DENIED",
  "INVOICE_CREATED",
  "PAYMENT_RECORDED",
  "ROLE_CHANGED",
  "DATA_EXPORTED",
  "FILE_ACCESSED",
  "TENANT_PROVISIONED",
  "TENANT_CONFIG_CHANGED",
  "BED_ASSIGNED",
  "BED_VACATED",
  "HANDOFF_SUBMITTED",
  "HANDOFF_ACKNOWLEDGED",
  "SUPPORT_TICKET_CREATED",
  "SUPPORT_TICKET_RESOLVED",
  "ESCALATION_FLAGGED",
  "DISCHARGE_ORDER_CREATED",
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

// =============================================================================
// Device Enums
// =============================================================================

export const DeviceTypeEnum = z.enum(["desktop", "mobile", "tablet"]);
export type DeviceType = z.infer<typeof DeviceTypeEnum>;

// =============================================================================
// Support Enums
// =============================================================================

export const TicketCategoryEnum = z.enum([
  "technical",
  "billing",
  "clinical",
  "privacy",
  "other",
]);
export type TicketCategory = z.infer<typeof TicketCategoryEnum>;

export const TicketPriorityEnum = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);
export type TicketPriority = z.infer<typeof TicketPriorityEnum>;

export const TicketStatusEnum = z.enum([
  "open",
  "in_progress",
  "pending_response",
  "resolved",
  "closed",
]);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

// =============================================================================
// Incident Enums
// =============================================================================

export const IncidentTypeEnum = z.enum([
  "data_breach",
  "unauthorized_access",
  "medication_error",
  "system_outage",
  "clinical_safety",
  "other",
]);
export type IncidentType = z.infer<typeof IncidentTypeEnum>;

export const IncidentSeverityEnum = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);
export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>;

export const IncidentStatusEnum = z.enum([
  "reported",
  "investigating",
  "contained",
  "resolved",
  "closed",
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

// =============================================================================
// Vitals Enums
// =============================================================================

export const TemperatureUnitEnum = z.enum(["C", "F"]);
export type TemperatureUnit = z.infer<typeof TemperatureUnitEnum>;

export const BloodGlucoseTypeEnum = z.enum([
  "fasting",
  "random",
  "post_prandial",
]);
export type BloodGlucoseType = z.infer<typeof BloodGlucoseTypeEnum>;

// =============================================================================
// Break-Glass Enums
// =============================================================================

export const BreakGlassReasonEnum = z.enum([
  "EMERGENCY",
  "CRITICAL_DETERIORATION",
  "ABSENT_PROVIDER",
  "DISASTER_SCENARIO",
]);
export type BreakGlassReason = z.infer<typeof BreakGlassReasonEnum>;
