import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getBlogPost } from "@/api/public";
import type { BlogPostDetail } from "@/types/api";

type QueryOverrides = {
  query?: Omit<
    UseQueryOptions<BlogPostDetail, Error, BlogPostDetail, QueryKey>,
    "queryFn" | "queryKey"
  > & { queryKey?: QueryKey };
};

export function getGetBlogPostQueryKey(slug: string) {
  return ["blog-post", slug] as const;
}

export function useGetBlogPost(slug: string, options?: QueryOverrides) {
  const query = options?.query;

  return useQuery({
    ...(query ?? {}),
    queryKey: query?.queryKey ?? getGetBlogPostQueryKey(slug),
    queryFn: () => getBlogPost(slug),
  });
}
