import { test as base, expect, type Page } from "@playwright/test";

/**
 * Acceptance-criteria tests, keyed to /mission/spec/spec.md ([AC-1]–[AC-7])
 * and /mission/architecture.md ([AC-8]). Titles are prefixed with the
 * criterion id so scripts/verify.ts can map results to the spec pack.
 *
 * The console/network error guard (constitution §4) is defined inline via
 * test.extend: Playwright 1.61's sync ESM loader crashes on local TS imports
 * under Node 24.x, so this file imports only bare `@playwright/test`.
 * See /mission/spec/open-decisions.md (known issues).
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

// The founder's own scenario — the extraction target (spec.md, loop step 2).
const FOUNDER_UTTERANCE =
  "My name is Martin Kaczmarek. My address is 927 11th St N, Naples, FL. " +
  "A hurricane hit my house yesterday, September 15th. I'm insured by Citizens Property. " +
  "I have damage to my roof and a couple of windows.";

// "September 15th" with no year resolves to the most recent past occurrence —
// mirror that here so the test doesn't rot at year boundaries.
function expectedSept15(): string {
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const year = Date.UTC(thisYear, 8, 15, 12) > now.getTime() ? thisYear - 1 : thisYear;
  return `${year}-09-15`;
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

const AUTH_OR_PAYMENT = /\b(log ?in|sign ?in|sign ?up|password|create account|checkout|credit card)\b/i;
const GATED_LANGUAGE = /\b(fee|waiver|waived|contract|signature|e-sign|sign here|crm)\b/i;

test("[AC-1] welcome shows the greeting and a single clear way to begin", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /tell me what happened, and we.ll take it from there/i }),
  ).toBeVisible();

  // Exactly one way to begin: one free-text box, one start button.
  await expect(page.locator("textarea")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Start my claim" })).toHaveCount(1);

  // No login/account UI anywhere (constitution §2).
  expect(await page.locator("body").innerText()).not.toMatch(AUTH_OR_PAYMENT);

  await page.screenshot({ path: "test-results/screenshots/01-welcome.png", fullPage: true });
});

test("[AC-2] the founder's sentence extracts all five ball-rolling facts", async ({ page }) => {
  await founderFlowToReview(page);

  // Review shows what the one sentence yielded — the five facts, verbatim.
  await expect(page.locator('input[name="fullName"]')).toHaveValue("Martin Kaczmarek");
  await expect(page.locator('input[name="propertyAddress"]')).toHaveValue(
    "927 11th St N, Naples, FL",
  );
  await expect(page.locator('input[name="dateOfLoss"]')).toHaveValue(expectedSept15());
  await expect(page.locator('input[name="insurerName"]')).toHaveValue("Citizens Property");
  await expect(page.locator('input[name="items"][value="roof"]')).toBeChecked();
  await expect(page.locator('input[name="items"][value="window"]')).toBeChecked();

  // A vaguer sentence still advances to gap-filling — never an error screen.
  await startWithUtterance(page, "the storm last night wrecked my roof");
  await expect(page.getByRole("heading", { name: /what.s your name/i })).toBeVisible();
});

test("[AC-3] gap-filling asks only phone and email; optionals never block", async ({ page }) => {
  await startWithUtterance(page, FOUNDER_UTTERANCE);

  // The first question is phone — nothing already answered is re-asked.
  await expect(page.getByRole("heading", { name: /best number to reach you/i })).toBeVisible();
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/what.s your name|where.s the damaged property|insurance company/i);

  await page.screenshot({ path: "test-results/screenshots/02-gaps.png", fullPage: true });
  await answerCurrentGap(page, "(239) 555-0141");
  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();
  await answerCurrentGap(page, "martin.demo@example.com");

  // Policy number + deductible are offered once and skipping still completes.
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await expect(page.locator('input[name="policyNumber"]')).toBeVisible();
  await expect(page.locator('input[name="deductible"]')).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
  await expect(page.getByRole("heading", { name: /here.s what we have/i })).toBeVisible();
});

test("[AC-4] items damaged resolve only to the fixed set", async ({ page }) => {
  // Unknown damage words never invent an enum member: with everything else
  // supplied, the app asks for items from exactly the five fixed choices.
  await startWithUtterance(
    page,
    "My name is Jane Smith. My address is 12 Palm Ave, Naples, FL. The hurricane hit on " +
      "June 3rd. I'm insured by State Farm. My gazebo and the fence got wrecked.",
  );
  await expect(page.getByRole("heading", { name: /what was damaged/i })).toBeVisible();

  const boxes = page.locator('input[name="items"]');
  await expect(boxes).toHaveCount(5);
  for (const item of ["roof", "siding", "window", "drywall", "contents"]) {
    await expect(page.locator(`input[name="items"][value="${item}"]`)).toBeVisible();
  }
  expect(await page.locator("body").innerText()).not.toMatch(/gazebo|fence/i);

  // Choosing from the set advances the flow.
  await page.locator('input[name="items"][value="roof"]').check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /best number to reach you/i })).toBeVisible();

  // And the founder's wording maps onto the set: roof + window, nothing else.
  await founderFlowToReview(page);
  for (const [item, checked] of [
    ["roof", true],
    ["window", true],
    ["siding", false],
    ["drywall", false],
    ["contents", false],
  ] as const) {
    const box = page.locator(`input[name="items"][value="${item}"]`);
    if (checked) await expect(box).toBeChecked();
    else await expect(box).not.toBeChecked();
  }
});

test("[AC-5] review shows everything captured and corrections persist downstream", async ({
  page,
}) => {
  await founderFlowToReview(page);

  // Pin that /review itself rendered and stayed — this fails loudly if the
  // route ever redirects away (e.g. to /done) instead of rendering.
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole("heading", { name: /here.s what we have/i })).toBeVisible();

  // Everything captured is visible and editable.
  for (const name of ["fullName", "propertyAddress", "dateOfLoss", "insurerName", "phone", "email", "policyNumber", "deductible"]) {
    await expect(page.locator(`input[name="${name}"]`)).toBeVisible();
  }
  await page.screenshot({ path: "test-results/screenshots/03-review.png", fullPage: true });

  // Correct a mis-parse: a different insurer and date of loss.
  await page.locator('input[name="insurerName"]').fill("Tower Hill");
  await page.locator('input[name="dateOfLoss"]').fill("2025-09-16");
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");

  // The corrected values are what the claim carries downstream.
  await expect(page.getByText("Tower Hill").first()).toBeVisible();
  await expect(page.getByText("September 16, 2025")).toBeVisible();
});

test("[AC-6] confirmation shows the concierge preview; nothing leaves the app", async ({
  page,
}) => {
  // Track every request that would leave localhost — there must be none.
  const externalRequests: string[] = [];
  page.on("request", (req) => {
    if (!new URL(req.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      externalRequests.push(req.url());
    }
  });

  await founderFlowToReview(page);
  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");

  // Calm confirmation + a stored demo claim (the reference proves the read-back).
  await expect(page.getByRole("heading", { name: /you.re all set, martin/i })).toBeVisible();
  await expect(page.getByText(/SFC-[A-Z0-9]{6}/)).toBeVisible();

  // The three-beat, non-functional preview: file → inspection → approved repair.
  await expect(page.getByRole("heading", { name: "We file your claim" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "We handle the inspection" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /an approved contractor makes the repairs/i }),
  ).toBeVisible();

  // No fee/contract/signature language anywhere on it (settled Won'ts).
  expect(await page.locator("body").innerText()).not.toMatch(GATED_LANGUAGE);
  expect(externalRequests).toEqual([]);

  await page.screenshot({ path: "test-results/screenshots/04-done.png", fullPage: true });
});

test("[AC-7] prototype affordance everywhere; no gated UI; mobile holds up", async ({ page }) => {
  // The founder's moment is a phone, outdoors — run the whole loop mobile-size.
  await page.setViewportSize({ width: 375, height: 812 });

  const assertIntegrity = async () => {
    await expect(page.getByText(/prototype — not for real data/i)).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(AUTH_OR_PAYMENT);
    expect(text).not.toMatch(GATED_LANGUAGE);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows, "page must not overflow a mobile viewport").toBe(false);
  };

  await page.goto("/");
  await assertIntegrity();

  await startWithUtterance(page, FOUNDER_UTTERANCE);
  await assertIntegrity();
  await answerCurrentGap(page, "(239) 555-0141");
  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();

  // A dropped connection or dying battery mid-flow must not lose the claim:
  // reloading restores the draft exactly where it was.
  await page.reload();
  await expect(page.getByRole("heading", { name: /and your email/i })).toBeVisible();

  await answerCurrentGap(page, "martin.demo@example.com");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
  await assertIntegrity();

  await page.getByRole("button", { name: /everything.s right/i }).click();
  await page.waitForURL("**/done");
  await assertIntegrity();
});

test("[AC-8] a failed parse falls through plainly and skipping ahead cannot submit", async ({
  page,
  context,
}) => {
  // An unparseable utterance is a VALID state: the draft simply asks for
  // everything, starting with the first required field — no error, no trap.
  await startWithUtterance(page, "asdf qwerty zzz !!");
  await expect(page.getByRole("heading", { name: /what.s your name/i })).toBeVisible();

  // Skipping ahead mid-flow cannot file anything: submit is server-side and
  // an incomplete draft routes back to gap-filling.
  await page.goto("/done");
  await page.waitForURL("**/gaps");
  await page.goto("/review");
  await page.waitForURL("**/gaps");

  // With no session at all, the flow starts at the front door.
  await context.clearCookies();
  await page.goto("/gaps");
  await page.waitForURL(/\/$/);
  await expect(page.getByRole("button", { name: "Start my claim" })).toBeVisible();
});
