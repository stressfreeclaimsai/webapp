# WP-1 — Schema, seed & shared contracts

> The foundation every other package consumes. No UI. Defines the data, the Kaczmarek hurricane scenario, and the server-authoritative extraction / gap-derivation / submit contracts.

## Goal
Stand up the schema and seeded demo scenario, and expose the shared server contracts — deterministic fact extraction, gap derivation, draft accessors, and submit — so no screen re-implements them or trusts the client.

## Depends on (contracts consumed)
- None (first package).

## Scope (build this)
- **Schema** (`prisma/schema.prisma`): `Homeowner`, `Claim`, `ClaimDraft`; enum `ItemDamaged` (roof/siding/window/drywall/contents).
- **Seed** (`prisma/seed.ts`): the founder's real scenario — Homeowner **Martin Kaczmarek**, **927 11th St N, Naples, FL**; a demo Claim shape for **Citizens Property**, date of loss **September 15** (reads ~1 day old), items **roof + window**; policy number and deductible deliberately **empty** (proving the flow completes without them). Phone/email are clearly-fake demo values (captured in-flow, not pre-seeded as real).
- **`extractClaimFacts(utterance) → PartialClaimFacts`** — pure, deterministic, **local** (no network, no model call). Pattern/keyword matching for: name ("my name is…", "I'm…"), street address, date of loss (absolute "September 15th" **and** relative "yesterday"/"last night"), insurer (via `KNOWN_CARRIER_HINTS`, else accept free text), items damaged (keyword → `ItemDamaged`). Returns only what it found — **no scores or confidence values**; a field is extracted or absent.
- **`KNOWN_CARRIER_HINTS`** — a small parser constant incl. "Citizens Property". **Not** a table, dropdown, or validation gate.
- **`missingRequired(draft) → Field[]`** — pure derivation. Required: name, property address, date of loss, insurer, ≥1 item, **phone, email**. Never gating: policyNumber, deductible.
- **`saveDraft(sessionKey, partial)` / `loadDraft(sessionKey)`** — ClaimDraft accessors; reload-safe.
- **`submitClaim(sessionKey) → Claim`** — validates `missingRequired()` is empty **server-side**, then creates the demo Claim. Rejects an incomplete draft.

## Out of scope (other WPs / not the slice)
- All UI (`/` WP-2; `/gaps` WP-3; `/review` WP-4; `/done` WP-5). Persisting the raw utterance (deliberately not stored — architecture §9). Accounts, payments, contracts, signatures, CRM — settled Won'ts.

## Acceptance criteria
- **[AC-4]** Items damaged resolve to the fixed list: roof, siding, window, drywall, contents. No console errors.
- **[AC-8]** Extraction and gap-derivation are server-authoritative, and a partial or failed parse always falls through to plain gap-filling rather than dead-ending: `submitClaim` rejects a draft while `missingRequired()` is non-empty, and an unparseable utterance yields a draft asking for everything. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-4]` "damage to my roof and a couple of windows" → `[roof, window]`; unknown damage words don't invent an enum member; only the five values are ever produced — asserted against `extractClaimFacts()`.
- `[AC-8]` the founder's full utterance extracts all five facts and `missingRequired()` returns only `[phone, email]`; an empty/garbage utterance yields a draft where `missingRequired()` returns everything (**no throw, no dead-end**); `submitClaim` rejects while `missingRequired()` is non-empty and succeeds once complete — all asserted against the server actions, not UI state.

## Notes
Extraction is **local and deterministic** — no model call, no network (architecture §9). A parse that finds nothing is a *valid* state, not an error: it just means the app asks for everything. Never throw on a bad parse.
