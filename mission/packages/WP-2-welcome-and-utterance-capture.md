# WP-2 — Welcome & utterance capture

> The front door and the bet's opening move: one greeting, one box, one sentence. Merged onto a single route on purpose — a splash screen is a wasted tap for someone standing in a wet house.

## Goal
A homeowner lands on StressFreeClaim.ai, reads one reassuring line, types (or pastes) what happened in their own words, and the app turns it into a claim draft.

## Depends on (contracts consumed)
- **WP-1:** `extractClaimFacts()`, `saveDraft()`, `PartialClaimFacts` / `ClaimDraft` types.

## Scope (build this)
- **`/`** — the StressFreeClaim.ai greeting (Deskar 6 / Nexus stay behind the scenes) and the single prompt: *"Tell me what happened and we'll take it from there."*
- One **free-text input** — big, obvious, forgiving. No field labels, no wizard chrome, no progress bar.
- On submit: establish a **demo-session cookie** (opaque, carries no identity, enforces nothing), run `extractClaimFacts()` **server-side**, `saveDraft()` the result, and continue to `/gaps`.
- A **failed/partial parse continues anyway** — never an error screen, never a dead-end (WP-1's contract guarantees the draft is valid regardless).

## Out of scope (other WPs / not the slice)
- The extraction engine itself (WP-1 — consumed here). Asking for missing fields (WP-3). Review (WP-4). Confirmation (WP-5). Voice input — the open fork (Q2); build the box text-first. Any login or identity: the cookie is a demo device.

## Acceptance criteria
- **[AC-1]** Loading the app shows the StressFreeClaim.ai greeting and a single clear way to begin. No console errors.
- **[AC-2]** A single free-text "what happened" input extracts the ball-rolling facts — name, property address, date of loss, insurance company, items damaged — from a sentence like the founder's scenario. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-1]` `/` renders the StressFreeClaim.ai greeting and exactly one obvious way to start; no login/account UI is present.
- `[AC-2]` entering the founder's sentence — *"My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. I have damage to my roof and a couple of windows."* — produces a draft carrying all five facts; a vaguer variant ("the storm last night wrecked my roof") still advances to `/gaps` rather than erroring.

## Notes
The demo-session cookie is **not auth** — opaque, no identity, enforces nothing (architecture §2). Keep this screen ruthlessly light: it renders on a phone, outdoors, on a bad connection, possibly on a dying battery.
