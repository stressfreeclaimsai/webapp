# scope.md — StressFreeClaim.ai (prototype)

## Must (the prototype is not done without these)

- Guided intake flow capturing all required fields, one step at a time ([AC-1], [AC-2]).
- Optional policy number + deductible that don't block completion ([AC-3]).
- Items-damaged from the fixed set ([AC-4]).
- Review-and-correct step before submit ([AC-5]).
- Confirmation screen with a non-functional concierge preview and demo-only storage ([AC-6]).
- Prototype affordance; no auth, payment, contract, signature, fee-waiver, or CRM ([AC-7]).

## Should (include if budget allows, cut first under pressure)

- Light warmth/personality in the assistant beyond the minimum script.
- A simple "claim summary" the owner could screenshot.
- A typed-vs-spoken toggle stub that shows where voice *would* go (without building speech).

## Won't — this prototype (stated positively so an agent won't add them)

- **The app will not use voice input** in this build. *(Voice-as-conversation is a distinct fork with its own build risk and its own recording-consent exposure — see Q2; default is text-first.)*
- **The app will not present the fee-waiver mechanism** (the "PA fee is waived if Nexus is the contractor" close). *(This is very likely an illegal inducement/tying arrangement as structured — legally gated, promotion track. The prototype does not validate it. See Q1 and `distillation-notes.md`.)*
- **The app will not generate a Public Adjuster contract or a Nexus construction contract.** *(State-specific, mandatory-language, fee-capped, rescission-bound legal instruments — promotion track, gated on legal review.)*
- **The app will not capture digital signatures or an "agree to terms" agreement.** *(E-signature enforceability + PA-contract execution rules are per-state legal questions — promotion track.)*
- **The app will not file real claims** with any insurer or external system. *(Demo-only; the confirmation is reassurance, not a filing.)*
- **The app will not collect payments or handle deductibles.** *(Payments are promotion track per constitution §8; deductible handling is also legally gated.)*
- **The app will not record or store conversations.** *(Recording underlies the founder's contracting model — real-data + two-party-consent liability, promotion track.)*
- **The app will not integrate a CRM (or write to Excel) as a system of record.** *(Real-data persistence + third-party integration — promotion track; the prototype uses throwaway local data.)*
- **The app will not provide a contractor portal.** *(Multi-role, multi-user — the prototype serves the property owner only.)*
- **The app will not place calls to insurers or send a welcome-package email** ("AI calling center", "AI welcome email"). *(Separate products; the calling agent also carries unlicensed-adjusting exposure.)*
- **The app will not ship as native iOS/Android.** *(The locked stack is web; a responsive mobile-web build answers the founder's "do we need separate apps?" — not yet.)*
- **The app will not implement login, accounts, or per-user data.** *(Single seeded demo user; constitution §2.)*

## Reshaping note

The source doc describes **three things at once**: (a) a property-owner conversational claim-intake app, (b) a full contracting engine (PA contract + Nexus construction contract + digital signatures + CRM, built around the fee-waiver close), and (c) future products (contractor portal, an AI that calls insurers, an AI welcome-emailer). A prototype can validate only one. This spec takes **(a)**, the intake experience, because it is customer-facing, archetype-native, and — critically — the only piece that is **not** blocked on the legal question hanging over (b).

**Confirmed by the founder (2026-07-07):** *"I agree with your Phase 1. Let's prove it can work."* (Q3 resolved.)

Honest caveat surfaced by the passes: the founder's *actual differentiator* is (b)'s fee-waiver close, and the doc's stated reason to build is to overcome the 10% fee objection. But the fee-waiver-conditioned-on-the-affiliated-contractor is very likely impermissible as structured, so it cannot be responsibly prototyped before counsel answers it. That makes the legal answer — not this build — the highest-value next step for the differentiator. This prototype validates the experience that sits *underneath* the model; it does not validate the model. The legal question stays open (`questions.md` Q1) — but it **no longer blocks this build**: the founder confirms the intake function stands on its own ("could be used by a roofer, or any construction company for that matter, and the mechanics would be similar").

**On reach:** the app does not acquire customers — Facebook/TikTok ads and pre-storm installs do (Q5). The app is the destination. Pre-storm downloads and push notifications are a real dependency of that plan, but they are promotion-track (Q7); this prototype is mobile-web.
