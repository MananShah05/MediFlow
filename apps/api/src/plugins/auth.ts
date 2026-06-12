import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      tenantId: string;
      role: string;
      sessionId: string;
    };
    user: {
      userId: string;
      tenantId: string;
      role: string;
      sessionId: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "15m",
    },
  });

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      fastify.log.error(err, "JWT verification failed");
      reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required or token expired",
          status: 401,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
});

export default authPlugin;
