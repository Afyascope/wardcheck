import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { searchHospitals } from "@/api/public";
import type { HospitalSearchResult } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<HospitalSearchResult[], Error, HospitalSearchResult[], QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useSearchHospitals(
  params: { q?: string; limit?: number },
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["search-hospitals", params.q ?? "", params.limit ?? null],
    queryFn: () => searchHospitals(params),
  });
}
