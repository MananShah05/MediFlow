import { FastifyInstance } from "fastify";
import { LabOrderService } from "./lab-orders.service.js";
import { listLabOrdersSchema, createLabOrderSchema } from "./lab-orders.schema.js";

export async function labOrderRoutes(fastify: FastifyInstance) {
  const service = new LabOrderService(fastify.prisma);

  fastify.get("/lab-orders", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const query = listLabOrdersSchema.parse(request.query);
    return service.list(request.user.tenantId, query);
  });

  fastify.get("/lab-orders/stats", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: request.user.userId, tenantId: request.user.tenantId },
    });
    if (!doctor) return { pending: 0, unreviewed: 0 };

    const [pending, unreviewed] = await Promise.all([
      service.countPendingForDoctor(request.user.tenantId, doctor.id),
      service.countUnreviewedForDoctor(request.user.tenantId, doctor.id),
    ]);
    return { pending, unreviewed };
  });

  fastify.post("/lab-orders", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== "doctor") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Only doctors can order labs", status: 403 } });
    }

    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: request.user.userId, tenantId: request.user.tenantId },
    });
    if (!doctor) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Doctor profile not found", status: 404 } });

    const body = createLabOrderSchema.parse(request.body);
    const order = await service.create(request.user.tenantId, doctor.id, body);
    return reply.status(201).send({ data: order });
  });
}
