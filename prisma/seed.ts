import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { CURRENT_INTAKE_VERSION, NOTIFICATION_KINDS } from "../lib/production-domain";
import { assertLocalPostgres, ensureDatabaseUrl } from "../scripts/env";

const databaseUrl = ensureDatabaseUrl();
assertLocalPostgres(databaseUrl);

const prismaCliEnv = { ...process.env };
delete prismaCliEnv.NODE_OPTIONS;
delete prismaCliEnv.NODE_CHANNEL_FD;
prismaCliEnv.RUST_LOG = "debug";

console.log("→ Applying local PostgreSQL migrations…");
execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: prismaCliEnv,
});

const prisma = new PrismaClient();

async function resetLocalData() {
  await prisma.$transaction([
    prisma.notificationDelivery.deleteMany(),
    prisma.auditEvent.deleteMany(),
    prisma.claimNote.deleteMany(),
    prisma.claimAssignment.deleteMany(),
    prisma.claimDraft.deleteMany(),
    prisma.claim.deleteMany(),
    prisma.staffUser.deleteMany(),
  ]);
}

async function main() {
  console.log("→ Resetting local synthetic data…");
  await resetLocalData();

  console.log("→ Seeding the production data-model walkthrough…");
  const staffUser = await prisma.staffUser.create({
    data: {
      externalSubject: "dev:staff:pilot-owner",
      email: "pilot-owner.demo@stressfreeclaim.example",
      displayName: "Pilot Queue Owner",
      role: "admin",
    },
  });

  const claim = await prisma.claim.create({
    data: {
      referenceCode: "SFC-DEMO01",
      submissionKey: "seed:founder-demo",
      intakeVersion: CURRENT_INTAKE_VERSION,
      source: "synthetic_seed",
      status: "new",
      claimantName: "Martin Kaczmarek",
      propertyAddress: "927 11th St N, Naples, FL",
      stateOfLoss: "FL",
      phone: "(239) 555-0141",
      email: "martin.demo@example.com",
      insurerName: "Citizens Property",
      policyNumber: null,
      deductible: null,
      dateOfLoss: new Date(Date.UTC(2025, 8, 15, 12)),
      itemsDamaged: ["roof", "window"],
      damageDescription:
        "Hurricane came through overnight. Roof and two windows damaged.",
      extraFields: {},
      submittedAt: new Date(Date.UTC(2025, 8, 16, 14)),
    },
  });

  await prisma.$transaction([
    prisma.claimAssignment.create({
      data: {
        claimId: claim.id,
        assigneeId: staffUser.id,
        assignedById: staffUser.id,
      },
    }),
    prisma.claimNote.create({
      data: {
        claimId: claim.id,
        authorId: staffUser.id,
        body: "Synthetic seed note for the local staff workflow.",
      },
    }),
    prisma.auditEvent.create({
      data: {
        claimId: claim.id,
        actorType: "system",
        action: "claim.seeded",
        entityType: "claim",
        entityId: claim.id,
        metadata: { synthetic: true, intakeVersion: CURRENT_INTAKE_VERSION },
      },
    }),
    prisma.notificationDelivery.create({
      data: {
        claimId: claim.id,
        kind: NOTIFICATION_KINDS[0],
        channel: "email",
        recipientAddress: "martin.demo@example.com",
        status: "previewed",
        idempotencyKey: "seed:founder-demo:homeowner-receipt",
        attempts: 1,
        sentAt: new Date(Date.UTC(2025, 8, 16, 14, 1)),
      },
    }),
  ]);

  console.log(
    `✓ Seeded ${claim.referenceCode}, one staff user, assignment, note, audit event, and notification preview.`,
  );
}

main()
  .catch((error) => {
    console.error("✖ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
