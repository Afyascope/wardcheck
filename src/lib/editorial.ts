import type { CmsContentBase } from "@/types/cms";

/** Rank published items without recommending the item currently being viewed. */
export function getRelatedEditorial<T extends CmsContentBase>(
  current: CmsContentBase,
  candidates: T[],
  limit = 3,
): T[] {
  const currentTags = new Set((current.tags ?? []).map((tag) => tag.slug));

  return candidates
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate, index) => {
      const sameCategory =
        current.category?.slug && candidate.category?.slug === current.category.slug ? 100 : 0;
      const sharedTags = (candidate.tags ?? []).filter((tag) => currentTags.has(tag.slug)).length;
      const publishedAt = candidate.publishedAt ? new Date(candidate.publishedAt).getTime() : 0;
      return { candidate, score: sameCategory + sharedTags * 10 + publishedAt / 1e14, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
