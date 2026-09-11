# StressFreeClaim.ai

The repository now has two tracks:

- the validated prototype remains the default runtime and existing deployment;
- the production-foundation branch promotes it toward a controlled private
  pilot under [`PRODUCT.md`](./PRODUCT.md).

External owner setup is tracked separately in
[`product/EXTERNAL-APP-SETUP.md`](./product/EXTERNAL-APP-SETUP.md).

A homeowner, right after a hurricane, tells the app what happened in one
sentence — and trusts that someone will take the claim from there. Built on the
Foundry default archetype: a single-user, customer-testable web **prototype**
(not a product). The core loop: one utterance → gap-filling (one question at a
time) → review & correct → confirmation + a non-functional concierge preview.

Read [`constitution.md`](./constitution.md) (the non-negotiables) and
[`CLAUDE.md`](./CLAUDE.md) (workflow) first; the spec pack in
[`mission/spec/`](./mission/spec/) is the source of truth.

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind v4 · Prisma +
PostgreSQL 16 · Playwright · Vercel. Authentication remains deliberately
unwired until the company-owned provider is selected.

## Setup

```bash
npm install                      # installs deps + generates the Prisma client
npx playwright install chromium  # one-time: browser for tests/verify
cp .env.example .env             # local Docker PostgreSQL connection strings
npm run db:setup                 # start PostgreSQL, migrate, seed synthetic data
npm run dev                      # http://localhost:3000
```

## Continuous integration

Every push to `main` and every pull request runs `.github/workflows/ci.yml`:
typecheck, lint, and production build; the `/verify` harness against a
throwaway PostgreSQL service on the same `localhost:54329/stressfreeclaim`
address the local Docker database uses; and, on pull requests, a dependency
review that fails on high-severity advisories. Test results and screenshots
are attached to the run as the `verify-results` artifact.

## Commands

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Local dev server                                                    |
| `npm run build`     | Generate Prisma client + production build                           |
| `npm run db:up`     | Start the isolated PostgreSQL 16 container                          |
| `npm run db:down`   | Stop the local container without deleting its named volume          |
| `npm run db:migrate`| Create/apply a development migration                                |
| `npm run db:setup`  | Start PostgreSQL, migrate, and seed                                 |
| `npm run seed`      | Reset + repopulate synthetic data; refuses non-local databases      |
| `npm run verify`    | Run acceptance tests, capture errors/screenshots, print a pass/fail table |
| `npm run test`      | Playwright tests                                                    |
| `npm run typecheck` | `tsc` strict, no emit                                               |
| `npm run lint`      | ESLint                                                              |

## Project structure

```
/app            Next.js App Router routes + globals.css (design tokens)
/components     UI components (consume @theme tokens — no ad-hoc values)
/lib            domain logic, Prisma client
/prisma         PostgreSQL schema, migrations, and synthetic seed
/scripts        tooling: env helpers, the /verify harness
/tests          Playwright specs, keyed to acceptance criteria ([AC-n])
/mission/spec   the spec pack (source of truth)
/product        production architecture, data model, and owner setup
```

## Per-project customization

- **Design identity** lives entirely in the `@theme` block of
  [`app/globals.css`](./app/globals.css) — swap the tokens to re-skin. The current
  values are derived from `mission/spec/look-and-feel.md` (calm · reassuring ·
  effortless · plain-spoken).
- **Production entities** live in
  [`prisma/schema.prisma`](./prisma/schema.prisma). Extension rules and
  relationship rationale are documented in
  [`product/data-model.md`](./product/data-model.md).
- **Workflow vocabularies** live in
  [`lib/production-domain.ts`](./lib/production-domain.ts), avoiding database
  enum migrations for additive feedback-driven changes.
- Extraction and gap-derivation contracts remain in
  [`lib/claim-facts.ts`](./lib/claim-facts.ts).
