import { useMutation, useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import {
  approveReport,
  createAdminReport,
  deleteAdminReport,
  getAdminReportsAnalytics,
  listAdminReports,
  rejectReport,
  updateAdminReport,
} from "@/api/admin";
import type {
  AdminReportItem,
  AdminReportsAnalytics,
  CreateAdminReportInput,
  PaginatedResponse,
  ReportSourceValue,
  ReportStatusValue,
} from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<
      PaginatedResponse<AdminReportItem>,
      Error,
      PaginatedResponse<AdminReportItem>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export type AdminReportListParams = {
  status?: ReportStatusValue;
  source?: ReportSourceValue;
  facility?: string;
  county?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export function useListAdminReports(
  params: AdminReportListParams,
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey:
      query?.queryKey ??
      [
        "admin-reports",
        params.status ?? "all",
        params.source ?? "all",
        params.facility ?? "",
        params.county ?? "",
        params.category ?? "",
        params.dateFrom ?? "",
        params.dateTo ?? "",
        params.page ?? 1,
        params.pageSize ?? 20,
      ],
    queryFn: () => listAdminReports(params),
  });
}

export function useApproveReport() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => approveReport(id),
  });
}

export function useRejectReport() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => rejectReport(id),
  });
}

export function useCreateAdminReport() {
  return useMutation({
    mutationFn: (data: CreateAdminReportInput) => createAdminReport(data),
  });
}

export function useUpdateAdminReport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateAdminReportInput }) =>
      updateAdminReport(id, data),
  });
}

export function useDeleteAdminReport() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteAdminReport(id),
  });
}

export function useGetAdminReportsAnalytics(options?: {
  query?: Omit<
    UseQueryOptions<
      AdminReportsAnalytics,
      Error,
      AdminReportsAnalytics,
      QueryKey
    >,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
}) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["admin-reports-analytics"],
    queryFn: getAdminReportsAnalytics,
  });
}
