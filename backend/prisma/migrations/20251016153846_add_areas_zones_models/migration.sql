-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "areaId" INTEGER,
ADD COLUMN     "zoneId" INTEGER;

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "managerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "areaId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Area_code_key" ON "Area"("code");

-- CreateIndex
CREATE INDEX "Area_name_idx" ON "Area"("name");

-- CreateIndex
CREATE INDEX "Area_managerId_idx" ON "Area"("managerId");

-- CreateIndex
CREATE INDEX "Area_status_idx" ON "Area"("status");

-- CreateIndex
CREATE INDEX "Zone_name_idx" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Zone_areaId_idx" ON "Zone"("areaId");

-- CreateIndex
CREATE INDEX "Zone_status_idx" ON "Zone"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_areaId_name_key" ON "Zone"("areaId", "name");

-- CreateIndex
CREATE INDEX "Employee_areaId_idx" ON "Employee"("areaId");

-- CreateIndex
CREATE INDEX "Employee_zoneId_idx" ON "Employee"("zoneId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
