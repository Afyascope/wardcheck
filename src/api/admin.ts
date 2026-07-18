import { apiRequest, buildApiUrl, buildAuthenticatedApiUrl } from "@/api/client";
import { getStoredToken } from "@/contexts/AuthContext";
import type {
  AdminReportItem,
  AdminStats,
  Hospital,
  ImportHospitalsResult,
  ImportHistoryItem,
  ImportHistoryDetail,
  ImportSummary,
  ImportHistoryErrorItem,
  PaginatedResponse,
  ReportStatusValue,
  UpsertHospitalInput,
} from "@/types/api";

export function getAdminStats() {
  return apiRequest<AdminStats>("/api/admin/stats", { auth: true });
}

export function listAdminHospitals(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<Hospital>>("/api/admin/hospitals", { params, auth: true });
}

export function createHospital(data: UpsertHospitalInput) {
  return apiRequest<Hospital>("/api/admin/hospitals", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function updateHospital(id: number, data: UpsertHospitalInput) {
  return apiRequest<Hospital>(`/api/admin/hospitals/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export function deleteHospital(id: number) {
  return apiRequest<void>(`/api/admin/hospitals/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function listAdminReports(params: {
  status?: ReportStatusValue;
  page?: number;
  pageSize?: number;
}) {
  return apiRequest<PaginatedResponse<AdminReportItem>>("/api/admin/reports", {
    params,
    auth: true,
  });
}

export function approveReport(id: number) {
  return apiRequest<void>(`/api/admin/reports/${id}/approve`, {
    method: "POST",
    auth: true,
  });
}

export function rejectReport(id: number) {
  return apiRequest<void>(`/api/admin/reports/${id}/reject`, {
    method: "POST",
    auth: true,
  });
}

export function importHospitals(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(buildApiUrl("/api/admin/hospitals/import"), {
    method: "POST",
    credentials: "same-origin",
    headers,
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
  return buildAuthenticatedApiUrl("/api/admin/reports/export");
}

const IMPORT_BASE = "/api/admin/import-management";

export function listImportHistory(params?: { page?: number; pageSize?: number }) {
  return apiRequest<PaginatedResponse<ImportHistoryItem>>(IMPORT_BASE, { params, auth: true });
}

export function getImportDetail(id: number) {
  return apiRequest<ImportHistoryDetail>(`${IMPORT_BASE}/${id}`, { auth: true });
}

export function getImportErrors(id: number, params?: { page?: number; pageSize?: number }) {
  return apiRequest<PaginatedResponse<ImportHistoryErrorItem>>(`${IMPORT_BASE}/${id}/errors`, { params, auth: true });
}

export function getImportSummary(id: number) {
  return apiRequest<ImportSummary>(`${IMPORT_BASE}/${id}/summary`, { auth: true });
}

export function startKmpdcSync() {
  return apiRequest<ImportHistoryDetail>(`${IMPORT_BASE}/sync`, {
    method: "POST",
    auth: true,
  });
}

export function retryKmpdcImport(id: number) {
  return apiRequest<ImportHistoryDetail>(`${IMPORT_BASE}/${id}/retry`, {
    method: "POST",
    auth: true,
  });
}
