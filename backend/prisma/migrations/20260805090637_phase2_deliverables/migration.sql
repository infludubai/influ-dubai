-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" "SocialPlatform",
    "due_date" TIMESTAMP(3),
    "agreed_rate_usd" DOUBLE PRECISION,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_revisions" (
    "id" TEXT NOT NULL,
    "deliverable_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content_url" TEXT,
    "file_url" TEXT,
    "note" TEXT,
    "submitted_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "feedback" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "deliverable_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deliverables_campaign_id_idx" ON "deliverables"("campaign_id");

-- CreateIndex
CREATE INDEX "deliverables_creator_profile_id_idx" ON "deliverables"("creator_profile_id");

-- CreateIndex
CREATE INDEX "deliverables_status_idx" ON "deliverables"("status");

-- CreateIndex
CREATE INDEX "deliverable_revisions_deliverable_id_idx" ON "deliverable_revisions"("deliverable_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_revisions_deliverable_id_version_key" ON "deliverable_revisions"("deliverable_id", "version");

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_revisions" ADD CONSTRAINT "deliverable_revisions_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
