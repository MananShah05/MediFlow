import { FastifyRequest, FastifyReply } from "fastify";
import { contextStorage } from "../lib/context.js";
import { TenantMismatchError } from "../lib/errors.js";

export async function tenantContextMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  const user = request.user; // populated by request.jwtVerify() in authenticate hook

  if (user) {
    // 1. Populate request context
    request.tenantId = user.tenantId;
    request.userId = user.userId;
    request.role = user.role;
    request.sessionId = user.sessionId;

    // 2. Validate tenant matches host subdomain (if applicable)
    // In production, we check request.headers.host or custom headers
    const tenantHeader = request.headers["x-tenant-id"];
    if (tenantHeader && tenantHeader !== user.tenantId) {
      throw new TenantMismatchError("User tenant does not match request tenant header");
    }

    // 3. Bind context to AsyncLocalStorage for logging and database context
    contextStorage.enterWith({
      tenantId: user.tenantId,
      userId: user.userId,
      role: user.role,
      sessionId: user.sessionId,
      requestId: request.id,
    });
  } else {
    // For unauthenticated requests (like login/health), only bind requestId
    contextStorage.enterWith({
      requestId: request.id,
    });
  }
}
