import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

// `site` is required for absolute URLs: canonical <link>, Open Graph image/url,
// JSON-LD, and @astrojs/sitemap all depend on it. Production domain per CLAUDE.md.
export default defineConfig({
  site: "https://englishmania.co.th",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [sitemap()],
});
