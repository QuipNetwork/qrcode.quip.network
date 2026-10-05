// SPDX-License-Identifier: AGPL-3.0-or-later
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { APP_HTML } from "./src/template.tsx";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "classic",
      pragma: "h",
    },
  },
  plugins: [
    {
      name: "static-page-seo",
      transformIndexHtml(html) {
        return html.replace('<div id="app"></div>', APP_HTML);
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
