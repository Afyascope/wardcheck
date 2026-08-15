import type {
  CmsArticle,
  CmsCareerGuide,
  CmsCategory,
  CmsGuideKind,
  CmsMedia,
  CmsSalaryGuide,
  CmsTag,
  CmsWorkplaceGuide,
  StrapiListResponse,
} from "@/types/cms";

/**
 * Dedicated client for the standalone WardCheck Strapi CMS.
 *
 * The CMS is the source of editorial content only. These functions read *published*
 * content through the public Strapi REST API (find / findOne). No admin or API token
 * is ever embedded in client-side code.
 */
export class CmsError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CmsError";
    this.status = status;
  }
}

function resolveCmsBaseUrl(value: string | undefined): string {
  const rawValue = value
    ?.trim()
    .replace(/^VITE_WARDCHECK_CMS_URL\s*=\s*/i, "");

  if (!rawValue) {
    throw new Error(
      "VITE_WARDCHECK_CMS_URL is required and must be an absolute http:// or https:// URL.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new Error(
      `VITE_WARDCHECK_CMS_URL must be an absolute http:// or https:// URL. Received: ${rawValue}`,
    );
  }

  if (
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
    !parsedUrl.hostname ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      `VITE_WARDCHECK_CMS_URL must be an absolute http:// or https:// URL without a query or hash. Received: ${rawValue}`,
    );
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function getValidatedCmsBaseUrl(): string {
  try {
    return resolveCmsBaseUrl(import.meta.env.VITE_WARDCHECK_CMS_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CMS configuration.";
    if (import.meta.env.DEV) {
      console.error(`[WardCheck CMS] ${message}`);
    }
    throw new CmsError(0, message);
  }
}

export function getCmsBaseUrl(): string {
  return getValidatedCmsBaseUrl();
}

type CmsParams = Record<string, string | number | boolean | null | undefined>;

async function cmsRequest<T>(path: string, params: CmsParams = {}): Promise<T> {
  const url = new URL(`/api${path}`, `${getValidatedCmsBaseUrl()}/`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new CmsError(0, "The WardCheck content service is currently unavailable.");
  }

  if (!response.ok) {
    throw new CmsError(response.status, `Content request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

const CONTENT_POPULATE = "*";

function listParams(limit?: number): CmsParams {
  return {
    status: "published",
    populate: CONTENT_POPULATE,
    sort: "publishedAt:desc",
    "pagination[pageSize]": limit ?? 25,
  };
}

function bySlugParams(slug: string, limit?: number): CmsParams {
  return {
    status: "published",
    "filters[slug][$eq]": slug,
    populate: CONTENT_POPULATE,
    "pagination[pageSize]": limit ?? 1,
  };
}

/* ── Articles ──────────────────────────────────────────────────────────── */

export async function getArticles(params?: { limit?: number }): Promise<CmsArticle[]> {
  const response = await cmsRequest<StrapiListResponse<CmsArticle>>(
    "/articles",
    listParams(params?.limit),
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function getArticleBySlug(slug: string): Promise<CmsArticle | null> {
  const response = await cmsRequest<StrapiListResponse<CmsArticle>>(
    "/articles",
    bySlugParams(slug),
  );
  return response.data[0] ?? null;
}

/* ── Guides ────────────────────────────────────────────────────────────── */

const GUIDE_ENDPOINTS: Record<CmsGuideKind, string> = {
  salary: "/salary-guides",
  career: "/career-guides",
  workplace: "/workplace-guides",
};

export async function getSalaryGuides(params?: { limit?: number }): Promise<CmsSalaryGuide[]> {
  const response = await cmsRequest<StrapiListResponse<CmsSalaryGuide>>(
    GUIDE_ENDPOINTS.salary,
    listParams(params?.limit),
  );
  return response.data;
}

export async function getSalaryGuideBySlug(slug: string): Promise<CmsSalaryGuide | null> {
  const response = await cmsRequest<StrapiListResponse<CmsSalaryGuide>>(
    GUIDE_ENDPOINTS.salary,
    bySlugParams(slug),
  );
  return response.data[0] ?? null;
}

export async function getCareerGuides(params?: { limit?: number }): Promise<CmsCareerGuide[]> {
  const response = await cmsRequest<StrapiListResponse<CmsCareerGuide>>(
    GUIDE_ENDPOINTS.career,
    listParams(params?.limit),
  );
  return response.data;
}

export async function getCareerGuideBySlug(slug: string): Promise<CmsCareerGuide | null> {
  const response = await cmsRequest<StrapiListResponse<CmsCareerGuide>>(
    GUIDE_ENDPOINTS.career,
    bySlugParams(slug),
  );
  return response.data[0] ?? null;
}

export async function getWorkplaceGuides(params?: { limit?: number }): Promise<CmsWorkplaceGuide[]> {
  const response = await cmsRequest<StrapiListResponse<CmsWorkplaceGuide>>(
    GUIDE_ENDPOINTS.workplace,
    listParams(params?.limit),
  );
  return response.data;
}

export async function getWorkplaceGuideBySlug(slug: string): Promise<CmsWorkplaceGuide | null> {
  const response = await cmsRequest<StrapiListResponse<CmsWorkplaceGuide>>(
    GUIDE_ENDPOINTS.workplace,
    bySlugParams(slug),
  );
  return response.data[0] ?? null;
}

/* ── Taxonomy ──────────────────────────────────────────────────────────── */

export async function getCategories(): Promise<CmsCategory[]> {
  const response = await cmsRequest<StrapiListResponse<CmsCategory>>("/categories", {
    populate: CONTENT_POPULATE,
    sort: "name:asc",
  });
  return response.data;
}

export async function getTags(): Promise<CmsTag[]> {
  const response = await cmsRequest<StrapiListResponse<CmsTag>>("/tags", {
    populate: CONTENT_POPULATE,
    sort: "name:asc",
  });
  return response.data;
}

/* ── Media ─────────────────────────────────────────────────────────────── */

const CMS_MEDIA_FORMATS = ["thumbnail", "small", "medium", "large"] as const;
export type CmsMediaFormatName = (typeof CMS_MEDIA_FORMATS)[number];

/**
 * Resolves a Strapi media URL to an absolute, frontend-safe URL.
 *
 * Strapi can return relative URLs (`/uploads/...` with the local provider) or absolute
 * URLs (e.g. Cloudinary `https://res.cloudinary.com/...`). Relative URLs are prefixed
 * with the CMS base URL; absolute URLs are used as-is.
 */
export function getCmsImageUrl(
  media: CmsMedia | null | undefined,
  preferredFormat?: CmsMediaFormatName,
): string | null {
  if (!media?.url) return null;

  const format =
    preferredFormat && media.formats && media.formats[preferredFormat]
      ? media.formats[preferredFormat]
      : null;
  const url = format?.url ?? media.url;

  if (/^https?:\/\//i.test(url)) return url;
  return `${getValidatedCmsBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}
