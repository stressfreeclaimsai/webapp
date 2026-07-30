import { redirect } from "next/navigation";
import { confirmAndSubmit } from "@/app/actions";
import { FieldGuidance } from "@/components/field-guidance";
import { ItemsCheckboxes } from "@/components/items-checkboxes";
import { StateSelect } from "@/components/state-select";
import { draftFromCookieValue, draftIssues, draftMissing } from "@/lib/claims";
import { readDraftCookie } from "@/lib/session";
import { runtimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

/**
 * WP-4 — Review & correct: the safety net that lets the parse be imperfect
 * (AC-5). Everything captured is shown and editable in place; one clear way
 * to confirm. Submitting persists any corrections, then files the demo claim.
 * If a value fails plausibility (B14/B15) the submit routes back here — the
 * typed input is kept (it lives in the draft) and guidance renders inline.
 */

const inputClass =
  "min-h-12 w-full rounded-control border border-border-strong bg-surface-raised px-4 py-3 leading-relaxed shadow-sm transition-[border-color,box-shadow] duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft";

function Field({
  label,
  optional,
  htmlFor,
  children,
}: {
  label: string;
  optional?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const labelContent = (
    <>
      {label} {optional && <span className="font-normal text-muted">(optional)</span>}
    </>
  );
  return (
    <div className="grid gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="font-medium">{labelContent}</label>
      ) : (
        <span className="font-medium">{labelContent}</span>
      )}
      {children}
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-card border border-border bg-surface-2 p-5 shadow-sm sm:p-6">
      <h2 className="border-b border-border pb-3 font-display text-xl font-semibold text-ink-display">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function Review({
  searchParams,
}: {
  searchParams: Promise<{ consent?: string }>;
}) {
  const config = runtimeConfig();
  const query = await searchParams;
  const draft = draftFromCookieValue(await readDraftCookie());
  if (!draft) redirect("/");
  if (draft.submittedClaimId) redirect("/done");
  if (draftMissing(draft).length > 0) redirect("/gaps");

  const issues = draftIssues(draft);
  const issueFor = (field: string) => issues.find((i) => i.field === field)?.issue;

  return (
    <section className="pt-2 sm:pt-6">
      <h1 className="text-balance font-display text-display">Here&rsquo;s what we have.</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Look it over and fix anything that&rsquo;s off — then we&rsquo;ll get started.
      </p>

      <form action={confirmAndSubmit} className="mt-7 grid gap-5">
        <ReviewSection title="About you">
        <Field label="Your name" htmlFor="fullName">
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={draft.fullName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={draft.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={draft.email ?? ""}
            className={inputClass}
          />
          <FieldGuidance issue={issueFor("email")} />
        </Field>
        </ReviewSection>

        <ReviewSection title="Loss details">
        <Field label="Property address" htmlFor="propertyAddress">
          <input
            id="propertyAddress"
            name="propertyAddress"
            type="text"
            required
            defaultValue={draft.propertyAddress ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="State the property is in" htmlFor="stateOfLoss">
          <StateSelect id="stateOfLoss" name="stateOfLoss" selected={draft.stateOfLoss} />
        </Field>
        <Field label="Date of loss" htmlFor="dateOfLoss">
          <input
            id="dateOfLoss"
            name="dateOfLoss"
            type="date"
            required
            defaultValue={draft.dateOfLoss?.toISOString().slice(0, 10) ?? ""}
            className={inputClass}
          />
          <FieldGuidance issue={issueFor("dateOfLoss")} />
        </Field>
        <Field label="Insurance company" htmlFor="insurerName">
          <input
            id="insurerName"
            name="insurerName"
            type="text"
            required
            defaultValue={draft.insurerName ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="What was damaged">
          <ItemsCheckboxes selected={draft.itemsDamaged} />
        </Field>
        <Field label="Damage, in your own words" optional htmlFor="damageDescription">
          {/* Forgiving surface (B21): free text, never blocks, no validation —
              the human-correction net for the LLM-fillable field (B20). */}
          <textarea
            id="damageDescription"
            name="damageDescription"
            rows={3}
            defaultValue={draft.damageDescription ?? ""}
            className={`${inputClass} resize-y`}
          />
        </Field>
        </ReviewSection>

        <ReviewSection title="Policy details">
        <Field label="Policy number" optional htmlFor="policyNumber">
          <input
            id="policyNumber"
            name="policyNumber"
            type="text"
            defaultValue={draft.policyNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Deductible" optional htmlFor="deductible">
          <input
            id="deductible"
            name="deductible"
            type="text"
            defaultValue={draft.deductible ?? ""}
            className={inputClass}
          />
        </Field>
        </ReviewSection>

        {config.isPilot && (
          <div className="rounded-card border border-border bg-surface-2 p-4">
            <label className="flex items-start gap-3 leading-relaxed">
              <input
                type="checkbox"
                name="pilotConsent"
                value="accepted"
                required
                className="mt-1 size-4 shrink-0"
              />
              <span>
                I confirm this information is accurate and agree that the team may contact me about
                this loss report. Submitting this form does not file an insurance claim or create a
                representation or repair agreement.
              </span>
            </label>
            {query.consent === "required" && (
              <p className="mt-2 text-sm font-medium text-warn" role="alert">
                Please confirm before submitting.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 min-h-12 w-full rounded-pill bg-accent-btn px-7 py-3 font-semibold text-accent-ink shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-accent-btn-hover hover:shadow-md"
        >
          Everything&rsquo;s right — start my claim
        </button>
      </form>
    </section>
  );
}
