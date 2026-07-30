# StressFreeClaim.ai — Production Track

This branch promotes the validated prototype into a private-pilot product.
`constitution.md` and `mission/` remain the historical prototype contract.
This file governs production-track work.

## Product boundary

- The public surface accepts an initial loss report; it does not claim that an
  insurance claim has been filed.
- Production launch is limited to states explicitly approved by the business
  and its public-adjusting counsel.
- Contracts, e-signatures, fee or waiver language, insurer filing, voice,
  payments, CRM sync, and partner portals remain out until separately approved.
- The existing prototype deployment must remain isolated from production data,
  credentials, databases, and external services.

## Data and identity

- Personal data must be stored only in durable, access-controlled production
  services owned by Deskar 6 LLC.
- Browser cookies may contain opaque, expiring identifiers but no claim facts
  or personal data.
- Staff claim access requires authentication and server-side authorization.
- Material reads, exports, assignments, status changes, and notes must create
  audit events.
- Logs, analytics, monitoring, and error reports must exclude or redact claim
  facts and personal data.

## Release gates

- `APP_MODE=pilot` must fail closed until durable storage and staff
  authentication are explicitly marked ready.
- Unsupported states cannot submit a production intake.
- Consent is enforced server-side before pilot submission.
- Submission is idempotent and notification failures are visible and retryable.
- Backups and a restore rehearsal must pass before accepting real data.
- Privacy, retention, deletion, support, and incident-response owners must be
  named before launch.

## Engineering rules

- Preserve the proven intake and extraction behavior unless user evidence
  supports a change.
- Keep deterministic extraction authoritative; optional model assistance must
  not block intake or overwrite locally parsed values.
- Use separate development, preview, prototype, and production environments.
- Every production requirement receives automated coverage before launch.
- Provider choices and credentials belong in environment configuration, never
  source control.

