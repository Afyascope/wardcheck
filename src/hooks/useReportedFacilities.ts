import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getReportedFacilities } from "@/api/public";
import type { ReportedFacility } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<ReportedFacility[], Error, ReportedFacility[], QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getReportedFacilitiesQueryKey() {
  return ["reported-facilities"] as const;
}

export function useReportedFacilities(options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getReportedFacilitiesQueryKey(),
    queryFn: getReportedFacilities,
    staleTime: 5 * 60 * 1000,
  });
}
