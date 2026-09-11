# Production Architecture

## Deployment topology

| Environment        | Purpose                   | Data                        |
| ------------------ | ------------------------- | --------------------------- |
| Existing prototype | Continued user testing    | Synthetic only              |
| Local development  | Engineering               | Synthetic/local             |
| Preview            | Pull-request verification | Synthetic/isolated          |
| Private pilot      | Real homeowner intake     | Durable production services |

The prototype and private pilot use separate Vercel projects, databases,
credentials, email domains, monitoring projects, and URLs.

## Target components

- Next.js application on Vercel.
- Managed PostgreSQL with Prisma migrations.
- Managed staff authentication with server-side sessions, an allowlist, roles,
  and MFA support.
- Server-side `ClaimDraft` records addressed by opaque, expiring continuation
  tokens.
- Durable `Claim`, `StaffUser`, `ClaimAssignment`, `ClaimNote`, `AuditEvent`,
  and `NotificationDelivery` records.
- Transactional email with idempotency keys, delivery events, and retry state.
- Error monitoring and structured logs with personal-data redaction.

## Foundation status

- Local PostgreSQL 16 is reproducible through `docker-compose.yml`.
- GitHub Actions runs typecheck, lint, build, the `/verify` harness on a
  PostgreSQL service, and pull-request dependency review
  (`.github/workflows/ci.yml`).
- The initial Prisma migration contains the complete private-pilot data model.
- Development and acceptance tests use separate PostgreSQL schemas.
- The original prototype branch/deployment remains unchanged.
- Opaque draft tokens, server-side draft persistence, expiry handling, and
  idempotent transactional submission are implemented locally.
- A read-only local staff queue and claim-detail view sit behind the
  provider-neutral `requireStaff()` boundary. Two adapters exist: the seeded
  development identity (development and the test suite only) and WorkOS
  AuthKit (always in production and pilot; decision B25). Roles and active
  status are enforced from `StaffUser`, never from the provider.
- The production database is managed PostgreSQL on Neon (US-East-2), migrated
  from the checked-in Prisma migrations; `/api/health` probes it.
- Staff mutations — status, owner, and internal notes — are live on the
  claim detail page behind the B27 capability matrix; each write is one
  transaction with its audit event.
- Notifications and the remaining provider integrations (email, monitoring)
  remain gated follow-on work.

## Runtime modes

- `prototype` is the default and preserves the existing demo behavior.
- `pilot` enables eligibility, consent, and truthful submission language.
- Pilot mode refuses to boot unless `PRODUCTION_FOUNDATION_READY=true`.
- That readiness flag must not be enabled until durable storage and staff
  authentication have replaced the prototype implementations.

## Drift controls

Validated homeowner behavior is a contract, not a visual reference to copy by
eye. Changes follow this authority chain:

1. Record an approved behavior or copy decision in the decision log.
2. Amend the relevant acceptance criterion and design-system page rule.
3. Change implementation and keyed browser test in the same commit.
4. Run `/verify`; every acceptance, lifecycle, database, extraction, and
   validation test can fail the gate.

Database changes use checked-in Prisma migrations and isolated test schemas;
the generated client is never treated as the schema authority. UI changes use
`design-system/stressfreeclaim/MASTER.md` plus page overrides, with screenshots
captured by the primary flow. Environment gates keep prototype and pilot copy,
data, and services separate.

The next hardening increment is pull-request CI so these checks are mandatory,
followed by reviewed visual baselines for the homepage, gap, review, and done
screens. Today those checks run locally; they are not yet enforced by GitHub.

## Migration order

1. Add local PostgreSQL schema and migrations. **Complete.**
2. Replace the personal-data draft cookie with an opaque token and server-side
   draft. **Complete locally.**
3. Provision isolated company-owned external services. **Database complete
   (Neon); email and monitoring pending.**
4. Add staff authentication and authorization. **Adapter complete (WorkOS
   AuthKit, B25); awaiting dashboard configuration and first invited
   sign-in.**
5. Add queue, detail, assignment, notes, and audit history. **Complete
   locally (B27); the standard/admin matrix awaits owner confirmation.**
6. Add idempotent notifications and delivery visibility.
7. Pass security, restore, accessibility, and operations gates.
8. Enable pilot mode for counsel-approved states only.
