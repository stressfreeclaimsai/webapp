/**
 * Shared env helpers for the tsx-run tooling scripts (seed, verify, test setup).
 *
 * Next.js and the Prisma CLI auto-load `.env`, but a plain tsx process does not,
 * so these scripts load it themselves (no dotenv dependency — Node's built-in
 * process.loadEnvFile is used, with a safe fallback default).
 */

const DEFAULT_DATABASE_URL = "file:./dev.db";

/** Load .env if present and guarantee DATABASE_URL is set; returns the value. */
export function ensureDatabaseUrl(): string {
  try {
    // Node 20.12+ / 22+ built-in. Throws if .env is absent — that's fine.
    process.loadEnvFile(".env");
  } catch {
    // No .env file: fall through to the default below.
  }
  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  process.env.DATABASE_URL = url;
  return url;
}

/**
 * Guard against running a destructive operation against anything other than a
 * local throwaway SQLite file. Cheap insurance against nuking real data once
 * promotion-track work exists (constitution §2, §8). Exits non-zero on failure.
 */
export function assertLocalSqlite(url: string): void {
  if (!url.startsWith("file:")) {
    console.error(
      [
        "",
        "✖ Refusing to run a destructive seed.",
        `  DATABASE_URL must be a local SQLite file (file:...), but got: ${url || "(unset)"}`,
        "  This guard prevents the seed's file-level reset from deleting a real database.",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
}
