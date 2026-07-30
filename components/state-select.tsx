import { US_STATES, type StateCode } from "@/lib/claim-facts";

/**
 * State of loss (B16): a fixed 50-state + DC select — never free text, so the
 * value is enum-valid by construction in normal use (the server re-checks
 * anyway). Capture only: no licensing/eligibility logic belongs here or
 * anywhere downstream of it (open-decisions.md).
 */
export function StateSelect({
  name,
  selected,
  autoFocus,
  id,
  ariaLabel,
}: {
  name: string;
  selected: StateCode | null;
  autoFocus?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      aria-label={ariaLabel}
      required
      defaultValue={selected ?? ""}
      autoFocus={autoFocus}
      className="min-h-12 w-full rounded-control border border-border-strong bg-surface-raised px-4 py-3 leading-relaxed shadow-sm transition-[border-color,box-shadow] duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft"
    >
      <option value="" disabled>
        Choose a state…
      </option>
      {US_STATES.map((state) => (
        <option key={state.code} value={state.code}>
          {state.name}
        </option>
      ))}
    </select>
  );
}
