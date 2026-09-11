"use server";

import { redirect } from "next/navigation";
import { staffAuthProvider } from "@/lib/staff-auth-provider";
import { requireStaff } from "@/lib/staff-auth";
import {
  addClaimNote,
  assignClaim,
  changeClaimStatus,
  StaffMutationError,
  type StaffMutationProblem,
} from "@/lib/staff-claims";

/** Ends the WorkOS session and returns to the public front door (B25). */
export async function signOutStaff(): Promise<void> {
  if (staffAuthProvider() !== "workos") redirect("/");
  const { signOut } = await import("@workos-inc/authkit-nextjs");
  await signOut({ returnTo: "/" });
}

// ---------------------------------------------------------------------------
// Claim mutations (decision B27). Each action re-resolves the staff principal
// (never trusts the form for identity or role), performs one audited write,
// and redirects back to the claim so a refresh can never repeat the change.
// Outcomes travel as a short query flag the detail page turns into a message.
// ---------------------------------------------------------------------------

export type StaffOutcome =
  | "status"
  | "assigned"
  | "unassigned"
  | "note"
  | StaffMutationProblem;

function claimPath(referenceCode: string): string {
  return `/staff/claims/${encodeURIComponent(referenceCode)}`;
}

function readReference(formData: FormData): string {
  const value = String(formData.get("referenceCode") ?? "").trim();
  // A missing or oversized reference is a malformed form, not a lookup miss.
  if (!value || value.length > 24) redirect("/staff/claims");
  return value;
}

function finish(referenceCode: string, outcome: StaffOutcome): never {
  redirect(`${claimPath(referenceCode)}?outcome=${outcome}`);
}

function failure(referenceCode: string, error: unknown): never {
  if (error instanceof StaffMutationError) {
    if (error.problem === "claim_not_found") redirect("/staff/claims");
    finish(referenceCode, error.problem);
  }
  throw error;
}

export async function updateClaimStatus(formData: FormData): Promise<void> {
  const principal = await requireStaff();
  const referenceCode = readReference(formData);
  try {
    await changeClaimStatus(principal, referenceCode, String(formData.get("status") ?? ""));
  } catch (error) {
    failure(referenceCode, error);
  }
  finish(referenceCode, "status");
}

export async function updateClaimOwner(formData: FormData): Promise<void> {
  const principal = await requireStaff();
  const referenceCode = readReference(formData);
  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
  try {
    await assignClaim(principal, referenceCode, assigneeId);
  } catch (error) {
    failure(referenceCode, error);
  }
  finish(referenceCode, assigneeId ? "assigned" : "unassigned");
}

export async function createClaimNote(formData: FormData): Promise<void> {
  const principal = await requireStaff();
  const referenceCode = readReference(formData);
  try {
    await addClaimNote(principal, referenceCode, String(formData.get("body") ?? ""));
  } catch (error) {
    failure(referenceCode, error);
  }
  finish(referenceCode, "note");
}
