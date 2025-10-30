-- CreateEnum
CREATE TYPE "ThemeScope" AS ENUM ('GLOBAL', 'DASHBOARD', 'WIDGET');

-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK');

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "ThemeScope" NOT NULL,
    "scopeId" TEXT,
    "mode" "ThemeMode" NOT NULL DEFAULT 'DARK',
    "userId" INTEGER NOT NULL,
    "variables" JSONB NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Theme_userId_idx" ON "Theme"("userId");

-- CreateIndex
CREATE INDEX "Theme_scope_idx" ON "Theme"("scope");

-- CreateIndex
CREATE INDEX "Theme_scopeId_idx" ON "Theme"("scopeId");

-- CreateIndex
CREATE INDEX "Theme_mode_idx" ON "Theme"("mode");

-- CreateIndex
CREATE INDEX "Theme_parentId_idx" ON "Theme"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_userId_scope_scopeId_mode_key" ON "Theme"("userId", "scope", "scopeId", "mode");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Theme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
