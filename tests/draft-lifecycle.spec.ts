import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const prisma = new PrismaClient();
const DRAFT_COOKIE = "sfc-demo-draft";
const LOCAL_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://stressfreeclaim:stressfreeclaim@localhost:54329/stressfreeclaim?schema=test";

test.afterAll(async () => {
  await prisma.$disconnect();
});

const completeUtterance =
  "My name is Ada Rivera. I live at 12 Palm Ave, Naples, FL. The hurricane hit yesterday. " +
  "I'm insured by State Farm. The roof got wrecked. My phone is (239) 555-0188 and my email is ada.lifecycle@example.com.";

async function startWithUtterance(page: Page, utterance = completeUtterance) {
  await page.goto("/");
  await page.getByPlaceholder(/for example/i).fill(utterance);
  await page.getByRole("button", { name: "Start my claim" }).click();
  await page.waitForURL("**/gaps");
}

async function draftToken(context: BrowserContext): Promise<string> {
  const cookie = (await context.cookies()).find((candidate) => candidate.name === DRAFT_COOKIE);
  expect(cookie, "an opaque continuation cookie should be set").toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return cookie!.value;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function moveToReview(page: Page) {
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
}

test("[DRAFT-1] the cookie is opaque while claim facts persist in PostgreSQL", async ({
  page,
  context,
}) => {
  await startWithUtterance(page);
  const token = await draftToken(context);

  expect(token).not.toContain("Ada");
  expect(token).not.toContain("lifecycle");

  const draft = await prisma.claimDraft.findUnique({
    where: { continuationTokenHash: tokenHash(token) },
  });
  expect(draft).not.toBeNull();
  expect(draft?.claimantName).toBe("Ada Rivera");
  expect(draft?.email).toBe("ada.lifecycle@example.com");
  expect(draft?.status).toBe("in_progress");
  expect(draft?.expiresAt.getTime()).toBeGreaterThan(Date.now());

  await page.reload();
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
});

test("[DRAFT-2] an expired draft recovers calmly without exposing its facts", async ({
  page,
  context,
}) => {
  await startWithUtterance(page);
  const token = await draftToken(context);
  const hash = tokenHash(token);

  await prisma.claimDraft.update({
    where: { continuationTokenHash: hash },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });

  await page.goto("/gaps");
  await page.waitForURL("**/?draft=expired");
  await expect(page.getByText(/expired to protect your information/i)).toBeVisible();

  const expired = await prisma.claimDraft.findUniqueOrThrow({
    where: { continuationTokenHash: hash },
  });
  expect(expired.status).toBe("expired");
  expect(await page.locator("body").innerText()).not.toContain("Ada Rivera");
});

test("[DRAFT-3] simultaneous confirmations create one claim and one audit event", async ({
  page,
  context,
}) => {
  await startWithUtterance(page);
  await moveToReview(page);
  const token = await draftToken(context);
  const hash = tokenHash(token);
  const draft = await prisma.claimDraft.findUniqueOrThrow({
    where: { continuationTokenHash: hash },
  });

  const secondPage = await context.newPage();
  await secondPage.goto("/review");
  await expect(secondPage.getByRole("heading", { name: /here.s what we have/i })).toBeVisible();

  await Promise.all([
    page.getByRole("button", { name: /everything.s right/i }).click(),
    secondPage.getByRole("button", { name: /everything.s right/i }).click(),
  ]);
  await Promise.all([page.waitForURL("**/done"), secondPage.waitForURL("**/done")]);

  const persistedDraft = await prisma.claimDraft.findUniqueOrThrow({ where: { id: draft.id } });
  expect(persistedDraft.status).toBe("submitted");
  expect(persistedDraft.submittedClaimId).not.toBeNull();
  expect(
    await prisma.claim.count({ where: { submissionKey: `draft:${draft.id}` } }),
  ).toBe(1);
  expect(
    await prisma.auditEvent.count({
      where: { claimId: persistedDraft.submittedClaimId!, action: "claim.submitted" },
    }),
  ).toBe(1);
});

test("[DRAFT-4] cleanup expires active drafts and removes old terminal drafts", async () => {
  const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const expiring = await prisma.claimDraft.create({
    data: {
      continuationTokenHash: createHash("sha256").update("cleanup-expiring").digest("hex"),
      status: "in_progress",
      expiresAt: old,
      updatedAt: old,
    },
  });
  const removable = await prisma.claimDraft.create({
    data: {
      continuationTokenHash: createHash("sha256").update("cleanup-removable").digest("hex"),
      status: "expired",
      expiresAt: old,
      updatedAt: old,
    },
  });

  execFileSync("npx", ["tsx", "scripts/cleanup-expired-drafts.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: LOCAL_TEST_DATABASE_URL,
      DIRECT_URL: LOCAL_TEST_DATABASE_URL,
    },
  });

  expect((await prisma.claimDraft.findUnique({ where: { id: expiring.id } }))?.status).toBe(
    "expired",
  );
  expect(await prisma.claimDraft.findUnique({ where: { id: removable.id } })).toBeNull();
});
