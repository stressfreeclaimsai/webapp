"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit control for staff forms. Disables itself while the server action is
 * in flight so a double click cannot write the same change twice
 * (design-system checklist: loading controls prevent duplicate submission).
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "quiet";
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-accent-btn text-accent-ink shadow-sm hover:bg-accent-btn-hover"
      : "border border-border-strong text-warn hover:bg-accent-soft";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`min-h-12 rounded-pill px-5 py-3 font-semibold transition-colors duration-200 disabled:cursor-progress disabled:opacity-70 ${styles}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
