import { apiRequest } from "@/api/client";
import type {
  BlogPostDetail,
  BlogPostListItem,
  CreateReportInput,
  FacilityFilters,
  FacilitySortValue,
  HospitalDetail,
  HospitalSearchResult,
  NationalStats,
  PaginatedFacilityResponse,
} from "@/types/api";

export function searchHospitals(params: { q?: string; limit?: number }) {
  return apiRequest<HospitalSearchResult[]>("/api/hospitals/search", { params });
}

export type FacilityDirectoryParams = {
  filter?: "reported" | "no-reports";
  q?: string;
  county?: string;
  ownership?: string;
  level?: string;
  sort?: FacilitySortValue;
  page?: number;
  pageSize?: number;
};

export function getFacilitiesDirectory(params: FacilityDirectoryParams) {
  return apiRequest<PaginatedFacilityResponse>("/api/hospitals", { params });
}

export function getFacilityFilters() {
  return apiRequest<FacilityFilters>("/api/hospitals/filters");
}

export function getHospitalBySlug(slug: string) {
  return apiRequest<HospitalDetail>(`/api/hospitals/slug/${encodeURIComponent(slug)}`);
}

export function getHospitalById(id: number) {
  return apiRequest<HospitalDetail>(`/api/hospitals/${id}`);
}

export function getNationalStats() {
  return apiRequest<NationalStats>("/api/stats/national");
}

export function submitReport(
  data: CreateReportInput,
  options?: { fingerprintHash?: string },
) {
  return apiRequest<{ success: boolean }>("/api/reports", {
    method: "POST",
    body: data,
    headers: options?.fingerprintHash
      ? {
          "X-Report-Fingerprint-Hash": options.fingerprintHash,
        }
      : undefined,
  });
}

export function listBlogPosts(params: { category?: string; limit?: number }) {
  return apiRequest<BlogPostListItem[]>("/api/blog", { params });
}

export function getBlogPost(slug: string) {
  return apiRequest<BlogPostDetail>(`/api/blog/${encodeURIComponent(slug)}`);
}
