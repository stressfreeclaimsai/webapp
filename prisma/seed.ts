import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { ensureDatabaseUrl, assertLocalSqlite } from "../scripts/env";

// 1) Resolve + guard the database URL BEFORE any destructive operation.
const databaseUrl = ensureDatabaseUrl();
assertLocalSqlite(databaseUrl);

// 2) Reset throwaway data with a file-level delete (constitution §2). For a
//    SQLite prototype this is the most honest reset — the data is fully
//    reconstructable from this script — and it avoids `--force-reset`, which a
//    plain `prisma db push` does not need on a fresh file. The guard above
//    ensures we only ever delete a local SQLite file. Prisma resolves a
//    relative file: URL against the schema directory (prisma/).
function sqliteFilePath(url: string): string {
  const raw = url.slice("file:".length);
  return isAbsolute(raw) ? raw : join("prisma", raw);
}

console.log("→ Resetting throwaway SQLite data…");
const dbPath = sqliteFilePath(databaseUrl);
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  rmSync(`${dbPath}${suffix}`, { force: true });
}

console.log("→ Creating schema (prisma db push)…");
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding the demo homeowner + hurricane scenario…");

  // The founder's real scenario (WP-1): Martin Kaczmarek, Naples FL, hit by a
  // hurricane on September 15th. Phone/email are clearly-fake demo values —
  // in the live flow they are captured in-flow, never pre-filled.
  const homeowner = await prisma.homeowner.create({
    data: {
      firstName: "Martin",
      lastName: "Kaczmarek",
      streetAddress: "927 11th St N",
      city: "Naples",
      state: "FL",
      zip: "34102",
      phone: "(239) 555-0141",
      email: "martin.demo@example.com",
    },
  });

  // One seeded demo claim so the Claim entity never looks empty
  // (constitution §1). Dated the day after the storm — the shape a fresh
  // post-hurricane claim would have. Policy number and deductible are
  // deliberately empty: the flow completes without them (AC-3).
  const dateOfLoss = new Date(Date.UTC(2025, 8, 15, 12)); // September 15
  await prisma.claim.create({
    data: {
      claimantName: "Martin Kaczmarek",
      propertyAddress: "927 11th St N, Naples, FL",
      stateOfLoss: "FL",
      phone: "(239) 555-0141",
      email: "martin.demo@example.com",
      insurerName: "Citizens Property",
      policyNumber: null,
      deductible: null,
      dateOfLoss,
      itemsDamaged: "roof,window",
      notes: "Hurricane came through overnight. Roof and two windows damaged.",
      homeownerId: homeowner.id,
      createdAt: new Date(Date.UTC(2025, 8, 16, 14)), // reads ~1 day after the loss
    },
  });

  console.log(
    `✓ Seeded homeowner "${homeowner.firstName} ${homeowner.lastName}" with 1 demo claim.`,
  );
}

main()
  .catch((error) => {
    console.error("✖ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
