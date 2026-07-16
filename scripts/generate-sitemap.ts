/**
 * Generates a static sitemap.xml for the WardCheck SPA by querying public APIs.
 *
 * Usage: npm run generate-sitemap -- <site-origin> [api-origin]
 * Example: npm run generate-sitemap -- https://wardcheck.example.com https://api.wardcheck.example.com
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

type SlugItem = {
  slug: string;
  updatedAt?: string;
  publishedAt?: string;
};

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const siteOriginArg = args[0];
  const apiOriginArg = args[1] ?? siteOriginArg;

  if (!siteOriginArg) {
    console.error(
      "Usage: npm run generate-sitemap -- <site-origin> [api-origin]\n" +
        "Example: npm run generate-sitemap -- https://wardcheck.example.com https://api.wardcheck.example.com",
    );
    process.exit(1);
  }

  const siteOrigin = normalizeOrigin(siteOriginArg);
  const apiOrigin = normalizeOrigin(apiOriginArg);

  const hospitals = await fetchJson<SlugItem[]>(
    `${apiOrigin}/api/hospitals/search?limit=10000`,
  );
  const posts = await fetchJson<SlugItem[]>(`${apiOrigin}/api/blog?limit=10000`);

  const staticUrls = [
    "/",
    "/search",
    "/report",
    "/blog",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ];

  const urlEntries: string[] = [];

  for (const path of staticUrls) {
    urlEntries.push(`  <url>\n    <loc>${siteOrigin}${path}</loc>\n  </url>`);
  }

  for (const hospital of hospitals) {
    const lastmod = hospital.updatedAt
      ? `\n    <lastmod>${new Date(hospital.updatedAt).toISOString().slice(0, 10)}</lastmod>`
      : "";
    urlEntries.push(
      `  <url>\n    <loc>${siteOrigin}/facility/${hospital.slug}</loc>${lastmod}\n  </url>`,
    );
  }

  for (const post of posts) {
    const sourceDate = post.updatedAt ?? post.publishedAt;
    const lastmod = sourceDate
      ? `\n    <lastmod>${new Date(sourceDate).toISOString().slice(0, 10)}</lastmod>`
      : "";
    urlEntries.push(
      `  <url>\n    <loc>${siteOrigin}/blog/${post.slug}</loc>${lastmod}\n  </url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join("\n")}\n</urlset>\n`;

  const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");

  console.log(`Wrote ${urlEntries.length} URLs to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
