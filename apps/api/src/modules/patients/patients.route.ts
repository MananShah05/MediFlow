import { FastifyInstance } from "fastify";
import { PatientService } from "./patients.service.js";
import {
  listPatientsSchema,
  getPatientParamsSchema,
  createPatientSchema,
  updatePatientProfileSchema,
  updateSecuritySettingsSchema,
} from "./patients.schema.js";
import { z } from "zod";
import { AuditAction, AuditOutcome } from "@prisma/client";
import { writeAuditLog } from "../../lib/audit.js";

export async function patientRoutes(fastify: FastifyInstance) {
  const service = new PatientService(fastify.prisma, fastify.redis);


  // GET /api/v1/patients — List & search patients
  fastify.get("/patients", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    const query = listPatientsSchema.parse(request.query);
    const result = await service.list(user.tenantId, query);
    reply.header("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return result;
  });


  // GET /api/v1/patients/me/dashboard — Get logged-in patient dashboard stats
  fastify.get("/patients/me/dashboard", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    const data = await service.getDashboardData(user.tenantId, user.userId);
    if (!data) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Patient profile not found", status: 404 },
      });
    }
    reply.header("Cache-Control", "private, max-age=30, stale-while-revalidate=30");
    return { data };
  });


  // GET /api/v1/patients/me/profile — Get logged-in patient profile and user details
  fastify.get("/patients/me/profile", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    const data = await service.getProfileAndUserSettings(user.tenantId, user.userId);
    if (!data) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Patient profile not found", status: 404 },
      });
    }

    // Write audit log for profile access
    await writeAuditLog(fastify.prisma as any, {
      tenantId: user.tenantId,
      userId: user.userId,
      userRole: user.role,
      patientId: data.patient.id,
      actionType: AuditAction.PATIENT_RECORD_ACCESSED,
      resourceType: "PatientProfile",
      resourceId: data.patient.profile?.id || data.patient.id,
      ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      outcome: AuditOutcome.success,
      metadata: { action: "read_profile", uhid: data.patient.uhid },
    }).catch(err => {
      fastify.log.error(err, "Failed to write audit log for profile read");
    });

    reply.header("Cache-Control", "private, max-age=60");
    return { data };
  });


  // PUT /api/v1/patients/me/profile — Update patient profile (with optimistic locking)
  fastify.put("/patients/me/profile", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const user = request.user;
    const body = updatePatientProfileSchema.parse(request.body);


    try {
      const updatedProfile = await service.updateProfile(user.tenantId, user.userId, body);

      // Write audit log for profile update
      await writeAuditLog(fastify.prisma as any, {
        tenantId: user.tenantId,
        userId: user.userId,
        userRole: user.role,
        patientId: updatedProfile.patientId,
        actionType: AuditAction.PATIENT_RECORD_ACCESSED,
        resourceType: "PatientProfile",
        resourceId: updatedProfile.id,
        ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
        userAgent: request.headers["user-agent"] || "unknown",
        outcome: AuditOutcome.success,
        metadata: { action: "update_profile", fieldsChanged: Object.keys(body) },
      }).catch(err => {
        fastify.log.error(err, "Failed to write audit log for profile update");
      });

      return { data: updatedProfile };
    } catch (error: any) {
      if (error.message.includes("Version mismatch")) {
        return reply.status(409).send({
          error: { code: "CONFLICT", message: error.message, status: 409 },
        });
      }
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: error.message, status: 400 },
      });
    }
  });

  // PUT /api/v1/patients/me/security — Update user security settings
  fastify.put("/patients/me/security", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const user = request.user;
    const body = updateSecuritySettingsSchema.parse(request.body);


    try {
      const result = await service.updateSecuritySettings(user.tenantId, user.userId, body);

      // Write audit log for security updates
      await writeAuditLog(fastify.prisma as any, {
        tenantId: user.tenantId,
        userId: user.userId,
        userRole: user.role,
        actionType: AuditAction.TENANT_CONFIG_CHANGED,
        resourceType: "UserSecurity",
        resourceId: user.userId,
        ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
        userAgent: request.headers["user-agent"] || "unknown",
        outcome: AuditOutcome.success,
        metadata: {
          action: "update_security",
          passwordChanged: !!body.newPassword,
          mfaToggled: body.mfaEnabled !== undefined,
          timezoneChanged: body.timezone !== undefined,
          languageChanged: body.language !== undefined,
        },
      }).catch(err => {
        fastify.log.error(err, "Failed to write audit log for security update");
      });

      return { data: result };
    } catch (error: any) {
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: error.message, status: 400 },
      });
    }
  });

  // POST /api/v1/patients/me/consents — Grant consent
  fastify.post("/patients/me/consents", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    const patient = await fastify.prisma.patient.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
    });

    if (!patient) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Patient profile not found", status: 404 },
      });
    }

    const consentSchema = z.object({
      purpose: z.enum(["treatment", "research", "insurance", "marketing", "data_sharing", "abdm_exchange"]),
      dataScope: z.array(z.string()).default([]),
      granteeType: z.enum(["doctor", "facility", "system", "external_org"]),
      granteeId: z.string(),
      expiresAt: z.string().datetime().nullable().optional(),
    });

    const body = consentSchema.parse(request.body);
    const consent = await fastify.prisma.consent.create({
      data: {
        tenantId: user.tenantId,
        patientId: patient.id,
        consentingUserId: user.userId,
        purpose: body.purpose,
        dataScope: body.dataScope,
        granteeType: body.granteeType,
        granteeId: body.granteeId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        status: "granted",
        consentTextVersion: "1.0",
      },
    });

    return reply.status(201).send({ data: consent });
  });

  // GET /api/v1/patients/:id — Get patient with full record
  fastify.get("/patients/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    const { id } = getPatientParamsSchema.parse(request.params);
    const patient = await service.getById(user.tenantId, id);

    if (!patient) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Patient not found", status: 404 },
      });
    }

    reply.header("Cache-Control", "private, max-age=60");
    return { data: patient };
  });


  // POST /api/v1/patients — Create new patient
  fastify.post("/patients", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    // Only doctor and admin can create patients
    if (!["doctor", "admin", "super_admin"].includes(user.role)) {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Insufficient permissions", status: 403 },
      });
    }

    const body = createPatientSchema.parse(request.body);
    const patient = await service.create(user.tenantId, user.userId, body);
    return reply.status(201).send({ data: patient });
  });
}
