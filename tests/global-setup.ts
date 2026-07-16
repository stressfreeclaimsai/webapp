import { execSync } from "node:child_process";

// Seed throwaway data before the suite runs so tests have a populated app
// (constitution §1). Runs for both `npm run test` and `npm run verify`.
//
// This file is loaded by Playwright's own TS loader, so it imports only Node
// builtins (no cross-directory relative imports) and resolves DATABASE_URL
// inline. The seed it shells out to applies the real file: guard.
export default async function globalSetup() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env present — fall back to the default below.
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";

  console.log("→ [global-setup] Seeding database for the test run…");
  execSync("npm run seed", { stdio: "inherit", env: process.env });
}
