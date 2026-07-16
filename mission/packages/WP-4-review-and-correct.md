# WP-4 — Review & correct

> The safety net that lets the parse be imperfect. Runs in parallel with WP-3 once WP-1/WP-2 land.

## Goal
Show the homeowner everything the app captured, in plain language, and let them fix anything the sentence got wrong before it's submitted.

## Depends on (contracts consumed)
- **WP-1:** `loadDraft()`, `saveDraft()`, `ClaimDraft` / `ItemDamaged` types.
- **WP-2:** the demo-session cookie + draft.

## Scope (build this)
- **`/review`** — every captured field displayed: name, property address, date of loss, insurer, items damaged, phone, email, plus policy number / deductible if given.
- **Every field is correctable** in place; edits `saveDraft()`.
- Items damaged are editable within the fixed set (roof/siding/window/drywall/contents).
- A clear, single way to confirm and continue to `/done`.

## Out of scope (other WPs / not the slice)
- Asking for missing fields (WP-3 — by the time we're here `missingRequired()` is empty). The submit action itself (WP-5). Contracts, signatures, fee/waiver — settled Won'ts; nothing on this screen mentions a fee.

## Acceptance criteria
- **[AC-5]** Before submitting, all captured information is shown for review and can be corrected. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-5]` `/review` shows every captured field from the seeded scenario; correcting a mis-parsed field (e.g. changing the insurer, or the date of loss) persists to the draft and the corrected value is what appears downstream; items can be edited within the fixed set.

## Notes
This screen is why the extractor is allowed to be imperfect (architecture §9) — it must make correction obvious and cheap. If a field was never extracted, show it plainly rather than hiding it.
