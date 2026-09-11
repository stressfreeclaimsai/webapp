import Link from "next/link";
import { notFound } from "next/navigation";
import { createClaimNote, updateClaimOwner, updateClaimStatus } from "@/app/staff/actions";
import { StatusBadge } from "@/components/staff/status-badge";
import { SubmitButton } from "@/components/staff/submit-button";
import { isStateCode, ITEM_LABELS, stateName } from "@/lib/claim-facts";
import {
  CLAIM_NOTE_MAX_LENGTH,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUSES,
  staffCan,
} from "@/lib/production-domain";
import { getClaimForStaff, listAssignableStaff } from "@/lib/staff-claims";
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

const CONTROL =
  "min-h-12 w-full rounded-control border border-border-strong bg-surface-raised px-4 py-3 shadow-sm focus:border-accent focus:ring-4 focus:ring-accent-soft";

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

/**
 * Outcome messages for the `?outcome=` flag the actions redirect with. Every
 * problem tells the person what to do next; nothing dead-ends (never-trap).
 */
const OUTCOME_MESSAGES: Record<string, { tone: "ok" | "problem"; text: string }> = {
  status: { tone: "ok", text: "Status updated." },
  assigned: { tone: "ok", text: "Owner updated." },
  unassigned: { tone: "ok", text: "Owner cleared. This claim is unassigned." },
  note: { tone: "ok", text: "Note added." },
  not_allowed: {
    tone: "problem",
    text: "Your access level can't make that change. Ask an admin if it's needed.",
  },
  invalid_status: { tone: "problem", text: "Choose one of the listed statuses and try again." },
  same_status: { tone: "problem", text: "The claim already has that status. Nothing changed." },
  assignee_not_found: {
    tone: "problem",
    text: "That staff member isn't active any more. Choose another owner.",
  },
  same_assignee: { tone: "problem", text: "That person already owns this claim. Nothing changed." },
  note_empty: { tone: "problem", text: "Write the note before adding it." },
  note_too_long: {
    tone: "problem",
    text: `Notes are limited to ${CLAIM_NOTE_MAX_LENGTH.toLocaleString("en-US")} characters. Shorten it and try again.`,
  },
};

const AUDIT_LABELS: Record<string, string> = {
  "claim.seeded": "Synthetic claim created",
  "claim.submitted": "Claim submitted",
  "claim.viewed": "Claim viewed",
  "claim.status_changed": "Status changed",
  "claim.assigned": "Owner changed",
  "claim.unassigned": "Owner cleared",
  "claim.note_added": "Note added",
};

type AuditMetadata = { from?: unknown; to?: unknown; assigneeId?: unknown };

/** Human sentence for a history row, built from identifiers only. */
function describeAuditEvent(
  action: string,
  metadata: unknown,
  staffNames: ReadonlyMap<string, string>,
): string {
  const label = AUDIT_LABELS[action] ?? action.replaceAll(".", " ");
  const meta = (metadata ?? {}) as AuditMetadata;
  if (action === "claim.status_changed" && typeof meta.to === "string") {
    const to = CLAIM_STATUS_LABELS[meta.to as keyof typeof CLAIM_STATUS_LABELS] ?? meta.to;
    return `${label} to ${to}`;
  }
  if (action === "claim.assigned" && typeof meta.assigneeId === "string") {
    return `${label} to ${staffNames.get(meta.assigneeId) ?? "a staff member"}`;
  }
  return label;
}

export default async function ClaimDetail({
  params,
  searchParams,
}: {
  params: Promise<{ referenceCode: string }>;
  searchParams: Promise<{ outcome?: string }>;
}) {
  const principal = await requireStaff();
  const { referenceCode } = await params;
  const { outcome } = await searchParams;
  const [claim, assignable] = await Promise.all([
    getClaimForStaff(principal, decodeURIComponent(referenceCode)),
    listAssignableStaff(),
  ]);
  if (!claim) notFound();

  const activeAssignment = claim.assignments.find((assignment) => !assignment.unassignedAt);
  const items = claim.itemsDamaged.map(
    (item) => ITEM_LABELS[item as keyof typeof ITEM_LABELS] ?? item,
  );
  const message = outcome ? OUTCOME_MESSAGES[outcome] : undefined;

  // Names for history rows: everyone assignable now plus anyone who has ever
  // held this claim (they may since have been deactivated).
  const staffNames = new Map<string, string>();
  for (const staff of assignable) staffNames.set(staff.id, staff.displayName);
  for (const assignment of claim.assignments) {
    staffNames.set(assignment.assigneeId, assignment.assignee.displayName);
  }

  const canChangeStatus = staffCan(principal.role, "claim.change_status");
  const canAssign = staffCan(principal.role, "claim.assign");
  const canAddNote = staffCan(principal.role, "claim.add_note");

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

      <div role="status" aria-live="polite" aria-label="Update result" className="min-h-0">
        {message && (
          <p
            className={`mt-5 rounded-control border px-4 py-3 font-medium ${
              message.tone === "ok"
                ? "border-ink-display/20 bg-ink-display/10 text-ink-display"
                : "border-accent/30 bg-accent-soft text-warn"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

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
            {canAddNote && (
              <form action={createClaimNote} className="grid gap-3 border-b border-border py-4">
                <input type="hidden" name="referenceCode" value={claim.referenceCode} />
                <label htmlFor="note-body" className="text-sm font-semibold text-ink">
                  Add a note for the team
                </label>
                <textarea
                  id="note-body"
                  name="body"
                  rows={3}
                  required
                  maxLength={CLAIM_NOTE_MAX_LENGTH}
                  placeholder="What you learned, what you told the homeowner, what happens next."
                  className={`${CONTROL} resize-y leading-relaxed`}
                />
                <p className="text-sm text-muted">
                  Notes are internal. The homeowner never sees them.
                </p>
                <div>
                  <SubmitButton pendingLabel="Adding…">Add note</SubmitButton>
                </div>
              </form>
            )}
            {claim.notes.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                No internal notes yet.{canAddNote ? " The first one goes above." : ""}
              </p>
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

            {canChangeStatus && (
              <form action={updateClaimStatus} className="grid gap-2 border-t border-border pt-4">
                <input type="hidden" name="referenceCode" value={claim.referenceCode} />
                <label htmlFor="claim-status" className="text-sm font-semibold text-ink">
                  Change status
                </label>
                <select
                  id="claim-status"
                  name="status"
                  defaultValue={claim.status}
                  className={CONTROL}
                >
                  {CLAIM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CLAIM_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <div className="mt-1">
                  <SubmitButton pendingLabel="Saving…">Update status</SubmitButton>
                </div>
              </form>
            )}

            {canAssign && (
              <form action={updateClaimOwner} className="grid gap-2 border-t border-border pt-4">
                <input type="hidden" name="referenceCode" value={claim.referenceCode} />
                <label htmlFor="claim-owner" className="text-sm font-semibold text-ink">
                  Change owner
                </label>
                <select
                  id="claim-owner"
                  name="assigneeId"
                  defaultValue={activeAssignment?.assigneeId ?? ""}
                  className={CONTROL}
                >
                  <option value="">Unassigned</option>
                  {assignable.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName}
                      {staff.id === principal.id ? " (you)" : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-1">
                  <SubmitButton pendingLabel="Saving…" variant="quiet">
                    Update owner
                  </SubmitButton>
                </div>
              </form>
            )}
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
                      {describeAuditEvent(event.action, event.metadata, staffNames)}
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
