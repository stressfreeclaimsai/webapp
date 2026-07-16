import { redirect } from "next/navigation";
import { answerGap, saveOptionals } from "@/app/actions";
import { ItemsCheckboxes } from "@/components/items-checkboxes";
import { parseItems, REQUIRED_FIELDS, type RequiredField } from "@/lib/claim-facts";
import { draftMissing, loadDraft } from "@/lib/claims";
import { readSessionKey } from "@/lib/session";
import type { ClaimDraft } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * WP-3 — Gap-filling: render ONLY what `missingRequired()` returns, one
 * question at a time, in plain language (AC-3). After a good parse this is
 * just phone and email; after a thin one, whatever else is missing. Optional
 * extras (policy number, deductible) are offered once and never block.
 */

const QUESTIONS: Record<RequiredField, { title: string; help: string }> = {
  fullName: { title: "What's your name?", help: "So we know who the claim is for." },
  propertyAddress: {
    title: "Where's the damaged property?",
    help: "Street address, city, and state.",
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

function inputFor(field: RequiredField, draft: ClaimDraft) {
  const base =
    "w-full rounded-card border border-border bg-surface-raised p-4 leading-relaxed shadow-sm";
  switch (field) {
    case "itemsDamaged":
      return <ItemsCheckboxes selected={parseItems(draft.itemsDamaged)} />;
    case "dateOfLoss":
      return (
        <input
          type="date"
          name="value"
          required
          max={new Date().toISOString().slice(0, 10)}
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
          className={base}
          autoFocus
        />
      );
    default:
      return <input type="text" name="value" required className={base} autoFocus />;
  }
}

function OptionalStep({ draft }: { draft: ClaimDraft }) {
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
            className="rounded-pill bg-accent px-7 py-3.5 font-semibold text-accent-ink"
          >
            Continue
          </button>
          <button
            type="submit"
            name="intent"
            value="skip"
            formNoValidate
            className="rounded-pill px-7 py-3.5 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </form>
    </section>
  );
}

export default async function Gaps() {
  const sessionKey = await readSessionKey();
  const draft = sessionKey ? await loadDraft(sessionKey) : null;
  if (!draft) redirect("/");
  if (draft.claimId) redirect("/done");

  const missing = draftMissing(draft);
  if (missing.length === 0 && draft.optionalsOffered) redirect("/review");
  if (missing.length === 0) return <OptionalStep draft={draft} />;

  const field = missing[0];
  const question = QUESTIONS[field];
  const firstName = draft.fullName?.trim().split(/\s+/)[0];
  const answered = REQUIRED_FIELDS.length - missing.length;
  const intro =
    answered >= 3
      ? `Thanks${firstName ? `, ${firstName}` : ""} — your message covered most of it.`
      : "A few quick things — one at a time.";

  return (
    <section className="pt-2 sm:pt-6">
      <p className="text-eyebrow font-semibold uppercase text-accent">{intro}</p>
      <h1 className="mt-3 text-balance font-display text-display">{question.title}</h1>
      <p className="mt-3 leading-relaxed text-muted">{question.help}</p>
      <form action={answerGap} className="mt-7 grid gap-4">
        <input type="hidden" name="field" value={field} />
        {inputFor(field, draft)}
        <button
          type="submit"
          className="w-full rounded-pill bg-accent px-7 py-3.5 font-semibold text-accent-ink sm:w-fit"
        >
          Continue
        </button>
      </form>
    </section>
  );
}
