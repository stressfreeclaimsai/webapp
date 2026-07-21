import { test as base, expect, type Page } from "@playwright/test";

/**
 * Validation tests for decisions B14 (date-of-loss plausibility), B15 (email
 * shape), and B16 (state-of-loss enum) — see open-decisions.md. Same inline
 * console/network guard as claim-flow.spec.ts (bare import only; see the
 * Playwright 1.61 sync-ESM note there).
 *
 * These tests exercise the SHARED-LIB enforcement, deliberately using values
 * the browser's own HTML validation lets through (a future date on /review,
 * a TLD-less "a@b" email) or injecting values normal UI can't produce (a
 * bogus <option>), so a pass here proves the server rules, not the browser's.
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

const FOUNDER_UTTERANCE =
  "My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. " +
  "A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. " +
  "I have damage to my roof and a couple of windows.";

/** A safely-plausible date: 30 days ago, calendar-date UTC. */
function recentIso(): string {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
}

async function startWithUtterance(page: Page, utterance: string) {
  await page.goto("/");
  await page.getByPlaceholder(/for example/i).fill(utterance);
  await page.getByRole("button", { name: "Start my claim" }).click();
  await page.waitForURL("**/gaps");
}

async function answerCurrentGap(page: Page, value: string) {
  await page.locator('input[name="value"]').fill(value);
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Founder utterance → phone → email → skip optionals → /review. */
async function founderFlowToReview(page: Page) {
  await startWithUtterance(page, FOUNDER_UTTERANCE);
  await expect(page.getByRole("heading", { name: /best number to reach you/i })).toBeVisible();
  await answerCurrentGap(page, "(239) 555-0141");
  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();
  await answerCurrentGap(page, "martin.demo@example.com");
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
}

test("[B14] review rejects a future or too-old date of loss, keeps input, then submits once fixed", async ({
  page,
}) => {
  await founderFlowToReview(page);

  // Future date: browser lets it through on /review (no max), server must not.
  await page.locator('input[name="dateOfLoss"]').fill("2035-01-01");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText(/date is in the future/i)).toBeVisible();
  // Never-trap: the typed value is kept, not wiped.
  await expect(page.locator('input[name="dateOfLoss"]')).toHaveValue("2035-01-01");

  // Older than 24 months.
  await page.locator('input[name="dateOfLoss"]').fill("2019-06-01");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText(/more than two years back/i)).toBeVisible();
  await expect(page.locator('input[name="dateOfLoss"]')).toHaveValue("2019-06-01");

  // A plausible date submits and reaches confirmation.
  await page.locator('input[name="dateOfLoss"]').fill(recentIso());
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");
  await expect(page.getByRole("heading", { name: /you.re all set, martin/i })).toBeVisible();
});

test("[B14] gap-filling re-asks a too-old date with guidance and the value kept", async ({
  page,
}) => {
  // No date in the utterance, so the date question comes up in the gap flow.
  await startWithUtterance(
    page,
    "My name is Jane Smith. My address is 12 Palm Ave, Naples, FL. " +
      "I'm insured by State Farm. The roof got wrecked.",
  );
  await expect(page.getByRole("heading", { name: /when did the damage happen/i })).toBeVisible();

  await answerCurrentGap(page, "2019-06-01");

  // Same question again — guidance shown, typed value kept, no error screen.
  await expect(page.getByRole("heading", { name: /when did the damage happen/i })).toBeVisible();
  await expect(page.getByText(/more than two years back/i)).toBeVisible();
  await expect(page.locator('input[name="value"]')).toHaveValue("2019-06-01");

  await answerCurrentGap(page, recentIso());
  await expect(page.getByRole("heading", { name: /best number to reach you/i })).toBeVisible();
});

test("[B15] a malformed email is caught on review and in gap-filling", async ({ page }) => {
  // Gap flow first: "martin@example" passes the browser's type=email check
  // but fails the app's shape rule — the step re-asks with guidance.
  await startWithUtterance(page, FOUNDER_UTTERANCE);
  await answerCurrentGap(page, "(239) 555-0141");
  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();
  await answerCurrentGap(page, "martin@example");

  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();
  await expect(page.getByText(/doesn.t look like an email/i)).toBeVisible();
  await expect(page.locator('input[name="value"]')).toHaveValue("martin@example");

  await answerCurrentGap(page, "martin.demo@example.com");
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");

  // Review: same rule, same guidance, input kept; fixing it submits.
  await page.locator('input[name="email"]').fill("martin@example");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText(/doesn.t look like an email/i)).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveValue("martin@example");

  await page.locator('input[name="email"]').fill("martin.demo@example.com");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");
});

test("[B16] state of loss is asked when missing and offers exactly the 50-state + DC set", async ({
  page,
}) => {
  // No state anywhere in this utterance → the state question comes up right
  // after the (extracted) address, before anything else missing.
  await startWithUtterance(
    page,
    "My name is Jane Smith. My address is 12 Palm Ave. The hurricane hit on June 3rd. " +
      "I'm insured by State Farm. The roof got wrecked.",
  );
  await expect(page.getByRole("heading", { name: /which state is the property in/i })).toBeVisible();

  // The select is the fixed enum: 51 real options plus the placeholder.
  const options = page.locator('select[name="value"] option');
  await expect(options).toHaveCount(52);
  await expect(page.locator('select[name="value"] option[value="FL"]')).toHaveText("Florida");

  await page.locator('select[name="value"]').selectOption("FL");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /best number to reach you/i })).toBeVisible();
});

test("[B16] a non-enum state value cannot submit — the flow routes back to the state question", async ({
  page,
}) => {
  await founderFlowToReview(page);
  // "Naples, FL" was extracted — review shows Florida preselected.
  await expect(page.locator('select[name="stateOfLoss"]')).toHaveValue("FL");

  // Inject a value the UI can't produce; the server must clear it and re-ask.
  await page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>('select[name="stateOfLoss"]')!;
    const bogus = document.createElement("option");
    bogus.value = "XX";
    bogus.textContent = "Xanadu";
    select.append(bogus);
    select.value = "XX";
  });
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/gaps");
  await expect(page.getByRole("heading", { name: /which state is the property in/i })).toBeVisible();

  // Answering with a real state completes the loop: gaps → review → done.
  await page.locator('select[name="value"]').selectOption("FL");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/review");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");
  await expect(page.getByText("Florida")).toBeVisible();
});
