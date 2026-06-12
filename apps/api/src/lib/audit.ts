import crypto from "crypto";
import { PrismaClient, AuditAction, AuditOutcome } from "@prisma/client";
import { logger } from "./logger.js";

// Genesis hash when no previous logs exist
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

interface AuditLogParams {
  tenantId?: string;
  userId: string;
  userRole: string;
  patientId?: string;
  actionType: AuditAction;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent?: string;
  outcome: AuditOutcome;
  failureReason?: string;
  breakGlass?: boolean;
  breakGlassReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a secure audit log entry using hash chaining to prevent tampering.
 */
export async function writeAuditLog(prisma: PrismaClient, params: AuditLogParams): Promise<string> {
  try {
    // 1. Fetch latest audit log for hash chain
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" },
      select: { hash: true },
    });

    const prevHash = latestLog?.hash || GENESIS_HASH;

    // 2. Prepare data for hashing
    const timestampStr = new Date().toISOString();
    const metadataStr = JSON.stringify(params.metadata || {});
    
    // Hash sequence: prevHash | userId | userRole | actionType | resourceType | resourceId | outcome | timestamp | metadata
    const dataToHash = [
      prevHash,
      params.userId,
      params.userRole,
      params.actionType,
      params.resourceType,
      params.resourceId,
      params.outcome,
      timestampStr,
      metadataStr
    ].join("|");

    const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

    // 3. Insert into DB (as transactions)
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        userRole: params.userRole,
        patientId: params.patientId,
        actionType: params.actionType,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        failureReason: params.failureReason,
        breakGlass: params.breakGlass || false,
        breakGlassReason: params.breakGlassReason,
        metadata: params.metadata || {},
        prevHash,
        hash,
        timestamp: timestampStr,
      },
    });

    return hash;
  } catch (error) {
    logger.error({ error, params }, "Failed to write secure audit log");
    // Per HIPAA / DPDP rules, audit log failures must not be ignored
    throw new Error("Audit logging system failure");
  }
}
