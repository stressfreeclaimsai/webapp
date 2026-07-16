# WP-7 — Assistant warmth, claim summary & voice stub *(should)*

> Should-tier. Built only if budget allows; cut first under pressure. No acceptance criterion gates the prototype on these.

## Goal
Round out the concierge feel with the extras `scope.md` lists as Shoulds.

## Depends on (contracts consumed)
- **WP-1:** `ClaimDraft` / `Claim` types.

## Scope (build this — pick by remaining budget)
- **Assistant warmth** — light personality beyond the minimum script; the tone in `look-and-feel.md` ("a steady hand, not a form"), still free of any fee talk.
- **Claim summary** — a simple, screenshot-able recap the homeowner could keep.
- **Voice-toggle stub** — a visible affordance showing where voice *would* live, **without building speech** (Q2 is the open fork; the utterance-shaped loop already means voice drops in later without a redesign).

## Out of scope (other WPs / not the slice)
- Actual speech capture or any voice/model service — that's the Q2 fork, not this WP. Anything that would pull in a network dependency, an API key, or promotion-track machinery.

## Acceptance criteria
- None (should-tier). These must not block `/verify` or the core loop.

## Tests (keyed to the above, for `/verify`)
- None required. If built, add smoke coverage that the extras render without console errors — but no `[AC-n]` is assigned, so the prototype passes without this package.

## Notes
If under pressure, this is the first thing to cut. The voice stub must not imply working speech — it's a signpost for the fork, not a half-built feature.
