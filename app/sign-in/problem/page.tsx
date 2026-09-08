import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Landing for a sign-in that could not be completed (expired link, replayed
 * callback, provider hiccup). Plain and direction-giving; deliberately says
 * nothing about the cause.
 */
export default function SignInProblem() {
  return (
    <section className="pt-2 sm:pt-6">
      <h1 className="text-balance font-display text-display">We couldn&rsquo;t finish signing you in.</h1>
      <p className="mt-3 leading-relaxed text-muted">
        The link may have expired or already been used. Start again and you&rsquo;ll be back at
        the workspace in a moment.
      </p>
      <Link
        href="/sign-in"
        className="mt-7 inline-block rounded-pill bg-accent-btn px-7 py-3.5 font-semibold text-accent-ink transition-colors hover:bg-accent-btn-hover"
      >
        Try signing in again
      </Link>
    </section>
  );
}
