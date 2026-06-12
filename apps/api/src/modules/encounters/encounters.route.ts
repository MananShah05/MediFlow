import { FastifyInstance } from "fastify";
import { EncounterService } from "./encounters.service.js";
import { listEncountersSchema, createEncounterSchema, updateEncounterSchema, addDiagnosisSchema } from "./encounters.schema.js";
import { z } from "zod";

export async function encounterRoutes(fastify: FastifyInstance) {
  const service = new EncounterService(fastify.prisma);

  // GET /api/v1/encounters
  fastify.get("/encounters", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = request.user;
    const query = listEncountersSchema.parse(request.query);

    if (user.role === "doctor" && !query.doctorId) {
      const doctor = await fastify.prisma.doctor.findFirst({
        where: { userId: user.userId, tenantId: user.tenantId },
      });
      if (doctor) query.doctorId = doctor.id;
    }

    return service.list(user.tenantId, query);
  });

  // GET /api/v1/encounters/stats — Dashboard encounter counts
  fastify.get("/encounters/stats", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = request.user;
    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId },
    });
    if (!doctor) return { draft: 0, inProgress: 0, finalized: 0, total: 0 };
    return service.countByStatus(user.tenantId, doctor.id);
  });

  // GET /api/v1/encounters/:id
  fastify.get("/encounters/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const encounter = await service.getById(request.user.tenantId, id);
    if (!encounter) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Encounter not found", status: 404 },
      });
    }
    return { data: encounter };
  });

  // POST /api/v1/encounters
  fastify.post("/encounters", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "doctor") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only doctors can create encounters", status: 403 },
      });
    }

    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId },
    });
    if (!doctor) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Doctor profile not found", status: 404 },
      });
    }

    const body = createEncounterSchema.parse(request.body);
    const encounter = await service.create(user.tenantId, user.userId, doctor.id, body);
    return reply.status(201).send({ data: encounter });
  });

  // PATCH /api/v1/encounters/:id — Update SOAP fields
  fastify.patch("/encounters/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateEncounterSchema.parse(request.body);

    try {
      const encounter = await service.update(request.user.tenantId, id, request.user.userId, body);
      if (!encounter) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Encounter not found", status: 404 },
        });
      }
      return { data: encounter };
    } catch (err: any) {
      return reply.status(409).send({
        error: { code: "CONFLICT", message: err.message, status: 409 },
      });
    }
  });

  // POST /api/v1/encounters/:id/finalize
  fastify.post("/encounters/:id/finalize", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    try {
      const encounter = await service.finalize(request.user.tenantId, id, request.user.userId);
      if (!encounter) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Encounter not found", status: 404 },
        });
      }
      return { data: encounter };
    } catch (err: any) {
      return reply.status(409).send({
        error: { code: "CONFLICT", message: err.message, status: 409 },
      });
    }
  });

  // POST /api/v1/encounters/:id/diagnoses
  fastify.post("/encounters/:id/diagnoses", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = addDiagnosisSchema.parse(request.body);
    const diagnosis = await service.addDiagnosis(request.user.tenantId, id, request.user.userId, body);

    if (!diagnosis) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Encounter not found", status: 404 },
      });
    }

    return reply.status(201).send({ data: diagnosis });
  });

  // DELETE /api/v1/encounters/:encounterId/diagnoses/:diagnosisId
  fastify.delete("/encounters/:encounterId/diagnoses/:diagnosisId", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const params = z.object({
      encounterId: z.string().uuid(),
      diagnosisId: z.string().uuid(),
    }).parse(request.params);

    await service.removeDiagnosis(request.user.tenantId, params.diagnosisId);
    return { success: true };
  });
}
