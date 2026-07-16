# Foundry — Default Archetype

The default archetype template for the Foundry prototype engine. It scaffolds a
single-user, customer-testable web **prototype** (not a product) from a spec pack.

Read [`constitution.md`](./constitution.md) (the non-negotiables) and
[`CLAUDE.md`](./CLAUDE.md) (workflow) first.

## Stack (locked — constitution §3)

Next.js (App Router) · TypeScript (strict) · Tailwind v4 · Prisma + SQLite
(throwaway data) · Playwright · Vercel. Single seeded demo user, **no auth**.

## Setup

```bash
npm install                      # installs deps + generates the Prisma client
npx playwright install chromium  # one-time: browser for tests/verify
cp .env.example .env             # local SQLite connection string
npm run seed                     # reset + populate the demo data
npm run dev                      # http://localhost:3000
```

## Commands

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Local dev server                                                    |
| `npm run build`     | Generate Prisma client + production build                           |
| `npm run seed`      | Reset + repopulate throwaway demo data (guarded to local SQLite)    |
| `npm run verify`    | Run acceptance tests, capture errors/screenshots, print a pass/fail table |
| `npm run test`      | Playwright tests                                                    |
| `npm run typecheck` | `tsc` strict, no emit                                               |
| `npm run lint`      | ESLint                                                              |

## Project structure

```
/app            Next.js App Router routes + globals.css (design tokens)
/components     UI components (consume @theme tokens — no ad-hoc values)
/lib            domain logic, Prisma client
/prisma         schema.prisma + seed.ts (defines ALL data)
/scripts        tooling: env helpers, the /verify harness
/tests          Playwright specs, keyed to acceptance criteria ([AC-n])
/mission/spec   the spec pack (source of truth)
```

## Per-project customization

- **Design identity** lives entirely in the `@theme` block of
  [`app/globals.css`](./app/globals.css) — swap the tokens to re-skin. The shipped
  values are a labelled placeholder (replaced by the design-tokens skill).
- **Example entity** (`User` + `Note`) in [`prisma/schema.prisma`](./prisma/schema.prisma)
  is marked to be replaced with the project's real entities.
