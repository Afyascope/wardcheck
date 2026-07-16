import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DUPLICATE_WINDOW_MS,
  evaluateReportSubmissionPolicy,
  normalizeEmail,
} from "./report-policy";

const baseTime = new Date("2026-07-16T10:00:00.000Z");
const oneHourAgo = new Date(baseTime.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(baseTime.getTime() - 2 * 60 * 60 * 1000);
const oneDayAgo = new Date(baseTime.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(baseTime.getTime() - 48 * 60 * 60 * 1000);

test("normalizeEmail trims and lowercases addresses", () => {
  assert.equal(normalizeEmail("  Example@Email.Com  "), "example@email.com");
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizeEmail(undefined), null);
});

test("blocks a duplicate report for the same facility and fingerprint", () => {
  const result = evaluateReportSubmissionPolicy(
    [
      {
        facilityId: 1,
        status: "approved",
        submittedAt: oneHourAgo,
        fingerprintHash: "fp-123",
        email: "other@example.com",
        ipHash: "ip-123",
      },
    ],
    {
      facilityId: 1,
      submittedAt: baseTime,
      fingerprintHash: "fp-123",
      email: "new@example.com",
      ipHash: "ip-999",
    },
    { duplicateWindowMs: DEFAULT_DUPLICATE_WINDOW_MS },
  );

  assert.equal(result.isDuplicate, true);
  assert.equal(result.duplicateMatches.length, 1);
  assert.equal(result.isRateLimited, false);
});

test("blocks a duplicate report for the same facility and email regardless of case", () => {
  const result = evaluateReportSubmissionPolicy(
    [
      {
        facilityId: 1,
        status: "pending",
        submittedAt: twoHoursAgo,
        fingerprintHash: "fp-abc",
        email: "User@Example.com",
        ipHash: "ip-abc",
      },
    ],
    {
      facilityId: 1,
      submittedAt: baseTime,
      fingerprintHash: "fp-xyz",
      email: "user@example.com",
      ipHash: "ip-xyz",
    },
  );

  assert.equal(result.isDuplicate, true);
});

test("blocks a duplicate report for the same facility and IP hash", () => {
  const result = evaluateReportSubmissionPolicy(
    [
      {
        facilityId: 7,
        status: "approved",
        submittedAt: twoHoursAgo,
        fingerprintHash: "fp-a",
        email: "alpha@example.com",
        ipHash: "ip-shared",
      },
    ],
    {
      facilityId: 7,
      submittedAt: baseTime,
      fingerprintHash: "fp-b",
      email: "beta@example.com",
      ipHash: "ip-shared",
    },
  );

  assert.equal(result.isDuplicate, true);
});

test("does not block reports for different facilities", () => {
  const result = evaluateReportSubmissionPolicy(
    [
      {
        facilityId: 1,
        status: "approved",
        submittedAt: oneHourAgo,
        fingerprintHash: "fp-123",
        email: "user@example.com",
        ipHash: "ip-123",
      },
    ],
    {
      facilityId: 2,
      submittedAt: baseTime,
      fingerprintHash: "fp-123",
      email: "user@example.com",
      ipHash: "ip-123",
    },
  );

  assert.equal(result.isDuplicate, false);
});

test("ignores rejected reports for duplicate detection", () => {
  const result = evaluateReportSubmissionPolicy(
    [
      {
        facilityId: 4,
        status: "rejected",
        submittedAt: oneHourAgo,
        fingerprintHash: "fp-1",
        email: "blocked@example.com",
        ipHash: "ip-1",
      },
    ],
    {
      facilityId: 4,
      submittedAt: baseTime,
      fingerprintHash: "fp-1",
      email: "blocked@example.com",
      ipHash: "ip-1",
    },
  );

  assert.equal(result.isDuplicate, false);
});

test("enforces hourly and daily rate limits per fingerprint or IP", () => {
  const records = [
    ...Array.from({ length: 5 }, (_, index) => ({
      facilityId: index + 1,
      status: "approved" as const,
      submittedAt: new Date(baseTime.getTime() - index * 10 * 60 * 1000),
      fingerprintHash: "fp-rate",
      email: `user${index}@example.com`,
      ipHash: "ip-rate",
    })),
    {
      facilityId: 99,
      status: "approved" as const,
      submittedAt: twoDaysAgo,
      fingerprintHash: "fp-rate",
      email: "old@example.com",
      ipHash: "ip-rate",
    },
  ];

  const result = evaluateReportSubmissionPolicy(records, {
    facilityId: 20,
    submittedAt: baseTime,
    fingerprintHash: "fp-rate",
    email: "fresh@example.com",
    ipHash: "ip-rate",
  });

  assert.equal(result.isRateLimited, true);
  assert.equal(result.hourlyCounts.fingerprint, 5);
  assert.equal(result.hourlyCounts.ip, 5);
  assert.equal(result.dailyCounts.fingerprint, 5);
  assert.equal(result.dailyCounts.ip, 5);
});

test("flags suspicious submission clusters without blocking them", () => {
  const records = [
    {
      facilityId: 1,
      status: "approved" as const,
      submittedAt: oneDayAgo,
      fingerprintHash: "fp-suspicious",
      email: "one@example.com",
      ipHash: "ip-suspicious",
    },
    {
      facilityId: 2,
      status: "pending" as const,
      submittedAt: twoHoursAgo,
      fingerprintHash: "fp-suspicious",
      email: "two@example.com",
      ipHash: "ip-suspicious",
    },
    {
      facilityId: 3,
      status: "approved" as const,
      submittedAt: oneHourAgo,
      fingerprintHash: "fp-suspicious",
      email: "three@example.com",
      ipHash: "ip-suspicious",
    },
  ];

  const result = evaluateReportSubmissionPolicy(records, {
    facilityId: 4,
    submittedAt: baseTime,
    fingerprintHash: "fp-suspicious",
    email: "fresh@example.com",
    ipHash: "ip-suspicious",
  });

  assert.equal(result.isSuspicious, true);
  assert.equal(result.isRateLimited, false);
  assert.equal(result.duplicateMatches.length, 0);
});
