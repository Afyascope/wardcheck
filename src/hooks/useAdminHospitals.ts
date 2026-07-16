import { useMutation, useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import {
  createHospital,
  deleteHospital,
  importHospitals,
  listAdminHospitals,
  updateHospital,
} from "@/api/admin";
import type {
  Hospital,
  ImportHospitalsResult,
  PaginatedResponse,
  UpsertHospitalInput,
} from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<
      PaginatedResponse<Hospital>,
      Error,
      PaginatedResponse<Hospital>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useListAdminHospitals(
  params: { q?: string; page?: number; pageSize?: number },
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["admin-hospitals", params.q ?? "", params.page ?? 1, params.pageSize ?? 20],
    queryFn: () => listAdminHospitals(params),
  });
}

export function useCreateHospital() {
  return useMutation({
    mutationFn: ({ data }: { data: UpsertHospitalInput }) => createHospital(data),
  });
}

export function useUpdateHospital() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpsertHospitalInput }) =>
      updateHospital(id, data),
  });
}

export function useDeleteHospital() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteHospital(id),
  });
}

export function useImportHospitals() {
  return useMutation({
    mutationFn: ({ file }: { file: File }) => importHospitals(file),
  });
}

export type { ImportHospitalsResult };
