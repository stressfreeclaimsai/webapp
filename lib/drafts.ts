import { createHash, randomBytes } from "node:crypto";
import { Prisma, type Claim, type ClaimDraft } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ITEMS_DAMAGED, isStateCode, type ItemDamaged, type StateCode } from "@/lib/claim-facts";
import { assertDraftSubmittable, type ClaimDraftState } from "@/lib/claims";
import { CURRENT_INTAKE_VERSION } from "@/lib/production-domain";
import { DRAFT_MAX_AGE_SECONDS, DRAFT_TOKEN_BYTES, isDraftToken } from "@/lib/session";

const DRAFT_TTL_MS = DRAFT_MAX_AGE_SECONDS * 1000;

type SubmittedClaimSummary = Pick<Claim, "id" | "referenceCode">;

export type LoadedDraft = {
  id: string;
  state: ClaimDraftState;
  status: string;
  expiresAt: Date;
  submittedClaim: SubmittedClaimSummary | null;
};

export type DraftLookup =
  | { kind: "active"; draft: LoadedDraft }
  | { kind: "submitted"; draft: LoadedDraft }
  | { kind: "expired" }
  | { kind: "missing" };

export class DraftExpiredError extends Error {
  constructor() {
    super("The claim draft has expired.");
    this.name = "DraftExpiredError";
  }
}

export class DraftNotFoundError extends Error {
  constructor() {
    super("The claim draft could not be found.");
    this.name = "DraftNotFoundError";
  }
}

export function hashDraftToken(token: string): string {
  if (!isDraftToken(token)) throw new DraftNotFoundError();
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateDraftToken(): string {
  return randomBytes(DRAFT_TOKEN_BYTES).toString("base64url");
}

function cleanItems(items: readonly string[]): ItemDamaged[] {
  return ITEMS_DAMAGED.filter((item) => items.includes(item));
}

function rowToState(row: ClaimDraft): ClaimDraftState {
  return {
    fullName: row.claimantName,
    propertyAddress: row.propertyAddress,
    stateOfLoss: isStateCode(row.stateOfLoss) ? (row.stateOfLoss as StateCode) : null,
    dateOfLoss: row.dateOfLoss,
    insurerName: row.insurerName,
    itemsDamaged: cleanItems(row.itemsDamaged),
    phone: row.phone,
    email: row.email,
    policyNumber: row.policyNumber,
    deductible: row.deductible,
    damageDescription: row.damageDescription,
    optionalsOffered: row.optionalsOffered,
    submittedClaimId: row.submittedClaimId,
  };
}

function stateData(state: ClaimDraftState) {
  return {
    claimantName: state.fullName,
    propertyAddress: state.propertyAddress,
    stateOfLoss: state.stateOfLoss,
    dateOfLoss: state.dateOfLoss,
    insurerName: state.insurerName,
    itemsDamaged: state.itemsDamaged,
    phone: state.phone,
    email: state.email,
    policyNumber: state.policyNumber,
    deductible: state.deductible,
    damageDescription: state.damageDescription,
    optionalsOffered: state.optionalsOffered,
  };
}

function loadedDraft(row: ClaimDraft, submittedClaim: SubmittedClaimSummary | null): LoadedDraft {
  return {
    id: row.id,
    state: rowToState(row),
    status: row.status,
    expiresAt: row.expiresAt,
    submittedClaim,
  };
}

export async function createDraft(
  state: ClaimDraftState,
): Promise<{ token: string; draft: LoadedDraft }> {
  const token = generateDraftToken();
  const row = await prisma.claimDraft.create({
    data: {
      continuationTokenHash: hashDraftToken(token),
      intakeVersion: CURRENT_INTAKE_VERSION,
      status: "in_progress",
      ...stateData(state),
      expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    },
  });
  return { token, draft: loadedDraft(row, null) };
}

export async function lookupDraft(token: string | null, now = new Date()): Promise<DraftLookup> {
  if (!token || !isDraftToken(token)) return { kind: "missing" };

  const row = await prisma.claimDraft.findUnique({
    where: { continuationTokenHash: hashDraftToken(token) },
    include: { submittedClaim: { select: { id: true, referenceCode: true } } },
  });
  if (!row) return { kind: "missing" };

  if (row.status === "submitted" && row.submittedClaim) {
    return { kind: "submitted", draft: loadedDraft(row, row.submittedClaim) };
  }

  if (row.status !== "in_progress" || row.expiresAt <= now) {
    if (row.status === "in_progress") {
      await prisma.claimDraft.updateMany({
        where: { id: row.id, status: "in_progress" },
        data: { status: "expired" },
      });
    }
    return { kind: "expired" };
  }

  return { kind: "active", draft: loadedDraft(row, row.submittedClaim) };
}

export async function updateDraft(token: string, state: ClaimDraftState): Promise<boolean> {
  const result = await prisma.claimDraft.updateMany({
    where: {
      continuationTokenHash: hashDraftToken(token),
      status: "in_progress",
      expiresAt: { gt: new Date() },
    },
    data: stateData(state),
  });
  return result.count === 1;
}

export async function abandonDraft(token: string | null): Promise<void> {
  if (!token || !isDraftToken(token)) return;
  await prisma.claimDraft.updateMany({
    where: {
      continuationTokenHash: hashDraftToken(token),
      status: "in_progress",
    },
    data: { status: "abandoned" },
  });
}

function referenceCode(): string {
  return `SFC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Atomically freezes the corrected draft, creates exactly one Claim, marks the
 * draft submitted, and appends the first audit event. Updating the draft row
 * first takes a PostgreSQL row lock; concurrent submissions observe the
 * already-created claim instead of creating another.
 */
export async function submitDraft(token: string, state: ClaimDraftState): Promise<Claim> {
  assertDraftSubmittable(state);
  const tokenHash = hashDraftToken(token);

  return prisma.$transaction(async (tx) => {
    const locked = await tx.claimDraft.updateMany({
      where: {
        continuationTokenHash: tokenHash,
        status: "in_progress",
        submittedClaimId: null,
        expiresAt: { gt: new Date() },
      },
      data: stateData(state),
    });

    const row = await tx.claimDraft.findUnique({
      where: { continuationTokenHash: tokenHash },
      include: { submittedClaim: true },
    });
    if (!row) throw new DraftNotFoundError();
    if (locked.count === 0) {
      if (row.submittedClaim) return row.submittedClaim;
      if (row.expiresAt <= new Date() || row.status === "expired") {
        throw new DraftExpiredError();
      }
      throw new DraftNotFoundError();
    }

    const claim = await tx.claim.create({
      data: {
        referenceCode: referenceCode(),
        submissionKey: `draft:${row.id}`,
        intakeVersion: row.intakeVersion,
        source: "web_intake",
        status: "new",
        claimantName: state.fullName!,
        propertyAddress: state.propertyAddress!,
        stateOfLoss: state.stateOfLoss!,
        phone: state.phone!,
        email: state.email!,
        insurerName: state.insurerName!,
        policyNumber: state.policyNumber,
        deductible: state.deductible,
        dateOfLoss: state.dateOfLoss!,
        itemsDamaged: state.itemsDamaged,
        damageDescription: state.damageDescription ?? "",
        extraFields: (row.extraFields ?? {}) as Prisma.InputJsonValue,
      },
    });

    await tx.claimDraft.update({
      where: { id: row.id },
      data: {
        ...stateData(state),
        status: "submitted",
        submittedClaimId: claim.id,
      },
    });
    await tx.auditEvent.create({
      data: {
        claimId: claim.id,
        actorType: "homeowner",
        action: "claim.submitted",
        entityType: "claim",
        entityId: claim.id,
        metadata: {
          intakeVersion: row.intakeVersion,
          source: "web_intake",
        },
      },
    });

    return claim;
  });
}

export async function cleanupExpiredDrafts(now = new Date(), retentionHours = 24) {
  const expired = await prisma.claimDraft.updateMany({
    where: { status: "in_progress", expiresAt: { lte: now } },
    data: { status: "expired" },
  });
  const cutoff = new Date(now.getTime() - retentionHours * 60 * 60 * 1000);
  const deleted = await prisma.claimDraft.deleteMany({
    where: {
      status: { in: ["expired", "abandoned"] },
      updatedAt: { lt: cutoff },
    },
  });
  return { markedExpired: expired.count, deleted: deleted.count };
}
