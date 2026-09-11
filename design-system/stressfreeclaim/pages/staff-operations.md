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

## Mutation controls (B27)

- The claim detail page carries exactly three write controls: change status,
  change owner, and add an internal note. Nothing else mutates from the UI.
- Controls live inside the panel that shows the fact they change (status and
  owner under Ownership, the note form under Internal notes), below the
  read-only facts and separated by a border — never floating toolbars.
- Each control is a plain form with a labelled select or textarea and one
  submit button; status uses the filled terracotta button, owner the quiet
  outlined one. The submit disables itself while the action is in flight.
- The outcome of a write is a single message in a `role="status"` region
  under the page header; problems name the next step and never dead-end.
- A control a role lacks is not rendered; the server refuses it regardless.
- History rows read as sentences built from identifiers ("Status changed to
  Contacted", "Owner changed to <name>") — never from claim facts.

## Deliberate exclusions

- No charts, bulk actions, export, or decorative animation.
- No provider-specific authentication UI.
- No generic security-blue palette, sidebar, or icon-heavy navigation.
