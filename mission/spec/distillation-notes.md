# distillation-notes.md — StressFreeClaim.ai (internal, Paul-facing)

> Working notes from the multi-pass distillation: critic pass, the regulatory-surface checklist, domain-research, feasibility. Not friend-facing. The point of these passes is to **escalate what's uncertain or risky**, not smooth it into a confident plan.

---

## Critic pass — attacking the first draft

The light first pass scoped cleanly to "conversational intake" and walled off the rest. A critic attacking that draft found nine things it glossed:

1. **The bet may be wrong.** The doc says intake exists to fix two named weaknesses (sales reach; the 10% fee objection) — and intake is neither. A voice form for someone who already decided to file doesn't move either. → the spec makes the validation question explicit about what it does/doesn't test.
2. **The fee-waiver was scoped out silently — and it may be the actual product.** The dual-contract "agree" that makes the waiver real is plausibly the differentiator. → kept out of the build *with a stated reason* (legally gated), not silently; surfaced as Q1.
3. **[single-doc contradiction] "Fix sales reach" vs. features that only serve people already in the funnel.** Nothing acquires a new homeowner. → Conflicts found (Q5).
4. **Who opens this first is unverified** — the doc's motion is rep-driven (door-knocking, telemarketed appointments). → Q4.
5. **Voice is a fork mislabeled** — voice-conversation vs. typed fallback are different builds/risk. → named as a fork; text-first default (Q2).
6. **The loop ends before the promise** — "start to finish + repairs" is the pitch; the draft stopped at "we'll take it from here." → extended with a non-functional concierge preview (AC-6).
7. **The confirmation dodges the fee-objection moment** — the exact scene the app is meant to win is absent. → acknowledged: the prototype tests the *experience*, not the fee close (which is gated); stated plainly rather than pretending otherwise.
8. **Load-bearing scope-out: the flow's output is a legal instrument** — contracts + signatures + the affiliated-contractor waiver; the founder himself flagged e-signature legality. → routed to domain-research + the SOW's gated phase.
9. **Reach may need distribution the app can't provide.** → Q5; the prototype does not claim to test reach.

**Net:** clean and coherent-reading, but incurious in the expensive place — it validated a convenient intake form while the founder's own crux (the fee-waiver/dual-contract close) is both dropped and legally fraught.

---

## Regulatory-surface checklist (auditable trigger record)

All eight surfaces checked. Fired surfaces drove the domain-research pass.

| # | Surface | Touches? | Why |
|---|---|---|---|
| 1 | Health / medical | no | Property insurance, not health/PHI. |
| 2 | Money / financial / payments | **YES → fire** | 10% PA fee, the fee-waiver mechanic, deductible, insurance proceeds. |
| 3 | Children / minors | no | Users are property owners (adults). |
| 4 | Employment / labor | no | The Deskar/Nexus tie is a business affiliation, not an app labor-law surface. |
| 5 | Personal data / privacy | **YES → fire** | Voice recording of the intake conversation; PII; digital signatures. |
| 6 | Food / consumables | no | N/A. |
| 7 | Legal / professional-licensing | **YES → fire** | Public adjusting is a licensed profession; PA + construction contracts; e-signature legality; the PA-as-contractor conflict. |
| 8 | Safety / physical-harm | no | Roofing work is physical, but the app's surface is intake/contracts, not the jobsite. |

**Decision:** fired on #2, #5, #7 → domain-research run, scoped to those surfaces.

---

## Domain-research pass — public adjusting + PA-as-contractor + conditioned fee-waiver (REGULATED; verify with counsel)

The single most important finding: the founder's own framing ("separate entities but… act as one company," PA handles the claim then Nexus does the work, "we get around the fee rule by waiving it if Nexus is the contractor") describes precisely the arrangement the PA conflict-of-interest statutes were written to prohibit. Core of the model, not a late feature.

### Model-reshapers (answer before you build)
- **[potential showstopper] PA with a financial interest in the repair on the same claim is prohibited** in the leading states — Fla. Stat. 626.8795 ("may not participate, directly or indirectly, in the reconstruction… may not have a financial interest in any… business entity that obtains business in connection with any claim"); Tex. Ins. Code 4102.158; NAIC Model Act #228 (30+ states). The Deskar/Nexus shared-ownership affiliation is the targeted fact pattern.
- **[potential showstopper] Texas *Lon Smith* — such contracts held void, not voidable**, with full disgorgement and class exposure (Tex. Ins. Code 4102.163; *Lon Smith Roofing & Construction v. Key*). Downside is unwinding every contract and refunding customers.
- **[potential showstopper] The fee-waiver conditioned on using Nexus is very likely an illegal inducement / tying** — Fla. Stat. 626.854 bars a PA offering/accepting compensation or inducement for referral of roofing repair services; the "waived" fee doesn't erase the PA's economic interest, it relocates it into Nexus's margin (the forbidden financial interest). Anti-rebating rules in 48 states. Even permissive states (e.g., Illinois, CB2024-16) ban price variation by contractor choice and require written financial-interest disclosure. **needs verification** whether *any* target state permits it.
- **[risk] Mandatory financial-interest disclosure** the app currently omits (NAIC §15G; e.g., N.C. Gen. Stat. 58-33A-80) — a build the app would need if it proceeds.

### Money-handling
- **[risk] Deductible waiver/absorption is criminalized** in TX (Ins. Code 707.002 / HB 2102; up to six months jail) and CO (§6-22-105, Class 2 misdemeanor); a PA's fee may not be based on the deductible portion (Fla. 626.854). Count of states **needs verification**. The prototype never handles the deductible.

### Document / contract execution
- **[constraint] PA contracts carry mandatory language, fee caps, and rescission** — FL 3-business-day rescission + 20%/10%-emergency cap; NY 3-day (Ins. Law §2108); LA 12% (R.S. 22:1703); SC bold conspicuous fee language (§38-48-80). A generator must encode the correct state's clauses or risk unenforceability.
- **[risk] E-signatures generally valid (ESIGN/UETA) but PA-contract execution rules are per-state** — some require wet signature / initialed rescission; the rescission clock may not start until documents are properly received. Whether a single agree-to-T&C click validly executes the PA contract + rescission notice is **needs verification** per state.

### Consent / privacy
- **[risk] Recording the intake implicates all-party-consent states** (~12: CA, DE, FL, IL, MD, MA, MT, NV, NH, OR, PA, WA — exact roster **needs verification**); higher stakes because the recording underlies a signed contract.

### Future feature
- **[risk] An AI that "calls in claims to insurers"** risks being unlicensed adjusting (FL: unlicensed adjusting is a 3rd-degree felony) and touches represented-party rules. Legal characterization of an AI adjuster-agent is **needs verification** — little settled authority.

### Founder/counsel-only facts (no research can resolve)
- Which states Deskar 6 is licensed in and intends to operate in.
- The exact Deskar 6 / Nexus ownership & control relationship — likely *the* fact that decides whether the conflict statutes trigger.
- Whether any target state's NAIC adoption expressly permits a disclosed PA/contractor relationship vs. a flat prohibition.

**Why this matters for the SOW:** three items (conflict, void-contract precedent, inducement) can invalidate the *business*, not a feature — the founder would much rather hear it now than discover it after building. This is the pass that most justifies the distiller.

---

## Feasibility / effort pass — sizing against the archetype

Relative effort: **S** = days · **M** = ~1–2 weeks · **L** = multi-week / partly not-a-build-problem.

| Capability | Effort | Notes |
|---|---|---|
| Typed conversational intake (fields → throwaway SQLite), single demo user | **S** | **The prototype.** Archetype-native. Cheapest honest slice. |
| Non-functional "start-to-finish + repairs" concierge preview | **S** | Static/seeded; shows the promise (critic #6). |
| Record customer info (CRM-vs-Excel question) | **S** | Prisma/SQLite answers it for the prototype; CRM choice is promotion-track ops. |
| Fee-waiver reveal + dual-contract "agree" moment | **S to build / L to ship** | Cheap as UI, but **legally gated** — likely impermissible; the distiller keeps it OUT of the validated flow. |
| Generate PA contract from template | **M** | Promotion-track + gated (mandatory language, caps, rescission). |
| Generate Nexus construction contract | **M** | Same; template doesn't exist yet (founder must supply). |
| Digital signatures (binding e-sign) | **L** | Promotion-track + gated; third-party provider + enforceability review. |
| Save contracts to CRM | **M** | Promotion-track; real persistence + integration. |
| PA-as-contractor conflict + conditioned-waiver legality | **L (not a build)** | **Answer, don't build.** May make the core model impermissible. |
| Voice conversational intake | **L (fork)** | Different product; speech API + key; recording-consent law. |
| Native iOS + Android | **L (fork)** | Off the web stack; separate products. Web answers "separate apps?" → not yet. |
| Contractor portal | **L** | Promotion-track; second role, real auth/multi-tenancy. |
| AI that calls insurers | **L (separate product)** | Gated; unlicensed-adjusting exposure. |
| AI welcome-package email | **S** | Small once triggered; gated only on a sending account; stub/log in the prototype. |

**Sequencing read:** the cheapest proof is the typed intake + concierge preview (all S, archetype-native). Everything heavier is **gated on answers, not effort** — the conflict/inducement legality (may kill/reshape the model), state contract rules, and e-sign enforceability must be answered by counsel before the contracting phase is worth building. Voice and native apps are forks; the insurer-calling AI is a future partnership question.

---

## What stays with Paul (cannot be automated away)

- **The legal go/no-go** on the fee-waiver + PA-as-contractor model — the crux; counsel only.
- **The Deskar/Nexus ownership fact** and the licensing table — founder/counsel only.
- **The bet** — is validating the intake experience useful if the differentiator is gated? (I say yes, but it's a judgment call.)
- **The demand question** — do homeowners self-serve into a public adjuster at all? A few conversations, not a build.

Everything else above — the ingest, the conflict-finding, the sequencing, the SOW draft — the engine does.
