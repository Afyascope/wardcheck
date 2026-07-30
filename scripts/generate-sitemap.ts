import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = (
  process.env.SITE_URL || "https://www.wardcheck.co.ke"
).replace(/\/$/, "");

const API_ORIGIN = (
  process.env.API_ORIGIN || "http://localhost:3001"
).replace(/\/$/, "");

type FacilitySlugItem = {
  slug: string;
  updatedAt: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  console.log(`Site URL:   ${SITE_URL}`);
  console.log(`API Origin: ${API_ORIGIN}`);

  const today = new Date().toISOString().slice(0, 10);

  const facilities = await fetchJson<FacilitySlugItem[]>(
    `${API_ORIGIN}/api/sitemap/facilities`,
  );
  console.log(`Fetched ${facilities.length} facilities`);

  const urlEntries: string[] = [];

  // Homepage — priority 1.0, weekly
  urlEntries.push(
    `  <url>\n    <loc>${escapeXml(SITE_URL + "/")}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  );

  // Static pages — priority 0.7, monthly
  const staticPages = ["/about", "/privacy", "/terms", "/contact"];
  for (const path of staticPages) {
    urlEntries.push(
      `  <url>\n    <loc>${escapeXml(SITE_URL + path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    );
  }

  // Facility pages — priority 0.8, weekly
  for (const facility of facilities) {
    const lastmod = facility.updatedAt
      ? new Date(facility.updatedAt).toISOString().slice(0, 10)
      : today;
    urlEntries.push(
      `  <url>\n    <loc>${escapeXml(SITE_URL + "/facility/" + facility.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    "</urlset>",
    "",
  ].join("\n");

  const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");

  console.log(`Wrote ${urlEntries.length} URLs to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
