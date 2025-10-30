-- CreateTable: BackupFileType
CREATE TABLE "BackupFileType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupFileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DailyBackupFile
CREATE TABLE "DailyBackupFile" (
    "id" SERIAL NOT NULL,
    "dailyBackupId" INTEGER NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBackupFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BackupFileType_code_key" ON "BackupFileType"("code");
CREATE UNIQUE INDEX "BackupFileType_sequence_key" ON "BackupFileType"("sequence");
CREATE INDEX "BackupFileType_code_idx" ON "BackupFileType"("code");
CREATE INDEX "BackupFileType_sequence_idx" ON "BackupFileType"("sequence");
CREATE INDEX "BackupFileType_isActive_idx" ON "BackupFileType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBackupFile_dailyBackupId_fileTypeId_key" ON "DailyBackupFile"("dailyBackupId", "fileTypeId");
CREATE INDEX "DailyBackupFile_dailyBackupId_idx" ON "DailyBackupFile"("dailyBackupId");
CREATE INDEX "DailyBackupFile_fileTypeId_idx" ON "DailyBackupFile"("fileTypeId");
CREATE INDEX "DailyBackupFile_statusId_idx" ON "DailyBackupFile"("statusId");

-- AddForeignKey
ALTER TABLE "DailyBackupFile" ADD CONSTRAINT "DailyBackupFile_dailyBackupId_fkey"
    FOREIGN KEY ("dailyBackupId") REFERENCES "DailyBackup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyBackupFile" ADD CONSTRAINT "DailyBackupFile_fileTypeId_fkey"
    FOREIGN KEY ("fileTypeId") REFERENCES "BackupFileType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DailyBackupFile" ADD CONSTRAINT "DailyBackupFile_statusId_fkey"
    FOREIGN KEY ("statusId") REFERENCES "BackupStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default file types (only if they don't exist)
INSERT INTO "BackupFileType" ("code", "name", "description", "sequence", "icon", "isActive", "createdAt", "updatedAt")
SELECT 'BACKUP_ZIP', 'Backup.zip', 'Archivo comprimido principal del backup del sistema', 1, 'Archive', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupFileType" WHERE code = 'BACKUP_ZIP');

INSERT INTO "BackupFileType" ("code", "name", "description", "sequence", "icon", "isActive", "createdAt", "updatedAt")
SELECT 'BACKUP_ADJUNTOS_ZIP', 'BackupAdjuntos.zip', 'Archivo comprimido de adjuntos y documentos', 2, 'Paperclip', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupFileType" WHERE code = 'BACKUP_ADJUNTOS_ZIP');

INSERT INTO "BackupFileType" ("code", "name", "description", "sequence", "icon", "isActive", "createdAt", "updatedAt")
SELECT 'CALIPSO_BAK', 'Calipso.bak', 'Backup de la base de datos Calipso', 3, 'Database', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupFileType" WHERE code = 'CALIPSO_BAK');

INSERT INTO "BackupFileType" ("code", "name", "description", "sequence", "icon", "isActive", "createdAt", "updatedAt")
SELECT 'PRESUPUESTACION_BAK', 'Presupuestacion.bak', 'Backup de la base de datos de Presupuestación', 4, 'DollarSign', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "BackupFileType" WHERE code = 'PRESUPUESTACION_BAK');

-- Migrate existing DailyBackup data to new structure
-- For each existing DailyBackup, create corresponding DailyBackupFile entries
INSERT INTO "DailyBackupFile" ("dailyBackupId", "fileTypeId", "statusId", "createdAt", "updatedAt")
SELECT
    db."id" as "dailyBackupId",
    ft."id" as "fileTypeId",
    CASE ft."code"
        WHEN 'BACKUP_ZIP' THEN db."backupZipStatusId"
        WHEN 'BACKUP_ADJUNTOS_ZIP' THEN db."backupAdjuntosStatusId"
        WHEN 'CALIPSO_BAK' THEN db."calipsoStatusId"
        WHEN 'PRESUPUESTACION_BAK' THEN db."presupuestacionStatusId"
    END as "statusId",
    db."createdAt",
    db."updatedAt"
FROM "DailyBackup" db
CROSS JOIN "BackupFileType" ft
WHERE ft."isActive" = true
  AND NOT EXISTS (
    SELECT 1 FROM "DailyBackupFile" dbf
    WHERE dbf."dailyBackupId" = db."id"
      AND dbf."fileTypeId" = ft."id"
  );
