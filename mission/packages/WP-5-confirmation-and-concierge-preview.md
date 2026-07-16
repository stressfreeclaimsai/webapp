# WP-5 — Confirmation & concierge preview

> Where the promise lands. The loop would end too early without this — the homeowner needs to see what "we'll take it from there" actually means.

## Goal
Submit the claim as a demo record and show the homeowner a calm confirmation plus a preview of what happens next — file the claim, handle the inspection, get the repair done.

## Depends on (contracts consumed)
- **WP-1:** `submitClaim(sessionKey)`, `missingRequired()`, `Claim` type.
- **WP-4:** a reviewed, complete draft.

## Scope (build this)
- **`/done`** — on arrival, call `submitClaim()` (server-authoritative; it re-validates completeness) and create the demo `Claim`.
- **Confirmation** — short, reassuring, plain: the claim is started and someone is on it.
- **Concierge preview** — a **non-functional** three-beat preview of the downstream steps: *we file your claim → we handle the inspection → an approved contractor does the repair*. Seeded copy; nothing is scheduled, sent, or contracted.
- Nothing leaves the app: no insurer contact, no email, no external call.

## Out of scope (other WPs / not the slice)
- Real filing, inspection scheduling, or contractor assignment (never — the preview is a mock). Contract generation, signatures, the fee/waiver message — settled Won'ts; **no fee language appears here**. Welcome/capture (WP-2), gaps (WP-3), review (WP-4). The prototype affordance (WP-6).

## Acceptance criteria
- **[AC-6]** Submitting shows the confirmation and a non-functional preview of the downstream steps (file → inspection → approved repair), and stores a demo claim record; nothing is sent to any external system. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-6]` completing the seeded scenario reaches `/done`, persists a demo `Claim` carrying the reviewed facts, and renders the three-beat preview; no outbound network request is made; no contract, signature, or fee/waiver copy is present on the screen.

## Notes
The preview is deliberately non-functional — it demonstrates the promise the founder sells without building filing, inspection, or contractor logic. Keep the copy free of any fee or waiver language (architecture §1; `scope.md`).
