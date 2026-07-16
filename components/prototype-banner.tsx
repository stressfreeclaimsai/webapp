/**
 * The constitution §7 affordance: every prototype must visibly declare that it
 * is not a live product holding real data. Rendered once in the root layout.
 */
export function PrototypeBanner() {
  return (
    <div
      role="note"
      className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-eyebrow font-medium uppercase text-accent-ink"
    >
      <span aria-hidden="true">●</span>
      <span>Prototype — not for real data</span>
    </div>
  );
}
