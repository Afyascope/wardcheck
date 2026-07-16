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
  Contract_dispute: "Contract dispute",
  Poor_management: "Poor management",
  Bullying: "Bullying",
  Long_working_hours: "Long working hours",
  Unsafe_working_conditions: "Unsafe working conditions",
  Other: "Other",
} as const;

export const ReportStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type JobCategoryValue = (typeof JobCategory)[keyof typeof JobCategory];
export type ReportReasonValue =
  (typeof ReportReason)[keyof typeof ReportReason];
export type ReportStatusValue =
  (typeof ReportStatus)[keyof typeof ReportStatus];

export interface HospitalSearchResult {
  id: number;
  slug: string;
  facilityName: string;
  county: string;
  ownership: string;
  level: string;
  reportsReceived: number;
}

export interface HospitalDetail extends HospitalSearchResult {
  subCounty?: string | null;
  ward?: string | null;
  registrationNumber?: string | null;
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
  facilityName: string;
  county: string;
  reason: string;
  jobCategory: string;
  employmentYear: number;
  email?: string | null;
  status: ReportStatusValue;
  suspiciousSubmission?: boolean;
  suspiciousReason?: string | null;
  fingerprintHash?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

export interface ImportHospitalsResult {
  created: number;
  updated: number;
  duplicatesDetected: number;
  errors: string[];
}
