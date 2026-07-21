import { test as base, expect, type Page } from "@playwright/test";

/**
 * B20 extraction tests: local-first parsers + the guarded LLM pass. The dev
 * server runs with EXTRACTION_LLM_STUB=1 (see playwright.config.ts), so
 * markers in the utterance drive the stubbed transport while everything else
 * — invocation gating, the 2s hard timeout, JSON + strict-schema validation,
 * merge authority — is the real production code path.
 *
 * Same inline console/network guard as the other specs (bare import only;
 * see the Playwright 1.61 sync-ESM note in claim-flow.spec.ts).
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

async function startWithUtterance(page: Page, utterance: string) {
  await page.goto("/");
  await page.getByPlaceholder(/for example/i).fill(utterance);
  await page.getByRole("button", { name: "Start my claim" }).click();
  await page.waitForURL("**/gaps");
}

/** From the optional-extras step through to /review. */
async function skipOptionalsToReview(page: Page) {
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
}

test("[B20] local parsers handle messy phrasing: weekday date, zip'd address, carrier typo", async ({
  page,
}) => {
  await startWithUtterance(
    page,
    "The storm hit us on Tuesday at 927 11th St N, Naples, FL 34102. I'm Martin Kaczmarek, " +
      "insured with Citzens Property. Roof torn up. Call me at (239) 555-0141, " +
      "email martin.demo@example.com.",
  );
  await skipOptionalsToReview(page);

  await expect(page.locator('input[name="fullName"]')).toHaveValue("Martin Kaczmarek");
  await expect(page.locator('input[name="propertyAddress"]')).toHaveValue(
    "927 11th St N, Naples, FL 34102",
  );
  await expect(page.locator('select[name="stateOfLoss"]')).toHaveValue("FL");
  // "on Tuesday" resolved to a real past-or-today calendar date via chrono.
  await expect(page.locator('input[name="dateOfLoss"]')).not.toHaveValue("");
  // "Citzens Property" fuzzy-matched onto the canonical carrier name.
  expect(await page.locator('input[name="insurerName"]').inputValue()).toMatch(
    /citizens property/i,
  );
  await expect(page.locator('input[name="items"][value="roof"]')).toBeChecked();
});

test("[B20] the LLM fills a name no local parser can find", async ({ page }) => {
  // "This is the Butcher family house" defeats the local name heuristics
  // (lowercase 'the' after the opener), and "the gazebo got crushed" names
  // no fixed-set item — both fuzzy fields are requested; the stub answers.
  await startWithUtterance(
    page,
    "This is the Butcher family house at 1444 Wayne Ave, Naples, FL. The hurricane hit " +
      "yesterday and the gazebo got crushed. I'm insured by State Farm. " +
      "Phone (239) 555-0145, email fam2.demo@example.com.",
  );

  // Items can't come from "gazebo" (AC-4) — the gap step asks from the set.
  await expect(page.getByRole("heading", { name: /what was damaged/i })).toBeVisible();
  await page.locator('input[name="items"][value="roof"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  await skipOptionalsToReview(page);
  await expect(page.locator('input[name="fullName"]')).toHaveValue("Stub Person");
});

test("[B20] the LLM can never overwrite a locally-parsed field", async ({ page }) => {
  // Local finds "Jane Smith"; only damageDescription is requested. The stub
  // returns an UNREQUESTED fullName ("Hallucinated Name") — the strict
  // schema must discard the whole response, leaving the local name intact.
  await startWithUtterance(
    page,
    "My name is Jane Smith. I live at 12 Palm Ave, Naples, FL. It happened on June 3rd. " +
      "I'm insured by State Farm. STUBOVERWRITE the gazebo got crushed. " +
      "My phone is (239) 555-0143 and my email is jane2.demo@example.com.",
  );

  await expect(page.getByRole("heading", { name: /what was damaged/i })).toBeVisible();
  await page.locator('input[name="items"][value="roof"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  await skipOptionalsToReview(page);
  await expect(page.locator('input[name="fullName"]')).toHaveValue("Jane Smith");
});

test("[B20] a malformed LLM response is discarded whole — flow proceeds on local", async ({
  page,
}) => {
  await startWithUtterance(
    page,
    "This is the Butcher family house at 1444 Wayne Ave, Naples, FL. STUBMALFORMED The " +
      "hurricane hit yesterday and the roof is gone. Phone (239) 555-0144, " +
      "email fam.demo@example.com.",
  );

  // The discarded response never fills the name — the gap step asks plainly.
  await expect(page.getByRole("heading", { name: /what.s your name/i })).toBeVisible();
});

test("[B20] an LLM timeout falls back cleanly to the local result within the hard budget", async ({
  page,
}) => {
  const started = Date.now();
  await startWithUtterance(
    page,
    "This is the Butcher family house at 1444 Wayne Ave, Naples, FL. STUBTIMEOUT The " +
      "hurricane hit yesterday and the roof is gone. Phone (239) 555-0146, " +
      "email fam3.demo@example.com.",
  );
  const elapsed = Date.now() - started;

  // Never-trap: the flow lands on the gap step asking for the name, and the
  // stub's 10s hang was cut off by the ~2s hard timeout (allow dev-server
  // slack, but nowhere near the 10s hang).
  await expect(page.getByRole("heading", { name: /what.s your name/i })).toBeVisible();
  expect(elapsed).toBeLessThan(9_000);
});
