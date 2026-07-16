# gtm-positioning.md — StressFreeClaim.ai (internal, Paul-facing)

> The distiller's **first pass** — runs before scoping; no confidence scores (they drift into meaningless precision); options are differentiated by **assumption load** and **what would break them**, with the cheapest test to find out. The regulatory research below is **verify-with-counsel**, not legal advice.

---

## The idea, restated

Deskar 6 (a public adjuster) and its affiliated contractor Nexus want homeowners to file property claims through a conversational app, then have the two companies handle the claim start-to-finish and do the repairs. The founder's framing treats the *app's convenience* as the product and the *fee-waiver close* as the differentiator. This pass tests that framing before we build to it.

## Who is this actually for, and what's the job?

The doc names the homeowner as the user, but the described sales motion is door-knocking and telemarketed appointments — a **rep is physically present**. The real first question is **who opens this and when**: a homeowner self-serving after a storm, or a Deskar/Nexus rep running it *with* a homeowner at the kitchen table. Those are different products. And the business question the doc half-names but doesn't solve is **reach** — the founder says the app fixes it, but nothing in the feature set actually acquires a new homeowner.

---

## Positioning options

Three genuinely different bets. Not ranked by score — distinguished by what has to be true and what would kill each.

### Option A — "The easy way to file" (conversational self-serve intake)
The bet: homeowners choose Deskar because filing is painless and conversational.
- **Load-bearing assumptions:** (1) homeowners find the app *before* a rep meets them; (2) a smoother intake is enough to win them; (3) the differentiator is the UX.
- **What would break it:** homeowners don't self-serve into a public adjuster at all — the doc's own funnel is rep-driven, so there may be no self-serve traffic. If true, the intake UX has no audience.
- **Cheapest test:** the intake prototype, run with real homeowners (or rep-assisted) — does anyone complete it and want to continue? A build, but the cheap one.

### Option B — "We waive the fee if we do the repair" (the founder's actual differentiator)
The bet: the draw is the fee-waiver close — no 10% PA fee if Nexus does the work — delivered so smoothly the app overcomes the objection live selling can't.
- **Load-bearing assumptions:** (1) the fee-waiver-conditioned-on-Nexus is *legal*; (2) the PA/contractor affiliation is permissible; (3) presenting it in-app overcomes the objection.
- **What would break it:** **the law** (see research). A PA having a financial interest in the repair on a claim they adjust is prohibited in the leading states, and waiving the fee conditioned on using the affiliated contractor is very likely an illegal inducement. This isn't a UX risk; it's "the differentiator may be unlawful as structured."
- **Cheapest test:** a call with a PA-compliance attorney in Deskar's top 2–3 states — **before** any build. Cheaper than validating a mechanism you can't ship.

### Option C — "Concierge claim handling" (advocacy + done-for-you, fee model TBD)
The bet: the draw is the concierge promise — "we handle the whole claim and the repair for you" — independent of the specific fee mechanic.
- **Load-bearing assumptions:** (1) the done-for-me promise is worth it to homeowners; (2) a compliant fee structure exists (standard 10%, or a lawfully-disclosed affiliation).
- **What would break it:** if the economics only work via the (impermissible) waiver, the compliant version may not pencil.
- **Cheapest test:** model the unit economics with a *compliant* fee structure; does the concierge promise still attract homeowners at the standard fee? A conversation + a spreadsheet.

---

## Skeptic pass (adversarial — attacks the above)

- **The prototype may not be the right first artifact.** The differentiator (Option B) is legally gated, and the demand question (does anyone self-serve into a PA?) is unanswered. **One attorney call and a handful of homeowner conversations de-risk the idea faster and cheaper than any build.** Say it plainly — this is the advice a self-serve tool never gives.
- **Option B is the founder's favorite and the most legally fragile.** The "we get around the fee rule by waiving it" line is, almost verbatim, the inducement the statutes prohibit. The pull toward it is exactly why the attorney call comes first.
- **The app doesn't fix the stated weakness (reach).** Reach is a distribution problem; an intake app only helps if homeowners find it remotely. Nothing in the doc produces that. Don't let "marketing will center on convenience" stand in for a distribution plan.
- **Voice is a distraction at this altitude.** Whether the assistant talks or types is irrelevant until the legality and demand questions resolve.

---

## Regulatory / precedent scan — verify with counsel, not legal advice

Sharp, sourced detail is in `distillation-notes.md`. Business-level headlines:

- **PA-as-contractor conflict is real and statutory** — a public adjuster may not have a financial interest in the repair on a claim they adjust (Fla. Stat. 626.8795; Tex. Ins. Code 4102.158; NAIC model act, 30+ states). The Deskar/Nexus "act as one company" affiliation is the targeted fact pattern.
- **Texas *Lon Smith*: such contracts held void** (not voidable) with full disgorgement — the downside is unwinding every contract and refunding customers, on a class basis.
- **The fee-waiver-conditioned-on-Nexus is very likely an illegal inducement/tying arrangement** — the highest-risk item in the doc. Even states that permit a disclosed PA/contractor relationship (e.g., Illinois) ban price variation by contractor choice and require written financial-interest disclosure.
- **Deductible, contract execution, recording, e-signature** — each carries its own per-state rules (deductible-waiver statutes; mandatory PA-contract language + fee caps + 3-day rescission; all-party recording consent; ESIGN/UETA formalities).
- **Founder/counsel-only facts:** which states Deskar is licensed in, and the exact Deskar/Nexus ownership relationship — these decide which rules bite.

---

## What this pass changes downstream

- **The SOW leads with the cheapest validators** (an attorney call on the model; homeowner conversations on demand) as the honest first step, and puts the contracting/fee work in a clearly legally-gated phase.
- **The prototype bet is Option A/C's intake+concierge experience**, explicitly *not* Option B's fee-waiver close — which cannot be responsibly validated by a build pre-counsel.
- **The conflict/inducement findings move from "later phase" to "answer before the contracting phase,"** because they can invalidate the differentiator, not just gate a feature.

## What stays with Paul (cannot be automated)

The research *gathers*; Paul *interprets*. Whether the conflict + inducement law actually sinks the fee model (vs. a compliant restructuring — standard fee, disclosed affiliation), whether homeowners self-serve into a PA at all, and whether the compliant economics work — all judgment. The engine's job was to keep the founder from building (and validating) a differentiator his own research says is probably an illegal inducement.
