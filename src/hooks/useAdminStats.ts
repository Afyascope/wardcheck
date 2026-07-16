import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getAdminStats } from "@/api/admin";
import type { AdminStats } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<AdminStats, Error, AdminStats, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useGetAdminStats(options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["admin-stats"],
    queryFn: getAdminStats,
  });
}
