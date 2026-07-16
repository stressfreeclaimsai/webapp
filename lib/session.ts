import { cookies } from "next/headers";

/**
 * The demo-draft cookie (decisions A6 → B13): the in-progress claim draft
 * itself, stored as base64url JSON in an httpOnly cookie. It is NOT auth —
 * it carries no identity and enforces nothing; it exists so the draft
 * survives a reload, a dropped connection, or a dying battery (the founder's
 * core scenario), and so the flow works on serverless hosting where nothing
 * written to one instance's disk is visible to the next request (B13).
 *
 * Cookie writes happen only inside server actions (Next.js constraint);
 * pages read via readDraftCookie().
 */
export const DRAFT_COOKIE = "sfc-demo-draft";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // a week — long enough to ride out the storm

export async function readDraftCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DRAFT_COOKIE)?.value ?? null;
}

/** Server actions only. */
export async function writeDraftCookie(value: string): Promise<void> {
  const jar = await cookies();
  jar.set(DRAFT_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}
