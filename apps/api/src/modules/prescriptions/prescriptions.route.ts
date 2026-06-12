import { FastifyInstance } from "fastify";
import { PrescriptionService } from "./prescriptions.service.js";
import { listPrescriptionsSchema, createPrescriptionSchema } from "./prescriptions.schema.js";
import { z } from "zod";

export async function prescriptionRoutes(fastify: FastifyInstance) {
  const service = new PrescriptionService(fastify.prisma);

  fastify.get("/prescriptions", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const query = listPrescriptionsSchema.parse(request.query);
    return service.list(request.user.tenantId, query);
  });

  fastify.get("/prescriptions/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const rx = await service.getById(request.user.tenantId, id);
    if (!rx) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Prescription not found", status: 404 } });
    return { data: rx };
  });

  fastify.post("/prescriptions", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== "doctor") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Only doctors can prescribe", status: 403 } });
    }

    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: request.user.userId, tenantId: request.user.tenantId },
    });
    if (!doctor) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Doctor profile not found", status: 404 } });

    const body = createPrescriptionSchema.parse(request.body);
    const prescription = await service.create(request.user.tenantId, doctor.id, body);
    return reply.status(201).send({ data: prescription });
  });
}
