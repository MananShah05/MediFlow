import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import crypto from "crypto";
import { ZodError } from "zod";


import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import authPlugin from "./plugins/auth.js";
import { tenantContextMiddleware } from "./middleware/tenant-context.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { healthRoutes } from "./modules/health/health.route.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { patientRoutes } from "./modules/patients/patients.route.js";
import { appointmentRoutes } from "./modules/appointments/appointments.route.js";
import { encounterRoutes } from "./modules/encounters/encounters.route.js";
import { prescriptionRoutes } from "./modules/prescriptions/prescriptions.route.js";
import { labOrderRoutes } from "./modules/lab-orders/lab-orders.route.js";
import { medicationRoutes } from "./modules/medications/medications.route.js";
import { diagnosisRoutes } from "./modules/diagnoses/diagnoses.route.js";
import { nursingRoutes } from "./modules/nursing/nursing.route.js";
import { adminRoutes } from "./modules/admin/admin.route.js";
import { superAdminRoutes } from "./modules/super-admin/super-admin.route.js";
import { AppError } from "./lib/errors.js";

function getAllowedOrigins() {
  return env.CLIENT_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function buildApp() {
  const fastify = Fastify({
    loggerInstance: logger,
    genReqId: () => crypto.randomUUID(),
  });

  const allowedOrigins = getAllowedOrigins();

  await fastify.register(cors, {
    origin:
      env.NODE_ENV === "development"
        ? true
        : allowedOrigins && allowedOrigins.length > 0
          ? allowedOrigins
          : false,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
  });

  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      // Use client IP address
      return (request.headers["x-forwarded-for"] as string) || request.ip;
    },
  });

  await fastify.register(cookie);

  await fastify.register(prismaPlugin);
  await fastify.register(redisPlugin);
  await fastify.register(authPlugin);

  fastify.addHook("onRequest", requestIdMiddleware);
  fastify.addHook("preHandler", tenantContextMiddleware);

  await fastify.register(healthRoutes, { prefix: "/api/v1" });
  await fastify.register(authRoutes, { prefix: "/api/v1" });
  await fastify.register(patientRoutes, { prefix: "/api/v1" });
  await fastify.register(appointmentRoutes, { prefix: "/api/v1" });
  await fastify.register(encounterRoutes, { prefix: "/api/v1" });
  await fastify.register(prescriptionRoutes, { prefix: "/api/v1" });
  await fastify.register(labOrderRoutes, { prefix: "/api/v1" });
  await fastify.register(medicationRoutes, { prefix: "/api/v1" });
  await fastify.register(diagnosisRoutes, { prefix: "/api/v1" });
  await fastify.register(nursingRoutes, { prefix: "/api/v1" });
  await fastify.register(adminRoutes, { prefix: "/api/v1" });
  await fastify.register(superAdminRoutes, { prefix: "/api/v1" });

  fastify.setErrorHandler((error: any, request, reply) => {
    const timestamp = new Date().toISOString();

    if (error instanceof AppError) {
      request.log.warn({ err: error }, "AppError handled");
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          status: error.statusCode,
          requestId: request.id,
          timestamp,
          details: error.details,
        },
      });
    }

    if (error instanceof ZodError) {
      request.log.warn({ err: error }, "Zod validation error handled");
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload or parameters",
          status: 400,
          requestId: request.id,
          timestamp,
          details: {
            validation: error.issues,
          },
        },
      });
    }

    if (error.validation) {
      request.log.warn({ err: error }, "Validation error handled");
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload or parameters",
          status: 400,
          requestId: request.id,
          timestamp,
          details: {
            validation: error.validation,
          },
        },
      });
    }

    request.log.error({ err: error }, "Unhandled server error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : error.message,
        status: 500,
        requestId: request.id,
        timestamp,
      },
    });
  });

  return fastify;
}

export const app = await buildApp();

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`CareOS API Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (process.env.VERCEL !== "1" && env.NODE_ENV !== "test") {
  start();
}

export default app;
