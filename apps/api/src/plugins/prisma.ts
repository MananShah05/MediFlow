import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { tenantPrismaExtension } from "../lib/prisma-tenant.js";

// Instantiate base client with tuned connection pool settings
const basePrisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"],
});


// Extend client with tenant transaction support
const prisma = basePrisma.$extends(tenantPrismaExtension);

type ExtendedPrismaClient = typeof prisma;

declare module "fastify" {
  interface FastifyInstance {
    prisma: ExtendedPrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await basePrisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (_instance) => {
    await basePrisma.$disconnect();
  });
});

export default prismaPlugin;
export type { ExtendedPrismaClient };
