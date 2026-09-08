import { NextResponse, type NextRequest } from "next/server";
import { recordStaffSignIn } from "@/lib/staff-auth";
import { isWorkosConfigured, staffAuthProvider } from "@/lib/staff-auth-provider";

export const dynamic = "force-dynamic";

/**
 * WorkOS AuthKit redirect URI (decision B25): the only place a staff session
 * is created. Must match NEXT_PUBLIC_WORKOS_REDIRECT_URI and the dashboard
 * setting. Inert (404) under the local provider so it can never be probed in
 * development or tests.
 */
export async function GET(request: NextRequest) {
  if (staffAuthProvider() !== "workos" || !isWorkosConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const { handleAuth } = await import("@workos-inc/authkit-nextjs");
  const callback = handleAuth({
    returnPathname: "/staff/claims",
    onSuccess: async ({ user, authenticationMethod }) => {
      await recordStaffSignIn(user, authenticationMethod);
    },
    // A failed or replayed callback gets a calm, direction-giving page — not
    // a stack trace, and nothing about why (PRODUCT.md telemetry rule).
    onError: async ({ request: failed }) =>
      NextResponse.redirect(new URL("/sign-in/problem", failed.url), { status: 303 }),
  });
  return callback(request);
}
