-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "fraud_analyzed_at" TIMESTAMP(3),
ADD COLUMN     "fraud_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fraud_risk_level" TEXT,
ADD COLUMN     "fraud_risk_score" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "fraud_reports" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" TEXT NOT NULL,
    "flags" TEXT[],
    "engagement_anomaly" DOUBLE PRECISION,
    "follower_anomaly" DOUBLE PRECISION,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fraud_reports" ADD CONSTRAINT "fraud_reports_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
