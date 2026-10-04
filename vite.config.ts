// SPDX-License-Identifier: AGPL-3.0-or-later
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { TEMPLATE } from "./src/template.ts";

const SITE_URL = "https://qrcode.quip.network/";

export default defineConfig({
  plugins: [
    {
      name: "static-page-seo",
      transformIndexHtml(html) {
        return html.replace('<div id="app"></div>', `<div id="app">${TEMPLATE}</div>`);
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}</loc></url>
</urlset>
`,
        });
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
        });
      },
    },
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
