import { prisma } from "../lib/db";
import { cleanupExpiredDrafts } from "../lib/drafts";
import { assertLocalPostgres, ensureDatabaseUrl } from "./env";

const databaseUrl = ensureDatabaseUrl();
assertLocalPostgres(databaseUrl);

async function main() {
  const result = await cleanupExpiredDrafts();
  console.log(
    `✓ Draft cleanup complete: ${result.markedExpired} marked expired, ${result.deleted} deleted.`,
  );
}

main()
  .catch((error) => {
    console.error("✖ Draft cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
