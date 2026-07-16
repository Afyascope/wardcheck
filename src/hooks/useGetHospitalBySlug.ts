import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getHospitalBySlug } from "@/api/public";
import type { HospitalDetail } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<HospitalDetail, Error, HospitalDetail, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getGetHospitalBySlugQueryKey(slug: string) {
  return ["hospital-by-slug", slug] as const;
}

export function useGetHospitalBySlug(slug: string, options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getGetHospitalBySlugQueryKey(slug),
    queryFn: () => getHospitalBySlug(slug),
  });
}
