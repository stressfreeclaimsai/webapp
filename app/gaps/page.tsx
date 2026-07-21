import { redirect } from "next/navigation";
import { answerGap, saveOptionals } from "@/app/actions";
import { FieldGuidance } from "@/components/field-guidance";
import { ItemsCheckboxes } from "@/components/items-checkboxes";
import { StateSelect } from "@/components/state-select";
import { REQUIRED_FIELDS, type FieldIssue, type RequiredField } from "@/lib/claim-facts";
import {
  draftFromCookieValue,
  draftIssues,
  draftMissing,
  type ClaimDraftState,
} from "@/lib/claims";
import { readDraftCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * WP-3 — Gap-filling: render what `missingRequired()` returns plus any field
 * whose present value fails plausibility (B14/B15), one question at a time,
 * in plain language (AC-3). An implausible answer re-asks the SAME question
 * with the typed value kept and inline guidance — never-trap, no error
 * screen. Optional extras (policy number, deductible) are offered once and
 * never block.
 */

const QUESTIONS: Record<RequiredField, { title: string; help: string }> = {
  fullName: { title: "What's your name?", help: "So we know who the claim is for." },
  propertyAddress: {
    title: "Where's the damaged property?",
    help: "Street address, city, and state.",
  },
  stateOfLoss: {
    title: "Which state is the property in?",
    help: "So the claim is filed in the right place.",
  },
  dateOfLoss: { title: "When did the damage happen?", help: "Your best guess is fine." },
  insurerName: {
    title: "Who's your insurance company?",
    help: "However it reads on your policy — any version of the name works.",
  },
  itemsDamaged: { title: "What was damaged?", help: "Choose everything that applies." },
  phone: {
    title: "What's the best number to reach you?",
    help: "So we can keep you posted while we handle things.",
  },
  email: { title: "And your email?", help: "We'll send a copy of everything we do." },
};

function inputFor(field: RequiredField, draft: ClaimDraftState) {
  const base =
    "w-full rounded-card border border-border bg-surface-raised p-4 leading-relaxed shadow-sm";
  // Re-asks (an implausible value, B14/B15) keep what was typed — the draft
  // still holds it, so it comes back as the default.
  switch (field) {
    case "itemsDamaged":
      return <ItemsCheckboxes selected={draft.itemsDamaged} />;
    case "stateOfLoss":
      return <StateSelect name="value" selected={draft.stateOfLoss} autoFocus />;
    case "dateOfLoss":
      return (
        <input
          type="date"
          name="value"
          required
          max={new Date().toISOString().slice(0, 10)}
          defaultValue={draft.dateOfLoss?.toISOString().slice(0, 10) ?? ""}
          className={base}
        />
      );
    case "phone":
      return (
        <input type="tel" name="value" required autoComplete="tel" className={base} autoFocus />
      );
    case "email":
      return (
        <input
          type="email"
          name="value"
          required
          autoComplete="email"
          defaultValue={draft.email ?? ""}
          className={base}
          autoFocus
        />
      );
    default:
      return <input type="text" name="value" required className={base} autoFocus />;
  }
}

function OptionalStep({ draft }: { draft: ClaimDraftState }) {
  const base =
    "w-full rounded-card border border-border bg-surface-raised p-4 leading-relaxed shadow-sm";
  return (
    <section className="pt-2 sm:pt-6">
      <h1 className="text-balance font-display text-display">Two optional details.</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Helpful if they&rsquo;re handy — completely fine if they&rsquo;re not. We can get started
        either way.
      </p>
      <form action={saveOptionals} className="mt-7 grid gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="policyNumber" className="font-medium">
            Policy number <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="policyNumber"
            name="policyNumber"
            type="text"
            defaultValue={draft.policyNumber ?? ""}
            className={base}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="deductible" className="font-medium">
            Deductible <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="deductible"
            name="deductible"
            type="text"
            defaultValue={draft.deductible ?? ""}
            className={base}
          />
        </div>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            name="intent"
            value="save"
            className="rounded-pill bg-accent-btn px-7 py-3.5 font-semibold text-accent-ink transition-colors hover:bg-accent-btn-hover"
          >
            Continue
          </button>
          <button
            type="submit"
            name="intent"
            value="skip"
            formNoValidate
            className="rounded-pill px-7 py-3.5 font-semibold text-warn underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </form>
    </section>
  );
}

export default async function Gaps() {
  const draft = draftFromCookieValue(await readDraftCookie());
  if (!draft) redirect("/");
  if (draft.submittedClaimId) redirect("/done");

  // A field needs attention if it's missing OR present but implausible
  // (B14/B15) — the latter re-asks the same question with guidance instead of
  // letting a bad value ride silently to review.
  const missing = draftMissing(draft);
  const issues = draftIssues(draft);
  const needsAttention = REQUIRED_FIELDS.filter(
    (f) => missing.includes(f) || issues.some((i) => i.field === f),
  );
  if (needsAttention.length === 0 && draft.optionalsOffered) redirect("/review");
  if (needsAttention.length === 0) return <OptionalStep draft={draft} />;

  const field = needsAttention[0];
  const issue: FieldIssue | undefined = issues.find((i) => i.field === field)?.issue;
  const question = QUESTIONS[field];
  const firstName = draft.fullName?.trim().split(/\s+/)[0];
  const answered = REQUIRED_FIELDS.length - needsAttention.length;
  const intro =
    answered >= 3
      ? `Thanks${firstName ? `, ${firstName}` : ""} — your message covered most of it.`
      : "A few quick things — one at a time.";

  return (
    <section className="pt-2 sm:pt-6">
      <p className="text-eyebrow font-semibold uppercase text-warn">{intro}</p>
      <h1 className="mt-3 text-balance font-display text-display">{question.title}</h1>
      <p className="mt-3 leading-relaxed text-muted">{question.help}</p>
      <form action={answerGap} className="mt-7 grid gap-4">
        <input type="hidden" name="field" value={field} />
        <FieldGuidance issue={issue} />
        {inputFor(field, draft)}
        <button
          type="submit"
          className="w-full rounded-pill bg-accent-btn px-7 py-3.5 font-semibold text-accent-ink transition-colors hover:bg-accent-btn-hover sm:w-fit"
        >
          Continue
        </button>
      </form>
    </section>
  );
}
