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
}: {
  name: string;
  selected: StateCode | null;
  autoFocus?: boolean;
}) {
  return (
    <select
      name={name}
      required
      defaultValue={selected ?? ""}
      autoFocus={autoFocus}
      className="w-full rounded-card border border-border bg-surface-raised p-3.5 leading-relaxed shadow-sm"
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
