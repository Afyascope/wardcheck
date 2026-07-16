import { apiRequest } from "@/api/client";
import type {
  BlogPostDetail,
  BlogPostListItem,
  CreateReportInput,
  HospitalDetail,
  HospitalSearchResult,
  NationalStats,
} from "@/types/api";

export function searchHospitals(params: { q?: string; limit?: number }) {
  return apiRequest<HospitalSearchResult[]>("/api/hospitals/search", { params });
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
