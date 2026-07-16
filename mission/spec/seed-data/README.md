# seed-data — StressFreeClaim.ai

Realistic demo content so the prototype never looks empty. **The scenario is the founder's own, supplied 2026-07-07** — no longer pending.

## demo-homeowner — Martin Kaczmarek
The founder's real-life example. Name: **Martin Kaczmarek**. Property: **927 11th St N, Naples, FL**. Phone + email: not supplied by the founder — use clearly-fake demo values (the app asks for these at the gap-filling step, so they're captured in-flow, not pre-seeded as real).

## demo-claim — the hurricane
- **Date of loss:** September 15 (a hurricane hit "yesterday" — seed the claim so the loss reads as ~1 day old, which is the moment the app is built for).
- **Insurance company:** **Citizens Property** (Citizens Property Insurance Corp — Florida's insurer of last resort; realistic for a Naples hurricane claim).
- **Items damaged:** **roof** and **windows** ("a couple of windows") — drawn from the fixed set (roof / siding / window / drywall / contents).
- **Policy number / deductible:** deliberately absent. The founder's scenario omits them, and they're optional and non-blocking ([AC-3]) — leaving them empty in the seed proves the flow completes without them.

## the target utterance (drives [AC-2])
Seed the demo around parsing exactly this, in the founder's words:
> *"My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. I have damage to my roof and a couple of windows."*

Include a couple of messier variants (missing insurer; vaguer damage; "the storm last night" instead of a date) so the gap-filling step ([AC-3]) and the review safety net ([AC-5]) are both visibly exercised — the parse must never trap the user.

## concierge-preview copy
The non-functional "what happens next" (AC-6): short, reassuring steps — we file your claim, we handle the inspection, an approved contractor does the repair. Reassurance only — **no fee/waiver language, no contract, no signature** (deliberately out; see `scope.md`).

*(No licensing table, carrier list, or contract templates are seeded — the prototype neither enforces licensed states nor generates contracts. Those are promotion-track and legally gated.)*
