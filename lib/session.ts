import { cookies } from "next/headers";

/**
 * The demo-session cookie (decision A6): an opaque key that lets an
 * in-progress draft survive a reload, a dropped connection, or a dying
 * battery — the founder's core scenario. It is NOT auth: it carries no
 * identity and enforces nothing.
 */
export const SESSION_COOKIE = "sfc-demo-session";

export async function readSessionKey(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
