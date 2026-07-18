const test = require('node:test');
const assert = require('node:assert/strict');

const { FacilityImportService } = require('../../dist/etl/facility-import.service.js');
const { FacilityNormalizerService } = require('../../dist/etl/facility-normalizer.service.js');
const { DuplicateDetectorService } = require('../../dist/etl/duplicate-detector.service.js');
const { createInMemoryPrisma } = require('./test-helpers.js');

function createSlugGeneratorService() {
  return {
    generateUniqueSlug(baseValue, reservedSlugs) {
      const baseSlug = String(baseValue)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'facility';

      let candidate = baseSlug;
      let suffix = 2;
      while (reservedSlugs.has(candidate)) {
        candidate = `${baseSlug}-${suffix++}`;
      }
      reservedSlugs.add(candidate);
      return candidate;
    },
  };
}

function createWardcheckIdService() {
  return {
    async generateBatch(count) {
      return Array.from({ length: count }, (_, index) => `WC${String(index + 1).padStart(6, '0')}`);
    },
  };
}

function createService(prisma, kmpdcRows) {
  return new FacilityImportService(
    prisma,
    {
      async fetchAllFacilities() {
        return kmpdcRows;
      },
    },
    new FacilityNormalizerService(),
    new DuplicateDetectorService(),
    createSlugGeneratorService(),
    createWardcheckIdService(),
  );
}

test('facility import syncs cleanly on empty and populated databases', async () => {
  const emptyDb = createInMemoryPrisma();
  const emptyService = createService(emptyDb.prisma, [
    {
      source: 'private',
      sourceRow: 1,
      facilityName: ' Ruai Family Hospital ',
      registrationNumber: ' reg-123 ',
      postalAddress: 'P.O. Box 1',
      ownership: 'private',
      facilityType: 'hospital',
      facilityLevel: 'LEVEL 4',
      county: 'nairobi',
      status: 'licensed',
      raw: {},
    },
    {
      source: 'public',
      sourceRow: 2,
      facilityName: 'Ruai Family Hospital',
      registrationNumber: 'REG123',
      postalAddress: 'P.O. Box 1',
      ownership: 'PRIVATE',
      facilityType: 'Hospital',
      facilityLevel: 'Level 4',
      county: 'Nairobi',
      status: 'Licensed',
      raw: {},
    },
  ]);

  const emptyResult = await emptyService.syncLatest(1);
  const emptyFacilities = emptyDb.getFacilities();
  const emptyHistories = emptyDb.getHistories();

  assert.equal(emptyResult.status, 'completed');
  assert.equal(emptyResult.recordsFetched, 2);
  assert.equal(emptyResult.imported, 1);
  assert.equal(emptyResult.updated, 0);
  assert.equal(emptyResult.duplicates, 1);
  assert.equal(emptyResult.skipped, 0);
  assert.equal(emptyResult.failed, 0);
  assert.equal(emptyResult.trigger, 'manual');
  assert.equal(emptyResult.triggeredById, 1);
  assert.equal(emptyResult.retryOfHistoryId, null);
  assert.equal(emptyFacilities.length, 1);
  assert.equal(emptyFacilities[0].wardcheckId, 'WC000001');
  assert.equal(emptyFacilities[0].slug, 'ruai-family-hospital');
  assert.equal(emptyFacilities[0].reportsReceived, 0);
  assert.equal(emptyFacilities[0].primaryConcern, null);
  assert.equal(emptyFacilities[0].lastUpdated, null);
  assert.equal(emptyHistories.length, 1);
  assert.equal(emptyHistories[0].status, 'COMPLETED');

  const populatedDb = createInMemoryPrisma([
    {
      id: 1,
      wardcheckId: 'WC000001',
      slug: 'old-slug',
      facilityName: 'Old Ruai Family Hospital',
      registrationNumber: 'REG123',
      ownership: 'Private',
      county: 'Kiambu',
      subCounty: 'Embakasi North',
      ward: 'Ruai',
      facilityLevel: 'Level 3',
      facilityType: 'Clinic',
      reportsReceived: 7,
      primaryConcern: 'BULLYING',
      lastUpdated: new Date('2026-01-01T00:00:00Z'),
    },
  ]);

  const populatedService = createService(populatedDb.prisma, [
    {
      source: 'private',
      sourceRow: 1,
      facilityName: 'Ruai Family Hospital',
      registrationNumber: 'REG123',
      postalAddress: 'P.O. Box 1',
      ownership: 'private',
      facilityType: 'hospital',
      facilityLevel: 'LEVEL 4',
      county: 'nairobi',
      status: 'licensed',
      raw: {},
    },
  ]);

  const firstRun = await populatedService.syncLatest(1);
  const afterFirstRun = populatedDb.getFacilities();
  const secondRun = await populatedService.syncLatest(1);
  const afterSecondRun = populatedDb.getFacilities();

  assert.equal(firstRun.imported, 0);
  assert.equal(firstRun.updated, 1);
  assert.equal(firstRun.duplicates, 0);
  assert.equal(afterFirstRun.length, 1);
  assert.equal(afterFirstRun[0].reportsReceived, 7);
  assert.equal(afterFirstRun[0].facilityName, 'Ruai Family Hospital');
  assert.equal(afterFirstRun[0].county, 'Nairobi');
  assert.equal(afterFirstRun[0].facilityLevel, 'Level 4');
  assert.equal(afterFirstRun[0].facilityType, 'Hospital');
  assert.equal(afterFirstRun[0].registrationNumber, 'REG123');

  assert.equal(secondRun.imported, 0);
  assert.equal(secondRun.updated, 1);
  assert.equal(secondRun.trigger, 'manual');
  assert.equal(secondRun.triggeredById, 1);
  assert.equal(secondRun.retryOfHistoryId, null);
  assert.equal(afterSecondRun.length, 1);
  assert.equal(afterSecondRun[0].registrationNumber, 'REG123');
  assert.equal(afterSecondRun[0].reportsReceived, 7);
});

test('facility import records normalization errors without stopping the run', async () => {
  const db = createInMemoryPrisma();
  const service = createService(db.prisma, [
    {
      source: 'private',
      sourceRow: 1,
      facilityName: 'Good Hope Clinic',
      registrationNumber: 'REG-001',
      postalAddress: 'P.O. Box 4',
      ownership: 'private',
      facilityType: 'clinic',
      facilityLevel: 'LEVEL 3A',
      county: 'nairobi',
      status: 'licensed',
      raw: {},
    },
    {
      source: 'public',
      sourceRow: 2,
      facilityName: '   ',
      registrationNumber: 'REG-002',
      postalAddress: 'P.O. Box 5',
      ownership: 'public',
      facilityType: 'hospital',
      facilityLevel: 'LEVEL 4',
      county: 'nairobi',
      status: 'licensed',
      raw: {
        facilityName: '   ',
      },
    },
  ]);

  const result = await service.syncLatest(99);
  const errors = db.getImportHistoryErrors();
  const errorPage = await service.listErrors(result.id, { page: 1, pageSize: 20 });

  assert.equal(result.status, 'completed_with_errors');
  assert.equal(result.recordsFetched, 2);
  assert.equal(result.imported, 1);
  assert.equal(result.updated, 0);
  assert.equal(result.duplicates, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.failed, 0);
  assert.match(result.errorMessage ?? '', /NORMALIZATION/);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].historyId, result.id);
  assert.equal(errors[0].stage, 'NORMALIZATION');
  assert.equal(errors[0].sourceRow, 2);
  assert.equal(errorPage.total, 1);
  assert.equal(errorPage.items[0].stage, 'NORMALIZATION');
  assert.equal(errorPage.items[0].sourceRow, 2);
  assert.equal(errorPage.items[0].historyId, result.id);
});
