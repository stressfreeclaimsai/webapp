/**
 * Application-owned vocabularies for production data.
 *
 * These intentionally remain strings in PostgreSQL. Additions discovered in
 * user testing therefore require a reviewed code change and tests, but not a
 * database enum migration. Removing or renaming a value still requires a data
 * migration because historical records must remain intelligible.
 */

export const CURRENT_INTAKE_VERSION = 1;

export const CLAIM_DRAFT_STATUSES = ["in_progress", "submitted", "expired", "abandoned"] as const;
export type ClaimDraftStatus = (typeof CLAIM_DRAFT_STATUSES)[number];

export const CLAIM_STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "qualified",
  "closed",
  "duplicate",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  duplicate: "Duplicate",
};

/** Statuses that end active work on a claim and stamp `closedAt`. */
export const TERMINAL_CLAIM_STATUSES: readonly ClaimStatus[] = ["closed", "duplicate"];

export const STAFF_ROLES = ["standard", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Staff capability matrix (decision B27). This is the working default until
 * the business owner approves the final standard/admin split; it is the ONLY
 * place a page or action may consult to decide what a role can do. Every
 * mutation below is audited whichever role performs it.
 */
export const STAFF_CAPABILITIES = [
  "claim.change_status",
  "claim.assign",
  "claim.add_note",
  "claim.export",
  "staff.manage",
] as const;
export type StaffCapability = (typeof STAFF_CAPABILITIES)[number];

const STANDARD_CAPABILITIES: readonly StaffCapability[] = [
  "claim.change_status",
  "claim.assign",
  "claim.add_note",
];

export function staffCan(role: StaffRole, capability: StaffCapability): boolean {
  if (role === "admin") return true;
  return STANDARD_CAPABILITIES.includes(capability);
}

/** Upper bound for one internal note, in characters. */
export const CLAIM_NOTE_MAX_LENGTH = 4000;

export const NOTIFICATION_KINDS = ["homeowner_submission_receipt", "staff_new_intake"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_STATUSES = [
  "pending",
  "sending",
  "sent",
  "delivered",
  "failed",
  "previewed",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
