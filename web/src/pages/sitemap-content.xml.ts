import type { APIRoute } from "astro";
import { getCourses, getActivePromotions, getActiveWorkshops } from "../lib/pocketbase";

// @astrojs/sitemap only auto-discovers static-path routes. Course/promotion/
// workshop/blog detail pages are dynamic [slug] routes with `prerender = false`
// and no getStaticPaths, so they never make it into sitemap-index.xml. This
// endpoint queries PocketBase directly (same pattern as blog/index.astro for
// blog_posts, since there's no lib/pocketbase.ts helper for that collection)
// and emits a second, plain sitemap listing just those URLs. robots.txt lists
// both sitemaps.
export const prerender = false;

const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090"; // see note in lib/pocketbase.ts

async function getBlogSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/blog_posts/records?perPage=200&fields=slug`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((p: any) => p.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL("https://englishmania.co.th");

  const [courses, promotions, workshops, blogSlugs] = await Promise.all([
    getCourses().catch(() => []),
    getActivePromotions().catch(() => []),
    getActiveWorkshops().catch(() => []),
    getBlogSlugs(),
  ]);

  const paths = [
    ...courses.map((c) => `/course/${c.slug}`),
    ...promotions.map((p) => `/promotions/${p.slug}`),
    ...workshops.map((w) => `/workshops/${w.slug}`),
    ...blogSlugs.map((s) => `/blog/${s}`),
  ];

  const urls = paths
    .map((p) => `  <url><loc>${new URL(p, origin).toString()}</loc></url>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
