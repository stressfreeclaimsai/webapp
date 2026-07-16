import { prisma } from "@/lib/db";
import {
  ITEMS_DAMAGED,
  missingRequired,
  serializeItems,
  type ItemDamaged,
  type RequiredField,
} from "@/lib/claim-facts";
import type { Claim } from "@prisma/client";

/**
 * Shared contracts, part 2 (WP-1): the draft state, its cookie
 * (de)serialization, gap derivation, and the server-authoritative submit
 * (architecture §5 / decisions A3, B13). Every screen consumes these; no
 * screen re-implements them or trusts the client's *conclusions* — the draft
 * travels in an httpOnly cookie, but completeness is always re-derived and
 * re-validated server-side. The raw utterance is never stored (decision A5).
 *
 * Why a cookie and not a ClaimDraft row (B13): on serverless hosting each
 * invocation sees its own copy of the SQLite file, so a row written by one
 * request is invisible to the next. The cookie rides along with every
 * request, which also preserves the reload-safety the founder's no-power
 * scenario demands. The demo Claim row is still written at submit (AC-6).
 */

export type ClaimDraftState = {
  fullName: string | null;
  propertyAddress: string | null;
  dateOfLoss: Date | null;
  insurerName: string | null;
  itemsDamaged: ItemDamaged[];
  phone: string | null;
  email: string | null;
  policyNumber: string | null;
  deductible: string | null;
  optionalsOffered: boolean;
  /** Set once submitClaim succeeds; freezes the flow at /done. */
  submittedClaimId: string | null;
};

export type DraftPatch = Partial<Omit<ClaimDraftState, "submittedClaimId" | "itemsDamaged">> & {
  itemsDamaged?: ItemDamaged[];
};

export function emptyDraft(): ClaimDraftState {
  return {
    fullName: null,
    propertyAddress: null,
    dateOfLoss: null,
    insurerName: null,
    itemsDamaged: [],
    phone: null,
    email: null,
    policyNumber: null,
    deductible: null,
    optionalsOffered: false,
    submittedClaimId: null,
  };
}

// Keep the cookie comfortably under browser limits: no single field needs
// more than this to be readable on Review, and the fixed shape bounds the rest.
const clip = (value: string) => value.trim().slice(0, 300);

/** Fold a patch into the draft. Strings are clipped; items stay in the fixed set. */
export function applyPatch(draft: ClaimDraftState, patch: DraftPatch): ClaimDraftState {
  const next = { ...draft };
  for (const field of [
    "fullName",
    "propertyAddress",
    "insurerName",
    "phone",
    "email",
    "policyNumber",
    "deductible",
  ] as const) {
    const value = patch[field];
    if (value !== undefined) next[field] = value === null ? null : clip(value) || null;
  }
  if (patch.dateOfLoss !== undefined) next.dateOfLoss = patch.dateOfLoss;
  if (patch.itemsDamaged !== undefined) {
    next.itemsDamaged = ITEMS_DAMAGED.filter((i) => patch.itemsDamaged!.includes(i));
  }
  if (patch.optionalsOffered !== undefined) next.optionalsOffered = patch.optionalsOffered;
  return next;
}

/** Cookie payload ⇄ draft. A malformed cookie is a missing draft, never an error. */
export function draftToCookieValue(draft: ClaimDraftState): string {
  const wire = { ...draft, dateOfLoss: draft.dateOfLoss?.toISOString() ?? null };
  return Buffer.from(JSON.stringify(wire), "utf8").toString("base64url");
}

export function draftFromCookieValue(raw: string | null): ClaimDraftState | null {
  if (!raw) return null;
  try {
    const wire = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? clip(v) : null);
    const date = typeof wire.dateOfLoss === "string" ? new Date(wire.dateOfLoss) : null;
    return {
      fullName: str(wire.fullName),
      propertyAddress: str(wire.propertyAddress),
      dateOfLoss: date && !Number.isNaN(date.getTime()) ? date : null,
      insurerName: str(wire.insurerName),
      itemsDamaged: ITEMS_DAMAGED.filter(
        (i) => Array.isArray(wire.itemsDamaged) && wire.itemsDamaged.includes(i),
      ),
      phone: str(wire.phone),
      email: str(wire.email),
      policyNumber: str(wire.policyNumber),
      deductible: str(wire.deductible),
      optionalsOffered: wire.optionalsOffered === true,
      submittedClaimId: str(wire.submittedClaimId),
    };
  } catch {
    return null;
  }
}

/** What the draft still needs before it can be submitted (pure derivation). */
export function draftMissing(draft: ClaimDraftState | null): RequiredField[] {
  return missingRequired(draft ?? {});
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
 * claimed (AC-8). Nothing is sent to any external system (AC-6). On
 * serverless the row is a write-only demo record (B12/B13); /done renders
 * from the submitted cookie snapshot, never from a cross-instance read.
 */
export async function submitClaim(draft: ClaimDraftState): Promise<Claim> {
  const missing = draftMissing(draft);
  if (missing.length > 0) throw new IncompleteDraftError(missing);

  // The single seeded demo homeowner anchors every demo claim (constitution §2).
  const homeowner = await prisma.homeowner.findFirst();
  if (!homeowner) throw new Error("No seeded homeowner — run `npm run seed`.");

  return prisma.claim.create({
    data: {
      claimantName: draft.fullName!,
      propertyAddress: draft.propertyAddress!,
      phone: draft.phone!,
      email: draft.email!,
      insurerName: draft.insurerName!,
      policyNumber: draft.policyNumber,
      deductible: draft.deductible,
      dateOfLoss: draft.dateOfLoss!,
      itemsDamaged: serializeItems(draft.itemsDamaged),
      homeownerId: homeowner.id,
    },
  });
}
