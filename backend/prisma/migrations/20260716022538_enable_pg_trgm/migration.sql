-- DropIndex
DROP INDEX "facilities_county_trgm_idx";

-- DropIndex
DROP INDEX "facilities_facility_name_trgm_idx";

-- DropIndex
DROP INDEX "facilities_registration_number_trgm_idx";

-- DropIndex
DROP INDEX "facilities_slug_trgm_idx";

-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "facilities" ALTER COLUMN "last_updated" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reports" ALTER COLUMN "submitted_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "reports_facility_email_idx" RENAME TO "reports_facility_id_email_idx";

-- RenameIndex
ALTER INDEX "reports_facility_fingerprint_idx" RENAME TO "reports_facility_id_fingerprint_hash_idx";
