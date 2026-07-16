# data-model-hints.md — StressFreeClaim.ai

Entities in the founder's own language. The prototype models only the intake slice; struck-through entities are real in the founder's world but out of prototype scope (promotion-track / legally gated).

## In scope

- **Homeowner (Customer)** — the single seeded demo user. Fields: first name, last name, property street address, city, state, zip, phone, email.
- **Claim** — created by the intake. Fields: insurance company, policy number (optional), deductible (optional, captured only — never handled), date of loss (storm date), items damaged (list), free-text notes.

## Enums (from the doc, verbatim)

- **Items damaged:** roof, siding, window, drywall, contents.
- *(This doc gives no fixed "type of loss" list — only a free "date of loss (storm date)" and the items-damaged set above. Do not invent a loss-type enum.)*

## Out of prototype scope (real, but promotion-track / legally gated)

- ~~Public Adjuster Contract~~ (state-specific legal instrument: mandatory language, fee caps, rescission)
- ~~Nexus Construction Contract~~ (template doesn't exist yet; founder must supply)
- ~~Digital signature / "agree to terms" agreement~~ (e-signature enforceability, per-state)
- ~~Fee-waiver record~~ (the "PA fee waived if Nexus does the work" mechanism — legally gated)
- ~~CRM record / Excel export~~ (system of record — real persistence + integration)
- ~~Conversation recording / transcript~~ (two-party-consent exposure)
- ~~Contractor portal (Nexus)~~ (second role, multi-user)
- ~~Insurer-call log / welcome-email record~~ (future AI products)
