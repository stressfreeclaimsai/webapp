import {
  ITEMS_DAMAGED,
  isStateCode,
  missingRequired,
  validateDateOfLoss,
  validateEmail,
  type FieldIssue,
  type ItemDamaged,
  type RequiredField,
  type StateCode,
} from "@/lib/claim-facts";

/**
 * Pure intake contract: draft state, patch normalization, gap derivation, and
 * server-authoritative validation. Persistence and continuation-token behavior
 * live in lib/drafts.ts so these rules stay independently testable.
 */

export type ClaimDraftState = {
  fullName: string | null;
  propertyAddress: string | null;
  stateOfLoss: StateCode | null;
  dateOfLoss: Date | null;
  insurerName: string | null;
  itemsDamaged: ItemDamaged[];
  phone: string | null;
  email: string | null;
  policyNumber: string | null;
  deductible: string | null;
  /** Free-text damage summary, frozen into the submitted claim snapshot. */
  damageDescription: string | null;
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
    stateOfLoss: null,
    dateOfLoss: null,
    insurerName: null,
    itemsDamaged: [],
    phone: null,
    email: null,
    policyNumber: null,
    deductible: null,
    damageDescription: null,
    optionalsOffered: false,
    submittedClaimId: null,
  };
}

// Bound text written to the database and rendered back on Review.
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
    "damageDescription",
  ] as const) {
    const value = patch[field];
    if (value !== undefined) next[field] = value === null ? null : clip(value) || null;
  }
  if (patch.stateOfLoss !== undefined) {
    next.stateOfLoss = isStateCode(patch.stateOfLoss) ? patch.stateOfLoss : null;
  }
  if (patch.dateOfLoss !== undefined) next.dateOfLoss = patch.dateOfLoss;
  if (patch.itemsDamaged !== undefined) {
    next.itemsDamaged = ITEMS_DAMAGED.filter((i) => patch.itemsDamaged!.includes(i));
  }
  if (patch.optionalsOffered !== undefined) next.optionalsOffered = patch.optionalsOffered;
  return next;
}

/** What the draft still needs before it can be submitted (pure derivation). */
export function draftMissing(draft: ClaimDraftState | null): RequiredField[] {
  return missingRequired(draft ?? {});
}

export type DraftIssue = { field: RequiredField; issue: FieldIssue };

/**
 * Plausibility issues on values the draft already HAS (B14/B15) — presence is
 * `draftMissing`'s job. An implausible value stays in the draft on purpose:
 * that is what lets the step re-render with the typed input kept and plain
 * guidance beside it (never-trap, AC-8), instead of silently discarding it.
 */
export function draftIssues(draft: ClaimDraftState | null, now: Date = new Date()): DraftIssue[] {
  if (!draft) return [];
  const issues: DraftIssue[] = [];
  if (draft.dateOfLoss) {
    const issue = validateDateOfLoss(draft.dateOfLoss, now);
    if (issue) issues.push({ field: "dateOfLoss", issue });
  }
  if (draft.email) {
    const issue = validateEmail(draft.email);
    if (issue) issues.push({ field: "email", issue });
  }
  return issues;
}

export class IncompleteDraftError extends Error {
  constructor(public readonly missing: RequiredField[]) {
    super(`Draft is incomplete: missing ${missing.join(", ")}`);
    this.name = "IncompleteDraftError";
  }
}

export class ImplausibleDraftError extends Error {
  constructor(public readonly issues: DraftIssue[]) {
    super(
      `Draft has implausible values: ${issues.map((i) => `${i.field} (${i.issue})`).join(", ")}`,
    );
    this.name = "ImplausibleDraftError";
  }
}

/** Revalidate completeness and plausibility at the persistence boundary. */
export function assertDraftSubmittable(draft: ClaimDraftState): void {
  const missing = draftMissing(draft);
  if (missing.length > 0) throw new IncompleteDraftError(missing);

  // B14/B15: plausibility is enforced here too, so no client shortcut can
  // file a future-dated loss or a malformed email.
  const issues = draftIssues(draft);
  if (issues.length > 0) throw new ImplausibleDraftError(issues);
}
