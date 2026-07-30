# External App Setup

This is the owner checklist for services that cannot be completed from the
repository alone. Create production accounts under Deskar 6 LLC—not a
developer’s personal account—and invite the developer with the minimum role
needed.

Do not enter real homeowner data until the launch checklist is complete.

## 1. Vercel

**Set up now**

1. Keep the existing Vercel project connected to the prototype branch and
   current demo URL.
2. Create a separate Vercel project for the private pilot.
3. Connect the production-foundation branch to the new project.
4. Disable automatic production deployment from the prototype branch.
5. Limit access to the pilot deployment until launch approval.

**Environment variables**

```text
APP_MODE=prototype
PRODUCTION_FOUNDATION_READY=false
PILOT_ALLOWED_STATES=
SUPPORT_EMAIL=
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
EMAIL_FROM=
EMAIL_REPLY_TO=
```

Keep `APP_MODE=prototype` and `PRODUCTION_FOUNDATION_READY=false` until the
repository launch gates pass.

## 2. Managed PostgreSQL

**Recommended timing:** now.

Create separate databases or isolated branches for development, preview, and
production. Enable automated backups and point-in-time recovery if the chosen
plan supports it.

Provide:

- pooled runtime connection string as `DATABASE_URL`;
- direct migration connection string as `DIRECT_URL`;
- backup retention setting; and
- the name of the person responsible for restore requests.

Do not reuse the prototype SQLite database or copy synthetic claims into
production.

## 3. Staff authentication

**Recommended timing:** now.

Choose a managed authentication provider that supports:

- server-side Next.js sessions;
- email allowlisting or invitations;
- multi-factor authentication;
- session revocation; and
- audit visibility.

Create the production application, configure the pilot URL, and invite only the
initial staff users. Do not enable public signup.

Record:

- initial staff email addresses;
- administrator/owner;
- allowed login method;
- MFA policy; and
- session duration.

Provider-specific keys will be added after the provider is selected.

## 4. Transactional email

**Recommended timing:** during the foundation work.

Create a transactional email account and verify a sending subdomain such as
`updates.stressfreeclaim.ai`. Configure SPF, DKIM, and DMARC through the domain
provider.

Create:

- homeowner submission receipt sender;
- internal new-intake notification sender;
- reply-to mailbox monitored by a named person; and
- delivery/bounce webhook for the pilot application.

Do not use a personal Gmail address as the production sender.

## 5. Monitoring and uptime

**Recommended timing:** during the foundation work.

Create separate production projects for error monitoring and uptime checks.
Invite the developer without billing-owner access.

Before connecting:

- disable session replay unless a verified masking configuration excludes all
  form values;
- disable request-body and header capture;
- configure personal-data scrubbing;
- choose the alert recipient and escalation path; and
- define uptime checks for `/api/health`.

## 6. Domain and DNS

**Can wait until the pilot date is known.**

Decide the pilot hostname, for example `pilot.stressfreeclaim.ai`. The final
public hostname should not point at the pilot until the release gate is signed.

DNS work may also be required for:

- Vercel domain verification;
- email SPF;
- email DKIM;
- DMARC; and
- monitoring ownership verification.

## 7. Anthropic

**Optional; can wait.**

The app remains functional without model assistance. If enabled:

- create a Deskar-owned API account and restricted production key;
- set a conservative monthly spend limit;
- confirm data-retention settings;
- keep the current two-second timeout and circuit breaker; and
- never send fields outside the approved fuzzy-field allowlist.

## 8. Legal and operating inputs

These are not software accounts, but pilot mode remains blocked without them:

- counsel-approved pilot states;
- approved public entity and brand;
- approved privacy notice and consent text;
- approved submission and follow-up copy;
- data-retention period and deletion contact;
- response-time promise;
- named daily queue owner;
- named incident contact; and
- signed services agreement defining code, account, and operational ownership.

## Values to return to the developer

Send secrets through the chosen password manager or the service’s invitation
flow—not email, chat, or a committed `.env` file.

Non-secret decisions can be returned as:

```text
Pilot states:
Public brand/entity:
Pilot hostname:
Initial staff emails:
Queue owner:
Support email:
Response-time promise:
Retention period:
Deletion contact:
Incident contact:
Selected database provider:
Selected auth provider:
Selected email provider:
Selected monitoring provider:
```

