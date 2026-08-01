import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getFacilityFilters } from "@/api/public";
import type { FacilityFilters } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<FacilityFilters, Error, FacilityFilters, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getFacilityFiltersQueryKey() {
  return ["facility-filters"] as const;
}

export function useFacilityFilters(options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getFacilityFiltersQueryKey(),
    queryFn: getFacilityFilters,
    staleTime: 30 * 60 * 1000,
  });
}
