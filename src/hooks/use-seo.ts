import { useEffect } from "react";

export const SITE_URL = "https://www.wardcheck.co.ke";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/wardcheck-logo.png`;

export type SeoOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  robots?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown>[];
};

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMetaTag(attr: "name" | "property", key: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el) el.remove();
}

function setLinkTag(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSON_LD_ID = "wardcheck-jsonld";

export const ORGANIZATION_SCHEMA: Record<string, unknown> = {
  "@type": "Organization",
  name: "WardCheck",
  url: SITE_URL,
  logo: `${SITE_URL}/wardcheck-logo.png`,
  description:
    "Kenya's healthcare workplace transparency platform. Search hospitals and read anonymous workplace reports.",
  sameAs: [],
};

export const WEBSITE_SCHEMA: Record<string, unknown> = {
  "@type": "WebSite",
  name: "WardCheck",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function createBreadcrumbSchema(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function useSeo({
  title,
  description,
  path,
  type = "website",
  robots = "index,follow",
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogTitle,
  ogDescription,
  keywords,
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", robots);

    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    } else {
      removeMetaTag("name", "keywords");
    }

    const canonical = canonicalUrl || `${SITE_URL}${path}`;
    setLinkTag("canonical", canonical);

    setMetaTag("property", "og:title", ogTitle ?? title);
    setMetaTag("property", "og:description", ogDescription ?? description);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:site_name", "WardCheck");
    setMetaTag("property", "og:locale", "en_KE");
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", ogTitle ?? title);
    setMetaTag("name", "twitter:description", ogDescription ?? description);
    setMetaTag("name", "twitter:image", ogImage);

    let jsonLdEl: HTMLScriptElement | null = null;
    if (jsonLd && jsonLd.length > 0) {
      const schemas =
        jsonLd.length === 1
          ? jsonLd[0]
          : { "@context": "https://schema.org", "@graph": jsonLd };
      jsonLdEl = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.id = JSON_LD_ID;
        jsonLdEl.type = "application/ld+json";
        document.head.appendChild(jsonLdEl);
      }
      jsonLdEl.textContent = JSON.stringify(schemas);
    }

    return () => {
      document.title = previousTitle;
      if (jsonLdEl) jsonLdEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    path,
    type,
    robots,
    canonicalUrl,
    ogImage,
    ogTitle,
    ogDescription,
    keywords,
    JSON.stringify(jsonLd),
  ]);
}
