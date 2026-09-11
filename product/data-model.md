# Production Data Model

The production-track schema is PostgreSQL-first and optimized for a controlled
private pilot. It deliberately does not introduce homeowner accounts or assume
that the current intake questions are final.

## Model map

| Model                  | Responsibility                                                              |
| ---------------------- | --------------------------------------------------------------------------- |
| `ClaimDraft`           | Expiring, server-side intake state addressed by a hashed continuation token |
| `Claim`                | Self-contained snapshot of everything confirmed at submission               |
| `StaffUser`            | Local authorization profile mapped to a future managed-auth subject         |
| `ClaimAssignment`      | Assignment history; an open row has no `unassignedAt`                       |
| `ClaimNote`            | Staff-authored operational notes, separate from homeowner damage text       |
| `AuditEvent`           | Append-only record of material reads and mutations                          |
| `NotificationDelivery` | Idempotent delivery attempt and provider-status record                      |

## Extensibility rules

### Stable facts become columns

Fields that are required, filtered, searched, authorized, or reported remain
explicit typed columns. Examples are `stateOfLoss`, `status`, `email`, and
`submittedAt`.

### Experiments begin in `extraFields`

Both `ClaimDraft` and `Claim` have a JSON `extraFields` object and an
`intakeVersion`.

Use `extraFields` for a temporary, non-query-critical question being evaluated
through user testing. Use a namespaced key and bump `CURRENT_INTAKE_VERSION`
when the intake meaning changes:

```json
{
  "photosInterest": {
    "experiment": "july-2026",
    "answer": "later"
  }
}
```

Promote an experiment to a typed column when it becomes operationally required,
must be filtered or reported, or needs a database constraint. The promotion
migration should backfill historical JSON values before application code stops
reading the experimental key.

Do not put authentication, authorization, submission identifiers, consent
proof, or other security decisions in `extraFields`.

### Open vocabularies stay out of PostgreSQL enums

Workflow states, staff roles, damage categories, and notification kinds are
stored as strings. Their reviewed application vocabularies live in
`lib/production-domain.ts`.

Adding a value after user testing is a code-and-test change without a database
migration. Renaming or removing a value still requires a data migration so
historical rows remain understandable.

### Claims are snapshots

A submitted `Claim` does not depend on a mutable homeowner profile. It freezes
the exact name, contact details, property, damage, and insurer information that
the homeowner reviewed. Future corrections should be explicit audited actions,
not silent changes to a shared customer record.

### Operational history is relational

Assignments, notes, audit events, and notification attempts use separate
append-friendly tables. New operational features should extend these histories
instead of adding `latestNote`, `assignedTo`, or `emailSent` flags to `Claim`.
PostgreSQL also enforces that a claim has at most one open assignment through a
partial unique index.

### Staff identity is an adapter boundary

Application records refer to `StaffUser.id`; authentication providers map into
that record through the stable `externalSubject`. The local staff workspace
resolves a seeded development subject behind `requireStaff()` and is disabled
in pilot and production runtimes. A company-owned identity provider replaces
only that resolver and session plumbing—not claim, assignment, note, audit, or
page contracts.

The customer-approved access vocabulary has two levels: `standard` and
`admin`. New staff records default to `standard`. The working capability
matrix (decision B27) is a single function, `staffCan()` in
`lib/production-domain.ts`: `standard` may change status, change owner, and
add notes; export and staff management are `admin` only. It is a default
awaiting owner confirmation, and no page or repository may infer access from
the role label outside that function. `admin` remains reserved for approved
owner/administrative functions, including future staff access management.

## Local isolation

- Development uses the `public` PostgreSQL schema.
- Playwright uses the `test` PostgreSQL schema and resets it before each suite.
- Destructive seed tooling accepts only
  `localhost:54329/stressfreeclaim`.
- The Docker volume is local and excluded from Git.
- Preview and pilot databases will use company-owned credentials and must never
  reuse the local password.

## Draft and submission lifecycle

- The browser stores a 256-bit random continuation token in an `HttpOnly`,
  `SameSite=Lax` cookie. No claim facts or personal information are stored in
  the cookie.
- PostgreSQL stores only the token's SHA-256 hash. Drafts expire after seven
  days and an expired token returns the homeowner to a calm restart state.
- Review corrections are saved to the draft before submission.
- Submission takes a row lock, creates the immutable `Claim` snapshot, marks
  the draft submitted, and appends `claim.submitted` in one transaction.
- `Claim.submissionKey` and the draft-to-claim unique relation provide database
  backstops against duplicate submissions.
- `npm run db:cleanup` marks elapsed drafts expired and removes terminal drafts
  after a 24-hour retention window. This command is deliberately restricted to
  the local Docker database; production scheduling will be added with the
  company-owned hosting and database resources.
