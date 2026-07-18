-- CreateTable
CREATE TABLE "import_history_errors" (
    "id" SERIAL NOT NULL,
    "history_id" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "source" TEXT,
    "source_row" INTEGER,
    "message" TEXT NOT NULL,
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_history_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_history_errors_history_id_idx" ON "import_history_errors"("history_id");

-- CreateIndex
CREATE INDEX "import_history_errors_stage_idx" ON "import_history_errors"("stage");

-- CreateIndex
CREATE INDEX "import_history_errors_created_at_idx" ON "import_history_errors"("created_at");

-- AddForeignKey
ALTER TABLE "import_history_errors"
ADD CONSTRAINT "import_history_errors_history_id_fkey"
FOREIGN KEY ("history_id") REFERENCES "import_history"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
