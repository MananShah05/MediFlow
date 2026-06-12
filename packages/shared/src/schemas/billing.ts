import { z } from "zod";
import { UuidSchema, TimestampSchema } from "./common.js";
import { InvoiceStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from "../enums.js";

// =============================================================================
// Invoice & Item Schemas
// =============================================================================

export const InvoiceItemSchema = z.object({
  id: UuidSchema,
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  totalPrice: z.number().positive(),
});

export const InvoiceSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema,
  patientId: UuidSchema,
  encounterId: UuidSchema.optional(),
  invoiceNumber: z.string().min(1),
  status: InvoiceStatusEnum,
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  dueDate: TimestampSchema,
  items: z.array(InvoiceItemSchema),
  insuranceClaimEnabled: z.boolean().default(false),
  insurancePayer: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceAuthCode: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  tenantId: true,
  invoiceNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: true,
}).extend({
  items: z.array(InvoiceItemSchema.omit({ id: true, totalPrice: true })),
});

// =============================================================================
// Payment Schemas
// =============================================================================

export const PaymentSchema = z.object({
  id: UuidSchema,
  tenantId: UuidSchema,
  invoiceId: UuidSchema,
  amount: z.number().positive(),
  paymentMethod: PaymentMethodEnum,
  status: PaymentStatusEnum,
  transactionRef: z.string().optional(),
  failureReason: z.string().optional(),
  recordedBy: UuidSchema,
  recordedAt: TimestampSchema,
});

export const RecordPaymentSchema = PaymentSchema.omit({
  id: true,
  tenantId: true,
  status: true,
  recordedBy: true,
  recordedAt: true,
});
