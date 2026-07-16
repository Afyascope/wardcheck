import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getNationalStats } from "@/api/public";
import type { NationalStats } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<NationalStats, Error, NationalStats, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useGetNationalStats(options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["national-stats"],
    queryFn: getNationalStats,
  });
}
