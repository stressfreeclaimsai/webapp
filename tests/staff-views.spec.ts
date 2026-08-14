import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("[STAFF-1] the local staff queue shows operational facts and filters without mobile overflow", async ({
  page,
}) => {
  await page.goto("/staff");
  await page.waitForURL("**/staff/claims");

  await expect(page.getByRole("heading", { name: "Claims" })).toBeVisible();
  await expect(page.getByText("Staff workspace · local development")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open SFC-DEMO01 for Martin Kaczmarek" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SFC-DEMO02 for Sandra Ortiz" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SFC-DEMO03 for Jamie Chen" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Search claims" }).fill("Sandra");
  await page.getByRole("combobox", { name: "Status" }).selectOption("reviewing");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL(/q=Sandra.*status=reviewing|status=reviewing.*q=Sandra/);

  await expect(page.getByRole("link", { name: "Open SFC-DEMO02 for Sandra Ortiz" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open SFC-DEMO01 for Martin Kaczmarek" }),
  ).toHaveCount(0);
  await expect(page.getByText(/Showing 1 of \d+/)).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/staff/claims");
  await expect(page.getByRole("heading", { name: "Claims" })).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows, "staff queue must not overflow a mobile viewport").toBe(false);

  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto("/staff/claims");
  const landscapeOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(landscapeOverflows, "staff queue must not overflow in phone landscape").toBe(false);
});

test("[STAFF-2] claim detail shows the immutable snapshot and records a PII-free access event", async ({
  page,
}) => {
  const claim = await prisma.claim.findUniqueOrThrow({
    where: { referenceCode: "SFC-DEMO01" },
  });

  await page.goto("/staff/claims/SFC-DEMO01");
  await expect(page.getByRole("heading", { name: "Martin Kaczmarek" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Homeowner", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Loss and policy", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Internal notes", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ownership", exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic seed note for the local staff workflow.")).toBeVisible();
  await expect(page.getByText("Citizens Property")).toBeVisible();
  await expect(page.getByRole("link", { name: "← Back to claims" })).toBeVisible();

  const event = await prisma.auditEvent.findFirstOrThrow({
    where: {
      claimId: claim.id,
      action: "claim.viewed",
      actor: { externalSubject: "dev:staff:pilot-owner" },
    },
    orderBy: { createdAt: "desc" },
  });
  expect(event.actorType).toBe("staff");
  expect(event.metadata).toEqual({ surface: "staff_claim_detail" });

  const metadata = JSON.stringify(event.metadata);
  expect(metadata).not.toContain(claim.claimantName);
  expect(metadata).not.toContain(claim.email);
  expect(metadata).not.toContain(claim.propertyAddress);
});
