import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { listBlogPosts } from "@/api/public";
import type { BlogPostListItem } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<BlogPostListItem[], Error, BlogPostListItem[], QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function useListBlogPosts(
  params: { category?: string; limit?: number },
  options?: QueryOverrides,
) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? ["blog-posts", params.category ?? "all", params.limit ?? null],
    queryFn: () => listBlogPosts(params),
  });
}
