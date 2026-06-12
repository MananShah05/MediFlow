import { Prisma } from "@prisma/client";

export type TenantTransactionClient = Prisma.TransactionClient;

export const tenantPrismaExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    client: {
      async $tenantTransaction<T>(
        tenantId: string,
        fn: (tx: Prisma.TransactionClient) => Promise<T>
      ): Promise<T> {
        // Enforce UUID validation on tenantId to prevent SQL injection
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
          throw new Error("Invalid tenant ID format");
        }

        // We use client.$transaction directly
        return (client as any).$transaction(async (tx: Prisma.TransactionClient) => {
          // Set session variable for RLS
          await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
          return fn(tx);
        });
      },
    },
  });
});
