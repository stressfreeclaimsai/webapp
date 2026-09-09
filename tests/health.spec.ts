import { test, expect } from "@playwright/test";

/**
 * /api/health is the uptime-check target (product/EXTERNAL-APP-SETUP.md §5).
 * It must reflect the database, not just the process: a deploy whose
 * DATABASE_URL is missing or wrong should read "degraded" here rather than
 * surfacing only as 500s on the intake flow.
 */
test("[HEALTH] /api/health reports mode and a reachable database", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");

  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.database).toBe("ok");
  expect(body.mode).toBe("prototype");
  expect(typeof body.timestamp).toBe("string");

  // Optional-dependency presence is reported as an enum, never a value.
  expect(["configured", "absent"]).toContain(body.model);
  // The test server runs the local provider (playwright.config.ts).
  expect(body.staffAuth).toBe("local");
  expect(JSON.stringify(body)).not.toMatch(/sk-ant|sk_test|client_01/);
});
