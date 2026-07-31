import { PrismaClient } from "@prisma/client";
import { test as base, expect, type Page } from "@playwright/test";

/**
 * B21 — damageDescription is editable on /review and persists to Claim.notes
 * through the same confirm-and-submit path as every other correction. The
 * bar is "editable and persists", so these tests read the submitted PostgreSQL
 * snapshot directly through the generated Prisma client.
 *
 * Same inline console/network guard as the other specs.
 */
const test = base.extend<{ failOnError: void }>({
  failOnError: [
    async ({ page }, use) => {
      const problems: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") problems.push(`console.error → ${msg.text()}`);
      });
      page.on("pageerror", (err) => {
        problems.push(`pageerror → ${err.message}`);
      });
      page.on("requestfailed", (req) => {
        const errorText = req.failure()?.errorText ?? "";
        if (errorText.includes("ERR_ABORTED")) return; // ignore intentional aborts
        problems.push(`requestfailed → ${req.method()} ${req.url()} (${errorText})`);
      });

      await use();

      if (problems.length > 0) {
        throw new Error(`Console/network errors on primary flow:\n  - ${problems.join("\n  - ")}`);
      }
    },
    { auto: true },
  ],
});

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Homeowner-confirmed damage description on the newest submitted claim. */
async function latestDamageDescription(): Promise<string> {
  const claim = await prisma.claim.findFirst({ orderBy: { createdAt: "desc" } });
  if (!claim) throw new Error("Expected a submitted claim.");
  return claim.damageDescription;
}

async function startWithUtterance(page: Page, utterance: string) {
  await page.goto("/");
  await page.getByPlaceholder(/for example/i).fill(utterance);
  await page.getByRole("button", { name: "Start my claim" }).click();
  await page.waitForURL("**/gaps");
}

/** A complete utterance (only the optional step between start and review). */
function completeUtterance(phone: string, email: string): string {
  return (
    "My name is Jane Smith. I live at 12 Palm Ave, Naples, FL. The hurricane hit yesterday. " +
    `I'm insured by State Farm. The roof got wrecked. My phone is ${phone} and my email is ${email}.`
  );
}

async function skipOptionalsToReview(page: Page) {
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
}

test("[B21] damage description renders pre-filled and the EDITED text persists to the claim snapshot", async ({
  page,
}) => {
  await startWithUtterance(page, completeUtterance("(239) 555-0151", "b21a.demo@example.com"));
  await skipOptionalsToReview(page);

  // Pre-filled with the extracted description (the item-naming sentence).
  const field = page.locator('textarea[name="damageDescription"]');
  await expect(field).toHaveValue("The roof got wrecked.");

  // Correct it, confirm, and assert the record carries the CORRECTED text.
  const edited = "Roof torn open over the kitchen and rain got into two bedrooms.";
  await field.fill(edited);
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");

  expect(await latestDamageDescription()).toBe(edited);
});

test("[B21] clearing the damage description still submits and persists an empty snapshot field", async ({
  page,
}) => {
  await startWithUtterance(page, completeUtterance("(239) 555-0152", "b21b.demo@example.com"));
  await skipOptionalsToReview(page);

  await page.locator('textarea[name="damageDescription"]').fill("");
  await page.getByRole("button", { name: /everything.s right/i }).click();

  // Optional/forgiving: no /gaps detour, no error — straight to confirmation.
  await page.waitForURL("**/done");
  await expect(page.getByRole("heading", { name: /you.re all set/i })).toBeVisible();

  expect(await latestDamageDescription()).toBe("");
});
