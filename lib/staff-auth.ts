import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User as WorkosUser } from "@workos-inc/node";
import { prisma } from "@/lib/db";
import { STAFF_ROLES, type StaffRole } from "@/lib/production-domain";
import { runtimeConfig } from "@/lib/runtime-config";
import { isWorkosConfigured, staffAuthProvider } from "@/lib/staff-auth-provider";

const DEFAULT_LOCAL_STAFF_SUBJECT = "dev:staff:pilot-owner";

/**
 * An invited staff member who has not signed in yet carries a placeholder
 * subject. The first verified sign-in from WorkOS replaces it with the real
 * provider subject (`user_…`) — after that the row is bound for good.
 */
export const PENDING_SUBJECT_PREFIX = "pending:";

export function pendingSubjectFor(email: string): string {
  return `${PENDING_SUBJECT_PREFIX}${email.trim().toLowerCase()}`;
}

export type StaffPrincipal = {
  id: string;
  externalSubject: string;
  email: string;
  displayName: string;
  role: StaffRole;
};

export class StaffAccessUnavailableError extends Error {
  constructor() {
    super("No active staff identity is available in this runtime.");
    this.name = "StaffAccessUnavailableError";
  }
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

type StaffRow = NonNullable<Awaited<ReturnType<typeof prisma.staffUser.findUnique>>>;

function toPrincipal(staff: StaffRow): StaffPrincipal {
  if (!isStaffRole(staff.role)) throw new StaffAccessUnavailableError();
  return {
    id: staff.id,
    externalSubject: staff.externalSubject,
    email: staff.email,
    displayName: staff.displayName,
    role: staff.role,
  };
}

/**
 * Provider-neutral staff boundary (decision B24/B25). Pages and repositories
 * only ever see a StaffPrincipal; which adapter produced it is decided by
 * `staffAuthProvider()`. Authorization (role, isActive) is OURS — the
 * provider is identity only, so swapping it never touches claim, assignment,
 * note, or audit contracts.
 */
export const requireStaff = cache(async (): Promise<StaffPrincipal> => {
  // Keeps the pilot gate semantics: a misconfigured pilot runtime fails here.
  runtimeConfig();
  return staffAuthProvider() === "workos" ? resolveWorkosStaff() : resolveLocalStaff();
});

/** The seeded development identity. Never runs in production or pilot. */
async function resolveLocalStaff(): Promise<StaffPrincipal> {
  const externalSubject = process.env.LOCAL_STAFF_SUBJECT?.trim() || DEFAULT_LOCAL_STAFF_SUBJECT;
  const staff = await prisma.staffUser.findUnique({ where: { externalSubject } });
  if (!staff?.isActive) throw new StaffAccessUnavailableError();
  return toPrincipal(staff);
}

/**
 * WorkOS AuthKit session → StaffUser. No session redirects to hosted sign-in;
 * a session with no active StaffUser record is treated as no access at all
 * (the caller renders 404 — nothing about the workspace is revealed).
 */
async function resolveWorkosStaff(): Promise<StaffPrincipal> {
  // A production runtime with missing WorkOS configuration must fail closed,
  // never fall back to the development identity.
  if (!isWorkosConfigured()) throw new StaffAccessUnavailableError();

  const { withAuth } = await import("@workos-inc/authkit-nextjs");
  const { user } = await withAuth();
  // Hosted sign-in starts from the /sign-in route handler, not here: building
  // the authorization URL writes the PKCE cookie, which a Server Component
  // is not allowed to do.
  if (!user) redirect("/sign-in");

  const staff = await findOrBindStaffUser(user);
  if (!staff?.isActive) throw new StaffAccessUnavailableError();
  return toPrincipal(staff);
}

/**
 * Look the provider user up by subject; on a first sign-in, bind the invited
 * (pending) record whose email matches. Binding requires a verified email so
 * an unverified address can never claim someone else's invitation.
 */
export async function findOrBindStaffUser(user: WorkosUser): Promise<StaffRow | null> {
  const bySubject = await prisma.staffUser.findUnique({ where: { externalSubject: user.id } });
  if (bySubject) return bySubject;
  if (!user.emailVerified) return null;

  const pending = await prisma.staffUser.findFirst({
    where: {
      externalSubject: pendingSubjectFor(user.email),
      isActive: true,
    },
  });
  if (!pending) return null;

  return prisma.staffUser.update({
    where: { id: pending.id },
    data: { externalSubject: user.id, lastSeenAt: new Date() },
  });
}

/**
 * Called from the AuthKit callback once per sign-in: binds/refreshes the
 * staff record and writes the audit event. Metadata carries no personal
 * data — the WorkOS subject and method only (PRODUCT.md telemetry rule).
 */
export async function recordStaffSignIn(user: WorkosUser, method: string | undefined): Promise<void> {
  const staff = await findOrBindStaffUser(user);

  if (!staff?.isActive) {
    await prisma.auditEvent.create({
      data: {
        actorType: "system",
        action: "staff.sign_in_rejected",
        entityType: "staff_user",
        entityId: user.id,
        metadata: { reason: "no_active_staff_record", method: method ?? null },
      },
    });
    return;
  }

  await prisma.$transaction([
    prisma.staffUser.update({ where: { id: staff.id }, data: { lastSeenAt: new Date() } }),
    prisma.auditEvent.create({
      data: {
        actorId: staff.id,
        actorType: "staff",
        action: "staff.signed_in",
        entityType: "staff_user",
        entityId: staff.id,
        metadata: { method: method ?? null },
      },
    }),
  ]);
}
