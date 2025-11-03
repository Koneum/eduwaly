-- AlterTable
ALTER TABLE "annees_universitaires" ADD COLUMN     "dateDebut" TIMESTAMP(3),
ADD COLUMN     "dateFin" TIMESTAMP(3),
ADD COLUMN     "estActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_upload_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customCategories" TEXT[],
    "customMaxSizes" JSONB,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_upload_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_upload_permissions_userId_idx" ON "user_upload_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_upload_permissions_grantedBy_idx" ON "user_upload_permissions"("grantedBy");

-- AddForeignKey
ALTER TABLE "user_upload_permissions" ADD CONSTRAINT "user_upload_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
