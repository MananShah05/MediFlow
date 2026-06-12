import { FastifyRequest, FastifyReply } from "fastify";

export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply) {
  reply.header("X-Request-ID", request.id);
}
