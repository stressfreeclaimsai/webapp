import { startClaim } from "@/app/actions";
import { runtimeConfig } from "@/lib/runtime-config";

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
 */
export default function Home() {
  const config = runtimeConfig();
  return (
    <section className="pt-2 text-center sm:pt-[clamp(24px,7vh,64px)]">
      <h1 className="mx-auto text-balance font-display text-[clamp(2.35rem,5.6vw,3.35rem)] font-medium leading-[1.04] tracking-[-0.015em] text-ink-display [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_0]">
        {config.isPilot
          ? "Tell us what happened. We’ll review it with you."
          : "Tell me what happened, and we’ll take it from there."}
      </h1>
      <p className="mx-auto mt-[18px] max-w-[480px] text-base leading-relaxed text-muted">
        {config.isPilot
          ? "In your own words — a sentence is plenty. Our team will review your information and contact you about next steps."
          : "In your own words — a sentence is plenty. We file the claim, handle the inspection, and see the repairs through with an approved contractor."}
      </p>

      <form action={startClaim} className="mt-7 text-left sm:mt-9">
        <div className="overflow-hidden rounded-card border border-border-strong bg-surface-raised shadow-[0_18px_48px_-24px_rgba(94,42,40,0.28)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:shadow-[0_22px_54px_-24px_rgba(94,42,40,0.34)] focus-within:ring-4 focus-within:ring-accent-soft">
          <div className="flex items-baseline justify-between gap-3 px-5 pt-4">
            <label htmlFor="utterance" className="font-semibold text-ink">
              What happened?
            </label>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
              One sentence is enough
            </span>
          </div>
          <textarea
            id="utterance"
            name="utterance"
            required
            rows={5}
            placeholder="For example: “My name is Ana Torres. My address is 214 Gulf Shore Blvd, Naples, FL. The hurricane hit us yesterday. I'm insured by Citizens Property. The roof and two windows are damaged.”"
            className="min-h-60 w-full resize-y bg-transparent px-5 py-3 text-[1.06rem] leading-relaxed outline-none placeholder:text-faint sm:min-h-36"
          />
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
      {!config.isPilot && <p className="mt-5 flex items-center justify-center gap-2 text-[0.9rem] text-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0 fill-current opacity-70"
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2Z" />
        </svg>
        Prefer to talk it through? Voice is on the way — typing works today.
      </p>}

      <p className="mt-9 border-t border-border pt-5 text-[0.9rem] leading-relaxed text-muted">
        We only ask for what&rsquo;s needed to get the ball rolling. If anything&rsquo;s missing,
        we&rsquo;ll ask — one thing at a time.
      </p>
    </section>
  );
}
