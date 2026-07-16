import { prisma } from "@/lib/db";
import {
  missingRequired,
  parseItems,
  serializeItems,
  type ItemDamaged,
  type RequiredField,
} from "@/lib/claim-facts";
import type { Claim, ClaimDraft } from "@prisma/client";

/**
 * Shared contracts, part 2 (WP-1): server-authoritative draft accessors and
 * submit (architecture §5 / decision A3). Every screen consumes these; no
 * screen re-implements them or trusts the client. The draft is keyed by the
 * opaque demo-session cookie — NOT auth: it carries no identity and enforces
 * nothing (decision A6). The raw utterance is never stored (decision A5).
 */

export type DraftPatch = {
  fullName?: string | null;
  propertyAddress?: string | null;
  dateOfLoss?: Date | null;
  insurerName?: string | null;
  itemsDamaged?: ItemDamaged[];
  phone?: string | null;
  email?: string | null;
  policyNumber?: string | null;
  deductible?: string | null;
  optionalsOffered?: boolean;
};

export async function loadDraft(sessionKey: string): Promise<ClaimDraft | null> {
  if (!sessionKey) return null;
  return prisma.claimDraft.findUnique({ where: { sessionKey } });
}

export async function saveDraft(sessionKey: string, patch: DraftPatch): Promise<ClaimDraft> {
  const { itemsDamaged, ...rest } = patch;
  const data = {
    ...rest,
    ...(itemsDamaged !== undefined ? { itemsDamaged: serializeItems(itemsDamaged) } : {}),
  };
  return prisma.claimDraft.upsert({
    where: { sessionKey },
    create: { sessionKey, ...data },
    update: data,
  });
}

/** What the draft still needs before it can be submitted (pure derivation). */
export function draftMissing(draft: ClaimDraft | null): RequiredField[] {
  if (!draft) return [...missingRequired({})];
  return missingRequired({ ...draft, itemsDamaged: parseItems(draft.itemsDamaged) });
}

export class IncompleteDraftError extends Error {
  constructor(public readonly missing: RequiredField[]) {
    super(`Draft is incomplete: missing ${missing.join(", ")}`);
    this.name = "IncompleteDraftError";
  }
}

/**
 * Create the demo Claim from a complete draft. Re-validates completeness
 * server-side — an incomplete draft is rejected regardless of what the client
 * claimed (AC-8). Idempotent per session: once a draft has been submitted,
 * the same claim is returned (a reload never files a second demo claim).
 * Nothing is sent to any external system (AC-6).
 */
export async function submitClaim(sessionKey: string): Promise<Claim> {
  const draft = await loadDraft(sessionKey);
  if (!draft) throw new IncompleteDraftError([...missingRequired({})]);

  if (draft.claimId) {
    const existing = await prisma.claim.findUnique({ where: { id: draft.claimId } });
    if (existing) return existing;
  }

  const missing = draftMissing(draft);
  if (missing.length > 0) throw new IncompleteDraftError(missing);

  // The single seeded demo homeowner anchors every demo claim (constitution §2).
  const homeowner = await prisma.homeowner.findFirst();
  if (!homeowner) throw new Error("No seeded homeowner — run `npm run seed`.");

  const claim = await prisma.claim.create({
    data: {
      claimantName: draft.fullName!,
      propertyAddress: draft.propertyAddress!,
      phone: draft.phone!,
      email: draft.email!,
      insurerName: draft.insurerName!,
      policyNumber: draft.policyNumber,
      deductible: draft.deductible,
      dateOfLoss: draft.dateOfLoss!,
      itemsDamaged: draft.itemsDamaged,
      homeownerId: homeowner.id,
    },
  });

  await prisma.claimDraft.update({ where: { id: draft.id }, data: { claimId: claim.id } });
  return claim;
}

export async function loadSubmittedClaim(sessionKey: string): Promise<Claim | null> {
  const draft = await loadDraft(sessionKey);
  if (!draft?.claimId) return null;
  return prisma.claim.findUnique({ where: { id: draft.claimId } });
}
