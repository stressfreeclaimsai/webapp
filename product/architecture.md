# Production Architecture

## Deployment topology

| Environment | Purpose | Data |
|---|---|---|
| Existing prototype | Continued user testing | Synthetic only |
| Local development | Engineering | Synthetic/local |
| Preview | Pull-request verification | Synthetic/isolated |
| Private pilot | Real homeowner intake | Durable production services |

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
- The initial Prisma migration contains the complete private-pilot data model.
- Development and acceptance tests use separate PostgreSQL schemas.
- The original prototype branch/deployment remains unchanged.
- Server-side draft token wiring, staff authentication, and provider
  integrations remain gated follow-on work.

## Runtime modes

- `prototype` is the default and preserves the existing demo behavior.
- `pilot` enables eligibility, consent, and truthful submission language.
- Pilot mode refuses to boot unless `PRODUCTION_FOUNDATION_READY=true`.
- That readiness flag must not be enabled until durable storage and staff
  authentication have replaced the prototype implementations.

## Migration order

1. Add local PostgreSQL schema and migrations. **Complete.**
2. Provision isolated company-owned external services.
3. Replace the personal-data draft cookie with an opaque token and server-side
   draft.
4. Add staff authentication and authorization.
5. Add queue, detail, assignment, notes, and audit history.
6. Add idempotent notifications and delivery visibility.
7. Pass security, restore, accessibility, and operations gates.
8. Enable pilot mode for counsel-approved states only.
