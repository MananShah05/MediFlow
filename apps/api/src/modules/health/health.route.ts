import { FastifyInstance } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      // 1. Check database connectivity
      // Using queryRaw to avoid any model scope issues
      await fastify.prisma.$queryRaw`SELECT 1`;

      // 2. Check redis connectivity
      let redisStatus = "unconfigured";
      if (fastify.redis) {
        await fastify.redis.ping();
        redisStatus = "healthy";
      }

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: "healthy",
          redis: redisStatus,
        },
      };
    } catch (error) {
      fastify.log.error(error, "Health check failed");
      reply.status(500).send({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "One or more services are unhealthy",
      });
    }
  });
}
