/*
  Warnings:

  - You are about to drop the column `duration` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "duration",
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';
