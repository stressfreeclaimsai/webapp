# Production Data Model

The production-track schema is PostgreSQL-first and optimized for a controlled
private pilot. It deliberately does not introduce homeowner accounts or assume
that the current intake questions are final.

## Model map

| Model | Responsibility |
|---|---|
| `ClaimDraft` | Expiring, server-side intake state addressed by a hashed continuation token |
| `Claim` | Self-contained snapshot of everything confirmed at submission |
| `StaffUser` | Local authorization profile mapped to a future managed-auth subject |
| `ClaimAssignment` | Assignment history; an open row has no `unassignedAt` |
| `ClaimNote` | Staff-authored operational notes, separate from homeowner damage text |
| `AuditEvent` | Append-only record of material reads and mutations |
| `NotificationDelivery` | Idempotent delivery attempt and provider-status record |

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

## Local isolation

- Development uses the `public` PostgreSQL schema.
- Playwright uses the `test` PostgreSQL schema and resets it before each suite.
- Destructive seed tooling accepts only
  `localhost:54329/stressfreeclaim`.
- The Docker volume is local and excluded from Git.
- Preview and pilot databases will use company-owned credentials and must never
  reuse the local password.

## Deliberately not wired yet

This milestone defines and validates `ClaimDraft`, but the proven intake still
uses its prototype cookie payload. The next migration will:

1. generate a high-entropy continuation token;
2. store only its SHA-256 hash in `ClaimDraft`;
3. store only the raw opaque token in the secure cookie;
4. load and update drafts transactionally; and
5. expire or rotate the token after submission.

Keeping that behavior change separate makes it easier to review, test, and
roll back without conflating it with the database substrate migration.
