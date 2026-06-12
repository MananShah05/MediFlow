import { FastifyInstance } from "fastify";
import { AdminService } from "./admin.service.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";

export async function adminRoutes(fastify: FastifyInstance) {
  const service = new AdminService(fastify.prisma);

  // GET /api/v1/admin/dashboard
  fastify.get("/admin/dashboard", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only administrators can access the admin dashboard", status: 403 },
      });
    }

    const data = await service.getDashboardData(user.tenantId);
    return { data };
  });

  // POST /api/v1/admin/staff
  fastify.post("/admin/staff", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only administrators can provision new staff", status: 403 },
      });
    }

    const staffSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
      role: z.enum(["doctor", "nurse", "admin"]),
      specialization: z.string().optional(),
      registrationNumber: z.string().optional(),
      departmentId: z.string().uuid().optional(),
    });

    const body = staffSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS || 10);
    const ipAddress = request.ip === "::1" ? "127.0.0.1" : request.ip;
    const userAgent = request.headers["user-agent"];

    try {
      const result = await service.provisionStaff(
        user.tenantId,
        user.userId,
        ipAddress,
        userAgent,
        {
          email: body.email,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          role: body.role,
          specialization: body.specialization,
          registrationNumber: body.registrationNumber,
          departmentId: body.departmentId,
        }
      );

      return reply.status(201).send({ data: result });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: err.message, status: 400 },
      });
    }
  });

  // GET /api/v1/admin/wards
  fastify.get("/admin/wards", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only administrators can view ward layouts", status: 403 },
      });
    }

    const data = await service.getWardLayout(user.tenantId);
    return { data };
  });

  // GET /api/v1/admin/audit-logs
  fastify.get("/admin/audit-logs", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only administrators can access audit logs", status: 403 },
      });
    }

    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit || "50"), 200);
    const offset = parseInt(query.offset || "0");

    const data = await service.getAuditLogs(user.tenantId, limit, offset);
    return { data };
  });

  // GET /api/v1/admin/audit-logs/export.csv
  fastify.get("/admin/audit-logs/export.csv", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only administrators can export audit logs", status: 403 },
      });
    }

    const csv = await service.exportAuditCsv(user.tenantId);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="mediflow-audit-log-${new Date().toISOString().split("T")[0]}.csv"`);
    return reply.send(csv);
  });
}
