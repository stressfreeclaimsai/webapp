import * as chrono from "chrono-node";
import Fuse from "fuse.js";
import { parseLocation } from "parse-address";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  EMAIL_SHAPE,
  ITEMS_DAMAGED,
  isStateCode,
  US_STATES,
  utcDate,
  type ItemDamaged,
  type PartialClaimFacts,
  type StateCode,
} from "@/lib/claim-facts";

/**
 * Extraction (B20): local-first deterministic parsers + an optional, guarded
 * Haiku pass for the fuzzy residue. Server-side only — this module is
 * imported exclusively from server actions, and the API key never reaches
 * the client bundle.
 *
 * The architecture, in order of authority:
 *  1. LOCAL PARSERS (always run, zero network): chrono-node for dates, a
 *     street-address locator + parse-address for the address/state split, a
 *     50-state gazetteer, fuse.js fuzzy carrier matching, and the existing
 *     phone/email/items/name heuristics. These OWN every field they fill —
 *     the LLM can never overwrite them.
 *  2. GUARDED LLM PASS (fuzzy residue only: fullName, damageDescription):
 *     called ONLY when a fuzzy field is still empty after the local pass AND
 *     the text plausibly contains it. Hard 2s timeout, circuit breaker,
 *     strict-schema validation — any failure degrades to the pure-local
 *     result. A parse that finds nothing is still a VALID state (AC-8).
 *
 * This amends decision A2 (see open-decisions.md B20): extraction remains
 * local-FIRST and the flow never depends on the network — the LLM is a
 * bounded enhancement that can only add, never block and never overwrite.
 */

// ---------------------------------------------------------------------------
// Part 1 — local deterministic parsers
// ---------------------------------------------------------------------------

/**
 * Carrier hints are a parser constant, NOT an entity (decision A7): no table,
 * no dropdown, no validation gate. They seed exact and fuzzy matching; any
 * unrecognised carrier is accepted as free text.
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCarrierHint(text: string): string | undefined {
  // Longest hint first so "Citizens Property" wins over "Citizens".
  const sorted = [...KNOWN_CARRIER_HINTS].sort((a, b) => b.length - a.length);
  return sorted.find((hint) => new RegExp(`\\b${escapeRegExp(hint)}\\b`, "i").test(text));
}

// Fuzzy carrier matching (fuse.js): catches typos like "Citzens Property".
// Strict threshold — a miss just leaves the carrier as free text (A7).
const carrierFuse = new Fuse([...KNOWN_CARRIER_HINTS], {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
});

function matchCarrier(candidate: string): string | undefined {
  const exact = findCarrierHint(candidate);
  if (exact) return exact;
  const best = carrierFuse.search(candidate)[0];
  return best && best.score !== undefined && best.score <= 0.3 ? best.item : undefined;
}

// Wording that marks a chrono result as deliberate date talk. Weekday names
// matter because chrono leaves their day component "implied" — without this
// list "the storm hit Tuesday" would be dropped by the certainty filter.
const RELATIVE_DATE_RE =
  /yesterday|today|tonight|last night|this (?:morning|afternoon|evening)|(?:day|night)s? ago|last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i;

const ABSOLUTE_DATE_RE =
  /jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}\/\d{1,2}/i;

/**
 * Date of loss via chrono-node, with two house rules layered on top:
 *  - an absolute date outranks relative wording ("yesterday, September 15th"
 *    → the 15th is the fact), and
 *  - a year-less date that resolves forward snaps to the most recent past
 *    occurrence (a storm date is never in the future).
 */
function extractDateOfLoss(text: string, now: Date): Date | undefined {
  const results = chrono
    .parse(text, now)
    // Drop time-only matches ("at 14:44"): keep results with a certain day
    // or deliberate date wording.
    .filter((r) => r.start.isCertain("day") || RELATIVE_DATE_RE.test(r.text));
  if (results.length === 0) return undefined;

  const score = (r: (typeof results)[number]) =>
    (ABSOLUTE_DATE_RE.test(r.text) ? 2 : 0) + (r.start.isCertain("day") ? 1 : 0);
  const best = [...results].sort((a, b) => score(b) - score(a))[0];

  const year = best.start.get("year");
  const month = best.start.get("month");
  const day = best.start.get("day");
  if (year == null || month == null || day == null) return undefined;

  let date = utcDate(year, month - 1, day);
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!best.start.isCertain("year") && date.getTime() > today.getTime()) {
    date = /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(best.text)
      ? new Date(date.getTime() - 7 * 86_400_000)
      : utcDate(year - 1, month - 1, day);
  }
  return date;
}

// People run their name straight into the next fact ("Paul Butcher at 1444
// Wayne Ave") — these connectors mark where the name stops (B19).
const NAME_STOP_WORDS = new Set([
  "at",
  "in",
  "on",
  "and",
  "from",
  "of",
  "with",
  "living",
  "residing",
]);

function extractName(text: string): string | undefined {
  // Explicit ("my name is …") — forgiving about capitalisation.
  const explicit = /\bmy name(?:'s|’s| is)\s+([^.,;\n!?]+)/i.exec(text);
  if (explicit) {
    // Cut at the first connector word or digit-bearing token, so only the
    // name survives; a name is never more than the first 4 words.
    const words = explicit[1].trim().split(/\s+/);
    const cut = words.findIndex((w) => NAME_STOP_WORDS.has(w.toLowerCase()) || /\d/.test(w));
    const kept = (cut === -1 ? words : words.slice(0, cut)).slice(0, 4);
    if (kept.length > 0) return kept.join(" ");
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
  // The city group is greedy but bounded (B19): 1–3 words, each starting
  // with a capital, so ", Lehigh Acres" is kept whole while lowercase prose
  // after the city is never swallowed.
  const street =
    /\b\d{1,6}\s+(?:[A-Za-z0-9'.-]+\s+){0,4}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Circle|Cir|Way|Terrace|Ter|Place|Pl|Trail|Trl|Highway|Hwy)\b\.?(?:\s+(?:N|S|E|W|NE|NW|SE|SW)\b\.?)?(?:,\s*[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2})?(?:,\s*[A-Z]{2})?(?:\s+\d{5}(?:-\d{4})?)?/.exec(
      text,
    );
  return street ? street[0].trim().replace(/[,;]$/, "") : undefined;
}

/**
 * State of loss (B16): the parsed address is the best evidence, then the
 * gazetteer over the raw text — address-style ", FL" abbreviations (the
 * comma + UPPERCASE pair anchors it so prose "in"/"ok" never match), then
 * full state names, longest first.
 */
function extractStateOfLoss(text: string, addressSpan: string | undefined): StateCode | undefined {
  if (addressSpan) {
    const parsed = parseLocation(addressSpan);
    const state = parsed?.state?.toUpperCase();
    if (isStateCode(state)) return state;
  }

  const abbrev = /,\s*([A-Z]{2})\b/.exec(text);
  if (abbrev && isStateCode(abbrev[1])) return abbrev[1];

  const sorted = [...US_STATES].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((s) => new RegExp(`\\b${s.name}\\b`, "i").test(text))?.code;
}

function extractInsurer(text: string): string | undefined {
  // Prefer the phrase the person actually used ("I'm insured by …").
  const phrase =
    /\b(?:insured (?:by|with|through)|insurance (?:company |carrier )?is|insurer is|(?:have|carry) (?:insurance|a policy) (?:with|through)|policy (?:is )?with)\s+([^.,;\n!?]+)/i.exec(
      text,
    );
  if (phrase) {
    const captured = phrase[1].trim().split(/\s+/).slice(0, 6).join(" ");
    // Canonicalise via exact-then-fuzzy matching; otherwise accept free text.
    return matchCarrier(captured) ?? captured;
  }
  // No phrase — scan the whole utterance for a known carrier name (exact
  // only; fuzzy matching against arbitrary prose invites false positives).
  return findCarrierHint(text);
}

// Close synonyms only — never stretch an unknown damage word into an enum
// member (AC-4). "Gazebo" extracts nothing here; that's the LLM's territory
// (damageDescription), and the items gap step still asks from the fixed set.
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
  const match = EMAIL_SHAPE.exec(text);
  return match ? match[0] : undefined;
}

// Damage-ish wording — used both for the local description capture and the
// "could the text plausibly contain a description?" LLM gate.
const DAMAGE_CUE_RE =
  /\bdamag\w*|\bhit\b|\bstorm\b|\bhurricane\b|\bwreck\w*|\bbroke\w*|\bbroken\b|\bdestroy\w*|\bleak\w*|\bflood\w*|\bblew\b|\bblown\b|\bcrush\w*|\btore\b|\btorn\b|\bsmash\w*|\bripped?\b|\bcollaps\w*|\bfell\b|\bgone\b/i;

/**
 * Local damage description: the sentence(s) naming an item from the fixed
 * set, verbatim. Deliberately narrow — damage the enum can't name ("the
 * gazebo got crushed") is exactly the fuzzy residue the LLM pass exists for.
 */
function extractDamageDescription(text: string): string | undefined {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const hits = sentences.filter((s) => ITEMS_DAMAGED.some((item) => ITEM_KEYWORDS[item].test(s)));
  if (hits.length === 0) return undefined;
  return hits.join(" ").trim().slice(0, 300);
}

/** Part 1: pure, deterministic, zero-network. Authoritative on every field it fills. */
export function extractLocalFacts(utterance: string, now: Date = new Date()): PartialClaimFacts {
  const text = (utterance ?? "").trim();
  if (text.length === 0) return {};

  const facts: PartialClaimFacts = {};

  const fullName = extractName(text);
  if (fullName) facts.fullName = fullName;

  const propertyAddress = extractAddress(text);
  if (propertyAddress) facts.propertyAddress = propertyAddress;

  const stateOfLoss = extractStateOfLoss(text, propertyAddress);
  if (stateOfLoss) facts.stateOfLoss = stateOfLoss;

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

  const damageDescription = extractDamageDescription(text);
  if (damageDescription) facts.damageDescription = damageDescription;

  return facts;
}

// ---------------------------------------------------------------------------
// Part 2 — guarded LLM pass (fuzzy residue only: fullName, damageDescription)
// ---------------------------------------------------------------------------

const LLM_MODEL = "claude-haiku-4-5";
const LLM_TIMEOUT_MS = 2000;
const LLM_MAX_TOKENS = 256;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;

type FuzzyField = "fullName" | "damageDescription";

// Per-instance state (serverless: each instance keeps its own counters —
// good enough for a prototype's cost visibility and surge protection).
const llmState = {
  consecutiveFailures: 0,
  breakerOpenUntil: 0,
  intakes: 0,
  calls: 0,
};

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  // maxRetries 0: a retry would blow the 2s budget; the circuit breaker is
  // the recovery mechanism, not backoff.
  anthropicClient ??= new Anthropic({ maxRetries: 0 });
  return anthropicClient;
}

// Cost visibility (B20): one structured line per intake. The invocation rate
// is the real cost driver — watch `rate`.
function logExtraction(event: Record<string, unknown>): void {
  console.log(
    `[extraction] ${JSON.stringify({ ...event, rate: `${llmState.calls}/${llmState.intakes}` })}`,
  );
}

// "Plausibly contains it" gates — cheap, local, deliberately loose.
function mayContainName(text: string): boolean {
  return (
    /[A-Z][a-z'’-]+\s+[A-Z][a-z'’-]+/.test(text) || /\bname\b|\bI['’]?m\b|\bthis is\b/i.test(text)
  );
}

function mayContainDamage(text: string): boolean {
  return DAMAGE_CUE_RE.test(text);
}

function fuzzySchema(fields: FuzzyField[]) {
  const shape: Record<string, z.ZodType<string | null>> = {};
  if (fields.includes("fullName")) {
    shape.fullName = z.union([z.string().trim().min(1).max(120), z.null()]);
  }
  if (fields.includes("damageDescription")) {
    shape.damageDescription = z.union([z.string().trim().min(1).max(300), z.null()]);
  }
  // .strict(): a response with keys we didn't ask for is discarded whole —
  // never half-trust (B20).
  return z.object(shape).strict();
}

const FIELD_INSTRUCTIONS: Record<FuzzyField, string> = {
  fullName:
    "fullName: the person's own name exactly as they stated it (2-4 words). null if no name is stated.",
  damageDescription:
    "damageDescription: one short sentence describing the property damage, in the person's own words where possible. null if no damage is described.",
};

function systemPrompt(fields: FuzzyField[]): string {
  return [
    "You extract fields from a homeowner's storm-damage message for a claim intake form.",
    "Return ONLY JSON matching the requested schema — no prose.",
    "Do not infer or invent: if a field is not clearly present in the message, return null for it.",
    ...fields.map((f) => FIELD_INSTRUCTIONS[f]),
  ].join("\n");
}

// The transport returns the RAW model text; JSON.parse + zod validation is
// one shared path for the real call and the test stub, so tests exercise the
// same guards production runs. Throws on transport failure (counts toward
// the breaker); malformed CONTENT is handled by the caller (discard, no
// breaker — it isn't a surge signature).
async function llmTransport(
  utterance: string,
  fields: FuzzyField[],
): Promise<{ raw: string; inputTokens?: number; outputTokens?: number }> {
  if (process.env.EXTRACTION_LLM_STUB) return stubTransport(utterance, fields);

  // NOTE on prompt caching: the static instruction is far below Haiku 4.5's
  // 4096-token minimum cacheable prefix, so cache_control would silently
  // no-op — deliberately omitted.
  const response = await getClient().messages.create(
    {
      model: LLM_MODEL,
      max_tokens: LLM_MAX_TOKENS,
      temperature: 0,
      system: systemPrompt(fields),
      // The raw utterance ONLY — no conversation history, no draft state.
      messages: [{ role: "user", content: utterance }],
      output_config: { format: zodOutputFormat(fuzzySchema(fields)) },
    },
    { timeout: LLM_TIMEOUT_MS },
  );

  const raw = response.content.find((b) => b.type === "text")?.text ?? "";
  return {
    raw,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Test seam (EXTRACTION_LLM_STUB=1): behavior driven by markers in the
// utterance so Playwright can exercise timeout/malformed/overwrite paths
// through the real UI. Never active in production.
async function stubTransport(
  utterance: string,
  fields: FuzzyField[],
): Promise<{ raw: string }> {
  if (utterance.includes("STUBTIMEOUT")) {
    await new Promise((resolve) => setTimeout(resolve, LLM_TIMEOUT_MS + 8000));
  }
  if (utterance.includes("STUBMALFORMED")) return { raw: "this is not json {{{" };

  const payload: Record<string, string> = {};
  if (fields.includes("fullName")) payload.fullName = "Stub Person";
  if (fields.includes("damageDescription")) payload.damageDescription = "Stub damage description.";
  // Simulates a model returning a field it was NOT asked for — the strict
  // schema must reject the whole response so local values are never at risk.
  if (utterance.includes("STUBOVERWRITE")) payload.fullName = "Hallucinated Name";
  return { raw: JSON.stringify(payload) };
}

async function callFuzzyLlm(
  utterance: string,
  fields: FuzzyField[],
): Promise<Partial<Record<FuzzyField, string>> | null> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hardTimeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), LLM_TIMEOUT_MS);
  });

  try {
    // Belt and braces: the SDK request carries its own timeout, and this
    // race guarantees the flow proceeds after LLM_TIMEOUT_MS no matter what.
    const outcome = await Promise.race([llmTransport(utterance, fields), hardTimeout]);
    if (outcome === "timeout") {
      llmState.consecutiveFailures += 1;
      logExtraction({ llm: "failed", reason: "timeout", ms: Date.now() - started });
      return null;
    }

    llmState.consecutiveFailures = 0;

    let parsed: unknown;
    try {
      parsed = JSON.parse(outcome.raw);
    } catch {
      logExtraction({ llm: "discarded", reason: "not-json", ms: Date.now() - started });
      return null;
    }
    const validated = fuzzySchema(fields).safeParse(parsed);
    if (!validated.success) {
      logExtraction({ llm: "discarded", reason: "schema-mismatch", ms: Date.now() - started });
      return null;
    }

    logExtraction({
      llm: "ok",
      fields,
      ms: Date.now() - started,
      input_tokens: outcome.inputTokens,
      output_tokens: outcome.outputTokens,
    });
    const result: Partial<Record<FuzzyField, string>> = {};
    for (const field of fields) {
      const value = (validated.data as Record<string, string | null>)[field];
      if (typeof value === "string") result[field] = value.trim().slice(0, 300);
    }
    return result;
  } catch (error) {
    // Transport failure (network, 429/5xx, abort) — surge signature.
    llmState.consecutiveFailures += 1;
    logExtraction({
      llm: "failed",
      reason: error instanceof Error ? error.constructor.name : "unknown",
      ms: Date.now() - started,
    });
    return null;
  } finally {
    if (timer) clearTimeout(timer);
    if (llmState.consecutiveFailures >= BREAKER_THRESHOLD) {
      llmState.breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
      llmState.consecutiveFailures = 0;
      logExtraction({ llm: "breaker-opened", cooldown_ms: BREAKER_COOLDOWN_MS });
    }
  }
}

// ---------------------------------------------------------------------------
// The composed extractor
// ---------------------------------------------------------------------------

/**
 * One utterance in, structured facts out. Local parsers always run and are
 * authoritative; the Haiku pass fills at most the still-empty fuzzy fields.
 * Every failure mode (no key, breaker open, timeout, malformed response)
 * degrades to the pure-local result — extraction can slow the start by at
 * most LLM_TIMEOUT_MS and can never fail it.
 */
export async function extractClaimFacts(
  utterance: string,
  now: Date = new Date(),
): Promise<PartialClaimFacts> {
  const facts = extractLocalFacts(utterance, now);
  llmState.intakes += 1;

  const missingFuzzy: FuzzyField[] = [];
  if (!facts.fullName && mayContainName(utterance)) missingFuzzy.push("fullName");
  if (!facts.damageDescription && mayContainDamage(utterance)) {
    missingFuzzy.push("damageDescription");
  }

  if (missingFuzzy.length === 0) {
    logExtraction({ llm: "skipped", reason: "local-complete" });
    return facts;
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.EXTRACTION_LLM_STUB) {
    logExtraction({ llm: "skipped", reason: "no-api-key" });
    return facts;
  }
  if (Date.now() < llmState.breakerOpenUntil) {
    logExtraction({ llm: "skipped", reason: "breaker-open" });
    return facts;
  }

  llmState.calls += 1;
  const fuzzy = await callFuzzyLlm(utterance, missingFuzzy);
  if (!fuzzy) return facts;

  // Merge authority (B20): the LLM only fills fields that are STILL empty —
  // it can never overwrite a locally-parsed value.
  if (!facts.fullName && fuzzy.fullName) facts.fullName = fuzzy.fullName;
  if (!facts.damageDescription && fuzzy.damageDescription) {
    facts.damageDescription = fuzzy.damageDescription;
  }
  return facts;
}
