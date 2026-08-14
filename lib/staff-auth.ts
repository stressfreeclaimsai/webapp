import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { STAFF_ROLES, type StaffRole } from "@/lib/production-domain";
import { runtimeConfig } from "@/lib/runtime-config";

const DEFAULT_LOCAL_STAFF_SUBJECT = "dev:staff:pilot-owner";

export type StaffPrincipal = {
  id: string;
  externalSubject: string;
  email: string;
  displayName: string;
  role: StaffRole;
};

export class StaffAccessUnavailableError extends Error {
  constructor() {
    super("The local staff identity is unavailable in this runtime.");
    this.name = "StaffAccessUnavailableError";
  }
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/**
 * Provider-neutral staff boundary. The current adapter resolves one seeded
 * identity only in local prototype development. Company auth will replace the
 * resolver behind this function; staff pages and repositories do not import a
 * provider SDK.
 */
export const requireStaff = cache(async (): Promise<StaffPrincipal> => {
  const config = runtimeConfig();
  if (process.env.NODE_ENV === "production" || config.isPilot) {
    throw new StaffAccessUnavailableError();
  }

  const externalSubject = process.env.LOCAL_STAFF_SUBJECT?.trim() || DEFAULT_LOCAL_STAFF_SUBJECT;
  const staff = await prisma.staffUser.findUnique({ where: { externalSubject } });
  if (!staff?.isActive || !isStaffRole(staff.role)) {
    throw new StaffAccessUnavailableError();
  }

  return {
    id: staff.id,
    externalSubject: staff.externalSubject,
    email: staff.email,
    displayName: staff.displayName,
    role: staff.role,
  };
});
