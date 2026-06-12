import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function medicationRoutes(fastify: FastifyInstance) {
  // GET /api/v1/medications — Search drug master
  fastify.get("/medications", {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const query = z.object({
      search: z.string().min(1).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);

    const where: any = {
      isActive: true,
      OR: [
        { tenantId: request.user.tenantId },
        { tenantId: null }, // Platform-level medications
      ],
    };

    if (query.search) {
      where.AND = {
        OR: [
          { genericName: { contains: query.search, mode: "insensitive" } },
          { brandNames: { has: query.search } },
        ],
      };
    }

    const skip = (query.page - 1) * query.limit;

    const [medications, total] = await Promise.all([
      fastify.prisma.medication.findMany({
        where,
        orderBy: { genericName: "asc" },
        skip,
        take: query.limit,
      }),
      fastify.prisma.medication.count({ where }),
    ]);

    return {
      data: medications,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  });
}
