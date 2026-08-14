import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/staff/status-badge";
import { isStateCode, ITEM_LABELS, stateName } from "@/lib/claim-facts";
import { getClaimForStaff } from "@/lib/staff-claims";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

const dateLong = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Denver",
  timeZoneName: "short",
});

function DetailList({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid gap-0">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[9.5rem_1fr] sm:gap-4"
        >
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="min-w-0 font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface-raised p-5 shadow-sm sm:p-6">
      <h2 className="border-b border-border pb-3 text-lg font-semibold text-ink-display">
        {title}
      </h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}

const AUDIT_LABELS: Record<string, string> = {
  "claim.seeded": "Synthetic claim created",
  "claim.submitted": "Claim submitted",
  "claim.viewed": "Claim viewed",
};

export default async function ClaimDetail({
  params,
}: {
  params: Promise<{ referenceCode: string }>;
}) {
  const principal = await requireStaff();
  const { referenceCode } = await params;
  const claim = await getClaimForStaff(principal, decodeURIComponent(referenceCode));
  if (!claim) notFound();

  const activeAssignment = claim.assignments.find((assignment) => !assignment.unassignedAt);
  const items = claim.itemsDamaged.map(
    (item) => ITEM_LABELS[item as keyof typeof ITEM_LABELS] ?? item,
  );

  return (
    <article>
      <Link
        href="/staff/claims"
        className="inline-flex min-h-11 items-center rounded-pill px-3 font-semibold text-warn underline-offset-4 hover:bg-accent-soft hover:underline"
      >
        ← Back to claims
      </Link>

      <header className="mt-4 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold tabular-nums text-warn">{claim.referenceCode}</p>
            <StatusBadge status={claim.status} />
          </div>
          <h1 className="mt-3 text-balance font-display text-display">{claim.claimantName}</h1>
          <p className="mt-2 text-muted">{claim.propertyAddress}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-muted">Submitted</p>
          <time
            className="mt-1 block font-medium tabular-nums text-ink"
            dateTime={claim.submittedAt.toISOString()}
          >
            {dateTime.format(claim.submittedAt)}
          </time>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] lg:items-start">
        <div className="grid gap-5">
          <Panel title="Homeowner">
            <DetailList
              items={[
                ["Name", claim.claimantName],
                [
                  "Phone",
                  <a
                    key="phone"
                    href={`tel:${claim.phone}`}
                    className="break-words text-warn underline-offset-4 hover:underline"
                  >
                    {claim.phone}
                  </a>,
                ],
                [
                  "Email",
                  <a
                    key="email"
                    href={`mailto:${claim.email}`}
                    className="break-all text-warn underline-offset-4 hover:underline"
                  >
                    {claim.email}
                  </a>,
                ],
                ["Property", claim.propertyAddress],
              ]}
            />
          </Panel>

          <Panel title="Loss and policy">
            <DetailList
              items={[
                [
                  "State of loss",
                  isStateCode(claim.stateOfLoss) ? stateName(claim.stateOfLoss) : claim.stateOfLoss,
                ],
                ["Date of loss", dateLong.format(claim.dateOfLoss)],
                ["Insurance company", claim.insurerName],
                ["Damaged", items.join(", ") || "Not specified"],
                ["Policy number", claim.policyNumber || "Not provided"],
                ["Deductible", claim.deductible || "Not provided"],
              ]}
            />
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-muted">
                Damage in the homeowner&rsquo;s words
              </h3>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink">
                {claim.damageDescription || "No additional description provided."}
              </p>
            </div>
          </Panel>

          <Panel title="Internal notes">
            {claim.notes.length === 0 ? (
              <p className="py-4 text-sm text-muted">No internal notes yet.</p>
            ) : (
              <ol className="divide-y divide-border">
                {claim.notes.map((note) => (
                  <li key={note.id} className="py-4 first:pt-3 last:pb-1">
                    <p className="whitespace-pre-wrap leading-relaxed text-ink">{note.body}</p>
                    <p className="mt-2 text-sm text-muted">
                      {note.author.displayName} · {dateTime.format(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <aside className="grid gap-5">
          <Panel title="Ownership">
            <DetailList
              items={[
                ["Current owner", activeAssignment?.assignee.displayName ?? "Unassigned"],
                ["Status", <StatusBadge key="status" status={claim.status} />],
                ["Source", claim.source.replaceAll("_", " ")],
                ["Intake version", claim.intakeVersion],
              ]}
            />
          </Panel>

          <Panel title="Notifications">
            {claim.notificationDeliveries.length === 0 ? (
              <p className="py-4 text-sm text-muted">No notification attempts yet.</p>
            ) : (
              <ol className="divide-y divide-border">
                {claim.notificationDeliveries.map((delivery) => (
                  <li key={delivery.id} className="py-3 first:pt-2 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">
                        {delivery.kind.replaceAll("_", " ")}
                      </p>
                      <span className="rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold capitalize text-muted">
                        {delivery.status}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-muted">{delivery.recipientAddress}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="History">
            {claim.auditEvents.length === 0 ? (
              <p className="py-4 text-sm text-muted">No history recorded yet.</p>
            ) : (
              <ol className="divide-y divide-border">
                {claim.auditEvents.map((event) => (
                  <li key={event.id} className="py-3 first:pt-2 last:pb-1">
                    <p className="text-sm font-semibold text-ink">
                      {AUDIT_LABELS[event.action] ?? event.action.replaceAll(".", " ")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {event.actor?.displayName ?? event.actorType} ·{" "}
                      {dateTime.format(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </aside>
      </div>
    </article>
  );
}
