import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  tenantId?: string;
  userId?: string;
  role?: string;
  sessionId?: string;
  requestId: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return contextStorage.getStore();
}
