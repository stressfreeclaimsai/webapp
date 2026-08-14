# Staff Operations Override

The staff workspace inherits the homeowner brand but uses a denser operational
rhythm. It must still feel like the same calm, human service—not a generic
blue/green insurance dashboard.

## Structure

- Maximum workspace width: 1180px; maintain comfortable viewport gutters.
- Server-render the initial queue and detail data; avoid client JavaScript for
  static operational views.
- Queue rows become stacked cards below the medium breakpoint. Do not require
  horizontal scrolling on a phone.
- Keep filtering compact and visible. Search and status are the only launch
  filters; avoid speculative dashboard controls.
- Detail pages use a two-column layout on wide screens and one column on mobile.
- Preserve semantic heading order and a clear return path from detail to queue.

## Visual hierarchy

- Retain warm paper, oxblood headings, terracotta actions, Fraunces, and Inter.
- Use Inter for operational headings below the page title; reserve Fraunces for
  the page-level identity.
- Status badges always include text. Color may reinforce status but never carry
  meaning alone.
- Prefer borders and quiet surface changes over extra shadows.
- Reference codes and dates use tabular figures where alignment helps scanning.

## Interaction and accessibility

- Every claim row has one explicit, descriptive detail link.
- Internal navigation uses `next/link`; queue links disable prefetch because a
  detail read creates an audit event.
- All controls and links retain visible focus and at least a 44px touch target.
- Empty and filtered-empty states explain how to recover.
- The local staff identity must never be available in pilot or production mode.

## Deliberate exclusions

- No charts, bulk actions, export, mutation controls, or decorative animation.
- No provider-specific authentication UI.
- No generic security-blue palette, sidebar, or icon-heavy navigation.
