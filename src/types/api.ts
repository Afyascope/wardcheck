export const JobCategory = {
  Clinical_Officer: "Clinical Officer",
  Doctor: "Doctor",
  Nurse: "Nurse",
  Pharmacist: "Pharmacist",
  Lab_Technologist: "Lab Technologist",
  Radiographer: "Radiographer",
  Dentist: "Dentist",
  Nutritionist: "Nutritionist",
  Administrator: "Administrator",
  Other: "Other",
} as const;

export const ReportReason = {
  Delayed_salary: "Delayed salary",
  Salary_not_paid: "Salary not paid",
  Underpayment: "Underpayment",
  No_written_contract: "No written contract",
  Poor_management: "Poor management",
  Bullying: "Bullying",
  Long_working_hours: "Long working hours",
  Unsafe_working_conditions: "Unsafe working conditions",
  Unpaid_locum: "Unpaid locum",
  Inadequate_staffing: "Inadequate staffing",
  Other: "Other",
} as const;

export const ReportStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export const ReportSource = {
  public: "public",
  admin: "admin",
} as const;

export const AdminReportSourceType = {
  Historical: "Historical",
  Interview: "Interview",
  Survey: "Survey",
  Verified_Staff: "Verified Staff",
  Manual_Entry: "Manual Entry",
  Other: "Other",
} as const;

export type JobCategoryValue = (typeof JobCategory)[keyof typeof JobCategory];
export type ReportReasonValue =
  (typeof ReportReason)[keyof typeof ReportReason];
export type ReportStatusValue =
  (typeof ReportStatus)[keyof typeof ReportStatus];
export type ReportSourceValue =
  (typeof ReportSource)[keyof typeof ReportSource];
export type AdminReportSourceTypeValue =
  (typeof AdminReportSourceType)[keyof typeof AdminReportSourceType];

export interface HospitalSearchResult {
  id: number;
  slug: string;
  facilityName: string;
  county: string;
  ownership: string;
  level: string;
  reportsReceived: number;
}

export const FACILITY_SORT_VALUES = [
  "alphabetical",
  "most-reports",
  "newest",
  "recently-updated",
] as const;

export type FacilitySortValue = (typeof FACILITY_SORT_VALUES)[number];

export interface FacilityDirectoryItem {
  id: number;
  slug: string;
  facilityName: string;
  county: string;
  level: string;
  ownership: string;
  reportsReceived: number;
  mostCommonConcern?: string | null;
  lastUpdated?: string | null;
  createdAt: string;
}

export interface PaginatedFacilityResponse {
  items: FacilityDirectoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FacilityFilters {
  counties: string[];
  ownerships: string[];
  levels: string[];
}

export interface HospitalDetail extends HospitalSearchResult {
  subCounty?: string | null;
  ward?: string | null;
  registrationNumber?: string | null;
  kmpdcRegistrationNumber?: string | null;
  mostCommonConcern?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
}

export interface NationalStats {
  registeredFacilities: number;
  facilitiesWithReports: number;
  facilitiesWithZeroReports: number;
  totalReports: number;
  newestFacilitiesReported: Array<{
    id: number;
    slug: string;
    facilityName: string;
    county: string;
    level: string;
    reportsReceived: number;
  }>;
}

export interface CreateReportInput {
  hospitalId: number;
  jobCategory: JobCategoryValue;
  employmentYear: number;
  reason: ReportReasonValue;
  email?: string;
}

export interface BlogPostListItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featuredImageUrl?: string | null;
  publishedAt: string;
}

export interface BlogPostDetail extends BlogPostListItem {
  content: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  relatedArticles: Array<{
    id: number;
    slug: string;
    title: string;
    publishedAt: string;
  }>;
}

export interface AdminStats {
  totalFacilities: number;
  totalReports: number;
  reportsPending: number;
  approvedToday: number;
  adminReportsCreated: number;
  reportsEnteredToday: number;
  suspiciousReports?: number;
}

export interface Hospital extends HospitalDetail {}

export interface UpsertHospitalInput {
  facilityName: string;
  county: string;
  subCounty?: string;
  ward?: string;
  ownership: string;
  level: string;
  registrationNumber?: string;
  kmpdcRegistrationNumber?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminReportItem {
  id: number;
  submittedAt: string;
  facilityId: number;
  facilityName: string;
  county: string;
  reason: string;
  jobCategory: string;
  employmentYear: number;
  email?: string | null;
  status: ReportStatusValue;
  source: ReportSourceValue;
  reportDate?: string | null;
  sourceType?: string | null;
  internalNotes?: string | null;
  approvedAt?: string | null;
  approvedByName?: string | null;
  suspiciousSubmission?: boolean;
  suspiciousReason?: string | null;
  fingerprintHash?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

export interface CreateAdminReportInput {
  hospitalId: number;
  jobCategory: JobCategoryValue;
  employmentYear: number;
  reason: ReportReasonValue;
  email?: string;
  reportDate?: string;
  sourceType?: string;
  internalNotes?: string;
}

export interface AdminReportsAnalytics {
  adminReportsCreated: number;
  reportsEnteredToday: number;
  reportsPerAdmin: Array<{ adminId: number; adminName: string; count: number }>;
  reportsPerFacility: Array<{ facilityId: number; facilityName: string; count: number }>;
}

export interface ImportHospitalsResult {
  created: number;
  updated: number;
  duplicatesDetected: number;
  errors: string[];
}

export interface ImportHistoryItem {
  id: number;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  recordsFetched: number;
  imported: number;
  updated: number;
  duplicates: number;
  skipped: number;
  failed: number;
  status: string;
  trigger: string;
  triggeredById: number | null;
  scheduleName: string | null;
  retryOfHistoryId: number | null;
}

export interface ImportHistoryDetail extends ImportHistoryItem {
  errorMessage: string | null;
}

export interface ImportSummary {
  historyId: number;
  recordsFetched: number;
  imported: number;
  updated: number;
  duplicates: number;
  skipped: number;
  failed: number;
  status: string;
  trigger: string;
  triggeredById: number | null;
  scheduleName: string | null;
  retryOfHistoryId: number | null;
  duration: number | null;
}

export interface ImportHistoryErrorItem {
  id: number;
  historyId: number;
  stage: string;
  source: string | null;
  sourceRow: number | null;
  message: string;
  rawData: Record<string, unknown> | null;
  createdAt: string;
}
