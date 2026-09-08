import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import { staffAuthProvider } from "@/lib/staff-auth-provider";

/**
 * AuthKit session middleware for the staff surface (decision B25). The SDK
 * requires it on every route that calls `withAuth()`; it refreshes the
 * session cookie and forwards the encrypted session to server components.
 *
 * In the local provider (development and the Playwright suite) this is a
 * pass-through and the WorkOS SDK is never even loaded.
 */
let workosProxy: NextMiddleware | undefined;

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (staffAuthProvider() !== "workos") return NextResponse.next();

  if (!workosProxy) {
    const { authkitProxy } = await import("@workos-inc/authkit-nextjs");
    workosProxy = authkitProxy({ redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI });
  }
  return workosProxy(request, event);
}

export const config = {
  matcher: ["/staff", "/staff/:path*", "/sign-in"],
};
