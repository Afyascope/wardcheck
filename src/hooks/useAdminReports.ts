import { useMutation, useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import {
  approveReport,
  listAdminReports,
  rejectReport,
} from "@/api/admin";
import type {
  AdminReportItem,
  PaginatedResponse,
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

export function useListAdminReports(
  params: { status?: ReportStatusValue; page?: number; pageSize?: number },
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["admin-reports", params.status ?? "all", params.page ?? 1, params.pageSize ?? 20],
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
