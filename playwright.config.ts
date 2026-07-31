import { defineConfig, devices } from "@playwright/test";

const LOCAL_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://stressfreeclaim:stressfreeclaim@localhost:54329/stressfreeclaim?schema=test";

// Acceptance-criteria tests run against an isolated PostgreSQL schema.
// globalSetup resets and seeds it before the suite; the development schema is
// never touched by test runs.
export default defineConfig({
  testDir: "./tests",
  // Serial preserves the deterministic seeded scenario and newest-claim checks.
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
    env: {
      ...process.env,
      DATABASE_URL: LOCAL_TEST_DATABASE_URL,
      DIRECT_URL: LOCAL_TEST_DATABASE_URL,
      EXTRACTION_LLM_STUB: "1",
    },
  },
});
