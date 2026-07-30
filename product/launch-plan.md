# StressFreeClaim.ai — Production Launch Plan

**Prepared for:** Deskar 6 LLC  
**Status:** Recommended scope for approval  
**Date:** July 28, 2026

## Executive decision

Phase 1 is complete. The next release should be a narrow, production-grade intake and operations product—not a broader automation platform.

The fastest responsible route to market is a **private pilot in counsel-cleared states** with:

- the proven homeowner intake flow;
- durable claim and draft storage;
- authenticated staff access;
- a simple claims queue and claim detail view;
- homeowner and staff submission notifications;
- consent, privacy, retention, audit, and operational controls; and
- production monitoring, backups, and support procedures.

Do not include contracts, e-signatures, public-adjuster fee or waiver language, automated insurer filing, voice recording, CRM integration, or a contractor portal in the launch slice. Those features add legal or operational dependencies without being necessary to prove that the business can acquire and process claims through the product.

## Why the original plan changes

The original Phase 2 correctly called for persistent claims and an internal view, but “one to two weeks” describes the visible feature work, not everything required to accept real homeowner data.

The prototype currently:

- stores the in-progress claim in a browser cookie;
- writes submitted claims to ephemeral SQLite storage on Vercel;
- has no authentication or staff authorization;
- has no durable operational queue;
- deliberately carries a “prototype—not for real data” warning; and
- is governed by a prototype constitution that prohibits production data, authentication, and security work.

Production promotion therefore needs its own track and acceptance gate. The proven intake experience should be carried forward; its storage, identity, security, and operations substrate should not.

## Launch promise

For the private pilot, the product promise should be precise:

> Tell us what happened. A member of our team will review your information and contact you about next steps.

Until counsel and operations confirm otherwise, the product should not promise that a claim has been filed, that StressFreeClaim or an affiliate will represent the homeowner, that a contractor will perform repairs, or that any fee will be waived.

## Launch scope

### Homeowner experience

- Mobile-first guided intake using the current utterance → gaps → review pattern.
- Server-side draft persistence with a random, expiring continuation token; no personal information stored in the browser cookie.
- State-of-loss eligibility check against an administratively controlled allowlist.
- Clear consent and privacy disclosure before submission.
- Review and correction of every persisted field.
- Submission receipt with a reference number and accurate response-time expectation.
- Email confirmation after successful submission.
- Calm recovery for expired drafts, duplicate submissions, service failures, and unsupported states.

### Staff experience

- Staff sign-in with approved email domains and enforced multi-factor authentication where the identity provider supports it.
- Claims queue with status, state, claimant, date of loss, insurer, submitted time, and assigned owner.
- Search and practical filters.
- Claim detail page with the homeowner-confirmed intake snapshot.
- Status workflow: `new`, `reviewing`, `contacted`, `qualified`, `closed`, `duplicate`.
- Assignment, internal notes, and a complete history of material changes.
- CSV export restricted to authorized staff and recorded in the audit log.

### Platform and operations

- Managed PostgreSQL with migrations, backups, and separate development, preview, and production environments.
- Managed authentication and role-based authorization.
- Transactional email for homeowner receipts and staff alerts.
- Error monitoring, structured logs, uptime checks, and redaction of personal data from telemetry.
- Rate limiting, abuse protection, secure headers, CSRF protections where applicable, and server-side validation.
- Written data-retention and deletion procedure.
- Secrets stored only in environment-managed secret storage.
- Admin actions and claim access recorded as audit events.
- Daily operational review of new claims during the pilot.

## Explicitly out of scope

- Public-adjuster or construction contracts.
- E-signatures and cancellation-window workflows.
- Fee calculations, fee waivers, referral economics, or affiliate financial language.
- Automated insurer calls or electronic claim filing.
- Voice capture, transcription, or call recording.
- Payments.
- Contractor or partner portal.
- CRM sync.
- Native iOS or Android apps.
- Multi-tenant customer organizations.
- Customer accounts or a homeowner portal.

## Recommended delivery sequence

### Gate 0 — Paper and operating decisions (parallel, 2–5 business days)

**Business owner:** Deskar 6 LLC

Decide and document:

- the states permitted in the pilot;
- counsel-approved public copy and disclaimers;
- the entity receiving the homeowner’s information;
- privacy notice, consent language, retention period, and deletion contact;
- the staff members who may access claims;
- the response-time promise and who owns the daily queue;
- incident and escalation contacts; and
- signed MSA/SOW, code ownership, account ownership, and production operating responsibility.

Engineering can prepare the production foundation in parallel, but real-data launch remains blocked until these answers are approved.

### Workstream 1 — Production foundation (3–5 engineering days)

- Create the production-track architecture and environment separation.
- Provision managed PostgreSQL, authentication, email, and monitoring.
- Add migrations and production-safe configuration.
- Replace the personal-data cookie draft with a server-side draft record.
- Establish authorization, audit-event, and retention primitives.
- Add CI checks for type safety, linting, unit/integration tests, and dependency review.

**Exit:** a staff-only production shell can authenticate, store test claims durably, and produce traceable audit events.

### Workstream 2 — Launch slice (5–8 engineering days)

- Promote the homeowner intake to the production data model.
- Add state eligibility, consent, privacy, and accurate submission copy.
- Build the staff claims queue and claim detail workflow.
- Add assignment, status, internal notes, and notifications.
- Add duplicate/idempotency protection and accessible error recovery.
- Add operational dashboards and runbooks.

**Exit:** the complete pilot workflow works with synthetic data from mobile intake through staff follow-up.

### Workstream 3 — Hardening and pilot release (3–5 engineering days)

- Threat-model the public intake and staff surfaces.
- Verify authorization at every staff read and write boundary.
- Run accessibility, responsive, failure-mode, and cross-browser checks.
- Verify backups and perform a restore rehearsal.
- Confirm telemetry redaction and retention behavior.
- Run a tabletop incident exercise.
- Conduct staff training and a synthetic end-to-end launch rehearsal.

**Exit:** all launch gates below pass and the business owner signs the release checklist.

### Private pilot (recommended: 2 weeks)

- Limit access and marketing to counsel-cleared states and a controlled source of traffic.
- Review every claim manually.
- Track completion rate, time to first staff contact, qualification rate, duplicates, support incidents, and abandonment by step.
- Hold a twice-weekly pilot review.
- Expand only after operational capacity, copy, and compliance assumptions are validated.

## Launch acceptance gates

The product is ready for real data only when all of these are true:

1. A submitted claim survives deployment, restart, and a database restore test.
2. Personal information is not stored in the browser draft cookie or emitted to client-visible logs.
3. Anonymous users cannot read submitted claims.
4. Staff cannot access the queue or claim details without authentication.
5. Staff roles are enforced server-side for every protected action.
6. Every persisted homeowner field is visible and correctable before submission.
7. Duplicate form submission creates one claim and one set of notifications.
8. Unsupported states cannot submit a production claim.
9. Homeowner and staff notifications are retried safely and failures are visible to operators.
10. Claim views, exports, assignments, status changes, and internal notes generate audit events.
11. Backups are enabled and a restore rehearsal has succeeded.
12. Privacy, consent, retention, and deletion procedures have named owners.
13. Production copy contains no unapproved filing, representation, contractor, or fee promise.
14. Monitoring alerts reach a named person and the incident runbook has been rehearsed.
15. The “prototype—not for real data” deployment remains separate; production has an explicit pilot label and support contact.

## Suggested production architecture

- **Application:** keep Next.js, TypeScript, Tailwind, and Vercel.
- **Database:** managed PostgreSQL; retain Prisma initially to minimize migration risk.
- **Authentication:** managed provider with server-side sessions, staff allowlisting, and MFA support.
- **Email:** transactional provider with delivery webhooks and idempotent jobs.
- **Monitoring:** error monitoring plus structured application logs with personal-data redaction.
- **Storage:** no document uploads in the pilot. Add managed object storage only when a defined document workflow is approved.
- **Extraction:** local deterministic parsing remains authoritative. The bounded model pass stays optional and must never block intake or overwrite locally parsed values.

Final vendor selection should favor accounts owned by Deskar 6 LLC, simple export paths, and the fewest operational vendors—not novelty.

## Decisions needed from Deskar 6 LLC

The build can begin with defaults, but launch requires:

1. Pilot states and the counsel who approved them.
2. Exact public-facing entity and brand.
3. Named staff users and the pilot queue owner.
4. Response-time promise to homeowners.
5. Privacy/retention owner and deletion contact.
6. Whether policy number and deductible should remain optional and whether either should be collected at all.
7. The desired pilot start date and expected weekly claim volume.

## Recommendation

Authorize the production foundation and launch slice now, while counsel resolves the business-model and state-copy questions in parallel. Target a controlled private pilot after roughly **three engineering weeks**, subject to the legal and operational gates above. Preserve the current prototype as the UX baseline and demo environment; create the production track as a deliberate promotion rather than an incremental deployment of prototype internals.
