# open-decisions.md — StressFreeClaim.ai

> Defaults the distiller chose (logged, not asked). Reverse any of these by editing the spec. Archetype scaffolding/stack decisions are preserved below the project decisions.

## Project decisions (distillation, 2026-07-07)

1. **Governing track: prototype** — a customer-validation slice of the conversational intake experience on the archetype; the contracting engine (PA + Nexus contracts, signatures, CRM, fee-waiver) and the future AI/portal products are promotion-track and deferred. *Why: the differentiator is legally gated (see #2), and the intake slice is the only piece that can move now.* The architect treats this as settled.
2. **The fee-waiver + PA-as-contractor model is NOT prototyped** — it is very likely an illegal inducement / prohibited financial-interest arrangement as structured (domain research). It becomes the #1 blocking legal question (`questions.md` Q1), surfaced in the SOW's regulated phase. Not built, not demoed.
3. **Reshaped to the intake experience only** — the doc described intake + a contracting engine + future products; the prototype validates the customer-facing, non-gated piece. (Pending confirm: Q3.)
4. **Loop extended with a non-functional concierge preview** (AC-6) — so the prototype shows the "start to finish + repairs" promise the doc sells, without building filing/inspection/contracts. Answers the critic's "loop ends too early."
5. **Assistant defaults to a text-first guided flow** — reconciles the doc's voice-vs-typed-fallback. Voice is a distinct fork, deferred to Q2, not folded into the text build.
6. **Deductible kept as an optional captured field only** — never handled; deductible waiver/absorption is a separate legal landmine.
7. **Web / mobile-first, not native** — answers the founder's "separate iOS/Android apps?" question with "not yet"; native is a later, separate track (Q7).
8. **No CRM/Excel system of record in the prototype** — throwaway local data; the CRM-vs-Excel question is a promotion-track ops decision.

## Revisions from the founder's answers (2026-07-07)

9. **Intake opens as one natural-language utterance, not a twelve-field wizard** — reconciles the doc's field list with the founder's own scenario and his "**this is really all the information needed to get the ball rolling**." The utterance captures name, address, date of loss, insurer, items damaged; the app then asks only for phone/email; policy number and deductible stay optional and non-blocking. (Confirm at `questions.md` Q9.)
10. **Designed for the post-hurricane, no-power moment** — the founder's stated biggest opportunity. Minimal typing, forgiving parse, correctable at Review, tolerant of a bad connection. This is *why* the loop is utterance-first; it is a design constraint, not a preference.
11. **First user settled: the self-serve homeowner** — reached by Facebook/TikTok ads, opening the app "long before that homeowner would meet with one of my reps." Not rep-assisted. (Q4 resolved.)
12. **Reach is an ads problem, not an app feature** — the app is the destination; the acquisition plan is pre-storm ad blanketing (and, later, push notifications). The prototype does not claim to test reach. (Q5 resolved; the doc's internal contradiction dissolved by the founder.)
13. **Branding settled: StressFreeClaim.ai fronts; Deskar 6 + Nexus behind the scenes.** (Q8 resolved.)
14. **Q1 (fee-waiver / PA-as-contractor legality) remains flagged, not closed** — the founder believes he has it figured out but has no counsel yet and names e-signing as open. A founder's confidence is not a legal opinion, so the sourced flags stand unchanged. *This no longer blocks Phase 1:* the founder confirms the intake function has value independent of the fee model ("could be used by a roofer, or any construction company"), so the prototype does not depend on how Q1 resolves.
15. **Native app + push notifications reframed as a promotion-track GTM dependency** — the founder's distribution model needs pre-storm installs and push prompts, which imply native/PWA. The prototype stays mobile-web (validation artifact, no app-store gate), but this is now a named dependency rather than a "maybe later." (Q7.)

---

## Architect decisions (G1)

Technical calls made while planning the build (see `mission/architecture.md`). Scope and track unchanged — these are *how* to build the settled spec, not *what* to build.

A1. **Stack: golden path, no deviation — and specifically no LLM/speech dependency.** Next.js/TS/Tailwind/Prisma·SQLite/Vercel as-is; no API keys, no external integrations, no outbound network calls in the flow.
A2. **Fact extraction is deterministic and local** — `extractClaimFacts()` uses pattern/keyword matching, not a model call. *Why:* the spec's own design constraint is a homeowner with no power on a bad connection; a remote call adds latency and a failure mode at exactly that moment, and the distiller already specced the safety net (forgiving parse → gap-filling → Review). Revisit if voice (Q2) ships, since speech already implies a service.
A3. **Server-authoritative shared contracts** — `extractClaimFacts`, `missingRequired`, `saveDraft`/`loadDraft`, `submitClaim` defined once (WP-1) and consumed everywhere; `submitClaim` re-validates completeness server-side. No screen re-implements them.
A4. **A failed parse is a valid state, not an error** — it simply means `missingRequired()` returns everything and the app asks plainly. Codified as **[AC-8]**; never throw, never dead-end.
A5. **The raw utterance is not persisted** — only the extracted structured facts are saved. *Why:* `scope.md` says the app will not record or store conversations; persisting the text would blur a line the distiller drew deliberately.
A6. **In-progress state = a `ClaimDraft` row keyed by an opaque demo-session cookie** — reload-safe, so a dropped connection or dying battery doesn't lose the claim (the founder's core scenario). Not auth: no identity, enforces nothing. See the constitution-gap flag in architecture §2.
A7. **Carrier hints are a parser constant, not an entity** — `KNOWN_CARRIER_HINTS` (incl. "Citizens Property") aids extraction only; no Carrier table, no dropdown, no validation gate. An unrecognised insurer is accepted as free text.
A8. **Welcome and the utterance box are merged onto `/`** — one route delivers loop steps 1–2; both [AC-1] and [AC-2] hold. *Why:* a splash screen is a wasted tap for someone post-storm. Four routes total, within the ≤5-screen guideline.
A9. **New build-slice criterion [AC-8]** added (server-authoritative extraction/gap-derivation + never-trap fallback), continuing the distiller's sequence; [AC-1]–[AC-7] carried forward unchanged.

*No Q&A round was needed — all technical ambiguity resolved against archetype defaults and the settled spec.*

---

## Builder decisions (G2 build, 2026-07-15)

Residual technical ambiguity resolved against archetype defaults while
implementing WP-1–WP-7. Scope, track, and the architect's calls unchanged.

B1. **Items damaged is a comma-separated string column, not a Prisma enum** —
  Prisma has no enums or arrays on SQLite. `lib/claim-facts.ts` owns the
  canonical five-value set; unknown values are dropped on parse and never
  invented (AC-4 enforced in code, not the schema).
B2. **The intake snapshot lives on the Claim** (`claimantName`,
  `propertyAddress`, `phone`, `email`), linked to the seeded Homeowner rather
  than overwriting the Homeowner's fields on submit. *Why: a demo claim stays
  self-contained and readable without joins, and repeated demo runs with
  different names can't cross-contaminate the one seeded homeowner.*
B3. **Each new utterance mints a fresh demo-session key** — "start another
  claim" is just returning to `/`; abandoned drafts are orphaned throwaway
  rows, reconstructable-from-nothing by design.
B4. **Submit fires from the Review action, and `submitClaim` is idempotent per
  session** (the draft records its `claimId`). The architecture's "on arrival
  at `/done`, call submitClaim()" is realized as: Review's confirm action
  submits, `/done` reads the stored claim back. *Why: a reload of the
  confirmation — likely on a flaky connection — must never file a second demo
  claim.* Server-side re-validation is unchanged (AC-8).
B5. **Optional extras are one skippable step after the required gaps**, tracked
  by a `optionalsOffered` flag so policy number / deductible are offered
  exactly once and can never block or re-ask (AC-3).
B6. **Date handling:** all dates anchor to UTC noon so the calendar date never
  shifts across timezones; a year-less date ("September 15th") resolves to its
  most recent past occurrence; an absolute date outranks a relative word when
  both appear ("yesterday, September 15th" → September 15).
B7. **Phone and email are also extracted from the utterance when present.**
  The spec's extraction list is the five ball-rolling facts, but AC-3's "asks
  only for what's missing" wins: if the sentence already contains a phone or
  email, re-asking would violate the minimal-follow-ups promise.
B8. **Identity derived from the adjectives** (calm · reassuring · effortless ·
  plain-spoken): warm paper neutrals + one deep sea-green accent (neither
  insurance-corporate cold nor roofer-orange nor AI-default purple); Fraunces
  display over Public Sans body. All in the `@theme` token block; no ad-hoc
  values elsewhere.
B9. **Playwright runs serial (`workers: 1`)** — the acceptance flows share one
  throwaway SQLite file and one dev server; parallel workers invite lock
  contention, not speed.
B10. **AC-4/AC-8 server contracts are asserted through the UI**, not by
  importing `lib/` into tests — the Playwright/Node 24 sync-ESM-loader bug
  (below) forbids local TS imports in test files. Skipping ahead to `/done` or
  `/review` mid-flow routes back to `/gaps`, proving the server-side guards.
B11. **WP-7 (should-tier) shipped:** warmth in the assistant copy, a
  screenshot-able claim summary with an `SFC-` reference on `/done`, and a
  non-interactive voice signpost on `/` ("Voice is on the way — typing works
  today") that cannot be mistaken for working speech.
B12. **Vercel deploy: seed at build, copy SQLite to /tmp at cold start.**
  Vercel's serverless filesystem is read-only and ephemeral, but the flow
  writes on every step. `vercel-build` seeds `prisma/dev.db` during build, the
  file is bundled into every route's function (`outputFileTracingIncludes`),
  and `lib/db.ts` copies it to `/tmp` on cold start when `VERCEL` is set —
  locally inert. *Trade-off accepted:* `/tmp` is per-instance, so demo data
  resets on cold starts and a mid-flow draft can vanish if traffic hops
  instances — acceptable for a single-demo-user walkthrough of throwaway data
  (the flow degrades to the front door, never a dead-end). A hosted database
  would be a stack deviation needing an Architect decision — declined for a
  validation artifact.
B13. **Draft state moved from a ClaimDraft row to the httpOnly demo cookie —
  amends the realization of A6.** Deploying to Vercel proved (by an e2e probe
  against production) that per-invocation `/tmp` SQLite cannot carry state
  across requests: a draft written by one request was invisible to the next,
  every time. The draft now travels as base64url JSON in the httpOnly cookie
  (`lib/session.ts` + `lib/claims.ts`); string fields are clipped to keep the
  cookie small. What A6 was *for* is preserved: the draft still survives
  reloads and a dying battery, still carries no identity, and enforces
  nothing; extraction, gap-derivation, and submit validation remain fully
  server-side ([AC-8]). The demo Claim row is still written at submit
  ([AC-6]) — on serverless it is a write-only record, and `/done` renders
  from the submitted cookie snapshot, so the confirmation never depends on a
  cross-instance read. The ClaimDraft table is removed from the schema;
  B3–B5's session-key/`optionalsOffered`/idempotent-submit semantics carry
  over unchanged, now keyed by the cookie itself.

## Validation pass (2026-07-21)

B14. **Date-of-loss plausibility: not in the future, not more than 24 months
  back.** *This rule is a founder decision, not spec-derived* — the spec pack
  defines no date window (a flagged gap); the founder set the bound directly.
  Enforced in shared lib code (`validateDateOfLoss` in `lib/claim-facts.ts`,
  re-checked server-side in `submitClaim`), applied on both `/review` and the
  `/gaps` date step, never by HTML attributes alone. Never-trap: the
  implausible value stays in the draft so the step re-renders with the typed
  input kept and plain inline guidance — no error screen ([AC-8]). An
  implausible date parsed from the opening utterance is dropped rather than
  contested, so the flow never opens by arguing with the person.
B15. **Email shape validation.** The spec names no email format (a flagged
  gap); the app now enforces the same shape the extractor already recognized
  (`user@domain.tld`), shared-lib + server-side, on `/review` and the `/gaps`
  email step, with the same never-trap re-ask. Shape only — no deliverability
  or network check. The utterance box stays fully forgiving: any non-empty
  string falls through to gap-filling.
B16. **State of loss captured as a required 50-state + DC enum select — never
  free text.** New field (`stateOfLoss`, two-letter code) on the draft and the
  Claim row; extraction reads address-style abbreviations (", FL") and full
  state names from the utterance; the gap step asks it like any other required
  field, so never-trap holds. A non-enum value is cleared server-side and the
  flow routes back to the question — it can never reach a Claim row. City was
  deliberately not added. **Deferred — flagged for the founder + regulatory
  attorney: state-based eligibility.** Capture only; NO logic blocks, warns,
  declines, or routes a claim based on whether the state is one the founder
  is licensed in. Whether and how to gate on licensing is a legal decision,
  out of prototype scope (consistent with the settled Won'ts in `scope.md`).
B17. **Open founder decision — policyNumber format.** Left exactly as-is
  (free text, optional, no validation); real formats are carrier-specific and
  A7 already rules carrier hints out as a validation gate. Revisit only if
  the founder supplies a format worth checking.

## Visual pass (2026-07-21)

B18. **App palette moved sea-green → coral/warm-serif (founder direction),
  applied app-wide via the token layer.** New identity: warm paper bg, white
  panels, oxblood Fraunces display headings, Inter body (replacing Public
  Sans), bright coral accents with a darker terracotta reserved for button
  fills so white button text stays WCAG AA (coral itself is ~3.2:1 on the bg
  and is used decoratively only; textual accents use the deeper --color-warn
  at ~6.1:1). Wordmark merged into the prototype bar (one translucent row,
  warning right — the §7 affordance text is unchanged). Card radius 22px,
  non-input line-height tightened (leading-relaxed 1.625 → 1.5) so the inputs
  carry the visual weight. Every screen inherits through globals.css tokens;
  no flow, state, validation, or test changes.
  *Pending founder call:* the brief's landing H1 copy ("We're here to help")
  is NOT applied — the frozen [AC-1] gate pins the current greeting and this
  pass may not touch tests. Applying it requires amending spec.md AC-1 + the
  AC-1 test together.

B19. **Extractor precision fix — still deterministic-local (A2), no scope
  change.** Real-world use surfaced two regex artifacts: the explicit name
  capture swallowed the start of the address ("Paul Butcher at 1444"), and
  the bare-street-address fallback's lazy city group truncated every city to
  its first letter ("1444 Wayne Ave, L"). The name capture now stops at the
  first connector word (at/in/on/and/from/of/with/living/residing) or
  digit-bearing token; the city group is now greedy but bounded (1–3
  capitalised words), so ", Lehigh Acres" survives whole while lowercase
  prose after the city is never swallowed. *Known limit, accepted:* a
  ", LA" utterance reads as Louisiana by the comma-abbreviation state rule —
  deterministic extraction can't tell it from Los Angeles; /review is the
  correction point (AC-5).

## Extraction architecture (2026-07-21)

B20. **Extraction rebuilt as local-first parsers + a guarded, optional Haiku
  pass for fuzzy fields — founder direction; amends A2.** A2's *spirit* is
  preserved: the flow never depends on the network. Local, deterministic,
  zero-network parsers always run and are authoritative — chrono-node for
  dates ("yesterday", "the storm hit Tuesday", with absolute-over-relative
  and most-recent-past-occurrence rules preserved), a street-address locator
  + `parse-address` for the address/state split, the 50-state gazetteer
  (B16), fuse.js fuzzy carrier matching against the A7 hint list (typos like
  "Citzens" canonicalise; a miss stays free text), and the existing
  phone/email/items/name heuristics. The LLM (`claude-haiku-4-5`, temp 0,
  max_tokens 256, strict-JSON output) exists ONLY for the fuzzy residue —
  fullName and the new capture-only damageDescription (→ `Claim.notes`) —
  and is invoked only when such a field is empty after the local pass AND
  the text plausibly contains it; invocation rate and per-call tokens are
  logged. Guards, all required and all degrading to pure-local: 2s hard
  timeout (SDK timeout + Promise.race), circuit breaker (3 consecutive
  transport failures → 60s cooldown, per serverless instance), strict zod
  schema (any mismatch, including unrequested keys, discards the whole
  response), and merge authority (the LLM only fills still-empty fuzzy
  fields — it can never overwrite a locally-parsed value). LLM output flows
  through the same server-side validation as typed input (B14/B15/B16), so
  extraction quality stays decoupled from data integrity; /review remains
  the human-correction net. Placement: the pass runs INSIDE the utterance
  submit transition (`startClaim`), bounded by the timeout — chosen over
  async post-submit enhancement (which would need draft re-patching after
  redirect) per the founder's stated assumption. New dependency:
  `ANTHROPIC_API_KEY` as a server-only env var (Vercel Production/Preview,
  alongside DATABASE_URL); with no key the app runs pure-local, so the demo
  never breaks without it. itemsDamaged stays on the local keyword matcher —
  AC-4's "never invent an enum member" is frozen, and the LLM never touches
  enum or validated fields. Tests stub the LLM transport at the same
  JSON+zod validation path via EXTRACTION_LLM_STUB (playwright webServer
  env), so timeout/malformed/merge guards are exercised through the real UI.
B21. **B20's visibility gap closed: damageDescription is editable on
  /review.** B20 shipped the field capture-only — the one persisted value
  (LLM-fillable, no less) with no human-correction surface before it reached
  a Claim row. It now renders on /review as an optional free-text textarea
  ("Damage, in your own words" — distinct from the items label, which
  already uses "What was damaged"), pre-filled from the draft, folded into
  the draft by the same confirmAndSubmit → submitClaim path as every other
  correction (same trim + 300-char clip in `applyPatch`; no new mechanism,
  no separate write). Forgiving and optional by design: empty is valid,
  never blocks, no format rules. This restores the property that every
  field persisted at submit is user-correctable on /review first (AC-5's
  correction-net principle, extended to the B20 field).

## Scaffolding decisions (archetype setup, 2026-06-16)

> Preserved from scaffolding — stack/tooling decisions the builder still relies on.

- **Pinned stack versions.** Next.js 15.x · React 19.x · TypeScript 5.x ·
  Tailwind 4.x · Prisma 6.x · Playwright 1.x · tsx 4.x. Exact versions are
  locked in `package-lock.json`. _Why: reproducibility + clean handoff (§3)._
- **Tailwind v4 (CSS-first `@theme`)** chosen over v3 config. _Why: the whole
  visual identity lives in one `@theme` block as tokens — the cleanest expression
  of §6 "derive from tokens," trivially swappable per project._
- **Design identity is a placeholder.** The token values in `app/globals.css` are
  an intentionally neutral warm placeholder; the real per-project palette + type
  pairing are generated by the design-tokens skill. _Why: tokens are a per-project
  artifact, not a house look._
- **Example entity = `User` + `Note`.** Marked "EXAMPLE — replace per project"; to
  be replaced for this project by Homeowner + Claim (see `data-model-hints.md`).
  _Why: the archetype ships the pattern, not the domain._
- **No auth/account UI of any kind.** The demo user is loaded implicitly — no login,
  signup, account menu, or user picker. _Why: constitution §2/§8; the most common scope leak._
- **Guarded file-level reset seed.** `npm run seed` deletes the local SQLite file then
  runs `prisma db push`, gated by `scripts/env.ts#assertLocalSqlite` (refuses unless
  `DATABASE_URL` starts with `file:`). _Why: honest reset for throwaway data; avoids the
  Prisma AI-agent guard on `--force-reset`._
- **Env loading without a dependency.** tsx scripts use Node's `process.loadEnvFile`
  with a `file:./dev.db` fallback. _Why: avoid a dependency the archetype doesn't need (§3)._
- **`/verify` is a runnable stub.** Runs Playwright, maps `[AC-n]`-prefixed test titles
  to criteria, prints a pass/fail table, exits non-zero on failure. _Why: end-to-end
  runnable today; depth is Phase 0 work._

## Known issues / workarounds

- **Playwright 1.61 + Node 24.2.0 sync-ESM-loader bug.** Playwright's sync ESM loader
  calls `context.conditions.includes("import")`, but Node 24.2.0 passes `conditions` as
  a `Set` (no `.includes`), so **any local TS import in a Playwright-loaded file crashes**.
  Workaround: test files import only bare `@playwright/test`; `tests/global-setup.ts`
  imports only Node builtins; the console/network-error fixture is defined inline in
  `tests/home.spec.ts` via `test.extend`. Revisit once Playwright or Node patches this.
- **Stale SQLite handle after reseed under a live dev server.** `npm run seed` (also run
  by the Playwright globalSetup, i.e. by `npm run test`/`npm run verify`) deletes and
  recreates `prisma/dev.db`. A dev server that already opened a Prisma connection keeps a
  handle to the deleted inode, and SQLite then rejects every write with "attempt to write
  a readonly database" — reads still work, so only submits fail (as waitForURL timeouts
  on /done). Workaround: don't keep a long-lived dev server across a reseed — stop it and
  let Playwright's webServer spawn fresh (or restart the dev server after seeding).
