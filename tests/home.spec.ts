import { test as base, expect } from "@playwright/test";

/**
 * Acceptance-criteria test, keyed to /mission/spec/spec.md.
 *
 * The console/network error guard (constitution §4: "no console errors on
 * primary flows") is defined here as an auto-applied fixture via test.extend.
 *
 * NOTE: the fixture lives in this file on purpose. Playwright 1.61's sync ESM
 * loader crashes on local TS imports under Node 24.2.0
 * (`context.conditions?.includes is not a function`), so test files import only
 * the bare `@playwright/test`. When that upstream bug is resolved, this fixture
 * can be promoted to a shared tests/fixtures.ts and imported across specs.
 * See /mission/spec/open-decisions.md.
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

// The title is prefixed with the acceptance-criterion id ([AC-1]) so the /verify
// harness can map results back to the spec pack. Add one test per must-have
// criterion in /mission/spec/spec.md, prefixed the same way.
test("[AC-1] home route renders the seeded demo user's notes without errors", async ({ page }) => {
  await page.goto("/");

  // The prototype affordance is always present (constitution §7).
  await expect(page.getByText(/prototype — not for real data/i)).toBeVisible();

  // The home route shows real seeded content, not a placeholder.
  await expect(page.getByRole("heading", { level: 1, name: "Notes" })).toBeVisible();

  const notes = page.getByTestId("note-card");
  await expect(notes.first()).toBeVisible();
  expect(await notes.count()).toBeGreaterThan(0);

  // Screenshot the key flow for the verify report.
  await page.screenshot({ path: "test-results/screenshots/home.png", fullPage: true });
});
