import { FastifyInstance } from "fastify";
import { SuperAdminService } from "./super-admin.service.js";

export async function superAdminRoutes(fastify: FastifyInstance) {
  const service = new SuperAdminService(fastify.prisma);

  fastify.get("/super-admin/dashboard", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only super administrators can access this resource", status: 403 },
      });
    }

    const data = await service.getDashboardData();
    return { data };
  });

  fastify.get("/super-admin/tenants", {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== "super_admin") {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Only super administrators can access this resource", status: 403 },
      });
    }

    const data = await service.listTenants();
    return { data };
  });
}
