CREATE TYPE "ImportTriggerType" AS ENUM ('MANUAL', 'SCHEDULED', 'RETRY');

ALTER TABLE "import_history"
  ADD COLUMN "trigger" "ImportTriggerType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "triggered_by" INTEGER,
  ADD COLUMN "schedule_name" TEXT,
  ADD COLUMN "retry_of_history_id" INTEGER;

CREATE INDEX "import_history_trigger_idx" ON "import_history"("trigger");
CREATE INDEX "import_history_triggered_by_idx" ON "import_history"("triggered_by");
CREATE INDEX "import_history_retry_of_history_id_idx" ON "import_history"("retry_of_history_id");

ALTER TABLE "import_history"
  ADD CONSTRAINT "import_history_triggered_by_fkey"
  FOREIGN KEY ("triggered_by") REFERENCES "admins"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "import_history"
  ADD CONSTRAINT "import_history_retry_of_history_id_fkey"
  FOREIGN KEY ("retry_of_history_id") REFERENCES "import_history"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
