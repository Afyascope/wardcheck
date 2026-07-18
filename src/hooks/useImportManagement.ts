import { useMutation, useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import {
  getImportDetail,
  getImportErrors,
  getImportSummary,
  listImportHistory,
  retryKmpdcImport,
  startKmpdcSync,
} from "@/api/admin";
import type {
  ImportHistoryDetail,
  ImportHistoryErrorItem,
  ImportHistoryItem,
  ImportSummary,
  PaginatedResponse,
} from "@/types/api";

type QueryOverrides<T> = {
  query?: Omit<
    UseQueryOptions<T, Error, T, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useListImportHistory(
  params?: { page?: number; pageSize?: number },
  options?: QueryOverrides<PaginatedResponse<ImportHistoryItem>>,
) {
  const query = options?.query;
  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["import-history", params?.page ?? 1, params?.pageSize ?? 20],
    queryFn: () => listImportHistory(params),
  });
}

export function useGetImportDetail(id: number | null, options?: QueryOverrides<ImportHistoryDetail>) {
  const query = options?.query;
  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["import-detail", id],
    queryFn: () => getImportDetail(id!),
    enabled: id !== null && (options?.query?.enabled !== false),
  });
}

export function useGetImportErrors(
  id: number | null,
  params?: { page?: number; pageSize?: number },
  options?: QueryOverrides<PaginatedResponse<ImportHistoryErrorItem>>,
) {
  const query = options?.query;
  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["import-errors", id, params?.page ?? 1],
    queryFn: () => getImportErrors(id!, params),
    enabled: id !== null && (options?.query?.enabled !== false),
  });
}

export function useGetImportSummary(id: number | null, options?: QueryOverrides<ImportSummary>) {
  const query = options?.query;
  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["import-summary", id],
    queryFn: () => getImportSummary(id!),
    enabled: id !== null && (options?.query?.enabled !== false),
  });
}

export function useStartKmpdcSync() {
  return useMutation({
    mutationFn: () => startKmpdcSync(),
  });
}

export function useRetryKmpdcImport() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => retryKmpdcImport(id),
  });
}
