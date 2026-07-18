const test = require('node:test');
const assert = require('node:assert/strict');

const { KmpdcClient } = require('../../dist/etl/kmpdc.client.js');

function createResponse({ contentType, body, ok = true, status = 200 }) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      },
    },
    async text() {
      return body;
    },
    async json() {
      return JSON.parse(body);
    },
  };
}

test('kmpdc client parses HTML tables with headers', async () => {
  const client = new KmpdcClient();
  const originalFetch = global.fetch;

  global.fetch = async () =>
    createResponse({
      contentType: 'text/html; charset=utf-8',
      body: `
        <html>
          <body>
            <table>
              <thead>
                <tr>
                  <th>Facility Name</th>
                  <th>Registration Number</th>
                  <th>Postal Address</th>
                  <th>Ownership</th>
                  <th>Facility Type</th>
                  <th>Facility Level</th>
                  <th>County</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ruai Family Hospital</td>
                  <td>REG-123</td>
                  <td>P.O. Box 1</td>
                  <td>Private</td>
                  <td>Hospital</td>
                  <td>Level 4</td>
                  <td>Nairobi</td>
                  <td>Licensed</td>
                </tr>
                <tr>
                  <td>Faith Hope Clinic</td>
                  <td>REG-456</td>
                  <td>P.O. Box 2</td>
                  <td>Faith Based</td>
                  <td>Clinic</td>
                  <td>Level 3A</td>
                  <td>Kisumu</td>
                  <td>Licensed</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `,
    });

  try {
    const records = await client.fetchFacilities('private');
    assert.equal(records.length, 2);
    assert.equal(records[0].facilityName, 'Ruai Family Hospital');
    assert.equal(records[0].registrationNumber, 'REG-123');
    assert.equal(records[0].county, 'Nairobi');
    assert.equal(records[0].facilityLevel, 'Level 4');
    assert.equal(records[1].facilityName, 'Faith Hope Clinic');
    assert.equal(records[1].ownership, 'Faith Based');
  } finally {
    global.fetch = originalFetch;
  }
});

test('kmpdc client parses JSON payloads when content type is json', async () => {
  const client = new KmpdcClient();
  const originalFetch = global.fetch;

  global.fetch = async () =>
    createResponse({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        data: [
          {
            facilityName: 'Nairobi Medical Centre',
            registrationNumber: 'REG-789',
            postalAddress: 'P.O. Box 3',
            ownership: 'Public',
            facilityType: 'Medical Centre',
            facilityLevel: 'Level 5',
            county: 'Nairobi',
            status: 'Licensed',
          },
        ],
      }),
    });

  try {
    const records = await client.fetchFacilities('public');
    assert.equal(records.length, 1);
    assert.equal(records[0].facilityName, 'Nairobi Medical Centre');
    assert.equal(records[0].registrationNumber, 'REG-789');
    assert.equal(records[0].ownership, 'Public');
    assert.equal(records[0].county, 'Nairobi');
  } finally {
    global.fetch = originalFetch;
  }
});
