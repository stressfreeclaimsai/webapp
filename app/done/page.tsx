import Link from "next/link";
import { redirect } from "next/navigation";
import { ITEM_LABELS, stateName } from "@/lib/claim-facts";
import { draftFromCookieValue, draftMissing } from "@/lib/claims";
import { readDraftCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * WP-5 — Confirmation + the concierge preview (AC-6): a calm confirmation, a
 * screenshot-able claim summary (WP-7 should-tier), and a deliberately
 * NON-FUNCTIONAL three-beat preview of the promise — we file, we handle the
 * inspection, an approved contractor repairs. Nothing is scheduled, sent, or
 * contracted; nothing leaves the app. No fee language anywhere (settled Won't).
 *
 * Renders from the submitted cookie snapshot (B13): the demo Claim row was
 * written by submitClaim, but on serverless hosting a cross-request DB read
 * is not dependable, and the confirmation must never be.
 */

const NEXT_STEPS = (insurer: string) => [
  {
    title: "We file your claim",
    body: `We prepare the paperwork and file it with ${insurer}. You don't have to call anyone.`,
  },
  {
    title: "We handle the inspection",
    body: "We arrange the adjuster's visit and walk the property ourselves, so nothing gets missed.",
  },
  {
    title: "An approved contractor makes the repairs",
    body: "A vetted local contractor does the work, and we stay on it until your home is right again.",
  },
];

const dateLong = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export default async function Done() {
  const draft = draftFromCookieValue(await readDraftCookie());

  // No draft at all — a calm, directional state, never a dead-end (AC-8).
  if (!draft) {
    return (
      <section className="pt-2 sm:pt-6">
        <h1 className="text-balance font-display text-display">Nothing here yet.</h1>
        <p className="mt-3 leading-relaxed text-muted">
          You haven&rsquo;t started a claim on this device. It only takes a sentence.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-pill bg-accent px-7 py-3.5 font-semibold text-accent-ink"
        >
          Tell us what happened
        </Link>
      </section>
    );
  }

  // An unsubmitted draft lands back on the step that needs it — the submit
  // itself is server-authoritative, so skipping ahead can't file anything.
  if (!draft.submittedClaimId) redirect(draftMissing(draft).length > 0 ? "/gaps" : "/review");

  const firstName = draft.fullName!.trim().split(/\s+/)[0];
  const reference = `SFC-${draft.submittedClaimId!.slice(-6).toUpperCase()}`;
  const items = draft.itemsDamaged.map((item) => ITEM_LABELS[item]);

  const summary: Array<[string, string]> = [
    ["Name", draft.fullName!],
    ["Property", draft.propertyAddress!],
    // Guarded: a claim submitted before state capture (B16) has no state.
    ...(draft.stateOfLoss ? ([["State", stateName(draft.stateOfLoss)]] as [string, string][]) : []),
    ["Date of loss", dateLong.format(draft.dateOfLoss!)],
    ["Insurance company", draft.insurerName!],
    ["Damaged", items.join(", ")],
    ["Phone", draft.phone!],
    ["Email", draft.email!],
    ...(draft.policyNumber ? ([["Policy number", draft.policyNumber]] as [string, string][]) : []),
    ...(draft.deductible ? ([["Deductible", draft.deductible]] as [string, string][]) : []),
  ];

  return (
    <section className="pt-2 sm:pt-6">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-pill bg-accent-soft text-accent"
      >
        <svg viewBox="0 0 24 24" className="size-6 fill-current">
          <path d="M9.55 17.05 4.5 12l1.4-1.4 3.65 3.64 8.6-8.59 1.4 1.41-10 10Z" />
        </svg>
      </div>
      <h1 className="mt-5 text-balance font-display text-display">
        You&rsquo;re all set, {firstName}.
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        Your claim is started. Take a breath — from here, we take it. Here&rsquo;s a copy of what
        you told us, and what happens next.
      </p>

      {/* Screenshot-able claim summary (WP-7 should-tier). */}
      <div className="mt-8 rounded-card border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-medium">Your claim summary</h2>
          <span className="text-sm font-semibold text-accent">{reference}</span>
        </div>
        <dl className="mt-4 grid gap-2.5 text-sm">
          {summary.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-3">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The concierge promise — a non-functional preview, nothing more. */}
      <h2 className="mt-10 text-eyebrow font-semibold uppercase text-accent">What happens next</h2>
      <ol className="mt-4 grid gap-0">
        {NEXT_STEPS(draft.insurerName!).map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
            {i < 2 && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border"
              />
            )}
            <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-sm font-semibold text-accent">
              {i + 1}
            </span>
            <div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 border-t border-border pt-5 leading-relaxed text-muted">
        You don&rsquo;t need to do anything else right now. We&rsquo;ll keep you posted at{" "}
        <span className="font-medium text-ink">{draft.email}</span>.
      </p>
      <p className="mt-4 text-sm text-muted">
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          Start another claim
        </Link>
      </p>
    </section>
  );
}
