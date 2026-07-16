import { redirect } from "next/navigation";
import { confirmAndSubmit } from "@/app/actions";
import { ItemsCheckboxes } from "@/components/items-checkboxes";
import { parseItems } from "@/lib/claim-facts";
import { draftMissing, loadDraft } from "@/lib/claims";
import { readSessionKey } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * WP-4 — Review & correct: the safety net that lets the parse be imperfect
 * (AC-5). Everything captured is shown and editable in place; one clear way
 * to confirm. Submitting persists any corrections, then files the demo claim.
 */

const inputClass =
  "w-full rounded-card border border-border bg-surface-raised p-3.5 leading-relaxed shadow-sm";

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="font-medium">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </span>
      {children}
    </div>
  );
}

export default async function Review() {
  const sessionKey = await readSessionKey();
  const draft = sessionKey ? await loadDraft(sessionKey) : null;
  if (!draft) redirect("/");
  if (draft.claimId) redirect("/done");
  if (draftMissing(draft).length > 0) redirect("/gaps");

  return (
    <section className="pt-2 sm:pt-6">
      <h1 className="text-balance font-display text-display">Here&rsquo;s what we have.</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Look it over and fix anything that&rsquo;s off — then we&rsquo;ll get started.
      </p>

      <form action={confirmAndSubmit} className="mt-7 grid gap-5">
        <Field label="Your name">
          <input
            name="fullName"
            type="text"
            required
            defaultValue={draft.fullName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Property address">
          <input
            name="propertyAddress"
            type="text"
            required
            defaultValue={draft.propertyAddress ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Date of loss">
          <input
            name="dateOfLoss"
            type="date"
            required
            defaultValue={draft.dateOfLoss?.toISOString().slice(0, 10) ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Insurance company">
          <input
            name="insurerName"
            type="text"
            required
            defaultValue={draft.insurerName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="What was damaged">
          <ItemsCheckboxes selected={parseItems(draft.itemsDamaged)} />
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            type="tel"
            required
            defaultValue={draft.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            defaultValue={draft.email ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Policy number" optional>
          <input
            name="policyNumber"
            type="text"
            defaultValue={draft.policyNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Deductible" optional>
          <input
            name="deductible"
            type="text"
            defaultValue={draft.deductible ?? ""}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          className="mt-2 w-full rounded-pill bg-accent px-7 py-3.5 font-semibold text-accent-ink"
        >
          Everything&rsquo;s right — start my claim
        </button>
      </form>
    </section>
  );
}
