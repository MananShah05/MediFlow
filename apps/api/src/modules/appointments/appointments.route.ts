import { FastifyInstance } from "fastify";
import { AppointmentService } from "./appointments.service.js";
import { listAppointmentsSchema, createAppointmentSchema, updateAppointmentStatusSchema } from "./appointments.schema.js";
import { z } from "zod";

export async function appointmentRoutes(fastify: FastifyInstance) {
  const service = new AppointmentService(fastify.prisma);

  // GET /api/v1/appointments
  fastify.get("/appointments", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = request.user;
    const query = listAppointmentsSchema.parse(request.query);

    // If doctor, scope to their own appointments unless they explicitly search another doctor
    if (user.role === "doctor" && !query.doctorId) {
      // Look up the doctor record for this user
      const doctor = await fastify.prisma.doctor.findFirst({
        where: { userId: user.userId, tenantId: user.tenantId },
      });
      if (doctor) query.doctorId = doctor.id;
    }

    return service.list(user.tenantId, query);
  });

  // GET /api/v1/appointments/today/stats — Dashboard stats
  fastify.get("/appointments/today/stats", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const user = request.user;
    const today = new Date().toISOString().split("T")[0] || "";

    const doctor = await fastify.prisma.doctor.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId },
    });

    if (!doctor) {
      return { total: 0, completed: 0, scheduled: 0 };
    }

    return service.countForDoctor(user.tenantId, doctor.id, today);
  });

  // GET /api/v1/appointments/:id
  fastify.get("/appointments/:id", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const appointment = await service.getById(request.user.tenantId, id);

    if (!appointment) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Appointment not found", status: 404 },
      });
    }

    return { data: appointment };
  });

  // POST /api/v1/appointments
  fastify.post("/appointments", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (!["doctor", "admin", "patient"].includes(user.role)) {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Insufficient permissions", status: 403 },
      });
    }

    const body = createAppointmentSchema.parse(request.body);
    const appointment = await service.create(user.tenantId, user.userId, body);
    return reply.status(201).send({ data: appointment });
  });

  // PATCH /api/v1/appointments/:id/status
  fastify.patch("/appointments/:id/status", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateAppointmentStatusSchema.parse(request.body);
    const result = await service.updateStatus(request.user.tenantId, id, request.user.userId, body);

    if (!result) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Appointment not found", status: 404 },
      });
    }

    return { data: result };
  });
}
