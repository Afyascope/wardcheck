import { apiRequest, buildApiUrl } from "@/api/client";
import type {
  AdminReportItem,
  AdminStats,
  Hospital,
  ImportHospitalsResult,
  PaginatedResponse,
  ReportStatusValue,
  UpsertHospitalInput,
} from "@/types/api";

export function getAdminStats() {
  return apiRequest<AdminStats>("/api/admin/stats");
}

export function listAdminHospitals(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<Hospital>>("/api/admin/hospitals", { params });
}

export function createHospital(data: UpsertHospitalInput) {
  return apiRequest<Hospital>("/api/admin/hospitals", {
    method: "POST",
    body: data,
  });
}

export function updateHospital(id: number, data: UpsertHospitalInput) {
  return apiRequest<Hospital>(`/api/admin/hospitals/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteHospital(id: number) {
  return apiRequest<void>(`/api/admin/hospitals/${id}`, {
    method: "DELETE",
  });
}

export function listAdminReports(params: {
  status?: ReportStatusValue;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<AdminReportItem>>("/api/admin/reports", {
    params,
  });
}

export function approveReport(id: number) {
  return apiRequest<void>(`/api/admin/reports/${id}/approve`, {
    method: "POST",
  });
}

export function rejectReport(id: number) {
  return apiRequest<void>(`/api/admin/reports/${id}/reject`, {
    method: "POST",
  });
}

export function importHospitals(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(buildApiUrl("/api/admin/hospitals/import"), {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    return (await response.json()) as ImportHospitalsResult;
  });
}

export function getAdminReportsExportUrl() {
  return buildApiUrl("/api/admin/reports/export");
}
