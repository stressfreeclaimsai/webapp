import { NextResponse, type NextRequest } from "next/server";
import { staffAuthProvider } from "@/lib/staff-auth-provider";

export const dynamic = "force-dynamic";

/**
 * Staff sign-in entry point (decision B25). Registered as the "Sign-in URL"
 * in the WorkOS dashboard so provider-initiated flows route through the app
 * and pick up the PKCE state the SDK enforces on every callback. Under the
 * local provider it simply goes to the workspace.
 */
export async function GET(request: NextRequest) {
  if (staffAuthProvider() !== "workos") {
    return NextResponse.redirect(new URL("/staff", request.url));
  }
  const { getSignInUrl } = await import("@workos-inc/authkit-nextjs");
  return NextResponse.redirect(await getSignInUrl({ returnTo: "/staff/claims" }));
}
