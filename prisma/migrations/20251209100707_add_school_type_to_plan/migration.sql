/*
  Warnings:

  - A unique constraint covering the columns `[schoolId]` on the table `pdf_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('REGULIER', 'PROFESSIONNEL', 'CL', 'PROFESSIONNEL_ETAT');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('RETARD', 'RETARD_NON_JUSTIFIE', 'OUBLI_MATERIEL', 'COMPORTEMENT', 'EXCLUSION', 'AUTRE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CONSEIL_CLASSE', 'REUNION_PARENTS', 'JOUR_FERIE', 'VACANCES', 'EXAMEN', 'EVENEMENT_SPORTIF', 'SORTIE_SCOLAIRE', 'CONFERENCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "enseignants" ADD COLUMN     "classId" TEXT,
ADD COLUMN     "isPrincipal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "schoolType" "SchoolType" NOT NULL DEFAULT 'UNIVERSITY';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "shortName" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "status" "StudentStatus";

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "jobTitle" TEXT;

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "description" TEXT,
    "moduleId" TEXT,
    "reportedById" TEXT NOT NULL,
    "notifiedParent" BOOLEAN NOT NULL DEFAULT false,
    "parentAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "parentAcknowledgedAt" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" "EventType" NOT NULL,
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "targetNiveaux" TEXT,
    "targetFilieres" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 15,
    "location" TEXT,
    "meetingUrl" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "notes" TEXT,
    "parentNotes" TEXT,
    "teacherNotes" TEXT,
    "schoolId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" TEXT NOT NULL,
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "targetNiveaux" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_responses" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_studentId_idx" ON "incidents"("studentId");

-- CreateIndex
CREATE INDEX "incidents_schoolId_idx" ON "incidents"("schoolId");

-- CreateIndex
CREATE INDEX "incidents_date_idx" ON "incidents"("date");

-- CreateIndex
CREATE INDEX "calendar_events_schoolId_idx" ON "calendar_events"("schoolId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_idx" ON "calendar_events"("startDate");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "appointments_parentId_idx" ON "appointments"("parentId");

-- CreateIndex
CREATE INDEX "appointments_enseignantId_idx" ON "appointments"("enseignantId");

-- CreateIndex
CREATE INDEX "appointments_studentId_idx" ON "appointments"("studentId");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "appointments_schoolId_idx" ON "appointments"("schoolId");

-- CreateIndex
CREATE INDEX "polls_schoolId_idx" ON "polls"("schoolId");

-- CreateIndex
CREATE INDEX "polls_isActive_idx" ON "polls"("isActive");

-- CreateIndex
CREATE INDEX "poll_options_pollId_idx" ON "poll_options"("pollId");

-- CreateIndex
CREATE INDEX "poll_responses_pollId_idx" ON "poll_responses"("pollId");

-- CreateIndex
CREATE INDEX "poll_responses_userId_idx" ON "poll_responses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_responses_pollId_userId_optionId_key" ON "poll_responses"("pollId", "userId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "pdf_templates_schoolId_key" ON "pdf_templates"("schoolId");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "enseignants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
