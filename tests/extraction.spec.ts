import { test as base, expect, type Page } from "@playwright/test";

/**
 * Extraction-precision tests (B19) — reproduce the real-world parse artifacts
 * where the name swallowed the start of the address ("Paul Butcher at 1444")
 * and the street-address fallback truncated the city to one letter
 * ("1444 Wayne Ave, L"). Same inline console/network guard as the other
 * specs (bare import only; see the Playwright 1.61 sync-ESM note in
 * claim-flow.spec.ts).
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

/** With phone + email in the utterance, only the optional step separates start from review. */
async function skipOptionalsToReview(page: Page) {
  await expect(page.getByRole("heading", { name: /two optional details/i })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/review");
}

test("[B19] a name that runs into the address stops at the connector word", async ({ page }) => {
  await startWithUtterance(
    page,
    "My name is Paul Butcher at 1444 Wayne Ave, Lehigh Acres, FL. A hurricane hit yesterday. " +
      "I'm insured by State Farm. My roof is damaged. My phone is (239) 555-0141 and my " +
      "email is paul.demo@example.com.",
  );
  await skipOptionalsToReview(page);

  await expect(page.locator('input[name="fullName"]')).toHaveValue("Paul Butcher");
  await expect(page.locator('input[name="propertyAddress"]')).toHaveValue(
    "1444 Wayne Ave, Lehigh Acres, FL",
  );
  await expect(page.locator('select[name="stateOfLoss"]')).toHaveValue("FL");
});

test("[B19] the street-address fallback keeps the whole city, even a two-letter one", async ({
  page,
}) => {
  // No "my address is" / "I live at" phrasing, so the bare-street FALLBACK
  // must carry the city — this used to yield "1444 Wayne Ave, L".
  await startWithUtterance(
    page,
    "My name is Jane Smith. My house at 1444 Wayne Ave, LA took a beating from the hurricane " +
      "yesterday. I'm insured by State Farm. The roof got wrecked. My phone is (239) 555-0142 " +
      "and my email is jane.demo@example.com.",
  );
  await skipOptionalsToReview(page);

  await expect(page.locator('input[name="fullName"]')).toHaveValue("Jane Smith");
  await expect(page.locator('input[name="propertyAddress"]')).toHaveValue("1444 Wayne Ave, LA");
  // ", LA" reads as Louisiana by the comma-abbreviation rule — /review is
  // the correction point for the Los Angeles ambiguity (see B19 note).
  await expect(page.locator('select[name="stateOfLoss"]')).toHaveValue("LA");
});
