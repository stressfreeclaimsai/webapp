import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const prisma = new PrismaClient();
const createdDraftIds: string[] = [];
const createdStaffIds: string[] = [];

test.afterAll(async () => {
  await prisma.claimDraft.deleteMany({ where: { id: { in: createdDraftIds } } });
  await prisma.staffUser.deleteMany({ where: { id: { in: createdStaffIds } } });
  await prisma.$disconnect();
});

test("[DB-1] the synthetic seed exercises the production operations graph", async () => {
  const claim = await prisma.claim.findUnique({
    where: { referenceCode: "SFC-DEMO01" },
    include: {
      assignments: true,
      notes: true,
      auditEvents: true,
      notificationDeliveries: true,
    },
  });

  expect(claim).not.toBeNull();
  expect(claim?.assignments).toHaveLength(1);
  expect(claim?.notes).toHaveLength(1);
  expect(claim?.auditEvents).toHaveLength(1);
  expect(claim?.notificationDeliveries).toHaveLength(1);
});

test("[DB-2] experimental intake fields and vocabularies round-trip without a migration", async () => {
  const rawToken = "never-store-this-raw-token";
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const draft = await prisma.claimDraft.create({
    data: {
      continuationTokenHash: tokenHash,
      intakeVersion: 2,
      status: "research_followup",
      itemsDamaged: ["roof", "solar_panel"],
      extraFields: {
        experiment: "post-storm-photo-interest",
        wantsPhotoUpload: true,
      },
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  createdDraftIds.push(draft.id);

  expect(draft.continuationTokenHash).toBe(tokenHash);
  expect(draft.continuationTokenHash).not.toContain(rawToken);
  expect(draft.status).toBe("research_followup");
  expect(draft.itemsDamaged).toEqual(["roof", "solar_panel"]);
  expect(draft.extraFields).toEqual({
    experiment: "post-storm-photo-interest",
    wantsPhotoUpload: true,
  });
});

test("[DB-3] submission idempotency is enforced by PostgreSQL", async () => {
  const seeded = await prisma.claim.findUniqueOrThrow({
    where: { referenceCode: "SFC-DEMO01" },
  });

  await expect(
    prisma.claim.create({
      data: {
        referenceCode: "SFC-DUPE01",
        submissionKey: seeded.submissionKey,
        claimantName: seeded.claimantName,
        propertyAddress: seeded.propertyAddress,
        stateOfLoss: seeded.stateOfLoss,
        phone: seeded.phone,
        email: seeded.email,
        insurerName: seeded.insurerName,
        dateOfLoss: seeded.dateOfLoss,
      },
    }),
  ).rejects.toMatchObject({
    code: "P2002",
  });
});

test("[DB-4] a claim cannot have two active assignees", async () => {
  const seeded = await prisma.claim.findUniqueOrThrow({
    where: { referenceCode: "SFC-DEMO01" },
    include: { assignments: true },
  });
  const existing = seeded.assignments[0];
  expect(existing).toBeDefined();

  await expect(
    prisma.claimAssignment.create({
      data: {
        claimId: seeded.id,
        assigneeId: existing.assigneeId,
        assignedById: existing.assignedById,
      },
    }),
  ).rejects.toMatchObject({
    code: "P2002",
  });
});

test("[DB-5] new staff default to the standard access level", async () => {
  const staff = await prisma.staffUser.create({
    data: {
      externalSubject: "test:staff:standard-default",
      email: "standard-default@stressfreeclaim.example",
      displayName: "Standard Access Test",
    },
  });
  createdStaffIds.push(staff.id);

  expect(staff.role).toBe("standard");
});
