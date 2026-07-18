-- CreateIndex
CREATE INDEX "facilities_facility_name_trgm_idx" ON "facilities" USING GIN ("facility_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "facilities_registration_number_trgm_idx" ON "facilities" USING GIN ("registration_number" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "facilities_county_trgm_idx" ON "facilities" USING GIN ("county" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "facilities_slug_trgm_idx" ON "facilities" USING GIN ("slug" gin_trgm_ops);

-- Composite index for admin facility listing sort order
CREATE INDEX "facilities_name_slug_idx" ON "facilities"("facility_name", "slug");
