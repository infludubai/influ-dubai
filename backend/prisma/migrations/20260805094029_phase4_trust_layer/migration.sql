-- CreateEnum
CREATE TYPE "ReviewDirection" AS ENUM ('BRAND_TO_CREATOR', 'CREATOR_TO_BRAND');

-- AlterTable
ALTER TABLE "brand_profiles" ADD COLUMN     "rating_avg" DOUBLE PRECISION,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "rating_avg" DOUBLE PRECISION,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "evidence_url" TEXT,
    "note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "decision_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "brand_profile_id" TEXT NOT NULL,
    "direction" "ReviewDirection" NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" TEXT NOT NULL,
    "brand_profile_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "list_name" TEXT NOT NULL DEFAULT 'Saved',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_requests_creator_profile_id_idx" ON "verification_requests"("creator_profile_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- CreateIndex
CREATE INDEX "reviews_creator_profile_id_idx" ON "reviews"("creator_profile_id");

-- CreateIndex
CREATE INDEX "reviews_brand_profile_id_idx" ON "reviews"("brand_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_campaign_id_direction_author_user_id_key" ON "reviews"("campaign_id", "direction", "author_user_id");

-- CreateIndex
CREATE INDEX "shortlists_brand_profile_id_idx" ON "shortlists"("brand_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_brand_profile_id_creator_profile_id_key" ON "shortlists"("brand_profile_id", "creator_profile_id");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
