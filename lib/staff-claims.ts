import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CLAIM_STATUSES, type ClaimStatus } from "@/lib/production-domain";
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
