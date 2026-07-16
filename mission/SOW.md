# StressFreeClaim.ai — Build Plan & Statement of Work

Prepared for Deskar 6 LLC · Draft for discussion

---

## What you're building

StressFreeClaim.ai is an app that lets a homeowner start an insurance claim through a simple, guided conversation — the app asks a few questions, captures everything needed, and reassures them that you'll take the claim from there: filing it, handling the inspection, and getting the repairs done. The goal is to make filing feel effortless and to open a door that doesn't depend on knocking on it in person.

That's the full vision, and it's a real, substantial product. The smart way to build something this size is in phases — each one delivers something usable, proves the next is worth doing, and spreads cost and risk out instead of betting everything up front. Here's how I'd sequence it.

---

## How the phases work

Each phase below lists what it delivers, a rough effort size, and what it unlocks. Effort is relative, not a quote yet:

- **Small** — a few days
- **Medium** — roughly one to two weeks
- **Large** — multiple weeks, and often depends on decisions outside the code (legal, templates, partnerships)

We'd lock real timing and cost for a phase right before we start it, once its details are settled.

---

## Phase 1 — Prove the experience *(Small)*

A working prototype of the guided intake: the assistant greets the homeowner, asks about their loss one step at a time, collects everything needed, lets them review it, and confirms — then shows a clear preview of what happens next (you file the claim, handle the inspection, your contractor does the approved repairs). Realistic but not connected to anything live: nothing is really filed, no accounts, no contracts, no payments. Something you can put in front of real homeowners to answer the most important question: *will someone actually file this way, and does the "we handle it all" promise make them want to continue?*

**Unlocks:** real feedback before we invest in the heavier machinery.

**One decision to make first:** voice or typing for the first version — voice is the experience you described, but it adds time and is more to get right in a demo; typing proves the flow faster. Happy to talk through the trade. (This also answers your "do we need separate iOS/Android apps?" question — we'd build it as a mobile-friendly web app first, which works on any phone without app-store approvals, and revisit native apps later.)

---

## Phase 2 — Make it real *(Medium)*

Turn the prototype into a working product: real claims that save and persist, and a simple internal view so your team sees claims as they come in. This is also where your "CRM or Excel?" question gets answered — we'd use a proper database that your team works from, and can connect to a CRM later if you want one.

**Unlocks:** you can actually take claims through it.

---

## Phase 3 — Contracts, signatures & the fee *(Large — and a legal check comes first)*

The paperwork and fee pieces: generating the public-adjuster agreement and the Nexus construction agreement, capturing the customer's agreement and signature, and handling how the fee is presented.

This phase is different from the others, because public adjusting is a regulated business and these pieces touch the regulated parts directly. Before we build them, a few things are genuinely worth a quick check with someone who knows public-adjusting rules in the states you operate in — not to slow you down, but because getting them right protects the business:

- **How the adjuster and contractor work together.** Because Deskar handles the claim and Nexus does the repair, it's worth confirming per state how closely the two can be connected on the same claim — some states have specific rules about that, and it can shape how the two sides are structured.
- **How the fee is presented.** The "we waive the public-adjuster fee if Nexus does the work" message is central to your pitch, and some states have rules about how fees can be offered and disclosed. A short conversation with a compliance person early is much cheaper than reworking it later.
- **The contracts themselves.** Public-adjuster agreements often have required wording, fee limits, and a cancellation window that differ by state. The app generating them is very doable — we just need the right templates and rules per state (and the Nexus agreement template prepared).
- **Signatures.** Electronic signatures are generally valid, but a few states have extra formalities for these specific agreements — we'll confirm the right way to capture them so they hold up.

**Unlocks:** you can sign customers and handle the paperwork through the app — on solid footing.

---

## Phase 4 — Your team & partner tools *(Large)*

The internal side: a portal for your Nexus contractor partners to see and manage jobs, and connecting to your existing tools (e.g. a CRM).

**Unlocks:** the whole operation runs through one system instead of separate tools.

---

## Phase 5 — Automate the heavy lifting *(Large, and further out)*

The ambitious pieces: an automated system that calls insurers to file claims, and one that emails the welcome package. These are genuinely their own projects with their own considerations (the calling one especially), so I'd treat them as separate efforts once the core business is running and proven — not part of the initial build.

---

## What I'd want to confirm with you

Quick things that shape the plan:

1. **The Phase 1 focus** — that we prove the guided intake and the "we handle it all" promise first, before the contract-and-fee machinery. (My recommendation ready.)
2. **Voice or typing** for the first version — I have a recommendation and we can talk through it.
3. **Who's your go-to for public-adjuster compliance?** Given how central the fee and the Deskar–Nexus relationship are, a short conversation with them early — even before Phase 3 — is the single highest-value thing we can do. It's worth doing before we build around the fee model, because it may shape the model itself.
4. **The demo scenario** — a real, specific homeowner-and-storm example makes the prototype land; we can use one of your recent claims (details only, no real customer data).

---

## How we'd work together

I build; you own the product and the business decisions. Before each phase we agree on exactly what it includes and what it costs, so there are no surprises and "let's add that" always has a clear home in a later phase. We'll settle ownership of the code, accounts, and hosting up front so the product is always yours.

*This is a starting plan, not a fixed contract — it's meant to give us a shared picture of the whole thing and a sensible place to start. Let's talk through it.*
