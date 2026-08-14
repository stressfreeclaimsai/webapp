# spec.md — StressFreeClaim.ai (prototype)

> Distilled from `inbox/Stress Free Summary.docx`, revised with the founder's answers (2026-07-07). Prototype scope only. See `scope.md` for non-goals and `questions.md` for what's still open before G0.

## Problem & user

A homeowner has just been through a hurricane. Their roof and windows are damaged, **the power is out**, and filing an insurance claim is the last thing they have energy for. **StressFreeClaim.ai** lets them start the claim by simply saying (or typing) what happened, and promises that someone will take it from there — file the claim, handle the inspection, get the repairs done. _(Deskar 6 and Nexus operate behind the scenes; the app fronts as StressFreeClaim.ai.)_

**The user is the homeowner, self-serve.** Confirmed by the founder: they find the app from a Facebook/TikTok ad — ideally installed _before_ the storm — and open it **long before they'd ever meet a rep**. No rep is present.

**Validation question this prototype answers:** _Will a homeowner, in the mess right after a storm, tell the app what happened and trust the promise that we'll take it from there?_

It deliberately does **not** test the fee-waiver "close" or the dual-contract signing — that mechanism is legally gated (`questions.md` Q1). What this prototype proves is the **intake experience and the concierge promise** — which the founder confirms has value on its own ("the client intake function could be used by a roofer, or any construction company").

## Core loop (≤5 screens)

1. **Welcome** — StressFreeClaim.ai greets the homeowner, post-storm and plain: "Tell me what happened and we'll take it from there."
2. **Tell me what happened** — one **natural-language** input (typed; voice is the open fork, Q2). The founder's own words are the target: _"My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. I have damage to my roof and a couple of windows."_ The app extracts name, property address, date of loss, insurance company, and items damaged — the founder's "**all the information needed to get the ball rolling**."
3. **Fill the gaps** — the assistant asks only for what's missing or needed to follow up (phone, email), and nothing else. Policy number and deductible may be captured but never block.
4. **Review** — the captured claim is shown back to confirm or correct.
5. **Confirmation + what-happens-next** — a reassuring confirmation, then a _non-functional preview_ of the concierge promise: we file the claim, handle the inspection, and an approved contractor does the repairs. Demo-only storage; no filing, contract, signature, payment, or fee-waiver step.

## Stories & acceptance criteria

- **[AC-1] Welcome & start.** Loading the app shows the StressFreeClaim.ai greeting, the subhead begins “In your own words, a sentence is plenty,” and there is a single clear way to begin. The input does not repeat that guidance. Below the intake, the page explains the three-step human-review process, optional policy number, correction before submission, location-dependent availability, Nexus Development, and that the intake does not submit directly to an insurer. No console errors.
- **[AC-2] Natural-language capture.** A single free-text "what happened" input extracts the ball-rolling facts — name, property address, date of loss, insurance company, items damaged — from a sentence like the founder's scenario. No console errors.
- **[AC-3] Gap-filling, minimal follow-ups.** The assistant asks only for what's missing or needed to follow up (phone, email); policy number and deductible are optional and never block completion. No console errors.
- **[AC-4] Items-damaged from the fixed set.** Items damaged resolve to the doc's list: roof, siding, window, drywall, contents. No console errors.
- **[AC-5] Review before submit.** Before submitting, all captured information is shown for review and can be corrected. No console errors.
- **[AC-6] Confirmation & concierge preview.** Submitting shows the confirmation and a non-functional preview of the downstream steps (file → inspection → approved repair), and stores a demo claim record; nothing is sent to any external system. No console errors.
- **[AC-7] Prototype integrity.** A visible "prototype — not for real data" affordance is present; there is no login/account, no payment, no contract or e-signature generation, no fee-waiver mechanism, and no CRM anywhere in the flow. No console errors.

## Notes for the build

- Single seeded demo homeowner; the intake creates a demo `Claim` against throwaway data.
- **Design for the worst moment:** the founder's biggest opportunity is right after a hurricane when _"a lot of people are without power."_ That means fast, low-friction, minimal typing, tolerant of a bad connection and a dying battery. Every extra required field is a reason to give up — which is exactly why the loop opens with one utterance instead of a twelve-field form.
- Extraction from natural language should be **forgiving and correctable** — the Review step (AC-5) is the safety net, so the parse doesn't have to be perfect. Never trap the user behind a failed parse; fall back to asking plainly.
- The assistant is **text-first**. Voice is the founder's headline and the #1 open fork (`questions.md` Q2) — do not assume it. The utterance-shaped input is designed so voice can drop in later without redesigning the loop.
- **Deliberately excluded:** fee/waiver messaging, the PA and Nexus contracts, the "agree to terms" signature. These are the legally-gated crux of the founder's model (Q1) — the prototype neither builds nor demos them.
