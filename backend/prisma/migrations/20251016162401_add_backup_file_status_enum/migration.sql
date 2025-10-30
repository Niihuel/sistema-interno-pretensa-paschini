/*
  Warnings:

  - You are about to drop the column `disk1` on the `DailyBackup` table. All the data in the column will be lost.
  - You are about to drop the column `disk2` on the `DailyBackup` table. All the data in the column will be lost.
  - You are about to drop the column `disk3` on the `DailyBackup` table. All the data in the column will be lost.
  - You are about to drop the column `disk4` on the `DailyBackup` table. All the data in the column will be lost.
  - Added the required column `diskNumber` to the `DailyBackup` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BackupFileStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "DailyBackup" DROP COLUMN "disk1",
DROP COLUMN "disk2",
DROP COLUMN "disk3",
DROP COLUMN "disk4",
ADD COLUMN     "backupAdjuntosZip" "BackupFileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "backupZip" "BackupFileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "calipsoBak" "BackupFileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "diskNumber" INTEGER NOT NULL,
ADD COLUMN     "presupuestacionBak" "BackupFileStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "DailyBackup_diskNumber_idx" ON "DailyBackup"("diskNumber");
