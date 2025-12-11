-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "modulesIncluded" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "modulesOverride" TEXT;
