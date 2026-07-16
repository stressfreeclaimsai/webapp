# architecture.md — StressFreeClaim.ai (prototype slice)

> The Architect's build plan (G1). Input: the StressFreeClaim.ai spec pack (`mission/spec/`) + `constitution.md`. Track: **prototype**, settled upstream — see `open-decisions.md` #1. This plan interprets the settled spec to plan it; it does not reshape scope or re-decide the track. `[AC-1]`–`[AC-7]` carry forward unchanged; `[AC-8]` is new and continues the sequence.

---

## 1. Interpretation (to plan, not reshape)

The settled bet: a homeowner, in the mess right after a hurricane, **tells the app what happened in one sentence** and trusts that someone will take it from there. The founder's own utterance is the target, and his framing — *"this is really all the information needed to get the ball rolling"* — is why the loop opens with a sentence instead of a twelve-field form. His stated design constraint is the sharpest input in the pack: *"after a hurricane, a lot of people are without power. This is our biggest opportunity."* Everything below optimizes for that moment — minimal taps, no network round-trips we don't need, and nothing lost if the phone dies mid-flow.

Two shared contracts every screen leans on, both built first (WP-1):
- **Fact extraction** — turn one free-text utterance into structured claim facts (name, address, date of loss, insurer, items damaged).
- **Gap derivation** — given a partial draft, compute exactly what's still needed, so the app asks for the minimum and **never dead-ends on a failed parse** (the distiller's specced safety net: forgiving parse → ask plainly → Review corrects).

Scope and track are taken as given. Every Must in `scope.md` is planned; nothing cut, grown, or retiered. The fee-waiver / contracts / signatures remain out — settled upstream, not re-litigated here.

## 2. Constitution-gap flag (note, not resolved by reshaping)

The archetype has **no sanctioned pattern for anonymous in-progress draft state**. This prototype is a multi-step flow with no accounts (§2/§8), so a partially-filled claim needs somewhere to live between screens. This plan realizes it as a `ClaimDraft` row keyed by a **transparent demo-session cookie** (§5) — it carries no identity and enforces nothing; it is not auth.

*Engine note for the operator (not a gate):* the constitution would benefit from a clause blessing this — *"a no-auth prototype may keep in-progress draft state under an opaque demo-session key; it must enforce nothing and carry no identity."* Any multi-step unauthenticated flow will hit this. Flagged, not closed by cutting scope.

## 3. Stack

Golden path as-is: Next.js (App Router) · TypeScript strict · Tailwind · Prisma/SQLite · Vercel. **No stack extension, and specifically no LLM/speech dependency** — see §9 for why that's the load-bearing call. **Mobile-web first** (the design floor is doing real work here: this is a phone, outdoors, on a bad connection). No secrets, no external integrations, no network calls beyond the app's own server actions (§7 moot by construction). No deviation logged.

## 4. Data model

Faithful to `data-model-hints.md`, scoped to the slice. Nothing enforced as a security boundary (single seeded homeowner, no accounts).

| Entity | Prototype notes |
|---|---|
| Homeowner | 1 seeded (Martin Kaczmarek). Fields: firstName, lastName, streetAddress, city, state, zip, phone, email. The implicit demo user; no credentials. |
| Claim | Created on submit. Fields: insurerName (free text), policyNumber (optional), deductible (optional), dateOfLoss (Date), itemsDamaged (enum list), notes. |
| ClaimDraft | In-progress state between screens, keyed by the demo-session cookie. Throwaway; reload-safe. Holds the partial facts, not the raw utterance (see §9). |
| ItemDamaged | Enum, verbatim from the doc: **roof · siding · window · drywall · contents**. |

**Carrier hints are a parser constant, not an entity.** A small `KNOWN_CARRIER_HINTS` list (incl. "Citizens Property") helps the extractor recognise an insurer name. It is **not** a table, not a dropdown, and not a validation gate — the spec deliberately seeds no carrier list, and an unrecognised insurer is accepted as free text.

## 5. Shared contracts (server-authoritative)

No multi-state lifecycle here, but the mechanics that matter are defined once in WP-1 and consumed everywhere. All are server-side; no screen re-implements them.

- `extractClaimFacts(utterance) → PartialClaimFacts` — **pure, deterministic, local.** Pattern + keyword matching over the utterance: name ("my name is…"/"I'm…"), street address, date of loss (absolute "September 15th" and relative "yesterday"/"last night"), insurer (via `KNOWN_CARRIER_HINTS`, else free text), items damaged (keyword → `ItemDamaged` enum). Returns only what it found — **no scores, no confidence values**; a field is either extracted or absent.
- `missingRequired(draft) → Field[]` — pure derivation. Required to submit: name, property address, date of loss, insurer, ≥1 item damaged, **plus phone + email** (needed to follow up). Optional and never gating: policyNumber, deductible.
- `saveDraft(sessionKey, partial)` / `loadDraft(sessionKey)` — the ClaimDraft accessors; reload-safe.
- `submitClaim(sessionKey) → Claim` — validates `missingRequired()` is empty **server-side**, then creates the demo Claim. Rejects an incomplete draft; never trusts the client.

**The never-trap rule is a contract, not a UI nicety:** a parse that finds nothing is a *valid* state — it simply means `missingRequired()` returns everything and the app asks plainly. There is no failure path where the user is stuck ([AC-8]).

## 6. Screens & routing

Four routes deliver the spec's five loop steps — **within the ≤5-screen guideline**. Welcome and the utterance box are merged onto one route deliberately: for someone post-storm, a splash screen is a wasted tap. Both [AC-1] and [AC-2] hold on it.

- `/` — **Welcome + "Tell me what happened"**: the StressFreeClaim.ai greeting and one free-text box (loop steps 1–2). [AC-1], [AC-2]
- `/gaps` — **Fill the gaps**: asks only for what `missingRequired()` returned; optional fields never block. [AC-3]
- `/review` — **Review & correct**: everything captured, editable; the safety net for an imperfect parse. [AC-5]
- `/done` — **Confirmation + concierge preview**: reassurance, then the non-functional file → inspection → approved-repair preview. [AC-6]

The "prototype — not for real data" affordance is global. [AC-7]

## 7. Work packages (execution order)

Contracts: **WP-1** defines the data types, `extractClaimFacts()`, `missingRequired()`, the draft accessors, and `submitClaim()` that WP-2–WP-5 consume; **WP-2** establishes the demo-session cookie + draft that WP-3/WP-4 read. After WP-1 + WP-2 land, **WP-3 and WP-4 can run in parallel** (both read the same draft contract); WP-5 and WP-6 follow. WP-7 is should-tier and independent.

| WP | Scope | Depends on | Acceptance |
|---|---|---|---|
| **WP-1** | Prisma schema + seed (the Kaczmarek hurricane scenario) + `extractClaimFacts` + `missingRequired` + draft accessors + `submitClaim` | — | [AC-4], [AC-8] |
| **WP-2** | `/` welcome + utterance capture → extract → draft; demo-session cookie | WP-1 | [AC-1], [AC-2] |
| **WP-3** | `/gaps` minimal follow-ups (phone/email + anything unextracted); optionals never block | WP-1, WP-2 | [AC-3] |
| **WP-4** | `/review` review & correct everything captured | WP-1, WP-2 | [AC-5] |
| **WP-5** | `/done` confirmation + non-functional concierge preview; `submitClaim` | WP-1, WP-4 | [AC-6] |
| **WP-6** | Prototype-integrity affordance + mobile-web / no-power polish | WP-1–5 | [AC-7] |
| **WP-7** *(should)* | Assistant warmth, screenshot-able claim summary, voice-toggle stub | WP-1 | — |

## 8. Acceptance criteria (keyed for `/verify`)

Distiller's [AC-1]–[AC-7] carried forward **unchanged**; [AC-8] is new (build-slice integrity), continuing the sequence.

- **[AC-1]** Loading the app shows the StressFreeClaim.ai greeting and a single clear way to begin. No console errors.
- **[AC-2]** A single free-text "what happened" input extracts the ball-rolling facts — name, property address, date of loss, insurance company, items damaged — from a sentence like the founder's scenario. No console errors.
- **[AC-3]** The assistant asks only for what's missing or needed to follow up (phone, email); policy number and deductible are optional and never block completion. No console errors.
- **[AC-4]** Items damaged resolve to the fixed list: roof, siding, window, drywall, contents. No console errors.
- **[AC-5]** Before submitting, all captured information is shown for review and can be corrected. No console errors.
- **[AC-6]** Submitting shows the confirmation and a non-functional preview of the downstream steps (file → inspection → approved repair), and stores a demo claim record; nothing is sent to any external system. No console errors.
- **[AC-7]** A visible "prototype — not for real data" affordance is present; there is no login/account, no payment, no contract or e-signature generation, no fee-waiver mechanism, and no CRM anywhere in the flow. No console errors.
- **[AC-8]** Extraction and gap-derivation are server-authoritative, and a partial or failed parse always falls through to plain gap-filling rather than dead-ending: `submitClaim` rejects a draft while `missingRequired()` is non-empty, and an unparseable utterance yields a draft asking for everything. No console errors.

## 9. Risks & alternatives (the load-bearing calls)

- **Deterministic local extraction, not an LLM.** Chosen because the spec's own design constraint is a homeowner with no power on a bad connection: an LLM call adds latency, a network dependency, and a failure mode at exactly the moment the product exists for — and §4 (no console errors on primary flows) plus "never trap the user" get harder, not easier, with a remote call. *What would break it:* genuinely messy input the patterns miss — but that is a **designed path**, not a failure: it falls through to gap-filling ([AC-8]) and Review ([AC-5]) corrects. *Alternative rejected:* LLM extraction — a stack deviation (§3) needing an API key for a demo that otherwise needs no secrets. **Revisit if voice lands (Q2):** speech already implies a service, which changes this calculus.
- **The raw utterance is not persisted.** Extraction happens server-side and only the structured facts are saved to the draft/claim. *What would break it:* a reload loses the original wording (mitigated — the extracted facts persist and Review is editable). *Alternative rejected:* storing the transcript on the Claim — `scope.md` says the app will **not** record or store conversations, and persisting the text would blur a line the distiller drew deliberately.
- **ClaimDraft row + demo-session cookie, not client-only state.** Chosen for reload-resilience: a dropped connection or a dying battery must not lose the claim — that is the exact failure this product exists to prevent. *What would break it:* someone reading the cookie as a login (it carries no identity and enforces nothing; see §2). *Alternative rejected:* pure client state — cheaper, but it fails the founder's no-power scenario.
- **Welcome merged with the utterance box.** One route, two loop steps, one fewer tap in the worst moment. *What would break it:* a reviewer expecting a distinct splash screen — but both [AC-1] and [AC-2] hold on the single route. *Alternative rejected:* a separate welcome screen — an extra tap for someone standing in a wet house.
- **Carrier hints as a parser constant, not an entity.** *What would break it:* an insurer outside the hint list — accepted as free text by design; the spec enforces no carrier list. *Alternative rejected:* a Carrier table + dropdown — that would add validation the spec deliberately excluded, and a dropdown of insurers is exactly the form-filling the loop avoids.

## 10. Open flags (notes for the operator — not gates)

- **Constitution gap (anonymous draft state)** — see §2; recommend a sanctioned clause. Engine-improvement note.
- **Q2 (voice) technical implication** — *not re-asked.* If voice ships, speech capture plus (likely) model-based extraction enter the stack, which re-opens the deterministic-parse call in §9 and drags in recording-consent exposure the distiller already flagged. Plan the fork, don't fold it in.
- **Q7 (native + push) technical implication** — *not re-asked.* The founder's pre-storm-install/push GTM needs native or an installable PWA. The mobile-web prototype could later add a PWA manifest cheaply, but that's promotion-track and out of this slice.
- **Q1 (fee-waiver legality) is untouched by this plan** — by construction, nothing here depends on it. Recorded so the builder doesn't wonder.

---

*Decisions made and logged, not deferred: stack (golden path, no deviation, no LLM), the deterministic extraction contract, the not-persisted utterance, the draft + demo-session pattern, the merged welcome route, carrier-hints-as-constant, and the should-tier line. The builder can begin at WP-1 without rediscovering the product shape.*
