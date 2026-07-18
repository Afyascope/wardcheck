const test = require('node:test');
const assert = require('node:assert/strict');

const { DuplicateDetectorService } = require('../../dist/etl/duplicate-detector.service.js');

test('duplicate detector merges matching facilities across datasets', () => {
  const service = new DuplicateDetectorService();

  const { mergedRecords, duplicatesMerged } = service.merge([
    {
      source: 'private',
      sourceRow: 1,
      facilityName: 'Ruai Family Hospital',
      registrationNumber: 'REG123',
      ownership: 'Private',
      county: 'Nairobi',
      subCounty: '',
      ward: '',
      facilityLevel: 'Level 4',
      facilityType: 'Hospital',
      location: null,
      status: 'Licensed',
      raw: {},
    },
    {
      source: 'public',
      sourceRow: 2,
      facilityName: 'Ruai Family Hospital',
      registrationNumber: 'reg123',
      ownership: 'Private',
      county: 'Nairobi',
      subCounty: '',
      ward: '',
      facilityLevel: 'Level 4',
      facilityType: 'Hospital',
      location: null,
      status: 'Licensed',
      raw: {},
    },
  ]);

  assert.equal(duplicatesMerged, 1);
  assert.equal(mergedRecords.length, 1);
  assert.equal(mergedRecords[0].registrationNumber, 'REG123');
});
