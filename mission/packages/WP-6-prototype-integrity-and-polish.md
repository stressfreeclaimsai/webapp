# WP-6 — Prototype integrity & no-power polish

> The integration pass that makes it honest and makes it survive the moment it's built for. Comes after the feature WPs.

## Goal
A visible "this is a prototype" affordance, a confirmed absence of the settled Won'ts, and a mobile-web experience that holds up on a phone, outdoors, on a bad connection.

## Depends on (contracts consumed)
- **WP-1–WP-5** (the full loop must exist to polish and audit it).

## Scope (build this)
- **Prototype affordance** — a visible, persistent "prototype — not for real data" marker across the app.
- **Won't-audit** — confirm nothing reachable exposes: login/accounts, payments, contract generation, e-signatures, the fee-waiver message, or a CRM. No outbound network calls anywhere in the flow.
- **No-power polish** — the design constraint made real: fast first paint, minimal payload, no layout jank, works one-handed on a small viewport, tolerant of a dropped connection mid-flow (the draft survives a reload).
- **Design floor** — responsive mobile-web, visible keyboard focus, `prefers-reduced-motion` respected; calm empty/error states that give direction and never dead-end.

## Out of scope (other WPs / not the slice)
- New features. Should-tier extras (WP-7). A PWA manifest / installability — promotion-track (architecture §10). Anything native.

## Acceptance criteria
- **[AC-7]** A visible "prototype — not for real data" affordance is present; there is no login/account, no payment, no contract or e-signature generation, no fee-waiver mechanism, and no CRM anywhere in the flow. No console errors.

## Tests (keyed to the above, for `/verify`)
- `[AC-7]` the affordance is visible on `/`, `/gaps`, `/review`, and `/done`; no route exposes login, payment, contract, signature, fee/waiver, or CRM UI; a mobile viewport renders the whole loop without overflow; reloading mid-flow restores the draft rather than losing it; primary flows produce no console errors.

## Notes
The reload-survives-a-drop behaviour isn't polish — it's the founder's core scenario (no power, bad connection). Verify it deliberately.
