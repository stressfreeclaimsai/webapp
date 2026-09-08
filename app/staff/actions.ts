"use server";

import { redirect } from "next/navigation";
import { staffAuthProvider } from "@/lib/staff-auth-provider";

/** Ends the WorkOS session and returns to the public front door (B25). */
export async function signOutStaff(): Promise<void> {
  if (staffAuthProvider() !== "workos") redirect("/");
  const { signOut } = await import("@workos-inc/authkit-nextjs");
  await signOut({ returnTo: "/" });
}
