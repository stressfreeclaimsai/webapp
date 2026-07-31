-- CreateTable
CREATE TABLE "ClaimDraft" (
    "id" TEXT NOT NULL,
    "continuationTokenHash" TEXT NOT NULL,
    "intakeVersion" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(32) NOT NULL DEFAULT 'in_progress',
    "claimantName" TEXT,
    "propertyAddress" TEXT,
    "stateOfLoss" VARCHAR(2),
    "dateOfLoss" TIMESTAMP(3),
    "insurerName" TEXT,
    "itemsDamaged" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "policyNumber" TEXT,
    "deductible" TEXT,
    "damageDescription" TEXT,
    "optionalsOffered" BOOLEAN NOT NULL DEFAULT false,
    "extraFields" JSONB NOT NULL DEFAULT '{}',
    "submittedClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "referenceCode" VARCHAR(24) NOT NULL,
    "submissionKey" VARCHAR(128) NOT NULL,
    "intakeVersion" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(40) NOT NULL DEFAULT 'web_intake',
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "claimantName" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "stateOfLoss" VARCHAR(2) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "insurerName" TEXT NOT NULL,
    "policyNumber" TEXT,
    "deductible" TEXT,
    "dateOfLoss" TIMESTAMP(3) NOT NULL,
    "itemsDamaged" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "damageDescription" TEXT NOT NULL DEFAULT '',
    "extraFields" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "externalSubject" VARCHAR(191) NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'reviewer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimAssignment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "ClaimAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimNote" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClaimNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT,
    "actorId" TEXT,
    "actorType" VARCHAR(24) NOT NULL DEFAULT 'system',
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(48) NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "claimId" TEXT,
    "kind" VARCHAR(64) NOT NULL,
    "channel" VARCHAR(24) NOT NULL DEFAULT 'email',
    "recipientAddress" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "idempotencyKey" VARCHAR(191) NOT NULL,
    "providerMessageId" VARCHAR(191),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" VARCHAR(80),
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimDraft_continuationTokenHash_key" ON "ClaimDraft"("continuationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimDraft_submittedClaimId_key" ON "ClaimDraft"("submittedClaimId");

-- CreateIndex
CREATE INDEX "ClaimDraft_status_expiresAt_idx" ON "ClaimDraft"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ClaimDraft_stateOfLoss_idx" ON "ClaimDraft"("stateOfLoss");

-- CreateIndex
CREATE INDEX "ClaimDraft_updatedAt_idx" ON "ClaimDraft"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_referenceCode_key" ON "Claim"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_submissionKey_key" ON "Claim"("submissionKey");

-- CreateIndex
CREATE INDEX "Claim_status_submittedAt_idx" ON "Claim"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Claim_stateOfLoss_submittedAt_idx" ON "Claim"("stateOfLoss", "submittedAt");

-- CreateIndex
CREATE INDEX "Claim_claimantName_idx" ON "Claim"("claimantName");

-- CreateIndex
CREATE INDEX "Claim_email_idx" ON "Claim"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_externalSubject_key" ON "StaffUser"("externalSubject");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE INDEX "StaffUser_isActive_idx" ON "StaffUser"("isActive");

-- CreateIndex
CREATE INDEX "ClaimAssignment_claimId_unassignedAt_idx" ON "ClaimAssignment"("claimId", "unassignedAt");

-- CreateIndex
CREATE INDEX "ClaimAssignment_assigneeId_unassignedAt_idx" ON "ClaimAssignment"("assigneeId", "unassignedAt");

-- CreateIndex
CREATE INDEX "ClaimNote_claimId_createdAt_idx" ON "ClaimNote"("claimId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_claimId_createdAt_idx" ON "AuditEvent"("claimId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_idempotencyKey_key" ON "NotificationDelivery"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_providerMessageId_key" ON "NotificationDelivery"("providerMessageId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_scheduledAt_idx" ON "NotificationDelivery"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_claimId_kind_idx" ON "NotificationDelivery"("claimId", "kind");

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_submittedClaimId_fkey" FOREIGN KEY ("submittedClaimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAssignment" ADD CONSTRAINT "ClaimAssignment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAssignment" ADD CONSTRAINT "ClaimAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAssignment" ADD CONSTRAINT "ClaimAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimNote" ADD CONSTRAINT "ClaimNote_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimNote" ADD CONSTRAINT "ClaimNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
