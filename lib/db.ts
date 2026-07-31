import { PrismaClient } from "@prisma/client";

/**
 * Production-track Prisma singleton. The current branch always uses
 * PostgreSQL; environment separation is expressed entirely through
 * DATABASE_URL/DIRECT_URL. No serverless filesystem fallback is allowed.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
