-- AlterTable
ALTER TABLE "homework" ADD COLUMN     "assignmentType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "workGroupId" TEXT;

-- CreateTable
CREATE TABLE "work_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "moduleId" TEXT,
    "filiereId" TEXT,
    "createdBy" TEXT NOT NULL,
    "creatorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_groups_schoolId_idx" ON "work_groups"("schoolId");

-- CreateIndex
CREATE INDEX "work_groups_moduleId_idx" ON "work_groups"("moduleId");

-- CreateIndex
CREATE INDEX "work_groups_filiereId_idx" ON "work_groups"("filiereId");

-- CreateIndex
CREATE INDEX "work_group_members_groupId_idx" ON "work_group_members"("groupId");

-- CreateIndex
CREATE INDEX "work_group_members_studentId_idx" ON "work_group_members"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "work_group_members_groupId_studentId_key" ON "work_group_members"("groupId", "studentId");

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "work_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_groups" ADD CONSTRAINT "work_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_groups" ADD CONSTRAINT "work_groups_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_groups" ADD CONSTRAINT "work_groups_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "work_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
