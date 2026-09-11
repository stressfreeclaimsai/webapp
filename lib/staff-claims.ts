import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CLAIM_NOTE_MAX_LENGTH,
  CLAIM_STATUSES,
  staffCan,
  TERMINAL_CLAIM_STATUSES,
  type ClaimStatus,
  type StaffCapability,
} from "@/lib/production-domain";
import type { StaffPrincipal } from "@/lib/staff-auth";

const queueItemInclude = {
  assignments: {
    where: { unassignedAt: null },
    include: { assignee: true },
    orderBy: { assignedAt: "desc" },
    take: 1,
  },
} satisfies Prisma.ClaimInclude;

const claimDetailInclude = {
  assignments: {
    include: { assignee: true, assignedBy: true },
    orderBy: { assignedAt: "desc" },
  },
  notes: {
    where: { deletedAt: null },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  },
  auditEvents: {
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  notificationDeliveries: {
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ClaimInclude;

export type ClaimsQueueItem = Prisma.ClaimGetPayload<{ include: typeof queueItemInclude }>;
export type StaffClaimDetail = Prisma.ClaimGetPayload<{ include: typeof claimDetailInclude }>;

export type QueueFilters = {
  query?: string;
  status?: string;
};

export function isClaimStatus(value: string | undefined): value is ClaimStatus {
  return !!value && (CLAIM_STATUSES as readonly string[]).includes(value);
}

export async function listClaimsForStaff(principal: StaffPrincipal, filters: QueueFilters) {
  const query = filters.query?.trim().slice(0, 100) ?? "";
  const status = isClaimStatus(filters.status) ? filters.status : null;
  const where: Prisma.ClaimWhereInput = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { referenceCode: { contains: query, mode: "insensitive" } },
            { claimantName: { contains: query, mode: "insensitive" } },
            { insurerName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [claims, total, newCount, unassignedCount] = await prisma.$transaction([
    prisma.claim.findMany({
      where,
      include: queueItemInclude,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: 100,
    }),
    prisma.claim.count(),
    prisma.claim.count({ where: { status: "new" } }),
    prisma.claim.count({
      where: { assignments: { none: { unassignedAt: null } } },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: principal.id,
        actorType: "staff",
        action: "claims.listed",
        entityType: "claim_queue",
        entityId: "all",
        metadata: { status: status ?? "all", hasQuery: query.length > 0 },
      },
    }),
  ]);

  return {
    claims,
    filters: { query, status },
    summary: { total, newCount, unassignedCount },
  };
}

export async function getClaimForStaff(
  principal: StaffPrincipal,
  referenceCode: string,
): Promise<StaffClaimDetail | null> {
  const claim = await prisma.claim.findUnique({
    where: { referenceCode },
    include: claimDetailInclude,
  });
  if (!claim) return null;

  await prisma.auditEvent.create({
    data: {
      claimId: claim.id,
      actorId: principal.id,
      actorType: "staff",
      action: "claim.viewed",
      entityType: "claim",
      entityId: claim.id,
      metadata: { surface: "staff_claim_detail" },
    },
  });

  return claim;
}

// ---------------------------------------------------------------------------
// Mutations (decision B27). Every write is one transaction that pairs the
// change with its audit event, so history can never drift from the record.
// Audit metadata carries identifiers and change metadata only — never a
// note body or a homeowner fact (PRODUCT.md telemetry rule).
// ---------------------------------------------------------------------------

export type StaffMutationProblem =
  | "not_allowed"
  | "claim_not_found"
  | "invalid_status"
  | "same_status"
  | "assignee_not_found"
  | "same_assignee"
  | "note_empty"
  | "note_too_long";

export class StaffMutationError extends Error {
  constructor(readonly problem: StaffMutationProblem) {
    super(`Staff mutation rejected: ${problem}`);
    this.name = "StaffMutationError";
  }
}

function authorize(principal: StaffPrincipal, capability: StaffCapability): void {
  if (!staffCan(principal.role, capability)) throw new StaffMutationError("not_allowed");
}

async function findClaimByReference(referenceCode: string) {
  const claim = await prisma.claim.findUnique({
    where: { referenceCode },
    select: { id: true, status: true },
  });
  if (!claim) throw new StaffMutationError("claim_not_found");
  return claim;
}

/** Active staff who can own a claim, for the assignment control. */
export async function listAssignableStaff() {
  return prisma.staffUser.findMany({
    where: { isActive: true },
    select: { id: true, displayName: true, role: true },
    orderBy: { displayName: "asc" },
  });
}

export async function changeClaimStatus(
  principal: StaffPrincipal,
  referenceCode: string,
  nextStatus: string,
): Promise<{ from: string; to: ClaimStatus }> {
  authorize(principal, "claim.change_status");
  if (!isClaimStatus(nextStatus)) throw new StaffMutationError("invalid_status");
  const claim = await findClaimByReference(referenceCode);
  if (claim.status === nextStatus) throw new StaffMutationError("same_status");

  const closing = TERMINAL_CLAIM_STATUSES.includes(nextStatus);
  await prisma.$transaction([
    prisma.claim.update({
      where: { id: claim.id },
      data: { status: nextStatus, closedAt: closing ? new Date() : null },
    }),
    prisma.auditEvent.create({
      data: {
        claimId: claim.id,
        actorId: principal.id,
        actorType: "staff",
        action: "claim.status_changed",
        entityType: "claim",
        entityId: claim.id,
        metadata: { from: claim.status, to: nextStatus },
      },
    }),
  ]);
  return { from: claim.status, to: nextStatus };
}

/**
 * Assign a claim to an active staff member, or clear the owner with `null`.
 * The open assignment is closed and the new one opened in the same
 * transaction, which is what the one-open-per-claim index expects.
 */
export async function assignClaim(
  principal: StaffPrincipal,
  referenceCode: string,
  assigneeId: string | null,
): Promise<{ previousAssigneeId: string | null; assigneeId: string | null }> {
  authorize(principal, "claim.assign");
  const claim = await findClaimByReference(referenceCode);

  const assignee = assigneeId
    ? await prisma.staffUser.findFirst({
        where: { id: assigneeId, isActive: true },
        select: { id: true },
      })
    : null;
  if (assigneeId && !assignee) throw new StaffMutationError("assignee_not_found");

  const open = await prisma.claimAssignment.findFirst({
    where: { claimId: claim.id, unassignedAt: null },
    select: { id: true, assigneeId: true },
  });
  const previousAssigneeId = open?.assigneeId ?? null;
  if (previousAssigneeId === (assignee?.id ?? null)) throw new StaffMutationError("same_assignee");

  const now = new Date();
  await prisma.$transaction([
    ...(open
      ? [
          prisma.claimAssignment.update({
            where: { id: open.id },
            data: { unassignedAt: now },
          }),
        ]
      : []),
    ...(assignee
      ? [
          prisma.claimAssignment.create({
            data: {
              claimId: claim.id,
              assigneeId: assignee.id,
              assignedById: principal.id,
              assignedAt: now,
            },
          }),
        ]
      : []),
    prisma.auditEvent.create({
      data: {
        claimId: claim.id,
        actorId: principal.id,
        actorType: "staff",
        action: assignee ? "claim.assigned" : "claim.unassigned",
        entityType: "claim",
        entityId: claim.id,
        metadata: { previousAssigneeId, assigneeId: assignee?.id ?? null },
      },
    }),
  ]);
  return { previousAssigneeId, assigneeId: assignee?.id ?? null };
}

export async function addClaimNote(
  principal: StaffPrincipal,
  referenceCode: string,
  rawBody: string,
): Promise<{ noteId: string }> {
  authorize(principal, "claim.add_note");
  const body = rawBody.replace(/\r\n/g, "\n").trim();
  if (!body) throw new StaffMutationError("note_empty");
  if (body.length > CLAIM_NOTE_MAX_LENGTH) throw new StaffMutationError("note_too_long");
  const claim = await findClaimByReference(referenceCode);

  const noteId = await prisma.$transaction(async (tx) => {
    const note = await tx.claimNote.create({
      data: { claimId: claim.id, authorId: principal.id, body },
      select: { id: true },
    });
    await tx.auditEvent.create({
      data: {
        claimId: claim.id,
        actorId: principal.id,
        actorType: "staff",
        action: "claim.note_added",
        entityType: "claim_note",
        entityId: note.id,
        metadata: { noteId: note.id, length: body.length },
      },
    });
    return note.id;
  });
  return { noteId };
}
