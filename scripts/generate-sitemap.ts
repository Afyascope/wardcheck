/**
 * Generates a production-ready static sitemap.xml for the WardCheck SPA.
 *
 * Environment variables (read from .env file or shell):
 *   SITE_URL   – production site origin used in <loc> URLs (default: https://wardcheck.co.ke)
 *   API_ORIGIN – backend API origin used only for fetching facility data (default: http://localhost:3001)
 *
 * Usage:
 *   npm run generate-sitemap
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = (
  process.env.SITE_URL || "https://wardcheck.co.ke"
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

  const staticPages = ["/", "/search", "/about", "/privacy", "/terms", "/contact"];

  const urlEntries: string[] = [];

  for (const path of staticPages) {
    urlEntries.push(
      `  <url>\n    <loc>${escapeXml(SITE_URL + path)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
    );
  }

  for (const facility of facilities) {
    const lastmod = facility.updatedAt
      ? new Date(facility.updatedAt).toISOString().slice(0, 10)
      : today;
    urlEntries.push(
      `  <url>\n    <loc>${escapeXml(SITE_URL + "/facility/" + facility.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
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
