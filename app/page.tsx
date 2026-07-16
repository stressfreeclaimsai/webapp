import { startClaim } from "@/app/actions";

/**
 * WP-2 — Welcome + "Tell me what happened", merged onto one route (decision
 * A8): a splash screen is a wasted tap for someone standing in a wet house.
 * One greeting, one box, one button ([AC-1], [AC-2]).
 */
export default function Home() {
  return (
    <section className="pt-2 sm:pt-6">
      <p className="text-eyebrow font-semibold uppercase text-accent">After the storm</p>
      <h1 className="mt-3 text-balance font-display text-display">
        Tell me what happened, and we&rsquo;ll take it from there.
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        In your own words — a sentence is plenty. We file the claim, handle the inspection, and
        see the repairs through with an approved contractor.
      </p>

      <form action={startClaim} className="mt-8">
        <label htmlFor="utterance" className="sr-only">
          What happened?
        </label>
        <textarea
          id="utterance"
          name="utterance"
          required
          rows={5}
          placeholder="For example: “My name is Ana Torres. My address is 214 Gulf Shore Blvd, Naples, FL. The hurricane hit us yesterday. I'm insured by Citizens Property. The roof and two windows are damaged.”"
          className="w-full resize-y rounded-card border border-border bg-surface-raised p-4 leading-relaxed shadow-sm placeholder:text-muted/70"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-pill bg-accent px-7 py-3.5 font-semibold text-accent-ink sm:w-auto"
        >
          Start my claim
        </button>
      </form>

      {/* Voice-toggle stub (WP-7, should-tier): a signpost for where voice
          will live — deliberately not a control, so it can't imply working
          speech. Text-first is the settled default (open-decisions #5). */}
      <p className="mt-5 flex items-center gap-2 text-sm text-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0 fill-current opacity-70"
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2Z" />
        </svg>
        Prefer to talk it through? Voice is on the way — typing works today.
      </p>

      <p className="mt-8 border-t border-border pt-5 text-sm leading-relaxed text-muted">
        We only ask for what&rsquo;s needed to get the ball rolling. If anything&rsquo;s missing,
        we&rsquo;ll ask — one thing at a time.
      </p>
    </section>
  );
}
