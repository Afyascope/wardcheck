import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getFacilitiesDirectory, type FacilityDirectoryParams } from "@/api/public";
import type { PaginatedFacilityResponse } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<PaginatedFacilityResponse, Error, PaginatedFacilityResponse, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getFacilitiesDirectoryQueryKey(params: FacilityDirectoryParams) {
  return ["facilities-directory", params] as const;
}

export function useFacilitiesDirectory(
  params: FacilityDirectoryParams,
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getFacilitiesDirectoryQueryKey(params),
    queryFn: () => getFacilitiesDirectory(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}
