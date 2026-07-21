# CLAUDE.md — StressFreeClaim.ai

This repo is the **StressFreeClaim.ai prototype**, built on the Foundry archetype: a single-user, customer-testable web prototype. You are building a **prototype, not a product** (see `constitution.md` §1).

**What it is:** a homeowner, right after a hurricane, tells the app what happened in one sentence and trusts that someone will take the claim from there. The bet, the core loop, and the acceptance criteria are settled in `/mission/spec/spec.md`; the build plan is `/mission/architecture.md` and `/mission/packages/WP-*.md`. **Start at WP-1** and work the packages in order.

> Read `constitution.md` first, every session. It is the non-negotiables. This file is workflow and orientation; the constitution is law. If the two ever conflict, the constitution wins.

**Two things settled upstream — do not re-decide them:**
- The **track is prototype** (`open-decisions.md` #1). The fee-waiver / PA-as-contractor close, contracts, e-signatures, and CRM are deliberately **out** — legally gated, not scope to reclaim (`scope.md`).
- Extraction is **local-first**: deterministic local parsers own every structured field; an optional, hard-bounded Haiku pass may fill fuzzy residue (name, damage description) but can never block or overwrite (`open-decisions.md` A2 as amended by B20) — the no-power/bad-connection scenario still governs.

## Golden rules

- The **spec pack is the source of truth** (`/mission/spec/`). If code and spec disagree, fix the spec first, then the code.
- Obey `constitution.md`. Its §8 lists things you must **not** build (auth, payments, security hardening, accessibility conformance, real-data persistence) — those are promotion-track. If a task implies one, stop and flag it; do not silently build it.
- Prefer editing existing files and the archetype's patterns over introducing new structure or dependencies.

## Workflow (plan first, verify last)

1. **Plan in read-only first.** Use Plan Mode (Shift+Tab) to explore and draft a plan before writing code. Interrogate the plan for ambiguity, architecture, and testing gaps; refine until there is no room for misinterpretation. Only then execute.
2. **Work in small packages.** Keep each unit to ~5–15 minutes of work and any single brief under ~150 instructions; adherence degrades past that.
3. **Build to acceptance criteria.** Every must-have criterion in `spec.md` gets a passing test.
4. **Verify before done.** Run `/verify` (or `npm run verify`) — it runs acceptance-criteria tests, captures console/network errors, and screenshots key flows. A build is not done until `/verify` passes with no console errors on primary flows.
5. **Log decisions, don't ask.** Resolve residual technical ambiguity against archetype defaults and record it in `/mission/spec/open-decisions.md`.

## Stack (locked — see constitution §3)

Next.js (App Router) · TypeScript (strict) · Tailwind · Prisma + SQLite (throwaway data) · Vercel. Single seeded demo user, **no auth**. Do not add stack choices the archetype lacks without an Architect decision logged in `open-decisions.md`.

## Project structure

```
/app            Next.js App Router routes
/components     UI components (use design-system tokens, not ad-hoc values)
/lib            domain logic, db client
/prisma         schema.prisma + seed.ts (defines ALL data)
/tests          Playwright specs, keyed to acceptance criteria
/mission/spec   the spec pack (source of truth) — read, don't edit casually
constitution.md the non-negotiables
```

## Commands

- `npm run dev` — local dev server
- `npm run seed` — reset + populate the demo data (data is throwaway; reseed freely)
- `npm run verify` — the `/verify` harness: acceptance tests + console/network capture + screenshots → pass/fail table
- `npm run test` — Playwright tests
- `npm run typecheck` — tsc strict, no emit
- `npm run lint` — lint + format check

## Design floor (see constitution §6)

Responsive to mobile, visible keyboard focus, `prefers-reduced-motion` respected. Derive color/type from design-system tokens. Avoid templated AI-default aesthetics unless the spec asks for them. End-user copy is plain, active, and consistent; empty and error states give direction. Realistic seed data for every entity — a prototype must never look empty.

## Definition of done

Deployed preview URL · every must-have acceptance criterion passes · no console errors on primary flows · `/verify` green · realistic seed data present · visible "prototype — not for real data" affordance · decisions logged. Then it is ready for the G2 ship report.

---
*Keep this file under ~200 lines; it loads every session. Put standards in `constitution.md`, not here. Symlink `AGENTS.md → CLAUDE.md` for cross-tool agents.*
