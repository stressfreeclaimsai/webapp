import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runtimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

// A hung database must not hang the health check: past this budget the
// database is reported unreachable so an uptime monitor can alert.
const DATABASE_PROBE_TIMEOUT_MS = 5000;

async function probeDatabase(): Promise<"ok" | "unreachable"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("database probe timed out")), DATABASE_PROBE_TIMEOUT_MS);
  });
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    return "ok";
  } catch {
    // Deliberately no error detail in the response: connection strings and
    // driver messages stay out of anything client-visible (PRODUCT.md).
    return "unreachable";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Uptime-check target (product/EXTERNAL-APP-SETUP.md §5). Reports the runtime
 * mode and whether the database answers — the one dependency every intake
 * step needs — so a deploy with missing or wrong DATABASE_URL shows as
 * degraded here instead of only as 500s on submit.
 */
export async function GET() {
  const config = runtimeConfig();
  const database = await probeDatabase();
  const healthy = database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      mode: config.mode,
      database,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
