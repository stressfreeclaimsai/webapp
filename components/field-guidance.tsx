import type { FieldIssue } from "@/lib/claim-facts";

/**
 * Inline plausibility guidance (B14/B15) — the never-trap answer to a value
 * that doesn't add up: the step re-renders with the typed input kept and this
 * note beside it. Plain and directional, never an error screen (AC-8). One
 * copy source for both /gaps and /review.
 */
export const ISSUE_GUIDANCE: Record<FieldIssue, string> = {
  dateFuture: "That date is in the future — the storm date should be today or earlier.",
  dateTooOld:
    "That date is more than two years back — double-check the year on the storm date.",
  emailShape: "That doesn’t look like an email — check for a typo?",
};

export function FieldGuidance({ issue }: { issue: FieldIssue | undefined }) {
  if (!issue) return null;
  return (
    <p role="status" className="rounded-card bg-accent-soft px-3.5 py-2.5 text-sm leading-relaxed">
      {ISSUE_GUIDANCE[issue]}
    </p>
  );
}
