import Link from "next/link";

/**
 * The constitution §7 affordance: every prototype must visibly declare that it
 * is not a live product holding real data. One bar, one row (B18): wordmark
 * left, warning right, on a translucent blurred strip so it never reads as a
 * separate header. flex-wrap lets the warning drop to a second line on small
 * phones instead of crowding the wordmark.
 */
export function PrototypeBanner() {
  return (
    <div role="note" className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-5 py-2.5 sm:px-6">
        <Link
          href="/"
          className="font-display text-[1.1rem] font-semibold tracking-tight text-ink max-[520px]:text-[1rem]"
        >
          StressFreeClaim<span className="text-accent">.ai</span>
        </Link>
        <span className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-warn max-[520px]:text-[0.62rem] max-[520px]:tracking-[0.08em]">
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
          Prototype — not for real data
        </span>
      </div>
    </div>
  );
}
