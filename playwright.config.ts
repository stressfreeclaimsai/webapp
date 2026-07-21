import { defineConfig, devices } from "@playwright/test";

// Acceptance-criteria tests run against the dev server. globalSetup seeds the
// throwaway database first, so `npm run test` and `npm run verify` both work
// standalone. The JSON report is consumed by scripts/verify.ts to print the
// pass/fail table keyed to acceptance criteria.
export default defineConfig({
  testDir: "./tests",
  // Serial on purpose: the acceptance flows share one throwaway SQLite file
  // and a dev server; parallel workers invite lock contention, not speed.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Marker-driven stub for the extraction LLM pass (B20): tests exercise
    // the timeout/malformed/merge guards through the real UI with no network
    // and no API key. NOTE: with reuseExistingServer, a dev server started
    // outside Playwright won't have this flag — stop it before `npm test`.
    env: { ...process.env, EXTRACTION_LLM_STUB: "1" },
  },
});
