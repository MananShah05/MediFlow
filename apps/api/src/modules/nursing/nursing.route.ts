import { FastifyInstance } from "fastify";
import { NursingService } from "./nursing.service.js";
import { z } from "zod";

export async function nursingRoutes(fastify: FastifyInstance) {
  const service = new NursingService(fastify.prisma);

  // GET /api/v1/nursing/dashboard
  fastify.get("/nursing/dashboard", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "nurse") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only nurses can access the nursing dashboard", status: 403 },
      });
    }

    const data = await service.getDashboardData(user.tenantId, user.userId);
    if (!data) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Nurse profile not found", status: 404 },
      });
    }

    return { data };
  });

  // POST /api/v1/nursing/mar/:id/administer
  fastify.post("/nursing/mar/:id/administer", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "nurse") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only nurses can administer medications", status: 403 },
      });
    }

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const nurse = await fastify.prisma.nurse.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
    });

    if (!nurse) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Nurse profile not found", status: 404 },
      });
    }

    const ipAddress = request.ip === "::1" ? "127.0.0.1" : request.ip;
    const userAgent = request.headers["user-agent"];

    const result = await service.administerMedication(
      user.tenantId,
      user.userId,
      nurse.id,
      id,
      ipAddress,
      userAgent
    );

    if (!result) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Medication administration schedule not found", status: 404 },
      });
    }

    return { data: result };
  });

  // POST /api/v1/nursing/vitals
  fastify.post("/nursing/vitals", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "nurse") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only nurses can log vitals", status: 403 },
      });
    }

    const nurse = await fastify.prisma.nurse.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
    });

    if (!nurse) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Nurse profile not found", status: 404 },
      });
    }

    const vitalSchema = z.object({
      patientId: z.string().uuid(),
      admissionId: z.string().uuid().optional(),
      systolicBp: z.number().optional(),
      diastolicBp: z.number().optional(),
      pulse: z.number().optional(),
      temperature: z.number().optional(),
      temperatureUnit: z.enum(["C", "F"]).default("C"),
      spo2: z.number().optional(),
      respiratoryRate: z.number().optional(),
      weightKg: z.number().optional(),
      heightCm: z.number().optional(),
      painScore: z.number().min(0).max(10).optional(),
      notes: z.string().optional(),
    });

    const body = vitalSchema.parse(request.body);
    const ipAddress = request.ip === "::1" ? "127.0.0.1" : request.ip;
    const userAgent = request.headers["user-agent"];

    const vital = await service.recordVitals(
      user.tenantId,
      user.userId,
      ipAddress,
      userAgent,
      body
    );

    return reply.status(201).send({ data: vital });
  });

  // POST /api/v1/nursing/handoffs
  fastify.post("/nursing/handoffs", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "nurse") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only nurses can submit shift handoffs", status: 403 },
      });
    }

    const nurse = await fastify.prisma.nurse.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
    });

    if (!nurse) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Nurse profile not found", status: 404 },
      });
    }

    const handoffSchema = z.object({
      wardId: z.string().uuid(),
      shiftDate: z.string(),
      outgoingShift: z.enum(["day", "evening", "night", "rotating"]),
      incomingNurseId: z.string().uuid().optional(),
      summaryNotes: z.string().optional(),
    });

    const body = handoffSchema.parse(request.body);
    const ipAddress = request.ip === "::1" ? "127.0.0.1" : request.ip;
    const userAgent = request.headers["user-agent"];

    const handoff = await service.submitHandoff(
      user.tenantId,
      user.userId,
      nurse.id,
      ipAddress,
      userAgent,
      body
    );

    return reply.status(201).send({ data: handoff });
  });
}
