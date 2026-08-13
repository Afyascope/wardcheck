import { useQuery } from "@tanstack/react-query";
import {
  getArticleBySlug,
  getArticles,
  getCareerGuideBySlug,
  getCareerGuides,
  getCategories,
  getSalaryGuideBySlug,
  getSalaryGuides,
  getTags,
  getWorkplaceGuideBySlug,
  getWorkplaceGuides,
} from "@/lib/cms";
import type {
  CmsArticle,
  CmsCareerGuide,
  CmsCategory,
  CmsGuideKind,
  CmsSalaryGuide,
  CmsTag,
  CmsWorkplaceGuide,
} from "@/types/cms";

/**
 * CMS queries intentionally use a short retry and a longer stale time: the operational
 * WardCheck platform must never be blocked by an unavailable CMS.
 */
const CMS_QUERY_CONFIG = {
  retry: 1,
  staleTime: 5 * 60 * 1000,
} as const;

/* ── Articles ──────────────────────────────────────────────────────────── */

export const getCmsArticlesQueryKey = (limit: number) => ["cms", "articles", limit] as const;

export function useCmsArticles(limit = 12) {
  return useQuery({
    queryKey: getCmsArticlesQueryKey(limit),
    queryFn: () => getArticles({ limit }),
    ...CMS_QUERY_CONFIG,
  });
}

export const getCmsArticleBySlugQueryKey = (slug: string) => ["cms", "articles", "slug", slug] as const;

export function useCmsArticleBySlug(slug: string) {
  return useQuery({
    queryKey: getCmsArticleBySlugQueryKey(slug),
    queryFn: () => getArticleBySlug(slug),
    enabled: !!slug,
    ...CMS_QUERY_CONFIG,
  });
}

/* ── Guides ────────────────────────────────────────────────────────────── */

export const getCmsGuidesQueryKey = (kind: CmsGuideKind, limit: number) =>
  ["cms", "guides", kind, limit] as const;

export function useCmsGuides(kind: CmsGuideKind, limit = 12) {
  return useQuery({
    queryKey: getCmsGuidesQueryKey(kind, limit),
    queryFn: () => {
      switch (kind) {
        case "salary":
          return getSalaryGuides({ limit });
        case "career":
          return getCareerGuides({ limit });
        case "workplace":
          return getWorkplaceGuides({ limit });
      }
    },
    ...CMS_QUERY_CONFIG,
  });
}

export const getCmsGuideBySlugQueryKey = (kind: CmsGuideKind, slug: string) =>
  ["cms", "guides", kind, "slug", slug] as const;

export function useCmsGuideBySlug(kind: CmsGuideKind, slug: string) {
  return useQuery({
    queryKey: getCmsGuideBySlugQueryKey(kind, slug),
    queryFn: () => {
      switch (kind) {
        case "salary":
          return getSalaryGuideBySlug(slug);
        case "career":
          return getCareerGuideBySlug(slug);
        case "workplace":
          return getWorkplaceGuideBySlug(slug);
      }
    },
    enabled: !!slug,
    ...CMS_QUERY_CONFIG,
  });
}

/* ── Taxonomy ──────────────────────────────────────────────────────────── */

export const getCmsCategoriesQueryKey = () => ["cms", "categories"] as const;

export function useCmsCategories() {
  return useQuery({
    queryKey: getCmsCategoriesQueryKey(),
    queryFn: getCategories,
    ...CMS_QUERY_CONFIG,
  });
}

export const getCmsTagsQueryKey = () => ["cms", "tags"] as const;

export function useCmsTags() {
  return useQuery({
    queryKey: getCmsTagsQueryKey(),
    queryFn: getTags,
    ...CMS_QUERY_CONFIG,
  });
}

export type {
  CmsArticle,
  CmsSalaryGuide,
  CmsCareerGuide,
  CmsWorkplaceGuide,
  CmsCategory,
  CmsTag,
};
