import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * B27 — staff mutations. Status, owner, and internal notes are changed from
 * the claim detail page by the seeded local admin; every write lands with a
 * paired audit event whose metadata holds identifiers only. These use
 * SFC-DEMO03 (seeded new + unassigned) so the DB-1 / STAFF-2 seed assertions
 * on SFC-DEMO01 stay untouched.
 */
const prisma = new PrismaClient();
const REFERENCE = "SFC-DEMO03";
const ACTOR = { externalSubject: "dev:staff:pilot-owner" };

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("[STAFF-6] a status change is saved once, shown, and audited without claim facts", async ({
  page,
}) => {
  const claim = await prisma.claim.findUniqueOrThrow({ where: { referenceCode: REFERENCE } });
  expect(claim.status).toBe("new");

  await page.goto(`/staff/claims/${REFERENCE}`);
  await page.getByLabel("Change status").selectOption("contacted");
  await page.getByRole("button", { name: "Update status" }).click();
  await page.waitForURL(/outcome=status/);

  await expect(page.getByRole("status", { name: "Update result" })).toContainText("Status updated.");
  await expect(page.getByRole("heading", { name: "Jamie Chen" })).toBeVisible();
  await expect(page.getByText("Status changed to Contacted")).toBeVisible();

  const updated = await prisma.claim.findUniqueOrThrow({ where: { id: claim.id } });
  expect(updated.status).toBe("contacted");
  expect(updated.closedAt).toBeNull();

  const event = await prisma.auditEvent.findFirstOrThrow({
    where: { claimId: claim.id, action: "claim.status_changed", actor: ACTOR },
    orderBy: { createdAt: "desc" },
  });
  expect(event.actorType).toBe("staff");
  expect(event.metadata).toEqual({ from: "new", to: "contacted" });
  const metadata = JSON.stringify(event.metadata);
  expect(metadata).not.toContain(claim.claimantName);
  expect(metadata).not.toContain(claim.email);

  // Re-submitting the same status is a no-op with a plain explanation.
  const before = await prisma.auditEvent.count({
    where: { claimId: claim.id, action: "claim.status_changed" },
  });
  await page.getByLabel("Change status").selectOption("contacted");
  await page.getByRole("button", { name: "Update status" }).click();
  await page.waitForURL(/outcome=same_status/);
  await expect(page.getByRole("status", { name: "Update result" })).toContainText("already has that status");
  const after = await prisma.auditEvent.count({
    where: { claimId: claim.id, action: "claim.status_changed" },
  });
  expect(after).toBe(before);

  // A terminal status stamps closedAt; reopening clears it.
  // The URL already carries `outcome=status`, so wait on the history row
  // each change writes rather than on the address bar.
  await page.getByLabel("Change status").selectOption("closed");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status changed to Closed")).toBeVisible();
  const closed = await prisma.claim.findUniqueOrThrow({ where: { id: claim.id } });
  expect(closed.status).toBe("closed");
  expect(closed.closedAt).not.toBeNull();

  await page.getByLabel("Change status").selectOption("reviewing");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status changed to Reviewing")).toBeVisible();
  const reopened = await prisma.claim.findUniqueOrThrow({ where: { id: claim.id } });
  expect(reopened.status).toBe("reviewing");
  expect(reopened.closedAt).toBeNull();
});

test("[STAFF-7] assigning and clearing an owner keeps one open assignment and audits both", async ({
  page,
}) => {
  const claim = await prisma.claim.findUniqueOrThrow({ where: { referenceCode: REFERENCE } });
  const owner = await prisma.staffUser.findUniqueOrThrow({ where: ACTOR });
  const reviewer = await prisma.staffUser.findUniqueOrThrow({
    where: { externalSubject: "dev:staff:reviewer" },
  });
  expect(reviewer.role).toBe("standard");

  await page.goto(`/staff/claims/${REFERENCE}`);
  await expect(page.getByText("Unassigned", { exact: true }).first()).toBeVisible();

  await page.getByLabel("Change owner").selectOption({ label: "Priya Natarajan" });
  await page.getByRole("button", { name: "Update owner" }).click();
  await page.waitForURL(/outcome=assigned/);
  await expect(page.getByRole("status", { name: "Update result" })).toContainText("Owner updated.");
  await expect(page.getByText("Owner changed to Priya Natarajan")).toBeVisible();

  const open = await prisma.claimAssignment.findMany({
    where: { claimId: claim.id, unassignedAt: null },
  });
  expect(open).toHaveLength(1);
  expect(open[0].assigneeId).toBe(reviewer.id);
  expect(open[0].assignedById).toBe(owner.id);

  const assigned = await prisma.auditEvent.findFirstOrThrow({
    where: { claimId: claim.id, action: "claim.assigned", actor: ACTOR },
    orderBy: { createdAt: "desc" },
  });
  expect(assigned.metadata).toEqual({ previousAssigneeId: null, assigneeId: reviewer.id });

  // The queue reflects the new owner.
  await page.goto("/staff/claims");
  const row = page.getByRole("link", { name: `Open ${REFERENCE} for Jamie Chen` });
  await expect(row).toContainText("Priya Natarajan");

  // Clearing the owner closes the open row rather than deleting history.
  await page.goto(`/staff/claims/${REFERENCE}`);
  await page.getByLabel("Change owner").selectOption("");
  await page.getByRole("button", { name: "Update owner" }).click();
  await page.waitForURL(/outcome=unassigned/);
  await expect(page.getByRole("status", { name: "Update result" })).toContainText("Owner cleared");

  const history = await prisma.claimAssignment.findMany({ where: { claimId: claim.id } });
  expect(history).toHaveLength(1);
  expect(history[0].unassignedAt).not.toBeNull();
  const cleared = await prisma.auditEvent.findFirstOrThrow({
    where: { claimId: claim.id, action: "claim.unassigned", actor: ACTOR },
    orderBy: { createdAt: "desc" },
  });
  expect(cleared.metadata).toEqual({ previousAssigneeId: reviewer.id, assigneeId: null });
});

test("[STAFF-8] an internal note is stored, attributed, audited by id only, and never empty", async ({
  page,
}) => {
  const claim = await prisma.claim.findUniqueOrThrow({ where: { referenceCode: REFERENCE } });
  const body = "Called the homeowner; roof tarped by a neighbor. Wants a callback Thursday.";

  await page.goto(`/staff/claims/${REFERENCE}`);
  await page.getByLabel("Add a note for the team").fill(body);
  await page.getByRole("button", { name: "Add note" }).click();
  await page.waitForURL(/outcome=note/);
  await expect(page.getByRole("status", { name: "Update result" })).toContainText("Note added.");
  await expect(page.getByText(body)).toBeVisible();
  await expect(page.getByText(/Pilot Queue Owner ·/).first()).toBeVisible();

  const note = await prisma.claimNote.findFirstOrThrow({
    where: { claimId: claim.id, body },
  });
  const event = await prisma.auditEvent.findFirstOrThrow({
    where: { claimId: claim.id, action: "claim.note_added", actor: ACTOR },
    orderBy: { createdAt: "desc" },
  });
  expect(event.entityType).toBe("claim_note");
  expect(event.entityId).toBe(note.id);
  expect(event.metadata).toEqual({ noteId: note.id, length: body.length });
  expect(JSON.stringify(event.metadata)).not.toContain("tarped");

  // Server-side guard: bypass the browser's `required` and submit blank.
  const noteCount = await prisma.claimNote.count({ where: { claimId: claim.id } });
  await page.getByLabel("Add a note for the team").evaluate((el) => {
    el.removeAttribute("required");
  });
  await page.getByLabel("Add a note for the team").fill("   ");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.waitForURL(/outcome=note_empty/);
  await expect(page.getByRole("status", { name: "Update result" })).toContainText("Write the note before adding it.");
  expect(await prisma.claimNote.count({ where: { claimId: claim.id } })).toBe(noteCount);

  // The controls must not push the detail page sideways on a phone.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/staff/claims/${REFERENCE}`);
  await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows, "claim detail with controls must not overflow a mobile viewport").toBe(false);
});
