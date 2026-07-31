/**
 * Shared environment helpers for local database tooling.
 *
 * Next.js and the Prisma CLI load `.env`; plain `tsx` scripts do not. The
 * default intentionally targets only the Docker Compose database bound to
 * localhost. Production URLs must always be explicit environment values.
 */

const DEFAULT_DATABASE_URL =
  "postgresql://stressfreeclaim:stressfreeclaim@localhost:54329/stressfreeclaim?schema=public";

/** Load `.env` when present and guarantee Prisma's two URLs are available. */
export function ensureDatabaseUrl(): string {
  try {
    process.loadEnvFile(".env");
  } catch {
    // A fresh checkout can still use the safe local default.
  }

  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL ??= url;
  return url;
}

/**
 * Guard destructive development utilities so they can only reach the local
 * Compose database. Managed, preview, and production databases fail closed.
 */
export function assertLocalPostgres(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const databaseName = parsed.pathname.replace(/^\/+/, "");
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !localHosts.has(parsed.hostname) ||
    parsed.port !== "54329" ||
    databaseName !== "stressfreeclaim"
  ) {
    throw new Error(
      [
        "Refusing to reset or seed a non-local database.",
        "Expected the StressFreeClaim Docker database on localhost:54329/stressfreeclaim.",
      ].join(" "),
    );
  }
}
