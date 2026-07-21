/**
 * Shared contracts, part 1 (WP-1): the fixed enums, required-field set, pure
 * validation (B14/B15), and gap derivation. Extraction itself lives in
 * lib/extraction.ts (B20) — this file stays pure data-and-rules so every
 * screen and the extractor consume one source of truth.
 */

// The fixed items-damaged set, verbatim from the source doc (AC-4).
// Do not extend it and never invent a member from unknown damage words.
export const ITEMS_DAMAGED = ["roof", "siding", "window", "drywall", "contents"] as const;
export type ItemDamaged = (typeof ITEMS_DAMAGED)[number];

export const ITEM_LABELS: Record<ItemDamaged, string> = {
  roof: "Roof",
  siding: "Siding",
  window: "Windows",
  drywall: "Drywall",
  contents: "Contents (belongings inside)",
};

// The 50 states + DC (decision B16). Capture only — no licensing/eligibility
// logic may hang off this list; that gate is a founder + regulatory-attorney
// decision (see open-decisions.md).
export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;
export type StateCode = (typeof US_STATES)[number]["code"];

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && US_STATES.some((s) => s.code === value);
}

export function stateName(code: StateCode): string {
  return US_STATES.find((s) => s.code === code)!.name;
}

export type ClaimFacts = {
  fullName: string;
  propertyAddress: string;
  stateOfLoss: StateCode;
  dateOfLoss: Date;
  insurerName: string;
  itemsDamaged: ItemDamaged[];
  phone: string;
  email: string;
  /** Free-text damage summary (B20) — capture-only, lands in Claim.notes. */
  damageDescription: string;
};
export type PartialClaimFacts = Partial<ClaimFacts>;

// Required to submit (architecture §5): the five ball-rolling facts plus
// state of loss (B16) and phone + email (needed to follow up). The order here
// is the order the gap-filling step asks in. policyNumber and deductible are
// NOT here — they are optional and never block (AC-3). damageDescription is
// capture-only and never blocks either.
export const REQUIRED_FIELDS = [
  "fullName",
  "propertyAddress",
  "stateOfLoss",
  "dateOfLoss",
  "insurerName",
  "itemsDamaged",
  "phone",
  "email",
] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];

// Dates are anchored to UTC noon so a calendar date never shifts across
// timezones between extraction, storage, and display.
export function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

// One email shape for the whole app: what the extractor recognises is exactly
// what validation accepts (B15).
export const EMAIL_SHAPE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/**
 * Plausibility issues (B14/B15). These are checks on a PRESENT value —
 * presence itself stays `missingRequired()`'s job. Pure so both the gap step
 * and review render the same guidance and `submitClaim` enforces the same
 * rules server-side.
 */
export type FieldIssue = "dateFuture" | "dateTooOld" | "emailShape";

/**
 * B14 — founder decision, not spec-derived (see open-decisions.md): the storm
 * date can't be in the future and can't be more than 24 months back. `now` is
 * injectable for tests; comparisons are calendar-date at UTC noon, matching
 * how dates are stored everywhere else in the app.
 */
export function validateDateOfLoss(date: Date, now: Date = new Date()): FieldIssue | null {
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (date.getTime() > today.getTime()) return "dateFuture";
  const floor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 24, now.getUTCDate(), 12);
  if (date.getTime() < floor) return "dateTooOld";
  return null;
}

/** B15 — basic shape only; no deliverability or network check. */
export function validateEmail(value: string): FieldIssue | null {
  return new RegExp(`^${EMAIL_SHAPE.source}$`).test(value.trim()) ? null : "emailShape";
}

/** Loose input shape so both PartialClaimFacts and a DB draft row fit. */
export type FactsLike = {
  fullName?: string | null;
  propertyAddress?: string | null;
  stateOfLoss?: string | null;
  dateOfLoss?: Date | null;
  insurerName?: string | null;
  itemsDamaged?: readonly ItemDamaged[] | null;
  phone?: string | null;
  email?: string | null;
};

/**
 * Pure gap derivation (architecture §5): given a partial draft, exactly what
 * is still required to submit, in asking order. Optional fields (policy
 * number, deductible) never appear here.
 */
export function missingRequired(draft: FactsLike): RequiredField[] {
  const has = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;
  return REQUIRED_FIELDS.filter((field) => {
    switch (field) {
      case "fullName":
        return !has(draft.fullName);
      case "propertyAddress":
        return !has(draft.propertyAddress);
      case "stateOfLoss":
        return !isStateCode(draft.stateOfLoss);
      case "dateOfLoss":
        return !(draft.dateOfLoss instanceof Date);
      case "insurerName":
        return !has(draft.insurerName);
      case "itemsDamaged":
        return !draft.itemsDamaged || draft.itemsDamaged.length === 0;
      case "phone":
        return !has(draft.phone);
      case "email":
        return !has(draft.email);
    }
  });
}

/** Comma-separated column ⇄ typed list; unknown values are dropped, never invented. */
export function parseItems(csv: string | null | undefined): ItemDamaged[] {
  if (!csv) return [];
  const parts = csv.split(",").map((p) => p.trim().toLowerCase());
  return ITEMS_DAMAGED.filter((item) => parts.includes(item));
}

export function serializeItems(items: readonly ItemDamaged[]): string {
  return ITEMS_DAMAGED.filter((item) => items.includes(item)).join(",");
}
