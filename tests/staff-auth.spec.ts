import { expect, test } from "@playwright/test";

/**
 * B25 — staff identity adapter, local provider. The suite runs with
 * STAFF_AUTH_PROVIDER=local, so these pin the behaviour that keeps the WorkOS
 * surface inert outside a managed runtime: the callback is not reachable,
 * the sign-in entry simply lands in the workspace, and the workspace shows
 * the local label with no sign-out control. The WorkOS path itself needs a
 * real provider session and is verified against the deployed runtime.
 */
test("[STAFF-3] the AuthKit callback is inert under the local provider", async ({ request }) => {
  const response = await request.get("/callback?code=x&state=y", { maxRedirects: 0 });
  expect(response.status()).toBe(404);
});

test("[STAFF-4] the sign-in entry lands in the workspace under the local provider", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.waitForURL("**/staff/claims");
  await expect(page.getByRole("heading", { name: "Claims" })).toBeVisible();
  await expect(page.getByText("Staff workspace · local development")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});

test("[STAFF-5] the sign-in problem page gives a way back", async ({ page }) => {
  await page.goto("/sign-in/problem");
  await expect(page.getByRole("heading", { name: /couldn.t finish signing you in/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /try signing in again/i })).toHaveAttribute(
    "href",
    "/sign-in",
  );
});
