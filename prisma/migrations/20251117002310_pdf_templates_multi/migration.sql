/*
  Warnings:

  - Changed the type of `targetAudience` on the `announcements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `customCategories` on the `user_upload_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "targetAudience",
ADD COLUMN     "targetAudience" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_upload_permissions" DROP COLUMN "customCategories",
ADD COLUMN     "customCategories" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "comparison_rows" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_comparison_values" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "comparisonRowId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_comparison_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Bulletin standard',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "logoPosition" TEXT NOT NULL DEFAULT 'left',
    "headerColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "schoolNameSize" INTEGER NOT NULL DEFAULT 24,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "showPhone" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT true,
    "showStamp" BOOLEAN NOT NULL DEFAULT true,
    "gradeTableStyle" TEXT NOT NULL DEFAULT 'detailed',
    "footerText" TEXT NOT NULL DEFAULT 'Ce document est officiel et certifié conforme.',
    "showSignatures" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_comparison_values_planId_comparisonRowId_key" ON "plan_comparison_values"("planId", "comparisonRowId");

-- CreateIndex
CREATE INDEX "pdf_templates_schoolId_idx" ON "pdf_templates"("schoolId");

-- CreateIndex
CREATE INDEX "pdf_templates_schoolId_isActive_idx" ON "pdf_templates"("schoolId", "isActive");

-- AddForeignKey
ALTER TABLE "plan_comparison_values" ADD CONSTRAINT "plan_comparison_values_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_comparison_values" ADD CONSTRAINT "plan_comparison_values_comparisonRowId_fkey" FOREIGN KEY ("comparisonRowId") REFERENCES "comparison_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
