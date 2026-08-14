import { cookies } from "next/headers";

/**
 * The browser holds only a high-entropy opaque continuation token. Claim facts
 * and personal information live exclusively in PostgreSQL ClaimDraft rows.
 */
export const DRAFT_COOKIE = "sfc-demo-draft";
export const DRAFT_TOKEN_BYTES = 32;
export const DRAFT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isDraftToken(value: string | null): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export async function readDraftToken(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(DRAFT_COOKIE)?.value ?? null;
  return isDraftToken(value) ? value : null;
}

/** Server actions only. */
export async function writeDraftToken(value: string): Promise<void> {
  if (!isDraftToken(value)) throw new Error("Refusing to write a malformed draft token.");
  const jar = await cookies();
  jar.set(DRAFT_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DRAFT_MAX_AGE_SECONDS,
    priority: "high",
  });
}

/** Server actions only. */
export async function clearDraftToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(DRAFT_COOKIE);
}
