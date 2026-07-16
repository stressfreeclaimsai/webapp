# questions.md — StressFreeClaim.ai

Batched questions from distillation. **Updated 2026-07-07 with the founder's answers.** Resolved items are folded into the spec and logged in `open-decisions.md`. **G0 is no longer blocked** — the one remaining blocking item (Q1) gates the *contracting track*, not the intake prototype.

## Resolved (folded into the spec)

**Q3 — Confirm the prototype is the intake experience. ✅ RESOLVED.** Founder: *"I agree with your Phase 1. Let's prove it can work."* The intake prototype is the build.

**Q4 — Who opens this first? ✅ RESOLVED — the self-serve homeowner.** Founder: *"I want to market it directly to the homeowner… the homeowner would see a Facebook ad or a TikTok… The homeowner would be the first user, long before that homeowner would meet with one of my reps."* Not rep-assisted. The core loop is built for a homeowner alone, post-storm.

**Q5 — Does the app address the two stated weaknesses? ✅ RESOLVED (contradiction dissolved).** Reach is solved by **paid social ads (Facebook/TikTok) + pre-storm installs**, not by app features — the app is the *destination*, not the acquisition channel. The founder's plan: blanket an area with ads in the week before landfall to drive downloads, then (later) push notifications prompting people to file. The prototype does not claim to test reach.

**Q6 — Demo persona & scenario. ✅ RESOLVED — the hurricane scenario.** *"My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. I have damage to my roof and a couple of windows."* Plus the founder's key framing: **"This is really all the information needed to get the ball rolling,"** and *"After a hurricane, a lot of people are without power. This is our biggest opportunity."* Both folded into the loop and the build notes.

**Q8 — Branding. ✅ RESOLVED.** Front the app as **StressFreeClaim.ai**; Deskar 6 and Nexus stay behind the scenes. *"Part of the marketing focus is in the name."*

## Blocking (the contracting track only — does not block the intake prototype)

**Q1 — Is the fee-waiver + PA-as-contractor model legal, per state? ⚠️ STILL OPEN.**
Founder: *"I don't have a go-to attorney yet. I'm pretty sure that I've got the legal questions figured out — with the exception of the e-signing issue — but I will take your advice and find counsel."*
**The flags stand.** A founder's confidence is not a legal opinion, and the sourced findings are specific and severe: a PA holding a financial interest in the repair on a claim they adjust is prohibited in the leading states (Fla. Stat. 626.8795; Tex. Ins. Code 4102.158; NAIC model act), the Texas *Lon Smith* precedent made such contracts **void** with full refunds, and waiving the fee *conditioned on using Nexus* is very likely an illegal inducement. See `distillation-notes.md`. **This gates the contracting/fee phase — counsel before build, not after.**
*Materially de-risked for Phase 1:* the founder adds *"even if I run into legal hurdles, the project is still worth doing. The client intake function could be used by a roofer, or any construction company for that matter, and the mechanics would be similar."* The intake prototype stands on its own regardless of how Q1 resolves.

## Shaping (affect quality, not whether the intake prototype builds)

**Q2 — Voice or text for the assistant? ⚠️ STILL OPEN (biggest build fork).**
The founder's answer implies the *content* is the same either way (*"my input, or if it were voice activated, my conversation would be something like this"*) — a single natural-language utterance. So the loop is designed utterance-first, and voice can drop in later without a redesign. Still to decide: does the first version ship with voice (his headline, more to build and more to break — especially for someone post-hurricane on a bad connection) or text-first? Default: **text-first** (`open-decisions` #5).

**Q7 — Native app + push notifications. ⚠️ REFRAMED, still open.**
The founder's distribution model *depends* on installs before the storm (*"trying to get downloads prior to the storm"*) and later *"the ability to push notices out to people to prompt them to open the app and file the claim."* Downloads + push imply a native app or an installable PWA — a real product requirement, not just a preference. For the **prototype**, mobile-web is still right (it's a validation artifact and needs no app-store approval). But this is now a named promotion-track dependency of his GTM, not a "maybe later."

**Q9 — How much of the doc's field list survives? (NEW — from the answers.)**
The doc lists twelve fields; the founder's real scenario carries five and calls it *"all the information needed."* Reconciled as: the utterance captures the five, then the app asks only for phone/email to follow up; policy number and deductible stay optional and non-blocking (`open-decisions` #9). Confirm nothing else is genuinely required to start a claim.

## Conflicts found (flagged, not assumed)

- **[single-doc] "Primary purpose is client intake" vs. a full contracting/signature/CRM engine.** Reshaped by taking intake as the prototype; the rest is deferred (Q3 ✅).
- **[single-doc] "Fix sales reach" vs. features that only serve people already in the funnel.** ✅ **Dissolved by the founder's answer:** reach is an ads problem, and ads are the plan; the app is the destination.
- **[NEW] The doc's twelve required fields vs. the founder's "five facts are all you need."** Reconciled at Q9 — the doc's list isn't wrong, it's just not all *required to start*.
- **Voice-conversation vs. typed input** — the founder treats them as the same conversation; reconciled as an utterance-shaped flow, pending Q2.
- **"Separate entities" vs. "in many ways we act as one company"** (Deskar PA + Nexus contractor) — the ownership/control fact that decides whether the conflict statutes bite. Founder/counsel only; still flagged (Q1).
