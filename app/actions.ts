"use server";

import { redirect } from "next/navigation";
import {
  extractClaimFacts,
  ITEMS_DAMAGED,
  REQUIRED_FIELDS,
  type ItemDamaged,
  type RequiredField,
} from "@/lib/claim-facts";
import {
  applyPatch,
  draftFromCookieValue,
  draftToCookieValue,
  emptyDraft,
  submitClaim,
  IncompleteDraftError,
  type ClaimDraftState,
  type DraftPatch,
} from "@/lib/claims";
import { readDraftCookie, writeDraftCookie } from "@/lib/session";

/**
 * The route-facing server actions (WP-2/3/4/5). All domain logic lives in the
 * shared contracts (lib/claims.ts) — these actions only move the person
 * forward. Per the never-trap contract (AC-8) there is no error screen
 * anywhere in the flow: bad or missing input simply routes back to the step
 * that asks plainly.
 */

async function loadDraft(): Promise<ClaimDraftState | null> {
  return draftFromCookieValue(await readDraftCookie());
}

async function saveDraft(draft: ClaimDraftState): Promise<void> {
  await writeDraftCookie(draftToCookieValue(draft));
}

function parseDateInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  // UTC noon so the calendar date never shifts across timezones.
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseItemsField(formData: FormData): ItemDamaged[] {
  const chosen = formData.getAll("items").map((v) => String(v).toLowerCase());
  return ITEMS_DAMAGED.filter((item) => chosen.includes(item));
}

/** Fold one answered field into a draft patch. Unknown fields are ignored. */
function patchFor(field: RequiredField, formData: FormData): DraftPatch {
  switch (field) {
    case "itemsDamaged":
      return { itemsDamaged: parseItemsField(formData) };
    case "dateOfLoss": {
      const date = parseDateInput(String(formData.get("value") ?? ""));
      return date ? { dateOfLoss: date } : {};
    }
    default: {
      const value = String(formData.get("value") ?? "").trim();
      return value ? { [field]: value } : {};
    }
  }
}

/**
 * WP-2: one utterance in, a draft out. Extraction is deterministic and local
 * (decision A2) and the raw utterance is never stored (decision A5). Each new
 * utterance starts a fresh draft, so "start another claim" is just coming
 * back to the front door.
 */
export async function startClaim(formData: FormData): Promise<void> {
  const utterance = String(formData.get("utterance") ?? "");

  // A failed or empty parse is a valid state (AC-8): the draft is simply
  // emptier and /gaps asks for everything, plainly.
  const facts = extractClaimFacts(utterance);
  await saveDraft(applyPatch(emptyDraft(), facts));
  redirect("/gaps");
}

/** WP-3: save one answered gap, then let /gaps re-derive what's still needed. */
export async function answerGap(formData: FormData): Promise<void> {
  const draft = await loadDraft();
  if (!draft) redirect("/");
  if (draft!.submittedClaimId) redirect("/done");

  const field = String(formData.get("field") ?? "") as RequiredField;
  if ((REQUIRED_FIELDS as readonly string[]).includes(field)) {
    await saveDraft(applyPatch(draft!, patchFor(field, formData)));
  }
  redirect("/gaps");
}

/**
 * WP-3: the one optional-extras step. Policy number and deductible are
 * captured if offered, and NEVER block — "skip" and "continue" both move
 * straight on to review (AC-3).
 */
export async function saveOptionals(formData: FormData): Promise<void> {
  const draft = await loadDraft();
  if (!draft) redirect("/");
  if (draft!.submittedClaimId) redirect("/done");

  const patch: DraftPatch = { optionalsOffered: true };
  if (String(formData.get("intent") ?? "") !== "skip") {
    patch.policyNumber = String(formData.get("policyNumber") ?? "").trim() || null;
    patch.deductible = String(formData.get("deductible") ?? "").trim() || null;
  }
  await saveDraft(applyPatch(draft!, patch));
  redirect("/review");
}

/**
 * WP-4 → WP-5: persist any corrections made on review, then submit.
 * `submitClaim` re-validates completeness server-side (decision A3); if
 * anything required is somehow missing, the flow falls back to gap-filling
 * instead of dead-ending (AC-8). The submitted snapshot is frozen into the
 * cookie so /done renders it regardless of which instance answers (B13).
 */
export async function confirmAndSubmit(formData: FormData): Promise<void> {
  const draft = await loadDraft();
  if (!draft) redirect("/");
  if (draft!.submittedClaimId) redirect("/done");

  const text = (name: string) => String(formData.get(name) ?? "").trim() || null;
  const corrected = applyPatch(draft!, {
    fullName: text("fullName"),
    propertyAddress: text("propertyAddress"),
    dateOfLoss: parseDateInput(String(formData.get("dateOfLoss") ?? "")),
    insurerName: text("insurerName"),
    itemsDamaged: parseItemsField(formData),
    phone: text("phone"),
    email: text("email"),
    policyNumber: text("policyNumber"),
    deductible: text("deductible"),
  });
  await saveDraft(corrected);

  try {
    const claim = await submitClaim(corrected);
    await saveDraft({ ...corrected, submittedClaimId: claim.id });
  } catch (error) {
    if (error instanceof IncompleteDraftError) redirect("/gaps");
    throw error;
  }
  redirect("/done");
}
