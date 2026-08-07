-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('PUBLIC', 'ADMIN');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN "source" "ReportSource" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "report_date" TIMESTAMP(3),
ADD COLUMN "source_type" TEXT,
ADD COLUMN "internal_notes" TEXT;

-- CreateIndex
CREATE INDEX "reports_source_idx" ON "reports"("source");
