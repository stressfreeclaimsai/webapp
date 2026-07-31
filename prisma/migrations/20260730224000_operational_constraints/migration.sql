-- PostgreSQL partial indexes express lifecycle invariants that Prisma's schema
-- language cannot currently declare.

-- A claim can have assignment history, but only one active owner at a time.
CREATE UNIQUE INDEX "ClaimAssignment_one_open_per_claim"
ON "ClaimAssignment" ("claimId")
WHERE "unassignedAt" IS NULL;
