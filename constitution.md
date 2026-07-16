# Constitution — Foundry Prototype Engine

Project-wide non-negotiables for every prototype built by this engine. Each rule is a single testable statement with a brief *why*. This file is the lens the distiller and every agent reads first: if a spec or a plan would force a violation, that is a gap to surface, not an assumption to make.

Scope: this constitution governs the **prototype track only** (see Build Plan §9). Promotion-track concerns (real auth, payments, security hardening, accessibility conformance, real data) are deliberately out of scope and must not be built here.

---

## 1. Track & purpose

- **The system shall produce a prototype, not a product.** *Why: the deliverable is a customer-validation artifact — it must look real and the core loop must work, but it does not hold real users or real data.*
- **The system shall keep the core loop demonstrable in 5 screens or fewer.** *Why: prototypes test one idea; more surface dilutes the signal and the budget.*
- **The system shall ship realistic seed data for every entity.** *Why: a prototype that looks empty reads as broken to a prospective customer.*

## 2. Identity & data

- **Prototypes shall run as a single seeded demo user.** *Why: validation needs a populated, working experience, not account management.*
- **The system shall not implement signup, login, or per-user persistence.** *Why: auth is a promotion-track concern; reaching for it on a spec that implies accounts is the most common scope leak.*
- **The system shall treat all data as throwaway and reconstructable from the seed script.** *Why: no real data means no migration, backup, or privacy burden at this stage.*
- **The system shall never collect real personal data from end users.** *Why: a prototype put in front of prospects must not create a data-handling liability.*

## 3. Stack (locked golden path)

- **The system shall use Next.js (App Router), TypeScript, Tailwind, and Prisma over SQLite, deployed to Vercel.** *Why: one blessed substrate is the leverage — recipes, debugging, and prompt-cache economics only compound on a stable stack.*
- **The system shall not introduce a stack choice the archetype does not already provide.** *Why: per-project free choice breaks caching and fractures the operator's reps. Deviations are an Architect decision logged in `open-decisions.md`, not an inline improvisation.*
- **The system shall pin dependency versions and avoid runtime dependencies on unmaintained packages.** *Why: reproducibility and a clean handoff outweigh novelty.*

## 4. Code quality

- **The system shall compile under TypeScript strict mode with no type errors.** *Why: strictness catches the class of bugs an unattended agent is most likely to introduce.*
- **The system shall produce no console errors or unhandled rejections on primary flows.** *Why: a visible error in a demo destroys the "looks real" bar instantly.*
- **The system shall include a passing test for every must-have acceptance criterion.** *Why: the spec's criteria are the contract; untested criteria are unverified claims.*
- **The system shall not merge a change that lowers test coverage on must-have flows.** *Why: coverage is the floor that lets the operator trust a build they did not watch.*

## 5. Spec authority (SDD)

- **The spec pack shall be the single source of truth; where code and spec disagree, the spec wins.** *Why: spec-driven development keeps intent fidelity across agent sessions.*
- **The system shall amend the spec before fixing a behavior defect in code.** *Why: fixing code without fixing the spec lets the two drift until the spec is worthless.*
- **The system shall state non-goals positively in the spec.** *Why: boundaries cannot be inferred from omission — an unstated "no auth" becomes auth.*

## 6. Design floor

- **The system shall meet a baseline quality floor: responsive to mobile, visible keyboard focus, and `prefers-reduced-motion` respected.** *Why: these are cheap, non-negotiable marks of a real product, distinct from full accessibility conformance (promotion track).*
- **The system shall derive color and type from the design-system tokens, not ad-hoc values.** *Why: token discipline is what makes a prototype look intentional rather than scaffolded.*
- **The system shall avoid templated AI-default aesthetics unless the spec calls for them.** *Why: a generic look reads as "AI demo," undercutting the customer-validation purpose.*
- **The system shall write end-user-facing copy in plain, active, consistent language; empty and error states give direction, not mood.** *Why: words are design material — they are what make the prototype navigable.*

## 7. Secrets, integrations & deploy

- **The system shall read all secrets from environment variables and never commit them to the repo.** *Why: a committed secret is a real-world breach even for a prototype.*
- **The system shall run any payment or third-party integration in test or mock mode only.** *Why: live integrations are a promotion-track concern with real liability.*
- **The system shall deploy to the operator's Vercel account as a preview, not the friend's account.** *Why: hosting ownership transfers only on promotion (FR-12); a preview keeps the maintenance boundary clean.*
- **The prototype shall carry a visible "prototype — not for real data" affordance.** *Why: a friend's customer must never mistake a validation artifact for a live product.*

## 8. Hard boundaries — do not build (promotion track)

- **The system shall not build real authentication, accounts, or sessions.**
- **The system shall not process live payments or move real money.**
- **The system shall not implement security hardening, rate limiting, or threat mitigation as a deliverable.**
- **The system shall not undertake formal accessibility (WCAG) conformance work.**
- **The system shall not implement real-data persistence, migration, or multi-tenancy.**

*Why (all of §8): these are the promotion track (Build Plan §9). Encountering a spec that demands one of them is a signal to flag it for promotion and reshape the prototype scope — never to silently build it.*

---

*This constitution is short by design. If a needed rule is missing, add it as a single testable statement with a why, and prefer amending here over embedding standards in `CLAUDE.md`.*
