# WP-3 — Gap-filling follow-ups

> The "ask for as little as possible" step. Runs in parallel with WP-4 once WP-1/WP-2 land.

## Goal
Ask the homeowner only for what's genuinely still needed — never re-ask what the sentence already gave, never block on something optional.

## Depends on (contracts consumed)
- **WP-1:** `missingRequired(draft)`, `loadDraft()`, `saveDraft()`.
- **WP-2:** the demo-session cookie + the draft it created.

## Scope (build this)
- **`/gaps`** — render **only** the fields `missingRequired()` returns, one at a time, in plain language.
- Typically that's just **phone** and **email** when the sentence parsed well; when the parse was thin, it's whatever else is missing (name, address, date of loss, insurer, items).
- **Optional fields never block:** policy number and deductible may be offered but the step completes without them.
- Each answer `saveDraft()`s and re-derives `missingRequired()` — when it's empty, continue to `/review`.
- Items damaged, when asked, are chosen from the fixed set (roof/siding/window/drywall/contents).

## Out of scope (other WPs / not the slice)
- The gap-derivation logic (WP-1 — consumed here). The utterance box (WP-2). Review/correct (WP-4). Confirmation (WP-5). Any field not in `missingRequired()` — do not add "nice to have" questions.

## Acceptance criteria
- **[AC-3]** The assistant asks only for what's missing or needed to follow up (phone, email); policy number and deductible are optional and never block completion. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-3]` after the founder's full utterance, `/gaps` asks for **phone and email only** — it does not re-ask name, address, date, insurer, or items; skipping policy number and deductible still allows the flow to reach `/review`; after a thin parse, the missing facts are asked for plainly and the step still completes.

## Notes
Every extra question is a reason for someone without power to give up — render `missingRequired()` and nothing more. Never re-ask what the sentence already answered.
