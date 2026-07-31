import { execSync } from "node:child_process";

const LOCAL_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://stressfreeclaim:stressfreeclaim@localhost:54329/stressfreeclaim?schema=test";

// Reset and seed the isolated local test schema before the suite. The seed's
// localhost guard prevents this path from ever targeting a managed database.
export default async function globalSetup() {
  process.env.DATABASE_URL = LOCAL_TEST_DATABASE_URL;
  process.env.DIRECT_URL = LOCAL_TEST_DATABASE_URL;

  console.log("→ [global-setup] Seeding database for the test run…");
  execSync("npm run seed", { stdio: "inherit", env: process.env });
}
