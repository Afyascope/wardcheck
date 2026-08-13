/**
 * Types for content returned by the standalone WardCheck Strapi CMS REST API.
 */

export interface CmsMediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  url: string;
  width: number;
  height: number;
  size: number;
  sizeInBytes: number;
}

export interface CmsMedia {
  id: number;
  documentId?: string;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number;
  height?: number;
  url: string;
  mime?: string;
  formats?: {
    thumbnail?: CmsMediaFormat;
    small?: CmsMediaFormat;
    medium?: CmsMediaFormat;
    large?: CmsMediaFormat;
    [key: string]: CmsMediaFormat | undefined;
  };
}

export interface CmsSeo {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: CmsMedia | null;
}

export interface CmsAuthor {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  bio?: string | null;
  role?: string | null;
  photo?: CmsMedia | null;
  socialLinks?: Array<{ label?: string | null; url?: string | null }> | null;
}

export interface CmsCategory {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CmsTag {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
}

/* ── Strapi Blocks ─────────────────────────────────────────────────────── */

export interface CmsTextNode {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  link?: { url: string };
}

export interface CmsLinkNode {
  type: "link";
  url: string;
  children: CmsInlineNode[];
}

export type CmsInlineNode = CmsTextNode | CmsLinkNode;

export interface CmsParagraphBlock {
  type: "paragraph";
  children: CmsInlineNode[];
}

export interface CmsHeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: CmsInlineNode[];
}

export interface CmsListItemBlock {
  type: "list-item";
  children: CmsInlineNode[];
}

export interface CmsListBlock {
  type: "list";
  format: "ordered" | "unordered";
  children: CmsListItemBlock[];
}

export interface CmsQuoteBlock {
  type: "quote";
  children: CmsInlineNode[];
}

export interface CmsCodeBlock {
  type: "code";
  children: CmsTextNode[];
}

export interface CmsImageBlock {
  type: "image";
  image: CmsMedia;
}

export type CmsBlock =
  | CmsParagraphBlock
  | CmsHeadingBlock
  | CmsListBlock
  | CmsQuoteBlock
  | CmsCodeBlock
  | CmsImageBlock;

/* ── Collection types ──────────────────────────────────────────────────── */

export interface CmsContentBase {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: CmsBlock[];
  featuredImage?: CmsMedia | null;
  author?: CmsAuthor | null;
  category?: CmsCategory | null;
  tags?: CmsTag[] | null;
  seo?: CmsSeo | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsArticle extends CmsContentBase {}

export interface CmsSalaryGuide extends CmsContentBase {
  profession?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  salaryNotes?: string | null;
}

export interface CmsCareerGuide extends CmsContentBase {}

export interface CmsWorkplaceGuide extends CmsContentBase {}

export type CmsGuide = CmsSalaryGuide | CmsCareerGuide | CmsWorkplaceGuide;

export type CmsGuideKind = "salary" | "career" | "workplace";

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: StrapiPagination };
}
