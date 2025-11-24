-- CreateTable
CREATE TABLE "bulletins" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,
    "filiereId" TEXT,
    "gradingPeriodId" TEXT NOT NULL,
    "templateId" TEXT,
    "html" TEXT NOT NULL,
    "generalAverage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulletins_schoolId_idx" ON "bulletins"("schoolId");

-- CreateIndex
CREATE INDEX "bulletins_gradingPeriodId_idx" ON "bulletins"("gradingPeriodId");

-- CreateIndex
CREATE INDEX "bulletins_studentId_idx" ON "bulletins"("studentId");

-- CreateIndex
CREATE INDEX "bulletins_filiereId_idx" ON "bulletins"("filiereId");

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_gradingPeriodId_fkey" FOREIGN KEY ("gradingPeriodId") REFERENCES "grading_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "pdf_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
