import Link from "next/link";
import { StatusBadge } from "@/components/staff/status-badge";
import { CLAIM_STATUS_LABELS, CLAIM_STATUSES } from "@/lib/production-domain";
import { listClaimsForStaff } from "@/lib/staff-claims";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

const dateShort = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Denver",
  timeZoneName: "short",
});

export default async function ClaimsQueue({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const principal = await requireStaff();
  const query = await searchParams;
  const data = await listClaimsForStaff(principal, {
    query: query.q,
    status: query.status,
  });

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-eyebrow font-semibold uppercase text-warn">Operations</p>
          <h1 className="mt-2 font-display text-display">Claims</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Review new intake and keep every homeowner&rsquo;s next step visible.
          </p>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          Showing <span className="font-semibold text-ink">{data.claims.length}</span> of{" "}
          <span className="font-semibold text-ink">{data.summary.total}</span>
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Total claims", data.summary.total],
          ["New", data.summary.newCount],
          ["Unassigned", data.summary.unassignedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-control border border-border bg-surface-2 px-4 py-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink-display">{value}</dd>
          </div>
        ))}
      </dl>

      <form
        method="get"
        className="mt-5 grid gap-3 rounded-card border border-border bg-surface-raised p-4 shadow-sm md:grid-cols-[minmax(15rem,1fr)_13rem_auto] md:items-end"
      >
        <div className="grid gap-1.5">
          <label htmlFor="claim-search" className="text-sm font-semibold text-ink">
            Search claims
          </label>
          <input
            id="claim-search"
            name="q"
            type="search"
            defaultValue={data.filters.query}
            placeholder="Reference, homeowner, insurer, or email"
            className="min-h-12 rounded-control border border-border-strong bg-surface-raised px-4 py-3 shadow-sm focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="claim-status" className="text-sm font-semibold text-ink">
            Status
          </label>
          <select
            id="claim-status"
            name="status"
            defaultValue={data.filters.status ?? ""}
            className="min-h-12 rounded-control border border-border-strong bg-surface-raised px-4 py-3 shadow-sm focus:border-accent focus:ring-4 focus:ring-accent-soft"
          >
            <option value="">All statuses</option>
            {CLAIM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CLAIM_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-h-12 gap-2">
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-pill bg-accent-btn px-5 py-3 font-semibold text-accent-ink shadow-sm transition-colors duration-200 hover:bg-accent-btn-hover md:flex-none"
          >
            Apply filters
          </button>
          {(data.filters.query || data.filters.status) && (
            <Link
              href="/staff/claims"
              className="inline-flex min-h-12 items-center justify-center rounded-pill px-4 font-semibold text-warn underline-offset-4 hover:bg-accent-soft hover:underline"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="mt-5 overflow-hidden rounded-card border border-border bg-surface-raised shadow-sm">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(9rem,1.3fr)_6.5rem_6rem_minmax(7rem,1fr)_8rem_7.25rem] gap-3 border-b border-border bg-surface-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted min-[840px]:grid"
        >
          <span>Homeowner</span>
          <span>Status</span>
          <span>State / loss</span>
          <span>Insurer</span>
          <span>Owner</span>
          <span className="text-right">Submitted</span>
        </div>

        {data.claims.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h2 className="font-semibold text-ink">No claims match these filters.</h2>
            <p className="mt-2 text-sm text-muted">Clear the search or choose another status.</p>
            <Link
              href="/staff/claims"
              className="mt-5 inline-flex min-h-11 items-center rounded-pill px-5 font-semibold text-warn underline-offset-4 hover:bg-accent-soft hover:underline"
            >
              Show every claim
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.claims.map((claim) => {
              const owner = claim.assignments[0]?.assignee.displayName ?? "Unassigned";
              return (
                <li key={claim.id}>
                  <Link
                    href={`/staff/claims/${encodeURIComponent(claim.referenceCode)}`}
                    prefetch={false}
                    aria-label={`Open ${claim.referenceCode} for ${claim.claimantName}`}
                    className="grid min-h-14 gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-2 min-[840px]:grid-cols-[minmax(9rem,1.3fr)_6.5rem_6rem_minmax(7rem,1fr)_8rem_7.25rem] min-[840px]:items-center min-[840px]:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-ink">{claim.claimantName}</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-warn">
                        {claim.referenceCode}
                      </p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted min-[840px]:hidden">
                        Status
                      </span>
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="text-sm">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted min-[840px]:hidden">
                        State / loss
                      </span>
                      <p className="font-medium text-ink">{claim.stateOfLoss}</p>
                      <p className="mt-0.5 text-muted">{dateShort.format(claim.dateOfLoss)}</p>
                    </div>
                    <div className="min-w-0 text-sm">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted min-[840px]:hidden">
                        Insurer
                      </span>
                      <p className="break-words text-ink">{claim.insurerName}</p>
                    </div>
                    <div className="min-w-0 text-sm">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted min-[840px]:hidden">
                        Owner
                      </span>
                      <p
                        className={
                          owner === "Unassigned" ? "font-medium text-warn" : "break-words text-ink"
                        }
                      >
                        {owner}
                      </p>
                    </div>
                    <div className="text-sm min-[840px]:text-right">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted min-[840px]:hidden">
                        Submitted
                      </span>
                      <time
                        className="tabular-nums text-muted"
                        dateTime={claim.submittedAt.toISOString()}
                      >
                        {dateTime.format(claim.submittedAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
