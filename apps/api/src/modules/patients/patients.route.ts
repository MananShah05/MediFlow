import { FastifyInstance } from "fastify";
import { PatientService } from "./patients.service.js";
import { listPatientsSchema, getPatientParamsSchema, createPatientSchema } from "./patients.schema.js";
import { z } from "zod";

export async function patientRoutes(fastify: FastifyInstance) {
  const service = new PatientService(fastify.prisma);

  // GET /api/v1/patients — List & search patients
  fastify.get("/patients", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = request.user;
    const query = listPatientsSchema.parse(request.query);
    const result = await service.list(user.tenantId, query);
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
    return { data };
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
