import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
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

/**
 * Client-side SEO injection for the WardCheck SPA. There is no server-side
 * rendering in this stack, so title/meta/OG/canonical/JSON-LD are set
 * imperatively on mount — search engine crawlers that execute JS (Googlebot)
 * will still see the final tags.
 */
export function useSeo({ title, description, path, type = "website", jsonLd }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", type);

    const origin = window.location.origin;
    const canonicalUrl = `${origin}${path}`;
    setMetaTag("property", "og:url", canonicalUrl);
    setLinkTag("canonical", canonicalUrl);

    let jsonLdEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdEl = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.id = JSON_LD_ID;
        jsonLdEl.type = "application/ld+json";
        document.head.appendChild(jsonLdEl);
      }
      jsonLdEl.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      document.title = previousTitle;
      if (jsonLdEl) jsonLdEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, type, JSON.stringify(jsonLd)]);
}
