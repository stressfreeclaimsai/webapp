"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  extractClaimFacts,
  ITEMS_DAMAGED,
  REQUIRED_FIELDS,
  type ItemDamaged,
  type RequiredField,
} from "@/lib/claim-facts";
import {
  loadDraft,
  saveDraft,
  submitClaim,
  IncompleteDraftError,
  type DraftPatch,
} from "@/lib/claims";
import { SESSION_COOKIE, readSessionKey } from "@/lib/session";

/**
 * The route-facing server actions (WP-2/3/4/5). All validation lives in the
 * shared contracts (lib/claims.ts) — these actions only move the person
 * forward. Per the never-trap contract (AC-8) there is no error screen
 * anywhere in the flow: bad or missing input simply routes back to the step
 * that asks plainly.
 */

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
 * utterance mints a fresh demo-session key, so "start another claim" is just
 * coming back to the front door.
 */
export async function startClaim(formData: FormData): Promise<void> {
  const utterance = String(formData.get("utterance") ?? "");
  const sessionKey = randomUUID();

  // A failed or empty parse is a valid state (AC-8): the draft is simply
  // emptier and /gaps asks for everything, plainly.
  const facts = extractClaimFacts(utterance);
  await saveDraft(sessionKey, facts);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionKey, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/gaps");
}

/** WP-3: save one answered gap, then let /gaps re-derive what's still needed. */
export async function answerGap(formData: FormData): Promise<void> {
  const sessionKey = await readSessionKey();
  if (!sessionKey || !(await loadDraft(sessionKey))) redirect("/");

  const field = String(formData.get("field") ?? "") as RequiredField;
  if ((REQUIRED_FIELDS as readonly string[]).includes(field)) {
    const patch = patchFor(field, formData);
    if (Object.keys(patch).length > 0) await saveDraft(sessionKey!, patch);
  }
  redirect("/gaps");
}

/**
 * WP-3: the one optional-extras step. Policy number and deductible are
 * captured if offered, and NEVER block — "skip" and "continue" both move
 * straight on to review (AC-3).
 */
export async function saveOptionals(formData: FormData): Promise<void> {
  const sessionKey = await readSessionKey();
  if (!sessionKey || !(await loadDraft(sessionKey))) redirect("/");

  const patch: DraftPatch = { optionalsOffered: true };
  if (String(formData.get("intent") ?? "") !== "skip") {
    const policyNumber = String(formData.get("policyNumber") ?? "").trim();
    const deductible = String(formData.get("deductible") ?? "").trim();
    patch.policyNumber = policyNumber || null;
    patch.deductible = deductible || null;
  }
  await saveDraft(sessionKey!, patch);
  redirect("/review");
}

/**
 * WP-4 → WP-5: persist any corrections made on review, then submit.
 * `submitClaim` re-validates completeness server-side (decision A3); if
 * anything required is somehow missing, the flow falls back to gap-filling
 * instead of dead-ending (AC-8).
 */
export async function confirmAndSubmit(formData: FormData): Promise<void> {
  const sessionKey = await readSessionKey();
  if (!sessionKey || !(await loadDraft(sessionKey))) redirect("/");

  const text = (name: string) => String(formData.get(name) ?? "").trim() || null;
  await saveDraft(sessionKey!, {
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

  try {
    await submitClaim(sessionKey!);
  } catch (error) {
    if (error instanceof IncompleteDraftError) redirect("/gaps");
    throw error;
  }
  redirect("/done");
}
