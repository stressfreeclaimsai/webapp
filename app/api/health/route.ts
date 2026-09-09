import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runtimeConfig } from "@/lib/runtime-config";
import { missingWorkosVars, staffAuthProvider } from "@/lib/staff-auth-provider";

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
 * Which staff sign-in the deployment is actually running. "unconfigured"
 * means a managed runtime whose WorkOS variables are absent — the staff
 * surface fails closed (404) in that state.
 */
function staffAuthStatus(): {
  staffAuth: "workos" | "local" | "unconfigured";
  /** Variable NAMES still unset (never values) — only present when unconfigured. */
  staffAuthMissing?: string[];
} {
  if (staffAuthProvider() !== "workos") return { staffAuth: "local" };
  const missing = missingWorkosVars();
  return missing.length === 0
    ? { staffAuth: "workos" }
    : { staffAuth: "unconfigured", staffAuthMissing: missing };
}

/**
 * Uptime-check target (product/EXTERNAL-APP-SETUP.md §5). Reports the runtime
 * mode and whether the database answers — the one dependency every intake
 * step needs — so a deploy with missing or wrong DATABASE_URL shows as
 * degraded here instead of only as 500s on submit. It also says which
 * optional dependencies this build was deployed with (presence only, never
 * values), so "is the key in production?" is answerable without a probe.
 * Only the database affects `status`: the model is an optional enhancement
 * (B20) and staff auth is deliberately closed until configured.
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
      model: process.env.ANTHROPIC_API_KEY ? "configured" : "absent",
      ...staffAuthStatus(),
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
