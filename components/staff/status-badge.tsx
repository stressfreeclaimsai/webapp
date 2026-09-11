import { CLAIM_STATUS_LABELS, CLAIM_STATUSES } from "@/lib/production-domain";

const STATUS_STYLES: Record<(typeof CLAIM_STATUSES)[number], string> = {
  new: "border-accent/30 bg-accent-soft text-warn",
  reviewing: "border-border-strong bg-surface-deep text-ink-display",
  contacted: "border-border bg-surface-2 text-ink",
  qualified: "border-ink-display/20 bg-ink-display/10 text-ink-display",
  closed: "border-border bg-surface-raised text-muted",
  duplicate: "border-border-strong bg-surface-deep text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  const known = (CLAIM_STATUSES as readonly string[]).includes(status);
  const key = known ? (status as (typeof CLAIM_STATUSES)[number]) : null;
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-pill border px-2.5 py-1 text-xs font-semibold ${key ? STATUS_STYLES[key] : "border-border bg-surface-2 text-muted"}`}
    >
      {key ? CLAIM_STATUS_LABELS[key] : status}
    </span>
  );
}
