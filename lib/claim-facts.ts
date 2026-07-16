/**
 * Shared contracts, part 1 (WP-1): pure, deterministic, LOCAL fact extraction
 * and gap derivation. No network, no model call (architecture §9 / decision
 * A2): the person using this just went through a hurricane and may be on a
 * dying phone with a bad connection — extraction must not add latency or a
 * failure mode. A parse that finds nothing is a VALID state, not an error
 * (AC-8): it simply means `missingRequired()` returns everything and the app
 * asks plainly. Never throw on a bad parse.
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

export type ClaimFacts = {
  fullName: string;
  propertyAddress: string;
  dateOfLoss: Date;
  insurerName: string;
  itemsDamaged: ItemDamaged[];
  phone: string;
  email: string;
};
export type PartialClaimFacts = Partial<ClaimFacts>;

// Required to submit (architecture §5): the five ball-rolling facts plus
// phone + email (needed to follow up). The order here is the order the
// gap-filling step asks in. policyNumber and deductible are NOT here — they
// are optional and never block (AC-3).
export const REQUIRED_FIELDS = [
  "fullName",
  "propertyAddress",
  "dateOfLoss",
  "insurerName",
  "itemsDamaged",
  "phone",
  "email",
] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];

/**
 * Carrier hints are a parser constant, NOT an entity (decision A7): no table,
 * no dropdown, no validation gate. They only help the extractor recognise an
 * insurer name; anything unrecognised is accepted as free text.
 */
export const KNOWN_CARRIER_HINTS = [
  "Citizens Property Insurance",
  "Citizens Property",
  "Citizens",
  "State Farm",
  "Allstate",
  "Universal Property",
  "Tower Hill",
  "Heritage",
  "American Integrity",
  "Security First",
  "Frontline",
  "Slide",
  "TypTap",
  "Kin",
  "USAA",
  "Progressive",
  "Liberty Mutual",
  "Farmers",
  "Nationwide",
  "Travelers",
  "Chubb",
  "GEICO",
] as const;

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCarrierHint(text: string): string | undefined {
  // Longest hint first so "Citizens Property" wins over "Citizens".
  const sorted = [...KNOWN_CARRIER_HINTS].sort((a, b) => b.length - a.length);
  return sorted.find((hint) => new RegExp(`\\b${escapeRegExp(hint)}\\b`, "i").test(text));
}

// Dates are anchored to UTC noon so a calendar date never shifts across
// timezones between extraction, storage, and display.
function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function mostRecentPastOccurrence(monthIndex: number, day: number, now: Date): Date {
  const candidate = utcDate(now.getUTCFullYear(), monthIndex, day);
  return candidate.getTime() > now.getTime()
    ? utcDate(now.getUTCFullYear() - 1, monthIndex, day)
    : candidate;
}

function extractDateOfLoss(text: string, now: Date): Date | undefined {
  // 1) Absolute month-name date ("September 15th", "Sept 15, 2025"). An
  //    explicit date outranks a relative word when both appear ("yesterday,
  //    September 15th" — the explicit date is the fact).
  const monthAlternation = MONTHS.map((m) => `${m.slice(0, 3)}(?:${m.slice(3)})?`).join("|");
  const absolute = new RegExp(
    `\\b(${monthAlternation})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`,
    "i",
  ).exec(text);
  if (absolute) {
    const monthIndex = MONTHS.findIndex((m) => m.startsWith(absolute[1].slice(0, 3).toLowerCase()));
    const day = Number(absolute[2]);
    if (monthIndex >= 0 && day >= 1 && day <= 31) {
      if (absolute[3]) return utcDate(Number(absolute[3]), monthIndex, day);
      return mostRecentPastOccurrence(monthIndex, day, now);
    }
  }

  // 2) Numeric date ("9/15", "9/15/2025").
  const numeric = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(text);
  if (numeric) {
    const monthIndex = Number(numeric[1]) - 1;
    const day = Number(numeric[2]);
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      if (numeric[3]) {
        const raw = Number(numeric[3]);
        return utcDate(raw < 100 ? 2000 + raw : raw, monthIndex, day);
      }
      return mostRecentPastOccurrence(monthIndex, day, now);
    }
  }

  // 3) Relative wording ("yesterday", "last night", "two days ago", "today").
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysAgo = /\b(a|an|one|two|three|four|five|six|seven|\d{1,2})\s+(?:day|night)s?\s+ago\b/i.exec(
    text,
  );
  if (daysAgo) {
    const words: Record<string, number> = {
      a: 1,
      an: 1,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
    };
    const n = words[daysAgo[1].toLowerCase()] ?? Number(daysAgo[1]);
    return new Date(today.getTime() - n * 86_400_000);
  }
  if (/\b(?:yesterday|last night)\b/i.test(text)) return new Date(today.getTime() - 86_400_000);
  if (/\b(?:today|this morning|this afternoon|this evening|tonight)\b/i.test(text)) return today;
  if (/\blast week\b/i.test(text)) return new Date(today.getTime() - 7 * 86_400_000);

  return undefined;
}

function extractName(text: string): string | undefined {
  // Explicit ("my name is …") — forgiving about capitalisation.
  const explicit = /\bmy name(?:'s|’s| is)\s+([^.,;\n!?]+)/i.exec(text);
  if (explicit) {
    const words = explicit[1].trim().split(/\s+/).slice(0, 4);
    if (words.length > 0) return words.join(" ");
  }
  // Weaker openers ("I'm Jane Smith", "This is Jane Smith") — require a
  // capitalised First Last so "I'm insured by…" never reads as a name.
  const weak =
    /\b(?:I['’]m|I am|this is)\s+([A-Z][A-Za-z'’-]+\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)\b/.exec(
      text,
    );
  return weak ? weak[1].trim() : undefined;
}

function extractAddress(text: string): string | undefined {
  // Explicit ("my address is …") — capture up to the end of the sentence.
  const explicit =
    /\b(?:(?:my|our|the) address is|address:|(?:i|we) live at|(?:my|our|the) (?:house|home|property) is (?:at|on)|located at)\s+([^\n]+?)(?=[.!?](?:\s|$)|$)/i.exec(
      text,
    );
  if (explicit) return explicit[1].trim();

  // Fallback: a bare street address ("927 11th St N, Naples, FL 34102").
  const street =
    /\b\d{1,6}\s+(?:[A-Za-z0-9'.-]+\s+){0,4}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Circle|Cir|Way|Terrace|Ter|Place|Pl|Trail|Trl|Highway|Hwy)\b\.?(?:\s+(?:N|S|E|W|NE|NW|SE|SW)\b\.?)?(?:,\s*[A-Za-z][A-Za-z .'-]*?)?(?:,\s*[A-Z]{2})?(?:\s+\d{5}(?:-\d{4})?)?/.exec(
      text,
    );
  return street ? street[0].trim().replace(/[,;]$/, "") : undefined;
}

function extractInsurer(text: string): string | undefined {
  // Prefer the phrase the person actually used ("I'm insured by …").
  const phrase =
    /\b(?:insured (?:by|with|through)|insurance (?:company |carrier )?is|insurer is|(?:have|carry) (?:insurance|a policy) (?:with|through)|policy (?:is )?with)\s+([^.,;\n!?]+)/i.exec(
      text,
    );
  if (phrase) {
    const captured = phrase[1].trim().split(/\s+/).slice(0, 6).join(" ");
    // Canonicalise via the hints when possible; otherwise accept free text.
    return findCarrierHint(captured) ?? captured;
  }
  // No phrase — scan the whole utterance for a known carrier name.
  return findCarrierHint(text);
}

// Close synonyms only — never stretch an unknown damage word into an enum
// member (AC-4). "Gazebo" extracts nothing; the gap step asks instead.
const ITEM_KEYWORDS: Record<ItemDamaged, RegExp> = {
  roof: /\broof(?:s|ing)?\b|\bshingles?\b/i,
  siding: /\bsiding\b/i,
  window: /\bwindows?\b/i,
  drywall: /\bdrywall\b|\bsheet\s?rock\b/i,
  contents: /\bcontents\b|\bbelongings\b|\bfurniture\b/i,
};

function extractItems(text: string): ItemDamaged[] {
  return ITEMS_DAMAGED.filter((item) => ITEM_KEYWORDS[item].test(text));
}

function extractPhone(text: string): string | undefined {
  const match = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/.exec(text);
  return match ? match[0].trim() : undefined;
}

function extractEmail(text: string): string | undefined {
  const match = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(text);
  return match ? match[0] : undefined;
}

/**
 * Turn one free-text utterance into structured claim facts. Pure and
 * deterministic; `now` is injectable so relative dates ("yesterday") are
 * testable. Returns ONLY what it found — no scores, no confidence values
 * (architecture §5); a field is either extracted or absent.
 */
export function extractClaimFacts(utterance: string, now: Date = new Date()): PartialClaimFacts {
  const text = (utterance ?? "").trim();
  if (text.length === 0) return {};

  const facts: PartialClaimFacts = {};

  const fullName = extractName(text);
  if (fullName) facts.fullName = fullName;

  const propertyAddress = extractAddress(text);
  if (propertyAddress) facts.propertyAddress = propertyAddress;

  const dateOfLoss = extractDateOfLoss(text, now);
  if (dateOfLoss) facts.dateOfLoss = dateOfLoss;

  const insurerName = extractInsurer(text);
  if (insurerName) facts.insurerName = insurerName;

  const itemsDamaged = extractItems(text);
  if (itemsDamaged.length > 0) facts.itemsDamaged = itemsDamaged;

  const phone = extractPhone(text);
  if (phone) facts.phone = phone;

  const email = extractEmail(text);
  if (email) facts.email = email;

  return facts;
}

/** Loose input shape so both PartialClaimFacts and a DB draft row fit. */
export type FactsLike = {
  fullName?: string | null;
  propertyAddress?: string | null;
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
