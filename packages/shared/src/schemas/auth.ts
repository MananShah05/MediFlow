import { z } from "zod";
import { UuidSchema, EmailSchema, PhoneSchema, NonEmptyString, IpAddressSchema } from "./common.js";
import { UserRoleEnum, MfaMethodEnum } from "../enums.js";

// =============================================================================
// Login
// =============================================================================

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().min(1, "Tenant is required"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
  mfaRequired: z.boolean(),
  mfaChallengeToken: z.string().optional(),
  user: z.object({
    id: UuidSchema,
    email: z.string(),
    role: UserRoleEnum,
    tenantId: UuidSchema,
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// =============================================================================
// MFA
// =============================================================================

export const MfaVerifyRequestSchema = z.object({
  challengeToken: z.string().min(1),
  otpCode: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});
export type MfaVerifyRequest = z.infer<typeof MfaVerifyRequestSchema>;

export const MfaSetupRequestSchema = z.object({
  method: MfaMethodEnum,
});
export type MfaSetupRequest = z.infer<typeof MfaSetupRequestSchema>;

export const MfaSetupResponseSchema = z.object({
  secret: z.string().optional(),
  qrCodeUrl: z.string().url().optional(),
  backupCodes: z.array(z.string()).optional(),
});
export type MfaSetupResponse = z.infer<typeof MfaSetupResponseSchema>;

// =============================================================================
// Registration
// =============================================================================

export const RegisterRequestSchema = z
  .object({
    email: EmailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/,
        "Password must include uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
    fullName: NonEmptyString.max(200),
    phone: PhoneSchema.optional(),
    tenantSlug: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// =============================================================================
// Token refresh
// =============================================================================

export const TokenRefreshResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
});
export type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;

// =============================================================================
// Password
// =============================================================================

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/,
        "Password must include uppercase, lowercase, number, and special character"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  });
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
  tenantSlug: z.string().min(1),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/,
        "Password must include uppercase, lowercase, number, and special character"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// =============================================================================
// JWT payload
// =============================================================================

export const JwtPayloadSchema = z.object({
  sub: UuidSchema,
  tenantId: UuidSchema,
  role: UserRoleEnum,
  permissions: z.array(z.string()),
  jti: z.string(),
  iat: z.number().int(),
  exp: z.number().int(),
  sessionId: UuidSchema,
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// =============================================================================
// Session
// =============================================================================

export const SessionSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  tenantId: UuidSchema,
  role: UserRoleEnum,
  ipAddress: IpAddressSchema,
  userAgent: z.string(),
  createdAt: z.string(),
  lastActiveAt: z.string(),
  expiresAt: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;
