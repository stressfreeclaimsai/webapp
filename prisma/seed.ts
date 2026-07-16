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

// Realistic, varied seed content — a prototype must never look empty
// (constitution §1). Replace this with your project's example data.
const NOTES = [
  {
    title: "Customer interview — Acme onboarding",
    body: "Three of five testers stalled on the import step. They expected a sample file to start from. Action: ship a 'Load example data' button in the empty state.",
    tags: "research, onboarding",
    pinned: true,
  },
  {
    title: "Pricing page rewrite",
    body: "Lead with the outcome, not the feature list. Move the comparison table below the fold and add a one-line guarantee under the primary CTA.",
    tags: "copy, growth",
    pinned: false,
  },
  {
    title: "Weekly metrics",
    body: "Activation up 6 points after the guided first-run change. Week-2 retention flat — likely a content problem, not an onboarding one. Dig into cohort by source.",
    tags: "metrics",
    pinned: false,
  },
  {
    title: "Demo script for Thursday",
    body: "Open on the populated dashboard (never an empty one). Walk the core loop end to end in under four minutes, then invite them to try the search themselves.",
    tags: "sales, demo",
    pinned: true,
  },
  {
    title: "Bug — date filter off by one",
    body: "Selecting 'last 7 days' includes today twice near midnight UTC. Reproduced on Safari. Likely a timezone boundary in the range helper.",
    tags: "bug, qa",
    pinned: false,
  },
];

async function main() {
  console.log("→ Seeding demo user + example notes…");

  // The single seeded demo user the prototype runs as (constitution §2).
  const user = await prisma.user.create({
    data: {
      name: "Ada Lovelace",
      notes: { create: NOTES },
    },
    include: { notes: true },
  });

  console.log(`✓ Seeded user "${user.name}" with ${user.notes.length} notes.`);
}

main()
  .catch((error) => {
    console.error("✖ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
