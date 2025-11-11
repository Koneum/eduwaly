-- CreateTable
CREATE TABLE "receipt_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "headerText" TEXT,
    "footerText" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showStamp" BOOLEAN NOT NULL DEFAULT false,
    "stampUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipt_templates_schoolId_idx" ON "receipt_templates"("schoolId");

-- CreateIndex
CREATE INDEX "receipt_templates_schoolId_isActive_idx" ON "receipt_templates"("schoolId", "isActive");

-- AddForeignKey
ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
