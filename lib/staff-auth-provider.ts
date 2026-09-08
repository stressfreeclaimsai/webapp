/**
 * Which staff identity adapter is active. Pure and dependency-free on purpose:
 * the edge middleware imports it, so it must not touch Prisma, `server-only`,
 * or runtime config.
 *
 * - `local`  — the seeded development identity (see lib/staff-auth.ts).
 * - `workos` — WorkOS AuthKit sessions (decision B25).
 *
 * Production and pilot runtimes are always `workos`; `STAFF_AUTH_PROVIDER`
 * can only choose between the two outside of those. That keeps the dev
 * identity from ever resolving against real data.
 */
export type StaffAuthProvider = "local" | "workos";

type EnvLike = Record<string, string | undefined>;

export function staffAuthProvider(env: EnvLike = process.env): StaffAuthProvider {
  if (env.NODE_ENV === "production" || env.APP_MODE === "pilot") return "workos";
  return env.STAFF_AUTH_PROVIDER?.trim().toLowerCase() === "workos" ? "workos" : "local";
}

export const WORKOS_ENV_VARS = [
  "WORKOS_CLIENT_ID",
  "WORKOS_API_KEY",
  "WORKOS_COOKIE_PASSWORD",
  "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
] as const;

/** True when every variable the AuthKit SDK needs is present. */
export function isWorkosConfigured(env: EnvLike = process.env): boolean {
  return WORKOS_ENV_VARS.every((name) => Boolean(env[name]?.trim()));
}
