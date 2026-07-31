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

export const STAFF_ROLES = ["reviewer", "manager", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const NOTIFICATION_KINDS = [
  "homeowner_submission_receipt",
  "staff_new_intake",
] as const;
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
