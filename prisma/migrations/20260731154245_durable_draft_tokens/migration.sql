/*
  Warnings:

  - You are about to alter the column `continuationTokenHash` on the `ClaimDraft` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(64)`.

*/
-- AlterTable
ALTER TABLE "ClaimDraft" ALTER COLUMN "continuationTokenHash" SET DATA TYPE CHAR(64);
