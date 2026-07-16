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
