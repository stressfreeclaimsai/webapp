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

  // A second, standard-access reviewer so the owner control has a real
  // target and the two access levels (B24/B27) are both visible locally.
  await prisma.staffUser.create({
    data: {
      externalSubject: "dev:staff:reviewer",
      email: "reviewer.demo@stressfreeclaim.example",
      displayName: "Priya Natarajan",
      role: "standard",
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
      damageDescription: "Hurricane came through overnight. Roof and two windows damaged.",
      extraFields: {},
      submittedAt: new Date(Date.UTC(2025, 8, 16, 14)),
    },
  });

  const reviewingClaim = await prisma.claim.create({
    data: {
      referenceCode: "SFC-DEMO02",
      submissionKey: "seed:reviewing-demo",
      intakeVersion: CURRENT_INTAKE_VERSION,
      source: "synthetic_seed",
      status: "reviewing",
      claimantName: "Sandra Ortiz",
      propertyAddress: "1832 Del Prado Blvd S, Cape Coral, FL",
      stateOfLoss: "FL",
      phone: "(239) 555-0162",
      email: "sandra.demo@example.com",
      insurerName: "Universal Property",
      policyNumber: "DEMO-UP-4821",
      deductible: "$5,000",
      dateOfLoss: new Date(Date.UTC(2025, 8, 16, 12)),
      itemsDamaged: ["siding", "drywall"],
      damageDescription: "Wind pulled siding loose and rain reached the living room wall.",
      extraFields: {},
      submittedAt: new Date(Date.UTC(2025, 8, 17, 15, 30)),
    },
  });

  const unassignedClaim = await prisma.claim.create({
    data: {
      referenceCode: "SFC-DEMO03",
      submissionKey: "seed:unassigned-demo",
      intakeVersion: CURRENT_INTAKE_VERSION,
      source: "synthetic_seed",
      status: "new",
      claimantName: "Jamie Chen",
      propertyAddress: "409 Wrightsville Ave, Wilmington, NC",
      stateOfLoss: "NC",
      phone: "(910) 555-0137",
      email: "jamie.demo@example.com",
      insurerName: "State Farm",
      policyNumber: null,
      deductible: null,
      dateOfLoss: new Date(Date.UTC(2025, 8, 17, 12)),
      itemsDamaged: ["roof", "contents"],
      damageDescription: "A tree limb opened the roof and water damaged bedroom contents.",
      extraFields: {},
      submittedAt: new Date(Date.UTC(2025, 8, 18, 13, 15)),
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
    prisma.claimAssignment.create({
      data: {
        claimId: reviewingClaim.id,
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
    prisma.auditEvent.create({
      data: {
        claimId: reviewingClaim.id,
        actorType: "system",
        action: "claim.seeded",
        entityType: "claim",
        entityId: reviewingClaim.id,
        metadata: { synthetic: true, intakeVersion: CURRENT_INTAKE_VERSION },
      },
    }),
    prisma.auditEvent.create({
      data: {
        claimId: unassignedClaim.id,
        actorType: "system",
        action: "claim.seeded",
        entityType: "claim",
        entityId: unassignedClaim.id,
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
    `✓ Seeded three synthetic claims, two staff users, two assignments, notes, audit events, and a notification preview.`,
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
