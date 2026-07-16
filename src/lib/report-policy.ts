export type ReportReviewStatus = "pending" | "approved" | "rejected";

export interface ReportRecord {
  facilityId: number;
  status: ReportReviewStatus;
  submittedAt: string | Date;
  fingerprintHash?: string | null;
  email?: string | null;
  ipHash?: string | null;
}

export interface ReportSubmissionSignals {
  facilityId: number;
  submittedAt: string | Date;
  fingerprintHash?: string | null;
  email?: string | null;
  ipHash?: string | null;
}

export interface ReportPolicyOptions {
  duplicateWindowMs?: number;
  rateLimitHourly?: number;
  rateLimitDaily?: number;
  suspiciousThreshold?: number;
}

export interface ReportPolicyEvaluation {
  isDuplicate: boolean;
  duplicateMatches: ReportRecord[];
  isRateLimited: boolean;
  hourlyCounts: {
    fingerprint: number;
    ip: number;
  };
  dailyCounts: {
    fingerprint: number;
    ip: number;
  };
  isSuspicious: boolean;
  suspiciousCounts: {
    fingerprint: number;
    ip: number;
  };
}

export const DEFAULT_DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const DEFAULT_RATE_LIMIT_HOURLY = 5;
export const DEFAULT_RATE_LIMIT_DAILY = 20;
export const DEFAULT_SUSPICIOUS_THRESHOLD = 3;

export function normalizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  return value ? value : null;
}

function toTimestamp(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function isReviewableStatus(status: ReportReviewStatus): boolean {
  return status === "pending" || status === "approved";
}

function isWithinWindow(submittedAt: string | Date, cutoffMs: number): boolean {
  return toTimestamp(submittedAt) >= cutoffMs;
}

function hasMatchingSignal(
  record: ReportRecord,
  submission: ReportSubmissionSignals,
  normalizedEmail: string | null,
): boolean {
  const fingerprintMatch =
    Boolean(submission.fingerprintHash) &&
    Boolean(record.fingerprintHash) &&
    record.fingerprintHash === submission.fingerprintHash;
  const emailMatch =
    Boolean(normalizedEmail) &&
    normalizeEmail(record.email) === normalizedEmail;
  const ipMatch =
    Boolean(submission.ipHash) &&
    Boolean(record.ipHash) &&
    record.ipHash === submission.ipHash;

  return fingerprintMatch || emailMatch || ipMatch;
}

function countMatchingReports(
  records: ReportRecord[],
  predicate: (record: ReportRecord) => boolean,
): number {
  return records.reduce((count, record) => count + (predicate(record) ? 1 : 0), 0);
}

function countSignalReports(
  records: ReportRecord[],
  submission: ReportSubmissionSignals,
  signal: "fingerprint" | "ip",
  cutoffMs: number,
): number {
  return countMatchingReports(records, (record) => {
    if (!isWithinWindow(record.submittedAt, cutoffMs)) {
      return false;
    }

    if (signal === "fingerprint") {
      return Boolean(submission.fingerprintHash) && record.fingerprintHash === submission.fingerprintHash;
    }

    return Boolean(submission.ipHash) && record.ipHash === submission.ipHash;
  });
}

export function evaluateReportSubmissionPolicy(
  records: ReportRecord[],
  submission: ReportSubmissionSignals,
  options: ReportPolicyOptions = {},
): ReportPolicyEvaluation {
  const now = toTimestamp(submission.submittedAt);
  const duplicateWindowMs = options.duplicateWindowMs ?? DEFAULT_DUPLICATE_WINDOW_MS;
  const rateLimitHourly = options.rateLimitHourly ?? DEFAULT_RATE_LIMIT_HOURLY;
  const rateLimitDaily = options.rateLimitDaily ?? DEFAULT_RATE_LIMIT_DAILY;
  const suspiciousThreshold = options.suspiciousThreshold ?? DEFAULT_SUSPICIOUS_THRESHOLD;

  const duplicateCutoff = now - duplicateWindowMs;
  const hourlyCutoff = now - 60 * 60 * 1000;
  const dailyCutoff = now - 24 * 60 * 60 * 1000;
  const normalizedEmail = normalizeEmail(submission.email);

  const duplicateMatches = records.filter((record) => {
    if (record.facilityId !== submission.facilityId) {
      return false;
    }
    if (!isReviewableStatus(record.status)) {
      return false;
    }
    if (!isWithinWindow(record.submittedAt, duplicateCutoff)) {
      return false;
    }
    return hasMatchingSignal(record, submission, normalizedEmail);
  });

  const hourlyFingerprintCount = countSignalReports(records, submission, "fingerprint", hourlyCutoff);
  const hourlyIpCount = countSignalReports(records, submission, "ip", hourlyCutoff);
  const dailyFingerprintCount = countSignalReports(records, submission, "fingerprint", dailyCutoff);
  const dailyIpCount = countSignalReports(records, submission, "ip", dailyCutoff);

  const isRateLimited =
    hourlyFingerprintCount >= rateLimitHourly ||
    hourlyIpCount >= rateLimitHourly ||
    dailyFingerprintCount >= rateLimitDaily ||
    dailyIpCount >= rateLimitDaily;

  const suspiciousFingerprintCount = countSignalReports(records, submission, "fingerprint", dailyCutoff);
  const suspiciousIpCount = countSignalReports(records, submission, "ip", dailyCutoff);

  return {
    isDuplicate: duplicateMatches.length > 0,
    duplicateMatches,
    isRateLimited,
    hourlyCounts: {
      fingerprint: hourlyFingerprintCount,
      ip: hourlyIpCount,
    },
    dailyCounts: {
      fingerprint: dailyFingerprintCount,
      ip: dailyIpCount,
    },
    isSuspicious:
      suspiciousFingerprintCount >= suspiciousThreshold ||
      suspiciousIpCount >= suspiciousThreshold,
    suspiciousCounts: {
      fingerprint: suspiciousFingerprintCount,
      ip: suspiciousIpCount,
    },
  };
}
