import { startClaim } from "@/app/actions";

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
  return (
    <section className="pt-[clamp(24px,8vh,80px)] text-center">
      <h1 className="mx-auto text-balance font-display text-[clamp(2.35rem,5.6vw,3.35rem)] font-medium leading-[1.04] tracking-[-0.015em] text-ink-display [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_0]">
        Tell me what happened, and we&rsquo;ll take it from there.
      </h1>
      <p className="mx-auto mt-[18px] max-w-[480px] text-base leading-relaxed text-muted">
        In your own words — a sentence is plenty. We file the claim, handle the inspection, and
        see the repairs through with an approved contractor.
      </p>

      <form action={startClaim} className="mt-9 text-left">
        <label htmlFor="utterance" className="sr-only">
          What happened?
        </label>
        <div className="overflow-hidden rounded-card border border-border bg-surface-raised shadow-[0_16px_40px_-16px_rgba(94,42,40,0.18)] transition-shadow focus-within:border-accent focus-within:shadow-[0_20px_48px_-14px_rgba(94,42,40,0.26)] focus-within:ring-4 focus-within:ring-accent-soft">
          <textarea
            id="utterance"
            name="utterance"
            required
            rows={5}
            placeholder="For example: “My name is Ana Torres. My address is 214 Gulf Shore Blvd, Naples, FL. The hurricane hit us yesterday. I'm insured by Citizens Property. The roof and two windows are damaged.”"
            className="w-full resize-none bg-transparent p-5 text-[1.06rem] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex justify-end px-4 pb-4">
            <button
              type="submit"
              className="rounded-pill bg-accent-btn px-7 py-3 text-base font-semibold text-accent-ink shadow-[0_10px_24px_-10px_rgba(184,78,46,0.55)] transition-colors hover:bg-accent-btn-hover"
            >
              Start my claim
            </button>
          </div>
        </div>
      </form>

      {/* Voice-toggle stub (WP-7, should-tier): a signpost for where voice
          will live — deliberately not a control, so it can't imply working
          speech. Text-first is the settled default (open-decisions #5). */}
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

      <p className="mt-9 border-t border-border pt-5 text-[0.9rem] leading-relaxed text-muted">
        We only ask for what&rsquo;s needed to get the ball rolling. If anything&rsquo;s missing,
        we&rsquo;ll ask — one thing at a time.
      </p>
    </section>
  );
}
