-- CreateTable: BackupDisk
CREATE TABLE "BackupDisk" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupDisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackupStatus
CREATE TABLE "BackupStatus" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackupNotificationSetting
CREATE TABLE "BackupNotificationSetting" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sendHour" INTEGER,
    "sendMinute" INTEGER,
    "daysOfWeek" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BackupDisk_sequence_key" ON "BackupDisk"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "BackupStatus_code_key" ON "BackupStatus"("code");

-- CreateIndex
CREATE INDEX "BackupStatus_code_idx" ON "BackupStatus"("code");

-- CreateIndex
CREATE INDEX "BackupStatus_isActive_idx" ON "BackupStatus"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BackupNotificationSetting_code_key" ON "BackupNotificationSetting"("code");

-- AlterTable: Modify DailyBackup to use new relations
-- Drop enum columns and add foreign key columns
ALTER TABLE "DailyBackup" DROP COLUMN IF EXISTS "diskNumber";
ALTER TABLE "DailyBackup" DROP COLUMN IF EXISTS "backupZip";
ALTER TABLE "DailyBackup" DROP COLUMN IF EXISTS "backupAdjuntosZip";
ALTER TABLE "DailyBackup" DROP COLUMN IF EXISTS "calipsoBak";
ALTER TABLE "DailyBackup" DROP COLUMN IF EXISTS "presupuestacionBak";

-- Add columns only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DailyBackup' AND column_name='diskId') THEN
        ALTER TABLE "DailyBackup" ADD COLUMN "diskId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DailyBackup' AND column_name='backupZipStatusId') THEN
        ALTER TABLE "DailyBackup" ADD COLUMN "backupZipStatusId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DailyBackup' AND column_name='backupAdjuntosStatusId') THEN
        ALTER TABLE "DailyBackup" ADD COLUMN "backupAdjuntosStatusId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DailyBackup' AND column_name='calipsoStatusId') THEN
        ALTER TABLE "DailyBackup" ADD COLUMN "calipsoStatusId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DailyBackup' AND column_name='presupuestacionStatusId') THEN
        ALTER TABLE "DailyBackup" ADD COLUMN "presupuestacionStatusId" INTEGER;
    END IF;
END $$;

-- Create default data
-- Insert default statuses (only if they don't exist)
INSERT INTO "BackupStatus" ("code", "label", "description", "color", "sortOrder", "isFinal", "isActive", "createdAt", "updatedAt")
SELECT 'PENDING', 'Pendiente', 'Backup pendiente de iniciar', '#9ca3af', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupStatus" WHERE code = 'PENDING');

INSERT INTO "BackupStatus" ("code", "label", "description", "color", "sortOrder", "isFinal", "isActive", "createdAt", "updatedAt")
SELECT 'IN_PROGRESS', 'En proceso', 'Backup en progreso', '#fbbf24', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupStatus" WHERE code = 'IN_PROGRESS');

INSERT INTO "BackupStatus" ("code", "label", "description", "color", "sortOrder", "isFinal", "isActive", "createdAt", "updatedAt")
SELECT 'COMPLETED', 'Completado', 'Backup completado exitosamente', '#34d399', 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupStatus" WHERE code = 'COMPLETED');

-- Insert default disk (only if it doesn't exist)
INSERT INTO "BackupDisk" ("name", "sequence", "description", "color", "createdAt", "updatedAt")
SELECT 'Disco 1', 1, 'Primer disco de rotación', '#60a5fa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupDisk" WHERE sequence = 1);

-- Update existing DailyBackup records to use default disk and pending status
UPDATE "DailyBackup"
SET
  "diskId" = (SELECT "id" FROM "BackupDisk" WHERE "sequence" = 1 LIMIT 1),
  "backupZipStatusId" = (SELECT "id" FROM "BackupStatus" WHERE "code" = 'PENDING' LIMIT 1),
  "backupAdjuntosStatusId" = (SELECT "id" FROM "BackupStatus" WHERE "code" = 'PENDING' LIMIT 1),
  "calipsoStatusId" = (SELECT "id" FROM "BackupStatus" WHERE "code" = 'PENDING' LIMIT 1),
  "presupuestacionStatusId" = (SELECT "id" FROM "BackupStatus" WHERE "code" = 'PENDING' LIMIT 1)
WHERE "diskId" IS NULL;

-- Make foreign key columns NOT NULL
ALTER TABLE "DailyBackup" ALTER COLUMN "diskId" SET NOT NULL;
ALTER TABLE "DailyBackup" ALTER COLUMN "backupZipStatusId" SET NOT NULL;
ALTER TABLE "DailyBackup" ALTER COLUMN "backupAdjuntosStatusId" SET NOT NULL;
ALTER TABLE "DailyBackup" ALTER COLUMN "calipsoStatusId" SET NOT NULL;
ALTER TABLE "DailyBackup" ALTER COLUMN "presupuestacionStatusId" SET NOT NULL;

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyBackup_diskId_fkey') THEN
        ALTER TABLE "DailyBackup" ADD CONSTRAINT "DailyBackup_diskId_fkey"
            FOREIGN KEY ("diskId") REFERENCES "BackupDisk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyBackup_backupZipStatusId_fkey') THEN
        ALTER TABLE "DailyBackup" ADD CONSTRAINT "DailyBackup_backupZipStatusId_fkey"
            FOREIGN KEY ("backupZipStatusId") REFERENCES "BackupStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyBackup_backupAdjuntosStatusId_fkey') THEN
        ALTER TABLE "DailyBackup" ADD CONSTRAINT "DailyBackup_backupAdjuntosStatusId_fkey"
            FOREIGN KEY ("backupAdjuntosStatusId") REFERENCES "BackupStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyBackup_calipsoStatusId_fkey') THEN
        ALTER TABLE "DailyBackup" ADD CONSTRAINT "DailyBackup_calipsoStatusId_fkey"
            FOREIGN KEY ("calipsoStatusId") REFERENCES "BackupStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyBackup_presupuestacionStatusId_fkey') THEN
        ALTER TABLE "DailyBackup" ADD CONSTRAINT "DailyBackup_presupuestacionStatusId_fkey"
            FOREIGN KEY ("presupuestacionStatusId") REFERENCES "BackupStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "DailyBackup_diskId_idx" ON "DailyBackup"("diskId");

-- Insert default notification settings (only if they don't exist)
INSERT INTO "BackupNotificationSetting" ("code", "title", "message", "priority", "isEnabled", "sendHour", "sendMinute", "createdAt", "updatedAt")
SELECT 'RECORDATORIO_MATUTINO', 'Recordatorio: Backup Diario', 'Es hora de realizar el backup diario.', 'NORMAL', true, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupNotificationSetting" WHERE code = 'RECORDATORIO_MATUTINO');

INSERT INTO "BackupNotificationSetting" ("code", "title", "message", "priority", "isEnabled", "sendHour", "sendMinute", "createdAt", "updatedAt")
SELECT 'ALERTA_TARDE', 'Alerta: Backup Pendiente', 'El backup diario aún no se ha completado.', 'HIGH', true, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupNotificationSetting" WHERE code = 'ALERTA_TARDE');

INSERT INTO "BackupNotificationSetting" ("code", "title", "message", "priority", "isEnabled", "sendHour", "sendMinute", "createdAt", "updatedAt")
SELECT 'AVISO_COMPLETADO', 'Backup Completado', 'El backup diario se ha completado exitosamente.', 'NORMAL', true, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupNotificationSetting" WHERE code = 'AVISO_COMPLETADO');
