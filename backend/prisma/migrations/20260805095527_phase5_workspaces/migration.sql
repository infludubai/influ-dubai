-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- DropIndex
DROP INDEX "brand_profiles_user_id_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_brand_profile_id" TEXT;

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "brand_profile_id" TEXT NOT NULL,
    "user_id" TEXT,
    "invited_email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_brand_profile_id_user_id_key" ON "workspace_members"("brand_profile_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_brand_profile_id_invited_email_key" ON "workspace_members"("brand_profile_id", "invited_email");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
