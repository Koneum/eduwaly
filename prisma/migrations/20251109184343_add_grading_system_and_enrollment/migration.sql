-- CreateEnum
CREATE TYPE "CourseSchedule" AS ENUM ('DAY', 'EVENING');

-- CreateEnum
CREATE TYPE "GradingSystem" AS ENUM ('TRIMESTER', 'SEMESTER');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "gradingFormula" TEXT,
ADD COLUMN     "gradingSystem" "GradingSystem" NOT NULL DEFAULT 'SEMESTER';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "courseSchedule" "CourseSchedule" NOT NULL DEFAULT 'DAY',
ADD COLUMN     "enrollmentYear" INTEGER;

-- CreateTable
CREATE TABLE "grading_periods" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grading_periods_schoolId_idx" ON "grading_periods"("schoolId");

-- CreateIndex
CREATE INDEX "evaluation_types_schoolId_idx" ON "evaluation_types"("schoolId");

-- AddForeignKey
ALTER TABLE "grading_periods" ADD CONSTRAINT "grading_periods_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_types" ADD CONSTRAINT "evaluation_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
