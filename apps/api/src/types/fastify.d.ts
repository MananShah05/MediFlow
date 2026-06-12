import { ExtendedPrismaClient } from "../plugins/prisma.js";
import Redis from "ioredis";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: ExtendedPrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
    role?: string;
    sessionId?: string;
  }
}
