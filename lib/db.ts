import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * On Vercel the deployed filesystem is read-only and ephemeral, but this
 * prototype writes on every step of the flow (drafts, the demo claim). So on
 * Vercel we copy the build-time seeded database (bundled via
 * outputFileTracingIncludes in next.config.ts) to /tmp — the one writable
 * path — on cold start and point Prisma there. Locally this is inert and
 * DATABASE_URL is used as-is.
 *
 * Deliberately prototype-grade (open-decisions.md B12): /tmp is per-instance
 * and resets on cold starts. Throwaway demo data by design — never a store.
 */
function vercelDatasourceUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const writablePath = "/tmp/dev.db";
  if (!existsSync(writablePath)) {
    copyFileSync(join(process.cwd(), "prisma", "dev.db"), writablePath);
  }
  return `file:${writablePath}`;
}

// Prisma client singleton — avoids exhausting connections during dev hot-reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = vercelDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
