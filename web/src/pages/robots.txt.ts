import type { APIRoute } from "astro";

// Was a static `public/robots.txt` — converted to a dynamic endpoint
// 2026-08-20 when Siraphob decided to point DNS at a temporary
// `dev.englishmania.co.th` subdomain (Cloudflare Proxy, same VM) while the
// site is being finished, instead of cutting the real domain over early.
// A static robots.txt can't tell which host it's being served on, so it
// would have said "Allow: /" + advertised the real sitemaps on the dev
// subdomain too — letting it get crawled and indexed as duplicate content
// right alongside (or even instead of) the real domain once that goes live.
//
// This endpoint checks the ACTUAL request host against the production host
// from `astro.config.mjs`'s `site` (single source of truth — not hardcoded
// here) and serves a hard "Disallow: /" for anything else (dev subdomain,
// the bare VM IP, any future preview host). See BaseLayout.astro's matching
// per-page <meta name="robots"> logic — that's the per-page backstop, this
// is the crawler-level one (covers the whole site in one place, including
// any page that forgets to check).
export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? new URL(url.origin);
  const productionHost = origin.hostname;
  const isProductionHost =
    url.hostname === productionHost || url.hostname === `www.${productionHost}`;

  if (!isProductionHost) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", origin).toString()}`,
    `Sitemap: ${new URL("/sitemap-content.xml", origin).toString()}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
