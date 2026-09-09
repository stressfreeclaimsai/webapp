import { startClaim } from "@/app/actions";
import { runtimeConfig } from "@/lib/runtime-config";

const STEPS = [
  {
    title: "Start with what you remember",
    body: "Write it naturally. We’ll ask only for essential information that’s missing.",
  },
  {
    title: "Check every detail",
    body: "Review and correct the information before anything is submitted.",
  },
  {
    title: "Hear from a real person",
    body: "Our team reviews your information and contacts you about the next step.",
  },
] as const;

const DAMAGE_EXAMPLES = [
  "Roof",
  "Siding",
  "Windows",
  "Interior water damage",
  "Damaged belongings",
] as const;

const FAQS = [
  {
    question: "Does this submit directly to my insurance company?",
    answer:
      "Not by itself. This intake sends your information to the StressFreeClaim team for review. We’ll explain the next steps before you decide how to proceed.",
  },
  {
    question: "Do I need my policy number?",
    answer:
      "No. Your policy number is optional, so you can begin even if your paperwork is not nearby.",
  },
  {
    question: "Can I correct anything the system gets wrong?",
    answer: "Yes. You’ll review and edit every saved detail before submitting your information.",
  },
  {
    question: "Where is the service available?",
    answer:
      "Availability and services may vary by location. Our team will confirm what support is available after reviewing the property location.",
  },
] as const;

/**
 * WP-2 — Welcome + "Tell me what happened", merged onto one route (decision
 * A8): a splash screen is a wasted tap for someone standing in a wet house.
 * One greeting, one box, one button ([AC-1], [AC-2]).
 *
 * B18 visual pass: centered hero, oxblood Fraunces display at full optical
 * size, and the input floated as the one bright panel on the page — the copy
 * steps back so the box is the obvious next move. NOTE: the H1 wording is
 * pinned by the frozen [AC-1] gate; the "We're here to help" copy swap is
 * pending a spec amendment (see open-decisions.md).
 *
 * B26 desktop pass: the hero and input keep the 700px reading column; the
 * supporting sections below break out to a wider band (same pattern as the
 * staff layout) so the three steps and the FAQ get real room on desktop. The
 * damage examples moved inside the input panel, where they help while
 * writing, and the ownership note became one line under the FAQ.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const config = runtimeConfig();
  const query = await searchParams;
  return (
    <div>
      <section className="pt-2 text-center sm:pt-[clamp(24px,7vh,64px)]">
        <h1 className="mx-auto text-balance font-display text-[clamp(2.35rem,5.6vw,3.35rem)] font-medium leading-[1.04] tracking-[-0.015em] text-ink-display [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_0]">
          {config.isPilot
            ? "Tell us what happened. We’ll review it with you."
            : "Tell me what happened, and we’ll take it from there."}
        </h1>
        <p className="mx-auto mt-[18px] max-w-[520px] text-base leading-relaxed text-muted">
          In your own words, a sentence is plenty. Share what happened, review every detail, and
          send it to our team for follow-up.
        </p>

        {query.draft === "expired" && (
          <p
            role="status"
            className="mx-auto mt-5 max-w-[480px] rounded-control border border-border bg-surface-2 px-4 py-3 text-left text-sm leading-relaxed text-muted"
          >
            That draft expired to protect your information. Start again with a sentence below.
          </p>
        )}

        <form
          action={startClaim}
          className={query.draft === "expired" ? "mt-5 text-left" : "mt-7 text-left sm:mt-9"}
        >
          <div className="overflow-hidden rounded-card border border-border-strong bg-surface-raised shadow-[0_18px_48px_-24px_rgba(94,42,40,0.28)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:shadow-[0_22px_54px_-24px_rgba(94,42,40,0.34)] focus-within:ring-4 focus-within:ring-accent-soft">
            <div className="px-5 pt-4">
              <label htmlFor="utterance" className="font-semibold text-ink">
                What happened?
              </label>
            </div>
            <textarea
              id="utterance"
              name="utterance"
              required
              rows={5}
              placeholder="For example: “My name is Ana Torres. My address is 214 Gulf Shore Blvd, Naples, FL. The hurricane hit us yesterday. I'm insured by Citizens Property. The roof and two windows are damaged.”"
              className="min-h-60 w-full resize-y bg-transparent px-5 py-3 text-[1.06rem] leading-relaxed outline-none placeholder:text-faint sm:min-h-36"
            />
            {/* Damage examples live where they help — while writing (B26).
                Plain list items, not controls: the button stays the only action. */}
            <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
              <span className="text-sm text-muted">Worth mentioning:</span>
              <ul className="flex flex-wrap gap-2" aria-label="Damage examples">
                {DAMAGE_EXAMPLES.map((item) => (
                  <li
                    key={item}
                    className="rounded-pill border border-border bg-surface-2 px-3 py-1 text-sm text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end border-t border-border bg-surface-2 px-3 py-3 sm:px-4">
              <button
                type="submit"
                className="min-h-12 w-full rounded-pill bg-accent-btn px-7 py-3 text-base font-semibold text-accent-ink shadow-[0_10px_24px_-12px_rgba(184,78,46,0.65)] transition-[background-color,box-shadow] duration-200 hover:bg-accent-btn-hover hover:shadow-[0_12px_28px_-12px_rgba(184,78,46,0.75)] sm:w-auto"
              >
                Start my claim
              </button>
            </div>
          </div>
        </form>

        {/* Voice-toggle stub (WP-7, should-tier): a signpost for where voice
            will live — deliberately not a control, so it can't imply working
            speech. Text-first is the settled default (open-decisions #5). */}
        {!config.isPilot && (
          <p className="mt-5 flex items-center justify-center gap-2 text-[0.9rem] text-muted">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 shrink-0 fill-current opacity-70"
            >
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2Z" />
            </svg>
            Prefer to talk it through? Voice is on the way — typing works today.
          </p>
        )}

        <ul
          aria-label="Intake reassurances"
          className="mt-9 grid gap-px overflow-hidden rounded-control border border-border bg-border text-left text-sm sm:grid-cols-3"
        >
          {["No account required", "Review before submitting", "Policy number optional"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2 bg-surface-2 px-4 py-3 text-ink">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-4 shrink-0 fill-none stroke-warn [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]"
                >
                  <path d="m5.5 10.2 2.8 2.8 6.2-6.2" />
                </svg>
                {item}
              </li>
            ),
          )}
        </ul>
      </section>

      {/* Supporting sections break out of the 700px reading column to a wider
          band on desktop (B26) — same centring pattern as the staff layout.
          On phones the band equals the column, so nothing changes there. */}
      <div className="relative left-1/2 w-[calc(100vw-2.5rem)] max-w-[1040px] -translate-x-1/2 sm:w-[calc(100vw-3.5rem)]">
        <section aria-labelledby="how-it-works" className="mt-20 sm:mt-24">
          <p className="text-center text-eyebrow font-semibold uppercase text-warn">
            How it works
          </p>
          <h2
            id="how-it-works"
            className="mt-3 text-center font-display text-[clamp(2rem,5vw,2.65rem)] font-medium leading-tight tracking-[-0.015em] text-ink-display"
          >
            A calmer way to start
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-center leading-relaxed text-muted">
            You do not need perfect paperwork or insurance language. Begin with what you know.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3 lg:gap-6">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-card border border-border bg-surface-raised p-5 text-left shadow-[0_16px_36px_-30px_rgba(94,42,40,0.35)] lg:p-7"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-warn"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold leading-snug text-ink lg:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="questions" className="mx-auto mt-20 max-w-[920px] sm:mt-24">
          <p className="text-center text-eyebrow font-semibold uppercase text-warn">Good to know</p>
          <h2
            id="questions"
            className="mt-3 text-center font-display text-[clamp(2rem,5vw,2.65rem)] font-medium leading-tight tracking-[-0.015em] text-ink-display"
          >
            A few common questions
          </h2>

          <dl className="mt-8 divide-y divide-border border-y border-border text-left">
            {FAQS.map((item) => (
              <div
                key={item.question}
                className="py-5 sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-8 lg:gap-12"
              >
                <dt className="font-semibold leading-relaxed text-ink">{item.question}</dt>
                <dd className="mt-2 leading-relaxed text-muted sm:mt-0">{item.answer}</dd>
              </div>
            ))}
          </dl>

          {/* Ownership / service-clarity note (B23), now one line (B26). */}
          <p className="mt-8 text-center text-sm leading-relaxed text-muted">
            StressFreeClaim.ai is being developed for Nexus Development. This intake does not
            submit directly to an insurer.
          </p>
        </section>
      </div>
    </div>
  );
}
