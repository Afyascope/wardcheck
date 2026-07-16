import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getHospitalById } from "@/api/public";
import type { HospitalDetail } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<HospitalDetail, Error, HospitalDetail, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getGetHospitalQueryKey(id: number) {
  return ["hospital-by-id", id] as const;
}

export function useGetHospital(id: number | undefined, options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getGetHospitalQueryKey(id ?? 0),
    queryFn: () => getHospitalById(id as number),
  });
}
